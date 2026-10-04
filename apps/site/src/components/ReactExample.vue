<script setup lang="ts">
import { useText } from "../i18n"
const { tr, locale } = useText()
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { createElement, StrictMode, useMemo } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { YuragiCharacter } from '@yuragi/rig/react'
import type { RigPlayer } from '@yuragi/rig'
import { createMireaDemoModel } from '../models/mirea'
const host = ref<HTMLDivElement>()
const status = ref('載入 React 範例…')
let root: Root | undefined
let player: RigPlayer | undefined
function Demo() {
  const model = useMemo(() => createMireaDemoModel(), [])
  return createElement(YuragiCharacter, { model, alt: tr('React 播放器中的海月'), onReady: (next: RigPlayer) => { player = next; status.value = 'React 播放器已就緒' }, onError: (error: Error) => { status.value = error.message } })
}
onMounted(() => { if (host.value) { root = createRoot(host.value); root.render(createElement(StrictMode, null, createElement(Demo))) } })
watch(locale, () => root?.render(createElement(StrictMode, null, createElement(Demo))))
onBeforeUnmount(() => root?.unmount())
</script>
<template><div class="react-demo"><div ref="host" class="react-demo-character"></div><div><span class="small-label">{{ tr("React 即時範例") }}</span><p role="status">{{ tr(status) }}</p><button class="button outline" @click="player?.reset()">{{ tr("回正") }}</button></div></div></template>
