<template>
  <div class="visualizacion-3d-panel">
    <h3>Visualización 3D</h3>
    <div ref="container" class="threejs-container"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'
let renderer, scene, camera, animationId
const container = ref(null)

onMounted(() => {
  // Cargar Three.js dinámicamente para evitar errores SSR
  import('three').then(THREE => {
    // Escena básica
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, 1.5, 0.1, 1000)
    camera.position.z = 5
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(600, 400)
    container.value.appendChild(renderer.domElement)
    // Cubo de ejemplo
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshNormalMaterial()
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
    // Animación
    function animate() {
      animationId = requestAnimationFrame(animate)
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      renderer.render(scene, camera)
    }
    animate()
  })
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer && renderer.domElement && container.value) {
    container.value.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>
.visualizacion-3d-panel {
  margin: 2rem auto;
  max-width: 650px;
  padding: 1rem;
  border: 1px solid #bbb;
  border-radius: 8px;
  background: #fff;
  text-align: center;
}
.threejs-container {
  width: 600px;
  height: 400px;
  margin: 0 auto;
}
</style>
