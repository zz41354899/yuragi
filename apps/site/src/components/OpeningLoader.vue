<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import BrandMark from './BrandMark.vue'
import { useText } from '../i18n'
const { tr } = useText()
const emit = defineEmits<{ reveal: []; complete: [] }>()
const overlay = ref<HTMLElement>()
const progress = ref(0)
const controller = new AbortController()
let media: ReturnType<typeof import('gsap').gsap.matchMedia> | undefined
let animation: typeof import('gsap').gsap | undefined
let exit: ReturnType<typeof import('gsap').gsap.timeline> | undefined
const decorations: ReturnType<typeof import('gsap').gsap.to>[] = []
let closing = false
let revealed = false
const tasks = new Set<() => void>()
let overflow: string | undefined
function unlockScroll() { if (overflow !== undefined) { document.documentElement.style.overflow = overflow; overflow = undefined } }
function pause(ms: number) {
  return new Promise<void>(resolve => {
    const finish = () => { clearTimeout(timer); tasks.delete(finish); resolve() }
    const timer = setTimeout(finish, ms)
    tasks.add(finish)
  })
}
function awaitImage(img: HTMLImageElement) {
  return new Promise<void>(resolve => {
    if (img.complete) { resolve(); return }
    const finish = () => { img.removeEventListener('load', finish); img.removeEventListener('error', finish); controller.signal.removeEventListener('abort', finish); resolve() }
    img.addEventListener('load', finish, { once: true })
    img.addEventListener('error', finish, { once: true })
    controller.signal.addEventListener('abort', finish, { once: true })
  })
}
function reveal() { if (!revealed) { revealed = true; emit('reveal') } }
function finish() {
  if (closing || controller.signal.aborted) return
  closing = true
  progress.value = 1
  // Freeze the current pose; reverting here visibly snapped decorations back to zero.
  decorations.forEach(tween => tween.pause())
  unlockScroll()
  if (!animation || !overlay.value || matchMedia('(prefers-reduced-motion: reduce)').matches) { reveal(); emit('complete'); return }
  // Only the curtain and decoration move. The wordmark itself remains static.
  exit = animation.timeline({ onComplete: () => emit('complete') })
    .call(reveal)
    .to(overlay.value, { yPercent: -100, duration: .65, ease: 'power3.inOut' })
}
function skip() { finish() }
onMounted(async () => {
  overflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
  // Readiness tracks actual eager images and fonts; never wait indefinitely on an asset.
  const images = Array.from(document.images).filter(img => img.loading !== 'lazy')
  const readiness = [...images.map(awaitImage), document.fonts.ready.then(() => undefined)]
  let settled = 0
  readiness.forEach(task => { void task.then(() => { if (!closing && !controller.signal.aborted) progress.value = ++settled / readiness.length }) })
  const loading = Promise.race([Promise.all(readiness), pause(3500)])
  const minimum = pause(matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850)
  // The page also opens if the optional animation chunk stalls.
  void Promise.all([loading, minimum]).then(() => { if (!animation) finish() })
  try {
    const { gsap } = await import('gsap')
    if (controller.signal.aborted || closing) return
    animation = gsap
    media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      decorations.push(gsap.to('.opening-orbit', { rotation: 180, duration: 1.8, ease: 'sine.inOut', repeat: 1, yoyo: true, transformOrigin: '50% 50%' }))
      decorations.push(gsap.from('.opening-star', { scale: .5, opacity: 0, duration: .65, stagger: .12, ease: 'back.out(2)' }))
    }, overlay.value)
    await Promise.all([loading, minimum])
    finish()
  } catch { finish() }
})
onBeforeUnmount(() => {
  controller.abort()
  unlockScroll()
  tasks.forEach(finish => finish())
  exit?.kill()
  media?.revert()
})
</script>

<template>
  <div ref="overlay" class="opening-loader">
    <div class="opening-composition">
      <div class="opening-orbit" aria-hidden="true"><i></i><i></i></div>
      <span class="opening-star opening-star-left" aria-hidden="true">✦</span><span class="opening-star opening-star-right" aria-hidden="true">✧</span>
      <BrandMark />
      <p class="opening-caption">{{ tr('讓插畫，輕輕動起來。') }}</p>
      <div class="opening-meter" aria-hidden="true"><span class="opening-meter-fill" :style="{ transform: `scaleX(${progress})` }"></span></div>
      <p class="opening-status" role="status">{{ tr('正在準備舞台') }}</p>
    </div>
    <button class="opening-skip" type="button" @click="skip">{{ tr('跳過開場') }} <span aria-hidden="true">↗</span></button>
  </div>
</template>

<style scoped>
.opening-loader { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; background: #edfaff; color: #087fc7; overflow: hidden; }
.opening-composition { position: relative; display: flex; align-items: center; flex-direction: column; padding: 80px 35px; }
.opening-composition :deep(.brand-wordmark) { width: clamp(210px, 28vw, 320px); z-index: 1; }
.opening-caption { position: relative; margin: 26px 0 0; font-size: 15px; font-weight: 600; letter-spacing: .16em; }
.opening-meter { margin-top: 32px; width: 140px; height: 3px; border-radius: 10px; background: #ccebf8; overflow: hidden; }
.opening-meter-fill { display: block; height: 100%; background: #159acc; transform-origin: left center; }
.opening-status { margin: 14px 0 0; font-size: 11px; letter-spacing: .13em; color: #658a9e; }
.opening-orbit { position: absolute; top: 8px; width: 330px; height: 330px; border: 1px solid #c7eaf8; border-radius: 50%; pointer-events: none; }
.opening-orbit::after { content: ''; position: absolute; inset: 20px; border: 1px dashed #c7eaf8; border-radius: 50%; }
.opening-orbit i { position: absolute; width: 9px; height: 9px; background: #5cc2ea; border: 2px solid #edfaff; border-radius: 50%; left: 35px; top: 45px; }
.opening-orbit i + i { left: auto; top: auto; bottom: 45px; right: 35px; width: 6px; height: 6px; background: #a3dffa; }
.opening-star { position: absolute; z-index: 1; font-size: 32px; color: #74c8eb; }
.opening-star-left { left: 0; top: 68px; }.opening-star-right { right: 0; top: 172px; font-size: 44px; }
.opening-skip { position: absolute; bottom: max(32px, env(safe-area-inset-bottom)); right: 32px; display: flex; align-items: center; gap: 16px; padding: 12px 18px; border: 1px solid #c5e7f5; border-radius: 30px; background: #ffffffa6; color: #426e86; font: inherit; font-size: 12px; cursor: pointer; }
.opening-skip:focus-visible { outline: 2px solid #087fc7; outline-offset: 4px; }
@media (max-width: 420px) { .opening-orbit { width: 290px; height: 290px; top: 26px; } .opening-composition { padding-inline: 32px; } .opening-caption { font-size: 13px; } .opening-skip { right: 22px; bottom: 22px; } }
</style>
