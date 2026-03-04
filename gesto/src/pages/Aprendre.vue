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

        <div v-for="(categoria, catIndex) in nivelesPorCategoria" :key="catIndex" class="category-group">
          
          <div class="category-header-banner">
            <h2>{{ categoria.nom }}</h2>
            <p>{{ categoria.descripcio }}</p>
          </div>

          <div class="timeline-container">
            <div 
              v-for="(nivel, index) in categoria.niveles" 
              :key="nivel.id"
              class="timeline-node-wrapper"
              :class="'stagger-' + (index % 2)"
            >
              <svg 
                v-if="index < categoria.niveles.length - 1" 
                class="path-connector active-path" 
                width="100" height="170" viewBox="0 0 100 170"
              >
                <path d="M 0,0 C 0,85 100,85 100,170" fill="none" stroke-width="4" stroke-dasharray="10 10" />
              </svg>

              <div v-if="nivel.id === nivelDesbloqueado" class="current-label">
                ACTUAL
              </div>

              <button
                class="timeline-node"
                :class="{ 
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
              </button>
              
              <div class="node-info">
                <h3>{{ nivel.titol }}</h3>
                <span class="lesson-count">{{ nivel.llicons.length }} lliçons</span>
              </div>
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
        <button class="btn-test" @click="gestoCorrecto" title="Simular que fas bé el gest">
          🚀 Forçar Aciert
        </button>
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
          <div class="modal-icon"></div>
          <h2>Enhorabona!</h2>
          <p>Has completat amb èxit el <strong>{{ niveles[nivelActivo - 1].titol }}</strong>.</p>
          
          <div class="unlocked-badge">
            Camí actualitzat!
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
import videoHola from '../assets/videos/hola.mp4';
import DrawSkeleton from '../components/DrawSkeleton.vue';
import { GestureService } from '../services/GestureService'; 

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
      cameraReady: false,
      stream: null, 
      lastVideoTime: -1, 
      exerciseAreaStyle: {},

      mensajeFeedback: null,
      tipoFeedback: null,
      feedbackTimeout: null,
      mostrarModalSuperat: false, 
      
      niveles: [
        {
          id: 1, categoria: "Nivell Bàsic", descripcio: "Paraules Soltes i Nombres", titol: "Nombres",
          llicons: [
            { titol: "Número 1", instruccio: "Fes el número 1 amb el dit índex.", gestEsperat: "1", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sign_language_1.svg/400px-Sign_language_1.svg.png", esVideo: false },
            { titol: "Número 0", instruccio: "Junta polze i índex per fer el 0.", gestEsperat: "0", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Sign_language_O.svg/400px-Sign_language_O.svg.png", esVideo: false }
          ]
        },
        {
          id: 2, categoria: "Nivell Bàsic", descripcio: "Paraules Soltes i Nombres", titol: "Salutacions",
          llicons: [
            { titol: "Hola", instruccio: "Saluda movent la mà.", gestEsperat: "Hola", arxiu: videoHola, esVideo: true },
            { titol: "Adeu", instruccio: "Tanca i obre la mà per dir Adeu.", gestEsperat: "Adeu", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false }
          ]
        },
        {
          id: 3, categoria: "Nivell Bàsic", descripcio: "Paraules Soltes i Nombres", titol: "Cortesia",
          llicons: [
            { titol: "Gràcies", instruccio: "Porta la mà de la barbeta cap endavant.", gestEsperat: "Gràcies", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Sign_language_A.svg/400px-Sign_language_A.svg.png", esVideo: false },
            { titol: "Si us plau", instruccio: "Ajunta les mans al pit.", gestEsperat: "Si us plau", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Sign_language_C.svg/400px-Sign_language_C.svg.png", esVideo: false }
          ]
        },
        {
          id: 4, categoria: "Nivell Bàsic", descripcio: "Paraules Soltes i Nombres", titol: "Família",
          llicons: [
            { titol: "Mare", instruccio: "Mà alçada amb el polze.", gestEsperat: "Mare", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false }
          ]
        },
        {
          id: 5, categoria: "Nivell Bàsic", descripcio: "Paraules Soltes i Nombres", titol: "Negacions",
          llicons: [
            { titol: "No", instruccio: "Mou el dit índex d'un costat a l'altre.", gestEsperat: "No", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sign_language_1.svg/400px-Sign_language_1.svg.png", esVideo: false }
          ]
        },

        {
          id: 6, categoria: "Nivell Mitjà", descripcio: "Formant Frases Curtes", titol: "Frase 1",
          llicons: [
            { titol: "Hola Mare (Part 1)", instruccio: "Primer gest: Fes 'Hola'.", gestEsperat: "Hola", arxiu: videoHola, esVideo: true },
            { titol: "Hola Mare (Part 2)", instruccio: "Segon gest: Fes 'Mare'.", gestEsperat: "Mare", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false }
          ]
        },
        {
          id: 7, categoria: "Nivell Mitjà", descripcio: "Formant Frases Curtes", titol: "Frase 2",
          llicons: [
            { titol: "Gràcies Mare (Part 1)", instruccio: "Primer gest: Fes 'Gràcies'.", gestEsperat: "Gràcies", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Sign_language_A.svg/400px-Sign_language_A.svg.png", esVideo: false },
            { titol: "Gràcies Mare (Part 2)", instruccio: "Segon gest: Fes 'Mare'.", gestEsperat: "Mare", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false }
          ]
        },
        {
          id: 8, categoria: "Nivell Mitjà", descripcio: "Formant Frases Curtes", titol: "Frase 3",
          llicons: [
            { titol: "Adeu Mare (Part 1)", instruccio: "Primer gest: Fes 'Adeu'.", gestEsperat: "Adeu", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false },
            { titol: "Adeu Mare (Part 2)", instruccio: "Segon gest: Fes 'Mare'.", gestEsperat: "Mare", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false }
          ]
        },
        {
          id: 9, categoria: "Nivell Mitjà", descripcio: "Formant Frases Curtes", titol: "Peticions 1",
          llicons: [
            { titol: "Un, si us plau (Part 1)", instruccio: "Primer gest: '1'.", gestEsperat: "1", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sign_language_1.svg/400px-Sign_language_1.svg.png", esVideo: false },
            { titol: "Un, si us plau (Part 2)", instruccio: "Segon gest: 'Si us plau'.", gestEsperat: "Si us plau", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Sign_language_C.svg/400px-Sign_language_C.svg.png", esVideo: false }
          ]
        },
        {
          id: 10, categoria: "Nivell Mitjà", descripcio: "Formant Frases Curtes", titol: "Respostes 1",
          llicons: [
            { titol: "No, gràcies (Part 1)", instruccio: "Primer gest: Fes 'No'.", gestEsperat: "No", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sign_language_1.svg/400px-Sign_language_1.svg.png", esVideo: false },
            { titol: "No, gràcies (Part 2)", instruccio: "Segon gest: Fes 'Gràcies'.", gestEsperat: "Gràcies", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Sign_language_A.svg/400px-Sign_language_A.svg.png", esVideo: false }
          ]
        },

        // ======================= NIVELL ALT =======================
        {
          id: 11, categoria: "Nivell Alt", descripcio: "Frases Complexes (3 gests)", titol: "Conversa 1",
          llicons: [
            { titol: "Hola mare, gràcies (1/3)", instruccio: "Gest 1: 'Hola'.", gestEsperat: "Hola", arxiu: videoHola, esVideo: true },
            { titol: "Hola mare, gràcies (2/3)", instruccio: "Gest 2: 'Mare'.", gestEsperat: "Mare", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false },
            { titol: "Hola mare, gràcies (3/3)", instruccio: "Gest 3: 'Gràcies'.", gestEsperat: "Gràcies", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Sign_language_A.svg/400px-Sign_language_A.svg.png", esVideo: false }
          ]
        },
        {
          id: 12, categoria: "Nivell Alt", descripcio: "Frases Complexes (3 gests)", titol: "Conversa 2",
          llicons: [
            { titol: "No mare, adeu (1/3)", instruccio: "Gest 1: 'No'.", gestEsperat: "No", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sign_language_1.svg/400px-Sign_language_1.svg.png", esVideo: false },
            { titol: "No mare, adeu (2/3)", instruccio: "Gest 2: 'Mare'.", gestEsperat: "Mare", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false },
            { titol: "No mare, adeu (3/3)", instruccio: "Gest 3: 'Adeu'.", gestEsperat: "Adeu", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sign_language_B.svg/400px-Sign_language_B.svg.png", esVideo: false }
          ]
        },
        {
          id: 13, categoria: "Nivell Alt", descripcio: "El Repte Final", titol: "Repte Final",
          llicons: [
            { titol: "Un i zero, si us plau (1/3)", instruccio: "Gest 1: Fes l''1'.", gestEsperat: "1", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sign_language_1.svg/400px-Sign_language_1.svg.png", esVideo: false },
            { titol: "Un i zero, si us plau (2/3)", instruccio: "Gest 2: Fes el '0'.", gestEsperat: "0", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Sign_language_O.svg/400px-Sign_language_O.svg.png", esVideo: false },
            { titol: "Un i zero, si us plau (3/3)", instruccio: "Gest 3: 'Si us plau'.", gestEsperat: "Si us plau", arxiu: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Sign_language_C.svg/400px-Sign_language_C.svg.png", esVideo: false }
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
    
    this.gestureService = new GestureService();
    this.gestureService.initialize().catch(error => {
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
        this.mensajeFeedback = "No s'ha pogut accedir a la càmera. Assegura't de donar permisos.";
      }
    },
    predictWebcam() {
      if (!this.cameraReady || !this.videoElement || !this.gestureService || !this.gestureService.enExecucio || !this.nivelActivo) {
        return;
      }

      const now = performance.now();
      if (this.lastVideoTime !== this.videoElement.currentTime) {
        this.lastVideoTime = this.videoElement.currentTime;
        const result = this.gestureService.detect(this.videoElement, now);
        
        if (result) {
          this.hands = result.hands;
          this.currentSign = result.signo;

          if (this.tipoFeedback !== 'success' && this.currentSign === this.llicoActualData.gestEsperat) {
              this.gestoCorrecto();
          }

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
        this.mensajeFeedback = null;
        this.tipoFeedback = null; 
        this.mostrarModalSuperat = false;
        
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
            this.mensajeFeedback = `Genial! Processant recompensa...`;
            
            if (this.nivelActivo === this.nivelDesbloqueado && this.nivelDesbloqueado <= this.niveles.length) {
                this.nivelDesbloqueado++;
                localStorage.setItem('gesto_nivel_desbloqueado', this.nivelDesbloqueado);
            }
            
            this.feedbackTimeout = setTimeout(() => {
                this.stopCamera(); 
                this.mostrarModalSuperat = true; 
            }, 1000);

        } else {
            this.mensajeFeedback = `Correcte! Has fet el gest de "${this.llicoActualData.gestEsperat}".`;
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

.path-section { padding-top: 40px; padding-bottom: 100px; }
.path-header { text-align: center; margin-bottom: 60px; }
.path-header h1 { font-size: 2.5rem; font-weight: 800; color: #fff; margin-bottom: 10px; }
.path-header p { color: #A0A0A0; font-size: 1.1rem; }

.category-group { margin-bottom: 100px; }
.category-header-banner { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px dashed #333; }
.category-header-banner h2 { font-size: 1.8rem; color: #00BFFF; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 5px 0; }
.category-header-banner p { color: #888; font-size: 1rem; margin: 0; }

.timeline-container { display: flex; flex-direction: column; align-items: center; gap: 100px; position: relative; padding-top: 20px; }
.timeline-node-wrapper { position: relative; display: flex; justify-content: center; width: 70px; height: 70px; z-index: 2; }
.stagger-0 { transform: translateX(-60px); }
.stagger-1 { transform: translateX(60px); }

.path-connector { position: absolute; top: 35px; left: 35px; z-index: -1; }
.stagger-1 .path-connector { left: auto; right: 35px; transform: scaleX(-1); }
.path-connector path { stroke: #2a2a2a; transition: stroke 0.5s ease; }
@keyframes flow { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
.path-connector.active-path path { stroke: #00BFFF; animation: flow 0.8s linear infinite; filter: drop-shadow(0 0 4px rgba(0, 191, 255, 0.6)); }

.current-label { position: absolute; top: -35px; background-color: rgba(0, 191, 255, 0.15); color: #00BFFF; border: 1px solid #00BFFF; font-weight: 600; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; letter-spacing: 1px; white-space: nowrap; animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(0, 191, 255, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(0, 191, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(0, 191, 255, 0); } }

.timeline-node { 
  width: 70px; 
  height: 70px; 
  border-radius: 50%; 
  border: none; 
  cursor: pointer; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  position: relative; 
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); 
  background-color: #2a2a2a;
  color: #666;
  box-shadow: 0 6px 0 #111; 
  transform: translateY(0);
}

.timeline-node:active {
  transform: translateY(4px) !important; 
  box-shadow: 0 2px 0 transparent !important; 
}

.completed { 
  background-color: #1a1a1a; 
  border: 2px solid #00BFFF; 
  color: #00BFFF; 
  box-shadow: 0 6px 0 #005f80; 
}

.completed:hover { 
  background-color: #112228; 
  transform: translateY(-2px);
  box-shadow: 0 8px 0 #005f80; 
}

.current { 
  background-color: #00BFFF; 
  color: #000; 
  box-shadow: 0 6px 0 #007799, 0 10px 20px rgba(0, 191, 255, 0.4); 
  transform: scale(1.15) translateY(0); 
}

.current:hover { 
  transform: scale(1.15) translateY(-2px); 
  box-shadow: 0 8px 0 #007799, 0 15px 25px rgba(0, 191, 255, 0.5); 
}

.current:active {
  transform: scale(1.15) translateY(4px) !important;
  box-shadow: 0 2px 0 #007799, 0 5px 10px rgba(0, 191, 255, 0.3) !important;
}

.node-icon { width: 28px; height: 28px; }
.play-icon { width: 24px; height: 24px; transform: translateX(2px); }

.node-info { position: absolute; top: 85px; width: 200px; text-align: center; pointer-events: none; }
.node-info h3 { margin: 0; font-size: 1.1rem; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
.lesson-count { font-size: 0.85rem; color: #888; }

.learning-content { flex-grow: 1; display: flex; flex-direction: column; padding-top: 20px; padding-bottom: 40px; }
.lesson-title { font-size: 2.5rem; font-weight: 800; color: #fff; margin-bottom: 10px; text-align: center; }
.lesson-instruction { font-size: 1.1rem; color: #A0A0A0; text-align: center; margin-bottom: 40px; }

.lesson-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }

.sign-display { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; display: flex; justify-content: center; align-items: center; height: 450px; overflow: hidden; }
.sign-media { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }
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

.feedback-banner { margin-top: 30px; padding: 16px 20px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 1.1rem; animation: slideUpFade 0.3s ease-out forwards; }
.feedback-banner.success { background-color: rgba(0, 255, 128, 0.1); color: #00ff80; border: 1px solid rgba(0, 255, 128, 0.3); box-shadow: 0 0 15px rgba(0, 255, 128, 0.1); }
.feedback-banner.error { background-color: rgba(255, 64, 64, 0.1); color: #ff4040; border: 1px solid rgba(255, 64, 64, 0.3); box-shadow: 0 0 15px rgba(255, 64, 64, 0.1); }
@keyframes slideUpFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

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