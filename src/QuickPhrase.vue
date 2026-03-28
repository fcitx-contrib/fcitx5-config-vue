<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NButton, NDataTable, NFlex, NInput, NSelect } from 'naive-ui'
import { useBreakpoint } from 'vooks'
import { computed, h, ref, watchEffect } from 'vue'
import { QUICKPHRASE_DIR, QUICKPHRASE_SYSTEM_DIR } from './constant'
import { t } from './i18n'
import ShowOrEdit from './ShowOrEdit.vue'

const emit = defineEmits<{
  close: []
}>()

const breakpoint = useBreakpoint()

interface QuickPhrase {
  id: string
  keyword: string
  phrase: string
}

function getMBFiles(dir: string): string[] {
  try {
    return window.fcitx.lsDir(dir).filter(f => f.endsWith('.mb')).map(f => f.slice(0, -3))
  }
  catch {
    return []
  }
}

function getUserFiles() {
  return getMBFiles(QUICKPHRASE_DIR)
}

function writeFile(path: string, content: string) {
  window.fcitx.Module.FS.mkdirTree(path.substring(0, path.lastIndexOf('/')))
  window.fcitx.Module.FS.writeFile(path, content)
}

function quickPhrasesToString(phrases: QuickPhrase[]): string {
  return phrases.filter(p => p.keyword && p.phrase).map(p => `${p.keyword} ${p.phrase}\n`).join('')
}

const lineRegex = /(\S+)\s+(\S.*)/

function parseContent(s: string): QuickPhrase[] {
  const result: QuickPhrase[] = []
  for (const line of s.split('\n')) {
    const match = lineRegex.exec(line)
    if (match) {
      result.push({ id: crypto.randomUUID(), keyword: match[1], phrase: match[2] })
    }
  }
  return result
}

const userFiles = ref(getUserFiles())
const systemFiles = getMBFiles(QUICKPHRASE_SYSTEM_DIR)
const options = computed(() => [...userFiles.value, ...systemFiles.filter(f => !userFiles.value.includes(f))].map(f => ({
  label: f,
  value: f,
})))
const selection = ref(options.value[0]?.value ?? '')

const content = ref<QuickPhrase[]>([])
const showNewFile = ref(false)
const newFileName = ref('')

function readQuickPhrases(name: string) {
  const userPath = `${QUICKPHRASE_DIR}${name}.mb`
  const systemPath = `${QUICKPHRASE_SYSTEM_DIR}${name}.mb`
  const path = userFiles.value.includes(name) ? userPath : systemPath
  const raw = window.fcitx.Module.FS.readFile(path, { encoding: 'utf8' })
  content.value = parseContent(raw)
}

watchEffect(() => readQuickPhrases(selection.value))

const pageSlot = computed(() => breakpoint.value === 'xs' ? 6 : 9)

const checkedRowKeys = ref<string[]>([])
const editingIndex = ref<string | null>(null)
const page = ref(1)

function addItem() {
  const id = crypto.randomUUID()
  content.value.push({ id, keyword: '', phrase: '' })
  editingIndex.value = id
  page.value = Math.ceil(content.value.length / pageSlot.value)
}

function reloadQuickPhrase() {
  window.fcitx.setConfig('fcitx://config/addon/quickphrase/editor', {})
}

function save() {
  const userPath = `${QUICKPHRASE_DIR}${selection.value}.mb`
  writeFile(userPath, quickPhrasesToString(content.value))
  reloadQuickPhrase()
  emit('close')
}

function removeItems() {
  const keysToRemove = new Set(checkedRowKeys.value)
  content.value = content.value.filter(item => !keysToRemove.has(item.id))
  checkedRowKeys.value = []
}

function remove() {
  const userPath = `${QUICKPHRASE_DIR}${selection.value}.mb`
  if (userFiles.value.includes(selection.value)) {
    window.fcitx.Module.FS.unlink(userPath)
    userFiles.value = getUserFiles()
    selection.value = options.value[0].value
  }
  else {
    // Write an empty file to user directory to override system's.
    writeFile(userPath, '')
    userFiles.value = getUserFiles()
    readQuickPhrases(selection.value)
  }
  reloadQuickPhrase()
}

function createFile() {
  writeFile(`${QUICKPHRASE_DIR}${newFileName.value}.mb`, '')
  userFiles.value = getUserFiles()
  selection.value = newFileName.value
  showNewFile.value = false
  newFileName.value = ''
}

function cancelNewFile() {
  showNewFile.value = false
  newFileName.value = ''
}

const columns: DataTableColumns<QuickPhrase> = [
  { type: 'selection' },
  {
    title: t('Keyword'),
    key: 'keyword',
    width: '60%',
    render(row: QuickPhrase) {
      return h(ShowOrEdit, {
        value: row.keyword,
        editing: editingIndex.value === row.id,
        autoFocus: true,
        onUpdateValue(v: string) {
          content.value.find(item => item.id === row.id)!.keyword = v
        },
      })
    },
  },
  {
    title: t('Phrase'),
    key: 'phrase',
    render(row: QuickPhrase) {
      return h(ShowOrEdit, {
        value: row.phrase,
        editing: false,
        autoFocus: false,
        onUpdateValue(v: string) {
          content.value.find(item => item.id === row.id)!.phrase = v
        },
      })
    },
  },
]
</script>

<template>
  <NFlex vertical>
    <NSelect v-model:value="selection" :options="options" />
    <NDataTable
      v-model:checked-row-keys="checkedRowKeys"
      v-model:page="page"
      :row-key="(item: QuickPhrase) => item.id"
      :columns="columns"
      :data="content"
      :pagination="{ pageSlot, page }"
    />
    <NFlex justify="flex-end">
      <template v-if="showNewFile">
        <NInput v-model:value="newFileName" style="width: 160px" />
        <NButton secondary @click="cancelNewFile">
          {{ t('Cancel') }}
        </NButton>
        <NButton secondary type="info" @click="createFile">
          {{ t('OK') }}
        </NButton>
      </template>
      <template v-else>
        <NButton secondary @click="showNewFile = true">
          {{ t('New file') }}
        </NButton>
        <NButton secondary @click="addItem">
          {{ t('Add item') }}
        </NButton>
        <NButton secondary :disabled="checkedRowKeys.length === 0" @click="removeItems">
          {{ t('Remove items') }}
        </NButton>
        <NButton secondary type="error" @click="remove">
          {{ t('Remove') }}
        </NButton>
        <NButton secondary type="info" @click="save">
          {{ t('Save') }}
        </NButton>
      </template>
    </NFlex>
  </NFlex>
</template>
