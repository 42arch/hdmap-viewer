<script setup lang="ts">
import type { Level } from '@/libs/types'
import { AlignJustify, GripLines, LongArrowAltLeft, LongArrowAltRight, Road } from '@vicons/fa'
import { NCard, NDivider, NIcon } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { reactive, watch } from 'vue'
import { useAppStore } from '@/store'

interface InfoState {
  level: Level | null
  key: string | null
  roadKey: string | null
  sectionKey: string | null
  laneKey: string | null
  successors: string[][]
  predecessors: string[][]
}

const initState: InfoState = {
  level: null,
  key: null,
  roadKey: null,
  sectionKey: null,
  laneKey: null,
  successors: [],
  predecessors: [],
}

const store = useAppStore()
const { viewer } = storeToRefs(store)
const state = reactive<InfoState>(initState)

watch(viewer, () => {
  if (!viewer.value)
    return

  viewer.value.hm.onHighlight((info) => {
    console.log(9999999, info)
    if (!info) {
      state.key = null
      state.roadKey = null
      state.level = null
      state.sectionKey = null
      state.laneKey = null
      state.predecessors = []
      state.successors = []
      return
    }

    state.key = info.key
    const [roadKey, sectionKey, laneKey] = info.key?.split('_') || []
    state.roadKey = roadKey || null
    state.sectionKey = sectionKey || null
    state.laneKey = laneKey || null
    state.successors = info.successors.map(key => key.split('_'))
    state.predecessors = info.predecessors.map(key => key.split('_'))
  })
})
</script>

<template>
  <NCard v-show="state.key" class="info-panel" content-style="padding: 0">
    <NDivider />

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
  display: flex;
  align-items: center;
  gap: 4px;
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
  gap: 4px
}
</style>
