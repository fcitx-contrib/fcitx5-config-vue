<script setup lang="ts">
import type { ConfigManager } from './manager'
import { NButton, NFlex } from 'naive-ui'
import { t } from './i18n'
import { isMobile } from './util'

defineProps<{
  manager?: ConfigManager
  isReturn?: boolean
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <NFlex
    :style="{
      'padding': isMobile ? '8px 0 0 0' : '8px',
      'justify-content': 'space-between',
    }"
  >
    <NFlex v-if="manager">
      <NButton
        secondary
        :disabled="manager.undoStack.value.length === 0"
        @click="manager.undo()"
      >
        {{ t('Undo') }}
      </NButton>
      <NButton
        secondary
        :disabled="manager.redoStack.value.length === 0"
        @click="manager.redo()"
      >
        {{ t('Redo') }}
      </NButton>
      <NButton
        secondary
        @click="manager.reset()"
      >
        {{ t('Reset to default') }}
      </NButton>
    </NFlex>
    <NFlex style="flex-grow: 1; justify-content: end">
      <NButton
        secondary
        @click="$emit('close')"
      >
        {{ t(isReturn ? 'Return' : 'Close') }}
      </NButton>
    </NFlex>
  </NFlex>
</template>
