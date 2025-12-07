<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Viewer from '@/libs/viewer'
import { useAppStore } from '@/store'

const store = useAppStore()
const viewerDom = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (viewerDom.value) {
    const viewer = new Viewer(viewerDom.value)
    store.setViewer(viewer)
  }
})
</script>

<template>
  <div ref="viewerDom" class="viewer" />
</template>

<style scoped>
.viewer {
  width: 100%;
  height: 100%;
  position: relative;
}

.viewer canvas {
  width: 100%;
  height: 100%;
}
</style>
