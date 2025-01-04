<script setup lang="ts">
import { NButton, NFlex } from 'naive-ui'
import { t } from './i18n'

defineProps<{
  reset: () => void
  close: () => void
  apply: () => void
}>()
</script>

<template>
  <NFlex
    style="padding: 8px; justify-content: space-between"
  >
    <NFlex>
      <NButton
        secondary
        @click="reset"
      >
        {{ t('Reset to default') }}
      </NButton>
      <NButton
        secondary
        @click="close"
      >
        {{ t('Cancel') }}
      </NButton>
    </NFlex>
    <NFlex>
      <NButton
        secondary
        @click="apply"
      >
        Apply
      </NButton>
      <NButton
        secondary
        type="info"
        @click="apply(); close()"
      >
        OK
      </NButton>
    </NFlex>
  </NFlex>
</template>
