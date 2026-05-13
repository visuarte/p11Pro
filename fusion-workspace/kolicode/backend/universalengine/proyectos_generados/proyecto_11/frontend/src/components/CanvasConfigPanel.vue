<template>
  <div class="canvas-config-panel">
    <h3>Configuración de Canvas</h3>
    <form @submit.prevent="handleSync">
      <input v-model.number="canvasWidth" type="number" min="1" placeholder="Ancho (px)" required />
      <input v-model.number="canvasHeight" type="number" min="1" placeholder="Alto (px)" required />
      <input v-model="background" placeholder="Color fondo (R,G,B)" required />
      <input v-model="userId" placeholder="User ID" required />
      <input v-model="projectId" placeholder="Project ID" required />
      <button type="submit">Sincronizar configuración</button>
    </form>
    <div v-if="msg" class="msg">{{ msg }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const canvasWidth = ref(800)
const canvasHeight = ref(600)
const background = ref('12,18,30')
const userId = ref('')
const projectId = ref('')
const msg = ref('')

async function handleSync() {
  msg.value = ''
  const bgArr = background.value.split(',').map(v => parseInt(v.trim(), 10))
  const config = {
    canvas_width: canvasWidth.value,
    canvas_height: canvasHeight.value,
    background: bgArr
  }
  const res = await fetch('http://127.0.0.1:8000/sync/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId.value, project_id: projectId.value, config })
  })
  const data = await res.json()
  msg.value = data.msg || data.error
  // Emitir evento para actualizar la previsualización
  emit('update-config', {
    width: canvasWidth.value,
    height: canvasHeight.value,
    background: bgArr
  })
}
</script>

<style scoped>
.canvas-config-panel {
  margin: 2rem auto;
  max-width: 400px;
  padding: 1rem;
  border: 1px solid #bbb;
  border-radius: 8px;
  background: #f6f6f6;
}
.canvas-config-panel input {
  display: block;
  margin-bottom: 0.5rem;
  width: 100%;
  padding: 0.5rem;
}
.canvas-config-panel .msg {
  margin-top: 1rem;
  color: #388e3c;
}
</style>
