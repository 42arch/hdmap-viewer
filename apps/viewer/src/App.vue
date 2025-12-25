<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import { darkTheme, NConfigProvider, NGlobalStyle, NMessageProvider } from 'naive-ui'
import InfoPanel from './components/InfoPanel.vue'
import MapViewer from './components/MapViewer.vue'
import OperatePanel from './components/OperatePanel.vue'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#6B76A4', // #6B76A4
    bodyColor: '#1E1E1E',
    fontSize: '12px',
    borderRadius: '0px',
    boxShadow1: 'none',
    boxShadow2: 'none',
  },
  Collapse: {
    titlePadding: '4px 0px',
    itemMargin: '4px 0px',
  },
  Tree: {
    nodeHeight: '24px',
    nodeWrapperPadding: '0px',
  },
  Checkbox: {
    fontSizeSmall: '12px',
  },
}
</script>

<template>
  <NConfigProvider class="h-full" :theme="darkTheme" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <OperatePanel />
      <InfoPanel />
      <MapViewer />
      <NGlobalStyle />
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>

</style>
