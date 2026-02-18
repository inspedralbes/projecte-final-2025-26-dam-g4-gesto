<template>
  <div class="camera-container">
    <video ref="videoRef" autoplay muted playsinline class="fullscreen-video"></video>
    
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

const router = useRouter();

const videoRef = ref(null);
const error = ref(null);
const facingMode = ref('environment'); // Empieza con la cámara trasera
let currentStream = null;

const startCamera = async () => {
  // 1. Detener stream anterior si existe
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  // 2. Definir constraints (Movi esto DENTRO de la función para que se actualice al cambiar facingMode)
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

onMounted(() => {
  startCamera();
});

onBeforeUnmount(() => {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
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
  object-fit: cover;
  display: block;
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
}

.control-btn svg {
  width: 28px;
  height: 28px;
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
}
</style>