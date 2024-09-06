<script setup lang="ts">
import { NCard } from 'naive-ui'
import BasicConfig from '../BasicConfig.vue'

defineProps<{
  config: {
    Children: any[]
  }
  value: any
  onUpdate: (value: any) => void
}>()
</script>

<template>
  <NCard>
    <BasicConfig
      path=""
      :config="config"
      :value="value"
      @update="onUpdate"
    />
  </NCard>
</template>
