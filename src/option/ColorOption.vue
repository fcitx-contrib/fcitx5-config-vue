<script setup lang="ts">
import { NColorPicker } from 'naive-ui'

defineProps<{
  value: string
  onUpdate: (value: string) => void
}>()
</script>

<template>
  <NColorPicker
    :modes="['hex']"
    show-preview
    :value="value"
    @update:value="onUpdate"
  />
</template>
