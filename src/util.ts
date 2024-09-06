import { computed } from 'vue'
import { useBreakpoint } from 'vooks'
import type { Config } from 'fcitx5-js'

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
