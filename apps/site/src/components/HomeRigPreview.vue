<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'
import { createMomoModel, type RigPlayer } from '@yuragi/rig'
import CharacterStage from './CharacterStage.vue'
import Icon from './Icon.vue'
import { useText } from '../i18n'
import { clamp, imagePoint, movePin, zoomAtPoint, type Point } from '../editor/viewport'
const { tr } = useText()
const model = createMomoModel()
const pins = ref(structuredClone(model.pins).filter(pin => /^(head|ear|hair)/.test(pin.name)))
const player = shallowRef<RigPlayer>()
const selectedName = ref('head-root')
const selected = computed(() => pins.value.find(pin => pin.name === selectedName.value)!)
const tool = ref<'pins' | 'pan'>('pins')
const artwork = ref<HTMLElement>()
const zoom = ref(1.2)
const pan = ref<Point>({ x: 0, y: 0 })
const viewStyle = computed(() => ({ transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})` }))
let gesture: { id: number; target: HTMLElement; name?: string; start: Point; pan: Point } | undefined
let pending: { name: string; point: Point } | undefined
let frame = 0
function apply(name: string, point: Point) {
  const pin = pins.value.find(pin => pin.name === name)
  if (!pin || !player.value) return
  player.value.setPin(name, point); Object.assign(pin, point)
}
function flush() { frame = 0; if (pending) { const next = pending; pending = undefined; apply(next.name, next.point) } }
function start(event: PointerEvent, name?: string) {
  if (gesture || event.button !== 0 || name && !player.value || !name && tool.value !== 'pan') return
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  if (name) { selectedName.value = name; target.focus({ preventScroll: true }) }
  gesture = { id: event.pointerId, target, name, start: { x: event.clientX, y: event.clientY }, pan: { ...pan.value } }
  target.setPointerCapture(event.pointerId)
}
function move(event: PointerEvent) {
  if (!gesture || gesture.id !== event.pointerId) return
  if (gesture.name && artwork.value) {
    const point = imagePoint({ x: event.clientX, y: event.clientY }, artwork.value.getBoundingClientRect())
    if (point) { pending = { name: gesture.name, point }; if (!frame) frame = requestAnimationFrame(flush) }
  } else pan.value = { x: clamp(gesture.pan.x + event.clientX - gesture.start.x, -1000, 1000), y: clamp(gesture.pan.y + event.clientY - gesture.start.y, -1000, 1000) }
}
function finish(event?: PointerEvent) {
  if (!gesture || event && event.pointerId !== gesture.id) return
  const previous = gesture; gesture = undefined
  cancelAnimationFrame(frame); flush()
  if (previous.target.hasPointerCapture(previous.id)) previous.target.releasePointerCapture(previous.id)
}
function keyboard(event: KeyboardEvent, name: string) {
  const pin = pins.value.find(pin => pin.name === name)
  if (!pin) return
  const point = movePin(pin, event.key, event.shiftKey)
  if (point) { event.preventDefault(); selectedName.value = name; apply(name, point) }
}
function changeZoom(next: number) {
  const view = zoomAtPoint(zoom.value, next, pan.value, { x: 0, y: 0 })
  zoom.value = view.zoom; pan.value = view.pan
}
function reset() { finish(); zoom.value = 1.2; pan.value = { x: 0, y: 0 } }
onBeforeUnmount(() => { finish(); cancelAnimationFrame(frame) })
</script>
<template>
  <div class="stage-mini-editor">
    <div class="stage-editor-toolbar"><div class="stage-editor-tools"><button :class="{ selected: tool === 'pins' }" :aria-pressed="tool === 'pins'" @click="tool = 'pins'"><Icon name="pin" />{{ tr('圖釘') }}</button><button :class="{ selected: tool === 'pan' }" :aria-pressed="tool === 'pan'" @click="tool = 'pan'"><Icon name="move" />{{ tr('平移') }}</button></div><div class="stage-editor-zoom"><button :aria-label="tr('縮小')" :disabled="zoom <= .5" @click="changeZoom(zoom - .2)">−</button><output>{{ Math.round(zoom * 100) }}%</output><button :aria-label="tr('放大')" :disabled="zoom >= 3" @click="changeZoom(zoom + .2)">+</button><button :aria-label="tr('重設視圖')" @click="reset"><Icon name="reset" :size="17" /></button></div></div>
    <div class="stage-editor-canvas" :class="{ 'pan-tool': tool === 'pan' }" @pointerdown="start($event)" @pointermove="move" @pointerup="finish" @pointercancel="finish" @lostpointercapture="finish">
      <div ref="artwork" class="stage-editor-artwork" :style="viewStyle"><CharacterStage :model="model" :autoplay="false" :interactive="false" @ready="next => player = next" /><button v-for="pin in pins" :key="pin.name" class="stage-editor-pin" :class="{ selected: selectedName === pin.name }" :style="{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }" :aria-label="tr('控制點') + ' ' + pin.name" :aria-pressed="selectedName === pin.name" :disabled="!player" :tabindex="tool === 'pins' ? 0 : -1" @pointerdown.stop="tool === 'pins' ? start($event, pin.name) : undefined" @keydown="keyboard($event, pin.name)" @click="selectedName = pin.name"></button></div>
      <div class="stage-editor-coordinate"><h3>{{ tr('控制點座標') }}</h3><span class="stage-selected-pin">{{ selectedName }}</span><dl><div><dt>X</dt><dd>{{ selected.x.toFixed(3) }}</dd></div><div><dt>Y</dt><dd>{{ selected.y.toFixed(3) }}</dd></div></dl></div>
    </div>
    <p class="stage-editor-hint">{{ tr('拖曳圖釘；方向鍵微調，Shift 加大步進。') }}<RouterLink to="/playground?tab=bones">{{ tr('完整編輯器') }}<Icon name="arrow-right" :size="15" /></RouterLink></p>
  </div>
</template>
