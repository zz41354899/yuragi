<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import type { RigPlayer, RigSnapshot } from '@z7589xxz758/yuragi'
import CharacterStage from './CharacterStage.vue'
import { createMireaDemoModel } from '../models/mirea'
import { useText } from '../i18n'
import { pointerGaze } from '../editor/gaze'

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
  const box = artwork.value?.getBoundingClientRect()
  if (!box?.width || !box.height) return
  player.value.setGaze(...pointerGaze([event.clientX,event.clientY],box,model.face!,snapshot?.trackingOffset))
}
function ready(next:RigPlayer){player.value=next;next.setGazeStrength(.75)}
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
    <CharacterStage :model="model" :interactive="false" @ready="ready" @frame="next => snapshot = next" @error="player = undefined" />
  </div>
</template>
