<script setup lang="ts">
import type { TreeOption, UploadFileInfo } from 'naive-ui'
import { CaretRight } from '@vicons/fa'
import { NButton, NCheckbox, NCollapse, NCollapseItem, NGrid, NGridItem, NIcon, NScrollbar, NSelect, NTree, NUpload, useThemeVars } from 'naive-ui'
import OpenDrive from 'opendrive-parser'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAppStore } from '../store'

const themeVars = useThemeVars()
const store = useAppStore()
const { viewer, roads, openDriveContent } = storeToRefs(store)
const precision = ref(1)
const precisionOptions = [{
  label: 'High (0.04)',
  value: 0.04,
}, {
  label: 'Medium (0.2)',
  value: 0.2,
}, {
  label: 'Low (1)',
  value: 1,
}]

watch(precision, () => {
  if (!viewer.value)
    return

  viewer.value.clear()
  const { referenceLines, roads } = parseOpenDrive(openDriveContent.value!, precision.value)

  viewer.value.addReferenceLines(referenceLines)
  store.setRoads(roads)
  viewer.value.addLanes(roads)
  viewer.value.addLaneAreas(roads)
})

function parseOpenDrive(content: string, precision: number) {
  const openDrive = new OpenDrive(content, precision)
  console.log('openDrive', openDrive)

  openDrive.process()

  const referenceLines = openDrive.getReferenceLines()
  const roads = openDrive.getRoads()

  return { referenceLines, roads }
}

function handleChange({ file }: { file: UploadFileInfo }) {
  const reader = new FileReader()
  reader.onload = (event) => {
    if (!viewer.value)
      return
    const content = event.target?.result as string
    if (content) {
      store.setOpenDriveContent(content)
      const { referenceLines, roads } = parseOpenDrive(content, precision.value)
      viewer.value.clear()
      viewer.value.addReferenceLines(referenceLines)
      store.setRoads(roads)
      viewer.value.addLanes(roads)
      viewer.value.addLaneAreas(roads)
    }
  }

  reader.readAsText(file.file as Blob)
}

function nodeProps({ option }: { option: TreeOption }) {
  return {
    onClick() {
      viewer.value?.setSelectedLane(option.key as string)
    },
    onMouseover() {
      // console.log('onMouseOver option', option)
      // if (option.isLeaf) {
      //   // store.setSelectedLane(option.value as Lane)
      //   viewer.value?.setSelectedLane(option.key as string)
      // }
    },
    onMouseout() {
      // viewer.value?.setSelectedLane(null)
    },
  }
}

const roadNetworkData = computed(() => {
  return roads.value.map((road) => {
    return {
      label: road.name,
      key: `${road.id}`,
      value: road,
      level: 'road',
      children: road.getLaneSections().map((section) => {
        return {
          label: String(section.s),
          key: `${road.id}-${section.s}`,
          value: section,
          level: 'section',
          children: section.getLanes().map((lane) => {
            return {
              label: `${lane.id}  (${lane.type})`,
              key: `${road.id}-${section.s}-${lane.id}`,
              value: lane,
              level: 'lane',
              isLeaf: true,
            }
          }),
        }
      }),
    }
  })
})
</script>

<template>
  <div class="operate-panel" :style="{ background: themeVars.bodyColor, borderColor: themeVars.borderColor }">
    <NCollapse>
      <template #arrow>
        <NIcon size="14">
          <CaretRight />
        </NIcon>
      </template>
      <NCollapseItem title="Parse Options" name="1">
        <NSelect v-model:value="precision" size="tiny" menu-size="tiny" :options="precisionOptions" />
      </NCollapseItem>
      <NCollapseItem title="View Options" name="2">
        <NGrid :y-gap="4" :cols="1">
          <NGridItem>
            <NCheckbox size="small" label="Road Area" />
          </NGridItem>
          <NGridItem>
            <NCheckbox size="small" label="Lane Line" />
          </NGridItem>
          <NGridItem>
            <NCheckbox size="small" label="Reference Line" />
          </NGridItem>
        </NGrid>
      </NCollapseItem>
      <NCollapseItem title="Road Network" name="3">
        <NScrollbar style="max-height: 320px;">
          <NTree
            block-line :data="roadNetworkData" :indent="14" :show-line="true"
            :node-props="nodeProps"
          />
        </NScrollbar>
      </NCollapseItem>
    </NCollapse>

    <div class="upload">
      <NUpload :default-upload="false" :show-file-list="false" accept=".xodr" @change="handleChange">
        <NButton size="tiny" class="upload-btn">
          上传文件
        </NButton>
      </NUpload>
    </div>
  </div>
</template>

<style scoped>
.operate-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 240px;
  border-width: 1px;
  border-style: solid;
  padding: 8px;
  z-index: 9;
}

.upload {
  position: relative;
  width: 80%;
  margin-top: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-btn {
  width: 240px;
}
</style>
