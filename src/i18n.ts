import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'

function replaceLeaves(object: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(object)) {
    result[key] = typeof value === 'object' ? replaceLeaves(value) : key
  }
  return result
}

const messages: Record<string, any> = {
  'en': replaceLeaves(zhCN),
  'zh-CN': zhCN,
}

export function getLocale(messages: { [key: string]: any }) {
  for (const language of navigator.languages) {
    if (language in messages) {
      return language
    }
    if (language.startsWith('en')) {
      return 'en'
    }
    if (language === 'zh-SG') {
      return 'zh-CN'
    }
  }
  return 'en'
}

const i18n = createI18n({
  locale: getLocale(messages),
  messages,
})

export function t(key: string, options: Record<string, unknown> = {}) {
  return i18n.global.t(key, options)
}
