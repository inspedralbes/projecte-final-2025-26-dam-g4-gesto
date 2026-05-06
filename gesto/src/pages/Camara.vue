<template>
  <div class="camera-container">
    <video ref="videoRef" autoplay muted playsinline class="fullscreen-video" :class="{ espejo: facingMode === 'user' }"></video>
    <DrawSkeleton class="skeleton-overlay" v-if="mostrarEsquelet" :handsData="manosDetectadas" :esFrontal="facingMode === 'user'" />

    <!-- Logo top-left -->
    <div class="top-logo">
      <svg viewBox="0 0 24 24"><path d="M9,2C7.9,2 7,2.9 7,4V17H5V5C5,4.45 4.55,4 4,4C3.45,4 3,4.45 3,5V17C3,19.2 4.8,21 7,21H13.5C15.42,21 17.55,20.03 18.9,18.66L20.8,16.76C21.18,16.38 21.18,15.75 20.8,15.36L19.4,13.96C19,13.58 18.4,13.58 18,13.96L17,14.96V8C17,7.45 16.55,7 16,7C15.45,7 15,7.45 15,8V12H13V3C13,2.45 12.55,2 12,2C11.45,2 11,2.45 11,3V12H9V2Z"/></svg>
      <span>GESTO</span>
    </div>

    <!-- Status pill top-right -->
    <div class="status-pill" :class="{ active: manosDetectadas.length > 0, loading: signoDetectado === 'Carregant model...' }">
      <span class="status-dot"></span>
      <span>{{ signoDetectado === 'Carregant model...' ? 'Carregant IA...' : manosDetectadas.length > 0 ? 'Mà detectada' : 'Esperant...' }}</span>
    </div>

    <!-- HUD signe detectat -->
    <transition name="hud-pop">
      <div class="traduccion-hud" v-if="signoDetectado && signoDetectado !== '' && signoDetectado !== 'Mà detectada...' && signoDetectado !== 'Carregant model...' && signoDetectado !== 'IA Llista!'">
        <span class="hud-sign">{{ signoDetectado }}</span>
        <span class="badge-ia">{{ usantIAv2 ? 'IA V2' : 'IA V1' }}</span>
      </div>
    </transition>

    <DatasetCreator :videoElement="videoRef" :usantIAv2="usantIAv2" :handsData="manosDetectadas" />

    <!-- Zona subtítols / frases -->
    <div class="subtitles-zone">
      <transition name="fade-slide">
        <div class="gemini-result" v-if="fraseGemini">
          <div class="gemini-header">
            <span class="gemini-badge">✨ Gemini</span>
            <div class="gemini-actions">
              <button @click="speak(fraseGemini)" title="Llegir">🔊</button>
              <button @click="fraseGemini = ''" title="Tancar">✕</button>
            </div>
          </div>
          <p class="gemini-text">{{ fraseGemini }}</p>
        </div>
      </transition>

      <div class="words-panel" v-if="bufferParaules.length > 0 || carregantGemini">
        <div class="words-meta">
          <span class="words-label">Signes detectats</span>
          <span class="words-count">{{ bufferParaules.length }}/15</span>
        </div>
        <div class="words-list">
          <transition-group name="word-pop" tag="div" class="words-inner">
            <span v-for="(p, i) in bufferParaules" :key="i + p" class="word-chip">{{ p }}</span>
          </transition-group>
          <span v-if="carregantGemini" class="loading-dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
        <div class="phrase-actions">
          <button class="phrase-btn btn-delete" @click="borrarUltimaParaula" :disabled="bufferParaules.length === 0 || carregantGemini">⌫ Desfer</button>
          <button class="phrase-btn btn-clear" @click="netejarBuffer" :disabled="bufferParaules.length === 0 || carregantGemini">✕ Netejar</button>
          <button class="phrase-btn btn-speak" @click="llegirBuffer" :disabled="bufferParaules.length === 0">🔊 Llegir</button>
          <button class="phrase-btn btn-gemini" @click="generarFraseGemini" :disabled="bufferParaules.length === 0 || carregantGemini">
            <span v-if="!carregantGemini">✨ Generar frase</span>
            <span v-else>⏳ Generant...</span>
          </button>
        </div>
      </div>

      <div class="buffer-hint" v-else>
        <span>✋</span><p>Fes signes per construir frases</p>
      </div>
    </div>

    <!-- Controls panel lateral dret -->
    <div class="controls-panel">
      <button class="ctrl-btn" @click="goHome" title="Inici">
        <span class="ctrl-icon">🏠</span><span class="ctrl-label">Inici</span>
      </button>
      <div class="ctrl-divider"></div>
      <button class="ctrl-btn" :class="{ actiu: mostrarEsquelet }" @click="mostrarEsquelet = !mostrarEsquelet" title="Esquelet">
        <span class="ctrl-icon">👁️</span><span class="ctrl-label">Esquelet</span>
      </button>
      <button class="ctrl-btn" @click="switchCamera" title="Canviar càmera">
        <span class="ctrl-icon">🔄</span><span class="ctrl-label">Càmera</span>
      </button>
      <button class="ctrl-btn" :class="{ actiu: usantIAv2 }" @click="canviarIA" :disabled="carregant" title="Model IA">
        <span class="ctrl-icon">🧠</span><span class="ctrl-label">{{ usantIAv2 ? 'V2' : 'V1' }}</span>
      </button>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { GestureService as GestureServiceOriginal } from '../services/GestureService';
