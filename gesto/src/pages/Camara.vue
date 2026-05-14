<template>
Â  <div class="camera-container">
Â  Â  <video
Â  Â  Â  ref="videoRef"
Â  Â  Â  autoplay
Â  Â  Â  class="fullscreen-video"
Â  Â  Â  :class="{ espejo: facingMode === 'user' }"
Â  Â  Â  muted
Â  Â  Â  playsinline
Â  Â  />
Â  Â  <DrawSkeleton v-if="mostrarEsquelet" class="skeleton-overlay" :es-frontal="facingMode === 'user'" :hands-data="manosDetectadas" />

Â  Â  <div v-if="carregant" class="loading-overlay">
Â  Â  Â  <LoadingSpinner />
Â  Â  Â  <p>Configurant la IntelÂ·ligÃ¨ncia Artificial...</p>
Â  Â  </div>

Â  Â  <div class="top-logo">
Â  Â  Â  <svg viewBox="0 0 24 24"><path d="M9,2C7.9,2 7,2.9 7,4V17H5V5C5,4.45 4.55,4 4,4C3.45,4 3,4.45 3,5V17C3,19.2 4.8,21 7,21H13.5C15.42,21 17.55,20.03 18.9,18.66L20.8,16.76C21.18,16.38 21.18,15.75 20.8,15.36L19.4,13.96C19,13.58 18.4,13.58 18,13.96L17,14.96V8C17,7.45 16.55,7 16,7C15.45,7 15,7.45 15,8V12H13V3C13,2.45 12.55,2 12,2C11.45,2 11,2.45 11,3V12H9V2Z" /></svg>
Â  Â  Â  <span>GESTO</span>
Â  Â  </div>

Â  Â  <div class="status-pill" :class="{ active: manosDetectadas.length > 0, loading: signoDetectado === 'Carregant model...' }">
Â  Â  Â  <span class="status-dot" />
Â  Â  Â  <span>{{ signoDetectado === 'Carregant model...' ? 'Carregant IA...' : manosDetectadas.length > 0 ? 'MÃ  detectada' : 'Esperant...' }}</span>
Â  Â  </div>

Â  Â  <transition name="hud-pop">
Â  Â  Â  <div v-if="signoDetectado && signoDetectado !== '' && signoDetectado !== 'MÃ  detectada...' && signoDetectado !== 'Carregant model...' && signoDetectado !== 'IA Llista!'" class="traduccion-hud">
Â  Â  Â  Â  <span class="hud-sign">{{ signoDetectado }}</span>
Â  Â  Â  Â  <span class="badge-ia">IA V2</span>
Â  Â  Â  </div>
Â  Â  </transition>

Â  Â  <DatasetCreator :hands-data="manosDetectadas" :video-element="videoRef" />

Â  Â  <div class="subtitles-zone">
Â  Â  Â  <transition name="fade-slide">
Â  Â  Â  Â  <div v-if="fraseIA" class="ia-result">
Â  Â  Â  Â  Â  <div class="ia-header">
Â  Â  Â  Â  Â  Â  <span class="ia-badge" :class="{ 'ia-badge-local': !fraseIAFontIA }">
Â  Â  Â  Â  Â  Â  Â  <svg
Â  Â  Â  Â  Â  Â  Â  Â  fill="none"
Â  Â  Â  Â  Â  Â  Â  Â  height="14"
Â  Â  Â  Â  Â  Â  Â  Â  stroke="currentColor"
Â  Â  Â  Â  Â  Â  Â  Â  stroke-linecap="round"
Â  Â  Â  Â  Â  Â  Â  Â  stroke-linejoin="round"
Â  Â  Â  Â  Â  Â  Â  Â  stroke-width="2"
Â  Â  Â  Â  Â  Â  Â  Â  style="margin-right:4px;"
Â  Â  Â  Â  Â  Â  Â  Â  viewBox="0 0 24 24"
Â  Â  Â  Â  Â  Â  Â  Â  width="14"
Â  Â  Â  Â  Â  Â  Â  ><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
Â  Â  Â  Â  Â  Â  Â  {{ fraseIAFontIA ? 'Gesto IA' : 'TraducciÃ³ directa' }}
Â  Â  Â  Â  Â  Â  </span>
Â  Â  Â  Â  Â  Â  <div class="ia-actions">
Â  Â  Â  Â  Â  Â  Â  <button title="Llegir" @click="speak(fraseIA)">ðŸ”Š</button>
Â  Â  Â  Â  Â  Â  Â  <button title="Tancar" @click="fraseIA = ''">âœ•</button>
Â  Â  Â  Â  Â  Â  </div>
Â  Â  Â  Â  Â  </div>
Â  Â  Â  Â  Â  <p class="ia-text">{{ fraseIA }}</p>
Â  Â  Â  Â  </div>
Â  Â  Â  </transition>

