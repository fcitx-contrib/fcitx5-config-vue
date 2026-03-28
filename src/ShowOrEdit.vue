<script setup lang="ts">
import type { InputInst } from 'naive-ui'
import { NInput } from 'naive-ui'
import { nextTick, onMounted, ref, watchEffect } from 'vue'

const props = defineProps<{
  value: string
  editing: boolean
  autoFocus: boolean
  onUpdateValue: (value: string) => void
}>()

const cell = ref<HTMLElement>()
const isEdit = ref(props.editing)
const inputRef = ref<InputInst | null>(null)
const inputValue = ref(props.value)

watchEffect(() => {
  if (props.editing) {
    isEdit.value = true
    if (props.autoFocus) {
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
})

function handleClick() {
  isEdit.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function handleChange() {
  props.onUpdateValue(inputValue.value)
  isEdit.value = false
}

onMounted(() => {
  const td = cell.value?.parentElement as HTMLElement
  td.style.paddingTop = '0'
  td.style.paddingBottom = '0'
  td.style.height = 'calc(var(--n-td-padding) * 2 + var(--n-font-size) * var(--n-line-height))'
})
</script>

<template>
  <div ref="cell" style="width: 100%; min-height: calc(var(--n-font-size) * var(--n-line-height))" @click="handleClick">
    <NInput
      v-if="isEdit"
      ref="inputRef"
      v-model:value="inputValue"
      @change="handleChange"
    />
    <span v-else>{{ value }}</span>
  </div>
</template>
