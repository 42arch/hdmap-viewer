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
  const visibilityMap = ref<Record<string, boolean>>({})

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

  function isElementVisible(key: string): boolean {
    const parts = key.split('_')
    if (parts.length === 1) {
      return visibilityMap.value[key] !== false
    }
    if (parts.length === 2) {
      const roadId = parts[0]!
      return visibilityMap.value[roadId] !== false && visibilityMap.value[key] !== false
    }
    parts.pop()
    const sectionS = parts.pop()!
    const roadId = parts.join('_')
    const sectionKey = `${roadId}_${sectionS}`
    return (
      visibilityMap.value[roadId] !== false &&
      visibilityMap.value[sectionKey] !== false &&
      visibilityMap.value[key] !== false
    )
  }

  function toggleVisibility(key: string) {
    const visible = isElementVisible(key)
    visibilityMap.value[key] = !visible
    viewer.value?.updateVisibility(visibilityMap.value)
  }

  function areAllVisible(): boolean {
    if (!openDrive.value) return true
    const roads = openDrive.value.getRoads()
    return roads.every(road => visibilityMap.value[road.id] !== false)
  }

  function toggleAllVisibility() {
    if (!openDrive.value) return
    const roads = openDrive.value.getRoads()
    const allVisible = areAllVisible()
    if (allVisible) {
      roads.forEach(road => {
        visibilityMap.value[road.id] = false
      })
    } else {
      visibilityMap.value = {}
    }
    viewer.value?.updateVisibility(visibilityMap.value)
  }

  function clear() {
    viewer.value?.clear()
    selectedLane.value = null
    openDrive.value = null
    openDriveContent.value = null
    fileInfo.value = null
    visibilityMap.value = {}
  }

  return {
    fileInfo,
    setFileInfo,
    openDriveContent,
    setOpenDriveContent,
    viewer,
    setViewer,
    selectedLane,
    setSelectedLane,
    openDrive,
    setOpenDrive,
    visibilityMap,
    isElementVisible,
    toggleVisibility,
    areAllVisible,
    toggleAllVisibility,
    clear,
  }
})