Â  Â  Â  <div v-if="bufferParaules.length > 0 || carregantGemini" class="words-panel">
Â  Â  Â  Â  <div class="words-meta">
Â  Â  Â  Â  Â  <span class="words-label">Signes detectats</span>
Â  Â  Â  Â  Â  <span class="words-count">{{ bufferParaules.length }}/15</span>
Â  Â  Â  Â  </div>
Â  Â  Â  Â  <div class="words-list">
Â  Â  Â  Â  Â  <transition-group class="words-inner" name="word-pop" tag="div">
Â  Â  Â  Â  Â  Â  <span v-for="(p, i) in bufferParaules" :key="i + p" class="word-chip">{{ p }}</span>
Â  Â  Â  Â  Â  </transition-group>
Â  Â  Â  Â  Â  <span v-if="carregantIA" class="loading-dots"><span>.</span><span>.</span><span>.</span></span>
Â  Â  Â  Â  </div>
Â  Â  Â  Â  <div class="phrase-actions">
Â  Â  Â  Â  Â  <button class="phrase-btn btn-delete" :disabled="bufferParaules.length === 0 || carregantIA" @click="borrarUltimaParaula">âŒ« Desfer</button>
Â  Â  Â  Â  Â  <button class="phrase-btn btn-clear" :disabled="bufferParaules.length === 0 || carregantIA" @click="netejarBuffer">âœ• Netejar</button>
Â  Â  Â  Â  Â  <button class="phrase-btn btn-speak" :disabled="bufferParaules.length === 0" @click="llegirBuffer">ðŸ”Š Llegir</button>
Â  Â  Â  Â  Â  <button class="phrase-btn btn-ia" :disabled="bufferParaules.length === 0 || carregantIA" @click="generarFraseIA">
            <span v-if="!carregantIA" class="btn-ia-content">
              <svg
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                style="margin-right:6px;"
                viewBox="0 0 24 24"
                width="16"
              ><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              Interpretar signes
            </span><span v-else class="btn-ia-content">
              <svg
                class="spinner"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                style="margin-right:6px;"
                viewBox="0 0 24 24"
                width="16"
              ><line x1="12" x2="12" y1="2" y2="6" /><line x1="12" x2="12" y1="18" y2="22" /><line x1="4.93" x2="7.76" y1="4.93" y2="7.76" /><line x1="16.24" x2="19.07" y1="16.24" y2="19.07" /><line x1="2" x2="6" y1="12" y2="12" /><line x1="18" x2="22" y1="12" y2="12" /><line x1="4.93" x2="7.76" y1="19.07" y2="16.24" /><line x1="16.24" x2="19.07" y1="7.76" y2="4.93" /></svg>
              Processant IA...
            </span>
Â  Â  Â  Â  Â  </button>
        </div>
      </div><div v-else class="buffer-hint">
        <span>âœ‹</span><p>Fes signes per construir frases</p>
      </div>
    </div>

Â  Â  <div class="controls-panel">
Â  Â  Â  <button class="ctrl-btn" title="Inici" @click="goHome">
Â  Â  Â  Â  <span class="ctrl-icon">ðŸ </span><span class="ctrl-label">Inici</span>
Â  Â  Â  </button>
Â  Â  Â  <div class="ctrl-divider" />
Â  Â  Â  <button class="ctrl-btn" :class="{ actiu: mostrarEsquelet }" title="Esquelet" @click="mostrarEsquelet = !mostrarEsquelet">
Â  Â  Â  Â  <span class="ctrl-icon">ðŸ‘ï¸</span><span class="ctrl-label">Esquelet</span>
Â  Â  Â  </button>
Â  Â  Â  <button class="ctrl-btn" title="Canviar cÃ mera" @click="switchCamera">
Â  Â  Â  Â  <span class="ctrl-icon">ðŸ”„</span><span class="ctrl-label">CÃ mera</span>
Â  Â  Â  </button>
Â  Â  </div>

Â  Â  <p v-if="error" class="error-msg">{{ error }}</p>
Â  </div>
</template>

