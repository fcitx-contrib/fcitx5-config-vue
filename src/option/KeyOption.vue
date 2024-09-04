<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton } from 'naive-ui'

const props = defineProps<{
  value: string
  onUpdate: (value: string) => void
}>()

const recording = ref(false)
const pressed = ref(false)
const label = computed(() => recording.value && !pressed.value ? '●' : props.value || '●REC')

function keydown(e: KeyboardEvent) {
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
    @keydown.stop.prevent="keydown"
    @click="click"
    @blur="blur"
  >
    {{ label }}
  </NButton>
</template>
