<script setup lang="ts">
import { computed } from 'vue'
import { NSelect } from 'naive-ui'

const props = defineProps<{
  config: {
    Enum: { [key: string]: string }
    EnumI18n: { [key: string]: string }
  }
  value: string
  onUpdate: (value: string) => void
}>()

const options = computed(() => Object.entries(props.config.Enum).map(([key, value]) => ({
  label: props.config.EnumI18n[key],
  value,
})))
</script>

<template>
  <NSelect
    :value="value"
    :options="options"
    @update:value="v => onUpdate(v)"
  />
</template>
