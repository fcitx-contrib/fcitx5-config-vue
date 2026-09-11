<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed, ref } from 'vue'

const props = defineProps<{
  config: {
    Description: string
  }
  value: string
  onUpdate: (value: string) => void
}>()

const recording = ref(false)
const pressed = ref(false)
const label = computed(() => recording.value && !pressed.value
  ? '●'
  : props.value ? window.fcitx.fcitxStringToLocalizedString(props.value) : '●REC')

function keydown(e: KeyboardEvent) {
  if (!recording.value) {
    return
  }
  e.stopPropagation()
  e.preventDefault()
  pressed.value = true
  props.onUpdate(window.fcitx.jsKeyToFcitxString(e))
}

function click() {
  recording.value = true
  pressed.value = false
}

function blur() {
  recording.value = false
}
</script>

<template>
  <NButton
    :aria-label="config.Description"
    @keydown="keydown"
    @click="click"
    @blur="blur"
  >
    {{ label }}
  </NButton>
</template>
