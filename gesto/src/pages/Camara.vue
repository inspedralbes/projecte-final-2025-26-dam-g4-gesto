<template>
  <div class="camera-container">
    <video ref="videoRef" autoplay muted playsinline class="fullscreen-video" :class="{ 'espejo': facingMode === 'user' }"></video>
    
    <DrawSkeleton :handsData="manosDetectadas" :esFrontal="facingMode === 'user'" />

    <div class="traduccion-hud" v-if="signoDetectado">
      <h1>{{ signoDetectado }}</h1>
    </div>

    <div class="controls">
      <button @click="goHome" class="control-btn" aria-label="Volver al inicio">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>

      <button @click="switchCamera" class="control-btn" aria-label="Cambiar cámara">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
          <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-5 11.5V13H9v2.4L5.5 12 9 8.6V11h6V8.6l3.5 3.4-3.5 3.5z"/>
        </svg>
      </button>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
// AÑADIDO: Importamos la IA y el componente del esqueleto
import { GestureService } from '../services/GestureService'; 
import DrawSkeleton from '../components/DrawSkeleton.vue';

const router = useRouter();

const videoRef = ref(null);
const error = ref(null);
const facingMode = ref('user'); // Cambiado por defecto a 'user' (cámara frontal es mejor para lengua de signos)
let currentStream = null;

// NUEVO: Variables para la IA
const gestureService = new GestureService();
const manosDetectadas = ref([]);
const signoDetectado = ref('Iniciando IA...');
let animationFrameId = null;

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
      // NUEVO: Empezamos a predecir solo cuando el video ya está cargado y reproduciéndose
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

// NUEVO: Bucle infinito que le pasa el video a la IA
const predictLoop = () => {
  if (videoRef.value && videoRef.value.readyState === 4) {
    // 1. Enviamos el frame al cerebro
    const resultado = gestureService.detect(videoRef.value, performance.now());

    // 2. Si detecta algo, actualizamos las variables
    if (resultado) {
      manosDetectadas.value = resultado.hands;
      signoDetectado.value = resultado.signo;
    } else {
      manosDetectadas.value = [];
      signoDetectado.value = ""; // Ocultamos el texto si no hay manos
    }
  }
  animationFrameId = requestAnimationFrame(predictLoop);
};

onMounted(async () => {
  // AÑADIDO: Inicializamos la IA antes de encender la cámara
  await gestureService.initialize();
  startCamera();
});

onBeforeUnmount(() => {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  // AÑADIDO: Detenemos el bucle de la IA al salir
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
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
  object-fit: cover; /* Cubre toda la pantalla */
  display: block;
}

/* NUEVO: Efecto espejo para cámara frontal */
.espejo {
  transform: scaleX(-1);
}

/* NUEVO: Estilo para el texto de traducción flotante */
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
}
.traduccion-hud h1 {
  margin: 0;
  font-size: 2rem;
}

/* Tus estilos originales se mantienen igual... */
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
}

.control-btn svg { width: 28px; height: 28px; }
.control-btn:active { transform: scale(0.95); background-color: rgba(255, 255, 255, 1); }

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