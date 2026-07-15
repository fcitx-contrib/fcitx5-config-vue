<script setup lang="ts">
import type { UploadFileInfo, UploadInst } from 'naive-ui'
import { NA, NButton, NButtonGroup, NCheckbox, NFlex, NList, NListItem, NPopconfirm, NText, NUpload, useMessage } from 'naive-ui'
import { onMounted, ref } from 'vue'
import { PINYIN } from './constant'
import FileConverter from './FileConverter.vue'
import { t } from './i18n'

interface Dict {
  id: string
  enabled: boolean
}

const DICT_DIR = `${PINYIN}dictionaries`

const DICT_SUFFIX = /\.dict$/
const SCEL_SUFFIX = /\.scel$/
const TEXT_SUFFIX = /\.txt$/
const DICT_RE = /^(.+)\.dict(\.disable)?$/
const DICT_ACCEPTS = '.dict,.scel,.txt'

const message = useMessage()
const fs = window.fcitx.Module.FS

const uploadRef = ref<UploadInst | null>(null)
const useConverter = ref(false)

const dicts = ref<Dict[]>([])
const selectedDict = ref<Dict | null>(null)

let uploadTimer: number | null = null

function refreshDicts() {
  const result = fs.readdir(DICT_DIR)
    .filter(name => DICT_RE.test(name))
    .map((name) => {
      const [, id, disable] = name.match(DICT_RE)!
      return { id, enabled: !disable }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
  dicts.value = result
}

function handleDictChecked(id: string, checked: boolean) {
  const enabledPath = `${DICT_DIR}/${id}.dict`
  const disabledPath = `${DICT_DIR}/${id}.dict.disable`
  if (checked) {
    fs.rename(disabledPath, enabledPath)
  }
  else {
    fs.rename(enabledPath, disabledPath)
  }
  refreshDicts()
}

function onUpload(files: UploadFileInfo[]) {
  if (files.length === 0) {
    return
  }

  if (uploadTimer) {
    clearTimeout(uploadTimer)
    uploadTimer = null
  }
  uploadTimer = window.setTimeout(async () => {
    let success = 0
    let failure = 0
    for (const file of files) {
      const arrayBuffer = await file.file?.arrayBuffer()
      if (importDict(file.name, arrayBuffer!)) {
        success += 1
      }
      else {
        failure += 1
      }
    }
    message.info(t('Importing {total} dictionary(-ies): {success} suceess, {failure} failure', { total: success + failure, success, failure }))
    refreshDicts()
  }, 300)
}

function importDict(filename: string, arrayBuffer: ArrayBuffer): boolean {
  if (filename.endsWith('.dict')) {
    fs.writeFile(`${DICT_DIR}/${filename}`, new Uint8Array(arrayBuffer))
    return true
  }
  const src = `/tmp/${filename}`
  fs.writeFile(src, new Uint8Array(arrayBuffer))
  const txt = `/tmp/${filename.replace(SCEL_SUFFIX, '.txt')}`
  const dst = `${DICT_DIR}/${filename.replace(SCEL_SUFFIX, '.dict').replace(TEXT_SUFFIX, '.dict')}`
  try {
    if (filename.endsWith('.scel') && decompileScel(src, txt) !== 0) {
      return false
    }
    return compileDict(txt, dst) === 0
  }
  finally {
    fs.unlink(src)
    if (txt !== src) {
      fs.unlink(txt)
    }
  }
}

function compileDict(src: string, dst: string) {
  return window.fcitx.cli('libime_pinyindict', src, dst)
}

function decompileDict(src: string, dst: string) {
  return window.fcitx.cli('libime_pinyindict', '-d', src, dst)
}

function decompileScel(src: string, dst: string) {
  return window.fcitx.cli('scel2org5', '-o', dst, src)
}

function removeDict(dict: Dict) {
  const base = `${DICT_DIR}/${dict.id}.dict`
  const path = dict.enabled ? base : `${base}.disable`
  try {
    fs.unlink(path)
  }
  catch {
    message.error(t('Error on removing {name}', { name: dict.id }))
  }
}

function handleRemove() {
  if (!selectedDict.value) {
    return
  }
  removeDict(selectedDict.value)
  refreshDicts()
  selectedDict.value = null
}

function handleRemoveAll() {
  for (const dict of dicts.value) {
    removeDict(dict)
  }
  refreshDicts()
  selectedDict.value = null
}

onMounted(() => {
  fs.mkdirTree(DICT_DIR)
  refreshDicts()
})
</script>

<template>
  <NFlex v-if="useConverter" vertical>
    {{ t('Convert .dict to .txt') }}
    <FileConverter accept=".dict" :rename="(name: string) => name.replace(DICT_SUFFIX, '.txt')" :convert="decompileDict" />
    <NButton size="small" @click="useConverter = false">
      {{ t('Return') }}
    </NButton>
  </NFlex>

  <NFlex v-else>
    <NFlex vertical style="flex-grow: 1">
      <NList bordered clickable :show-divider="false" style="flex-grow: 1">
        <NListItem v-for="dict in dicts" :key="dict.id" @click="selectedDict = dict">
          <template #prefix>
            <NCheckbox
              size="small" :checked="dict.enabled"
              @update:checked="checked => handleDictChecked(dict.id, checked)"
            />
          </template>
          <NText :type="selectedDict?.id === dict.id ? 'primary' : 'default'" :strong="selectedDict?.id === dict.id">
            {{ dict.id }}
          </NText>
        </NListItem>
      </NList>
      <NA href="https://pinyin.sogou.com/dict/" target="_blank">
        {{ t('Browse Sogou Cell Dictionary online') }}
      </NA>
    </NFlex>
    <NFlex vertical>
      <NButton size="small" @click="uploadRef?.openOpenFileDialog()">
        {{ t('Import') }}
      </NButton>
      <NButton size="small" @click="useConverter = true">
        {{ t('Convert') }}
      </NButton>
      <NButtonGroup vertical>
        <NPopconfirm @positive-click="handleRemove">
          <template #trigger>
            <NButton strong secondary type="error" size="small" :disabled="!selectedDict">
              {{ t('Remove') }}
            </NButton>
          </template>
          {{ t('Are you sure to remove {name}?', { name: selectedDict?.id ?? '' }) }}
        </NPopconfirm>
        <NPopconfirm @positive-click="handleRemoveAll">
          <template #trigger>
            <NButton type="error" size="small">
              {{ t('Remove all') }}
            </NButton>
          </template>
          {{ t('Are you sure to remove all dictionaries?') }}
        </NPopconfirm>
      </NButtonGroup>
      <NUpload
        ref="uploadRef"
        multiple
        :accept="DICT_ACCEPTS"
        :show-file-list="false"
        @update:file-list="onUpload"
      />
    </NFlex>
  </NFlex>
</template>
