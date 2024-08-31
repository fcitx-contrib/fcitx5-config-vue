<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import PlusIcon from './PlusIcon.vue'
</script>

<template>
  <NButton quaternary>
    <template #icon>
      <NIcon>
        <PlusIcon />
      </NIcon>
    </template>
  </NButton>
</template>
