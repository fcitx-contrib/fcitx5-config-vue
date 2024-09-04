<script setup lang="ts">
import { NSwitch } from 'naive-ui'

defineProps<{
  value: string
  onUpdate: (value: string) => void
}>()
</script>

<template>
  <NSwitch
    :value="value === 'True'"
    @update:value="(v) => onUpdate(v ? 'True' : 'False')"
  />
</template>
