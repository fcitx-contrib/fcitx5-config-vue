<script setup lang="ts">
import { NSelect } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  config: {
    Description: string
    Enum: { [key: string]: string }
    EnumI18n?: { [key: string]: string }
  }
  value: string
  onUpdate: (value: string) => void
}>()

const options = computed(() => Object.entries(props.config.Enum).map(([key, value]) => ({
  label: (props.config.EnumI18n || props.config.Enum)[key],
  value,
})))

function update(value: string) {
  if (value !== props.value) {
    props.onUpdate(value)
  }
}
</script>

<template>
  <NSelect
    role="combobox"
    :aria-label="config.Description"
    :value="value"
    :options="options"
    @update:value="update"
  />
</template>
