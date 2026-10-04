import { createI18n, useI18n } from 'vue-i18n'
import { copy as siteCopy } from './copy'
import { guideCopy } from './guide-copy'
import { experienceCopy } from './experience-copy'
import { homeCopy } from './home-copy'
import { skillsCopy } from './skills-copy'
import { workspaceCopy } from './workspace-copy'
import { footerCopy } from './footer-copy'
import { docsCopy } from './docs-copy'
const copy = [...siteCopy, ...guideCopy, ...experienceCopy, ...homeCopy, ...workspaceCopy, ...skillsCopy, ...footerCopy, ...docsCopy]

export const locales = ['zh-TW', 'en', 'ja'] as const
export type Locale = typeof locales[number]
export const isLocale = (value: unknown): value is Locale => locales.some(locale => locale === value)
const keys = new Map(copy.map(([source], index) => [source, `copy${index}`]))
if (keys.size !== copy.length) throw new Error('Duplicate translation source')
// Literal message functions also preserve API syntax such as @ready and { model }.
const messages = Object.fromEntries(locales.map((locale, language) => [locale,
  Object.fromEntries(copy.map((entry, index) => [`copy${index}`, () => entry[language]])),
]))
let initial: Locale = 'zh-TW'
try { const saved = localStorage.getItem('yuragi.locale'); if (isLocale(saved)) initial = saved } catch { /* Storage may be blocked. */ }
export const i18n = createI18n({ legacy: false, locale: initial, fallbackLocale: 'zh-TW', messages })
export function translate(source: string) { const key = keys.get(source); return key ? i18n.global.t(key) : source }
export function useText() {
  const { t, locale } = useI18n({ useScope: 'global' })
  function tr(source: string) { const key = keys.get(source); return key ? t(key) : source }
  return { tr, locale }
}
