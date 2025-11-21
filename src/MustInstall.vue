<script setup lang="ts">
import { NIcon, NTooltip } from 'naive-ui'
import { t } from './i18n'
import InfoIcon from './InfoIcon.vue'

defineProps<{
  plugin?: string
}>()
</script>

<template>
  <div style="display: flex; align-items: center; gap: 8px">
    <slot />
    <NTooltip v-if="plugin" trigger="click">
      <template #trigger>
        <NIcon size="16px">
          <InfoIcon />
        </NIcon>
      </template>
      {{ t('Must install {plugin}', { plugin }) }}
    </NTooltip>
  </div>
</template>
