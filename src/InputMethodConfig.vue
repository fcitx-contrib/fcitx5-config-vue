<script lang="ts">
import type { MenuOption } from 'naive-ui'
import { NButton, NCheckbox, NCheckboxGroup, NFlex, NLayout, NLayoutFooter, NLayoutSider, NMenu, NText } from 'naive-ui'
import { computed, h, ref, watchEffect } from 'vue'
import BasicConfig from './BasicConfig.vue'
import FooterButtons from './FooterButtons.vue'
import { t } from './i18n'
import { ConfigManager } from './manager'
import MinusButton from './MinusButton.vue'
import PlusButton from './PlusButton.vue'

const languageName = new Intl.DisplayNames(navigator.language, { type: 'language' })

function getNameOf(code: string) {
  try {
    const name = languageName.of(code)
    if (name && name !== code) {
      return name
    }
  }
  catch {}
  const name = window.fcitx.getLanguageName(code)
  if (name) {
    return name
  }
  return `${t('Unknown')} - ${code}`
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

const EN = 'en'
const popularIMs = ['keyboard-us', 'pinyin', 'shuangpin', 'wbx', 'rime', 'mozc', 'hallelujah']

const enabledIMs = computed(() => props.inputMethods.map(({ name }) => name))

const selectedInputMethod = ref(props.inputMethod)
const manager = computed(() => new ConfigManager(`fcitx://config/inputmethod/${selectedInputMethod.value}`))

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
    h('div', {
      style: {
        'overflow': 'hidden',
        'text-overflow': 'ellipsis',
      },
    }, [option.label as string]),
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

const currentLanguages = navigator.languages.map(lang => lang.split('-')[0])
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
    const code = im.languageCode.replace('_', '-') || 'und';
    (map[code] = map[code] || []).push({
      name: im.name,
      displayName: im.displayName,
    })
    languageOfIM[im.name] = code
  }
  languageOptions.value = []
  const sortedLanguageCodes = Object.keys(map).sort((a: string, b: string) => {
    // Pin English.
    if (a === EN) {
      return -1
    }
    if (b === EN) {
      return 1
    }
    // Pin browser languages.
    const aIsCurrent = currentLanguages.includes(a.split('-')[0])
    const bIsCurrent = currentLanguages.includes(b.split('-')[0])
    if (aIsCurrent && !bIsCurrent) {
      return -1
    }
    if (!aIsCurrent && bIsCurrent) {
      return 1
    }
    const la = getNameOf(a)
    const lb = getNameOf(b)
    return la.localeCompare(lb)
  })
  for (const languageCode of sortedLanguageCodes) {
    languageOptions.value.push({
      label: getNameOf(languageCode),
      key: languageCode,
    })
  }
})

const inputMethodsForLanguage = computed(() => {
  if (selectedLanguage.value === null) {
    return []
  }
  return map[selectedLanguage.value].filter(({ name }) => !enabledIMs.value.includes(name)).sort((a, b) => {
    // Pin popular input methods.
    const ia = popularIMs.indexOf(a.name)
    const ib = popularIMs.indexOf(b.name)
    if (ia >= 0 && ib < 0) {
      return -1
    }
    if (ia < 0 && ib >= 0) {
      return 1
    }
    if (ia >= 0 && ib >= 0) {
      return ia - ib
    }
    return a.displayName.localeCompare(b.displayName)
  })
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
    const languages = new Set(enabledIMs.value.map(name => languageOfIM[name]).filter(code => code))
    languages.add(EN)
    for (const lang of currentLanguages) {
      languages.add(lang)
    }
    return languageOptions.value.filter(({ key }) => languages.has(key.split('-')[0]))
  }
  return languageOptions.value
})
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
              >
                <NText :strong="popularIMs.includes(im.name)">
                  {{ im.displayName }}
                </NText>
              </NCheckbox>
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
            :config="manager.config"
            :value="manager.form.value"
            style="margin: 16px"
            @update="(v) => manager.set(v)"
          />
        </NLayout>
        <NLayoutFooter position="absolute">
          <FooterButtons
            :manager="manager"
            @close="onClose"
          />
        </NLayoutFooter>
      </template>
    </NLayout>
  </NLayout>
</template>
