<script setup lang="ts">
import SplitConfig from './SplitConfig.vue'

defineProps<{
  onClose: () => void
}>()
</script>

<template>
  <SplitConfig
    uri="fcitx://config/global"
    @close="onClose"
  />
</template>
