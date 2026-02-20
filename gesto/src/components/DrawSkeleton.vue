<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

// Recibimos las manos desde tu cámara principal y si la cámara es frontal
const props = defineProps({
  handsData: {
    type: Array,
    default: () => []
  },
  esFrontal: {
    type: Boolean,
    default: false
  }
});

const canvasRef = ref(null);

// Ajustar el tamaño del canvas al tamaño de la pantalla
const resizeCanvas = () => {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth;
    canvasRef.value.height = window.innerHeight;
  }
};

onMounted(() => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
});

// Cada vez que la IA envíe nuevas manos, dibujamos
watch(() => props.handsData, (newHands) => {
  if (!canvasRef.value) return;
  
  const ctx = canvasRef.value.getContext('2d');
  const w = canvasRef.value.width;
  const h = canvasRef.value.height;

  // Limpiamos el dibujo anterior (esto lo hace transparente)
  ctx.clearRect(0, 0, w, h);

  // Color de los puntos
  ctx.fillStyle = "#00FF00"; 

  newHands.forEach(mano => {
    mano.forEach(point => {
      ctx.beginPath();
      // Multiplicamos por el ancho y alto de la pantalla
      ctx.arc(point.x * w, point.y * h, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  });
}, { deep: true });
</script>

<style scoped>
.skeleton-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* SÚPER IMPORTANTE: Permite hacer clic a los botones que estén debajo */
  z-index: 5; /* Se pone por encima del video pero por debajo de los controles */
}

/* Si es cámara frontal, hacemos efecto espejo */
.espejo {
  transform: scaleX(-1);
}
</style>
