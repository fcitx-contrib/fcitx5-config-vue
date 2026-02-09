import type { Config } from 'fcitx5-js'
import { useBreakpoint } from 'vooks'
import { computed } from 'vue'
import BooleanOption from './option/BooleanOption.vue'
import ColorOption from './option/ColorOption.vue'
import EntryOption from './option/EntryOption.vue'
import EnumOption from './option/EnumOption.vue'
import ExternalOption from './option/ExternalOption.vue'
import GroupOption from './option/GroupOption.vue'
import IntegerOption from './option/IntegerOption.vue'
import KeyOption from './option/KeyOption.vue'
import ListOption from './option/ListOption.vue'
import StringOption from './option/StringOption.vue'
import UnknownOption from './option/UnknownOption.vue'

const breakpoint = useBreakpoint()
export const isMobile = computed(() => breakpoint.value === 'xs' || breakpoint.value === 's')
export const labelPlacement = computed(() => isMobile.value ? 'top' : 'left')

export function extractValue(config: Config, reset: boolean) {
  if ('Children' in config && Array.isArray(config.Children)) {
    const value: { [key: string]: any } = {}
    for (const child of config.Children) {
      value[child.Option] = extractValue(child as Config, reset)
    }
    return value
  }
  if (reset && 'DefaultValue' in config) {
    return config.DefaultValue
  }
  if (!reset && 'Value' in config) {
    return config.Value
  }
  return ''
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
    case 'Color':
      return ColorOption
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

export function download(buffer: ArrayBuffer, name: string) {
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
