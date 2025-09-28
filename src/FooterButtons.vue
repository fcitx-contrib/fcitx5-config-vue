<script setup lang="ts">
import type { ConfigManager } from './manager'
import { NButton, NFlex } from 'naive-ui'
import { t } from './i18n'

defineProps<{
  manager: ConfigManager
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <NFlex
    style="padding: 8px; justify-content: space-between"
  >
    <NFlex>
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
    <NFlex>
      <NButton
        secondary
        @click="$emit('close')"
      >
        {{ t('Close') }}
      </NButton>
    </NFlex>
  </NFlex>
</template>
