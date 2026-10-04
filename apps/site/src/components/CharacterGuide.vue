<script setup lang="ts">
import { useText } from '../i18n'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Framework } from '../docs/framework-examples'
import { guideMessages } from '../i18n/guide-copy'
import CodeBlock from './CodeBlock.vue'
import Icon from './Icon.vue'
withDefaults(defineProps<{ framework?: Framework }>(), { framework: 'vue' })
const { tr } = useText()
const g = (key: keyof typeof guideMessages) => tr(guideMessages[key][0])
const steps = ['prepare', 'create', 'bind', 'preview', 'integrate'] as const
const shortSteps = ['準備圖片', '建立模型', '綁定控制點', '預覽驗證', '載入專案']
const activeStep = ref('prepare')
let observer: IntersectionObserver | undefined
onMounted(() => {
  observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
    if (visible) activeStep.value = visible.target.id.replace('guide-', '')
  }, { rootMargin: '-100px 0px -55% 0px' })
  for (const step of steps) { const section = document.getElementById('guide-' + step); if (section) observer.observe(section) }
})
onBeforeUnmount(() => observer?.disconnect())
const prepareRows = [
  ['格式', 'PNG／WebP（建議透明背景）'], ['尺寸', '填入原圖實際像素，各為 1–8192'],
  ['起始建議', '約 1024 × 1536'], ['注意', '格式合法不代表綁定品質正確。'],
]
const starterSetup = `# 安裝套件後，在你的專案目錄執行
node --input-type=module -e "import { mkdirSync, cpSync } from 'node:fs'; mkdirSync('public/models/my-character', { recursive: true }); cpSync('node_modules/@yuragi/rig/assets/starter/model.json', 'public/models/my-character/model.json');"`
const fields: [string, keyof typeof guideMessages][] = [
  ['version / id / name', 'identity'], ['texture.src', 'source'], ['texture.width / height', 'size'],
  ['mesh.columns / rows', 'mesh'], ['pins[].name / type', 'pins'], ['pins[].parent', 'parent'],
  ['pins[].x / y / radius', 'pinPosition'], ['pins[].stiffness / damping / wind', 'spring'],
  ['hair[].id', 'hair'], ['hair[].points', 'hairPoints'], ['hair[].phase / radius / gain', 'hairSettings'],
  ['accessories[].id', 'accessories'], ['accessories[].root / tip', 'accessoryPoints'],
  ['accessories[].radius / angle', 'accessoryAngle'], ['accessories[].stiffness / damping / phase', 'accessorySettings'],
  ['faceClearance[]', 'clearance'], ['motion.sway / hair / accessories / follow / speed', 'motion'],
  ['pose.headCenter', 'headCenter'], ['pose.headBounds', 'headBounds'], ['pose.headHorizontal', 'headHorizontal'],
  ['pose.headWarpBounds', 'headWarpBounds'], ['pose.bodyBounds', 'bodyBounds'], ['pose.bodyPivot / swayPivot', 'pivots'],
]
const errors: [string, keyof typeof guideMessages][] = [
  ['Invalid rig model: … / SyntaxError', 'invalidModel'], ['Unable to load texture / Texture load timed out / AbortError', 'loadError'],
  ['Texture dimensions do not match the model', 'sizeError'], ['WebGL is unavailable', 'webglError'],
  ['Unknown pin / Invalid parameter / Pointer coordinates must be finite', 'parameterError'],
]
const directories = 'public/\n└── models/\n    └── my-character/\n        ├── texture.png\n        └── model.json'
const chainsCode = `import { validateModel } from '@yuragi/rig'
import { loadModel } from './load-model'

const model = await loadModel()
model.hair = [{
  id: 'pony-left', points: [[0.32, 0.2], [0.22, 0.35], [0.18, 0.5]],
  phase: 0, radius: 0.04, gain: 1,
}]
model.accessories = [{
  id: 'ribbon-right', root: [0.65, 0.4], tip: [0.7, 0.6],
  radius: 0.06, angle: 0.05, stiffness: 0.03, damping: 0.93, phase: 0,
}]
model.motion.hair = 0.5
model.motion.accessories = 0.5
validateModel(model)
console.log(JSON.stringify(model, null, 2))`
const loaderCode = `import { validateModel, type RigModel } from '@yuragi/rig'

export async function loadModel(signal?: AbortSignal): Promise<RigModel> {
  const response = await fetch('/models/my-character/model.json', { signal })
  if (!response.ok) throw new Error('Model HTTP ' + response.status)
  const value: unknown = await response.json()
  validateModel(value)
  return value
}`
const previewCode = `import { createPlayer } from '@yuragi/rig'
import { loadModel } from './load-model'

const canvas = document.querySelector<HTMLCanvasElement>('#character')!
const controller = new AbortController()
const fallback = document.querySelector<HTMLImageElement>('#fallback')!
window.addEventListener('pagehide', () => controller.abort(), { once: true })

try {
  const model = await loadModel(controller.signal)
  const player = await createPlayer({
    canvas, model, signal: controller.signal, autoplay: false,
    reducedMotion: 'respect',
    onError: error => { fallback.hidden = false; console.error(error) },
    onFrame: snapshot => console.log(snapshot.diagnostics.motionScale),
  })
  fallback.hidden = true
  player.play()
  player.setPointer(-0.5, 0)
} catch (error) {
  fallback.hidden = false
  if (!(error instanceof DOMException && error.name === 'AbortError')) console.error(error)
}`
const previewHtml = `<div style="position: relative; width: 320px; aspect-ratio: 2 / 3">
  <img id="fallback" src="/models/my-character/texture.png"
    alt="My character" style="width: 100%; height: 100%; object-fit: contain; position: relative; z-index: 1">
  <canvas id="character" aria-hidden="true"
    style="position: absolute; left: -12%; top: -12%; width: 124%; height: 124%"></canvas>
</div>`
const vueCode = `<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import { YuragiCharacter } from '@yuragi/rig/vue'
import type { RigModel } from '@yuragi/rig'
import { loadModel } from './load-model'

const model = shallowRef<RigModel>()
const error = ref('')
const controller = new AbortController()
onMounted(async () => {
  try { model.value = await loadModel(controller.signal) }
  catch (cause) { if (!controller.signal.aborted) error.value = String(cause) }
})
onBeforeUnmount(() => controller.abort())
<\/script>

<template>
  <div style="width: 320px">
    <YuragiCharacter v-if="model" :model="model" :alt="model.name"
      @error="cause => error = cause.message" />
    <img v-else src="/models/my-character/texture.png" alt="My character" style="width: 100%" />
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>`
const reactCode = `import { useEffect, useState } from 'react'
import { YuragiCharacter } from '@yuragi/rig/react'
import type { RigModel } from '@yuragi/rig'
import { loadModel } from './load-model'

export function Character() {
  const [model, setModel] = useState<RigModel>()
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    void loadModel(controller.signal).then(value => {
      if (!controller.signal.aborted) setModel(value)
    }).catch(cause => {
      if (!controller.signal.aborted) setError(String(cause))
    })
    return () => controller.abort()
  }, [])
  return <div style={{ width: 320 }}>
    {model ? <YuragiCharacter model={model} alt={model.name}
      onError={cause => setError(cause.message)} />
      : <img src="/models/my-character/texture.png" alt="My character" style={{ width: '100%' }} />}
    {error && <p role="alert">{error}</p>}
  </div>
}`
</script>
<template>
  <div class="character-guide">
    <p class="docs-lead">{{ g('workflow') }}</p>
    <div class="notice guide-boundary"><Icon name="warning" :size="21" /><div><strong>{{ g('boundary') }}</strong><p>{{ g('scope') }}</p></div></div>
    <nav class="guide-steps" :aria-label="tr('自製角色完整流程')"><a v-for="(step, index) in steps" :key="step" :href="'#guide-' + step" :aria-current="activeStep === step ? 'step' : undefined" @click="activeStep = step"><span>{{ index + 1 }}</span>{{ tr(shortSteps[index]) }}</a></nav>
    <section id="guide-prepare"><h2>{{ g('prepare') }}</h2><p>{{ g('artwork') }}</p><div class="guide-artwork-spec"><img src="/images/home/mirea-base-v1.png" :alt="tr('海月圖片準備範例')" width="1024" height="1536" /><div><h3>{{ tr('建議規格') }}</h3><table><tbody><tr v-for="[label, value] in prepareRows" :key="label"><th scope="row">{{ tr(label) }}</th><td>{{ tr(value) }}</td></tr></tbody></table></div></div><details class="guide-dimension-notes"><summary>{{ tr('圖片尺寸與裝置限制') }}</summary><p>{{ g('dimensions') }}</p></details></section>
    <section id="guide-create"><h2>{{ g('create') }}</h2><p>{{ g('starter') }}</p><RouterLink class="button primary" to="/docs?section=installation"><Icon name="book" :size="17" />{{ tr('查看套件安裝') }}</RouterLink><CodeBlock :code="starterSetup" :language="tr('終端機')" /><CodeBlock :code="directories" :language="tr('目錄結構')" /><p>{{ g('modelSetup') }}</p></section>
    <section id="guide-bind"><h2>{{ g('bind') }}</h2><p>{{ g('coordinates') }}</p>
      <div class="coordinate-example"><span>(0, 0)</span><span>X →</span><span>Y ↓</span><span>(0.5, 0.25)</span><span>(1, 1)</span></div>
      <p>{{ g('pinOrder') }}</p><p>{{ g('bindingHowTo') }}</p><h3>{{ g('semantics') }}</h3><div class="table-scroll"><table><thead><tr><th>{{ tr('控制點') }}</th><th>{{ tr('行為') }}</th></tr></thead><tbody><tr><td><code>waist / head-root / head-top</code></td><td>{{ g('namedHead') }}</td></tr><tr><td><code>shoulder-right / elbow-right / wrist-right</code></td><td>{{ g('namedWave') }}</td></tr></tbody></table></div><p>{{ g('pinBehavior') }}</p><p>{{ g('pinRadius') }}</p><p>{{ g('chains') }}</p><CodeBlock :code="chainsCode" filename="bindings.ts" /></section>
    <section id="guide-preview"><h2>{{ g('preview') }}</h2><div class="notice"><p>{{ g('playgroundLimit') }}</p></div><p>{{ g('previewChecks') }}</p><p>{{ g('meshChecks') }}</p><p>{{ g('previewLayout') }}</p><CodeBlock :code="previewHtml" filename="preview.html" /><CodeBlock :code="previewCode" filename="preview.ts" /></section>
    <section id="guide-integrate"><h2>{{ g('integrate') }}</h2><p>{{ g('loaderNotes') }}</p><CodeBlock :code="loaderCode" filename="load-model.ts" /><p>{{ g('lifecycleNotes') }}</p><h3>{{ framework === 'vue' ? 'Vue 3' : 'React' }}</h3><CodeBlock :code="framework === 'vue' ? vueCode : reactCode" :filename="framework === 'vue' ? 'Character.vue' : 'Character.tsx'" /></section>
    <section id="guide-schema"><h2>{{ g('schema') }}</h2><div class="table-scroll"><table><thead><tr><th>{{ tr('欄位') }}</th><th>{{ g('constraints') }}</th></tr></thead><tbody><tr v-for="[field, key] in fields" :key="field"><td><code>{{ field }}</code></td><td>{{ g(key) }}</td></tr></tbody></table></div></section>
    <section id="guide-errors"><h2>{{ g('errors') }}</h2><div class="table-scroll"><table><thead><tr><th>{{ tr('行為') }}</th><th>{{ tr('說明') }}</th></tr></thead><tbody><tr v-for="[error, key] in errors" :key="error"><td><code>{{ error }}</code></td><td>{{ g(key) }}</td></tr><tr><td>{{ g('bindingError') }}</td><td>{{ g('bindingFix') }}</td></tr></tbody></table></div></section>
  </div>
</template>
