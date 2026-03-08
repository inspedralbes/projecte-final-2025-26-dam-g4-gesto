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
          <p>Model actual: Nombres (Un-Deu), Hola i Adeu</p>
        </div>

        <div class="zigzag-path">

          <!-- NODE 1 — stagger esquerra -->
          <div class="zz-node-wrapper stagger-0">
            <div v-if="nivelDesbloqueado === 1" class="current-label">ACTUAL</div>
            <button
              class="timeline-node"
              :class="{ 'current': nivelDesbloqueado === 1, 'completed': 1 < nivelDesbloqueado }"
              @click="intentarEntrarNivel(niveles[0])"
            >
              <svg v-if="1 < nivelDesbloqueado" viewBox="0 0 24 24" class="node-icon">
                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="nivelDesbloqueado === 1" viewBox="0 0 24 24" class="node-icon">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
            </button>
            <div class="node-info">
              <h3>De l'Un al Cinc</h3>
              <span class="lesson-count">5 lliçons</span>
            </div>
          </div>

          <!-- CONNECTOR 1→2: va cap a la dreta -->
          <svg class="zz-connector" width="240" height="44" viewBox="0 0 240 44">
            <path d="M 30,0 C 30,22 210,22 210,44" fill="none" stroke-width="5" stroke-dasharray="10 6"
              :stroke="nivelDesbloqueado >= 2 ? '#00BFFF' : '#2a2a2a'"
              :class="nivelDesbloqueado >= 2 ? 'path-animated' : ''" />
          </svg>

          <!-- NODE 2 — stagger dreta -->
          <div class="zz-node-wrapper stagger-1">
            <div v-if="nivelDesbloqueado === 2" class="current-label">ACTUAL</div>
            <button
              class="timeline-node"
              :class="{ 'current': nivelDesbloqueado === 2, 'completed': 2 < nivelDesbloqueado }"
              @click="intentarEntrarNivel(niveles[1])"
            >
              <svg v-if="2 < nivelDesbloqueado" viewBox="0 0 24 24" class="node-icon">
                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="nivelDesbloqueado === 2" viewBox="0 0 24 24" class="node-icon">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
            </button>
            <div class="node-info">
              <h3>Del Sis al Deu</h3>
              <span class="lesson-count">5 lliçons</span>
            </div>
          </div>

          <!-- CONNECTOR 2→3: torna cap a l'esquerra -->
          <svg class="zz-connector" width="240" height="44" viewBox="0 0 240 44">
            <path d="M 210,0 C 210,22 30,22 30,44" fill="none" stroke-width="5" stroke-dasharray="10 6"
              :stroke="nivelDesbloqueado >= 3 ? '#00BFFF' : '#2a2a2a'"
              :class="nivelDesbloqueado >= 3 ? 'path-animated' : ''" />
          </svg>

          <!-- NODE 3 — stagger esquerra -->
          <div class="zz-node-wrapper stagger-0">
            <div v-if="nivelDesbloqueado === 3" class="current-label">ACTUAL</div>
            <button
              class="timeline-node"
              :class="{ 'current': nivelDesbloqueado === 3, 'completed': 3 < nivelDesbloqueado }"
              @click="intentarEntrarNivel(niveles[2])"
            >
              <svg v-if="3 < nivelDesbloqueado" viewBox="0 0 24 24" class="node-icon">
                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="nivelDesbloqueado === 3" viewBox="0 0 24 24" class="node-icon">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
            </button>
            <div class="node-info">
              <h3>Salutacions</h3>
              <span class="lesson-count">2 lliçons</span>
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
            <div class="video-wrapper">
              <video
                :key="llicoActualData.arxiu"
                :src="llicoActualData.arxiu"
                class="sign-media"
                autoplay loop muted playsinline
                @error="videoError = true"
                @loadstart="videoError = false"
              ></video>
              <!-- Placeholder si el video no existeix encara -->
              <div v-if="videoError" class="video-placeholder">
                <span class="video-placeholder-icon">🤚</span>
                <p>{{ llicoActualData.titol }}</p>
                <small>Video pròximament</small>
              </div>
            </div>
          </div>

          <div 
            ref="exerciseArea" 
            class="exercise-area"
            :class="{ 'camera-success': tipoFeedback === 'success', 'camera-error': tipoFeedback === 'error' }"
          >
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

        <div class="debug-detection" style="text-align:center; color: #555; margin-top: 10px; font-size: 0.9rem;">
            Detectat: <strong>{{ fraseDetectada || '...' }}</strong>
        </div>

        <div v-if="mensajeFeedback" class="feedback-banner" :class="tipoFeedback">
          {{ mensajeFeedback }}
        </div>

      </div>

      <div class="learning-footer">
        <div class="container footer-content">
          <div class="auto-detect-indicator" :class="{'success': tipoFeedback === 'success'}">
            {{ 
              tipoFeedback === 'success' 
              ? (pasoActual === totalPasosLlico ? '🎉 COMPLETANT...' : '✔ GEST CORRECTE! AVANÇANT...') 
              : '🔴 ESPERANT EL GEST A LA CÀMERA...' 
            }}
          </div>
        </div>
      </div>

      <div v-if="mostrarModalSuperat" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-icon">🏆</div>
          <h2>Enhorabona!</h2>
          <p>Has completat amb èxit el <strong>{{ niveles[nivelActivo - 1].titol }}</strong>.</p>
          
          <div class="unlocked-badge">
            🔓 Camí actualitzat!
          </div>

          <button class="btn-primary" @click="tancarModalIAnarAlMapa">
            Continuar a la Ruta
          </button>
        </div>
      </div>

    </template>

  </div>
