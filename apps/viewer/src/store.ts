import type { Lane, Road } from 'opendrive-parser'
import type Viewer from './libs/viewer'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const openDriveContent = ref<string | null>(null)
  const viewer = ref<Viewer | null>(null)
  const roads = ref<Road[]>([])
  const selectedLane = ref<Lane | null>(null)

  function setViewer(v: Viewer) {
    viewer.value = v
  }

  function setRoads(r: Road[]) {
    roads.value = r
  }

  function setSelectedLane(l: Lane | null) {
    selectedLane.value = l
  }

  function setOpenDriveContent(content: string) {
    openDriveContent.value = content
  }

  function clear() {
    viewer.value?.clear()
    roads.value = []
    selectedLane.value = null
  }

  return { openDriveContent, setOpenDriveContent, viewer, setViewer, roads, setRoads, selectedLane, setSelectedLane, clear }
})
