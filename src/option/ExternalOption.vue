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
import QuickPhrase from '../QuickPhrase.vue'
import { isMobile } from '../util'

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
      dialog.info({
        title: props.config.Description,
        content: () => h(DictManager),
      })
      break
    }
    case 'QuickPhrase': {
      const instance = dialog.info({
        title: props.config.Description,
        content: () => h(QuickPhrase, {
          onClose: () => instance.destroy(),
        }),
        style: isMobile.value ? { 'width': '100vw', 'max-width': 'min(100vw, 600px)' } : { width: '600px' },
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
