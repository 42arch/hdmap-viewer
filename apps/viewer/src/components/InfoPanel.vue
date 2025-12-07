<script setup lang="ts">
import type { Level } from '@/libs/types'
import { NCard, NDivider } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { reactive, watch } from 'vue'
import { useAppStore } from '@/store'

interface InfoState {
  level: Level | null
  key: string | null
  roadKey: string | null
  sectionKey: string | null
  laneKey: string | null
}

const store = useAppStore()
const { viewer, openDrive } = storeToRefs(store)
const state = reactive<InfoState>({
  level: null,
  key: null,
  roadKey: null,
  sectionKey: null,
  laneKey: null,
})

watch(viewer, () => {
  if (!viewer.value)
    return

  viewer.value.hm.onHighlight((level, key, source) => {
    state.level = level
    state.key = key
    const [roadKey, sectionKey, laneKey] = key?.split('_') || []
    state.roadKey = roadKey || null
    state.sectionKey = sectionKey || null
    state.laneKey = laneKey || null
  })
})
</script>

<template>
  <NCard class="info-panel" content-style="padding: 0">
    <p v-if="state.roadKey">
      Road: {{ state.roadKey }}
    </p>
    <p v-if="state.sectionKey">
      LaneSection: {{ state.sectionKey }}
    </p>
    <p v-if="state.laneKey">
      Lane: {{ state.laneKey }}
    </p>

    <NDivider />
  </NCard>
</template>

<style scoped>
.info-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 240px;
  height: auto;
  min-height: 120px;
  border-width: 1px;
  border-style: solid;
  padding: 8px;
  z-index: 9;
}

p {
  margin: 0;
}
</style>