</template>

<script>
import DrawSkeleton from '../components/DrawSkeleton.vue';
import { GestureService } from '../services/gestureservices2.js';

// FIX: Guardem el GestureService FORA de la reactivitat de Vue
// Vue envolta els objectes de data() en Proxies que trenquen MediaPipe
let _gestureServiceInstance = null;

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

      gestureService: null,
      videoElement: null,
      hands: [], 
      currentSign: '', 
      fraseDetectada: '', 
      cameraReady: false,
      stream: null, 
      lastVideoTime: -1, 
      exerciseAreaStyle: {},
      videoError: false,

      mensajeFeedback: null,
      tipoFeedback: null,
      feedbackTimeout: null,
      mostrarModalSuperat: false, 
      
      niveles: [
        {
          id: 1, 
          categoria: "Nivell 1", 
          descripcio: "Nombres (Una mà)", 
          titol: "De l'Un al Cinc",
          llicons: [
            { titol: "Número Un", instruccio: "Aixeca el dit índex.", gestEsperat: "Un", arxiu: "/videos/un.mp4", esVideo: true },
            { titol: "Número Dos", instruccio: "Aixeca els dits índex i cor.", gestEsperat: "Dos", arxiu: "/videos/dos.mp4", esVideo: true },
            { titol: "Número Tres", instruccio: "Aixeca els dits polze, índex i cor.", gestEsperat: "Tres", arxiu: "/videos/tres.mp4", esVideo: true },
            { titol: "Número Quatre", instruccio: "Aixeca quatre dits, amagant el polze.", gestEsperat: "Quatre", arxiu: "/videos/quatre.mp4", esVideo: true },
            { titol: "Número Cinc", instruccio: "Obre tota la mà.", gestEsperat: "Cinc", arxiu: "/videos/cinc.mp4", esVideo: true }
          ]
        },
        {
          id: 2, 
          categoria: "Nivell 2", 
          descripcio: "Nombres (Dues mans)", 
          titol: "Del Sis al Deu",
          llicons: [
            { titol: "Número Sis", instruccio: "Una mà oberta (Cinc) i un dit de l'altra mà (Un).", gestEsperat: "Sis", arxiu: "/videos/sis.mp4", esVideo: true },
            { titol: "Número Set", instruccio: "Una mà oberta (Cinc) i dos dits de l'altra mà (Dos).", gestEsperat: "Set", arxiu: "/videos/set.mp4", esVideo: true },
            { titol: "Número Vuit", instruccio: "Una mà oberta (Cinc) i tres dits de l'altra (Tres).", gestEsperat: "Vuit", arxiu: "/videos/vuit.mp4", esVideo: true },
            { titol: "Número Nou", instruccio: "Una mà oberta (Cinc) i quatre dits de l'altra (Quatre).", gestEsperat: "Nou", arxiu: "/videos/nou.mp4", esVideo: true },
            { titol: "Número Deu", instruccio: "Les dues mans obertes (Cinc i Cinc).", gestEsperat: "Deu", arxiu: "/videos/deu.mp4", esVideo: true }
          ]
        },
        {
          id: 3, 
          categoria: "Nivell 3", 
          descripcio: "Social", 
          titol: "Salutacions",
          llicons: [
            { titol: "Hola", instruccio: "Saluda movent la mà de costat a costat.", gestEsperat: "Hola", arxiu: "/videos/hola.mp4", esVideo: true },
            { titol: "Adeu", instruccio: "Tanca i obre la mà per dir Adeu.", gestEsperat: "Adeu", arxiu: "/videos/adeu.mp4", esVideo: true }
          ]
        }
      ]
    }
  },
  computed: {
    nivelesVisibles() {
      return this.niveles.filter(n => n.id <= this.nivelDesbloqueado);
    },
    nivelesPorCategoria() {
      const grupos = [];
      let categoriaActual = '';
      let grupoActual = null;

      this.nivelesVisibles.forEach(nivel => {
        if (nivel.categoria !== categoriaActual) {
          categoriaActual = nivel.categoria;
          grupoActual = { 
            nom: categoriaActual, 
            descripcio: nivel.descripcio,
            niveles: [] 
          };
          grupos.push(grupoActual);
        }
        grupoActual.niveles.push(nivel);
      });
      return grupos;
    },
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
      return Math.min(100, ((this.pasoActual - 1) / this.totalPasosLlico) * 100 + (100 / this.totalPasosLlico));
    }
  },
  mounted() {
    const progresoGuardado = localStorage.getItem('gesto_nivel_desbloqueado');
    if (progresoGuardado) {
      this.nivelDesbloqueado = parseInt(progresoGuardado);
    }
    
    _gestureServiceInstance = new GestureService();
    _gestureServiceInstance.initialize().catch(error => {
      console.error('Error al inicializar GestureService:', error);
    });
  },
  beforeUnmount() {
    this.stopCamera();
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
  },
  methods: {
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        this.cameraReady = false;
    },
    async setupCamera() {
      this.videoElement = this.$refs.webcam; 
      const exerciseArea = this.$refs.exerciseArea;

      if (!this.videoElement || !exerciseArea) {
        return;
      }
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        this.videoElement.srcObject = this.stream;
        this.videoElement.addEventListener('loadeddata', () => {
          this.cameraReady = true;
          this.predictWebcam();
        });
      } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        this.tipoFeedback = 'error';
        this.mensajeFeedback = "❌ No s'ha pogut accedir a la càmera. Assegura't de donar permisos.";
      }
    },
    predictWebcam() {
      // Si la càmera o el nivell no estan llestos, parem del tot
      if (!this.cameraReady || !this.videoElement || !this.nivelActivo) {
        return;
      }
      // Si GestureService encara s'està inicialitzant, esperem i tornem a intentar
      if (!_gestureServiceInstance || !_gestureServiceInstance.enExecucio) {
        requestAnimationFrame(this.predictWebcam);
        return;
      }

      const now = performance.now();
      if (this.lastVideoTime !== this.videoElement.currentTime) {
        this.lastVideoTime = this.videoElement.currentTime;
        const result = _gestureServiceInstance.detect(this.videoElement, now);
        
        if (result) {
          this.hands = result.hands;
          const outputString = result.signo;

          // FIX: Mostrem el gest confirmat o "Escaneant..." si encara no hi ha prou confiança
          if (outputString) {
            this.fraseDetectada = outputString;
          } else if (result.hands && result.hands.length > 0) {
            this.fraseDetectada = "Escaneant mà..."; // Hi ha mà però no gest confirmat
          }
          // (si no hi ha mans, fraseDetectada queda com estava)

          // FIX: Només avaluem si hi ha un gest confirmat (no null)
          if (outputString && this.tipoFeedback !== 'success') {
              this.currentSign = outputString;

              // Comprobem si coincideix amb el que demana la lliçó
              // FIX: Comparació case-insensitive per seguretat
              if (this.currentSign.toLowerCase() === this.llicoActualData.gestEsperat.toLowerCase()) {
                  this.gestoCorrecto();
              }
          }
        } else {
          this.hands = [];
          this.fraseDetectada = "Esperant la mà...";
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
        this.mensajeFeedback = null;
        this.tipoFeedback = null; 
        this.mostrarModalSuperat = false;
        this.fraseDetectada = ''; 
        
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
      this.mensajeFeedback = null;
      this.tipoFeedback = null;
      if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    },
    
    gestoCorrecto() {
        if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
        this.tipoFeedback = 'success';

        if (this.pasoActual === this.totalPasosLlico) {
            this.mensajeFeedback = `🎉 Genial! Processant recompensa...`;
            
            if (this.nivelActivo === this.nivelDesbloqueado && this.nivelDesbloqueado <= this.niveles.length) {
                this.nivelDesbloqueado++;
                localStorage.setItem('gesto_nivel_desbloqueado', this.nivelDesbloqueado);
            }
            
            this.feedbackTimeout = setTimeout(() => {
                this.stopCamera(); 
                this.mostrarModalSuperat = true; 
            }, 1000);

        } else {
            this.mensajeFeedback = `✅ Correcte! Has fet el gest de "${this.llicoActualData.gestEsperat}".`;
            this.feedbackTimeout = setTimeout(() => {
                this.avançarLlicoAutomàtic();
            }, 2000);
        }
    },

    avançarLlicoAutomàtic() {
        this.mensajeFeedback = null;
        this.tipoFeedback = null; 
        this.currentSign = ''; 
        this.pasoActual++;
    },

    tancarModalIAnarAlMapa() {
        this.mostrarModalSuperat = false;
        this.sortirDeLlico();
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

* { box-sizing: border-box; }
.container { max-width: 1000px; margin: 0 auto; padding: 0 20px; width: 100%; }

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

.btn-test {
  background-color: #333; color: #fff; border: 1px solid #555; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
}
.btn-test:hover { background-color: #00BFFF; color: #000; border-color: #00BFFF; }

/* ================= RUTA ZIG-ZAG ================= */
.path-section { padding-top: 40px; padding-bottom: 100px; }
.path-header { text-align: center; margin-bottom: 50px; }
.path-header h1 { font-size: 2.5rem; font-weight: 800; color: #fff; margin-bottom: 10px; }
.path-header p { color: #A0A0A0; font-size: 1.1rem; }

.zigzag-path {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-top: -10px;
}

.zz-connector {
  display: block;
  overflow: visible;
  margin: -22px 0;
}

/* Animació de les ratlles del camí */
@keyframes dash-flow {
  from { stroke-dashoffset: 40; }
  to   { stroke-dashoffset: 0; }
}
.path-animated {
  animation: dash-flow 1s linear infinite;
  filter: drop-shadow(0 0 4px rgba(0,191,255,0.7));
}

.zz-node-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.stagger-0 { padding-left: 0; padding-right: 55%; }
.stagger-1 { padding-left: 55%; padding-right: 0; }

.current-label {
  position: absolute; top: -34px;
  background: rgba(0,191,255,0.12); color: #00BFFF;
  border: 1px solid #00BFFF; font-weight: 700;
  padding: 3px 14px; border-radius: 20px; font-size: 0.75rem;
  letter-spacing: 1px; white-space: nowrap;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%   { box-shadow: 0 0 0 0 rgba(0,191,255,0.4); }
  70%  { box-shadow: 0 0 0 10px rgba(0,191,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(0,191,255,0); }
}

/* ================= BOTONS 3D ================= */
.timeline-node {
  width: 70px; height: 70px;
  border-radius: 50%; border: none; cursor: pointer;
  display: flex; justify-content: center; align-items: center;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  background-color: #2a2a2a; color: #666;
  box-shadow: 0 6px 0 #111;
  transform: translateY(0);
}
.timeline-node:active { transform: translateY(4px) !important; box-shadow: 0 2px 0 transparent !important; }

.completed { background-color: #1a1a1a; border: 2px solid #00BFFF; color: #00BFFF; box-shadow: 0 6px 0 #005f80; }
.completed:hover { background-color: #112228; transform: translateY(-2px); box-shadow: 0 8px 0 #005f80; }

.current {
  background-color: #00BFFF; color: #000;
  box-shadow: 0 6px 0 #007799, 0 10px 20px rgba(0,191,255,0.4);
  transform: scale(1.15) translateY(0);
}
.current:hover  { transform: scale(1.15) translateY(-2px); box-shadow: 0 8px 0 #007799, 0 15px 25px rgba(0,191,255,0.5); }
.current:active { transform: scale(1.15) translateY(4px) !important; box-shadow: 0 2px 0 #007799 !important; }

.node-icon { width: 28px; height: 28px; }

.node-info { text-align: center; pointer-events: none; }
.node-info h3 { margin: 0; font-size: 1rem; color: #fff; font-weight: 700; }
.lesson-count { font-size: 0.82rem; color: #888; }

/* ================= VISTA DE LA LECCIÓN (INTERIOR) ================= */
.learning-content { flex-grow: 1; display: flex; flex-direction: column; padding-top: 20px; padding-bottom: 40px; }
.lesson-title { font-size: 2.5rem; font-weight: 800; color: #fff; margin-bottom: 10px; text-align: center; }
.lesson-instruction { font-size: 1.1rem; color: #A0A0A0; text-align: center; margin-bottom: 40px; }

.lesson-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }

.sign-display { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; display: flex; justify-content: center; align-items: center; height: 450px; overflow: hidden; }
.video-wrapper { position: relative; width: 100%; height: 100%; }
.sign-media { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.video-placeholder {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  background: #1a1a1a; border-radius: 8px; gap: 10px;
}
.video-placeholder-icon { font-size: 3.5rem; }
.video-placeholder p { color: #fff; font-size: 1.2rem; font-weight: 700; margin: 0; }
.video-placeholder small { color: #666; font-size: 0.85rem; }
.invert-img { filter: invert(1); opacity: 0.9; }

.exercise-area { position: relative; width: 100%; height: 450px; border-radius: 12px; overflow: hidden; border: 4px solid #ff4040; box-shadow: 0 0 20px rgba(255, 64, 64, 0.3); transition: all 0.3s ease-in-out; }
.exercise-area.camera-success { border-color: #00ff80; box-shadow: 0 0 30px rgba(0, 255, 128, 0.6); transform: scale(1.02); }
.exercise-area.camera-error { border-color: #ff4040; box-shadow: 0 0 30px rgba(255, 64, 64, 0.8); }

.camera-placeholder { height: 100%; width: 100%; background: #161616; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #666; position: relative; }
.camera-icon { width: 48px; height: 48px; stroke: #666; margin-bottom: 15px; }

.webcam-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
.webcam-video.hidden { display: none; }

.learning-footer { border-top: 1px solid #1f1f1f; padding: 20px 0; background-color: #0a0a0a; }
.footer-content { display: flex; justify-content: center; }

.auto-detect-indicator { padding: 16px 40px; font-size: 1.1rem; font-weight: 700; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; background-color: #2a0000; color: #ff4040; border: 1px solid #ff4040; transition: all 0.3s ease; width: 100%; text-align: center; }
.auto-detect-indicator.success { background-color: #002a11; color: #00ff80; border: 1px solid #00ff80; }

/* ================= MENSAJES DE FEEDBACK ================= */
.feedback-banner { margin-top: 30px; padding: 16px 20px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 1.1rem; animation: slideUpFade 0.3s ease-out forwards; }
.feedback-banner.success { background-color: rgba(0, 255, 128, 0.1); color: #00ff80; border: 1px solid rgba(0, 255, 128, 0.3); box-shadow: 0 0 15px rgba(0, 255, 128, 0.1); }
.feedback-banner.error { background-color: rgba(255, 64, 64, 0.1); color: #ff4040; border: 1px solid rgba(255, 64, 64, 0.3); box-shadow: 0 0 15px rgba(255, 64, 64, 0.1); }
@keyframes slideUpFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ================= MODAL DE VICTORIA (TRANSICIÓN) ================= */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 999; animation: fadeIn 0.4s ease-out;
}
.modal-content {
  background: #1a1a1a; border: 1px solid #333; border-radius: 16px; padding: 50px 40px; text-align: center; max-width: 450px; width: 90%; box-shadow: 0 20px 50px rgba(0,0,0,0.5); animation: scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-icon { font-size: 4rem; margin-bottom: 20px; animation: bounce 2s infinite; }
.modal-content h2 { color: #fff; font-size: 2.2rem; margin-bottom: 10px; font-weight: 800; }
.modal-content p { color: #A0A0A0; font-size: 1.1rem; line-height: 1.5; margin-bottom: 30px; }
.unlocked-badge { display: inline-block; background: rgba(0, 191, 255, 0.15); color: #00BFFF; padding: 8px 20px; border-radius: 30px; font-weight: 600; margin-bottom: 30px; border: 1px solid rgba(0, 191, 255, 0.3); }

.btn-primary { background-color: #00BFFF; color: #000; padding: 16px 40px; font-size: 1.1rem; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 20px rgba(0, 191, 255, 0.2); width: 100%; text-transform: uppercase; }
.btn-primary:hover { background-color: #33CFFF; box-shadow: 0 0 30px rgba(0, 191, 255, 0.4); transform: translateY(-2px); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-20px); } 60% { transform: translateY(-10px); } }

@media (max-width: 768px) {
  .lesson-layout { grid-template-columns: 1fr; gap: 20px; }
  .sign-display, .exercise-area { height: 300px; } 
  .footer-content { justify-content: center; }
}
</style>