import { GestureService as GestureServiceV2 } from '../services/gestureservices2';
import DrawSkeleton from '../components/DrawSkeleton.vue';
import DatasetCreator from '@/components/DatasetCreator.vue';

const router = useRouter();
const videoRef = ref(null);
const error = ref(null);
const facingMode = ref('user');
let currentStream = null;
const usantIAv2 = ref(true);
const carregant = ref(false);
let gestureService = null;
const manosDetectadas = ref([]);
const signoDetectado = ref('Iniciant IA...');
let animationFrameId = null;
const mostrarEsquelet = ref(false);
const lastSpokenSigno = ref(null);

// Sistema de frases
const bufferParaules = ref([]);
const fraseGemini = ref('');
const carregantGemini = ref(false);
const ultimaParaulaAfegida = ref(null);
const GEMINI_API_URL = 'http://localhost:5000/api/gemini/generar-frase';

const borrarUltimaParaula = () => {
  bufferParaules.value.pop();
  ultimaParaulaAfegida.value = bufferParaules.value[bufferParaules.value.length - 1] ?? null;
};
const netejarBuffer = () => { bufferParaules.value = []; ultimaParaulaAfegida.value = null; fraseGemini.value = ''; };
const llegirBuffer = () => { if (bufferParaules.value.length) speak(bufferParaules.value.join(' ')); };

const generarFraseGemini = async () => {
  if (!bufferParaules.value.length || carregantGemini.value) return;
  carregantGemini.value = true;
  fraseGemini.value = '';
  try {
    const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signes: bufferParaules.value }) });
    const data = await res.json();
    fraseGemini.value = data.frase || '⚠️ ' + (data.error || 'Error generant la frase');
    if (data.frase) speak(data.frase);
  } catch (e) {
    fraseGemini.value = '⚠️ Error de connexió amb el servidor';
  } finally {
    carregantGemini.value = false;
  }
};

const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ca-ES'; u.rate = 1.2;
    window.speechSynthesis.speak(u);
  }
};

const carregarIA = async () => {
  carregant.value = true;
  signoDetectado.value = 'Carregant model...';
  if (gestureService) { gestureService.destroy(); gestureService = null; }
  try {
    gestureService = usantIAv2.value ? new GestureServiceV2() : new GestureServiceOriginal();
    await gestureService.initialize();
    signoDetectado.value = 'IA Llista!';
  } catch (e) {
    signoDetectado.value = 'Error carregant IA';
  } finally {
    carregant.value = false;
  }
};

const canviarIA = async () => { usantIAv2.value = !usantIAv2.value; await carregarIA(); };

const startCamera = async () => {
  if (currentStream) currentStream.getTracks().forEach(t => t.stop());
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode.value, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    currentStream = stream;
    if (videoRef.value) { videoRef.value.srcObject = stream; videoRef.value.onloadeddata = () => { if (animationFrameId) cancelAnimationFrame(animationFrameId); predictLoop(); }; }
    error.value = null;
  } catch (err) {
    error.value = "No s'ha pogut accedir a la càmera. Verifica els permisos.";
  }
};

