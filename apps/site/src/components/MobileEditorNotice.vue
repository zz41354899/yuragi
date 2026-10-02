<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useText } from '../i18n'
import Icon from './Icon.vue'

const { tr } = useText()
const router = useRouter()
const dialog = ref<HTMLDialogElement>()
let mobile: MediaQueryList | undefined
let dismissed = false
let previousOverflow: string | undefined

function restoreScroll() {
  if (previousOverflow === undefined) return
  document.body.style.overflow = previousOverflow
  previousOverflow = undefined
}
function syncViewport() {
  if (mobile?.matches && !dismissed && !dialog.value?.open) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.value?.showModal()
  } else if (!mobile?.matches) {
    dialog.value?.close()
    restoreScroll()
  }
}
function dismiss() { dismissed = true; dialog.value?.close(); restoreScroll() }
function onClose() { dismissed = true; restoreScroll() }
function goHome() { dismiss(); void router.push('/') }
onMounted(() => {
  mobile = window.matchMedia('(max-width: 760px)')
  syncViewport()
  mobile.addEventListener('change', syncViewport)
})
onBeforeUnmount(() => {
  mobile?.removeEventListener('change', syncViewport)
  dialog.value?.close()
  restoreScroll()
})
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="mobile-editor-notice" aria-labelledby="mobile-editor-title" aria-describedby="mobile-editor-description" @close="onClose">
      <div class="editor-notice-icon"><Icon name="desktop" :size="32" /></div>
      <p class="editor-notice-eyebrow">YURAGI PLAYGROUND</p>
      <h2 id="mobile-editor-title">{{ tr('建議使用電腦瀏覽') }}</h2>
      <p id="mobile-editor-description">{{ tr('遊樂場需要拖曳控制點與調整細部參數，使用電腦和滑鼠會更好操作。你也可以繼續用手機預覽與嘗試。') }}</p>
      <div class="editor-notice-actions">
        <button class="editor-notice-primary" type="button" autofocus @click="goHome">{{ tr('返回首頁') }}<Icon name="arrow-right" :size="18" /></button>
        <button class="editor-notice-secondary" type="button" @click="dismiss">{{ tr('繼續使用手機') }}</button>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.mobile-editor-notice { width: min(400px, calc(100% - 40px)); max-height: calc(100dvh - 40px); margin: auto; padding: 28px 24px 24px; border: 1px solid #d8eaf2; border-radius: 20px; background: #fff; color: #102e43; box-shadow: 0 24px 80px #102e4333; overflow-y: auto; text-align: center; }
.mobile-editor-notice::backdrop { background: #102e4380; }
.editor-notice-icon { display: grid; place-items: center; width: 64px; height: 64px; margin: 0 auto 18px; border: 1px solid #d2eaf5; border-radius: 18px; background: #eaf8fe; color: #008bb7; }
.editor-notice-eyebrow { margin: 0 0 10px; font-size: 10px; letter-spacing: .12em; color: #547080; }
.mobile-editor-notice h2 { margin: 0; font-size: 24px; line-height: 1.45; font-weight: 700; text-wrap: balance; }
#mobile-editor-description { margin: 16px 0 24px; color: #547080; font-size: 14px; line-height: 1.85; overflow-wrap: break-word; }
.editor-notice-actions { display: grid; gap: 10px; }
.editor-notice-actions button { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 12px 16px; border-radius: 10px; font-size: 14px; line-height: 1.5; font-weight: 600; cursor: pointer; }
.editor-notice-primary { background: #008bb7; color: #fff; border: 1px solid #008bb7; }
.editor-notice-primary:hover { background: #00789e; }
.editor-notice-secondary { background: #fff; border: 1px solid #dceaf0; color: #547080; }
.editor-notice-secondary:hover { background: #f1f9fc; }
.editor-notice-actions button:focus-visible { outline: 2px solid #007fa8; outline-offset: 3px; }
.editor-notice-actions svg { flex-shrink: 0; }
@media (max-width: 360px) { .mobile-editor-notice { padding: 24px 20px 20px; } .mobile-editor-notice h2 { font-size: 22px; } }
</style>
