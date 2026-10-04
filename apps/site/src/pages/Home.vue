<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'
import { type RigPlayer } from '@yuragi/rig'
import { useText } from '../i18n'
import CharacterStage from '../components/CharacterStage.vue'
import HomeRigPreview from '../components/HomeRigPreview.vue'
import { createMireaDemoModel } from '../models/mirea'
import HomeHeroCharacter from '../components/HomeHeroCharacter.vue'
import Icon from '../components/Icon.vue'
import CodeBlock from '../components/CodeBlock.vue'
const { tr } = useText()
const model = createMireaDemoModel()
const hero = ref<InstanceType<typeof HomeHeroCharacter>>()
const player = shallowRef<RigPlayer>()
const failed = ref(false)
const active = ref<'idle' | 'follow' | 'gaze'>('idle')
const framework = ref<'vue' | 'react'>('vue')
const modes = [{ id: 'idle', icon: 'wave', label: '待機搖擺' }, { id: 'follow', icon: 'pointer', label: '游標跟隨' }, { id: 'gaze', icon: 'eye', label: '眼神跟隨' }] as const
const steps = [
  ['準備圖片', '準備角色原畫素材。'], ['建立模型', '依圖片尺寸建立模型設定。'],
  ['綁定控制點', '拖曳圖釘並調整參數。'], ['預覽驗證', '在本機預覽動態效果。'],
  ['載入網頁', '於 Vue、React 或原生 JavaScript 專案中使用。'],
]
const details = [
  { crop: 'portrait', title: '髮絲與輪廓', body: '保留原畫的筆觸，再依髮束配置控制點。' },
  { crop: 'umbrella', title: '透明配件', body: '傘與飄帶各有結構，需另外設定動作綁定。' },
  { crop: 'dress', title: '服裝層次', body: '分別調整裙襬與飾品，讓細節跟上角色動作。' },
]
function choose(mode: typeof active.value) {
  active.value = mode
  player.value?.setPointer(0, 0)
  player.value?.setGazeStrength(mode === 'gaze' ? 1 : 0)
}
const quickstart = computed(() => framework.value === 'vue' ? [
  '<!-- YourCharacter.vue -->', '<script setup lang="ts">',
  "import { shallowRef } from 'vue'",
  "import { type RigPlayer } from '@yuragi/rig'",
  "import { createMireaModel } from '@yuragi/rig/mirea'",
  "import { YuragiCharacter } from '@yuragi/rig/vue'", '',
  "const model = createMireaModel('/models/mirea/texture.png')",
  'const player = shallowRef<RigPlayer>()',
  'function follow(event: PointerEvent) {',
  '  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()',
  '  player.value?.setPointer(',
  '    (event.clientX - box.left) / box.width - 0.5,',
  '    (event.clientY - box.top) / box.height - 0.5,',
  '  )', '}',
  'function reset() { player.value?.setPointer(0, 0) }',
  '<' + '/script>', '', '<template>',
  '  <div style="width: 320px; max-width: 100%"',
  '    @pointermove="follow" @pointerleave="reset" @pointercancel="reset"',
  '    @pointerup="event => { if (event.pointerType === \'touch\') reset() }">',
  '    <YuragiCharacter :model="model" reduced-motion="respect"',
  '      @ready="player = $event" @error="player = undefined" />',
  '  </div>', '</template>',
].join('\n') : [
  "'use client'", '// YourCharacter.tsx',
  "import { useRef, useState, type PointerEvent } from 'react'",
  "import { createMireaModel } from '@yuragi/rig/mirea'",
  "import { YuragiCharacter, type YuragiCharacterHandle } from '@yuragi/rig/react'", '',
  'export function YourCharacter() {',
  "  const [model] = useState(() => createMireaModel('/models/mirea/texture.png'))",
  '  const character = useRef<YuragiCharacterHandle>(null)',
  '  function reset() { character.current?.getPlayer()?.setPointer(0, 0) }',
  '  function follow(event: PointerEvent<HTMLDivElement>) {',
  '    const box = event.currentTarget.getBoundingClientRect()',
  '    character.current?.getPlayer()?.setPointer(',
  '      (event.clientX - box.left) / box.width - 0.5,',
  '      (event.clientY - box.top) / box.height - 0.5,',
  '    )', '  }',
  '  return <div style={{ width: 320, maxWidth: \'100%\' }}',
  '    onPointerMove={follow} onPointerLeave={reset} onPointerCancel={reset}',
  '    onPointerUp={event => { if (event.pointerType === \'touch\') reset() }}>',
  '    <YuragiCharacter ref={character} model={model} reducedMotion="respect" />',
  '  </div>', '}',
].join('\n'))
</script>
<template>
  <div class="stage-home">
    <section class="stage-hero" aria-labelledby="home-title" @pointermove="hero?.move($event)" @pointerdown="hero?.move($event)" @pointerleave="hero?.resetPointer()" @pointercancel="hero?.resetPointer()" @pointerup="($event.pointerType === 'touch') && hero?.resetPointer()">
      <div class="stage-container stage-hero-layout">
        <div class="stage-sparkles" aria-hidden="true"><span class="stage-sparkle sparkle-one">✦</span><span class="stage-sparkle sparkle-two">✧</span><span class="stage-sparkle sparkle-three">✦</span><span class="stage-sparkle sparkle-four">♡</span></div>
        <div class="stage-hero-copy">
          <p class="stage-eyebrow"><span aria-hidden="true"></span>{{ tr('2D 插畫動態函式庫') }}</p>
          <h1 id="home-title">{{ tr('讓插畫角色，') }}<br>{{ ' ' }}{{ tr('成為網頁互動的一部分。') }}</h1>
          <p class="stage-intro"><span>{{ tr('Yuragi 以控制點帶動原畫，加入待機搖擺、') }}</span>{{ ' ' }}<span>{{ tr('姿態與眼神跟隨。支援 Vue、React 與原生 JavaScript。') }}</span></p>
          <div class="stage-actions">
            <a class="stage-button stage-button-white" href="#mirea-demo"><Icon name="play" :size="22" />{{ tr('體驗海月') }}</a>
            <RouterLink class="stage-button stage-button-glass" to="/docs"><Icon name="book" :size="21" />{{ tr('閱讀文件') }}</RouterLink>
          </div>
        </div>
        <figure class="stage-hero-art"><HomeHeroCharacter ref="hero" /><figcaption class="stage-hero-hint">{{ tr('移動游標，與海月互動。') }}</figcaption></figure>
      </div>
    </section>
    <section id="mirea-demo" class="stage-demo" aria-labelledby="demo-title">
      <div class="stage-container stage-two-columns">
        <div class="stage-section-copy"><span class="stage-accent" aria-hidden="true"></span><h2 id="demo-title">{{ tr('先看看，') }}<br>{{ tr('角色怎麼回應你。') }}</h2><p>{{ tr('切換搖擺、姿態與眼神跟隨，感受原畫的動態。') }}</p></div>
        <div class="stage-demo-preview">
          <div class="stage-demo-art"><CharacterStage :model="model" :follow="active !== 'idle'" @ready="next => { player = next; next.setGazeStrength(active === 'gaze' ? 1 : 0); failed = false }" @error="failed = true" /><span class="stage-demo-label">{{ tr('海月互動範例') }}</span></div>
          <div class="stage-motion-controls" :aria-label="tr('體驗海月動態')"><button v-for="mode in modes" :key="mode.id" :class="{ selected: active === mode.id }" :aria-pressed="active === mode.id" :disabled="!player || failed" @click="choose(mode.id)"><Icon :name="mode.icon" :size="23" />{{ tr(mode.label) }}</button></div>
        </div>
      </div>
    </section>
    <section class="stage-editor" aria-labelledby="editor-title">
      <div class="stage-container stage-two-columns stage-editor-layout">
        <HomeRigPreview />
        <div class="stage-section-copy"><span class="stage-accent" aria-hidden="true"></span><h2 id="editor-title">{{ tr('每個動作，') }}<br>{{ tr('都有可調整的控制點。') }}</h2><p>{{ tr('拖曳圖釘、調整影響範圍，放大檢查角色的動態。') }}</p><RouterLink class="stage-text-link" to="/playground?tab=bones">{{ tr('打開完整圖釘編輯器') }}<Icon name="arrow-right" /></RouterLink></div>
      </div>
    </section>
    <section class="stage-details" aria-labelledby="details-title">
      <div class="stage-container stage-details-layout">
        <div class="stage-section-copy"><span class="stage-accent" aria-hidden="true"></span><h2 id="details-title">{{ tr('讓你的角色，') }}<br>{{ tr('保留自己的細節。') }}</h2><p>{{ tr('以原畫素材建立模型，再依角色結構綁定動作。') }}</p><p class="stage-small-note">{{ tr('素材展示；動態需另行綁定。') }}</p></div>
        <div class="stage-detail-cards"><article v-for="detail in details" :key="detail.crop"><div class="stage-detail-image" :class="detail.crop"><img src="/images/home/mirea-base-v1.png" alt="" width="1024" height="1536" loading="lazy"></div><h3>{{ tr(detail.title) }}</h3><p>{{ tr(detail.body) }}</p></article></div>
      </div>
    </section>
    <section class="stage-integration" aria-labelledby="integration-title">
      <div class="stage-container stage-two-columns stage-integration-layout">
        <div class="stage-section-copy"><span class="stage-accent" aria-hidden="true"></span><h2 id="integration-title">{{ tr('從角色素材，') }}<br>{{ tr('到 Vue 或 React 專案。') }}</h2><ol class="stage-workflow"><li v-for="(step, index) in steps" :key="step[0]"><span class="stage-step-number">{{ String(index + 1).padStart(2, '0') }}</span><h3>{{ tr(step[0]) }}</h3><p>{{ tr(step[1]) }}</p></li></ol></div>
        <div class="stage-code-preview">
          <div class="stage-framework-tabs" :aria-label="tr('選擇框架')">
            <button :aria-pressed="framework === 'vue'" :class="{ selected: framework === 'vue' }" @click="framework = 'vue'"><img class="stage-framework-logo" src="/images/home/vue-logo.svg" alt="" width="32" height="32">Vue</button>
            <button :aria-pressed="framework === 'react'" :class="{ selected: framework === 'react' }" @click="framework = 'react'"><img class="stage-framework-logo" src="/images/home/react-logo.svg" alt="" width="36" height="32">React</button>
          </div>
          <CodeBlock :code="quickstart" :filename="framework === 'vue' ? 'YourCharacter.vue · TypeScript' : 'YourCharacter.tsx · TypeScript'" />
          <div class="stage-integration-actions">
            <RouterLink class="stage-button stage-button-outline" :to="`/docs?section=custom-character&framework=${framework}`">{{ tr('查看完整流程') }}<Icon name="arrow-right" /></RouterLink>
            <RouterLink class="stage-text-link" to="/docs?section=skills">{{ tr('讓 AI 把角色變成動態') }}<Icon name="arrow-right" /></RouterLink>
          </div>
          <p class="stage-code-note"><Icon name="warning" :size="21" />{{ tr('新圖片仍需建立模型與動作綁定；不是自動套用任意圖片。') }}</p>
        </div>
      </div>
    </section>
    <section class="stage-cta" aria-labelledby="cta-title">
      <div class="stage-container stage-cta-layout"><div class="stage-cta-copy"><h2 id="cta-title">{{ tr('從海月範例開始，') }}<br>{{ tr('一步步製作自己的動態角色。') }}</h2><p>{{ tr('先調整範例，熟悉控制點，再依文件製作自己的角色。') }}</p><div class="stage-actions"><RouterLink class="stage-button stage-button-white" to="/playground">{{ tr('打開遊樂場') }}<Icon name="arrow-right" /></RouterLink><RouterLink class="stage-button stage-button-glass" to="/docs?section=installation"><Icon name="book" />{{ tr('查看套件安裝') }}</RouterLink></div><p class="stage-release-note">{{ tr('本機預覽版・尚未發布至 npm。') }}</p></div><figure class="stage-cta-art"><img src="/images/home/mirea-happy-v1.png" :alt="tr('海月みれあ的開心表情素材。')" width="1024" height="1536" loading="lazy"><figcaption>{{ tr('海月みれあ・角色素材展示') }}</figcaption></figure></div>
    </section>
  </div>
</template>
