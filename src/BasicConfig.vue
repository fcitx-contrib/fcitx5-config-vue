<script setup lang="ts">
import { computed } from 'vue'
import { NAlert, NDialogProvider, NForm, NFormItem } from 'naive-ui'
import type { Config } from 'fcitx5-js'
import TooltipButton from './TooltipButton.vue'
import IntegerOption from './option/IntegerOption.vue'
import BooleanOption from './option/BooleanOption.vue'
import EnumOption from './option/EnumOption.vue'
import KeyOption from './option/KeyOption.vue'
import StringOption from './option/StringOption.vue'
import ExternalOption from './option/ExternalOption.vue'
import ListOption from './option/ListOption.vue'
import GroupOption from './option/GroupOption.vue'
import UnknownOption from './option/UnknownOption.vue'
import { isMobile } from './util'

defineProps<{
  path: string
  config: Config
  value: any
  onUpdate: (value: any) => void
}>()

const labelPlacement = computed(() => isMobile.value ? 'top' : 'left')

function toComponent(child: { Type: string, Children: any[] | null }) {
  switch (child.Type) {
    case 'Integer':
      return IntegerOption
    case 'Boolean':
      return BooleanOption
    case 'Enum':
      return EnumOption
    case 'Key':
      return KeyOption
    case 'String':
      return StringOption
    case 'External':
      return ExternalOption
    default: {
      if (child.Type.startsWith('List|')) {
        return ListOption
      }
      if (child.Children) {
        return GroupOption
      }
      return UnknownOption
    }
  }
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
        {{ child.Description }}
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
          @update="v => onUpdate({ ...value, [child.Option]: v })"
        />
      </NDialogProvider>
    </NFormItem>
  </NForm>
</template>
