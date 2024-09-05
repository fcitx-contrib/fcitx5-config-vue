<script setup lang="ts">
import { NButton, NTooltip } from 'naive-ui'

defineProps<{
  text: string
}>()
</script>

<template>
  <NTooltip trigger="hover">
    <template #trigger>
      <NButton
        secondary
        circle
        size="tiny"
      >
        ?
      </NButton>
    </template>
    {{ text }}
  </NTooltip>
</template>
