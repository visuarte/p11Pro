<template>
  <div id="app-root">
    <canvas ref="glCanvas" id="glCanvas" aria-label="WebGL Canvas" class="gl-canvas"></canvas>
    <canvas ref="overlayCanvas" class="overlay-canvas" aria-hidden="true"></canvas>
    <div class="ui">
      <button :class="['voice-btn', assistantState]" @click="toggleAssistant">
        <span v-if="assistantState==='idle'">🎤 Iniciar</span>
        <span v-else-if="assistantState==='listening'">● Escuchando</span>
        <span v-else>…</span>
      </button>
      <div class="transcript">
        <div v-for="(line, idx) in transcriptLines" :key="idx" class="line">{{ line }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import KotguaiScene from './webgl/KotguaiScene.js'
import VoiceAssistant from './voice/VoiceAssistant.js'

const glCanvas = ref(null)
const overlayCanvas = ref(null)
let scene = null
let assistant = null

const assistantState = ref('idle')
const transcriptLines = ref([])

function drawTranscriptOverlay(text) {
  const c = overlayCanvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = c.width = c.clientWidth * dpr
  const h = c.height = c.clientHeight * dpr
  ctx.clearRect(0, 0, w, h)
  ctx.font = `${14 * dpr}px monospace`
  ctx.fillStyle = 'rgba(0,255,255,0.95)'
  ctx.textBaseline = 'top'
  let y = 8 * dpr
  for (let i = Math.max(0, transcriptLines.value.length - 6); i < transcriptLines.value.length; i++) {
    ctx.globalAlpha = 1 - (transcriptLines.value.length - 1 - i) * 0.12
    ctx.fillText(transcriptLines.value[i], 12 * dpr, y)
    y += 18 * dpr
  }
}

function onAudioFrame(payload) {
  // payload.freq is Uint8Array
  // forward analyser to scene via connectAnalyser; scene itself will sample analyser
  // we can derive instant level here if needed
}

function toggleAssistant() {
  if (!assistant) return
  if (assistantState.value === 'idle') assistant.start()
  else assistant.stop()
}

onMounted(async () => {
  const canvas = glCanvas.value
  const overlay = overlayCanvas.value
  // Make canvases full screen
  const size = () => {
    canvas.style.width = '100vw'
    canvas.style.height = '100vh'
    overlay.style.width = '100vw'
    overlay.style.height = '100vh'
  }
  size()

  // instantiate scene
  scene = new KotguaiScene(canvas)
  scene.resize()
  scene.start()

  // instantiate assistant
  assistant = new VoiceAssistant({ lang: 'es-ES' })
  assistant.on('state', (s) => {
    assistantState.value = s.state
  })
  assistant.on('transcript', (t) => {
    // interim: update last line
    const text = (t && t.interim) ? t.interim : ''
    if (transcriptLines.value.length === 0) transcriptLines.value.push(text)
    else transcriptLines.value[transcriptLines.value.length - 1] = text
    drawTranscriptOverlay(text)
  })
  assistant.on('finalTranscript', (r) => {
    if (r && r.final) {
      transcriptLines.value.push(r.final)
      if (transcriptLines.value.length > 20) transcriptLines.value.shift()
      drawTranscriptOverlay(r.final)
    }
  })
  assistant.on('audioFrame', (f) => {
    // forward analyser node into scene so it can sample audio if desired
    // the assistant provides analyser via getAnalyser()
  })

  // connect analyser (after user grants mic)
  assistant.on('state', (s) => {
    if (s.state === 'listening') {
      const analyser = assistant.getAnalyser()
      if (analyser) scene.connectAnalyser(analyser)
    } else if (s.state === 'idle') {
      // scene.connectAnalyser(null) // keep last level
    }
  })

  // responsive overlay resize
  const ro = new ResizeObserver(() => drawTranscriptOverlay())
  ro.observe(overlay)
  // cleanup
  onBeforeUnmount(() => {
    scene && scene.dispose()
    assistant && assistant.stop()
    ro.disconnect()
  })
})
</script>

<style>
:root{ --accent: #00FFFF; --accent2: #8B00FF }
html,body,#app-root{ height:100%; margin:0 }
.gl-canvas{ position:fixed; left:0; top:0; width:100vw; height:100vh; display:block }
.overlay-canvas{ position:fixed; left:0; top:0; width:100vw; height:100vh; pointer-events:none }
.ui{ position:fixed; left:1rem; bottom:1rem; z-index:40; display:flex; flex-direction:column; gap:0.6rem }
.voice-btn{ background:rgba(0,0,0,0.6); color:var(--accent); border:1px solid rgba(0,255,255,0.12); padding:0.6rem 0.9rem; border-radius:0.5rem; font-weight:700 }
.voice-btn.listening{ box-shadow:0 0 14px rgba(0,255,255,0.18); transform:scale(1.02) }
.transcript{ max-width:48vw; color:var(--accent); font-family:monospace; font-size:0.95rem }
.line{ opacity:0.95; margin:0.12rem 0 }
</style>

