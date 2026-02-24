<template>
  <div class="learning-view">
    
    <template v-if="nivelActivo === null">
      <div class="learning-header">
        <button class="btn-close" @click="tornarAInici">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Sortir
        </button>
        <div class="progress-bar-container">
          <div class="progress-bar-fill global-progress" :style="{ width: porcentajeGlobal + '%' }"></div>
        </div>
      </div>

      <div class="path-section container">
        <div class="path-header">
          <h1>La teva Ruta</h1>
          <p>Avança pel camí per dominar la llengua de signes.</p>
        </div>

        <div class="timeline-container">
          <div 
            v-for="(nivel, index) in niveles" 
            :key="nivel.id"
            class="timeline-node-wrapper"
            :class="'stagger-' + (index % 2)"
          >
            <svg 
              v-if="index < niveles.length - 1" 
              class="path-connector" 
              :class="{'active-path': nivel.id < nivelDesbloqueado}"
              width="100" height="170" viewBox="0 0 100 170"
            >
              <path d="M 0,0 C 0,85 100,85 100,170" fill="none" stroke-width="4" stroke-dasharray="10 10" />
            </svg>

            <div v-if="nivel.id === nivelDesbloqueado" class="current-label">
              NIVELL ACTUAL
            </div>

            <button
              class="timeline-node"
              :class="{ 
                'locked': nivel.id > nivelDesbloqueado, 
                'current': nivel.id === nivelDesbloqueado,
                'completed': nivel.id < nivelDesbloqueado 
              }"
              @click="intentarEntrarNivel(nivel)"
            >
              <svg v-if="nivel.id < nivelDesbloqueado" viewBox="0 0 24 24" class="node-icon">
                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="nivel.id === nivelDesbloqueado" viewBox="0 0 24 24" class="node-icon play-icon">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" class="node-icon padlock">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" fill="none" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            
            <div class="node-info">
              <h3>{{ nivel.titol }}</h3>
              <span class="lesson-count">{{ nivel.llicons.length }} lliçons</span>
            </div>
          </div>
        </div>
      </div>
    </template>


    <template v-else>
      <div class="learning-header">
        <button class="btn-close" @click="sortirDeLlico">✕</button>
        <div class="progress-bar-container">
          <div class="progress-bar-fill lesson-progress" :style="{ width: porcentajeLlico + '%' }"></div>
        </div>
      </div>

      <div class="learning-content container">
        <h2 class="lesson-title">{{ llicoActualData.titol }}</h2>
        <p class="lesson-instruction">{{ llicoActualData.instruccio }}</p>
        
        <div class="lesson-layout">
          <div class="sign-display">
            <video 
              v-if="llicoActualData.esVideo"
              :src="llicoActualData.arxiu" 
              class="sign-media"
              autoplay loop muted playsinline>
            </video>
            <img 
              v-else
              :src="llicoActualData.arxiu" 
              alt="Gest a aprendre" 
              class="sign-media"
              :class="{ 'invert-img': !llicoActualData.esVideo }">
          </div>

          <div ref="exerciseArea" class="exercise-area">
            <video 
              ref="webcam" 
              class="webcam-video" 
              autoplay 
              playsinline 
              muted 
              :style="exerciseAreaStyle"
              :class="{ 'hidden': !cameraReady, 'espejo': true }">
            </video>
            <DrawSkeleton v-if="cameraReady" :handsData="hands" :esFrontal="true" :style="exerciseAreaStyle" />
            <div v-if="!cameraReady" class="camera-placeholder">
              <svg viewBox="0 0 24 24" class="camera-icon" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>Esperant la càmera...</span>
            </div>
          </div>
        </div>
      </div>

      <div class="learning-footer">
        <div class="container footer-content">
          <button 
            class="btn-primary" 
            @click="comprovarGesto">
            {{ pasoActual < totalPasosLlico ? 'COMPROVAR I CONTINUAR' : 'FINALITZAR NIVELL' }}
          </button>
        </div>
      </div>
    </template>

  </div>
</template>

<script>
import videoHola from '../assets/videos/hola.mp4';
import DrawSkeleton from '../components/DrawSkeleton.vue';
import { GestureService } from '../services/GestureService'; // Importa el servei

