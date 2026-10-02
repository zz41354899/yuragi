<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useText, type Locale } from '../i18n'
import BrandMark from './BrandMark.vue'
import Icon from './Icon.vue'

const { tr, locale } = useText()
const route = useRoute()
const router = useRouter()
const header = ref<HTMLElement>()
const menuButton = ref<HTMLButtonElement>()
const languageButton = ref<HTMLButtonElement>()
const menuOpen = ref(false)
const languageOpen = ref(false)
const links = [
  { path: '/', label: '首頁' },
  { path: '/docs', label: '文件' },
  { path: '/playground', label: '遊樂場' },
]
const languages: { value: Locale; label: string; short: string }[] = [
  { value: 'zh-TW', label: '繁體中文', short: '繁中' },
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'ja', label: '日本語', short: '日本語' },
]
const currentLanguage = computed(() => languages.find(language => language.value === locale.value) || languages[0])
function closePanels() { menuOpen.value = false; languageOpen.value = false }
function toggleMenu() { languageOpen.value = false; menuOpen.value = !menuOpen.value }
function toggleLanguage() { menuOpen.value = false; languageOpen.value = !languageOpen.value }
async function changeLanguage(value: Locale) {
  locale.value = value
  const wasLanguageOpen = languageOpen.value
  languageOpen.value = false
  // Retain the page, editor tab, documentation section, and anchor.
  if (route.query.lang) await router.replace({ query: { ...route.query, lang: value }, hash: route.hash })
  if (wasLanguageOpen) { await nextTick(); languageButton.value?.focus() }
}
function onPointerDown(event: PointerEvent) {
  if (event.target instanceof Node && !header.value?.contains(event.target)) closePanels()
}
function onFocusOut(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && !header.value?.contains(event.relatedTarget)) closePanels()
}
function onEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || (!menuOpen.value && !languageOpen.value)) return
  event.preventDefault()
  const trigger = languageOpen.value ? languageButton.value : menuButton.value
  closePanels()
  trigger?.focus()
}
let desktop: MediaQueryList | undefined
function onBreakpointChange() {
  const focusWasInPanel = header.value?.querySelector('.navigation-panel')?.contains(document.activeElement)
  closePanels()
  if (focusWasInPanel) {
    if (desktop?.matches) header.value?.querySelector<HTMLAnchorElement>('.desktop-navigation a')?.focus()
    else menuButton.value?.focus()
  }
}
watch(() => route.path, closePanels)
onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onEscape)
  desktop = window.matchMedia('(min-width: 961px)')
  desktop.addEventListener('change', onBreakpointChange)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onEscape)
  desktop?.removeEventListener('change', onBreakpointChange)
})
</script>

<template>
  <header ref="header" class="navigation-header" @focusout="onFocusOut">
    <div class="navigation-bar">
      <RouterLink class="navigation-brand" to="/" :aria-label="tr('Yuragi 首頁')" @click="closePanels"><BrandMark /></RouterLink>
      <nav class="desktop-navigation" :aria-label="tr('主要導覽')">
        <RouterLink v-for="link in links" :key="link.path" :to="link.path" :aria-current="route.path === link.path ? 'page' : undefined" @click="closePanels">{{ tr(link.label) }}</RouterLink>
      </nav>
      <div class="navigation-actions">
        <div class="language-control">
          <button ref="languageButton" class="language-trigger" type="button" :aria-label="`${tr('切換語言')} · ${currentLanguage.label}`" :aria-expanded="languageOpen" aria-controls="language-options" @click="toggleLanguage">
            <Icon name="globe" :size="20" /><span class="language-name">{{ currentLanguage.label }}</span><span class="language-short">{{ currentLanguage.short }}</span><Icon class="language-caret" name="caret-down" :size="14" />
          </button>
          <div v-if="languageOpen" id="language-options" class="language-popover" role="group" :aria-label="tr('選擇語言')">
            <p>{{ tr('選擇語言') }}<span>LANGUAGE</span></p>
            <button v-for="language in languages" :key="language.value" type="button" :lang="language.value" :aria-pressed="locale === language.value" @click="changeLanguage(language.value)"><span>{{ language.label }}</span><Icon v-if="locale === language.value" name="check" :size="18" /></button>
          </div>
        </div>
        <button ref="menuButton" class="menu-trigger" type="button" :aria-label="tr(menuOpen ? '關閉選單' : '開啟選單')" :aria-expanded="menuOpen" aria-controls="navigation-panel" @click="toggleMenu"><Icon :name="menuOpen ? 'close' : 'menu'" :size="25" /></button>
      </div>
    </div>
    <div v-if="menuOpen" id="navigation-panel" class="navigation-panel">
      <nav :aria-label="tr('主要導覽')"><RouterLink v-for="link in links" :key="link.path" :to="link.path" :aria-current="route.path === link.path ? 'page' : undefined" @click="closePanels"><span>{{ tr(link.label) }}</span><Icon name="arrow-right" :size="20" /></RouterLink></nav>
    </div>
  </header>
</template>

