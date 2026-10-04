<script setup lang="ts">
import { useText } from "../i18n"
const { tr } = useText()
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { type RigModel, type RigPlayer, type MotionSettings, type DeformationPart, type RigSnapshot } from '@yuragi/rig'
import CharacterStage from '../components/CharacterStage.vue'
import { drawMesh, meshPoint } from '../editor/mesh-view'
import { rigRegions, rigOutline } from '../editor/rig-view'
import { boneOutline, boneColor } from '../editor/skeleton-view'
import { mireaStructure } from '../models/mirea-structure'
import type { RigMeshSnapshot } from '@yuragi/rig'
import MotionControls from '../components/MotionControls.vue'
import { createMireaDemoModel } from '../models/mirea'
import Icon from '../components/Icon.vue'
import MobileEditorNotice from '../components/MobileEditorNotice.vue'
import { clamp, zoomAtPoint, MIN_ZOOM, MAX_ZOOM, type Point } from '../editor/viewport'
const model = shallowRef(createMireaDemoModel())
const player = shallowRef<RigPlayer>()
const snapshot = shallowRef<RigSnapshot>()
const settings = ref<MotionSettings>({ ...model.value.motion })
const editableParts = ref<DeformationPart[]>(structuredClone(model.value.parts ?? []))
const selectedPartId = ref(editableParts.value[0]?.id ?? '')
const selectedPart = computed(() => editableParts.value.find(p => p.id === selectedPartId.value))
const partFields = [{key:'rotation',label:'最大轉角',min:0,max:.35,step:.001},{key:'stiffness',label:'剛性',min:.001,max:1,step:.001},{key:'damping',label:'阻尼',min:.001,max:1,step:.001}] as const
function updatePart(field: 'rotation'|'stiffness'|'damping', event: Event) {
  if(!selectedPart.value || !player.value)return
  const input = event.target as HTMLInputElement
  if (input.value === '' || !input.validity.valid || !Number.isFinite(input.valueAsNumber)) return
  try { player.value.setPart(selectedPart.value.id,{[field]:input.valueAsNumber});selectedPart.value[field]=input.valueAsNumber;message.value='' }
  catch(error){message.value=String(error);input.value=String(selectedPart.value[field])}
}
const route = useRoute()
const tab = ref<'motion' | 'layers'>(['layers', 'bones'].includes(String(route.query.tab)) ? 'layers' : 'motion')
const showSkeleton = ref(false)
const showMeshRegions = ref(tab.value === 'layers')
const showTriangles = ref(false)
const meshCanvas = ref<HTMLCanvasElement>()
const debugMesh = shallowRef<RigMeshSnapshot>()
const showGrid = ref(false)
const playing = ref(true)
const following = ref(true)
const bg = ref('dark')
const gazeStrength = ref(1)
const activePreset = ref('default')
const backgrounds = [{value:'paper',label:'紙白背景'},{value:'lilac',label:'淺藍背景'},{value:'dark',label:'深色背景'}]
const layerGroups = computed(() => [
  { title: '頭髮', kind: 'hair' }, { title: '服裝', kind: 'cloth' },
  { title: '飄帶', kind: 'ribbon' }, { title: '配件', kind: 'accessory' },
].map(group => ({ ...group, parts: editableParts.value.filter(part => part.kind === group.kind) })).filter(group => group.parts.length))
function chooseLayer(id: string) { selectedPartId.value = id; showMeshRegions.value = true }
function layerColor(id: string) { return `hsl(${editableParts.value.findIndex(part => part.id === id) * 41 % 360} 85% 75%)` }
function updateGaze() { player.value?.setGazeStrength(gazeStrength.value) }
function centerArtwork() { player.value?.reset(); if(model.value.face) player.value?.setGazeStrength(gazeStrength.value) }
function resetPointer() { player.value?.setPointer(0,0); if(model.value.face) player.value?.setGaze(0,0) }
const message = ref('')
const reducedMotion = ref(false)
const changingModel = ref(false)
const artwork = ref<HTMLElement>()
const zoom = ref(1)
const pan = ref<Point>({ x: 0, y: 0 })
const tool = ref<'select' | 'pan'>('select')
const dragging = ref(false)
const viewStyle = computed(() => ({ transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})` }))
let gesture: { id: number; target: HTMLElement; start: Point; pan: Point } | undefined
watch(tool, next => { if(next === 'pan') player.value?.setPointer(0,0) })
watch(following, enabled => { if (!enabled) resetPointer() })
function followCanvas(event: PointerEvent) {
  if (!playing.value || !following.value || gesture || tool.value === 'pan' || reducedMotion.value || event.pointerType === 'touch' && !event.buttons || !artwork.value) return
  const box = artwork.value.getBoundingClientRect()
  player.value?.setPointer(clamp((event.clientX-box.left)/box.width-.5,-.5,.5),clamp((event.clientY-box.top)/box.height-.5,-.5,.5))
  const eyes=model.value.face?.eyes
  if(eyes){const cx=(eyes[0].center[0]+eyes[1].center[0])/2,cy=(eyes[0].center[1]+eyes[1].center[1])/2;player.value?.setGaze((event.clientX-box.left-box.width*cx)/(box.width*.22),(event.clientY-box.top-box.height*cy)/(box.height*.14))}
}
function keyboardFollow(event: KeyboardEvent) {
  if (event.target !== event.currentTarget || !following.value || reducedMotion.value) return
  const directions: Record<string,[number,number]> = {ArrowLeft:[-.5,0],ArrowRight:[.5,0],ArrowUp:[0,-.5],ArrowDown:[0,.5],Escape:[0,0]}
  const next = directions[event.key]; if(next) { event.preventDefault(); player.value?.setPointer(...next) }
}
function resetView() { zoom.value = 1; pan.value = { x: 0, y: 0 } }
function changeZoom(next: number, anchor: Point = { x: 0, y: 0 }) {
  const view = zoomAtPoint(zoom.value, next, pan.value, anchor)
  zoom.value = view.zoom; pan.value = view.pan
}
function zoomWheel(event: WheelEvent) {
  if (gesture || !artwork.value) return
  const rect = artwork.value.getBoundingClientRect()
  const anchor = { x: event.clientX - rect.left - rect.width / 2 + pan.value.x, y: event.clientY - rect.top - rect.height / 2 + pan.value.y }
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 300 : 1)
  changeZoom(zoom.value * Math.exp(-clamp(delta, -200, 200) * .002), anchor)
}
function startGesture(event: PointerEvent) {
  if (gesture || event.button !== 0 || tool.value !== 'pan') return
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  gesture = { id: event.pointerId, target, start: { x: event.clientX, y: event.clientY }, pan: { ...pan.value } }
  dragging.value = true
  target.setPointerCapture(event.pointerId)
}
function moveGesture(event: PointerEvent) {
  if (!gesture || gesture.id !== event.pointerId) return
  pan.value = { x: clamp(gesture.pan.x + event.clientX - gesture.start.x, -1800, 1800), y: clamp(gesture.pan.y + event.clientY - gesture.start.y, -1800, 1800) }
  if (event.pointerType === 'mouse' && event.buttons === 0) finishGesture(event)
}
function finishGesture(event?: PointerEvent) {
  if (!gesture || event && event.pointerId !== gesture.id) return
  const previous = gesture; gesture = undefined; dragging.value = false
  if (previous.target.hasPointerCapture(previous.id)) previous.target.releasePointerCapture(previous.id)
}
const sliderDefs: { key: keyof MotionSettings; label: string; hint: string; min: number; max: number }[] = [
  { key: 'sway', label: '待機搖擺', hint: '身體的擺幅與輕微浮動', min: 0, max: 2 },
  { key: 'speed', label: '搖擺速度', hint: '慢一點，更像在呼吸', min: .25, max: 2 },
  { key: 'hair', label: '頭髮跟隨', hint: '髮梢延遲跟上的程度', min: 0, max: 2 },
  { key: 'accessories', label: '配件彈性', hint: '飄帶與吊飾的動態', min: 0, max: 2 },
  { key: 'parts', label: '部件動態', hint: '髮束、布料與飾品的局部幅度', min: 0, max: 2 },
  { key: 'follow', label: '游標影響', hint: '游標帶動視線與姿態的強度', min: 0, max: 2 },
]
watch(settings, value => {
  if (changingModel.value || !player.value) return
  try { player.value.stopAnimation(); player.value.setMotion(value); message.value = '' }
  catch (error) { message.value = String(error) }
}, { deep: true })
function ready(next: RigPlayer) {
  player.value = next; next.setMotion(settings.value); if(model.value.face) next.setGazeStrength(gazeStrength.value)
  if (!playing.value) next.pause()
  changingModel.value = false; onFrame(next.getSnapshot())
}
async function switchTab(next: 'layers' | 'motion', focus = false) {
  finishGesture(); tab.value = next; tool.value = 'select'
  if (next === 'layers') showMeshRegions.value = true
  if (focus) { await nextTick(); document.getElementById(next + '-tab')?.focus() }
}
function togglePlay() {
  if (playing.value) { player.value?.pause(); playing.value = false }
  else { player.value?.play(); playing.value = !!player.value?.getSnapshot().playing }
}
function preset(name: string) {
  activePreset.value = name
  player.value?.stopAnimation(); player.value?.setMotion({ weight: 1 });
  settings.value = name === 'gentle' ? { sway: .55, speed: .6, hair: .7, accessories: .65, follow: .85, parts: .8 }
    : name === 'lively' ? { sway: 1.5, speed: 1.4, hair: 1.5, accessories: 1.4, follow: 1.2, parts: 1.2 }
    : { ...model.value.motion }
}
function replaceModel(next: RigModel) {
  finishGesture(); resetView()
  gazeStrength.value = 1; activePreset.value = 'default';
  changingModel.value = true; player.value = undefined; debugMesh.value = undefined
  editableParts.value = structuredClone(next.parts ?? []); selectedPartId.value = editableParts.value[0]?.id ?? ''
  model.value = next; settings.value = { ...next.motion }
}
function resetModel() { replaceModel(createMireaDemoModel()); message.value = '已還原海月的互動模型與動態。' }
function refreshMesh() {
  if(!player.value || !(showSkeleton.value || showMeshRegions.value || showTriangles.value)) { debugMesh.value = undefined; return }
  debugMesh.value = player.value.getMeshSnapshot()
  if(showTriangles.value && meshCanvas.value) drawMesh(meshCanvas.value,debugMesh.value)
}
function onFrame(value: RigSnapshot) { snapshot.value=value; refreshMesh() }
watch([showSkeleton,showMeshRegions,showTriangles,selectedPartId],async()=>{await nextTick();refreshMesh()})
const bindingRegions = computed(() => showMeshRegions.value ? rigRegions(model.value, editableParts.value).map(region => ({
  ...region, points: rigOutline(region.polygon, model.value, debugMesh.value),
})) : [])
const bindingChains = computed(() => showMeshRegions.value ? [
  ...model.value.hair.map(chain => ({ id: chain.id, points: rigOutline(chain.points, model.value, debugMesh.value, false), color: '#95f4e2' })),
  ...model.value.accessories.map(chain => ({ id: chain.id, points: rigOutline([chain.root, chain.tip], model.value, debugMesh.value, false), color: '#ffdc9f' })),
] : [])
const skeletonNodes = computed(() => showSkeleton.value ? mireaStructure.map(node => {
  const pin = model.value.pins.find(pin => pin.name === node.id)
  const source: [number, number] = pin ? [pin.x, pin.y] : node.point
  const point = debugMesh.value ? meshPoint(debugMesh.value, model.value.mesh.columns, model.value.mesh.rows, source) : source
  return { ...node, source, point, color: boneColor(node.id) }
}) : [])
const skeletonBones = computed(() => skeletonNodes.value.flatMap(node => {
  const parent = skeletonNodes.value.find(parent => parent.id === node.parent)
  return parent ? [{ id: node.id, color: node.color, inferred: node.inferred || parent.inferred,
    points: boneOutline(parent.source, node.source, model.value, debugMesh.value),
    center: rigOutline([parent.source, node.source], model.value, debugMesh.value, false),
  }] : []
}))
let media: MediaQueryList
const mediaChange = () => { reducedMotion.value = media.matches; playing.value = !media.matches }
const interruptGesture = () => finishGesture()
onMounted(() => {
  media = matchMedia('(prefers-reduced-motion: reduce)'); mediaChange(); media.addEventListener('change', mediaChange)
  // Release may land outside the canvas, or be consumed by another control.
  window.addEventListener('pointerup', finishGesture, true)
  window.addEventListener('pointercancel', finishGesture, true)
  window.addEventListener('blur', interruptGesture)
})
onBeforeUnmount(() => {
  gesture = undefined
  media?.removeEventListener('change', mediaChange)
  window.removeEventListener('pointerup', finishGesture, true)
  window.removeEventListener('pointercancel', finishGesture, true)
  window.removeEventListener('blur', interruptGesture)
})
</script>
<template>
  <div class="studio-page">
    <MobileEditorNotice />
    <h1 class="sr-only">{{ tr('遊樂場') }}</h1>
    <p v-if="reducedMotion" class="studio-reduced">{{ tr('系統已啟用減少動態，目前顯示靜態原畫。') }}</p>
    <div class="studio-workspace">
      <section class="studio-canvas-panel" :aria-label="model.name + tr('即時預覽')">
        <div class="studio-model"><img :src="model.texture.src" alt="" /><div><strong>{{ tr('海月みれあ') }}</strong><span>1024 × 1536</span></div></div>
        <div class="studio-tools" :aria-label="tr('畫布工具')">
          <button :aria-label="tr('圖層')" :title="tr('圖層')" :aria-pressed="tool === 'select' && tab === 'layers'" :class="{ active: tool === 'select' && tab === 'layers' }" @click="switchTab('layers')"><Icon name="layers" :size="22" /></button>
          <button :aria-label="tr('平移畫布')" :title="tr('平移畫布')" :aria-pressed="tool === 'pan'" :class="{ active: tool === 'pan' }" @click="tool = 'pan'"><Icon name="move" :size="22" /></button>
          <button :aria-label="tr('格線')" :title="tr('格線')" :aria-pressed="showGrid" @click="showGrid = !showGrid"><Icon name="grid" :size="22" /></button>
          <button :aria-label="tr('骨架')" :title="tr('骨架')" :aria-pressed="showSkeleton" @click="showSkeleton = !showSkeleton"><Icon name="skeleton" :size="22" /></button>
          <button aria-label="Mesh" title="Mesh" :aria-pressed="showMeshRegions" @click="showMeshRegions = !showMeshRegions"><Icon name="mesh" :size="22" /></button>
          <button :aria-label="tr('重設視圖')" :title="tr('重設視圖')" @click="resetView"><Icon name="fit" :size="22" /></button>
        </div>
        <div class="preview-canvas studio-canvas" :class="['bg-' + bg, { 'with-grid': showGrid, 'pan-tool': tool === 'pan', 'is-dragging': dragging }]" @wheel.prevent="zoomWheel" @pointerdown="startGesture($event)" @pointermove="moveGesture($event); followCanvas($event)" @pointerleave="resetPointer" @blur.self="resetPointer" @keydown="keyboardFollow" tabindex="0" :aria-label="model.name + tr('游標與方向鍵互動區')" @pointerup="finishGesture($event); $event.pointerType === 'touch' && player?.setPointer(0,0)" @pointercancel="finishGesture($event); player?.setPointer(0,0)" @lostpointercapture="finishGesture">
          <div ref="artwork" class="preview-art studio-art" :style="viewStyle">
            <CharacterStage :model="model" :interactive="false" :autoplay="playing" @ready="ready" @frame="onFrame" @error="error => message = error.message" />
            <canvas v-if="showTriangles" ref="meshCanvas" class="rig-mesh-overlay" aria-hidden="true" />
            <svg v-if="showMeshRegions" class="rig-binding-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polygon v-for="region in bindingRegions" :key="region.id" :points="region.points" :stroke="region.color" :fill="region.color" :class="{ selected: tab === 'layers' && region.id === selectedPartId, muted: tab === 'layers' && region.id !== selectedPartId }"><title>{{ tr(region.name) }}</title></polygon>
              <polyline v-for="chain in bindingChains" :key="chain.id" :points="chain.points" :stroke="chain.color" fill="none" />
            </svg>
            <svg v-if="showSkeleton" class="skeleton-overlay" :viewBox="`0 0 ${model.texture.width} ${model.texture.height}`" aria-hidden="true">
              <polygon v-for="bone in skeletonBones.filter(bone => !bone.inferred)" :key="bone.id" :points="bone.points" :stroke="bone.color" :fill="bone.color" />
              <svg viewBox="0 0 100 100" :width="model.texture.width" :height="model.texture.height" preserveAspectRatio="none"><polyline v-for="bone in skeletonBones.filter(bone => bone.inferred)" :key="bone.id" :points="bone.center" :stroke="bone.color" class="inferred-span" /></svg>
              <g v-for="node in skeletonNodes" :key="node.id" :transform="`translate(${node.point[0]*model.texture.width} ${node.point[1]*model.texture.height})`" :class="{ inferred: node.inferred }">
                <circle r="9" :stroke="node.color" /><circle r="2.5" :fill="node.color" class="joint-center" /><title>{{ tr(node.label) }}</title>
              </g>
            </svg>
          </div>
        </div>
        <div class="studio-transport">
          <button class="studio-play" @click="togglePlay" :disabled="reducedMotion || !player" :aria-label="tr(playing ? '暫停動畫' : '播放動畫')"><Icon :name="playing ? 'pause' : 'play'" :size="19" /><span>{{ tr(playing ? '暫停' : '播放') }}</span></button>
          <button @click="centerArtwork" :disabled="!player"><Icon name="reset" :size="19" />{{ tr('回正') }}</button>
          <div class="studio-zoom"><button :aria-label="tr('縮小畫布')" :disabled="zoom <= MIN_ZOOM" @click="changeZoom(zoom / 1.2)"><Icon name="minus" :size="17" /></button><output :aria-label="tr('畫布縮放比例')">{{ Math.round(zoom * 100) }}%</output><button :aria-label="tr('放大畫布')" :disabled="zoom >= MAX_ZOOM" @click="changeZoom(zoom * 1.2)"><Icon name="plus" :size="17" /></button></div>
          <button class="studio-fit" @click="resetView"><Icon name="fit" :size="18" />{{ tr('適應畫布') }}</button>
          <label class="studio-follow"><input type="checkbox" v-model="following" />{{ tr('游標跟隨') }}</label>
        </div>
        <p class="studio-hint">{{ tr(tool === 'pan' ? '拖曳平移；滾輪或按鈕縮放' : '移動游標，讓角色看向你。') }}</p>
      </section>
      <aside class="studio-inspector" :aria-label="tr('調整項目')">
        <header class="inspector-heading"><span class="inspector-eyebrow">MIREA / PLAYGROUND</span><div><h2>{{ tr('讓海月動起來') }}</h2><span class="inspector-live"><i></i>{{ tr(!playing ? '靜態預覽' : '即時預覽') }}</span></div><p>{{ tr('先試試互動，再微調你的角色。') }}</p></header>
        <div class="studio-tabs" role="tablist" :aria-label="tr('調整項目')">
          <button id="motion-tab" role="tab" :aria-selected="tab === 'motion'" aria-controls="motion-panel" :tabindex="tab === 'motion' ? 0 : -1" @click="switchTab('motion')" @keydown.left.prevent="switchTab('layers', true)" @keydown.right.prevent="switchTab('layers', true)">{{ tr('互動') }}</button>
          <button id="layers-tab" role="tab" :aria-selected="tab === 'layers'" aria-controls="layers-panel" :tabindex="tab === 'layers' ? 0 : -1" @click="switchTab('layers')" @keydown.right.prevent="switchTab('motion', true)" @keydown.left.prevent="switchTab('motion', true)">{{ tr('圖層') }}</button>
        </div>
        <div class="studio-inspector-scroll">
          <section class="inspector-card rig-inspection-card"><div class="inspector-section-title"><Icon name="grid" :size="18" /><h3>{{ tr('檢查顯示') }}</h3></div>
        <div class="rig-inspection-controls">
          <label><input type="checkbox" v-model="showSkeleton" />{{ tr('骨架') }}</label>
          <label><input type="checkbox" v-model="showMeshRegions" />Mesh</label>
          <label><input type="checkbox" v-model="showTriangles" />{{ tr('三角網格') }}</label>
          <output v-if="showTriangles && debugMesh">{{ debugMesh.positions.length/2 }} {{ tr('頂點') }} · {{ debugMesh.indices.length/3 }} {{ tr('三角形') }}</output>
        </div>
        <p v-if="showSkeleton" class="rig-inspection-note">{{ tr('骨段與關節依原圖標示；虛線為遮擋部位的推估。') }}</p>
        <p v-if="showMeshRegions" class="rig-inspection-note">{{ tr('彩色輪廓顯示部件範圍，選取的圖層會加亮。') }}</p>
        <p v-if="showTriangles" class="rig-inspection-note">{{ tr('三角網格跟隨角色目前的動態變形。') }}</p>
          </section>
          <div v-if="tab === 'layers'" id="layers-panel" role="tabpanel" aria-labelledby="layers-tab">
            <section class="inspector-card studio-layer-list">
              <div class="inspector-section-title"><Icon name="layers" :size="18" /><h3>{{ tr('圖層清單') }}</h3><output>{{ editableParts.length }} {{ tr('個圖層') }}</output></div>
              <p class="inspector-caption">{{ tr('選取圖層，調整局部動態。') }}</p>
              <div class="studio-layer-tree" :aria-label="tr('圖層清單')">
                <div v-for="group in layerGroups" :key="group.kind"><h4>{{ tr(group.title) }}</h4>
                  <button v-for="part in group.parts" :key="part.id" :aria-pressed="selectedPartId === part.id" @click="chooseLayer(part.id)"><span class="layer-swatch" :style="{ background: layerColor(part.id) }"></span><span>{{ tr(part.name ?? part.id) }}</span><Icon v-if="selectedPartId === part.id" name="check" :size="15" /></button>
                </div>
              </div>
            </section>
            <section v-if="selectedPart" class="inspector-card studio-layer-settings">
              <div class="inspector-section-title"><Icon name="sliders" :size="18" /><h3>{{ tr(selectedPart.name ?? selectedPart.id) }}</h3></div>
              <p class="inspector-caption">{{ tr('調整會即時套用到選取的圖層。') }}</p>
              <div v-for="field in partFields" :key="field.key" class="slider-field"><div><label :for="'layer-'+field.key">{{ tr(field.label) }}</label><output>{{ selectedPart[field.key].toFixed(3) }}</output></div><input :id="'layer-'+field.key" type="range" :min="field.min" :max="field.max" :step="field.step" :value="selectedPart[field.key]" :disabled="!player || reducedMotion" @input="updatePart(field.key,$event)" /></div>
            </section>
          </div>
          <div v-else id="motion-panel" role="tabpanel" aria-labelledby="motion-tab" class="inspector-interaction">
            <section v-if="model.face" class="inspector-card inspector-gaze"><div class="inspector-section-title"><Icon name="eye" :size="18" /><h3>{{ tr('眼神跟隨') }}</h3><output>{{ Math.round(gazeStrength*100) }}%</output></div><p class="inspector-caption">{{ tr('讓瞳孔看向游標，保持原畫的眼皮與嘴巴。') }}</p><label class="sr-only" for="gaze-strength">{{ tr('眼神強度') }}</label><input id="gaze-strength" type="range" min="0" max="1" step=".05" v-model.number="gazeStrength" :disabled="!player || reducedMotion" @input="updateGaze" /><div class="inspector-range-labels"><span>{{ tr('關閉') }}</span><span>{{ tr('完整跟隨') }}</span></div></section>
            <section class="inspector-card"><div class="inspector-section-title"><Icon name="wave" :size="18" /><h3>{{ tr('動態節奏') }}</h3></div><p class="inspector-caption">{{ tr('選一種節奏，移動游標感受海月的回應。') }}</p><div class="preset-buttons"><button v-for="item in [{id:'gentle',label:'輕柔'},{id:'default',label:'原始'},{id:'lively',label:'活潑'}]" :key="item.id" :aria-pressed="activePreset === item.id" @click="preset(item.id)">{{ tr(item.label) }}</button></div>
            <div v-for="slider in sliderDefs.filter(item => !['hair','accessories'].includes(item.key))" :key="slider.key" class="slider-field"><div><label :for="'motion-' + slider.key">{{ tr(slider.label) }}</label><output>{{ (settings[slider.key] ?? 1).toFixed(2) }}×</output></div><input :id="'motion-' + slider.key" type="range" :min="slider.min" :max="slider.max" step=".01" v-model.number="settings[slider.key]" @input="activePreset = 'custom'" :disabled="!player || reducedMotion" /><p>{{ tr(slider.hint) }}</p></div>
            </section>
            <details class="inspector-card inspector-disclosure"><summary>{{ tr('動畫曲線') }}<Icon name="caret-down" :size="16" /></summary><MotionControls :player="player" :model="model" :snapshot="snapshot" :reduced="reducedMotion" @play="playing = !reducedMotion" /></details>
          </div>
          <button class="inspector-reset" @click="resetModel"><Icon name="reset" :size="16" />{{ tr('還原海月預設') }}</button>
        </div>
        <footer class="studio-inspector-footer"><section class="inspector-card inspector-background"><div class="inspector-section-title"><Icon name="grid" :size="18" /><h3>{{ tr('預覽背景') }}</h3></div><div class="background-options"><button v-for="item in backgrounds" :key="item.value" :aria-pressed="bg === item.value" @click="bg = item.value"><span :class="'background-swatch swatch-' + item.value"><Icon v-if="bg === item.value" name="check" :size="16" /></span>{{ tr(item.label) }}</button></div></section><RouterLink to="/docs?section=eyes"><Icon name="book" :size="17" />{{ tr('眼神與製作指南') }}<Icon name="arrow-right" :size="16" /></RouterLink><span role="status" aria-live="polite">{{ tr(message) }}</span></footer>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.studio-inspector { padding: 24px 18px 0; background: #f6fafc; }
.inspector-heading { padding: 0 6px 18px; }
.inspector-eyebrow { color: #6c8a9c; font-size: 10px; letter-spacing: .14em; font-weight: 600; }
.inspector-heading > div { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; }
.inspector-heading h2 { margin: 0; font-size: 20px; letter-spacing: -.025em; font-weight: 600; }
.inspector-heading p { margin: 7px 0 0; color: #6c8595; font-size: 12px; line-height: 1.7; }
.inspector-live { display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; color: #318b83; font-size: 10px; }
.inspector-live i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.studio-tabs { margin: 0; padding: 4px; border: 1px solid #deebf0; border-radius: 11px; background: #eaf2f6; gap: 4px; }
.studio-tabs button { border: 0; min-height: 39px; border-radius: 8px; color: #6b8393; font-size: 13px; }
.studio-tabs button[aria-selected=true] { background: #fff; color: #176986; box-shadow: 0 2px 6px #153b5410; }
.studio-inspector-scroll { padding: 16px 2px; scrollbar-gutter: stable; }
.inspector-card { background: #fff; border: 1px solid #e0ebf1; border-radius: 12px; padding: 17px; margin: 0 0 12px; min-width: 0; }
.inspector-section-title { display: flex; align-items: center; gap: 8px; color: #3684a1; }
.inspector-section-title h3 { margin: 0; color: #244a5d; font-size: 13px; font-weight: 600; }
.inspector-section-title output { margin-left: auto; color: #277990; font-size: 12px; font-variant-numeric: tabular-nums; }
.inspector-caption { margin: 8px 0 13px; color: #718b9c; font-size: 11px; line-height: 1.8; }
.inspector-gaze > input { width: 100%; accent-color: #2c91b5; cursor: pointer; }
.inspector-range-labels { display: flex; justify-content: space-between; font-size: 10px; color: #8299a8; margin-top: 6px; }
.inspector-card .preset-buttons { display: flex; gap: 6px; margin: 14px 0 20px; }
.inspector-card .preset-buttons button { flex: 1; min-height: 35px; font-size: 12px; padding: 5px; border: 1px solid #e1ebf1; border-radius: 7px; color: #628096; background: #fafcfd; }
.inspector-card .preset-buttons button[aria-pressed=true] { color: #1b7394; border-color: #85c5dc; background: #eaf7fc; }
.inspector-card .slider-field { margin: 16px 0; }
.inspector-card .slider-field:last-child { margin-bottom: 0; }
.inspector-card .slider-field output { border: 0; background: #f2f7fa; padding: 3px 6px; }
.inspector-card .slider-field p { margin: 3px 0; color: #879ba9; font-size: 10px; }
.inspector-disclosure > summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; font-weight: 500; cursor: pointer; list-style: none; color: #35586b; }
.inspector-disclosure > summary::-webkit-details-marker { display: none; }
.inspector-disclosure > summary > span { display: flex; gap: 8px; align-items: center; }
.inspector-disclosure[open] > summary > svg { transform: rotate(180deg); }
.inspector-background { padding: 0 0 15px; margin: 0 0 13px; background: none; border: 0; border-bottom: 1px solid #e0ebf1; border-radius: 0; }
.background-options { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 6px; margin-top: 14px; }
.background-options button { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #8298a7; font-size: 10px; padding: 0; line-height: 1.6; }
.background-options button[aria-pressed=true] { color: #286f8a; }
.background-swatch { display: grid; place-items: center; width: 100%; height: 32px; border: 1px solid #e0eaf1; border-radius: 6px; }
.background-options button[aria-pressed=true] .background-swatch { outline: 2px solid #65b7d1; outline-offset: 2px; }
.swatch-paper { background: #f2fbff; }.swatch-lilac { background: #e0f4ff; }.swatch-dark { background: #123448; color: #fff; }
.inspector-reset { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 40px; width: 100%; font-size: 12px; color: #7b8f9c; }
.inspector-reset:hover { color: #216d8d; }
.studio-inspector-footer { padding: 13px 6px 16px; }
.studio-inspector-footer > a { display: flex; align-items: center; gap: 7px; color: #3183a0; font-size: 12px; }
.studio-inspector-footer > a > svg:last-child { margin-left: auto; }
@media (min-width: 761px) and (max-height: 800px) { .studio-inspector { padding-top: 16px; }.inspector-heading { padding-bottom: 12px; }.inspector-heading h2 { font-size: 18px; }.inspector-heading p { font-size: 11px; } }
@media (max-width: 760px) { .studio-tabs button { min-height: 44px; }.inspector-card .preset-buttons button { min-height: 44px; }.studio-inspector { padding: 24px 16px 0; }.inspector-heading { padding: 0 2px 18px; }.studio-inspector-scroll { padding-top: 16px; overflow: visible; }.studio-inspector-footer { padding-bottom: 24px; } }

.skeleton-overlay {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;filter:drop-shadow(0 1px 2px #071d2acc)}
.skeleton-overlay polygon {fill-opacity:.35;stroke-width:1;vector-effect:non-scaling-stroke}
.skeleton-overlay circle {fill:#123448;stroke-width:1.5;vector-effect:non-scaling-stroke}
.skeleton-overlay .joint-center {stroke:none}
.skeleton-overlay .inferred circle {stroke-dasharray:2 2}
.skeleton-overlay .inferred-span {fill:none;stroke-width:1.5;stroke-dasharray:4 4;vector-effect:non-scaling-stroke}
.rig-mesh-overlay {position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.rig-binding-overlay {position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.rig-binding-overlay polygon,.rig-binding-overlay polyline {stroke-width:1px;vector-effect:non-scaling-stroke;stroke-linejoin:round;fill-opacity:.12}
.rig-binding-overlay polygon.selected {fill-opacity:.28;stroke-width:2.5px;filter:drop-shadow(0 0 3px #ffffff80)}
.rig-binding-overlay polygon.muted {fill-opacity:.035;stroke-opacity:.35}
.studio-layer-tree {max-height:230px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#d4e7f0 transparent}
.studio-layer-tree h4 {margin:12px 6px 5px;font-size:11px;font-weight:500;color:#718b9c}
.studio-layer-tree h4:first-child {margin-top:0}
.studio-layer-tree button {width:100%;display:flex;align-items:center;gap:9px;min-height:38px;padding:8px;border-radius:7px;color:#57778c;text-align:left;font-size:12px}
.studio-layer-tree button[aria-pressed=true] {background:#e7f7fe;color:#008fbd}
.studio-layer-tree button:hover {background:#f3faff}
.studio-layer-tree button > svg {margin-left:auto;flex-shrink:0}
.layer-swatch {width:10px;height:10px;flex-shrink:0;border-radius:3px;border:1px solid #12344818}
@media (max-width:760px) {.studio-layer-tree button {min-height:44px}}
.rig-inspection-controls {display:flex;flex-wrap:wrap;align-items:center;gap:4px 15px;color:#486b7d;font-size:12px;padding:8px 0 0}
.rig-inspection-controls label {display:flex;align-items:center;gap:6px;min-height:44px;cursor:pointer}
.rig-inspection-controls input {accent-color:#23bad8}
.rig-inspection-controls output {font-variant-numeric:tabular-nums;color:#486b7d;flex-basis:100%}
.rig-inspection-note {color:#688393;font-size:11px;line-height:1.7;margin:8px 0 0}
</style>
