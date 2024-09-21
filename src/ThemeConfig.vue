<script setup lang="ts">
import SplitConfig from './SplitConfig.vue'

defineProps<{
  onClose: () => void
}>()
</script>

<template>
  <SplitConfig
    uri="fcitx://config/addon/webpanel"
    @close="onClose"
  />
</template>
