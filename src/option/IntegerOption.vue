<script setup lang="ts">
import { NInputNumber } from 'naive-ui'

const props = defineProps<{
  config: {
    Description: string
    IntMax?: string
    IntMin?: string
  }
  value: string
  onUpdate: (value: string) => void
}>()

function update(value: number | null) {
  if (value !== null) {
    props.onUpdate(String(value))
  }
}
</script>

<template>
  <NInputNumber
    :value="Number(value)"
    :input-props="{ 'aria-label': config.Description, 'role': 'spinbutton' }"
    :precision="0"
    :min="config.IntMin && Number(config.IntMin)"
    :max="config.IntMax && Number(config.IntMax)"
    clearable
    @update:value="update"
  />
</template>
