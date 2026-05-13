<template>
  <div class="panel-control-2d">
    <h2>Panel de Control 2D</h2>
    <div>
      <button @click="fetchStatus">Probar conexión backend</button>
      <p v-if="status">Estado backend: {{ status }}</p>
    </div>
    <hr style="margin:1rem 0;">
    <div>
      <label>
        Color de fondo:
        <input type="color" v-model="colorHex" @input="updateColor" />
      </label>
    </div>
    <div style="margin-top:1rem;">
      <label>
        Ancho:
        <input type="number" v-model.number="width" min="100" max="1920" style="width:70px;" />
      </label>
      <label style="margin-left:1rem;">
        Alto:
        <input type="number" v-model.number="height" min="100" max="1080" style="width:70px;" />
      </label>
    </div>
    <div style="margin-top:1rem;">
      <label>Herramienta:
        <select v-model="tool">
          <option value="pincel">Pincel</option>
          <option value="borrador">Borrador</option>
          <option value="línea">Línea</option>
          <option value="curva">Curva</option>
        </select>
      </label>
    </div>
    <div style="margin-top:1rem;">
      <label>Tipo de curva:
        <select v-model="curveType" @change="emitCurveParams">
          <option value="sigmoidea">Sigmoidea</option>
          <option value="perlin">Ruido Perlin</option>
          <option value="seno">Senoidal</option>
          <option value="aleatoria">Aleatoria</option>
        </select>
      </label>
    </div>
    <div v-if="curveType==='perlin'" style="margin-top:1rem;">
      <label>Escala ruido:
        <input type="range" min="1" max="20" v-model.number="perlinScale" @input="emitCurveParams" /> {{ perlinScale }}
      </label>
    </div>
    <div v-if="curveType==='seno'" style="margin-top:1rem;">
      <label>Frecuencia seno:
        <input type="range" min="1" max="20" v-model.number="sineFreq" @input="emitCurveParams" /> {{ sineFreq }}
      </label>
    </div>
    <div v-if="curveType==='aleatoria'" style="margin-top:1rem;">
      <label>Semilla aleatoria:
        <input type="number" v-model.number="randomSeed" @input="emitCurveParams" />
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineEmits } from 'vue'

const status = ref('')
const width = ref(800)
const height = ref(600)
const colorHex = ref('#0c121e')
const tool = ref('pincel')

const curveType = ref('sigmoidea')
const perlinScale = ref(10)
const sineFreq = ref(5)
const randomSeed = ref(1)

const emit = defineEmits(['update-config', 'tool-change', 'curve-params'])

function hexToRgb(hex) {
  const v = hex.replace('#','')
  return [parseInt(v.substring(0,2),16), parseInt(v.substring(2,4),16), parseInt(v.substring(4,6),16)]
}

function updateColor() {
  emit('update-config', { width: width.value, height: height.value, background: hexToRgb(colorHex.value) })
}

watch([width, height], () => {
  emit('update-config', { width: width.value, height: height.value, background: hexToRgb(colorHex.value) })
})

watch(tool, () => {
  emit('tool-change', tool.value)
})

function emitCurveParams() {
  emit('curve-params', {
    type: curveType.value,
    perlinScale: perlinScale.value,
    sineFreq: sineFreq.value,
    randomSeed: randomSeed.value
  })
}

watch([curveType, perlinScale, sineFreq, randomSeed], emitCurveParams)

async function fetchStatus() {
  try {
    const res = await fetch('http://127.0.0.1:8000/')
    const data = await res.json()
    status.value = data.status
  } catch (e) {
    status.value = 'Error de conexión'
  }
}
</script>

<style scoped>
.panel-control-2d {
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 8px;
  max-width: 400px;
  margin: 2rem auto;
  background: #f9f9f9;
}
</style>
