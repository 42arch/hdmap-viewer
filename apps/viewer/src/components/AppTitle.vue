<script setup lang="ts">
import { Github } from '@vicons/fa'
import { NDivider, NIcon } from 'naive-ui'

const version = import.meta.env.VITE_APP_VERSION
</script>

<template>
  <div class="app-title">
    <h1 class="header">
      <span class="name">HDMap Viewer</span>
      <span class="version">v{{ version }}</span>
    </h1>
    <NIcon size="14" class="github">
      <Github />
    </NIcon>
  </div>
  <NDivider />
</template>

<style lang="css" scoped>
.app-title {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 6px;
}

.header {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  margin: 0;
  gap: 4px;
}

.name {
  font-size: 16px;
  font-weight: 600;
}

.version {
  font-size: 10px;
  font-weight: 400;
  margin-bottom: 2px;
}

.github {
  cursor: pointer;

}
.github:hover {
  opacity: 80%;
}
</style>
