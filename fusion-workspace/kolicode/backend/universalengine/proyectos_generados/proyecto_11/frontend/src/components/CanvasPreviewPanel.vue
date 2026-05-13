<template>
  <div class="canvas-preview-panel">
    <h3>Previsualización Canvas 2D</h3>
    <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight" style="border:1px solid #888; background:#222;"></canvas>
    <div style="margin-top:1rem">
      <button @click="drawCurve">Dibujar curva</button>
      <button @click="toggleAnimation">Animar curva</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, toRefs } from 'vue'
import { defineProps } from 'vue'

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }
function grad(hash, x) { return (hash & 1) === 0 ? x : -x; }
function perlin1d(x) {
  const X = Math.floor(x) & 255;
  x -= Math.floor(x);
  const u = fade(x);
  const p = perlin1d.p;
  const a = p[X], b = p[X + 1];
  return lerp(grad(a, x), grad(b, x - 1), u);
}
perlin1d.p = new Uint8Array(512);
for (let i = 0; i < 256; ++i) perlin1d.p[256 + i] = perlin1d.p[i] = Math.floor(Math.random() * 256);

const props = defineProps({
  width: { type: Number, default: 800 },
  height: { type: Number, default: 600 },
  background: { type: Array, default: () => [12,18,30] },
  curveParams: { type: Object, default: () => ({ type: 'sigmoidea', perlinScale: 10, sineFreq: 5, randomSeed: 1 }) }
})

const { curveParams } = toRefs(props)

const canvasRef = ref(null)
const canvasWidth = props.width
const canvasHeight = props.height

let animationId = null
let noiseOffset = 0
let animating = ref(false)

function drawCurve() {
  const ctx = canvasRef.value.getContext('2d')
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  ctx.fillStyle = `rgb(${props.background.join(',')})`
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  const N = 100
  const points = []
  const type = curveParams.value.type
  if (type === 'sigmoidea') {
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1)
      const y = 1 / (1 + Math.exp(-10 * (x - 0.5)))
      points.push([x, y])
    }
    ctx.strokeStyle = '#ff9800'
  } else if (type === 'perlin') {
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1)
      const y = 0.5 + 0.4 * perlin1d(curveParams.value.perlinScale * x + noiseOffset)
      points.push([x, y])
    }
    ctx.strokeStyle = '#00eaff'
  } else if (type === 'seno') {
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1)
      const y = 0.5 + 0.4 * Math.sin(curveParams.value.sineFreq * x + noiseOffset)
      points.push([x, y])
    }
    ctx.strokeStyle = '#e91e63'
  } else if (type === 'aleatoria') {
    const seed = curveParams.value.randomSeed || 1
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1)
      // Generador simple
      const y = 0.5 + 0.4 * ((Math.sin(seed * (i + 1)) + Math.cos(seed * (i + 1) * 1.7)) % 1)
      points.push([x, y])
    }
    ctx.strokeStyle = '#4caf50'
  }
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(points[0][0] * canvasWidth, canvasHeight - points[0][1] * canvasHeight)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0] * canvasWidth, canvasHeight - points[i][1] * canvasHeight)
  }
  ctx.stroke()
}

function animateCurve() {
  if (!animating.value) return
  noiseOffset += 0.03
  drawCurve()
  animationId = requestAnimationFrame(animateCurve)
}

function toggleAnimation() {
  animating.value = !animating.value
  if (animating.value) {
    noiseOffset = 0
    animateCurve()
  } else {
    if (animationId) cancelAnimationFrame(animationId)
  }
}

onMounted(() => {
  drawCurve()
})

watch(() => [props.width, props.height, props.background, curveParams.value.type, curveParams.value.perlinScale, curveParams.value.sineFreq, curveParams.value.randomSeed], drawCurve)
</script>

<style scoped>
.canvas-preview-panel {
  margin: 2rem auto;
  max-width: 820px;
  padding: 1rem;
  border: 1px solid #bbb;
  border-radius: 8px;
  background: #fff;
  text-align: center;
}
canvas {
  margin-bottom: 1rem;
}
button {
  margin: 0 0.5rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  border-radius: 6px;
  border: none;
  background: #222;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover {
  background: #00eaff;
  color: #222;
}
</style>
