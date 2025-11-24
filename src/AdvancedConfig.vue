<script setup lang="ts">
import { NLayout, NLayoutFooter, NLayoutSider, NMenu, NScrollbar } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'
import BasicConfig from './BasicConfig.vue'
import FooterButtons from './FooterButtons.vue'
import { ConfigManager } from './manager'
import { isMobile } from './util'

const emit = defineEmits<{
  close: []
  updateTitle: [string]
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

const addonNameMap = options.flatMap(option => option.children).reduce<Record<string, string>>((acc, value) => ({ ...acc, [value.key]: value.label }), {})

const addon = ref(options[0].children[0].key)

const manager = computed(() => new ConfigManager(`fcitx://config/addon/${addon.value}`))

const collapsed = ref(false)

const mobileState = ref<'DETAIL' | 'LIST'>('LIST')

watchEffect(() => {
  let title = ''
  if (isMobile.value && mobileState.value === 'DETAIL') {
    title = addonNameMap[addon.value]
  }
  emit('updateTitle', title)
})

function selectAddon(item: string) {
  addon.value = item
  mobileState.value = 'DETAIL'
}
</script>

<template>
  <div v-if="isMobile" style="display: flex; flex-direction: column; height: 100%">
    <NScrollbar>
      <NMenu
        v-if="mobileState === 'LIST'"
        :value="addon"
        :options="options"
        @update-value="selectAddon"
      />
      <BasicConfig
        v-else
        :path="addon"
        :config="manager.config"
        :value="manager.form.value"
        style="margin: 16px"
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
          @close="emit('close')"
        />
      </NLayoutFooter>
    </NLayout>
  </NLayout>
</template>
