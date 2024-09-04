<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { NAlert, NForm, NFormItem } from 'naive-ui'
import type { Config } from 'fcitx5-js'
import IntegerOption from './option/IntegerOption.vue'
import BooleanOption from './option/BooleanOption.vue'
import UnknownOption from './option/UnknownOption.vue'
import { isMobile } from './util'

const props = defineProps<{
  path: string
  config: Config
}>()

const labelPlacement = computed(() => isMobile.value ? 'top' : 'left')

function toComponent(type: string) {
  switch (type) {
    case 'Integer':
      return IntegerOption
    case 'Boolean':
      return BooleanOption
    default:
      return UnknownOption
  }
}

function extractValue(reset: boolean) {
  const value: { [key: string]: any } = {}
  if ('Children' in props.config) {
    for (const child of props.config.Children) {
      value[child.Option] = reset ? child.DefaultValue : child.Value
    }
  }
  return value
}

const form = ref<{ [key: string]: any }>({})

watchEffect(() => {
  form.value = extractValue(false)
})

function reset() {
  form.value = extractValue(true)
}

function get() {
  return form.value
}

defineExpose({
  reset,
  get,
})
</script>

<template>
  <NAlert v-if="'ERROR' in config" title="Error" type="error">
    {{ config.ERROR }}
  </NAlert>
  <NForm
    v-else
    :model="form"
    :label-placement="labelPlacement"
    label-width="200px"
  >
    <NFormItem
      v-for="child in config.Children"
      :key="`${path}/${child.Option}`"
      :label="child.Description"
    >
      <component
        :is="toComponent(child.Type)"
        :config="child"
        :value="form[child.Option]"
        :on-update="(v) => { form[child.Option] = v }"
      />
    </NFormItem>
  </NForm>
</template>
