<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui'
import { NUpload, NUploadDragger, useMessage } from 'naive-ui'
import { t } from './i18n'
import { download } from './util'

const props = defineProps<{
  accept: string
  rename: (name: string) => string
  convert: (src: string, dst: string) => number
}>()

const message = useMessage()

async function onUpload(files: UploadFileInfo[]) {
  if (files.length === 0) {
    return
  }
  const file = files.at(-1)
  const arrayBuffer = await file.file?.arrayBuffer()
  const src = `/tmp/${file.name}`
  const newName = props.rename(file.name)
  const dst = `/tmp/${newName}`
  window.fcitx.Module.FS.writeFile(src, new Uint8Array(arrayBuffer!))
  const result = props.convert(src, dst)
  if (result === 0) {
    const arrayBuffer = window.fcitx.Module.FS.readFile(dst).buffer as ArrayBuffer
    download(arrayBuffer, newName)
    message.success(t('Convert succeeded'))
  }
  else {
    message.error(t('Convert failed'))
  }
}
</script>

<template>
  <NUpload :accept="accept" :file-list="[]" @update:file-list="onUpload">
    <NUploadDragger>
      {{ t('Click or drag to this area') }} <br>
      {{ t('Accept format: {format}', { format: accept }) }}
    </NUploadDragger>
  </NUpload>
</template>
