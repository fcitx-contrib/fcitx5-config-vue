<script setup lang="ts">
import { NButtonGroup, NList, NListItem } from 'naive-ui'
import UpButton from '../UpButton.vue'
import MinusButton from '../MinusButton.vue'
import PlusButton from '../PlusButton.vue'
import { toComponent } from '../util'

const props = defineProps<{
  config: {
    Type: string
  }
  value: { [key: string]: string }
  onUpdate: (value: { [key: string]: string }) => void
}>()

function move(index: number) {
  props.onUpdate({ ...props.value, [index - 1]: props.value[index], [index]: props.value[index - 1] })
}

function remove(index: number) {
  const { length } = Object.keys(props.value)
  const value: { [key: string]: string } = {}
  for (let i = 0; i < index; ++i) {
    value[i] = props.value[i]
  }
  for (let i = index; i < length - 1; ++i) {
    value[i] = props.value[i + 1]
  }
  props.onUpdate(value)
}

function add(index: number) {
  const { length } = Object.keys(props.value)
  const value: { [key: string]: string } = {}
  for (let i = 0; i < index; ++i) {
    value[i] = props.value[i]
  }
  value[index] = ''
  for (let i = index; i < length; ++i) {
    value[i + 1] = props.value[i]
  }
  props.onUpdate(value)
}
</script>

<template>
  <NList style="width: 100%; padding: 0 12px">
    <NListItem
      v-for="[i, item] of Object.entries(value)"
      :key="i"
    >
      <component
        :is="toComponent({ Type: config.Type.slice('List|'.length) })"
        :config="config"
        :value="item"
        @update="v => onUpdate({ ...value, [i]: v })"
      />
      <template #suffix>
        <NButtonGroup>
          <UpButton
            :disabled="Number(i) === 0"
            size="small"
            @click="move(Number(i))"
          />
          <MinusButton
            size="small"
            @click="remove(Number(i))"
          />
          <PlusButton
            size="small"
            @click="add(Number(i))"
          />
        </NButtonGroup>
      </template>
    </NListItem>
    <NListItem>
      <div style="width: 100%" />
      <template #suffix>
        <PlusButton
          size="small"
          @click="add(Object.keys(value).length)"
        />
      </template>
    </NListItem>
  </NList>
</template>
