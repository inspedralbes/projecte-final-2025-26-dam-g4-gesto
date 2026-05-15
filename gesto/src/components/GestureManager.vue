<template>
  <div class="gesture-manager">
    <div class="manager-header">
      <h3>Gestor de Gestos</h3>
      <button class="btn-refresh" @click="carregarGestures" :disabled="carregant">
        {{ carregant ? '⏳ Carregant...' : '🔄 Actualizar' }}
      </button>
    </div>

    <div v-if="carregant" class="loading">Carregant gestures...</div>

    <div v-else-if="gestures.length === 0" class="empty-state">
      <p>No hi ha gestures grabats</p>
    </div>

    <div v-else class="gestures-list">
      <div v-for="gesto in gestures" :key="gesto" class="gesture-item">
        <span class="gesture-name">{{ gesto }}</span>
        <button
          class="btn-delete"
          @click="confirmarEliminacio(gesto)"
          :disabled="eliminant === gesto"
        >
          {{ eliminant === gesto ? '⏳' : '🗑️ Eliminar' }}
        </button>
      </div>
    </div>

    <!-- Modal de confirmació -->
    <div v-if="gestoAConfirmar" class="modal-overlay" @click.self="gestoAConfirmar = null">
      <div class="modal-content">
        <h4>¿Estàs segur?</h4>
        <p>Eliminàs permanentment el gesto <strong>{{ gestoAConfirmar }}</strong></p>
        <p class="warning">Això farà que el model s'entreni de nou sense aquest gesto (pot trigar uns minuts).</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="gestoAConfirmar = null">Cancel·lar</button>
          <button class="btn-confirm" @click="eliminarGesto(gestoAConfirmar)">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const gestures = ref([])
const carregant = ref(false)
const eliminant = ref(null)
const gestoAConfirmar = ref(null)

const apiUrl = import.meta.env.VITE_API_URL

async function carregarGestures () {
  carregant.value = true
  try {
    const response = await fetch(`${apiUrl}/api/list-gestures`)
    if (response.ok) {
      const data = await response.json()
      gestures.value = data.gestures.sort()
      console.log('✅ Gestures carregats:', gestures.value)
    } else {
      console.error('Error carregant gestures:', response.status)
    }
  } catch (error) {
    console.error('Error carregant gestures:', error)
  } finally {
    carregant.value = false
  }
}

function confirmarEliminacio (gesto) {
  gestoAConfirmar.value = gesto
}

async function eliminarGesto (gesto) {
  eliminant.value = gesto
  gestoAConfirmar.value = null

  try {
    const response = await fetch(`${apiUrl}/api/delete-gesture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gesto }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Resposta del servidor:', data)
      alert(`Gest '${gesto}' eliminat correctament. El model s'està reentrenant...`)
      
      // Recarregar la llista de gestures
      await carregarGestures()
    } else {
      console.error('Error eliminant gesto:', response.status)
      const errorData = await response.json()
      alert(`Error: ${errorData.error || 'Error desconegut'}`)
    }
  } catch (error) {
    console.error('Error eliminant gesto:', error)
    alert('Error eliminant gesto. Obre la consola per veure més detalls.')
  } finally {
    eliminant.value = null
  }
}

onMounted(() => {
  carregarGestures()
})
</script>

<style scoped>
.gesture-manager {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #444;
  max-width: 400px;
  margin: 20px auto;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #666;
  padding-bottom: 10px;
}

.manager-header h3 {
  margin: 0;
  font-size: 1.2em;
}

.btn-refresh {
  background: #0078d4;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #005a9e;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  color: #aaa;
  padding: 20px;
}

.empty-state {
  text-align: center;
  color: #888;
  padding: 20px;
  font-style: italic;
}

.gestures-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gesture-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #0078d4;
}

.gesture-name {
  font-weight: 500;
  flex: 1;
}

.btn-delete {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background 0.2s;
  white-space: nowrap;
  margin-left: 10px;
}

.btn-delete:hover:not(:disabled) {
  background: #b71c1c;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a1a;
  color: white;
  padding: 30px;
  border-radius: 10px;
  border: 1px solid #666;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal-content h4 {
  margin: 0 0 15px 0;
  font-size: 1.3em;
  color: #ff6b6b;
}

.modal-content p {
  margin: 10px 0;
  line-height: 1.5;
}

.warning {
  background: rgba(255, 107, 107, 0.1);
  border-left: 3px solid #ff6b6b;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.9em;
  color: #ffb3b3;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.btn-cancel {
  background: #555;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: #666;
}

.btn-confirm {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}

.btn-confirm:hover {
  background: #b71c1c;
}
</style>
