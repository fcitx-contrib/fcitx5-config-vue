<script setup lang="ts">
import type { TreeOption, UploadFileInfo } from 'naive-ui'
import { NA, NButton, NCard, NFlex, NPopconfirm, NTree, NUpload, NUploadDragger, useMessage } from 'naive-ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'
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

type DictManagerMode = 'list' | 'converter' | 'upload'

const fileList = ref<UploadFileInfo[]>([])
const mode = ref<DictManagerMode>('list')

const dicts = ref<Dict[]>([])
const selectedKeys = ref<string[]>([])
const selectedDict = computed(() =>
  dicts.value.find(dict => dict.id === selectedKeys.value[0]) ?? null)

const treeData = computed<TreeOption[]>(() =>
  dicts.value.map(dict => ({ key: dict.id, label: dict.id })))
const checkedKeys = computed(() => dicts.value.filter(dict => dict.enabled).map(dict => dict.id))

function handleUpdateCheckedKeys(_keys: (string | number)[], _options: (TreeOption | null)[], meta: { node: TreeOption | null, action: 'check' | 'uncheck' }) {
  const id = meta.node?.key as string
  handleDictChecked(id, meta.action === 'check')
}

function handleUpdateSelectedKeys(keys: string[]) {
  selectedKeys.value = [...keys]
}

// Workaround naive-ui's behavior that batch upload n files calls onUpload n times.
let uploadTimer: ReturnType<typeof setTimeout> | undefined

function refreshDicts() {
  const result = fs.readdir(DICT_DIR)
    .filter(name => DICT_RE.test(name))
    .map((name) => {
      const [, id, disable] = name.match(DICT_RE)!
      return { id, enabled: !disable }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
  dicts.value = result
  window.fcitx.setConfig('fcitx://config/addon/pinyin/dictmanager', {})
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

  clearTimeout(uploadTimer)
  uploadTimer = window.setTimeout(async () => {
    uploadTimer = undefined
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
    fileList.value = []
    mode.value = 'list'
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
  selectedKeys.value = []
}

function handleRemoveAll() {
  for (const dict of dicts.value) {
    removeDict(dict)
  }
  refreshDicts()
  selectedKeys.value = []
}

onMounted(() => {
  fs.mkdirTree(DICT_DIR)
  refreshDicts()
})

onUnmounted(() => {
  clearTimeout(uploadTimer)
})
</script>

<template>
  <NFlex v-if="mode === 'converter'" vertical>
    {{ t('Convert .dict to .txt') }}
    <FileConverter accept=".dict" :rename="(name: string) => name.replace(DICT_SUFFIX, '.txt')" :convert="decompileDict" />
    <NButton size="small" @click="mode = 'list'">
      {{ t('Return') }}
    </NButton>
  </NFlex>

  <NFlex v-else-if="mode === 'upload'" vertical>
    {{ t('Import') }}
    <NUpload
      v-model:file-list="fileList"
      multiple
      :accept="DICT_ACCEPTS"
      :show-file-list="false"
      @update:file-list="onUpload"
    >
      <NUploadDragger>
        {{ t('Click or drag to this area') }} <br>
        {{ t('Accept format: {format}', { format: DICT_ACCEPTS }) }}
      </NUploadDragger>
    </NUpload>
    <NButton size="small" @click="mode = 'list'">
      {{ t('Return') }}
    </NButton>
  </NFlex>

  <NFlex v-else>
    <NFlex vertical style="flex-grow: 1">
      <NCard style="height: 100%">
        <NTree
          block-line
          block-node
          checkable
          selectable
          :data="treeData"
          :checked-keys="checkedKeys"
          :selected-keys="selectedKeys"
          style="flex-grow: 1"
          @update:checked-keys="handleUpdateCheckedKeys"
          @update:selected-keys="handleUpdateSelectedKeys"
        />
      </NCard>
      <NA href="https://pinyin.sogou.com/dict/" target="_blank">
        {{ t('Browse Sogou Cell Dictionary online') }}
      </NA>
    </NFlex>
    <NFlex vertical>
      <NButton size="small" @click="mode = 'upload'">
        {{ t('Import') }}
      </NButton>
      <NButton size="small" @click="mode = 'converter'">
        {{ t('Convert') }}
      </NButton>
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
          <NButton type="error" size="small" :disabled="dicts.length === 0">
            {{ t('Remove all') }}
          </NButton>
        </template>
        {{ t('Are you sure to remove all dictionaries?') }}
      </NPopconfirm>
    </NFlex>
  </NFlex>
</template>
