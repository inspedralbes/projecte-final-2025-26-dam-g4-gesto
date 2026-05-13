<template>
  <div class="dataset-creator">
    <div v-if="!estaGravant && !estaPreparant" class="controls">
      <h3>Crear Dataset de Gestos</h3>
      <textarea v-model="textGestos" placeholder="Noms dels gestos separats per comes (ex: A, B, C)" rows="3" />
      <button :disabled="!textGestos.trim()" @click="iniciarCua">
        Gravar ({{ textGestos.split(',').filter(g => g.trim()).length }} gestos)
      </button>
    </div>

    <div v-else-if="estaPreparant" class="recording pausa-container">
      <h3>Preparat per al gest: "{{ nomGest }}"</h3>
      <p>Començant en:</p>
      <div class="compte-enrere">{{ segonsPreparacio }}</div>
    </div>

    <div v-else-if="estaGravant && !estaComprimint" class="recording">
      <h3>Gravant "{{ nomGest }}"...</h3>
      <p>Mou lleugerament les mans (canvia la distància i l'angle per donar més varietat)</p>

      <div class="progress-bar">
        <div class="progress" :style="{ width: (compteMostres / maxMostres) * 100 + '%' }" />
      </div>
      <p>{{ compteMostres }} / {{ maxMostres }} mostres capturades</p>
    </div>

    <div v-else-if="estaComprimint" class="recording spinner-mini">
      <LoadingSpinner />
      <h3>Processant dades...</h3>
      <p>Espera un moment, si us plau 📦</p>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import LoadingSpinner from './LoadingSpinner.vue'

  // AÑADIMOS LA VARIABLE 'usantIAv2'
  const props = defineProps({
    videoElement: {
      type: HTMLVideoElement,
      default: null,
    },
    usantIAv2: {
      type: Boolean,
      default: true,
    },
    handsData: {
      type: Array,
      default: () => [],
    },
  })

  const textGestos = ref('')
  const gestosPents = ref([])
  const nomGest = ref('')
  const estaGravant = ref(false)
  const estaComprimint = ref(false)
  const estaPreparant = ref(false)

  const compteMostres = ref(0)
  const maxMostres = 100 // Només 100 mostres, súper ràpid!
  const tempsPreparacio = 3
  const segonsPreparacio = ref(0)

  let idInterval = null
  let dadesRecollides = [] // Emmagatzema les coordenades
  let sEstaAturant = false

  function iniciarCua () {
    const gestos = textGestos.value.split(',').map(g => g.trim().toUpperCase()).filter(Boolean)
    if (gestos.length === 0) return

    gestosPents.value = gestos
    processarSeguentGest()
  }

  function processarSeguentGest () {
    if (gestosPents.value.length === 0) {
      textGestos.value = ''
      // alert final s'executa a l'aturar l'última captura
      return
    }

    nomGest.value = gestosPents.value.shift()
    estaPreparant.value = true
    segonsPreparacio.value = tempsPreparacio

    const idPreparacio = setInterval(() => {
      segonsPreparacio.value--
      if (segonsPreparacio.value <= 0) {
        clearInterval(idPreparacio)
        estaPreparant.value = false
        iniciarCapturaGest()
      }
    }, 1000)
  }

  function iniciarCapturaGest () {
    estaGravant.value = true
    estaComprimint.value = false
    sEstaAturant = false
    compteMostres.value = 0
    dadesRecollides = []

    const capturarFotograma = () => {
      if (sEstaAturant) return

      const mans = props.handsData
      if (!mans || mans.length === 0) return

      const coordenadesOriginals = []
      const coordenadesMirrored = []

      // Primera mà (sempre n'hi haurà almenys una per arribar aquí)
      if (mans.length > 0) {
        for (let i = 0; i < mans[0].length; i++) {
          coordenadesOriginals.push(mans[0][i].x, mans[0][i].y, mans[0][i].z)
          coordenadesMirrored.push(1 - mans[0][i].x, mans[0][i].y, mans[0][i].z)
        }
      } else {
        for (let i = 0; i < 63; i++) {
          coordenadesOriginals.push(0)
          coordenadesMirrored.push(0)
        }
      }

      // Segona mà
      if (mans.length > 1) {
        for (let i = 0; i < mans[1].length; i++) {
          coordenadesOriginals.push(mans[1][i].x, mans[1][i].y, mans[1][i].z)
          coordenadesMirrored.push(1 - mans[1][i].x, mans[1][i].y, mans[1][i].z)
        }
      } else {
        for (let i = 0; i < 63; i++) {
          coordenadesOriginals.push(0)
          coordenadesMirrored.push(0)
        }
      }

      dadesRecollides.push({
        label: nomGest.value,
        landmarks: coordenadesOriginals,
      }, {
        label: nomGest.value,
        landmarks: coordenadesMirrored,
      })

      processarMostraFeta()
    }

    const processarMostraFeta = () => {
      compteMostres.value++
      if (compteMostres.value >= maxMostres && !sEstaAturant) {
        sEstaAturant = true
        aturarCaptura()
      }
    }

    const iniciarBucleFotos = () => {
      idInterval = setInterval(capturarFotograma, 100)
    }

    iniciarBucleFotos()
  }

  async function aturarCaptura () {
    clearInterval(idInterval)
    estaComprimint.value = true

    try {
      const dadesJSON = JSON.stringify(dadesRecollides)
      const jsonBlob = new Blob([dadesJSON], { type: 'application/json' })

      if (props.usantIAv2) {
        const formData = new FormData()
        formData.append('file', jsonBlob, `dataset_${nomGest.value}.json`)
        formData.append('gesto', nomGest.value)

        const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-dataset`, {
          method: 'POST',
          body: formData,
        })

        if (!resposta.ok) {
          throw new Error(`Error del servidor: ${resposta.status}`)
        }

        const resultat = await resposta.json()
        console.log('Resposta del servidor:', resultat)

        // SI LA V1 (ORIGINAL) ESTÁ ACTIVA -> DESCARGAR EN EL PC EL JSON
      } else {
        const enllac = document.createElement('a')
        const url = URL.createObjectURL(jsonBlob)

        enllac.href = url
        enllac.download = `${nomGest.value}.json`

        document.body.append(enllac)
        enllac.click()
        enllac.remove()

        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch (error) {
      console.error('Error gestionant el JSON:', error)
      alert('Hi ha hagut un error processant les dades. Obre la consola per veure més detalls.')
    } finally {
      estaGravant.value = false
      estaComprimint.value = false

      if (gestosPents.value.length > 0) {
        setTimeout(() => {
          processarSeguentGest()
        }, 1500) // Petita pausa abans del següent gest
      } else {
        nomGest.value = ''
        textGestos.value = ''
        alert('Tots els gestos s\'han gravat i processat correctament!')
      }
    }
  }
</script>

<style scoped>
.dataset-creator {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 10px;
  z-index: 100;
  width: 300px;
  text-align: center;
}

.controls input, .controls textarea, .controls button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  box-sizing: border-box;
  color: white;
  background-color: #333333;
  border: 1px solid #555555;
  border-radius: 5px;
  font-family: inherit;
  resize: vertical;
}

.controls input::placeholder, .controls textarea::placeholder {
  color: #aaaaaa;
}

.controls button {
  background: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.recording h3 {
  color: #ff4444;
  animation: parpelleig 1s infinite;
}

.ma-indicador {
  color: #FFD700;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #333;
  border-radius: 10px;
  overflow: hidden;
  margin: 10px 0;
}

.progress {
  height: 100%;
  background: #4CAF50;
  transition: width 0.2s;
}

.pausa-container h3 {
  color: #FFD700;
  animation: none;
}

.compte-enrere {
  font-size: 48px;
  font-weight: bold;
  color: #ffffff;
  margin: 10px 0;
}

@keyframes parpelleig {
  50% { opacity: 0.5; }
}

.spinner-mini :deep(.wheel-and-hamster) {
  font-size: 8px; /* Fem el hàmster més petit pel panell lateral */
  margin: 0 auto 10px auto;
}
</style>

<style>
body {
  overflow: hidden !important;
  touch-action: none;
  height: 100vh;
}
</style>
