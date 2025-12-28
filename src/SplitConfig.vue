<script setup lang="ts">
import { NLayout, NLayoutFooter, NLayoutSider, NMenu, NScrollbar } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'
import BasicConfig from './BasicConfig.vue'
import FooterButtons from './FooterButtons.vue'
import { ConfigManager } from './manager'
import { isMobile } from './util'

const props = defineProps<{
  uri: string
}>()

const emit = defineEmits<{
  close: []
  updateTitle: [string]
}>()

const options = { Children: [], ...window.fcitx.getConfig(props.uri) }.Children.map((child, i) => ({
  key: i,
  label: child.Description,
}))

const index = ref(0)
const manager = computed(() => new ConfigManager(props.uri, index.value))

const collapsed = ref(false)

const mobileState = ref<'LIST' | 'DETAIL'>('LIST')

watchEffect(() => {
  let title = ''
  if (isMobile.value && mobileState.value === 'DETAIL') {
    title = options[index.value].label
  }
  emit('updateTitle', title)
})

function selectIndex(i: number) {
  index.value = i
  mobileState.value = 'DETAIL'
}
</script>

<template>
  <div v-if="isMobile" style="display: flex; flex-direction: column; height: 100%">
    <NScrollbar>
      <NMenu
        v-if="mobileState === 'LIST'"
        :value="index"
        :options="options"
        @update-value="selectIndex"
      />
      <BasicConfig
        v-else
        :path="{ Option: '', ...manager.config }.Option"
        :config="manager.config"
        :value="manager.form.value"
        @update="(v) => manager.set(v)"
      />
    </NScrollbar>
    <FooterButtons
      v-if="mobileState === 'DETAIL'"
      is-return
      :manager="manager"
      @close="mobileState = 'LIST'"
    />
  </div>
  <NLayout v-else has-sider>
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
          @close="emit('close')"
        />
      </NLayoutFooter>
    </NLayout>
  </NLayout>
</template>
