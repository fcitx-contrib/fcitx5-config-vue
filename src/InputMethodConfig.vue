<script lang="ts">
import { computed, h, ref, watchEffect } from 'vue'
import type { MenuOption } from 'naive-ui'
import { NButton, NCheckbox, NCheckboxGroup, NFlex, NLayout, NLayoutFooter, NLayoutSider, NMenu } from 'naive-ui'
import MinusButton from './MinusButton.vue'
import PlusButton from './PlusButton.vue'

const languageName = new Intl.DisplayNames(navigator.language, { type: 'language' })
</script>

<script setup lang="ts">
const props = defineProps<{
  inputMethod: string
  inputMethods: {
    displayName: string
    name: string
  }[]
}>()

const selectedInputMethod = ref(props.inputMethod)

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

const availableInputMethodOptions = ref<{
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
  availableInputMethodOptions.value = []
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
    availableInputMethodOptions.value.push({
      label: languageCode ? (languageName.of(languageCode) ?? languageCode) : languageCode,
      key: languageCode,
    })
  }
})

const inputMethodsForLanguage = computed(() => {
  if (!selectedLanguage.value) {
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
      <div v-if="adding">
        <NMenu
          v-model:value="selectedLanguage"
          :options="availableInputMethodOptions"
        />
      </div>
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
        <NLayout position="absolute" style="bottom: 50px; padding: 16px 0 16px 16px">
          <NCheckboxGroup v-model:value="imsToAdd">
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
            justify="end"
            style="padding: 8px"
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
      <div v-else>
        {{ selectedInputMethod }}
      </div>
    </NLayout>
  </NLayout>
</template>
