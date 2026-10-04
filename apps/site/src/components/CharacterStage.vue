<script setup lang="ts">
import { useText } from "../i18n"
const { tr } = useText()
import { shallowRef, ref, watch } from 'vue'
import { YuragiCharacter } from '@yuragi/rig/vue'
import type { RigModel, RigPlayer, RigSnapshot } from '@yuragi/rig'
const props = withDefaults(defineProps<{ model: RigModel; follow?: boolean; autoplay?: boolean; interactive?: boolean }>(), { follow: true, autoplay: true, interactive: true })
const emit = defineEmits<{ ready: [player: RigPlayer]; frame: [snapshot: RigSnapshot]; error: [error: Error] }>()
const player = shallowRef<RigPlayer>()
const failure = ref('')
function onReady(next: RigPlayer) { player.value = next; failure.value = ''; emit('ready', next) }
function onError(error: Error) { failure.value = error.message; emit('error', error) }
function move(event: PointerEvent) {
  if (!props.interactive || !props.follow || event.pointerType === 'touch' && !event.buttons) return
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  player.value?.setPointer((event.clientX - box.left) / box.width - .5, (event.clientY - box.top) / box.height - .5)
}
watch(() => [props.follow, props.interactive], () => { if (!props.follow || !props.interactive) player.value?.setPointer(0, 0) })
function keyboard(event: KeyboardEvent) {
  if(event.target !== event.currentTarget || !props.interactive || !props.follow) return
  const directions: Record<string,[number,number]>={ArrowLeft:[-.5,0],ArrowRight:[.5,0],ArrowUp:[0,-.5],ArrowDown:[0,.5],Escape:[0,0]}
  const next=directions[event.key];if(next){event.preventDefault();player.value?.setPointer(...next)}
}
function resetPointer() { player.value?.setPointer(0, 0) }
defineExpose({ getPlayer: () => player.value })
</script>
<template>
  <div class="character-stage" @pointermove="move" @pointerleave="resetPointer" @pointerup="($event.pointerType === 'touch') && resetPointer()" @pointercancel="resetPointer" @blur.self="resetPointer" @keydown="keyboard" :tabindex="interactive && follow ? 0 : undefined" :aria-label="interactive && follow ? model.name + ' 游標與方向鍵互動區' : undefined">
    <YuragiCharacter :model="model" :autoplay="autoplay" :alt="model.name" @ready="onReady" @error="onError" @frame="snapshot => emit('frame', snapshot)" />
    <p v-if="failure" class="stage-error" role="alert">{{ tr("目前顯示原畫。") }}{{ failure }}</p>
  </div>
</template>
