<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useText } from '../i18n'
import BrandMark from './BrandMark.vue'
import Icon from './Icon.vue'

const { tr } = useText()
const year = new Date().getFullYear()
const groups = [
  {
    title: '探索 Yuragi',
    links: [
      { label: '首頁', to: '/' },
      { label: '遊樂場', to: '/playground' },
      { label: '自製角色完整流程', to: '/docs?section=custom-character' },
    ],
  },
  {
    title: '開發指南',
    links: [
      { label: '安裝與開始', to: '/docs?section=installation' },
      { label: '框架整合', to: '/docs?section=component' },
      { label: '所有 API', to: '/docs/api' },
    ],
  },
]
</script>

<template>
  <footer class="yuragi-footer">
    <div class="footer-shell">
      <div class="footer-main">
        <div class="footer-identity">
          <RouterLink class="footer-logo" to="/" :aria-label="tr('Yuragi 首頁')"><BrandMark /></RouterLink>
          <p class="footer-tagline">{{ tr('給原畫一點動態，給創作更多可能。') }}</p>
          <p class="footer-caption"><span aria-hidden="true"></span>{{ tr('2D 插畫動態函式庫') }}</p>
        </div>
        <nav class="footer-navigation" :aria-label="tr('頁尾導覽')">
          <div v-for="(group, index) in groups" :key="group.title" class="footer-group">
            <h2 :id="`footer-group-${index}`">{{ tr(group.title) }}</h2>
            <ul :aria-labelledby="`footer-group-${index}`">
              <li v-for="link in group.links" :key="link.to"><RouterLink :to="link.to"><span>{{ tr(link.label) }}</span><Icon name="arrow-right" :size="14" /></RouterLink></li>
            </ul>
          </div>
        </nav>
      </div>
      <div class="footer-bottom">
        <small>© {{ year }} Yuragi</small>
        <p class="footer-frameworks">TypeScript <span aria-hidden="true">/</span> Vue <span aria-hidden="true">/</span> React</p>
        <p class="footer-signature"><Icon name="wave" :size="18" />{{ tr('為你的角色而生。') }}</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.yuragi-footer { background: linear-gradient(115deg, #f0f9fc, #f8fcfe 65%, #f4fafc); border-top: 1px solid #d9eaf1; color: #183b50; }
.footer-shell { max-width: 1440px; margin-inline: auto; padding: 54px 68px 0; }
.footer-main { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 64px; padding-bottom: 42px; }
.footer-identity { min-width: 0; }
.footer-logo { display: inline-flex; align-items: center; border-radius: 6px; }
.footer-logo :deep(.brand-wordmark) { width: 184px; filter: none; }
.footer-tagline { max-width: 380px; margin: 18px 0 0; font-size: 18px; font-weight: 550; line-height: 1.75; text-wrap: balance; }
.footer-caption { display: flex; align-items: center; gap: 9px; margin: 13px 0 0; color: #547080; font-size: 12px; letter-spacing: .04em; }
.footer-caption > span { width: 20px; height: 1px; background: #008ebc; flex-shrink: 0; }
.footer-navigation { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 38px; padding-top: 10px; }
.footer-group { min-width: 0; }
.footer-group h2 { margin: 0 0 14px; font-size: 12px; font-weight: 650; color: #547080; letter-spacing: .06em; }
.footer-group ul { list-style: none; margin: 0; padding: 0; }
.footer-group a { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 40px; padding-block: 7px; font-size: 14px; line-height: 1.6; transition: color .18s ease; }
.footer-group a span { min-width: 0; overflow-wrap: anywhere; }
.footer-group a svg { flex-shrink: 0; color: #0083ac; opacity: 0; transform: translateX(-4px); transition: opacity .18s ease, transform .18s ease; }
.footer-group a:hover, .footer-group a:focus-visible { color: #007fa8; }
.footer-group a:hover svg, .footer-group a:focus-visible svg { opacity: 1; transform: translateX(0); }
.footer-bottom { display: flex; align-items: center; flex-wrap: wrap; gap: 18px 30px; min-height: 76px; padding-block: 20px; border-top: 1px solid #d9e7ee; color: #547080; }
.footer-bottom small, .footer-bottom p { margin: 0; font-size: 11px; line-height: 1.7; }
.footer-frameworks { display: flex; flex-wrap: wrap; gap: 10px; letter-spacing: .03em; }
.footer-frameworks span { color: #9bb5c4; }
.footer-bottom .footer-signature { display: flex; align-items: center; gap: 9px; margin-left: auto; }
.footer-signature svg { color: #0083ac; flex-shrink: 0; }
.yuragi-footer a:focus-visible { outline: 2px solid #007fa8; outline-offset: 4px; border-radius: 3px; }
@media (max-width: 1100px) { .footer-shell { padding-inline: 40px; } .footer-main { gap: 40px; } .footer-navigation { gap: 24px; } }
@media (max-width: 760px) {
  .footer-shell { padding: 36px 22px 0; }
  .footer-main { grid-template-columns: minmax(0, 1fr); gap: 30px; padding-bottom: 30px; }
  .footer-logo :deep(.brand-wordmark) { width: 164px; }
  .footer-tagline { margin-top: 14px; font-size: 17px; }
  .footer-navigation { padding-top: 0; gap: 24px; }
  .footer-group h2 { margin-bottom: 10px; }
  .footer-group a { min-height: 44px; font-size: 13px; }
  .footer-bottom { gap: 12px 24px; padding-block: 20px 24px; }
  .footer-bottom .footer-signature { flex-basis: 100%; margin-left: 0; }
}
@media (max-width: 360px) { .footer-shell { padding-inline: 16px; } .footer-navigation { gap: 16px; } }
@media (prefers-reduced-motion: reduce) { .footer-group a, .footer-group a svg { transition: none; } }
</style>
