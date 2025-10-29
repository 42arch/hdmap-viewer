<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui'
import { NButton, NUpload } from 'naive-ui'
import OpenDrive from 'opendrive-parser'
import { onMounted, ref } from 'vue'
import Viewer from '../libs/viewer'

const viewerRef = ref<HTMLDivElement | null>(null)
const viewer = ref<Viewer | null>(null)

onMounted(() => {
  if (viewerRef.value) {
    viewer.value = new Viewer(viewerRef.value)
  }
})

function handleChange({ file }: { file: UploadFileInfo }) {
  const reader = new FileReader()
  reader.onload = (event) => {
    if (!viewer.value)
      return
    const content = event.target?.result as string
    if (content) {
      const openDrive = new OpenDrive(content, 1)

      openDrive.process()

      const referenceLines = openDrive.getReferenceLines()
      console.log('opendrive', openDrive)

      viewer.value.addReferenceLines(referenceLines)

      const roads = openDrive.getRoads()
      viewer.value.addLanes(roads)
      viewer.value.addLaneAreas(roads)
    }
  }

  reader.readAsText(file.file as Blob)
}
</script>

<template>
  <div ref="viewerRef" class="viewer" />
  <NUpload :max="1" :default-upload="false" accept=".xodr" @change="handleChange">
    <NButton>上传文件</NButton>
  </NUpload>
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
