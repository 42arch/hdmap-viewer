<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import { darkTheme, NConfigProvider, NGlobalStyle } from 'naive-ui'
import MapViewer from './components/MapViewer.vue'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#3b82f6',
  },
  Button: {
  },
}
</script>

<template>
  <NConfigProvider class="h-full" :theme="darkTheme" :theme-overrides="themeOverrides">
    <MapViewer />

    <NGlobalStyle />
  </NConfigProvider>
</template>

<style scoped>

</style>
