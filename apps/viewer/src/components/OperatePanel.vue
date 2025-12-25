<script setup lang="ts">
import type { TreeOption, UploadFileInfo } from 'naive-ui'
import type { Level } from '@/libs/types'
import { CaretRight } from '@vicons/fa'
import { NButton, NCard, NCheckbox, NCollapse, NCollapseItem, NGrid, NGridItem, NIcon, NScrollbar, NSelect, NTree, NUpload, useMessage } from 'naive-ui'
import OpenDrive from 'opendrive-parser'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAppStore } from '@/store'
import AppTitle from './AppTitle.vue'

const store = useAppStore()
const message = useMessage()
const { viewer, openDrive, openDriveContent } = storeToRefs(store)
const loading = ref(false)
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
  const openDrive = parseOpenDrive(openDriveContent.value!, precision.value)
  store.setOpenDrive(openDrive)
  viewer.value.setOpenDrive(openDrive)
})

function parseOpenDrive(content: string, precision: number) {
  const openDrive = new OpenDrive(content, precision)
  openDrive.process()
  return openDrive
}

function handleChange({ file }: { file: UploadFileInfo }) {
  loading.value = true
  const t1 = performance.now()
  const reader = new FileReader()
  reader.onload = (event) => {
    if (!viewer.value)
      return
    const content = event.target?.result as string
    if (content) {
      store.clear()
      store.setOpenDriveContent(content)
      const openDrive = parseOpenDrive(content, precision.value)
      store.setOpenDrive(openDrive)
      viewer.value.setOpenDrive(openDrive)
      viewer.value.vm.fitToCamera()
    }
    const t2 = performance.now()
    const total = t2 - t1
    message.success(`Loaded in ${total.toFixed(2)}ms`)
    loading.value = false
  }

  reader.readAsText(file.file as Blob)
}

function nodeProps({ option }: { option: TreeOption }) {
  return {
    onClick() {
      // viewer.value?.setSelectedLane(option.key as string)
    },
    onMouseover() {
      viewer.value?.hm.setHighlight(option.level as Level, option.key as string, 'panel')
    },
    onMouseout() {
      viewer.value?.hm.clear('panel')
    },
  }
}

const roadNetworkData = computed(() => {
  if (!openDrive.value)
    return []
  return openDrive.value.getRoads().map((road) => {
    return {
      label: road.name || road.id,
      key: `${road.id}`,
      value: road,
      level: 'road',
      children: road.getLaneSections().map((section) => {
        return {
          label: String(section.s),
          key: `${road.id}_${section.s}`,
          value: section,
          level: 'section',
          children: section.getLanes().map((lane) => {
            return {
              label: `${lane.id}  (${lane.type})`,
              key: `${road.id}_${section.s}_${lane.id}`,
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

function handleReferenceLine(v: boolean) {
  viewer.value?.vm.toggleReferenceLines(v)
}

function handleRoads(v: boolean) {
  viewer.value?.vm.toggleRoads(v)
}

function handleRoadmarks(v: boolean) {
  viewer.value?.vm.toggleRoadmarks(v)
}

function handleHelper(v: boolean) {
  viewer.value?.vm.toggleHelper(v)
}
</script>

<template>
  <NCard class="operate-panel" content-style="padding: 0">
    <AppTitle />
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
            <NCheckbox size="small" label="Roads" :default-checked="true" @update:checked="handleRoads" />
          </NGridItem>
          <NGridItem>
            <NCheckbox size="small" label="Roadmarks" :default-checked="true" @update:checked="handleRoadmarks" />
          </NGridItem>
          <NGridItem>
            <NCheckbox size="small" label="Reference Lines" :default-checked="true" @update:checked="handleReferenceLine" />
          </NGridItem>
          <NGridItem>
            <NCheckbox size="small" label="Grid Helper" :default-checked="true" @update:checked="handleHelper" />
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
        <NButton size="tiny" :loading="loading" :disabled="loading" class="upload-btn">
          Upload File
        </NButton>
      </NUpload>
    </div>
  </NCard>
</template>

<style scoped>
.operate-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 240px;
  border-width: 1px;
  border-style: solid;
  padding: 8px;
  z-index: 9;
}

.upload {
  position: relative;
  margin-top: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-btn {
  width: 220px;
}
</style>
