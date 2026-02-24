<template>
  <div class="dataset-creator">
    <div v-if="!isRecording" class="controls">
      <h3>Crear Dataset de Gestos</h3>
      <input v-model="nomGest" type="text" placeholder="Nom del gest (ex: 1, adeu, palma)" />
      <button @click="startCapture" :disabled="!nomGest">
        Gravar 100 fotos (20 segons)
      </button>
    </div>

    <div v-else class="recording">
      <h3>Gravant "{{ nomGest }}"...</h3>
      <p>Mou la mà lentament (canvia la distància i l'angle)</p>
      <div class="progress-bar">
        <div class="progress" :style="{ width: (imageCount / maxImages) * 100 + '%' }"></div>
      </div>
      <p>{{ imageCount }} / {{ maxImages }} fotos</p>
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

const nomGest = ref('');
const isRecording = ref(false);
const isCompressing = ref(false); // NUEVO: Para saber si está comprimiendo el zip
const imageCount = ref(0);
const maxImages = 100; 

let intervalId = null;
let zip = null;
let folder = null;
let isStopping = false;

const startCapture = () => {
  // TRUC DEFINITIU: Ignorem el "props.videoElement" de Vue 
  // i busquem l'etiqueta de vídeo directament al navegador web.
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

  // Reiniciem variables
  isRecording.value = true;
  isCompressing.value = false;
  isStopping = false;
  imageCount.value = 0;
  
  zip = new JSZip();
  folder = zip.folder(nomGest.value);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // ... la resta del setInterval es queda exactament igual ...
  intervalId = setInterval(() => {
    if (isStopping) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (!blob) return;

      folder.file(`foto_${imageCount.value}.jpg`, blob);
      imageCount.value++;

      if (imageCount.value >= maxImages && !isStopping) {
        isStopping = true;
        stopCapture();
      }
    }, 'image/jpeg', 0.9);

  }, 200);
};

const stopCapture = async () => {
  // 1. Paramos el bucle de fotos
  clearInterval(intervalId);
  
  // 2. Avisamos a la interfaz que estamos comprimiendo
  isCompressing.value = true; 
  
  try {
    // 3. Generamos el archivo ZIP de forma asíncrona
    const content = await zip.generateAsync({ type: "blob" });
    
    // 4. Truco para forzar la descarga en TODOS los navegadores
    const link = document.createElement('a');
    const url = URL.createObjectURL(content);
    
    link.href = url;
    link.download = `dataset_${nomGest.value}.zip`;
    
    document.body.appendChild(link); // Requisito vital en Firefox/Safari
    link.click();                    // Hacemos el clic simulado
    document.body.removeChild(link); // Limpiamos el HTML
    
    // Limpiamos la memoria del navegador 1 segundo después
    setTimeout(() => URL.revokeObjectURL(url), 1000); 

    // 5. Reseteamos el componente
    isRecording.value = false;
    isCompressing.value = false;
    nomGest.value = '';
    
  } catch (error) {
    console.error("Error al crear el ZIP: ", error);
    alert("Hi ha hagut un error creant l'arxiu ZIP. Obre la consola per veure'l.");
    isRecording.value = false;
    isCompressing.value = false;
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
}
.controls input, .controls button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  box-sizing: border-box;
  color: white; 
  background-color: #333333; 
  border: 1px solid #555555; /* Un bordecito gris para que quede limpio */
  border-radius: 5px; /* Bordes ligeramente redondeados */
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
}
.recording h3 {
  color: #ff4444;
  animation: blink 1s infinite;
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
@keyframes blink {
  50% { opacity: 0.5; }
}
</style>