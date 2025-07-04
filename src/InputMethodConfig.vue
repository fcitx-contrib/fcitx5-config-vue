<script lang="ts">
import type { MenuOption } from 'naive-ui'
import { NButton, NCheckbox, NCheckboxGroup, NFlex, NLayout, NLayoutFooter, NLayoutSider, NMenu } from 'naive-ui'
import { computed, h, ref, watchEffect } from 'vue'
import BasicConfig from './BasicConfig.vue'
import FooterButtons from './FooterButtons.vue'
import { t } from './i18n'
import MinusButton from './MinusButton.vue'
import PlusButton from './PlusButton.vue'
import { extractValue } from './util'

const languageName = new Intl.DisplayNames(navigator.language, { type: 'language' })

function getNameOf(code: string) {
  try {
    return languageName.of(code) ?? code
  }
  catch { // e.g. code === '*' (m17n math-latex)
    return code
  }
}
</script>

<script setup lang="ts">
const props = defineProps<{
  inputMethod: string
  inputMethods: {
    displayName: string
    name: string
  }[]
  onClose: () => void
}>()

const enabledIMs = computed(() => props.inputMethods.map(({ name }) => name))

const selectedInputMethod = ref(props.inputMethod)
const uri = computed(() => `fcitx://config/inputmethod/${selectedInputMethod.value}`)

const config = computed(() => window.fcitx.getConfig(uri.value))

const options = computed(() =>
  props.inputMethods.map(({ displayName, name }) => ({
    label: displayName,
    key: name,
  })),
)

function labelWithMinus(option: MenuOption) {
  return h('div', {
    style: {
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
    },
  }, [
    option.label as string,
    h(MinusButton, {
      disabled: props.inputMethods.length === 1,
      onClick: (e: MouseEvent) => {
        const ims = props.inputMethods.filter(({ name }) => name !== option.key).map(({ name }) => name)
        window.fcitx.setInputMethods(ims)
        window.fcitx.updateInputMethods()
        e.stopPropagation() // Don't fallback to selecting menu item.
        if (selectedInputMethod.value === option.key) {
          selectedInputMethod.value = ims[0]
        }
      },
    }),
  ])
}

const collapsed = ref(false)
const adding = ref(false)

const selectedLanguage = ref<string | null>(null)

const languageOptions = ref<{
  label: string
  key: string
}[]>([])

let map: { [key: string]: {
  name: string
  displayName: string
}[] } = {}
let languageOfIM: { [key: string]: string } = {}

watchEffect(() => {
  if (!adding.value) {
    return
  }
  map = {}
  languageOfIM = {}
  for (const im of window.fcitx.getAllInputMethods()) {
    const code = im.languageCode.replace('_', '-');
    (map[code] = map[code] || []).push({
      name: im.name,
      displayName: im.displayName,
    })
    languageOfIM[im.name] = code
  }
  languageOptions.value = []
  const sortedLanguageCodes = Object.keys(map).sort((a: string, b: string) => {
    if (!a) {
      return 1
    }
    if (!b) {
      return -1
    }
    const la = getNameOf(a)
    const lb = getNameOf(b)
    if (a === la && b !== lb) {
      return 1
    }
    if (a !== la && b === lb) {
      return -1
    }
    return la.localeCompare(lb)
  })
  for (const languageCode of sortedLanguageCodes) {
    languageOptions.value.push({
      label: languageCode ? getNameOf(languageCode) : 'Unknown',
      key: languageCode,
    })
  }
})

const inputMethodsForLanguage = computed(() => {
  if (selectedLanguage.value === null) {
    return []
  }
  return map[selectedLanguage.value].filter(({ name }) => !enabledIMs.value.includes(name))
})

const imsToAdd = ref<string[]>([])

function add() {
  window.fcitx.setInputMethods(props.inputMethods.map(({ name }) => name).concat(imsToAdd.value))
  window.fcitx.updateInputMethods()
  imsToAdd.value = []
}

const onlyShowCurrentLanguage = ref(false)

const filteredLanguageOptions = computed(() => {
  if (onlyShowCurrentLanguage.value) {
    const currentLanguage = navigator.language.split('-')[0]
    const languages = new Set(enabledIMs.value.map(name => languageOfIM[name]).filter(code => code))
    languages.add(currentLanguage)
    return languageOptions.value.filter(({ key }) => languages.has(key.split('-')[0]))
  }
  return languageOptions.value
})

const form = ref({})

watchEffect(() => {
  form.value = extractValue(config.value, false)
})

function reset() {
  form.value = extractValue(config.value, true)
}

function apply() {
  window.fcitx.setConfig(uri.value, form.value)
}
</script>

<template>
  <NLayout has-sider>
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed="collapsed"
      show-trigger
      style="max-height: calc(100vh - 100px)"
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <NLayout style="height: 100%">
        <NLayout
          position="absolute"
          :native-scrollbar="false"
          style="bottom: 50px"
        >
          <NMenu
            v-if="adding"
            v-model:value="selectedLanguage"
            :options="filteredLanguageOptions"
          />
          <NMenu
            v-else
            v-model:value="selectedInputMethod"
            :collapsed="collapsed"
            :collapsed-width="0"
            :options="options"
            :render-label="labelWithMinus"
          />
        </NLayout>
        <NLayoutFooter position="absolute">
          <NCheckbox
            v-if="adding"
            v-model:checked="onlyShowCurrentLanguage"
            style="height: 50px; display: flex; justify-content: center; align-items: center"
          >
            {{ collapsed ? '' : t('Only show current language') }}
          </NCheckbox>
          <div
            v-else
            style="display: flex; justify-content: end"
          >
            <PlusButton
              style="align-self: flex-end"
              @click="adding = true"
            />
          </div>
        </NLayoutFooter>
      </NLayout>
    </NLayoutSider>
    <NLayout style="height: calc(100vh - 100px)">
      <template v-if="adding">
        <div
          v-if="selectedLanguage === null"
          style="display: flex; justify-content: center; align-items: center; height: calc(100% - 50px);"
        >
          {{ t('Select a language from the left list') }}
        </div>
        <NLayout
          v-else
          position="absolute"
          :native-scrollbar="false"
          style="bottom: 50px"
        >
          <NCheckboxGroup
            v-model:value="imsToAdd"
            style="margin: 16px"
          >
            <NFlex vertical>
              <NCheckbox
                v-for="im of inputMethodsForLanguage"
                :key="im.name"
                :value="im.name"
                :label="im.displayName"
              />
            </NFlex>
          </NCheckboxGroup>
        </NLayout>
        <NLayoutFooter position="absolute">
          <NFlex
            style="padding: 8px; justify-content: space-between"
          >
            <NButton secondary @click="adding = false">
              {{ t('Cancel') }}
            </NButton>
            <NButton
              secondary
              type="info"
              :disabled="imsToAdd.length === 0"
              @click="add"
            >
              {{ t('Add') }}
            </NButton>
          </NFlex>
        </NLayoutFooter>
      </template>
      <template v-else>
        <NLayout
          position="absolute"
          :native-scrollbar="false"
          style="bottom: 50px"
        >
          <BasicConfig
            :path="selectedInputMethod"
            :config="config"
            :value="form"
            style="margin: 16px"
            @update="v => form = v"
          />
        </NLayout>
        <NLayoutFooter position="absolute">
          <FooterButtons
            :reset="reset"
            :apply="apply"
            :close="onClose"
          />
        </NLayoutFooter>
      </template>
    </NLayout>
  </NLayout>
</template>