<script setup>
Â  import { onBeforeUnmount, onMounted, ref } from 'vue'
Â  import { useRouter } from 'vue-router'
Â  import DatasetCreator from '@/components/DatasetCreator.vue'
Â  import DrawSkeleton from '../components/DrawSkeleton.vue'
Â  import LoadingSpinner from '../components/LoadingSpinner.vue'
Â  import { GestureService } from '../services/gestureservices2'

Â  const router = useRouter()
Â  const videoRef = ref(null)
Â  const error = ref(null)
Â  const facingMode = ref('user')
Â  let currentStream = null
Â  const carregant = ref(false)
Â  let gestureService = null
Â  const manosDetectadas = ref([])
Â  const signoDetectado = ref('Iniciant IA...')
Â  let animationFrameId = null
Â  const mostrarEsquelet = ref(false)
Â  const lastSpokenSigno = ref(null)

Â  const bufferParaules = ref([])
Â  const fraseIA = ref('')
Â  const fraseIAFontIA = ref(true)
Â  const carregantIA = ref(false)
Â  const ultimaParaulaAfegida = ref(null)
Â  const IA_API_URL = '/api/ia/generar-frase'

Â  function borrarUltimaParaula () {
Â  Â  bufferParaules.value.pop()
Â  Â  ultimaParaulaAfegida.value = bufferParaules.value.at(-1) ?? null
Â  }
Â  function netejarBuffer () {
Â  Â  bufferParaules.value = []
Â  Â  ultimaParaulaAfegida.value = null
Â  Â  fraseIA.value = ''
Â  }
Â  function llegirBuffer () {
Â  Â  if (bufferParaules.value.length > 0) {
Â  Â  Â  speak(bufferParaules.value.join(' '))
Â  Â  }
Â  }

Â  async function generarFraseIA () {
Â  Â  if (bufferParaules.value.length === 0 || carregantIA.value) return
Â  Â  carregantIA.value = true
Â  Â  fraseIA.value = ''
Â  Â  try {
Â  Â  Â  const res = await fetch(IA_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signes: bufferParaules.value }) })
Â  Â  Â  const data = await res.json()
Â  Â  Â  fraseIA.value = data.frase || 'âš ï¸ ' + (data.error || 'Error generant la frase')
Â  Â  Â  fraseIAFontIA.value = data.fontIA !== false
Â  Â  Â  if (data.frase) speak(data.frase)
Â  Â  } catch {
Â  Â  Â  fraseIA.value = 'âš ï¸ Error de connexiÃ³ amb el servidor'
Â  Â  } finally {
Â  Â  Â  carregantIA.value = false
Â  Â  }
Â  }

Â  function speak (text) {
Â  Â  if ('speechSynthesis' in window) {
Â  Â  Â  window.speechSynthesis.cancel()
Â  Â  Â  const u = new SpeechSynthesisUtterance(text)
Â  Â  Â  u.lang = 'ca-ES'
Â  Â  Â  u.rate = 1.2
Â  Â  Â  window.speechSynthesis.speak(u)
Â  Â  }
Â  }

Â  async function carregarIA () {
Â  Â  carregant.value = true
Â  Â  signoDetectado.value = 'Carregant model...'
Â  Â  if (gestureService) {
Â  Â  Â  gestureService.destroy()
Â  Â  Â  gestureService = null
Â  Â  }
Â  Â  try {
Â  Â  Â  gestureService = new GestureService()
Â  Â  Â  await gestureService.initialize()
Â  Â  Â  signoDetectado.value = 'IA Llista!'
Â  Â  } catch {
Â  Â  Â  signoDetectado.value = 'Error carregant IA'
Â  Â  } finally {
Â  Â  Â  carregant.value = false
Â  Â  }
Â  }

Â  async function startCamera () {
Â  Â  if (currentStream) for (const t of currentStream.getTracks()) t.stop()
Â  Â  try {
Â  Â  Â  const stream = await navigator.mediaDevices.getUserMedia({
Â  Â  Â  Â  video: {
Â  Â  Â  Â  Â  facingMode: facingMode.value,
Â  Â  Â  Â  Â  width: { ideal: 1920 },
Â  Â  Â  Â  Â  height: { ideal: 1080 },
Â  Â  Â  Â  },
Â  Â  Â  Â  audio: false,
Â  Â  Â  })
Â  Â  Â  currentStream = stream
Â  Â  Â  if (videoRef.value) {
Â  Â  Â  Â  videoRef.value.srcObject = stream
Â  Â  Â  Â  videoRef.value.addEventListener('loadeddata', () => {
Â  Â  Â  Â  Â  if (animationFrameId) {
Â  Â  Â  Â  Â  Â  cancelAnimationFrame(animationFrameId)
Â  Â  Â  Â  Â  }
Â  Â  Â  Â  Â  predictLoop()
Â  Â  Â  Â  })
Â  Â  Â  }
Â  Â  Â  error.value = null
Â  Â  } catch {
Â  Â  Â  error.value = 'No s\'ha pogut accedir a la cÃ mera. Verifica els permisos.'
Â  Â  }
Â  }

