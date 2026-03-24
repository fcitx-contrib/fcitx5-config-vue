<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui'
import { NButton, NFlex, NForm, NFormItem, NUpload, NUploadDragger, useDialog, useMessage } from 'naive-ui'
import { h, ref } from 'vue'
import { t } from './i18n'
import TooltipButton from './TooltipButton.vue'
import { download, isMobile, labelPlacement } from './util'

type UZIPFiles = Record<string, Uint8Array>

const dialog = useDialog()
const message = useMessage()

const fcitx5Prefixes = [{
  srcPrefix: 'external/config/',
  dstPrefix: '/home/web_user/.config/fcitx5/',
}, {
  srcPrefix: 'external/data/',
  dstPrefix: '/home/web_user/.local/share/fcitx5/',
}]
const hamsterRimeDir = 'HamsterBackup/RIME/Rime/'
const meta = 'metadata.json'
const ISO_MILLIS_SUFFIX = /\.\d{3}Z$/
const ISO_COLON = /:/g

function distribute(manifest: UZIPFiles, prefixes: { srcPrefix: string, dstPrefix: string }[]) {
  Object.entries(manifest).forEach(([path, data]) => {
    for (const { srcPrefix, dstPrefix } of prefixes) {
      if (path.startsWith(srcPrefix)) {
        const dst = `${dstPrefix}${path.slice(srcPrefix.length)}`
        if (path.endsWith('/')) {
          window.fcitx.Module.FS.mkdirTree(dst)
        }
        else {
          window.fcitx.Module.FS.writeFile(dst, new Uint8Array(data))
        }
        break
      }
    }
  })
}

const backups = {
  fcitx5: {
    name: 'fcitx5-*_YYYY-MM-DD*.zip',
    validate: (manifest: UZIPFiles) => {
      return meta in manifest
    },
    extract: (manifest: UZIPFiles) => distribute(manifest, fcitx5Prefixes),
  },
  hamster: {
    name: 'YYYYMMDD-*.zip',
    validate: (manifest: UZIPFiles) => {
      return hamsterRimeDir in manifest
    },
    extract: (manifest: UZIPFiles) => distribute(manifest, [{
      srcPrefix: hamsterRimeDir,
      dstPrefix: '/home/web_user/.local/share/fcitx5/rime/',
    }]),
  },
}

const fileList = ref<UploadFileInfo[]>([])

function onUpload(files: UploadFileInfo[]) {
  fileList.value = files.slice(-1)
}

function importData(source: 'fcitx5' | 'hamster') {
  const backup = backups[source]
  const instance = dialog.info({
    title: t('Upload {file}', { file: backup.name }),
    content: () => h(NUpload, {
      'accept': '.zip',
      'fileList': fileList.value,
      'onUpdate:fileList': onUpload,
    }, () => h(NUploadDragger, isMobile.value ? {} : { style: { height: '200px' } }, () => t(isMobile.value ? 'Click this area' : 'Click or drag to this area'))),
    action: () => h(NButton, { type: 'info', secondary: true, disabled: fileList.value.length === 0, onClick: async () => {
      const file = fileList.value[0]
      fileList.value = []
      const arrayBuffer = await file.file?.arrayBuffer()
      const manifest = window.fcitx.UZIP.parse(arrayBuffer!)
      if (!backup.validate(manifest)) {
        message.error(t('Invalid zip'))
        return
      }
      backup.extract(manifest)
      window.fcitx.reload()
      instance.destroy()
      message.success(t('Import succeeded'))
    } }, () => t('OK')),
  })
}

const exporting = ref(false)

async function exportData() {
  exporting.value = true
  const manifest: Record<string, Uint8Array> = {}
  // Fake f5a structure. Parent directory must be listed before all children so that
  // java.util.zip.ZipInputStream doesn't throw ENOENT.
  for (const name of ['external', 'databases', 'recently_used', 'shared_prefs']) {
    manifest[`${name}/`] = new Uint8Array()
  }
  for (const { srcPrefix, dstPrefix } of fcitx5Prefixes) {
    const transformPath = (path: string) => `${srcPrefix}${path.slice(dstPrefix.length)}`
    try {
      window.fcitx.traverseSync(
        path => manifest[transformPath(path)] = new Uint8Array(),
        path => manifest[transformPath(path)] = window.fcitx.Module.FS.readFile(path),
        undefined,
      )(dstPrefix)
    }
    catch {}
  }
  if (Object.keys(manifest).length === 0) {
    message.error(t('Export failed'))
    return
  }
  const date = new Date()
  const metaJson = {
    packageName: 'org.fcitx.fcitx5.android',
    versionCode: 0,
    versionName: '',
    exportTime: date.getTime(),
  }
  manifest[meta] = new TextEncoder().encode(JSON.stringify(metaJson))
  const name = `fcitx5-online_${date
    .toISOString()
    .replace(ISO_MILLIS_SUFFIX, 'Z')
    .replace(ISO_COLON, '_')}.zip`
  download(await window.fcitx.zip(manifest), name)
  exporting.value = false
}
</script>

<template>
  <NForm :label-placement="labelPlacement" label-width="200px">
    <NFormItem>
      <template #label>
        {{ t('Import data from ...') }}
      </template>
      <NFlex vertical>
        <NFlex align="center">
          <NButton style="flex: 1" @click="importData('fcitx5')">
            Fcitx5 Android/macOS
          </NButton>
          <TooltipButton :text="backups.fcitx5.name" />
        </NFlex>
        <NFlex align="center">
          <NButton style="flex: 1" @click="importData('hamster')">
            Hamster
          </NButton>
          <TooltipButton :text="backups.hamster.name" />
        </NFlex>
      </NFlex>
    </NFormItem>
    <NFormItem>
      <template #label>
        {{ t('Export data to ...') }}
      </template>
      <NButton :disabled="exporting" @click="exportData">
        Fcitx5 Android/macOS
      </NButton>
    </NFormItem>
  </NForm>
</template>
