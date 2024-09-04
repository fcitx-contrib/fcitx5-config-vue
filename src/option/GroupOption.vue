<script setup lang="ts">
import { ref } from 'vue'
import { NCard } from 'naive-ui'
import BasicConfig from '../BasicConfig.vue'

defineProps<{
  config: {
    Children: any[]
  }
  value: any
  onUpdate: (value: any) => void
}>()

const basicConfig = ref()
</script>

<template>
  <NCard>
    <BasicConfig
      ref="basicConfig"
      path=""
      :config="config"
      :value="value"
      @update="onUpdate"
    />
  </NCard>
</template>
