<script setup lang="ts">
import type { Config } from 'fcitx5-js'
import { NAlert, NDialogProvider, NDropdown, NForm, NFormItem } from 'naive-ui'
import { ref } from 'vue'
import { t } from './i18n'
import TooltipButton from './TooltipButton.vue'
import { extractValue, labelPlacement, toComponent } from './util'

const props = defineProps<{
  path: string
  config: Config
  value: any
  onUpdate: (value: any) => void
}>()

const showContextMenu = ref(false)
const x = ref(0)
const y = ref(0)
const options = [{ label: t('Reset to default'), key: 'reset' }]

let selectedChild: Config | null = null
let selectedOption = ''

let touchTimer: number | null = null

function onContextMenu(e: MouseEvent, child: Config, option: string) {
  if ('Type' in child && child.Type === 'External') {
    return
  }
  e.preventDefault()
  x.value = e.clientX
  y.value = e.clientY
  showContextMenu.value = true
  selectedChild = child
  selectedOption = option
}

function onTouchStart(e: TouchEvent, child: Config, option: string) {
  if ('Type' in child && child.Type === 'External') {
    return
  }
  e.preventDefault() // Prevent select label.
  x.value = e.touches[0].clientX
  y.value = e.touches[0].clientY
  selectedChild = child
  selectedOption = option

  touchTimer = window.setTimeout(() => {
    showContextMenu.value = true
  }, 300)
}

function onTouchEnd() {
  if (touchTimer) {
    clearTimeout(touchTimer)
    touchTimer = null
  }
}

function reset() {
  props.onUpdate({ ...props.value, [selectedOption]: extractValue(selectedChild!, true) })
}
</script>

<template>
  <NAlert v-if="'ERROR' in config" title="Error" type="error">
    {{ config.ERROR }}
  </NAlert>
  <NForm
    v-else
    :label-placement="labelPlacement"
    label-width="200px"
  >
    <NFormItem
      v-for="child in config.Children"
      :key="`${path}/${child.Option}`"
    >
      <template #label>
        <div
          @contextmenu="e => onContextMenu(e, child as Config, child.Option)"
          @touchstart="e => onTouchStart(e, child as Config, child.Option)"
          @touchend="onTouchEnd"
          @touchcancel="onTouchEnd"
        >
          {{ child.Description }}
        </div>
        <TooltipButton
          v-if="child.Tooltip"
          :text="child.Tooltip"
        />
      </template>
      <NDialogProvider>
        <component
          :is="toComponent(child)"
          :config="child"
          :value="value[child.Option]"
          @update="(v: any) => onUpdate({ ...value, [child.Option]: v })"
        />
      </NDialogProvider>
    </NFormItem>
    <NDropdown
      v-model:show="showContextMenu"
      trigger="manual"
      :x="x"
      :y="y"
      :options="options"
      @clickoutside="showContextMenu = false"
      @select="reset"
    />
  </NForm>
</template>