<style scoped>
.navigation-header { position: relative; z-index: 30; background: #fff; border-bottom: 1px solid #e5eef3; }
.navigation-bar { max-width: 1440px; height: 88px; padding: 0 68px; margin: auto; display: flex; align-items: center; gap: 32px; }
.navigation-brand { display: inline-flex; align-items: center; gap: 11px; font-size: 31px; font-weight: 700; letter-spacing: -1.3px; line-height: 1; color: #102e43; flex-shrink: 0; }
.navigation-brand :deep(.brand-wordmark) { width: 210px; }
.desktop-navigation { display: flex; align-items: center; gap: 10px; margin-left: auto; height: 100%; }
.desktop-navigation a { position: relative; display: flex; align-items: center; height: 100%; padding: 0 16px; font-size: 15px; font-weight: 600; color: #547080; white-space: nowrap; }
.desktop-navigation a[aria-current="page"] { color: #007fa8; }
.desktop-navigation a[aria-current="page"]::after { content: ''; position: absolute; bottom: 19px; left: 16px; right: 16px; height: 2px; background: #009cc6; border-radius: 2px; }
.desktop-navigation a:hover { color: #007fa8; }
.navigation-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.language-control { position: relative; }
.language-trigger { width: 140px; white-space: nowrap; }
.language-short { display: none; }
.language-trigger svg, .menu-trigger svg { flex-shrink: 0; }
.language-trigger, .menu-trigger { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; border: 1px solid #dceaf0; border-radius: 10px; background: #fff; color: #244a5e; padding: 0 12px; font-size: 13px; font-weight: 600; cursor: pointer; }
.language-trigger:hover, .language-trigger[aria-expanded="true"], .menu-trigger:hover, .menu-trigger[aria-expanded="true"] { background: #edf8fc; border-color: #b6deec; color: #007fa8; }
.language-caret { transition: transform .15s ease; }
.language-trigger[aria-expanded="true"] .language-caret { transform: rotate(180deg); }
.language-popover { position: absolute; top: calc(100% + 12px); right: 0; width: 224px; padding: 12px; border: 1px solid #dceaf0; border-radius: 14px; background: #fff; box-shadow: 0 14px 40px #102e431a; }
.language-popover p { display: flex; align-items: center; justify-content: space-between; margin: 3px 8px 10px; color: #547080; font-size: 12px; }
.language-popover p span { font-size: 9px; letter-spacing: .12em; }
.language-popover button { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 44px; border: 0; border-radius: 8px; padding: 10px 12px; background: #fff; color: #244a5e; text-align: left; font-size: 14px; cursor: pointer; }
.language-popover button:hover { background: #f3f9fc; }
.language-popover button[aria-pressed="true"] { background: #eaf7fc; color: #007fa8; font-weight: 700; }
.menu-trigger, .navigation-panel { display: none; }
.navigation-header a:focus-visible, .navigation-header button:focus-visible { outline: 2px solid #007fa8; outline-offset: 4px; }
@media (max-width: 1100px) { .navigation-bar { padding-inline: 40px; gap: 22px; } }
@media (max-width: 960px) {
  .navigation-bar { height: 72px; padding: 0 22px; gap: 12px; }
  .navigation-brand { font-size: 27px; gap: 8px; }
  .navigation-brand :deep(.brand-wordmark) { width: 154px; }
  .desktop-navigation { display: none; }
  .navigation-actions { margin-left: auto; gap: 8px; }
  .language-trigger { width: 84px; padding: 0 10px; gap: 6px; }
  .language-name { display: none; }
  .language-short { display: inline; }
  .language-control { position: static; }
  .language-popover { top: calc(100% + 8px); right: 22px; width: min(280px, calc(100% - 44px)); max-height: calc(100dvh - 90px); overflow-y: auto; }
  .language-caret { display: none; }
  .menu-trigger { display: flex; width: 44px; padding: 0; }
  .navigation-panel { display: block; position: absolute; top: 100%; left: 0; right: 0; max-height: calc(100dvh - 72px); overflow-y: auto; padding: 12px 22px 24px; background: #fff; border-bottom: 1px solid #dceaf0; box-shadow: 0 18px 26px #102e4314; }
  .navigation-panel nav { display: grid; gap: 4px; }
  .navigation-panel nav a { display: flex; align-items: center; justify-content: space-between; min-height: 56px; padding: 12px 14px; font-size: 17px; font-weight: 600; border-radius: 10px; color: #244a5e; }
  .navigation-panel nav a span { min-width: 0; overflow-wrap: anywhere; }
  .navigation-panel nav a svg { opacity: .45; flex-shrink: 0; margin-left: 12px; }
  .navigation-panel nav a[aria-current="page"] { background: #eaf7fc; color: #007fa8; }
  .navigation-panel nav a[aria-current="page"] svg { opacity: 1; }
}
@media (max-width: 360px) { .navigation-bar { padding-inline: 16px; } .navigation-brand :deep(.brand-wordmark) { width: 132px; } .navigation-panel { padding-inline: 16px; } .language-popover { right: 16px; width: calc(100% - 32px); } }
@media (prefers-reduced-motion: reduce) { .language-caret { transition: none; } }
</style>
