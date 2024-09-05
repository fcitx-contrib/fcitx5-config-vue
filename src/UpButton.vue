<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import UpIcon from './UpIcon.vue'
</script>

<template>
  <NButton quaternary>
    <template #icon>
      <NIcon>
        <UpIcon />
      </NIcon>
    </template>
  </NButton>
</template>
