<script setup lang="ts">
import { ref } from 'vue'
import { NLayout, NLayoutFooter, NLayoutSider, NMenu } from 'naive-ui'
import type { Config } from 'fcitx5-js'
import BasicConfig from './BasicConfig.vue'
import FooterButtons from './FooterButtons.vue'
import { extractValue } from './util'

const props = defineProps<{
  uri: string
  onClose: () => void
}>()

const index = ref(0)
const config = {
  Children: [],
  ...window.fcitx.getConfig(props.uri),
}
const options = config.Children.map((child, i) => ({
  key: i,
  label: child.Description,
}))

const collapsed = ref(false)

function childToConfig(child: typeof config.Children[0]): Config {
  return { Children: child.Children || [] }
}

const form = ref(extractValue(config, false))

function reset() {
  form.value[config.Children[index.value].Option] = extractValue(childToConfig(config.Children[index.value]), true)
}

function apply() {
  window.fcitx.setConfig(props.uri, form.value)
}
</script>

<template>
  <NLayout has-sider>
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed="collapsed"
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
          :path="config.Children[index].Option"
          :config="childToConfig(config.Children[index])"
          :value="form[config.Children[index].Option]"
          style="margin: 16px"
          @update="v => form[config.Children[index].Option] = v"
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