Â  function switchCamera () {
Â  Â  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
Â  Â  startCamera()
Â  }
Â  const goHome = () => router.push('/')

Â  function predictLoop () {
Â  Â  if (gestureService && !carregant.value && videoRef.value && videoRef.value.readyState === 4) {
Â  Â  Â  const result = gestureService.detect(videoRef.value, performance.now())
Â  Â  Â  if (result) {
Â  Â  Â  Â  manosDetectadas.value = result.hands || []
Â  Â  Â  Â  if (result.signo) {
Â  Â  Â  Â  Â  const s = result.signo
Â  Â  Â  Â  Â  if (s !== signoDetectado.value) {
Â  Â  Â  Â  Â  Â  signoDetectado.value = s
Â  Â  Â  Â  Â  Â  lastSpokenSigno.value = s
Â  Â  Â  Â  Â  }
Â  Â  Â  Â  Â  const valid = s !== 'none' && s !== 'MÃ  detectada' && s !== 'Esperant signes...'
Â  Â  Â  Â  Â  if (valid && s !== ultimaParaulaAfegida.value) {
Â  Â  Â  Â  Â  Â  bufferParaules.value.push(s)
Â  Â  Â  Â  Â  Â  ultimaParaulaAfegida.value = s
Â  Â  Â  Â  Â  Â  if (bufferParaules.value.length > 15) {
Â  Â  Â  Â  Â  Â  Â  bufferParaules.value.shift()
Â  Â  Â  Â  Â  Â  }
Â  Â  Â  Â  Â  }
Â  Â  Â  Â  } else {
Â  Â  Â  Â  Â  signoDetectado.value = manosDetectadas.value.length > 0 ? 'MÃ  detectada...' : ''
Â  Â  Â  Â  Â  lastSpokenSigno.value = null
Â  Â  Â  Â  Â  ultimaParaulaAfegida.value = null
Â  Â  Â  Â  }
Â  Â  Â  } else {
Â  Â  Â  Â  manosDetectadas.value = []
Â  Â  Â  Â  signoDetectado.value = ''
Â  Â  Â  Â  lastSpokenSigno.value = null
Â  Â  Â  Â  ultimaParaulaAfegida.value = null
Â  Â  Â  }
Â  Â  }
Â  Â  animationFrameId = requestAnimationFrame(predictLoop)
Â  }

Â  onMounted(async () => {
Â  Â  await carregarIA()
Â  Â  startCamera()
Â  })
Â  onBeforeUnmount(() => {
Â  Â  if (animationFrameId) cancelAnimationFrame(animationFrameId)
Â  Â  if (currentStream) for (const t of currentStream.getTracks()) t.stop()
Â  Â  if (gestureService) gestureService.destroy()
Â  })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

* { box-sizing: border-box; font-family: 'Inter', sans-serif; }

.camera-container {
Â  position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #000;
}
.fullscreen-video { width: 100%; height: 100%; object-fit: cover; display: block; }
.espejo { transform: scaleX(-1); }
.skeleton-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 5; }

