<script setup>
import HelloWorld from './components/HelloWorld.vue'
import PanelControl2D from './components/PanelControl2D.vue'
import UserProjectPanel from './components/UserProjectPanel.vue'
import CanvasConfigPanel from './components/CanvasConfigPanel.vue'
import CanvasPreviewPanel from './components/CanvasPreviewPanel.vue'
import Visualizacion3DPanel from './components/Visualizacion3DPanel.vue'
import { ref } from 'vue'

const canvasWidth = ref(800)
const canvasHeight = ref(600)
const backgroundArr = ref([12,18,30])

const curveParams = ref({ type: 'sigmoidea', perlinScale: 10, sineFreq: 5, randomSeed: 1 })

function updateCanvasConfig({ width, height, background }) {
  canvasWidth.value = width
  canvasHeight.value = height
  backgroundArr.value = background
}

function updateCurveParams(params) {
  curveParams.value = params
}
</script>

<template>
  <PanelControl2D @update-config="updateCanvasConfig" @curve-params="updateCurveParams" />
  <UserProjectPanel />
  <CanvasConfigPanel @update-config="updateCanvasConfig" />
  <CanvasPreviewPanel :width="canvasWidth" :height="canvasHeight" :background="backgroundArr" :curve-params="curveParams" />
  <Visualizacion3DPanel />
</template>
