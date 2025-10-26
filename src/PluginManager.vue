<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui'
import { NA, NFlex, NList, NListItem, NUpload, NUploadDragger, useMessage } from 'naive-ui'
import { computed, ref } from 'vue'
import { t } from './i18n'

defineProps<{
  disabled: boolean
}>()

const message = useMessage()

function getInstalledPlugins() {
  return window.fcitx.getInstalledPlugins().sort()
}

const allPlugins = ['anthy', 'chewing', 'chinese-addons', 'hallelujah', 'hangul', 'lua', 'm17n', 'mozc', 'rime', 'sayura', 'thai', 'unikey']
const installedPlugins = ref<string[]>(getInstalledPlugins())
const availablePlugins = computed(() => allPlugins.filter(plugin => !installedPlugins.value.includes(plugin)))

const fileList = ref<UploadFileInfo[]>([])

async function onUpload(files: UploadFileInfo[]) {
  // Must clear the fileList synchronously first as uploading multiple files will trigger multiple times.
  fileList.value = []
  for (const file of files) {
    let name: string
    const buffer = await file.file!.arrayBuffer()
    try {
      name = window.fcitx.installPlugin(buffer)
    }
    catch (e: any) {
      message.error(e.message)
      continue
    }
    window.fcitx.updateInputMethods()
    installedPlugins.value = getInstalledPlugins()
    message.success(t('Installed {plugin}', { plugin: name }))
  }
}
</script>

<template>
  <NFlex size="large">
    <NUpload v-model:file-list="fileList" :disabled="disabled" multiple accept=".zip" @update:file-list="onUpload">
      <NUploadDragger style="height: 200px">
        <p>{{ t('Download plugin zip by clicking links below') }}</p>
        <p>{{ t('then click (or drag them to) this area') }}</p>
      </NUploadDragger>
    </NUpload>
    <NFlex>
      <NList style="min-width: 100px">
        <template #header>
          {{ t('Installed') }}
        </template>
        <NListItem v-for="plugin in installedPlugins" :key="plugin">
          {{ plugin }}
        </NListItem>
      </NList>
      <NList style="min-width: 100px">
        <template #header>
          {{ t('Available') }}
        </template>
        <NListItem v-for="plugin in availablePlugins" :key="plugin">
          <NA :href="`https://github.com/fcitx-contrib/fcitx5-plugins/releases/download/js/${plugin}.zip`">
            {{ plugin }}
          </NA>
        </NListItem>
      </NList>
    </NFlex>
  </NFlex>
</template>