.top-logo {
Â  position: absolute; top: 20px; left: 24px; z-index: 20;
Â  display: flex; align-items: center; gap: 8px;
Â  background: rgba(0,0,0,0.55); backdrop-filter: blur(12px);
Â  border: 1px solid rgba(255,255,255,0.1);
Â  padding: 10px 18px; border-radius: 40px;
Â  color: #fff; font-weight: 800; font-size: 1rem; letter-spacing: 2px;
}
.top-logo svg { width: 20px; height: 20px; fill: #00BFFF; }

.status-pill {
Â  position: absolute; top: 20px; right: 100px; z-index: 20;
Â  display: flex; align-items: center; gap: 8px;
Â  background: rgba(0,0,0,0.55); backdrop-filter: blur(12px);
Â  border: 1px solid rgba(255,255,255,0.1);
Â  padding: 10px 18px; border-radius: 40px;
Â  color: rgba(255,255,255,0.6); font-size: 0.85rem; font-weight: 600;
Â  transition: color 0.3s, border-color 0.3s;
}
.status-pill.active { color: #4ade80; border-color: rgba(74,222,128,0.3); }
.status-pill.loading { color: #facc15; border-color: rgba(250,204,21,0.3); }
.status-dot {
Â  width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3);
Â  transition: background 0.3s;
}
.status-pill.active .status-dot { background: #4ade80; box-shadow: 0 0 6px #4ade80; animation: pulse-dot 1.5s infinite; }
.status-pill.loading .status-dot { background: #facc15; }
@keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

.traduccion-hud {
Â  position: absolute; top: 90px; left: 50%; transform: translateX(-50%);
Â  z-index: 15; text-align: center;
Â  background: rgba(0,0,0,0.65); backdrop-filter: blur(16px);
Â  border: 1px solid rgba(0,191,255,0.3);
Â  padding: 16px 36px; border-radius: 24px;
Â  box-shadow: 0 0 30px rgba(0,191,255,0.15);
Â  display: flex; flex-direction: column; gap: 6px; align-items: center;
}
.hud-sign { font-size: 2.4rem; font-weight: 800; color: #fff; letter-spacing: 1px; }
.badge-ia { font-size: 0.75rem; font-weight: 700; color: #00BFFF; background: rgba(0,191,255,0.12); padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(0,191,255,0.3); }
.hud-pop-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.hud-pop-enter-from { opacity:0; transform: translateX(-50%) scale(0.8); }
.hud-pop-leave-active { transition: all 0.2s ease; }
.hud-pop-leave-to { opacity:0; transform: translateX(-50%) scale(0.9); }

.subtitles-zone {
Â  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
Â  width: min(92%, 780px); z-index: 15;
Â  display: flex; flex-direction: column; gap: 12px; align-items: stretch;
}

.ia-result {
Â  background: linear-gradient(135deg, rgba(10,40,60,0.95), rgba(5,15,25,0.98));
Â  border: 1px solid rgba(0,191,255,0.4);
Â  border-radius: 18px; padding: 16px 20px;
Â  backdrop-filter: blur(14px);
Â  box-shadow: 0 4px 30px rgba(0,191,255,0.25);
Â  animation: ia-glow 3s ease-in-out infinite alternate;
}
@keyframes ia-glow {
Â  from { box-shadow: 0 4px 20px rgba(0,191,255,0.2); }
Â  toÂ  Â { box-shadow: 0 6px 36px rgba(0,255,180,0.4); border-color: rgba(0,255,180,0.5); }
}
.ia-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ia-badge {
Â  display: flex; align-items: center;
Â  font-size: 0.8rem; font-weight: 700; color: #00ffb4;
Â  background: rgba(0,255,180,0.1); padding: 4px 12px;
Â  border-radius: 20px; border: 1px solid rgba(0,255,180,0.3);
}
.ia-badge-local {
Â  color: #94a3b8;
Â  background: rgba(148,163,184,0.1);
Â  border-color: rgba(148,163,184,0.3);
}
.ia-actions { display: flex; gap: 8px; }
.ia-actions button {
Â  background: rgba(255,255,255,0.1); border: none; color: #fff;
Â  border-radius: 50%; width: 32px; height: 32px;
Â  cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease;
Â  display: flex; align-items: center; justify-content: center;
}
.ia-actions button:hover { background: rgba(0,191,255,0.2); color: #00BFFF; transform: scale(1.1); }
.ia-text {
Â  margin: 0; color: #e0f2fe; font-size: 1.3rem;
Â  font-weight: 600; line-height: 1.5; letter-spacing: 0.3px;
}

.words-panel {
Â  background: rgba(5,5,20,0.78); backdrop-filter: blur(14px);
Â  border: 1px solid rgba(255,255,255,0.08);
Â  border-radius: 18px; padding: 14px 18px;
Â  display: flex; flex-direction: column; gap: 12px;
}
.words-meta { display: flex; justify-content: space-between; align-items: center; }
.words-label { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; }
.words-count { font-size: 0.78rem; color: rgba(255,255,255,0.3); font-family: monospace; }
.words-list { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; min-height: 36px; }
.words-inner { display: flex; flex-wrap: wrap; gap: 8px; }
.word-chip {
Â  background: linear-gradient(135deg, #1d6eff, #7c3aed);
Â  color: #fff; padding: 6px 14px; border-radius: 20px;
Â  font-size: 0.95rem; font-weight: 600; white-space: nowrap;
Â  box-shadow: 0 2px 8px rgba(29,110,255,0.3);
}
.loading-dots { display: flex; gap: 3px; color: #a78bfa; font-size: 1.6rem; }
.loading-dots span { animation: blink 1.2s infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%,80%,100% { opacity:.2; } 40% { opacity:1; } }

.phrase-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.phrase-btn {
Â  border: none; border-radius: 10px; padding: 8px 16px;
Â  font-size: 0.88rem; font-weight: 700; cursor: pointer;
Â  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
Â  white-space: nowrap;
}
.phrase-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.phrase-btn:not(:disabled):hover { transform: translateY(-2px); }
.phrase-btn:not(:disabled):active { transform: scale(0.95); }
.btn-delete { background: rgba(239,68,68,0.8); color: #fff; }
.btn-delete:not(:disabled):hover { box-shadow: 0 4px 14px rgba(239,68,68,0.5); }
.btn-clear { background: rgba(100,100,120,0.7); color: #fff; }
.btn-speak { background: rgba(34,197,94,0.8); color: #fff; }
.btn-speak:not(:disabled):hover { box-shadow: 0 4px 14px rgba(34,197,94,0.5); }
.btn-ia {
Â  background: linear-gradient(135deg, #0284c7, #0d9488);
Â  color: #fff; flex: 1; justify-content: center;
Â  box-shadow: 0 2px 14px rgba(2,132,199,0.4);
Â  position: relative; overflow: hidden;
}
.btn-ia:not(:disabled):hover { box-shadow: 0 4px 22px rgba(13,148,136,0.6); }
.btn-ia-content { display: flex; align-items: center; justify-content: center; }
.spinner { animation: spin 1.5s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

.buffer-hint {
Â  display: flex; align-items: center; justify-content: center; gap: 10px;
Â  color: rgba(255,255,255,0.3); font-size: 0.9rem; padding: 14px;
Â  background: rgba(0,0,0,0.35); backdrop-filter: blur(8px);
Â  border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;
}
.buffer-hint p { margin: 0; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity 0.4s, transform 0.4s; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(10px); }
.word-pop-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.word-pop-enter-from { opacity:0; transform: scale(0.5); }
.word-pop-leave-active { transition: all 0.2s ease; }
.word-pop-leave-to { opacity:0; transform: scale(0.7); }

.controls-panel {
Â  position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
Â  z-index: 20; display: flex; flex-direction: column; align-items: center; gap: 6px;
Â  background: rgba(0,0,0,0.6); backdrop-filter: blur(16px);
Â  border: 1px solid rgba(255,255,255,0.08);
Â  padding: 12px 8px; border-radius: 24px;
}
.ctrl-divider { width: 32px; height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0; }
.ctrl-btn {
Â  display: flex; flex-direction: column; align-items: center; gap: 4px;
Â  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
Â  border-radius: 14px; width: 60px; padding: 10px 6px;
Â  cursor: pointer; transition: background 0.2s, transform 0.15s, border-color 0.2s;
Â  color: rgba(255,255,255,0.7);
}
.ctrl-btn:hover { background: rgba(255,255,255,0.14); transform: scale(1.05); }
.ctrl-btn:active { transform: scale(0.95); }
.ctrl-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.ctrl-btn.actiu { background: rgba(0,191,255,0.18); border-color: rgba(0,191,255,0.4); color: #00BFFF; }
.ctrl-icon { font-size: 1.4rem; line-height: 1; }
.ctrl-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

.error-msg {
Â  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
Â  color: #fff; background: rgba(220,38,38,0.85); backdrop-filter: blur(8px);
Â  padding: 20px 30px; border-radius: 12px; text-align: center; z-index: 30;
}

.loading-overlay {
Â  position: absolute; inset: 0; z-index: 100;
Â  background: rgba(0,0,0,0.85); backdrop-filter: blur(20px);
Â  display: flex; flex-direction: column; align-items: center; justify-content: center;
Â  color: #fff; text-align: center;
}
.loading-overlay p {
Â  margin-top: 24px; font-size: 1.2rem; font-weight: 600; color: #00BFFF;
Â  letter-spacing: 1px; animation: pulse-text 2s infinite;
}
@keyframes pulse-text { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>

