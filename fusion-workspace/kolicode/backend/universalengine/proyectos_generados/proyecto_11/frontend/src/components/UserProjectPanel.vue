<template>
  <div class="user-project-panel">
    <h3>Gestión de Usuario y Proyecto</h3>
    <form @submit.prevent="handleSubmit">
      <input v-model="userId" placeholder="User ID" required />
      <input v-model="userName" placeholder="Nombre" required />
      <input v-model="projectId" placeholder="Project ID" required />
      <input v-model="projectName" placeholder="Nombre Proyecto" required />
      <button type="submit">Crear Usuario y Proyecto</button>
    </form>
    <div v-if="msg" class="msg">{{ msg }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const userId = ref('')
const userName = ref('')
const projectId = ref('')
const projectName = ref('')
const msg = ref('')

async function handleSubmit() {
  msg.value = ''
  // Crear usuario
  const userRes = await fetch('http://127.0.0.1:8000/users/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId.value, name: userName.value })
  })
  const userData = await userRes.json()
  // Crear proyecto
  const projectRes = await fetch('http://127.0.0.1:8000/projects/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId.value, name: projectName.value, owner_id: userId.value })
  })
  const projectData = await projectRes.json()
  msg.value = `Usuario: ${userData.msg || userData.error}, Proyecto: ${projectData.msg || projectData.error}`
}
</script>

<style scoped>
.user-project-panel {
  margin: 2rem auto;
  max-width: 400px;
  padding: 1rem;
  border: 1px solid #bbb;
  border-radius: 8px;
  background: #fff;
}
.user-project-panel input {
  display: block;
  margin-bottom: 0.5rem;
  width: 100%;
  padding: 0.5rem;
}
.user-project-panel .msg {
  margin-top: 1rem;
  color: #1976d2;
}
</style>
