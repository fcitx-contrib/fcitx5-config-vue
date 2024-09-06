<script setup lang="ts">
import { h, ref } from 'vue'
import { NScrollbar, useDialog } from 'naive-ui'
import GearButton from '../GearButton.vue'
import BasicConfig from '../BasicConfig.vue'
import FooterButtons from '../FooterButtons.vue'
import { extractValue } from '../util'

const props = defineProps<{
  config: {
    Description: string
    External: string
    Option: string
    LaunchSubConfig?: string
  }
}>()

const dialog = useDialog()
const form = ref({})

function click() {
  switch (props.config.Option) {
    default:
      if (props.config.LaunchSubConfig === 'True') {
        const config = window.fcitx.getConfig(props.config.External)
        form.value = extractValue(config, false)
        const instance = dialog.info({
          title: props.config.Description,
          content: () => h(NScrollbar, {
            style: {
              'max-height': 'calc(100vh - 200px)',
            },
          }, () => h(BasicConfig, {
            path: props.config.Option,
            config,
            value: form.value,
            onUpdate(v) {
              form.value = v
            },
          })),
          action: () => h(FooterButtons, {
            reset() {
              form.value = extractValue(config, true)
            },
            close() {
              instance.destroy()
            },
            apply() {
              window.fcitx.setConfig(props.config.External, form.value)
            },
          }),
          actionStyle: {
            display: 'block', // separate 4 buttons
          },
          style: {
            width: 'auto', // KeyOption overflows on Desktop
          },
        })
      }
      else {
        dialog.error({
          title: 'Error',
          content: `Unknown External Option: ${props.config.Option}`,
          positiveText: 'OK',
        })
      }
  }
}
</script>

<template>
  <GearButton @click="click" />
</template>
