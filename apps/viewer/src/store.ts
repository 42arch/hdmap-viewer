import type { Lane, OpenDrive } from 'opendrive-parser'
import type Viewer from '@/libs/viewer'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const fileInfo = ref<{ name: string, size: number } | null>(null)
  const openDriveContent = ref<string | null>(null)
  const openDrive = ref<OpenDrive | null>(null)
  const viewer = ref<Viewer | null>(null)
  const selectedLane = ref<Lane | null>(null)

  function setViewer(v: Viewer) {
    viewer.value = v
  }

  function setFileInfo(info: { name: string, size: number }) {
    fileInfo.value = info
  }

  function setSelectedLane(l: Lane | null) {
    selectedLane.value = l
  }

  function setOpenDriveContent(content: string) {
    openDriveContent.value = content
  }

  function setOpenDrive(xodr: OpenDrive) {
    openDrive.value = xodr
  }

  function clear() {
    viewer.value?.clear()
    selectedLane.value = null
    openDrive.value = null
    openDriveContent.value = null
    fileInfo.value = null
  }

  return { fileInfo, setFileInfo, openDriveContent, setOpenDriveContent, viewer, setViewer, selectedLane, setSelectedLane, openDrive, setOpenDrive, clear }
})
