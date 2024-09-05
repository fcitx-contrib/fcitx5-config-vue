<script setup lang="ts">
import { NInput } from 'naive-ui'

defineProps<{
  value: string
  onUpdate: (value: string) => void
}>()
</script>

<template>
  <NInput
    :value="value"
    @update:value="onUpdate"
  />
</template>
