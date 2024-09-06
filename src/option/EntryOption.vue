<script setup lang="ts">
import { NFlex } from 'naive-ui'
import { toComponent } from '../util'

defineProps<{
  config: {
    Children: {
      Description: string
      Option: string
      Type: string
    }[]
  }
  value: any
  onUpdate: (value: any) => void
}>()
</script>

<template>
  <NFlex>
    <component
      :is="toComponent(child)"
      v-for="child of config.Children"
      :key="child.Option"
      :placeholder="child.Description"
      :config="child"
      :value="value[child.Option]"
      style="max-width: 200px"
      @update="v => { console.log(v); onUpdate({ ...value, [child.Option]: v }) }"
    />
  </NFlex>
</template>
