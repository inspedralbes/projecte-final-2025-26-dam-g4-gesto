<template>
  <div class="dataset-creator">
    <div v-if="!estaGravant" class="controls">
      <h3>Crear Dataset de Gestos</h3>
      <input v-model="nomGest" type="text" placeholder="Nom del gest (ex: dit_abaix_nas, polze_costat)" />
      <button @click="iniciarCaptura" :disabled="!nomGest">
        Gravar 200 fotos (Dreta i Esquerra)
      </button>
    </div>

    <div v-else-if="estaComprimint" class="recording">
      <h3>Creant l'arxiu ZIP...</h3>
      <p>Espera un moment, si us plau 📦</p>
    </div>

    <div v-else-if="estaEnPausa" class="recording pausa-container">
      <h3>Canvia de mà! ✋🔄🤚</h3>
      <p>La gravació es reprendrà en:</p>
      <div class="compte-enrere">{{ segonsRestants }}</div>
    </div>

    <div v-else class="recording">
      <h3>Gravant "{{ nomGest }}"...</h3>
      <p>Mou la mà lentament (canvia la distància i l'angle)</p>
      <p v-if="compteFotos < meitatFotos" class="ma-indicador">👉 Fent servir la <b>PRIMERA MÀ</b></p>
      <p v-else class="ma-indicador">👉 Fent servir la <b>SEGONA MÀ</b></p>
      
      <div class="progress-bar">
        <div class="progress" :style="{ width: (compteFotos / maxFotos) * 100 + '%' }"></div>
      </div>
      <p>{{ compteFotos }} / {{ maxFotos }} fotos</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import JSZip from 'jszip';

const props = defineProps({
  videoElement: {
    type: HTMLVideoElement,
    default: null
  }
});

// Variables d'estat reactives
const nomGest = ref('');
const estaGravant = ref(false);
const estaComprimint = ref(false); 
const estaEnPausa = ref(false);

const compteFotos = ref(0);
const maxFotos = 200; 
const meitatFotos = 100;
const tempsPausa = 5; // Segons de pausa
const segonsRestants = ref(0);

// Variables internes
let idInterval = null;
let zip = null;
let carpeta = null;
let sEstaAturant = false;

// Funció principal per començar
const iniciarCaptura = () => {
  const video = document.querySelector('video');

  if (!video) {
    alert("No s'ha trobat cap càmera a la pantalla!");
    return;
  }

  const canvasWidth = video.videoWidth || video.clientWidth || 640;
  const canvasHeight = video.videoHeight || video.clientHeight || 480;

  if (canvasWidth === 0 || canvasHeight === 0) {
    alert("Error: No es poden llegir les dimensions del vídeo.");
    return;
  }

  // Reiniciem totes les variables per a una gravació neta
  estaGravant.value = true;
  estaComprimint.value = false;
  estaEnPausa.value = false;
  sEstaAturant = false;
  compteFotos.value = 0;
  
  zip = new JSZip();
  carpeta = zip.folder(nomGest.value);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // Funció que farà la foto
  const capturarFotograma = () => {
    if (sEstaAturant) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (!blob) return;

      carpeta.file(`foto_${compteFotos.value}.jpg`, blob);
      compteFotos.value++;

      // Comprovem si hem arribat a la meitat per fer la pausa
      if (compteFotos.value === meitatFotos) {
        ferPausa();
      } 
      // Comprovem si hem acabat del tot
      else if (compteFotos.value >= maxFotos && !sEstaAturant) {
        sEstaAturant = true;
        aturarCaptura();
      }
    }, 'image/jpeg', 0.9);
  };

  // Funció per arrencar l'interval de fotos
  const iniciarBucleFotos = () => {
    idInterval = setInterval(capturarFotograma, 200);
  };

  // Funció per gestionar els 5 segons de pausa
  const ferPausa = () => {
    clearInterval(idInterval); // Parem les fotos
    estaEnPausa.value = true;
    segonsRestants.value = tempsPausa;

    const compteEnrereId = setInterval(() => {
      segonsRestants.value--;
      if (segonsRestants.value <= 0) {
        clearInterval(compteEnrereId);
        estaEnPausa.value = false;
        iniciarBucleFotos(); // Reprenem les fotos
      }
    }, 1000);
  };

  // Arrenquem la primera tanda de fotos
  iniciarBucleFotos();
};

// Funció per finalitzar i ENVIAR al servidor
const aturarCaptura = async () => {
  clearInterval(idInterval);
  estaComprimint.value = true; 
  
  try {
    // Generem el ZIP a la memòria del navegador (això es manté igual)
    const contingut = await zip.generateAsync({ type: "blob" });
    
    // Preparem el "paquet" (FormData) per enviar-lo per xarxa al teu backend
    const formData = new FormData();
    formData.append('file', contingut, `dataset_${nomGest.value}.zip`);
    formData.append('gesto', nomGest.value); // Li diem al backend com es diu el gest

    console.log("Enviant dades al servidor Node.js...");

    const resposta = await fetch('http://localhost:5000/api/upload-dataset', {
      method: 'POST',
      body: formData
    });

    if (resposta.ok) {
        alert(`Èxit! Les fotos de "${nomGest.value}" s'han enviat al backend i s'estan entrenant.`);
    } else {
        alert("Error del servidor en rebre les fotos.");
    }

    // Resetegem la interfície
    estaGravant.value = false;
    estaComprimint.value = false;
    nomGest.value = '';
    
  } catch (error) {
    console.error("Error en enviar el ZIP: ", error);
    alert("Hi ha hagut un error en enviar les dades. Assegura't que el servidor Node està en marxa.");
    estaGravant.value = false;
    estaComprimint.value = false;
  }
};
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

.controls input, .controls button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  box-sizing: border-box;
  color: white; 
  background-color: #333333; 
  border: 1px solid #555555; 
  border-radius: 5px; 
}

.controls input::placeholder {
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
  color: #FFD700; /* Groc atenció */
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
</style>

<style>
body {
  overflow: hidden !important;
  touch-action: none; /* Bloqueja gestos tàctils a mòbils/tauletes */
  height: 100vh;
}
</style>