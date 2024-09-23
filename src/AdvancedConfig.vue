<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { NLayout, NLayoutFooter, NLayoutSider, NMenu } from 'naive-ui'
import BasicConfig from './BasicConfig.vue'
import FooterButtons from './FooterButtons.vue'
import { extractValue } from './util'

defineProps<{
  onClose: () => void
}>()

const options = window.fcitx.getAddons().map(category => ({
  type: 'group',
  key: category.id,
  label: category.name,
  children: category.addons.map(addon => ({
    key: addon.id,
    label: addon.name,
  })),
}))

const addon = ref(options[0].children[0].key)

const uri = computed(() => `fcitx://config/addon/${addon.value}`)

const config = computed(() => window.fcitx.getConfig(uri.value))

const collapsed = ref(false)

const form = ref({})

watchEffect(() => {
  form.value = extractValue(config.value, false)
})

function reset() {
  form.value = extractValue(config.value, true)
}

function apply() {
  window.fcitx.setConfig(uri.value, form.value)
}
</script>

<template>
  <NLayout has-sider>
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed="collapsed"
      :native-scrollbar="false"
      show-trigger
      style="max-height: calc(100vh - 100px)"
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <NMenu
        v-model:value="addon"
        :options="options"
      />
    </NLayoutSider>
    <NLayout style="height: calc(100vh - 100px)">
      <NLayout
        position="absolute"
        :native-scrollbar="false"
        style="bottom: 50px"
      >
        <BasicConfig
          :path="addon"
          :config="config"
          :value="form"
          style="margin: 16px"
          @update="v => form = v"
        />
      </NLayout>
      <NLayoutFooter position="absolute">
        <FooterButtons
          :reset="reset"
          :apply="apply"
          :close="onClose"
        />
      </NLayoutFooter>
    </NLayout>
  </NLayout>
</template>
