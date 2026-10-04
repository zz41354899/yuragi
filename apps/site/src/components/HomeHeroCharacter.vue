<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import type { RigPlayer, RigSnapshot } from '@yuragi/rig'
import CharacterStage from './CharacterStage.vue'
import { createMireaDemoModel } from '../models/mirea'
import { useText } from '../i18n'

const { tr } = useText()
const model = createMireaDemoModel()
const artwork = ref<HTMLElement>()
const player = shallowRef<RigPlayer>()
let snapshot: RigSnapshot | undefined
const bounded = (value: number) => Math.max(-.5, Math.min(.5, value))

function move(event: PointerEvent) {
  if (!player.value || event.pointerType === 'touch' && !event.buttons) return
  const stage = (event.currentTarget as HTMLElement).getBoundingClientRect()
  if (!stage.width || !stage.height) return
  player.value.setPointer(bounded((event.clientX - stage.left) / stage.width - .5), bounded((event.clientY - stage.top) / stage.height - .5))
  const box = artwork.value?.getBoundingClientRect(), eyes = model.face!.eyes
  if (!box?.width || !box.height) return
  const travel = snapshot?.trackingOffset ?? [0,0]
  const cx = (eyes[0].center[0] + eyes[1].center[0]) / 2 + travel[0]
  const cy = (eyes[0].center[1] + eyes[1].center[1]) / 2 + travel[1]
  player.value.setGaze((event.clientX - box.left - box.width * cx) / (box.width * .18), (event.clientY - box.top - box.height * cy) / (box.height * .11))
}
function resetPointer() { player.value?.setPointer(0,0); player.value?.setGaze(0,0) }
function keyboard(event: KeyboardEvent) {
  const directions: Record<string,[number,number]> = { ArrowLeft:[-.5,0], ArrowRight:[.5,0], ArrowUp:[0,-.5], ArrowDown:[0,.5], Home:[0,0], Escape:[0,0] }
  const next = directions[event.key]
  if (next && player.value) { event.preventDefault(); player.value.setPointer(...next) }
}
defineExpose({ move, resetPointer })
</script>

<template>
  <div ref="artwork" class="stage-hero-character" role="group" tabindex="0" :aria-label="tr('海月互動；移動游標或使用方向鍵，離開時回正。')" @keydown="keyboard" @blur="resetPointer">
    <CharacterStage :model="model" :interactive="false" @ready="next => player = next" @frame="next => snapshot = next" @error="player = undefined" />
  </div>
</template>
