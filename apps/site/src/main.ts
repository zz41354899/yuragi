import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './pages/Home.vue'
import { watchEffect } from 'vue'
import { i18n, isLocale, translate } from './i18n'
import './style.css'
import './design.css'
import './refinements.css'
import './stage-home.css'
import './workspace.css'
import './motion.css'
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home, meta: { title: '讓插畫輕輕動起來' } },
    { path: '/docs', component: () => import('./pages/Docs.vue'), meta: { title: '文件' } },
    { path: '/playground', component: () => import('./pages/Playground.vue'), meta: { title: '遊樂場' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 100, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }
    if (to.path === from.path && to.query.section === from.query.section) return false
    return { top: 0 }
  },
})
router.beforeEach(to => { if (isLocale(to.query.lang)) i18n.global.locale.value = to.query.lang })
createApp(App).use(i18n).use(router).mount('#app')
watchEffect(() => {
  const locale = i18n.global.locale.value
  document.documentElement.lang = locale
  document.title = 'Yuragi — ' + translate(String(router.currentRoute.value.meta.title || '讓插畫輕輕動起來'))
  document.querySelector('meta[name="description"]')?.setAttribute('content', translate('Yuragi 是讓插畫角色動起來的 TypeScript 函式庫。保留原畫，透過 Vue、React 與 JavaScript 加入輕盈的骨架動態。'))
  try { localStorage.setItem('yuragi.locale', locale) } catch { /* Switching works without storage. */ }
})
