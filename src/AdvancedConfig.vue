<script setup lang="ts">
import { NLayout, NLayoutFooter, NLayoutSider, NMenu } from 'naive-ui'
import { computed, ref } from 'vue'
import BasicConfig from './BasicConfig.vue'
import FooterButtons from './FooterButtons.vue'
import { ConfigManager } from './manager'

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

const manager = computed(() => new ConfigManager(`fcitx://config/addon/${addon.value}`))

const collapsed = ref(false)
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
          :config="manager.config"
          :value="manager.form.value"
          style="margin: 16px"
          @update="(v) => manager.set(v)"
        />
      </NLayout>
      <NLayoutFooter position="absolute">
        <FooterButtons
          :manager="manager"
          @close="onClose"
        />
      </NLayoutFooter>
    </NLayout>
  </NLayout>
</template>
