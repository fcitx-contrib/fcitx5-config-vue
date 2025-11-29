<script setup lang="ts">
import type { MenuOption, UploadFileInfo } from 'naive-ui'
import { NA, NFlex, NMenu, NScrollbar, NText, NUpload, NUploadDragger, useMessage } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { t } from './i18n'
import MustInstall from './MustInstall.vue'
import { isMobile } from './util'

defineProps<{
  disabled: boolean
}>()

const message = useMessage()

function getInstalledPlugins() {
  return window.fcitx.getInstalledPlugins().sort()
}

const plugins: [string, string][] = [
  ['anthy', 'Japanese'],
  ['chewing', 'Chinese'],
  ['chinese-addons', 'Chinese'],
  ['hallelujah', 'English'],
  ['hangul', 'Korean'],
  ['jyutping', 'Chinese'],
  ['lua', 'Other'],
  ['m17n', 'Generic'],
  ['mozc', 'Japanese'],
  ['rime', 'Generic'],
  ['sayura', 'Sinhala'],
  ['skk', 'Japanese'],
  ['thai', 'Thai'],
  ['unikey', 'Vietnamese'],
]

function tLanguage(language: string) {
  return t(`language.${language}`)
}

function toOptions(plugins: [string, string][]) {
  const pluginMap: Record<string, string[]> = {}
  for (const [plugin, language] of plugins) {
    (pluginMap[language] = pluginMap[language] || []).push(plugin)
  }
  return Object.entries(pluginMap).sort(([la], [lb]) => {
    for (const key of ['Other', 'Generic']) {
      if (la === key) {
        return 1
      }
      if (lb === key) {
        return -1
      }
    }
    return tLanguage(la).localeCompare(tLanguage(lb))
  }).map(([language, plugins]) => ({
    type: 'group',
    key: language,
    label: tLanguage(language),
    children: plugins.map(plugin => ({ key: plugin, label: plugin })),
  }))
}

const installedPlugins = ref<string[]>(getInstalledPlugins())
const installedOptions = computed(() => toOptions(plugins.filter(([plugin, _]) => installedPlugins.value.includes(plugin))))
const availableOptions = computed(() => toOptions(plugins.filter(([plugin, _]) => !installedPlugins.value.includes(plugin))))

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

function installedItem(option: MenuOption) {
  if (option.key === 'jyutping' && !installedPlugins.value.includes('chinese-addons')) {
    return h(MustInstall, { plugin: 'chinese-addons' }, { default: () => h(NText, {
      delete: true,
    }, { default: () => option.label }) })
  }
  return option.label as string
}

function availableItem(option: MenuOption) {
  return h(MustInstall, { plugin: option.key === 'jyutping' ? 'chinese-addons' : undefined }, { default: () => h(NA, {
    href: `https://github.com/fcitx-contrib/fcitx5-plugins/releases/download/js/${option.key}.zip`,
  }, { default: () => option.label }) })
}
</script>

<template>
  <NFlex size="large" :vertical="isMobile" :style="{ height: isMobile ? '100%' : 'calc(100vh - 100px)' }">
    <NUpload v-model:file-list="fileList" :style="isMobile ? {} : { width: 'auto', flex: '1' }" :disabled="disabled" multiple accept=".zip" @update:file-list="onUpload">
      <NUploadDragger :style="isMobile ? {} : { height: '300px' }">
        <p>{{ t('Download plugin zip by clicking buttons under "Available"') }}</p>
        <p>{{ isMobile ? t('then click this area to load zip') : t('then click (or drag them to) this area to load zip') }}</p>
      </NUploadDragger>
    </NUpload>
    <NFlex :style="isMobile ? { 'min-height': '0' } : { height: '100%', flex: '1' }">
      <NFlex vertical style="flex: 1; height: 100%">
        {{ t('Installed') }}
        <NScrollbar>
          <NMenu :root-indent="0" :indent="24" :options="installedOptions" :render-label="installedItem" />
        </NScrollbar>
      </NFlex>
      <NFlex vertical style="flex: 1; height: 100%">
        {{ t('Available') }}
        <NScrollbar>
          <NMenu :root-indent="0" :indent="24" :options="availableOptions" :render-label="availableItem" />
        </NScrollbar>
      </NFlex>
    </NFlex>
  </NFlex>
</template>
