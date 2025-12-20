<script setup lang="ts">
import type { Level } from '@/libs/types'
import { AlignJustify, GripLines, InfoCircle, LongArrowAltLeft, LongArrowAltRight, Road } from '@vicons/fa'
import { NCard, NDivider, NIcon } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { reactive, watch } from 'vue'
import { useAppStore } from '@/store'

interface BasicState {
  level: Level | null
  key: string | null
  roadKey: string | null
  sectionKey: string | null
  laneKey: string | null
}

interface CoordinateState {
  x: number
  y: number
  z: number
  s: number
  t: number
  longitude?: number
  latitude?: number
}

interface InfoState {
  basic: BasicState | null
  coordinate: CoordinateState | null
  successors: string[][]
  predecessors: string[][]
}

const store = useAppStore()
const { viewer, openDrive } = storeToRefs(store)
const state = reactive<InfoState>({
  basic: null,
  coordinate: null,
  predecessors: [],
  successors: [],
})

watch(openDrive, () => {
  if (!openDrive.value)
    return

  console.warn(9999, openDrive.value?.header)
})

watch(viewer, () => {
  if (!viewer.value)
    return

  viewer.value.hm.onHighlight((info) => {
    if (!info) {
      state.basic = null
      state.predecessors = []
      state.successors = []
      return
    }

    const [roadKey, sectionKey, laneKey] = info.key?.split('_') || []
    state.basic = {
      key: info.key,
      roadKey: roadKey || null,
      sectionKey: sectionKey || null,
      laneKey: laneKey || null,
      level: info.level,
    }
    state.successors = info.successors.map(key => key.split('_'))
    state.predecessors = info.predecessors.map(key => key.split('_'))
  })

  viewer.value.hm.onMouseMove((info) => {
    if (!info) {
      state.coordinate = null
      return
    }
    state.coordinate = info.coordinates || null
  })
})
</script>

<template>
  <NCard class="info-panel" content-style="padding: 0">
    <div class="title">
      <NIcon size="12">
        <InfoCircle />
      </NIcon>
      <span>Info</span>
    </div>

    <NDivider />

    <div v-show="state.basic">
      <div v-if="state.coordinate" class="coord-list">
        <div class="coord-category">
          <div class="coord-item">
            s: {{ state.coordinate.s.toFixed(4) }}
          </div>
          <div class="coord-item">
            t: {{ state.coordinate.t.toFixed(4) }}
          </div>
        </div>
        <div class="coord-category">
          <div class="coord-item">
            x: {{ state.coordinate.x.toFixed(4) }}
          </div>
          <div class="coord-item">
            y: {{ state.coordinate.y.toFixed(4) }}
          </div>
          <div class="coord-item">
            z: {{ state.coordinate.z.toFixed(4) }}
          </div>
        </div>
        <div v-if="state.coordinate.latitude && state.coordinate.longitude" class="coord-category">
          <div class="coord-item">
            lng: {{ state.coordinate.longitude.toFixed(6) }}
          </div>
          <div class="coord-item">
            lat: {{ state.coordinate.latitude.toFixed(6) }}
          </div>
        </div>
        <NDivider />
      </div>

      <div v-if="state.basic">
        <p v-if="state.basic.roadKey">
          Road: {{ state.basic.roadKey }}
        </p>
        <p v-if="state.basic.sectionKey">
          LaneSection: {{ state.basic.sectionKey }}
        </p>
        <p v-if="state.basic.laneKey">
          Lane: {{ state.basic.laneKey }}
        </p>
        <NDivider />
      </div>

      <div v-if="state.successors.length" class="link-container">
        <p>
          <NIcon size="14">
            <LongArrowAltRight />
          </NIcon>
          <span>Successors</span>
        </p>
        <div class="link-list">
          <div v-for="item, idx in state.successors" :key="idx" class="link-item">
            <div class="link-element">
              <NIcon size="14">
                <Road />
              </NIcon>
              <span>{{ item[0] }}</span>
            </div>
            <div class="link-element">
              <NIcon size="14">
                <AlignJustify />
              </NIcon>
              <span>{{ item[1] }}</span>
            </div>
            <div class="link-element">
              <NIcon size="14">
                <GripLines />
              </NIcon>
              <span>{{ item[2] }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="state.predecessors.length" class="link-container">
        <p>
          <NIcon size="14">
            <LongArrowAltLeft />
          </NIcon>
          <span>Predecessors</span>
        </p>
        <div class="link-list">
          <div v-for="item, idx in state.predecessors" :key="idx" class="link-item">
            <div class="link-element">
              <NIcon size="14">
                <Road />
              </NIcon>
              <span>{{ item[0] }}</span>
            </div>
            <div class="link-element">
              <NIcon size="14">
                <AlignJustify />
              </NIcon>
              <span>{{ item[1] }}</span>
            </div>
            <div class="link-element">
              <NIcon size="14">
                <GripLines />
              </NIcon>
              <span>{{ item[2] }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.info-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 240px;
  height: auto;
  min-height: 120px;
  border-width: 1px;
  border-style: solid;
  padding: 8px;
  z-index: 9;
  pointer-events: unset;
}

.title {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.coord-list {
  display: flex;
  flex-direction: column;
}

.coord-category {
  display: flex;
  align-items: center;
  gap: 8px;
}

.coord-item {
  display: inline-block;
  min-width: 64px;
}

.link-container {
  display: flex;
  flex-direction: column;
}

.link-list {
  display: flex;
  flex-direction: column;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 8px;
}

.link-element {
  display: flex;
  align-items: center;
  min-width: 42px;
  gap: 4px
}
</style>
