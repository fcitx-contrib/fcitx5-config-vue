<script setup lang="ts">
import { computed, h, ref } from 'vue'
import type { MenuOption } from 'naive-ui'
import { NLayout, NLayoutSider, NMenu } from 'naive-ui'
import MinusButton from './MinusButton.vue'
import PlusButton from './PlusButton.vue'

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
</script>

<template>
  <NLayout has-sider>
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%">
        <NMenu
          v-model:value="selectedInputMethod"
          :collapsed="collapsed"
          :collapsed-width="0"
          :options="options"
          :render-label="labelWithMinus"
        />
        <PlusButton style="align-self: flex-end" />
      </div>
    </NLayoutSider>
    <NLayout style="min-height: 480px">
      {{ selectedInputMethod }}
    </NLayout>
  </NLayout>
</template>
