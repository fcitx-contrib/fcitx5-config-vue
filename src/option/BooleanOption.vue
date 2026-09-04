<script setup lang="ts">
import { NSwitch } from 'naive-ui'

defineProps<{
  config: {
    Description: string
  }
  value: string
  onUpdate: (value: string) => void
}>()
</script>

<template>
  <NSwitch
    :aria-label="config.Description"
    :value="value === 'True'"
    @update:value="(v) => onUpdate(v ? 'True' : 'False')"
  />
</template>