const switchCamera = () => { facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'; startCamera(); };
const goHome = () => router.push('/');

const predictLoop = () => {
  if (gestureService && !carregant.value && videoRef.value && videoRef.value.readyState === 4) {
    const result = gestureService.detect(videoRef.value, performance.now());
    if (result) {
      manosDetectadas.value = result.hands || [];
      if (result.signo) {
        const s = result.signo;
        if (s !== signoDetectado.value) { signoDetectado.value = s; lastSpokenSigno.value = s; }
        const valid = s !== 'none' && s !== 'Mà detectada' && s !== 'Esperant signes...';
        if (valid && s !== ultimaParaulaAfegida.value) {
          bufferParaules.value.push(s);
          ultimaParaulaAfegida.value = s;
          if (bufferParaules.value.length > 15) bufferParaules.value.shift();
        }
      } else {
        signoDetectado.value = manosDetectadas.value.length > 0 ? 'Mà detectada...' : '';
        lastSpokenSigno.value = null;
        ultimaParaulaAfegida.value = null;
      }
    } else {
      manosDetectadas.value = []; signoDetectado.value = ''; lastSpokenSigno.value = null; ultimaParaulaAfegida.value = null;
    }
  }
  animationFrameId = requestAnimationFrame(predictLoop);
};

onMounted(async () => { await carregarIA(); startCamera(); });
onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (currentStream) currentStream.getTracks().forEach(t => t.stop());
  if (gestureService) gestureService.destroy();
});
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

/* ── TOP LOGO ── */
.top-logo {
  position: absolute; top: 20px; left: 24px; z-index: 20;
  display: flex; align-items: center; gap: 8px;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 10px 18px; border-radius: 40px;
  color: #fff; font-weight: 800; font-size: 1rem; letter-spacing: 2px;
}
.top-logo svg { width: 20px; height: 20px; fill: #00BFFF; }

/* ── STATUS PILL ── */
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

/* ── HUD SIGNE ── */
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

/* ── SUBTÍTOLS ZONE ── */
.subtitles-zone {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  width: min(92%, 780px); z-index: 15;
  display: flex; flex-direction: column; gap: 12px; align-items: stretch;
}

/* Resultat Gemini */
.gemini-result {
  background: linear-gradient(135deg, rgba(60,20,130,0.94), rgba(20,5,70,0.97));
  border: 1px solid rgba(180,130,255,0.4);
  border-radius: 18px; padding: 14px 18px;
  backdrop-filter: blur(14px);
  box-shadow: 0 4px 30px rgba(120,60,220,0.35);
  animation: gemini-glow 2.5s ease-in-out infinite alternate;
}
@keyframes gemini-glow {
  from { box-shadow: 0 4px 20px rgba(120,60,220,0.3); }
  to   { box-shadow: 0 6px 36px rgba(160,100,255,0.6); }
}
.gemini-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.gemini-badge { font-size: 0.8rem; font-weight: 700; color: #c4b5fd; background: rgba(139,92,246,0.2); padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(139,92,246,0.4); }
.gemini-actions { display: flex; gap: 6px; }
.gemini-actions button { background: rgba(255,255,255,0.1); border: none; color: #fff; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 0.85rem; transition: background 0.2s; }
.gemini-actions button:hover { background: rgba(255,255,255,0.25); }
.gemini-text { margin: 0; color: #ede9fe; font-size: 1.2rem; font-weight: 600; line-height: 1.5; }

/* Panel paraules */
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

/* Botons d'acció */
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
.btn-gemini {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff; flex: 1; justify-content: center;
  box-shadow: 0 2px 14px rgba(124,58,237,0.4);
}
.btn-gemini:not(:disabled):hover { box-shadow: 0 4px 22px rgba(124,58,237,0.7); }

/* Hint buit */
.buffer-hint {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  color: rgba(255,255,255,0.3); font-size: 0.9rem; padding: 14px;
  background: rgba(0,0,0,0.35); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;
}
.buffer-hint p { margin: 0; }

/* Transicions */
.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity 0.4s, transform 0.4s; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(10px); }
.word-pop-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.word-pop-enter-from { opacity:0; transform: scale(0.5); }
.word-pop-leave-active { transition: all 0.2s ease; }
.word-pop-leave-to { opacity:0; transform: scale(0.7); }

/* ── CONTROLS PANEL (lateral dret) ── */
.controls-panel {
  position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
  z-index: 20; display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 12px 8px; border-radius: 24px;
}
.ctrl-divider { width: 32px; height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0; }
.ctrl-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; width: 60px; padding: 10px 6px;
  cursor: pointer; transition: background 0.2s, transform 0.15s, border-color 0.2s;
  color: rgba(255,255,255,0.7);
}
.ctrl-btn:hover { background: rgba(255,255,255,0.14); transform: scale(1.05); }
.ctrl-btn:active { transform: scale(0.95); }
.ctrl-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.ctrl-btn.actiu { background: rgba(0,191,255,0.18); border-color: rgba(0,191,255,0.4); color: #00BFFF; }
.ctrl-icon { font-size: 1.4rem; line-height: 1; }
.ctrl-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

/* Error */
.error-msg {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  color: #fff; background: rgba(220,38,38,0.85); backdrop-filter: blur(8px);
  padding: 20px 30px; border-radius: 12px; text-align: center; z-index: 30;
}
</style>