export default {
  name: 'AprendrePage',
  components: {
    DrawSkeleton
  },
  data() {
    return {
      nivelActivo: null, 
      pasoActual: 1,
      nivelDesbloqueado: 1, 

      // Dades per al reconeixement de gestos
      gestureService: null,
      videoElement: null,
      hands: [], // Contindrà les dades de les mans detectades
      currentSign: '', // El gest actual detectat
      cameraReady: false,
      stream: null, // Per guardar el MediaStream de la càmera
      lastVideoTime: -1, // Últim temps del vídeo processat
      exerciseAreaStyle: {},
      
      niveles: [
        {
          id: 1,
          titol: "Bàsic",
          llicons: [
            { titol: "Saludar", instruccio: "Repeteix el moviment del vídeo per saludar.", gestEsperat: "Hola", arxiu: videoHola, esVideo: true },
            { titol: "Comiat", instruccio: "Fes aquest gest per acomiadar-te.", gestEsperat: "Adeu", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false }
          ]
        },
        {
          id: 2,
          titol: "Mitjà",
          llicons: [
            { titol: "Si us plau", instruccio: "Ajunta les mans al pit.", gestEsperat: "Si us plau", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Sign_language_C.svg/400px-Sign_language_C.svg.png", esVideo: false },
            { titol: "Gràcies", instruccio: "Porta la mà de la barbeta cap endavant.", gestEsperat: "Gràcies", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Sign_language_A.svg/400px-Sign_language_A.svg.png", esVideo: false }
          ]
        },
        {
          id: 3,
          titol: "Alt",
          llicons: [
            { titol: "Mare", instruccio: "Toca't la barbeta amb el polze per dir 'Mare'.", gestEsperat: "Mare", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false }
          ]
        }
      ]
    }
  },
  computed: {
    porcentajeGlobal() {
      const nivelesCompletados = this.nivelDesbloqueado - 1;
      return (nivelesCompletados / this.niveles.length) * 100;
    },
    llicoActualData() {
      if (!this.nivelActivo) return null;
      const nivel = this.niveles.find(n => n.id === this.nivelActivo);
      return nivel.llicons[this.pasoActual - 1];
    },
    totalPasosLlico() {
      if (!this.nivelActivo) return 0;
      return this.niveles.find(n => n.id === this.nivelActivo).llicons.length;
    },
    porcentajeLlico() {
      // Cálculo del porcentaje de la lección para la barra de progreso.
      // Se suma 1 para que la barra no empiece en 0% en la primera lección
      // y se divide entre totalPasosLlico para normalizar.
      // Se añade Math.min(100, ...) para asegurar que no exceda el 100%.
      return Math.min(100, ((this.pasoActual - 1) / this.totalPasosLlico) * 100 + (100 / this.totalPasosLlico));
    }
  },
  mounted() {
    const progresoGuardado = localStorage.getItem('gesto_nivel_desbloqueado');
    if (progresoGuardado) {
      this.nivelDesbloqueado = parseInt(progresoGuardado);
    }
    // Inicializar el servicio de gestos
    this.gestureService = new GestureService();
    this.gestureService.initialize().catch(error => {
      console.error('Error al inicializar GestureService:', error);
    });
  },
  beforeUnmount() {
    this.stopCamera();
  },
  methods: {
    stopCamera() {
        // Detener la cámara y el procesamiento cuando el componente se desmonte
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        this.cameraReady = false;
    },
    async setupCamera() {
      this.videoElement = this.$refs.webcam; // Asigna la referencia del elemento <video>
      const exerciseArea = this.$refs.exerciseArea;

      if (!this.videoElement || !exerciseArea) {
        console.error("Elemento de video o área de ejercicio no encontrado.");
        return;
      }
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        this.videoElement.srcObject = this.stream;
        this.videoElement.addEventListener('loadeddata', () => {
          this.cameraReady = true;
          console.log("Cámara lista. Iniciando predicción.");
          this.predictWebcam();
        });
      } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        alert("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
      }
    },
    predictWebcam() {
      if (!this.cameraReady || !this.videoElement || !this.gestureService || !this.gestureService.isRunning || !this.nivelActivo) {
        return;
      }

      const now = performance.now();
      if (this.lastVideoTime !== this.videoElement.currentTime) {
        this.lastVideoTime = this.videoElement.currentTime;
        const result = this.gestureService.detect(this.videoElement, now);
        if (result) {
          this.hands = result.hands;
          this.currentSign = result.signo;
        } else {
          this.hands = [];
        }
      }
      
      requestAnimationFrame(this.predictWebcam);
    },
    tornarAInici() {
      this.$router.push('/');
    },
    intentarEntrarNivel(nivel) {
      if (nivel.id <= this.nivelDesbloqueado) {
        this.nivelActivo = nivel.id;
        this.pasoActual = 1;
        
        this.$nextTick(() => {
          this.setupCamera();
          const exerciseArea = this.$refs.exerciseArea;
          if (exerciseArea) {
            this.exerciseAreaStyle = {
              width: `${exerciseArea.clientWidth}px`,
              height: `${exerciseArea.clientHeight}px`,
            };
          }
        });
      }
    },
    sortirDeLlico() {
      this.stopCamera();
      this.nivelActivo = null;
      this.pasoActual = 1;
    },
    comprovarGesto() {
        const gestEsperat = this.llicoActualData.gestEsperat;
        if (this.currentSign === gestEsperat) {
            alert(`✅ Correcte! Has fet el gest de "${gestEsperat}".`);
            if (this.pasoActual < this.totalPasosLlico) {
                this.pasoActual++;
            } else {
                alert(`🎉 Genial! Has completat el Nivell: ${this.niveles[this.nivelActivo - 1].titol}.`);
                
                if (this.nivelActivo === this.nivelDesbloqueado && this.nivelDesbloqueado <= this.niveles.length) {
                this.nivelDesbloqueado++;
                localStorage.setItem('gesto_nivel_desbloqueado', this.nivelDesbloqueado);
                }
                this.sortirDeLlico();
            }
            this.currentSign = ''; // Reiniciar el gest detectat
        } else {
            alert(`❌ Incorrecte. Intenta fer el gest de "${gestEsperat}". El gest detectat és "${this.currentSign || 'cap'}".`);
        }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

* { box-sizing: border-box; }
.container { max-width: 800px; margin: 0 auto; padding: 0 20px; width: 100%; }

.learning-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #121212;
  font-family: 'Inter', sans-serif;
  color: #E0E0E0;
}

/* ================= HEADER ================= */
.learning-header {
  display: flex;
  align-items: center;
  padding: 20px 5%;
  gap: 20px;
  background-color: #0a0a0a;
  border-bottom: 1px solid #1f1f1f;
  position: sticky;
  top: 0;
  z-index: 20;
}

.btn-close {
  display: flex; align-items: center; gap: 8px;
  background: none; border: none; color: #A0A0A0; font-size: 1rem; font-weight: 600; cursor: pointer; transition: color 0.3s;
}
.btn-close:hover { color: #fff; }

.progress-bar-container {
  flex-grow: 1; height: 8px; background-color: #1f1f1f; border-radius: 4px; overflow: hidden;
}
.progress-bar-fill {
  height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.global-progress { background-color: #00BFFF; box-shadow: 0 0 10px rgba(0, 191, 255, 0.5); }
.lesson-progress { background-color: #00BFFF; }

/* ================= RUTA ESTIL "CAMINO" ================= */
.path-section { padding-top: 40px; padding-bottom: 100px; }
.path-header { text-align: center; margin-bottom: 40px; }
.path-header h1 { font-size: 2.5rem; font-weight: 800; color: #fff; margin-bottom: 10px; }
.path-header p { color: #A0A0A0; font-size: 1.1rem; }

.timeline-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 100px; /* Espai gran per a que càpiga el camí */
  position: relative;
  padding-top: 20px;
}

.timeline-node-wrapper {
  position: relative; 
  display: flex; 
  justify-content: center;
  width: 70px; /* Mateixa mida que el botó */
  height: 70px;
  z-index: 2;
}

/* Alternem a esquerra i dreta */
.stagger-0 { transform: translateX(-60px); }
.stagger-1 { transform: translateX(60px); }

/* ================= EL CAMÍ (SVG) ================= */
.path-connector {
  position: absolute;
  top: 35px; /* Comença des del centre del node actual */
  left: 35px;
  z-index: -1; /* Que quedi per darrere del botó */
}

/* Quan passem de dreta a esquerra, invertim el camí */
.stagger-1 .path-connector {
  left: auto;
  right: 35px;
  transform: scaleX(-1);
}

/* Estils de la línia discontínua */
.path-connector path {
  stroke: #2a2a2a; /* Color del camí bloquejat */
  transition: stroke 0.5s ease;
}

/* Animació quan el camí està actiu (blau i movent-se) */
@keyframes flow {
  from { stroke-dashoffset: 20; }
  to { stroke-dashoffset: 0; }
}
.path-connector.active-path path {
  stroke: #00BFFF;
  animation: flow 0.8s linear infinite;
  filter: drop-shadow(0 0 4px rgba(0, 191, 255, 0.6));
}

/* ================= ETIQUETA "NIVELL ACTUAL" ================= */
.current-label {
  position: absolute;
  top: -35px;
  background-color: rgba(0, 191, 255, 0.15);
  color: #00BFFF;
  border: 1px solid #00BFFF;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  letter-spacing: 1px;
  white-space: nowrap;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 191, 255, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 191, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 191, 255, 0); }
}

/* ================= EL NODE (BOTÓ) ================= */
.timeline-node {
  width: 70px; height: 70px; border-radius: 50%; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; position: relative; transition: all 0.3s ease;
}

.completed { background-color: #1a1a1a; border: 2px solid #00BFFF; color: #00BFFF; }
.completed:hover { background-color: rgba(0, 191, 255, 0.1); }

.current { background-color: #00BFFF; color: #000; box-shadow: 0 0 20px rgba(0, 191, 255, 0.4); transform: scale(1.1); }
.current:hover { transform: scale(1.15); box-shadow: 0 0 30px rgba(0, 191, 255, 0.6); }

.locked { background-color: #121212; border: 2px dashed #444; color: #555; cursor: not-allowed; }

.node-icon { width: 28px; height: 28px; }
.play-icon { width: 24px; height: 24px; transform: translateX(2px); }

/* Text a sota del node */
.node-info { 
  position: absolute;
  top: 85px; /* Posicionat just sota el botó */
  width: 200px;
  text-align: center;
  pointer-events: none; /* Evita interferir amb el clic del botó */
}
.node-info h3 { margin: 0; font-size: 1.1rem; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
.lesson-count { font-size: 0.85rem; color: #888; }

/* ================= VISTA DE LA LECCIÓN (INTERIOR) ================= */
.learning-content { flex-grow: 1; display: flex; flex-direction: column; padding-top: 20px; padding-bottom: 40px; }
.lesson-title { font-size: 2.5rem; font-weight: 800; color: #fff; margin-bottom: 10px; text-align: center; }
.lesson-instruction { font-size: 1.1rem; color: #A0A0A0; text-align: center; margin-bottom: 40px; }

.lesson-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
.sign-display {
  background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; display: flex; justify-content: center; align-items: center; height: 350px; overflow: hidden; 
}
.sign-media { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }
.invert-img { filter: invert(1); opacity: 0.9; }

.camera-placeholder {
  height: 350px; border: 1px solid #333; background: #161616; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #666;
  position: relative;
}
.camera-icon { width: 48px; height: 48px; stroke: #666; margin-bottom: 15px; }

.webcam-video {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Asegura que el video cubra todo el espacio */
  border-radius: 12px;
  transform: scaleX(-1); /* Efecto espejo para la cámara frontal */
}

.webcam-video.hidden {
  display: none;
}

.learning-footer { border-top: 1px solid #1f1f1f; padding: 20px 0; background-color: #0a0a0a; }
.footer-content { display: flex; justify-content: flex-end; }

.btn-primary { 
  background-color: #00BFFF; color: #000; padding: 16px 40px; font-size: 1.1rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 20px rgba(0, 191, 255, 0.2); text-transform: uppercase; letter-spacing: 1px; 
}
.btn-primary:hover { 
  background-color: #33CFFF; box-shadow: 0 0 30px rgba(0, 191, 255, 0.4); transform: translateY(-2px); 
}

@media (max-width: 768px) {
  .lesson-layout { grid-template-columns: 1fr; gap: 20px; }
  .sign-display, .camera-placeholder { height: 250px; }
  .footer-content { justify-content: center; }
  .btn-primary { width: 100%; }
}
</style>