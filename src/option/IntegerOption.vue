<script setup lang="ts">
import { NInputNumber } from 'naive-ui'

defineProps<{
  config: {
    IntMax?: string
    IntMin?: string
  }
  value: string
  onUpdate: (value: string) => void
}>()
</script>

<template>
  <NInputNumber
    :value="Number(value)"
    :precision="0"
    :min="config.IntMin && Number(config.IntMin)"
    :max="config.IntMax && Number(config.IntMax)"
    clearable
    @update:value="(v) => onUpdate(String(v))"
  />
</template>
