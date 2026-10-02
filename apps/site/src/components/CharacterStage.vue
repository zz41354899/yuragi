<script setup lang="ts">
import { useText } from "../i18n"
const { tr } = useText()
import { shallowRef, ref } from 'vue'
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
function resetPointer() { player.value?.setPointer(0, 0) }
defineExpose({ getPlayer: () => player.value })
</script>
<template>
  <div class="character-stage" @pointermove="move" @pointerleave="resetPointer">
    <YuragiCharacter :model="model" :autoplay="autoplay" :alt="tr('月兔 Momo，保留原畫的動態角色')" @ready="onReady" @error="onError" @frame="snapshot => emit('frame', snapshot)" />
    <p v-if="failure" class="stage-error" role="alert">{{ tr("目前顯示原畫。") }}{{ failure }}</p>
  </div>
</template>
