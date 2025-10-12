import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'

const messages = {
  'en': Object.fromEntries(Object.keys(zhCN).map(key => [key, key])),
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
}

const i18n = createI18n({
  locale: getLocale(messages),
  messages,
})

export function t(key: string, options: Record<string, unknown> = {}) {
  return i18n.global.t(key, options)
}
