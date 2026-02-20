<script setup lang="ts">
import FileConverter from './FileConverter.vue'
import { t } from './i18n'

function renameDict(name: string) {
  return name.replace(/\.dict$/, '.txt')
}

function convertDict(src: string, dst: string) {
  return window.fcitx.cli('libime_pinyindict', '-d', src, dst)
}
</script>

<template>
  {{ t('Convert .dict to .txt') }}
  <FileConverter
    accept=".dict"
    :rename="renameDict"
    :convert="convertDict"
  />
</template>
