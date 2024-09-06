<script lang="ts">
import { computed, h, ref, watchEffect } from 'vue'
import type { MenuOption } from 'naive-ui'
import { NButton, NCheckbox, NCheckboxGroup, NFlex, NLayout, NLayoutFooter, NLayoutSider, NMenu } from 'naive-ui'
import MinusButton from './MinusButton.vue'
import PlusButton from './PlusButton.vue'
import BasicConfig from './BasicConfig.vue'
import FooterButtons from './FooterButtons.vue'
import { extractValue } from './util'

const languageName = new Intl.DisplayNames(navigator.language, { type: 'language' })
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
        window.fcitx.updateStatusArea()
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

watchEffect(() => {
  if (!adding.value) {
    return
  }
  map = {}
  for (const im of window.fcitx.getAllInputMethods()) {
    const code = im.languageCode.replace('_', '-');
    (map[code] = map[code] || []).push({
      name: im.name,
      displayName: im.displayName,
    })
  }
  languageOptions.value = []
  const sortedLanguageCodes = Object.keys(map).sort((a: string, b: string) => {
    if (!a) {
      return 1
    }
    if (!b) {
      return -1
    }
    const la = languageName.of(a) ?? a
    const lb = languageName.of(b) ?? b
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
      label: languageCode ? (languageName.of(languageCode) ?? languageCode) : 'Unknown',
      key: languageCode,
    })
  }
})

const inputMethodsForLanguage = computed(() => {
  if (selectedLanguage.value === null) {
    return []
  }
  const enabledIMs = props.inputMethods.map(({ name }) => name)
  return map[selectedLanguage.value].filter(({ name }) => !enabledIMs.includes(name))
})

const imsToAdd = ref<string[]>([])

function add() {
  window.fcitx.setInputMethods(props.inputMethods.map(({ name }) => name).concat(imsToAdd.value))
  window.fcitx.updateStatusArea()
  imsToAdd.value = []
}

const onlyShowCurrentLanguage = ref(false)

const filteredLanguageOptions = computed(() => {
  if (onlyShowCurrentLanguage.value) {
    const currentLanguage = navigator.language.split('-')[0]
    return languageOptions.value.filter(({ key }) => key.split('-')[0] === currentLanguage)
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
      <NLayout v-if="adding" style="height: 100%">
        <NLayout position="absolute" style="bottom: 50px">
          <NMenu
            v-model:value="selectedLanguage"
            :options="filteredLanguageOptions"
          />
        </NLayout>
        <NLayoutFooter position="absolute">
          <NCheckbox
            v-model:checked="onlyShowCurrentLanguage"
            style="height: 50px; display: flex; justify-content: center; align-items: center"
          >
            Only show current language
          </NCheckbox>
        </NLayoutFooter>
      </NLayout>
      <div
        v-else
        style="display: flex; flex-direction: column; justify-content: space-between; height: 100%"
      >
        <NMenu
          v-model:value="selectedInputMethod"
          :collapsed="collapsed"
          :collapsed-width="0"
          :options="options"
          :render-label="labelWithMinus"
        />
        <PlusButton
          style="align-self: flex-end"
          @click="adding = true"
        />
      </div>
    </NLayoutSider>
    <NLayout style="min-height: 480px; max-height: calc(100vh - 100px)">
      <template v-if="adding">
        <div
          v-if="selectedLanguage === null"
          style="display: flex; justify-content: center; align-items: center; height: calc(100% - 50px);"
        >
          Select a language from the left list
        </div>
        <NLayout v-else position="absolute" style="bottom: 50px">
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
              Cancel
            </NButton>
            <NButton
              secondary
              type="info"
              :disabled="imsToAdd.length === 0"
              @click="add"
            >
              Add
            </NButton>
          </NFlex>
        </NLayoutFooter>
      </template>
      <template v-else>
        <NLayout position="absolute" style="bottom: 50px">
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
