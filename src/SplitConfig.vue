<script setup lang="ts">
import { NLayout, NLayoutFooter, NLayoutSider, NMenu } from 'naive-ui'
import { computed, ref } from 'vue'
import BasicConfig from './BasicConfig.vue'
import FooterButtons from './FooterButtons.vue'
import { ConfigManager } from './manager'

const props = defineProps<{
  uri: string
  onClose: () => void
}>()

const options = { Children: [], ...window.fcitx.getConfig(props.uri) }.Children.map((child, i) => ({
  key: i,
  label: child.Description,
}))

const index = ref(0)
const manager = computed(() => new ConfigManager(props.uri, index.value))

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
        v-model:value="index"
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
          :path="{ Option: '', ...manager.config }.Option"
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
