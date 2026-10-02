<script setup lang="ts">
import { useText } from "../i18n"
const { tr } = useText()
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { createMomoModel, validateModel, type RigModel, type RigPlayer, type MotionSettings, type PinSpec, type RigSnapshot } from '@yuragi/rig'
import CharacterStage from '../components/CharacterStage.vue'
import Icon from '../components/Icon.vue'
import CodeBlock from '../components/CodeBlock.vue'
import MobileEditorNotice from '../components/MobileEditorNotice.vue'
import { clamp, imagePoint, movePin, zoomAtPoint, MIN_ZOOM, MAX_ZOOM, type Point } from '../editor/viewport'
const model = shallowRef(createMomoModel())
const player = shallowRef<RigPlayer>()
const snapshot = shallowRef<RigSnapshot>()
const settings = ref<MotionSettings>({ ...model.value.motion })
const selectedName = ref('head-root')
const editablePins = ref<PinSpec[]>(structuredClone(model.value.pins))
const selected = computed(() => editablePins.value.find(p => p.name === selectedName.value)!)
const route = useRoute()
const tab = ref<'motion' | 'bones'>(route.query.tab === 'motion' ? 'motion' : 'bones')
const showBones = ref(route.query.tab !== 'motion')
const showGrid = ref(false)
const playing = ref(true)
const following = ref(true)
const bg = ref('paper')
const codeOpen = ref(false)
const message = ref('')
const pastedJSON = ref('')
const reducedMotion = ref(false)
const changingModel = ref(false)
const artwork = ref<HTMLElement>()
const zoom = ref(1)
const pan = ref<Point>({ x: 0, y: 0 })
const tool = ref<'pins' | 'pan'>('pins')
const dragging = ref(false)
const viewStyle = computed(() => ({ transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})` }))
let gesture: { id: number; target: HTMLElement; name?: string; start: Point; pan: Point; resume: boolean } | undefined
let pendingPin: { name: string; point: Point } | undefined
let dragFrame = 0
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
function applyPin(name: string, point: Point) {
  const pin = editablePins.value.find(pin => pin.name === name)
  if (!pin || !player.value) return
  try { player.value.setPin(name, point); Object.assign(pin, point); message.value = '' }
  catch (error) { message.value = String(error) }
}
function flushPin() {
  dragFrame = 0
  if (pendingPin) { const patch = pendingPin; pendingPin = undefined; applyPin(patch.name, patch.point) }
}
function startGesture(event: PointerEvent, name?: string) {
  if (gesture || event.button !== 0 || name && !player.value) return
  if (!name && tool.value !== 'pan') return
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  const resume = playing.value && !reducedMotion.value
  if (name) {
    target.focus({ preventScroll: true })
    choosePin(name); player.value?.pause(); playing.value = false
    player.value?.reset()
  }
  gesture = { id: event.pointerId, target, name, start: { x: event.clientX, y: event.clientY }, pan: { ...pan.value }, resume }
  dragging.value = true
  target.setPointerCapture(event.pointerId)
}
function moveGesture(event: PointerEvent) {
  if (!gesture || gesture.id !== event.pointerId) return
  if (gesture.name && artwork.value) {
    const point = imagePoint({ x: event.clientX, y: event.clientY }, artwork.value.getBoundingClientRect())
    if (!point) return
    pendingPin = { name: gesture.name, point }
    if (!dragFrame) dragFrame = requestAnimationFrame(flushPin)
  } else {
    pan.value = { x: clamp(gesture.pan.x + event.clientX - gesture.start.x, -1800, 1800), y: clamp(gesture.pan.y + event.clientY - gesture.start.y, -1800, 1800) }
  }
}
function finishGesture(event?: PointerEvent) {
  if (!gesture || event && event.pointerId !== gesture.id) return
  const previous = gesture; gesture = undefined; dragging.value = false
  cancelAnimationFrame(dragFrame); flushPin()
  if (previous.target.hasPointerCapture(previous.id)) previous.target.releasePointerCapture(previous.id)
  if (previous.name && previous.resume && !reducedMotion.value) { player.value?.play(); playing.value = !!player.value?.getSnapshot().playing }
}
function keyboardPin(event: KeyboardEvent, name: string) {
  const pin = editablePins.value.find(pin => pin.name === name)
  if (!pin) return
  const point = movePin(pin, event.key, event.shiftKey)
  if (!point) return
  event.preventDefault(); choosePin(name); applyPin(name, point)
}
const labels: Record<string, string> = {
  waist: '腰部', 'head-root': '頭部根點', 'head-top': '頭頂',
  'ear-left': '左耳', 'ear-right': '右耳',
  'shoulder-left': '左肩', 'elbow-left': '左手肘', 'wrist-left': '左手腕',
  'shoulder-right': '右肩', 'elbow-right': '右手肘', 'wrist-right': '右手腕',
  'bow-center': '蝴蝶結', 'bell-center': '鈴鐺', 'ribbon-left': '左緞帶', 'ribbon-right': '右緞帶',
  'pom-left': '左毛球', 'pom-right': '右毛球',
  'hip-raised': '抬腿髖部', 'knee-raised': '抬腿膝蓋', 'ankle-raised': '抬腿腳踝',
  'hip-standing': '站立髖部', 'knee-standing': '站立膝蓋', 'ankle-standing': '站立腳踝',
}
const pinLabel = (name: string) => {
  if (labels[name]) return tr(labels[name])
  const match = /^hair-(left|right)-(root|mid|tip|inner|inner-tip)$/.exec(name)
  if (!match) return name
  const part: Record<string, string> = { root: '髮根', mid: '髮中', tip: '髮梢', inner: '內側', 'inner-tip': '內側髮梢' }
  return tr(match[1] === 'left' ? '左髮・' : '右髮・') + tr(part[match[2]])
}
const groups = computed(() => [
  { title: '頭部與視線', pins: editablePins.value.filter(p => p.name.startsWith('head') || p.name.startsWith('ear')) },
  { title: '頭髮', pins: editablePins.value.filter(p => p.name.startsWith('hair')) },
  { title: '身體與四肢', pins: editablePins.value.filter(p => /waist|shoulder|elbow|wrist|hip|knee|ankle/.test(p.name)) },
  { title: '配件', pins: editablePins.value.filter(p => /^(bow|bell|ribbon|pom)-/.test(p.name)) },
].filter(group => group.pins.length))
const sliderDefs: { key: keyof MotionSettings; label: string; hint: string; min: number; max: number }[] = [
  { key: 'sway', label: '待機搖擺', hint: '身體的擺幅與輕微浮動', min: 0, max: 2 },
  { key: 'speed', label: '搖擺速度', hint: '慢一點，更像在呼吸', min: .25, max: 2 },
  { key: 'hair', label: '頭髮跟隨', hint: '髮梢延遲跟上的程度', min: 0, max: 2 },
  { key: 'accessories', label: '配件彈性', hint: '耳朵、鈴鐺與緞帶的動態', min: 0, max: 2 },
  { key: 'follow', label: '游標影響', hint: '游標帶動視線與姿態的強度', min: 0, max: 2 },
]
watch(settings, value => { if (!changingModel.value) player.value?.setMotion(value) }, { deep: true })
function ready(next: RigPlayer) {
  player.value = next; next.setMotion(settings.value)
  if (!playing.value) next.pause()
  changingModel.value = false; snapshot.value = next.getSnapshot()
}
function choosePin(name: string) { selectedName.value = name; tab.value = 'bones'; showBones.value = true }
function updatePin(key: 'x' | 'y' | 'radius' | 'stiffness' | 'damping', event: Event) {
  const input = event.target as HTMLInputElement
  if (input.value === '' || !input.validity.valid) return
  const value = input.valueAsNumber
  if (!player.value) return
  try { player.value.setPin(selectedName.value, { [key]: value }); Object.assign(selected.value, { [key]: value }); message.value = '' }
  catch (error) { message.value = String(error); (event.target as HTMLInputElement).value = String(selected.value[key] ?? 0) }
}
async function switchTab(next: 'bones' | 'motion', focus = false) {
  tab.value = next
  if (focus) { await nextTick(); document.getElementById(next + '-tab')?.focus() }
}
function togglePlay() {
  if (playing.value) { player.value?.pause(); playing.value = false }
  else { player.value?.play(); playing.value = !!player.value?.getSnapshot().playing }
}
function preset(name: string) {
  settings.value = name === 'gentle' ? { sway: .55, speed: .6, hair: .7, accessories: .65, follow: .7 }
    : name === 'lively' ? { sway: 1.5, speed: 1.4, hair: 1.5, accessories: 1.4, follow: 1.2 }
    : { sway: 1, speed: 1, hair: 1, accessories: 1, follow: 1 }
}
function replaceModel(next: RigModel) {
  finishGesture(); resetView()
  changingModel.value = true; player.value = undefined
  model.value = next; settings.value = { ...next.motion }
  editablePins.value = structuredClone(next.pins); selectedName.value = next.pins.find(p => p.name === 'head-root')?.name || next.pins[0].name
}
function resetModel() { replaceModel(createMomoModel()); message.value = '已還原 Momo 的預設骨架與動態。' }
function importText() {
  try {
    const value: unknown = JSON.parse(pastedJSON.value)
    validateModel(value)
    if (value.texture.width !== 1024 || value.texture.height !== 1536) throw new Error(tr('此遊樂場使用 Momo 的 1024 × 1536 素材。'))
    value.texture.src = '/models/momo/texture.webp'
    replaceModel(value); message.value = '已載入模型設定。'
  } catch (error) { message.value = tr('無法載入：') + (error instanceof Error ? error.message : String(error)) }
}
async function importModel(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error(tr('模型檔案不能超過 2 MB。'))
    const value: unknown = JSON.parse(await file.text())
    validateModel(value)
    // This playground edits Momo; importing a config reuses the local Momo asset.
    if (value.texture.width !== 1024 || value.texture.height !== 1536) throw new Error(tr('此遊樂場使用 Momo 的 1024 × 1536 素材。'))
    value.texture.src = '/models/momo/texture.webp'
    replaceModel(value); message.value = '已載入模型設定。'
  } catch (error) { message.value = tr('無法載入：') + (error instanceof Error ? error.message : String(error)) }
  input.value = ''
}
const code = computed(() => `import { createMomoModel } from '@yuragi/rig'
import { YuragiCharacter } from '@yuragi/rig/vue'

const momo = createMomoModel('/models/momo/texture.webp')
momo.motion = ${JSON.stringify(settings.value, null, 2)}

// 在 @ready 取得 player 後可繼續調整
// 模型資產隨套件提供；網站不提供 JSON 下載。`)
const parentLines = computed(() => editablePins.value.flatMap(p => {
  const parent = editablePins.value.find(q => q.name === p.parent)
  return parent ? [{ name: p.name, x1: parent.x * 100, y1: parent.y * 100, x2: p.x * 100, y2: p.y * 100 }] : []
}))
const animatedPins = computed(() => snapshot.value?.pins || [])
const parentAnimated = computed(() => animatedPins.value.flatMap(p => {
  const parent = animatedPins.value.find(q => q.name === p.parent)
  return parent ? [{ name: p.name, x1: parent.x * 100, y1: parent.y * 100, x2: p.x * 100, y2: p.y * 100 }] : []
}))
let media: MediaQueryList
const mediaChange = () => { reducedMotion.value = media.matches; playing.value = !media.matches }
onMounted(() => { media = matchMedia('(prefers-reduced-motion: reduce)'); mediaChange(); media.addEventListener('change', mediaChange) })
onBeforeUnmount(() => { cancelAnimationFrame(dragFrame); pendingPin = undefined; gesture = undefined; media?.removeEventListener('change', mediaChange) })
</script>
<template>
  <div class="studio-page">
    <MobileEditorNotice />
    <h1 class="sr-only">{{ tr('遊樂場') }}</h1>
    <p v-if="reducedMotion" class="studio-reduced">{{ tr('系統已啟用減少動態，目前顯示靜態原畫。你仍可編輯控制點。') }}</p>
    <div class="studio-workspace">
      <section class="studio-canvas-panel" :aria-label="tr('Momo 即時預覽')">
        <div class="studio-model"><img src="/models/momo/texture.webp" alt="" /><div><strong>{{ tr('月兔 Momo') }}</strong><span>1024 × 1536 · WebP</span></div></div>
        <div class="studio-tools" :aria-label="tr('畫布工具')">
          <button :aria-label="tr('編輯圖釘')" :title="tr('編輯圖釘')" :aria-pressed="tool === 'pins' && showBones" :class="{ active: tool === 'pins' && showBones }" @click="tool = 'pins'; showBones = true; tab = 'bones'"><Icon name="pointer" :size="22" /></button>
          <button :aria-label="tr('平移畫布')" :title="tr('平移畫布')" :aria-pressed="tool === 'pan'" :class="{ active: tool === 'pan' }" @click="tool = 'pan'"><Icon name="move" :size="22" /></button>
          <button :aria-label="tr('格線')" :title="tr('格線')" :aria-pressed="showGrid" @click="showGrid = !showGrid"><Icon name="grid" :size="22" /></button>
          <button :aria-label="tr('骨架')" :title="tr('骨架')" :aria-pressed="showBones" @click="showBones = !showBones"><Icon name="bones" :size="22" /></button>
          <button :aria-label="tr('重設視圖')" :title="tr('重設視圖')" @click="resetView"><Icon name="fit" :size="22" /></button>
        </div>
        <div class="preview-canvas studio-canvas" :class="['bg-' + bg, { 'with-grid': showGrid, 'pan-tool': tool === 'pan', 'is-dragging': dragging, 'pin-editing': showBones }]" @wheel.prevent="zoomWheel" @pointerdown="startGesture($event)" @pointermove="moveGesture" @pointerup="finishGesture" @pointercancel="finishGesture" @lostpointercapture="finishGesture">
          <div ref="artwork" class="preview-art studio-art" :style="viewStyle">
            <CharacterStage :model="model" :follow="following && !showBones && tool !== 'pan'" :interactive="!showBones && tool !== 'pan'" :autoplay="playing" @ready="ready" @frame="value => snapshot = value" @error="error => message = error.message" />
            <svg v-if="showBones" class="bone-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line v-for="line in parentAnimated" :key="line.name" v-bind="line" /><line v-for="line in parentLines" :key="'rest-' + line.name" v-bind="line" class="rest-line" /></svg>
            <div v-if="showBones" class="bone-points"><button v-for="pin in editablePins" :key="pin.name" :style="{ left: pin.x * 100 + '%', top: pin.y * 100 + '%', '--pin-size': 1 / zoom }" :class="{ selected: selectedName === pin.name }" :aria-label="tr('選取控制點：') + pinLabel(pin.name)" :title="pinLabel(pin.name)" :disabled="!player" @pointerdown.stop="startGesture($event, tool === 'pins' ? pin.name : undefined)" @keydown="keyboardPin($event, pin.name)" @click="choosePin(pin.name)"></button></div>
          </div>
        </div>
        <div class="studio-transport">
          <button class="studio-play" @click="togglePlay" :disabled="reducedMotion || !player" :aria-label="tr(playing ? '暫停動畫' : '播放動畫')"><Icon :name="playing ? 'pause' : 'play'" :size="19" /><span>{{ tr(playing ? '暫停' : '播放') }}</span></button>
          <button @click="player?.wave(); playing = !reducedMotion" :disabled="reducedMotion || !player"><Icon name="hand" :size="19" />{{ tr('揮手') }}</button>
          <div class="studio-zoom"><button :aria-label="tr('縮小畫布')" :disabled="zoom <= MIN_ZOOM" @click="changeZoom(zoom / 1.2)"><Icon name="minus" :size="17" /></button><output :aria-label="tr('畫布縮放比例')">{{ Math.round(zoom * 100) }}%</output><button :aria-label="tr('放大畫布')" :disabled="zoom >= MAX_ZOOM" @click="changeZoom(zoom * 1.2)"><Icon name="plus" :size="17" /></button></div>
          <button class="studio-fit" @click="resetView"><Icon name="fit" :size="18" />{{ tr('適應畫布') }}</button>
          <label class="studio-follow"><input type="checkbox" v-model="following" />{{ tr('游標跟隨') }}</label>
        </div>
        <p class="studio-hint">{{ tr(tool === 'pan' ? '拖曳平移；滾輪或按鈕縮放' : showBones ? '拖曳圖釘；方向鍵微調，Shift 加大步幅' : '移動游標，讓 Momo 看向你。') }}</p>
      </section>
      <aside class="studio-inspector" :aria-label="tr('調整項目')">
        <label class="sr-only" for="selected-pin">{{ tr('選取控制點') }}</label>
        <select id="selected-pin" class="studio-pin-select" :value="selectedName" @change="choosePin(($event.target as HTMLSelectElement).value)"><optgroup v-for="group in groups" :key="group.title" :label="tr(group.title)"><option v-for="pin in group.pins" :key="pin.name" :value="pin.name">{{ pinLabel(pin.name) }}</option></optgroup></select>
        <div class="studio-tabs" role="tablist" :aria-label="tr('調整項目')">
          <button id="bones-tab" role="tab" :aria-selected="tab === 'bones'" aria-controls="bones-panel" :tabindex="tab === 'bones' ? 0 : -1" @click="switchTab('bones')" @keydown.right.prevent="switchTab('motion', true)" @keydown.left.prevent="switchTab('motion', true)">{{ tr('控制點') }}</button>
          <button id="motion-tab" role="tab" :aria-selected="tab === 'motion'" aria-controls="motion-panel" :tabindex="tab === 'motion' ? 0 : -1" @click="switchTab('motion')" @keydown.left.prevent="switchTab('bones', true)" @keydown.right.prevent="switchTab('bones', true)">{{ tr('動態設定') }}</button>
        </div>
        <div class="studio-inspector-scroll">
          <div v-if="tab === 'bones'" id="bones-panel" role="tabpanel" aria-labelledby="bones-tab" class="studio-pin-fields">
            <div class="studio-pin-description"><span>{{ selected.name }}</span><small>{{ tr({ fixed: '固定控制點', joint: '關節控制點', spring: '彈性控制點' }[selected.type]) }}</small></div>
            <h2>{{ tr('位置') }}</h2>
            <div class="studio-coordinates"><label v-for="field in ['x', 'y'] as const" :key="field" :for="'pin-' + field"><span>{{ field.toUpperCase() }}</span><input :id="'pin-' + field" type="number" min="0" max="1" step=".001" :disabled="!player" :value="selected[field].toFixed(3)" :aria-label="tr(field === 'x' ? '水平位置 X' : '垂直位置 Y')" @input="updatePin(field, $event)" /></label></div>
            <div class="slider-field"><div><label for="pin-radius">{{ tr('影響範圍') }}</label><output>{{ selected.radius.toFixed(3) }}</output></div><input id="pin-radius" type="range" min=".005" max=".5" step=".005" :disabled="!player" :value="selected.radius" @input="updatePin('radius', $event)" /></div>
            <template v-if="selected.type === 'spring'"><div class="slider-field"><div><label for="pin-stiffness">{{ tr('彈簧剛性') }}</label><output>{{ (selected.stiffness || 0).toFixed(3) }}</output></div><input id="pin-stiffness" type="range" min="0" max="1" step=".001" :disabled="!player" :value="selected.stiffness" @input="updatePin('stiffness', $event)" /></div><div class="slider-field"><div><label for="pin-damping">{{ tr('動量保留') }}</label><output>{{ (selected.damping || 0).toFixed(3) }}</output></div><input id="pin-damping" type="range" min="0" max="1" step=".005" :disabled="!player" :value="selected.damping" @input="updatePin('damping', $event)" /></div></template>
            <p class="studio-coordinate-note"><Icon name="warning" :size="17" />{{ tr('以原圖 0–1 座標表示；縮放畫布不改變模型座標。') }}</p>
          </div>
          <div v-else id="motion-panel" role="tabpanel" aria-labelledby="motion-tab">
            <h2 class="studio-motion-title">{{ tr('調出 Momo 的節奏。') }}</h2><div class="preset-buttons"><button @click="preset('gentle')">{{ tr('輕柔') }}</button><button @click="preset('default')">{{ tr('原始') }}</button><button @click="preset('lively')">{{ tr('活潑') }}</button></div>
            <div v-for="slider in sliderDefs" :key="slider.key" class="slider-field"><div><label :for="'motion-' + slider.key">{{ tr(slider.label) }}</label><output>{{ settings[slider.key].toFixed(2) }}×</output></div><input :id="'motion-' + slider.key" type="range" :min="slider.min" :max="slider.max" step=".05" v-model.number="settings[slider.key]" /><p>{{ tr(slider.hint) }}</p></div>
          </div>
          <details class="studio-pin-list" open><summary><Icon name="pin" :size="18" />{{ tr('圖釘清單') }}<Icon name="caret-down" :size="15" /></summary><div class="studio-pin-tree"><div v-for="group in groups" :key="group.title"><h3>{{ tr(group.title) }}</h3><button v-for="pin in group.pins" :key="pin.name" :aria-pressed="selectedName === pin.name" @click="choosePin(pin.name)"><Icon name="pin" :size="13" /><span>{{ pinLabel(pin.name) }}</span></button></div></div></details>
          <div class="studio-background"><span>{{ tr('預覽背景') }}</span><select v-model="bg" :aria-label="tr('預覽背景')"><option value="paper">{{ tr('紙白背景') }}</option><option value="lilac">{{ tr('淺藍背景') }}</option><option value="dark">{{ tr('深色背景') }}</option></select></div>
          <label class="studio-import"><Icon name="code" :size="16" />{{ tr('匯入模型 JSON') }}<input type="file" accept=".json,application/json" @change="importModel" /></label>
          <details class="studio-paste"><summary>{{ tr('貼上模型 JSON') }}</summary><label for="pasted-model" class="sr-only">{{ tr('模型內容') }}</label><textarea id="pasted-model" v-model="pastedJSON" rows="5" spellcheck="false"></textarea><button @click="importText">{{ tr('載入貼上的模型') }}</button></details>
          <button class="studio-secondary" @click="resetModel"><Icon name="reset" :size="16" />{{ tr('還原預設') }}</button>
          <button class="studio-secondary" @click="codeOpen = !codeOpen"><Icon name="code" :size="16" />{{ tr(codeOpen ? '收起使用範例' : '查看 Vue 使用範例') }}</button>
          <CodeBlock v-if="codeOpen" :code="code" filename="Character.vue" />
        </div>
        <div class="studio-inspector-footer"><RouterLink class="button primary" to="/docs?section=installation"><Icon name="book" :size="17" />{{ tr('查看套件安裝') }}</RouterLink><p>{{ tr('模型隨套件提供，網站不提供 JSON 下載。') }}</p><span role="status" aria-live="polite">{{ tr(message) }}</span></div>
      </aside>
    </div>
  </div>
</template>
