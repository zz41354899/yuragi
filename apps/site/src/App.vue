<script setup lang="ts">
import { useText } from "./i18n"
const { tr } = useText()
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import OpeningLoader from './components/OpeningLoader.vue'
import { RouterView, useRoute } from 'vue-router'
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
  <SiteFooter v-if="route.path !== '/playground'" :inert="opening" />
</template>
