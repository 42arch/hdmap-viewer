<script setup lang="ts">
import type { TreeOption, UploadFileInfo } from 'naive-ui'
import type { Level } from '@/libs/types'
import { CaretRight, Crosshairs, Eye, EyeSlash } from '@vicons/fa'
import { NButton, NCard, NCheckbox, NCollapse, NCollapseItem, NGrid, NGridItem, NIcon, NSelect, NTree, NUpload, useMessage } from 'naive-ui'
import OpenDrive from 'opendrive-parser'
import { storeToRefs } from 'pinia'
import { computed, h, ref, watch } from 'vue'
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
  viewer.value.vm.fitToCamera()
})

watch(viewer, (v) => {
  if (v && !openDriveContent.value)
    loadDefaultMap()
})

async function loadDefaultMap() {
  loading.value = true
  try {
    const res = await fetch('/data/Town04_Opt.xodr')
    const content = await res.text()
    if (content && viewer.value) {
      store.setFileInfo({
        name: 'Town04_Opt.xodr',
        size: 0,
      })
      store.setOpenDriveContent(content)
      const openDrive = parseOpenDrive(content, precision.value)
      store.setOpenDrive(openDrive)
      viewer.value.setOpenDrive(openDrive)
      viewer.value.vm.fitToCamera()
      message.success('Loaded default map')
    }
  }
  catch (error) {
    message.error('Failed to load default map')
    console.error(error)
  }
  loading.value = false
}

function parseOpenDrive(content: string, precision: number) {
  const openDrive = new OpenDrive(content, precision)
  openDrive.process()
  return openDrive
}

function handleChange({ file }: { file: UploadFileInfo }) {
  loading.value = true
  const t1 = performance.now()
  const reader = new FileReader()

  store.clear()
  store.setFileInfo({
    name: file.name,
    size: file.file?.size || 0,
  })
  reader.onload = (event) => {
    if (!viewer.value)
      return
    const content = event.target?.result as string
    if (content) {
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

let highlightTimer: any = null

function nodeProps({ option }: { option: TreeOption }) {
  const isVisible = store.isElementVisible(option.key as string)
  return {
    style: isVisible ? '' : 'opacity: 0.4;',
    onClick() {
      // viewer.value?.setSelectedLane(option.key as string)
    },
    onMouseover() {
      if (!isVisible)
        return
      if (highlightTimer)
        clearTimeout(highlightTimer)
      highlightTimer = setTimeout(() => {
        viewer.value?.hm.setHighlight(option.level as Level, option.key as string, 'panel')
      }, 50)
    },
    onMouseout() {
      if (highlightTimer)
        clearTimeout(highlightTimer)
      viewer.value?.hm.clear('panel')
    },
  }
}

function renderSuffix({ option }: { option: TreeOption }) {
  const isVisible = store.isElementVisible(option.key as string)

  return h(
    'div',
    {
      class: 'action-buttons',
    },
    [
      h(
        NButton,
        {
          text: true,
          size: 'tiny',
          style: 'padding: 2px;',
          title: 'Zoom to element',
          onClick: (e: MouseEvent) => {
            e.stopPropagation()
            viewer.value?.zoomTo(option.level as Level, option.key as string)
          },
        },
        {
          default: () => h(NIcon, { size: 12 }, { default: () => h(Crosshairs) }),
        },
      ),
      h(
        NButton,
        {
          text: true,
          size: 'tiny',
          style: 'padding: 2px; margin-left: 4px;',
          title: isVisible ? 'Hide element' : 'Show element',
          onClick: (e: MouseEvent) => {
            e.stopPropagation()
            store.toggleVisibility(option.key as string)
          },
        },
        {
          default: () => h(NIcon, { size: 12 }, { default: () => h(isVisible ? Eye : EyeSlash) }),
        },
      ),
    ],
  )
}

const roadNetworkData = computed(() => {
  if (!openDrive.value)
    return []

  // Track visibilityMap for reactivity
  void store.visibilityMap

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

function handlePerfMonitor(v: boolean) {
  viewer.value?.vm.togglePerfMonitor(v)
}

function handleHoverHighlight(v: boolean) {
  viewer.value?.vm.toggleHoverHighlight(v)
}

function handleZoomAll() {
  viewer.value?.vm.fitToCamera()
}

function handleToggleAll() {
  store.toggleAllVisibility()
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
            <NCheckbox size="small" label="Grid" :default-checked="true" @update:checked="handleHelper" />
          </NGridItem>
          <NGridItem>
            <NCheckbox size="small" label="Hover Highlight" :default-checked="true" @update:checked="handleHoverHighlight" />
          </NGridItem>
          <NGridItem>
            <NCheckbox size="small" label="Performance Monitor" :default-checked="false" @update:checked="handlePerfMonitor" />
          </NGridItem>
        </NGrid>
      </NCollapseItem>
      <NCollapseItem title="Road Network" name="3">
        <template #header-extra>
          <div class="global-actions" @click.stop>
            <NButton
              text
              size="tiny"
              title="Zoom to fit map"
              style="padding: 2px;"
              @click="handleZoomAll"
            >
              <NIcon :size="12">
                <Crosshairs />
              </NIcon>
            </NButton>
            <NButton
              text
              size="tiny"
              :title="store.areAllVisible() ? 'Hide all roads' : 'Show all roads'"
              style="padding: 2px; margin-left: 4px;"
              @click="handleToggleAll"
            >
              <NIcon :size="12">
                <component :is="store.areAllVisible() ? Eye : EyeSlash" />
              </NIcon>
            </NButton>
          </div>
        </template>
        <NTree
          block-line :data="roadNetworkData" :indent="14" :show-line="true"
          expand-on-click :selectable="false" virtual-scroll
          style="max-height: 320px;"
          :node-props="nodeProps" :render-suffix="renderSuffix"
        />
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
  user-select: none;
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

:deep(.n-tree-node) {
  position: relative;
}

:deep(.action-buttons) {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  margin-left: auto;
  display: flex;
  align-items: center;
}

:deep(.n-tree-node:hover) .action-buttons {
  opacity: 1;
  visibility: visible;
}

:deep(.action-buttons .n-button) {
  color: var(--n-text-color) !important;
}

:deep(.action-buttons .n-button:hover) {
  color: var(--n-primary-color-hover) !important;
}

.global-actions {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.global-actions .n-button {
  color: var(--n-text-color);
}

.global-actions .n-button:hover {
  color: var(--n-primary-color-hover);
}
</style>
