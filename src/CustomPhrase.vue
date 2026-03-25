<script setup lang="ts">
import type { CustomPhrase } from 'fcitx5-js'
import { NButton, NCheckbox, NDynamicInput, NFlex, NInput, NInputNumber, NSpace } from 'naive-ui'
import { ref } from 'vue'
import { PINYIN } from './constant'
import { t } from './i18n'

const emit = defineEmits<{
  close: []
}>()

const CUSTOMPHRASE = `${PINYIN}customphrase`
const customPhrases = ref<CustomPhrase[]>(window.fcitx.getCustomPhrases(CUSTOMPHRASE))

function create() {
  return {
    enabled: true,
    keyword: '',
    phrase: '',
    order: 1,
  }
}

function save() {
  window.fcitx.Module.FS.mkdirTree(PINYIN)
  window.fcitx.setCustomPhrases(CUSTOMPHRASE, customPhrases.value)
  window.fcitx.setConfig('fcitx://config/addon/pinyin/customphrase', {})
  emit('close')
}
</script>

<template>
  <NFlex vertical>
    <NDynamicInput v-model:value="customPhrases" :on-create="create">
      <template #default="{ value }">
        <NSpace vertical>
          <NSpace align="center">
            <NCheckbox v-model:checked="value.enabled" />
            <NInput v-model:value="value.keyword" :placeholder="t('Keyword')" style="width: 120px" />
            <NInput v-model:value="value.phrase" :placeholder="t('Phrase')" />
            <NInputNumber v-model:value="value.order" :placeholder="t('Order')" :min="1" style="width: 120px" />
          </NSpace>
        </NSpace>
      </template>
    </NDynamicInput>
    <div style="display: flex; justify-content: flex-end">
      <NButton secondary type="info" @click="save">
        {{ t('Save') }}
      </NButton>
    </div>
  </NFlex>
</template>
