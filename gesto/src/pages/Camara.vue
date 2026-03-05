<template>
  <div class="camera-container">
    <video ref="videoRef" autoplay muted playsinline class="fullscreen-video" :class="{ 'espejo': facingMode === 'user' }"></video>
    
    <DrawSkeleton 
      class="skeleton-overlay"
      v-if="mostrarEsquelet" 
      :handsData="manosDetectadas" 
      :esFrontal="facingMode === 'user'" 
    />

    <div class="traduccion-hud" v-if="signoDetectado">
      <h1>{{ signoDetectado }}</h1>
      <span class="badge-ia">{{ usantIAv2 ? 'IA Automàtica (V2)' : 'IA Original (V1)' }}</span>
    </div>

    <DatasetCreator :videoElement="videoRef" :usantIAv2="usantIAv2" />

    <div class="controls">
      <button @click="goHome" class="control-btn" aria-label="Tornar a l'inici">
        🏠
      </button>

      <button @click="mostrarEsquelet = !mostrarEsquelet" class="control-btn" :class="{ 'actiu': mostrarEsquelet }" aria-label="Alternar esquelet">
        👁️
      </button>

      <button @click="switchCamera" class="control-btn" aria-label="Canviar càmera">
        🔄
      </button>

      <button @click="canviarIA" class="control-btn" :class="{ 'actiu': usantIAv2 }" aria-label="Canviar IA">
        🧠
      </button>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

// IMPORTAMOS LOS DOS ARCHIVOS, PONIÉNDOLES NOMBRES DISTINTOS
import { GestureService as GestureServiceOriginal } from '../services/GestureService'; 
import { GestureService as GestureServiceV2 } from '../services/gestureservices2'; 

import DrawSkeleton from '../components/DrawSkeleton.vue';
import DatasetCreator from '@/components/DatasetCreator.vue';

const router = useRouter();

const videoRef = ref(null);
const error = ref(null);
const facingMode = ref('user'); 
let currentStream = null;

// VARIABLE PARA SABER CUÁL ESTÁ ACTIVA (Por defecto, tu V2)
const usantIAv2 = ref(true);
let gestureService = null; // Lo dejamos vacío y lo llenamos luego

const manosDetectadas = ref([]);
const signoDetectado = ref('Iniciant IA...');
let animationFrameId = null;

const mostrarEsquelet = ref(false);
const lastSpokenSigno = ref(null);

const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ca-ES';
    utterance.rate = 1.2;
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("La síntesi de veu no és suportada en aquest navegador.");
  }
};

// NUEVA FUNCIÓN PARA CARGAR LA IA ELEGIDA
const carregarIA = async () => {
  signoDetectado.value = 'Carregant model...';
  // Si usantIAv2 es true, usa tu archivo. Si es false, usa el de tus compañeros.
  gestureService = usantIAv2.value ? new GestureServiceV2() : new GestureServiceOriginal();
  await gestureService.initialize();
  signoDetectado.value = 'IA Llista!';
};

// FUNCIÓN DEL BOTÓN PARA CAMBIAR
const canviarIA = async () => {
  usantIAv2.value = !usantIAv2.value; // Alternamos de true a false
  await carregarIA(); // Volvemos a cargar el modelo correcto
};

const startCamera = async () => {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: {
      facingMode: facingMode.value,
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      videoRef.value.onloadeddata = () => {
        predictLoop();
      };
    }
    error.value = null;
  } catch (err) {
    console.error("Error al accedir a la càmera:", err);
    error.value = "No s'ha pogut accedir a la càmera. Verifica els permisos.";
  }
};

const switchCamera = () => {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment';
  startCamera(); 
};

const goHome = () => {
  router.push('/');
};

const predictLoop = () => {
  // Asegurarnos de que gestureService ya se ha cargado
  if (gestureService && videoRef.value && videoRef.value.readyState === 4) {
    const resultado = gestureService.detect(videoRef.value, performance.now());

    if (resultado && resultado.signo) {
      manosDetectadas.value = resultado.hands;
      const newSigno = resultado.signo;

      if (newSigno !== signoDetectado.value) {
        signoDetectado.value = newSigno;
        if (newSigno !== lastSpokenSigno.value && newSigno !== "Mà detectada") {
          speak(newSigno);
          lastSpokenSigno.value = newSigno;
        }
      }
    } else {
      manosDetectadas.value = [];
      signoDetectado.value = "";
      lastSpokenSigno.value = null; 
    }
  }
  animationFrameId = requestAnimationFrame(predictLoop);
};

onMounted(async () => {
  await carregarIA(); // Primero cargamos el cerebro
  startCamera();      // Luego encendemos los ojos
});

onBeforeUnmount(() => {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
/* TODO TU CSS SIGUE IGUAL, SOLO AÑADO ESTO PARA EL TEXTO DE LA IA */
.camera-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: black;
}

.fullscreen-video {
  width: 100%;
  height: 100%;
  object-fit: cover; 
  display: block;
}

.espejo {
  transform: scaleX(-1);
}

.skeleton-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.traduccion-hud {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 10px 30px;
  border-radius: 20px;
  z-index: 10;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.traduccion-hud h1 {
  margin: 0;
  font-size: 2rem;
}
.badge-ia {
  font-size: 0.8rem;
  color: #a5d6a7;
  font-weight: bold;
}

.controls {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 10;
}

.control-btn {
  background-color: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  transition: transform 0.2s, background-color 0.2s;
  font-size: 24px;
}

.control-btn.actiu {
  background-color: #4CAF50;
  color: white;
}

.control-btn:active { 
  transform: scale(0.95); 
  background-color: rgba(255, 255, 255, 1); 
}

.error-msg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  background: rgba(255, 0, 0, 0.7);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  z-index: 20;
}
</style>