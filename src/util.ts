import { computed } from 'vue'
import { useBreakpoint } from 'vooks'
import type { Config } from 'fcitx5-js'
import IntegerOption from './option/IntegerOption.vue'
import BooleanOption from './option/BooleanOption.vue'
import EnumOption from './option/EnumOption.vue'
import KeyOption from './option/KeyOption.vue'
import StringOption from './option/StringOption.vue'
import ExternalOption from './option/ExternalOption.vue'
import ListOption from './option/ListOption.vue'
import EntryOption from './option/EntryOption.vue'
import GroupOption from './option/GroupOption.vue'
import UnknownOption from './option/UnknownOption.vue'

const breakpoint = useBreakpoint()
export const isMobile = computed(() => breakpoint.value === 'xs' || breakpoint.value === 's')

export function extractValue(config: Config, reset: boolean) {
  const value: { [key: string]: any } = {}
  if ('Children' in config) {
    for (const child of config.Children) {
      value[child.Option] = reset
        ? (
            'DefaultValue' in child ? child.DefaultValue : extractValue(child, true)
          )
        : child.Value
    }
  }
  return value
}

export function toComponent(child: { Type: string, Children?: any[] | null } & { [key: string]: string }) {
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
      if (child.IsEnum === 'True') {
        return EnumOption
      }
      return StringOption
    case 'External':
      return ExternalOption
    default: {
      if (child.Type.startsWith('List|')) {
        return ListOption
      }
      if (child.Type.startsWith('Entries')) {
        return EntryOption
      }
      if (child.Children) {
        return GroupOption
      }
      return UnknownOption
    }
  }
}
