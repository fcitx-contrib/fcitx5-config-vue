import { createI18n } from 'vue-i18n'
import ca from './locales/ca.json'
import da from './locales/da.json'
import de from './locales/de.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import he from './locales/he.json'
import ja from './locales/ja.json'
import ka from './locales/ka.json'
import ko from './locales/ko.json'
import ru from './locales/ru.json'
import vi from './locales/vi.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'

function replaceLeaves(object: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(object)) {
    result[key] = typeof value === 'object' ? replaceLeaves(value) : key
  }
  return result
}

const messages: Record<string, any> = {
  'ca': ca,
  'da': da,
  'de': de,
  'en': replaceLeaves(zhCN),
  'es': es,
  'fr': fr,
  'he': he,
  'ja': ja,
  'ka': ka,
  'ko': ko,
  'ru': ru,
  'vi': vi,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
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
