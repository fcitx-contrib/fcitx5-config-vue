<script setup lang="ts">
import { NFormItem, NInput } from 'naive-ui'
import { computed } from 'vue'
import { t } from '../i18n'

const props = defineProps<{
  config: { [key: string]: any }
  value: string
  onUpdate: (value: string) => void
}>()

function isRegex(config: { [key: string]: any }) {
  return config.IsRegex === 'True'
    || ((config.ListConstrain ?? {}).IsRegex === 'True')
}

function isRegexValid(value: string) {
  return window.fcitx.Module.ccall('is_regex_valid', 'boolean', ['string'], [value])
}

const isValid = computed(() => {
  const text = props.value ?? ''
  return !isRegex(props.config) || text.length === 0 || isRegexValid(text)
})

const inputValidationStatus = computed(() => {
  return isValid.value ? undefined : 'error'
})

const inputFeedback = computed(() => {
  if (!isValid.value) {
    return t('Invalid regular expression')
  }
  return undefined
})
</script>

<template>
  <NFormItem
    :validation-status="inputValidationStatus"
    :feedback="inputFeedback"
    :show-label="false"
    :show-feedback="!isValid"
  >
    <NInput
      :value="value"
      @update:value="onUpdate"
    />
  </NFormItem>
</template>
