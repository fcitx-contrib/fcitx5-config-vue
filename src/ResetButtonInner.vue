<script setup lang="ts">
import { NButton, useDialog } from 'naive-ui'
import { t } from './i18n'

const dialog = useDialog()

function click() {
  dialog.warning({
    title: t('Warning'),
    content: t('Your user data and installed plugins will be removed.'),
    positiveText: t('OK'),
    negativeText: t('Cancel'),
    onPositiveClick: async () => {
      await window.fcitx.reset()
      window.location.reload()
    },
  })
}
</script>

<template>
  <NButton type="error" secondary @click="click">
    {{ t('Reset') }}
  </NButton>
</template>
