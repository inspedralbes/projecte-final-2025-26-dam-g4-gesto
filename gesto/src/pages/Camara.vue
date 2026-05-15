<template>
  <div class="camera-container">
    <video
      ref="videoRef"
      autoplay
      class="fullscreen-video"
      :class="{ espejo: facingMode === 'user' }"
      muted
      playsinline
    />
    <DrawSkeleton v-if="mostrarEsquelet && rol === 'administrador'" class="skeleton-overlay" :es-frontal="facingMode === 'user'" :hands-data="manosDetectadas" />

    <div v-if="carregant" class="loading-overlay">
      <LoadingSpinner />
      <p>Configurant la Intel·ligència Artificial...</p>
    </div>

    <div class="top-logo">
      <svg viewBox="0 0 24 24"><path d="M9,2C7.9,2 7,2.9 7,4V17H5V5C5,4.45 4.55,4 4,4C3.45,4 3,4.45 3,5V17C3,19.2 4.8,21 7,21H13.5C15.42,21 17.55,20.03 18.9,18.66L20.8,16.76C21.18,16.38 21.18,15.75 20.8,15.36L19.4,13.96C19,13.58 18.4,13.58 18,13.96L17,14.96V8C17,7.45 16.55,7 16,7C15.45,7 15,7.45 15,8V12H13V3C13,2.45 12.55,2 12,2C11.45,2 11,2.45 11,3V12H9V2Z" /></svg>
      <span>GESTO</span>
    </div>

    <div class="status-pill" :class="{ active: manosDetectadas.length > 0, loading: signoDetectado === 'Carregant model...' }">
      <span class="status-dot" />
      <span>{{ signoDetectado === 'Carregant model...' ? 'Carregant IA...' : manosDetectadas.length > 0 ? 'Mà detectada' : 'Esperant...' }}</span>
    </div>

    <transition name="hud-pop">
      <div v-if="signoDetectado && signoDetectado !== '' && signoDetectado !== 'Mà detectada...' && signoDetectado !== 'Carregant model...' && signoDetectado !== 'IA Llista!'" class="traduccion-hud">
        <span class="hud-sign">{{ signoDetectado }}</span>
        <span class="badge-ia">IA V2</span>
      </div>
    </transition>

    <DatasetCreator v-if="rol === 'administrador'" :hands-data="manosDetectadas" :video-element="videoRef" />

    <div class="subtitles-zone">
      <transition name="fade-slide">
        <div v-if="fraseIA" class="ia-result">
          <div class="ia-header">
            <span class="ia-badge" :class="{ 'ia-badge-local': !fraseIAFontIA }">
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                style="margin-right:4px;"
                viewBox="0 0 24 24"
                width="14"
              ><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              {{ fraseIAFontIA ? 'Gesto IA' : 'Traducció directa' }}
            </span>
            <div class="ia-actions">
              <button title="Llegir" @click="speak(fraseIA)">🔊</button>
              <button title="Tancar" @click="fraseIA = ''">✕</button>
            </div>
          </div>
          <p class="ia-text">{{ fraseIA }}</p>
        </div>
      </transition>

      <div v-if="bufferParaules.length > 0 || carregantGemini" class="words-panel">
        <div class="words-meta">
          <span class="words-label">Signes detectats</span>
          <span class="words-count">{{ bufferParaules.length }}/15</span>
        </div>
        <div class="words-list">
          <transition-group class="words-inner" name="word-pop" tag="div">
            <span v-for="(p, i) in bufferParaules" :key="i + p" class="word-chip">{{ p }}</span>
          </transition-group>
          <span v-if="carregantIA" class="loading-dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
        <div class="phrase-actions">
          <button class="phrase-btn btn-delete" :disabled="bufferParaules.length === 0 || carregantIA" @click="borrarUltimaParaula">⌫ Desfer</button>
          <button class="phrase-btn btn-clear" :disabled="bufferParaules.length === 0 || carregantIA" @click="netejarBuffer">✕ Netejar</button>
          <button class="phrase-btn btn-speak" :disabled="bufferParaules.length === 0" @click="llegirBuffer">🔊 Llegir</button>
          <button class="phrase-btn btn-ia" :disabled="bufferParaules.length === 0 || carregantIA" @click="generarFraseIA">
            <span v-if="!carregantIA" class="btn-ia-content">
                <svg fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" style="margin-right:6px;" viewBox="0 0 24 24" width="16">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Interpretar signes
            </span>
            <span v-else class="btn-ia-content">
                <svg class="spinner" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" style="margin-right:6px;" viewBox="0 0 24 24" width="16">
                <line x1="12" x2="12" y1="2" y2="6" /><line x1="12" x2="12" y1="18" y2="22" /><line x1="4.93" x2="7.76" y1="4.93" y2="7.76" /><line x1="16.24" x2="19.07" y1="16.24" y2="19.07" /><line x1="2" x2="6" y1="12" y2="12" /><line x1="18" x2="22" y1="12" y2="12" /><line x1="4.93" x2="7.76" y1="19.07" y2="16.24" /><line x1="16.24" x2="19.07" y1="7.76" y2="4.93" />
                </svg>
                Processant IA...
            </span>
            </button>
        </div>
      </div>

      <div v-else class="buffer-hint">
        <svg fill="none" height="22" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="22"><path d="M18 11V6.5a2.5 2.5 0 0 0-5 0v7m-5.5-7a2.5 2.5 0 0 0-5 0V16a7 7 0 0 0 14 0v-5" /></svg>
        <p>Fes signes per construir frases</p>
      </div>
    </div>

    <nav class="controls-panel">
      <button class="ctrl-btn" title="Inici" @click="goHome">
        <svg fill="none" height="22" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="22"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><polyline points="9 21 9 12 15 12 15 21" /></svg>
        <span class="ctrl-label">Inici</span>
      </button>
      <div class="ctrl-divider" />
      <button v-if="rol === 'administrador'" class="ctrl-btn" :class="{ actiu: mostrarEsquelet }" title="Esquelet" @click="mostrarEsquelet = !mostrarEsquelet">
        <svg fill="none" height="22" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="22"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
        <span class="ctrl-label">Esquelet</span>
      </button>
      <button class="ctrl-btn" title="Canviar càmera" @click="switchCamera">
        <svg fill="none" height="22" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="22"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
        <span class="ctrl-label">Càmera</span>
      </button>
    </nav>

    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import DatasetCreator from '@/components/DatasetCreator.vue'
  import DrawSkeleton from '../components/DrawSkeleton.vue'
  import LoadingSpinner from '../components/LoadingSpinner.vue'
  import { GestureService } from '../services/gestureservices2'

  const router = useRouter()
  const videoRef = ref(null)
  const error = ref(null)
  const facingMode = ref('user')
  let currentStream = null
  const carregant = ref(false)
  let gestureService = null
  const manosDetectadas = ref([])
  const signoDetectado = ref('Iniciant IA...')
  let animationFrameId = null
  const mostrarEsquelet = ref(false)
  const lastSpokenSigno = ref(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const rol = ref(user.rol || 'usuari')

  const bufferParaules = ref([])
  const fraseIA = ref('')
  const fraseIAFontIA = ref(true)
  const carregantIA = ref(false)
  const ultimaParaulaAfegida = ref(null)
  const IA_API_URL = `${import.meta.env.VITE_API_URL}/api/ia/generar-frase`

  function borrarUltimaParaula () {
    bufferParaules.value.pop()
    ultimaParaulaAfegida.value = bufferParaules.value.at(-1) ?? null
  }
  function netejarBuffer () {
    bufferParaules.value = []
    ultimaParaulaAfegida.value = null
    fraseIA.value = ''
  }
  function llegirBuffer () {
    if (bufferParaules.value.length > 0) {
      speak(bufferParaules.value.join(' '))
    }
  }

  async function generarFraseIA () {
    if (bufferParaules.value.length === 0 || carregantIA.value) return
    carregantIA.value = true
    fraseIA.value = ''
    try {
      const res = await fetch(IA_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signes: bufferParaules.value }) })
      const data = await res.json()
      fraseIA.value = data.frase || '⚠️ ' + (data.error || 'Error generant la frase')
      fraseIAFontIA.value = data.fontIA !== false
      if (data.frase) speak(data.frase)
    } catch {
      fraseIA.value = '⚠️ Error de connexió amb el servidor'
    } finally {
      carregantIA.value = false
    }
  }

  function speak (text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'ca-ES'
      u.rate = 1.2
      window.speechSynthesis.speak(u)
    }
  }

  async function carregarIA () {
    carregant.value = true
    signoDetectado.value = 'Carregant model...'
    if (gestureService) {
      gestureService.destroy()
      gestureService = null
    }
    try {
      gestureService = new GestureService()
      await gestureService.initialize()
      signoDetectado.value = 'IA Llista!'
    } catch {
      signoDetectado.value = 'Error carregant IA'
    } finally {
      carregant.value = false
    }
  }

  async function startCamera () {
    if (currentStream) for (const t of currentStream.getTracks()) t.stop()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode.value,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })
      currentStream = stream
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        videoRef.value.addEventListener('loadeddata', () => {
          if (animationFrameId) cancelAnimationFrame(animationFrameId)
          predictLoop()
        }, { once: true })
      }
      error.value = null
    } catch {
      error.value = 'No s\'ha pogut accedir a la càmera. Verifica els permisos.'
    }
  }

  function switchCamera () {
    facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
    startCamera()
  }
  const goHome = () => router.push('/')

  // Throttle: cap AI inference to 15 fps to save CPU/GPU on mobile
  const TARGET_FPS = 15
  const FRAME_INTERVAL = 1000 / TARGET_FPS
  let lastFrameTime = 0
  let gestoCooldownUntil = 0
  const GESTO_COOLDOWN_MS = 1200 // ms before the same sign can be added again

  function predictLoop (timestamp = 0) {
    animationFrameId = requestAnimationFrame(predictLoop)

    // Skip frame if we're within the interval
    if (timestamp - lastFrameTime < FRAME_INTERVAL) return
    lastFrameTime = timestamp

    if (!gestureService || carregant.value || !videoRef.value || videoRef.value.readyState < 3) return

    const now = performance.now()
    const result = gestureService.detect(videoRef.value, now)
    if (result) {
      manosDetectadas.value = result.hands || []
      if (result.signo) {
        const s = result.signo
        if (s !== signoDetectado.value) signoDetectado.value = s
        const valid = s !== 'none' && s !== 'Mà detectada' && s !== 'Esperant signes...'
        if (valid && s !== ultimaParaulaAfegida.value && now > gestoCooldownUntil) {
          bufferParaules.value.push(s)
          if (bufferParaules.value.length > 15) bufferParaules.value.shift()
          ultimaParaulaAfegida.value = s
          gestoCooldownUntil = now + GESTO_COOLDOWN_MS
        }
      } else {
        signoDetectado.value = manosDetectadas.value.length > 0 ? 'Mà detectada...' : ''
        ultimaParaulaAfegida.value = null
      }
    } else {
      manosDetectadas.value = []
      signoDetectado.value = ''
      ultimaParaulaAfegida.value = null
    }
  }

  onMounted(async () => {
    await carregarIA()
    startCamera()
  })
  onBeforeUnmount(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    if (currentStream) for (const t of currentStream.getTracks()) t.stop()
    if (gestureService) gestureService.destroy()
  })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

