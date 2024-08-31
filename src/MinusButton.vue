<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import MinusIcon from './MinusIcon.vue'
</script>

<template>
  <NButton quaternary>
    <template #icon>
      <NIcon>
        <MinusIcon />
      </NIcon>
    </template>
  </NButton>
</template>
