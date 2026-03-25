<script setup lang="ts">
import { NScrollbar, useDialog } from 'naive-ui'
import { computed, h } from 'vue'
import BasicConfig from '../BasicConfig.vue'
import CustomPhrase from '../CustomPhrase.vue'
import DictManager from '../DictManager.vue'
import FooterButtons from '../FooterButtons.vue'
import GearButton from '../GearButton.vue'
import { t } from '../i18n'
import { ConfigManager } from '../manager'

const props = defineProps<{
  config: {
    Description: string
    External: string
    Option: string
    LaunchSubConfig?: string
  }
}>()

const dialog = useDialog()
const manager = computed(() => new ConfigManager(props.config.External))

function click() {
  switch (props.config.Option) {
    case 'CustomPhrase': {
      const instance = dialog.info({
        title: props.config.Description,
        content: () => h(CustomPhrase, {
          onClose: () => instance.destroy(),
        }),
        style: {
          width: 'auto',
        },
      })
      break
    }
    case 'DictManager': {
      const instance = dialog.info({
        title: props.config.Description,
        content: () => h(DictManager),
        negativeText: t('Close'),
        onNegativeClick() {
          instance.destroy()
        },
      })
      break
    }
    default:
      if (props.config.LaunchSubConfig === 'True') {
        const instance = dialog.info({
          title: props.config.Description,
          content: () => h(NScrollbar, {
            style: {
              'max-height': 'calc(100vh - 200px)',
            },
          }, () => h(BasicConfig, {
            path: props.config.Option,
            config: manager.value.config,
            value: manager.value.form.value,
            onUpdate(v) {
              manager.value.set(v)
            },
          })),
          action: () => h(FooterButtons, {
            manager: manager.value,
            onClose() {
              instance.destroy()
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
          title: t('Error'),
          content: t('Unimplemented External Option: {option}', { option: props.config.Option }),
          positiveText: t('OK'),
        })
      }
  }
}
</script>

<template>
  <GearButton @click="click" />
</template>
