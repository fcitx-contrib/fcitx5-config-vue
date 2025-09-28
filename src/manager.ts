import type { Config } from 'fcitx5-js'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { extractValue } from './util'

export class ConfigManager {
  uri: string
  index: number | undefined
  config: Config
  form: Ref<any>
  undoStack: Ref<any[]>
  redoStack: Ref<any[]>

  constructor(uri: string, index?: number) {
    this.uri = uri
    this.index = index
    const configForUri = window.fcitx.getConfig(uri)
    if (index === undefined) {
      this.config = configForUri
    }
    else {
      this.config = { Children: [], ...configForUri }.Children[index] as Config
    }
    this.form = ref(extractValue(this.config, false))
    this.undoStack = ref([])
    this.redoStack = ref([])
  }

  save(value: any) {
    this.form.value = value
    if (this.index === undefined) {
      window.fcitx.setConfig(this.uri, value)
    }
    else {
      window.fcitx.setConfig(this.uri, { [{ Option: '', ...this.config }.Option]: value })
    }
  }

  set(value: any) {
    this.undoStack.value.push(this.form.value)
    this.redoStack.value = []
    this.save(value)
  }

  undo() {
    const last = this.undoStack.value.pop()
    if (last) {
      this.redoStack.value.push(this.form.value)
      this.save(last)
    }
  }

  redo() {
    const last = this.redoStack.value.pop()
    if (last) {
      this.undoStack.value.push(this.form.value)
      this.save(last)
    }
  }

  reset() {
    this.set(extractValue(this.config, true))
  }
}
