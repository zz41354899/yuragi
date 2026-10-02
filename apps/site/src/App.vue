<script setup lang="ts">
import { useText } from "./i18n"
const { tr } = useText()
import BrandMark from './components/BrandMark.vue'
import SiteHeader from './components/SiteHeader.vue'
import OpeningLoader from './components/OpeningLoader.vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { nextTick, ref } from 'vue'
import { useSiteMotion } from './composables/useSiteMotion'
const route = useRoute()
const main = ref<HTMLElement>()
const progress = ref<HTMLElement>()
const opening = ref(route.path === '/')
const ready = ref(!opening.value)
useSiteMotion(main, ready, progress)
async function completeOpening() {
  const restoreFocus = document.activeElement?.closest('.opening-loader')
  opening.value = false
  ready.value = true
  await nextTick()
  if (restoreFocus) main.value?.focus({ preventScroll: true })
}
</script>
<template>
  <OpeningLoader v-if="opening" @reveal="ready = true" @complete="completeOpening" />
  <div v-show="route.path !== '/playground'" class="site-scroll-progress" aria-hidden="true"><span ref="progress"></span></div>
  <a class="skip-link" href="#main" :inert="opening">{{ tr("跳至主要內容") }}</a>
  <SiteHeader :inert="opening" :class="{ 'workspace-navigation': route.path !== '/' }" />
  <main id="main" ref="main" :inert="opening" tabindex="-1" :class="{ 'studio-main': route.path === '/playground' }"><RouterView /></main>
  <footer v-if="route.path !== '/playground'" :inert="opening" class="site-footer" :class="{ 'stage-site-footer': route.path === '/' }">
    <RouterLink class="footer-brand" to="/" :aria-label="tr('Yuragi 首頁')"><BrandMark /></RouterLink>
    <p>{{ tr(route.path === '/' ? '讓 2D 插畫，在網頁中動起來。' : '給原畫一點動態，給創作更多可能。') }}</p>
    <div><RouterLink to="/docs">{{ tr("安裝與 API") }}</RouterLink><RouterLink to="/playground">{{ tr("遊樂場") }}</RouterLink><span v-if="route.path !== '/'">{{ tr("為你的角色而生。") }}</span></div>
  </footer>
</template>

<style scoped>
.footer-brand :deep(.brand-wordmark) { width: 156px; }
</style>
