<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import GearIcon from './GearIcon.vue'
</script>

<template>
  <NButton secondary>
    <template #icon>
      <NIcon>
        <GearIcon />
      </NIcon>
    </template>
  </NButton>
</template>