* { box-sizing: border-box; font-family: 'Inter', sans-serif; }

.camera-container {
  position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #000;
}
.fullscreen-video { width: 100%; height: 100%; object-fit: cover; display: block; }
.espejo { transform: scaleX(-1); }
.skeleton-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 5; }

.top-logo {
  position: absolute; top: 20px; left: 24px; z-index: 20;
  display: flex; align-items: center; gap: 8px;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 10px 18px; border-radius: 40px;
  color: #fff; font-weight: 800; font-size: 1rem; letter-spacing: 2px;
}
.top-logo svg { width: 20px; height: 20px; fill: #00BFFF; }

.status-pill {
  position: absolute; top: 20px; right: 100px; z-index: 20;
  display: flex; align-items: center; gap: 8px;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 10px 18px; border-radius: 40px;
  color: rgba(255,255,255,0.6); font-size: 0.85rem; font-weight: 600;
  transition: color 0.3s, border-color 0.3s;
}
.status-pill.active { color: #4ade80; border-color: rgba(74,222,128,0.3); }
.status-pill.loading { color: #facc15; border-color: rgba(250,204,21,0.3); }
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3);
  transition: background 0.3s;
}
.status-pill.active .status-dot { background: #4ade80; box-shadow: 0 0 6px #4ade80; animation: pulse-dot 1.5s infinite; }
.status-pill.loading .status-dot { background: #facc15; }
@keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

.traduccion-hud {
  position: absolute; top: 90px; left: 50%; transform: translateX(-50%);
  z-index: 15; text-align: center;
  background: rgba(0,0,0,0.65); backdrop-filter: blur(16px);
  border: 1px solid rgba(0,191,255,0.3);
  padding: 16px 36px; border-radius: 24px;
  box-shadow: 0 0 30px rgba(0,191,255,0.15);
  display: flex; flex-direction: column; gap: 6px; align-items: center;
}
.hud-sign { font-size: 2.4rem; font-weight: 800; color: #fff; letter-spacing: 1px; }
.badge-ia { font-size: 0.75rem; font-weight: 700; color: #00BFFF; background: rgba(0,191,255,0.12); padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(0,191,255,0.3); }
.hud-pop-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.hud-pop-enter-from { opacity:0; transform: translateX(-50%) scale(0.8); }
.hud-pop-leave-active { transition: all 0.2s ease; }
.hud-pop-leave-to { opacity:0; transform: translateX(-50%) scale(0.9); }

.subtitles-zone {
  position: absolute; bottom: 90px; left: 50%; transform: translateX(-50%);
  width: min(92%, 780px); z-index: 15;
  display: flex; flex-direction: column; gap: 12px; align-items: stretch;
}

.ia-result {
  background: linear-gradient(135deg, rgba(10,40,60,0.95), rgba(5,15,25,0.98));
  border: 1px solid rgba(0,191,255,0.4);
  border-radius: 18px; padding: 16px 20px;
  backdrop-filter: blur(14px);
  box-shadow: 0 4px 30px rgba(0,191,255,0.25);
  animation: ia-glow 3s ease-in-out infinite alternate;
}
@keyframes ia-glow {
  from { box-shadow: 0 4px 20px rgba(0,191,255,0.2); }
  to   { box-shadow: 0 6px 36px rgba(0,255,180,0.4); border-color: rgba(0,255,180,0.5); }
}
.ia-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ia-badge {
  display: flex; align-items: center;
  font-size: 0.8rem; font-weight: 700; color: #00ffb4;
  background: rgba(0,255,180,0.1); padding: 4px 12px;
  border-radius: 20px; border: 1px solid rgba(0,255,180,0.3);
}
.ia-badge-local {
  color: #94a3b8;
  background: rgba(148,163,184,0.1);
  border-color: rgba(148,163,184,0.3);
}
.ia-actions { display: flex; gap: 8px; }
.ia-actions button {
  background: rgba(255,255,255,0.1); border: none; color: #fff;
  border-radius: 50%; width: 32px; height: 32px;
  cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease;
  display: flex; align-items: center; justify-content: center;
}
.ia-actions button:hover { background: rgba(0,191,255,0.2); color: #00BFFF; transform: scale(1.1); }
.ia-text {
  margin: 0; color: #e0f2fe; font-size: 1.3rem;
  font-weight: 600; line-height: 1.5; letter-spacing: 0.3px;
}

.words-panel {
  background: rgba(5,5,20,0.78); backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px; padding: 14px 18px;
  display: flex; flex-direction: column; gap: 12px;
}
.words-meta { display: flex; justify-content: space-between; align-items: center; }
.words-label { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; }
.words-count { font-size: 0.78rem; color: rgba(255,255,255,0.3); font-family: monospace; }
.words-list { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; min-height: 36px; }
.words-inner { display: flex; flex-wrap: wrap; gap: 8px; }
.word-chip {
  background: linear-gradient(135deg, #1d6eff, #7c3aed);
  color: #fff; padding: 6px 14px; border-radius: 20px;
  font-size: 0.95rem; font-weight: 600; white-space: nowrap;
  box-shadow: 0 2px 8px rgba(29,110,255,0.3);
}
.loading-dots { display: flex; gap: 3px; color: #a78bfa; font-size: 1.6rem; }
.loading-dots span { animation: blink 1.2s infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%,80%,100% { opacity:.2; } 40% { opacity:1; } }

.phrase-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.phrase-btn {
  border: none; border-radius: 10px; padding: 8px 16px;
  font-size: 0.88rem; font-weight: 700; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
  white-space: nowrap;
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
  background: linear-gradient(135deg, #0284c7, #0d9488);
  color: #fff; flex: 1; justify-content: center;
  box-shadow: 0 2px 14px rgba(2,132,199,0.4);
  position: relative; overflow: hidden;
}
.btn-ia:not(:disabled):hover { box-shadow: 0 4px 22px rgba(13,148,136,0.6); }
.btn-ia-content { display: flex; align-items: center; justify-content: center; }
.spinner { animation: spin 1.5s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

.buffer-hint {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  color: rgba(255,255,255,0.3); font-size: 0.9rem; padding: 14px;
  background: rgba(0,0,0,0.35); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;
}
.buffer-hint p { margin: 0; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity 0.4s, transform 0.4s; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(10px); }
.word-pop-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.word-pop-enter-from { opacity:0; transform: scale(0.5); }
.word-pop-leave-active { transition: all 0.2s ease; }
.word-pop-leave-to { opacity:0; transform: scale(0.7); }

.controls-panel {
  position: absolute; bottom: 0; left: 0; right: 0;
  z-index: 20; display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 0;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(18px);
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 8px 12px; padding-bottom: calc(8px + env(safe-area-inset-bottom));
}
.ctrl-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.1); margin: 0 4px; }
.ctrl-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: none; border: none;
  border-radius: 14px; flex: 1; padding: 10px 6px;
  cursor: pointer; transition: background 0.2s, transform 0.15s;
  color: rgba(255,255,255,0.65);
  min-width: 60px; max-width: 90px;
  -webkit-tap-highlight-color: transparent;
}
.ctrl-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.1); }
.ctrl-btn.actiu { color: #00BFFF; }
.ctrl-btn svg { transition: transform 0.2s; }
.ctrl-btn:active svg { transform: scale(0.85); }
.ctrl-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

.error-msg {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  color: #fff; background: rgba(220,38,38,0.85); backdrop-filter: blur(8px);
  padding: 20px 30px; border-radius: 12px; text-align: center; z-index: 30;
}

.loading-overlay {
  position: absolute; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(20px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #fff; text-align: center;
}
.loading-overlay p {
  margin-top: 24px; font-size: 1.2rem; font-weight: 600; color: #00BFFF;
  letter-spacing: 1px; animation: pulse-text 2s infinite;
}
@keyframes pulse-text { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>