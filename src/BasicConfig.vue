<script setup lang="ts">
import { computed } from 'vue'
import { NAlert, NDialogProvider, NForm, NFormItem } from 'naive-ui'
import type { Config } from 'fcitx5-js'
import TooltipButton from './TooltipButton.vue'
import { isMobile, toComponent } from './util'

defineProps<{
  path: string
  config: Config
  value: any
  onUpdate: (value: any) => void
}>()

const labelPlacement = computed(() => isMobile.value ? 'top' : 'left')
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
