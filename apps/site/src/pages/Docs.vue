<script setup lang="ts">
import { useText } from "../i18n"
const { tr } = useText()
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import CodeBlock from '../components/CodeBlock.vue'
import CharacterGuide from '../components/CharacterGuide.vue'
import SkillsGuide from '../components/SkillsGuide.vue'
import FrameworkReference from '../components/FrameworkReference.vue'
import type { Framework } from '../docs/framework-examples'
import Icon from '../components/Icon.vue'
import DropdownSelect from '../components/DropdownSelect.vue'
const route = useRoute()
const router = useRouter()
const framework = computed<Framework>(() => route.query.framework === 'react' || route.query.section === 'react' && route.query.framework !== 'vue' ? 'react' : 'vue')
function changeFramework(value: string) {
  if (value !== 'vue' && value !== 'react') return
  void router.replace({ query: { ...route.query, framework: value, section: ['vue', 'react'].includes(String(route.query.section)) ? 'component' : route.query.section } })
}
const sections = [
  { id: 'installation', title: '安裝與開始', group: '開始使用' },
  { id: 'skills', title: 'Yuragi Skills', group: '' },
  { id: 'custom-character', title: '自製角色完整流程', group: '' },
  { id: 'component', title: '框架整合', group: '' },
  { id: 'vanilla', title: '原生 JavaScript', group: '' },
  { id: 'api', title: '播放器 API', group: '深入使用' },
  { id: 'model', title: '角色模型與骨架', group: '' },
  { id: 'lifecycle', title: '生命週期與常見問題', group: '' },
]
const active = computed(() => ['vue', 'react'].includes(String(route.query.section)) ? 'component' : sections.some(s => s.id === route.query.section) ? String(route.query.section) : 'installation')
const title = computed(() => sections.find(s => s.id === active.value)!.title)
function changeSection(section: string) {
  if (!sections.some(item => item.id === section)) return
  void router.push({ path: '/docs', query: { ...route.query, section, framework: framework.value } })
}
const install = `# 目前：從本機 Yuragi 專案安裝（先在 Yuragi 執行 npm run build:lib）
npm install /path/to/yuragi/packages/rig

# 未來發布至 npm 後才可使用（目前尚未發布）
# npm install @yuragi/rig`
const installAssets = `# 在你的專案目錄執行，複製套件內附的 Momo 素材
node --input-type=module -e "import { mkdirSync, cpSync } from 'node:fs'; mkdirSync('public/models', { recursive: true }); cpSync('node_modules/@yuragi/rig/assets/momo', 'public/models/momo', { recursive: true });"`
const vanillaCode = `import { createPlayer, createMomoModel } from '@yuragi/rig'

const canvas = document.querySelector<HTMLCanvasElement>('#momo')!
const player = await createPlayer({
  canvas,
  model: createMomoModel('/models/momo/texture.webp'),
  onError: error => console.error(error),
})

player.setMotion({ sway: 0.8, hair: 1.2 })
player.wave()

// 離開畫面時
player.destroy()`
const vanillaStyle = `<!-- 素材區域保持 2:3 的比例；canvas 預留 12% 的動態空間 -->
<div class="character"><canvas id="momo"></canvas></div>

<style>
.character { position: relative; width: 320px; aspect-ratio: 2 / 3; }
#momo {
  position: absolute; left: -12%; top: -12%;
  width: 124%; height: 124%;
}
</style>`
const motionCode = `player.setMotion({
  sway: 1,        // 0–2：待機搖擺與浮動的幅度
  speed: 1,       // 0.25–2：待機搖擺的速度
  hair: 1,        // 0–2：局部頭髮變形的強度
  accessories: 1,// 0–2：耳朵與配件變形的強度
  follow: 1,      // 0–2：游標對姿態參數的影響
})

player.setParameter('lookX', 15) // -30–30
player.setParameter('lookY', -8) // -30–30
player.setParameter('bodyX', 4)  // -10–10
player.setParameter('wave', 0.5) // 0–1：揮手動作的進度`
const pinCode = `player.setPin('head-root', {
  x: 0.52,
  y: 0.28,
  radius: 0.2,
})

// 匯出目前的骨架與動態設定
const model = player.getModel()
const json = JSON.stringify(model, null, 2)

// 重新載入前先驗證
import { validateModel } from '@yuragi/rig'
const imported: unknown = JSON.parse(json)
validateModel(imported) // 格式錯誤會 throw
// imported 已被縮窄為 RigModel`
const coreCode = `import { createSimulation, createMomoModel } from '@yuragi/rig'

const rig = createSimulation(createMomoModel())
const mesh = rig.buildContinuousMesh()

// 自行管理時間，再交給自己的渲染器繪製
rig.setPointer(0.2, 0)
rig.updatePins(16.67, 16.67)
const diagnostics = rig.updateVertices(mesh, 16.67)

// mesh.positions：變形後頂點
// mesh.uvs：貼圖座標
// mesh.indices：三角形索引`
const apiRows = [
  ['play()', '—', '開始或恢復動畫。尊重系統的減少動態設定。'],
  ['pause()', '—', '停止動畫循環，保留目前姿態。'],
  ['setPointer(x, y)', 'number, number', '中心是 (0, 0)；建議範圍為 -0.5 到 0.5，輸入會限制在姿態範圍內。'],
  ['setParameter(name, value)', 'ParameterName, number', '設定視線、身體傾斜或揮手進度。'],
  ['setMotion(settings)', 'Partial<MotionSettings>', '即時更新動態強度；省略的欄位保留原值。'],
  ['setPin(name, patch)', "string, Partial<Omit<PinSpec, 'name' | 'parent' | 'type'>>", '修改 x、y、radius、stiffness、damping、wind 並重新計算綁定。'],
  ['wave()', '—', '觸發約 1.15 秒的揮手；暫停時會恢復播放。'],
  ['reset()', '—', '恢復中立姿態，保留編輯過的模型與動態設定。'],
  ['getModel()', '→ RigModel', '取得獨立的模型副本，可存為 JSON。'],
  ['getSnapshot()', '→ RigSnapshot', '取得姿態、控制點、播放狀態與網格保護診斷。'],
  ['destroy()', '—', '停止動畫、移除監聽與觀察器、釋放 WebGL 資源。可重複呼叫。'],
]
const optionRows = [
  ['canvas', 'HTMLCanvasElement', '必要；原生 API 的渲染目標。'],
  ['model', 'RigModel', '必要；使用 createMomoModel() 或經驗證的模型。'],
  ['autoplay', 'boolean', '預設 true。'],
  ['reducedMotion', "'respect' | 'ignore'", '預設 respect；系統減少動態時顯示靜態姿態。'],
  ['pixelRatio', 'number', '原生 API 選項；像素密度限制在 1–2。'],
  ['onFrame', '(snapshot) => void', '每約 100ms 回報一次動畫快照；手動操作會立即回報。'],
  ['onError', '(error) => void', '回報播放期間的 WebGL 錯誤；初始化失敗由 Promise reject 回報。'],
  ['signal', 'AbortSignal', '取消載入，或在載入完成後銷毀播放器。'],
]
</script>
<template>
  <div class="docs-shell section-shell reading-workspace">
    <div class="docs-mobile-navigation">
      <DropdownSelect :label="tr('文件章節')" :model-value="active" :options="sections.map(section => ({ value: section.id, label: tr(section.title) }))" @update:model-value="changeSection" />
    </div>
    <aside class="docs-sidebar" :aria-label="tr('文件章節')"><template v-for="section in sections" :key="section.id"><p v-if="section.group" class="sidebar-group">{{ tr(section.group) }}</p><RouterLink :to="{ path: '/docs', query: { section: section.id, framework } }" :class="{ active: active === section.id }" :aria-current="active === section.id ? 'page' : undefined"><Icon :name="({ installation: 'code', skills: 'book', 'custom-character': 'pin', component: 'sliders', vanilla: 'code', api: 'book', model: 'bones', lifecycle: 'warning' } as Record<string, string>)[section.id]" :size="17" />{{ tr(section.title) }}</RouterLink></template><div class="docs-sidebar-note"><Icon name="wave" :size="25" /><p>{{ tr("先到遊樂場找到節奏，") }}<br>{{ tr("再把設定帶進你的專案。") }}</p><RouterLink to="/playground">{{ tr("打開遊樂場") }}<Icon name="arrow-right" :size="17" /></RouterLink></div></aside>
    <article class="docs-content" :key="active">
      <div class="docs-page-toolbar"><div class="docs-breadcrumb">{{ tr("文件 /") }} {{ tr(title) }}</div><DropdownSelect class="docs-version-switch" inline :label="tr('文件版本')" :model-value="framework" :options="[{ value: 'vue', label: 'Vue 3' }, { value: 'react', label: 'React 18 / 19' }]" @update:model-value="changeFramework" /></div><h1>{{ tr(title) }}</h1>
      <SkillsGuide v-if="active === 'skills'" />
      <CharacterGuide v-else-if="active === 'custom-character'" :framework="framework" />
      <template v-else-if="active === 'installation'">
        <p class="docs-lead">{{ tr("Yuragi 是用 TypeScript 寫成的 2D 插畫動態 library。網站與主要指南使用 Vue；React 與原生 JavaScript 共用同一套核心。") }}</p>
        <div class="notice"><strong>{{ tr("目前是本機預覽版 v0.1.0。") }}</strong><p>{{ tr('模型與圖片隨套件提供，網站不提供獨立 JSON 下載。目前尚未發布 npm；發布後可透過 npm 安裝取得。') }}</p></div>
        <h2>{{ tr('01. 安裝套件') }}</h2><CodeBlock :code="install" :language="tr('終端機')" />
        <h2>{{ tr("02. 放入角色素材") }}</h2><p>{{ tr('安裝後，Momo 模型與圖片位於套件的 assets/momo，起始模型位於 assets/starter。把需要的素材複製到自己專案的 public/models，再設定圖片路徑。') }}</p><CodeBlock :code="installAssets" :language="tr('終端機')" /><CodeBlock :code="'node_modules/@yuragi/rig/assets/\n├── momo/\n│   ├── texture.webp\n│   └── model.json\n└── starter/\n    └── model.json'" :language="tr('目錄結構')" />
        <h2>{{ tr("03. 選擇你的框架") }}</h2><div class="docs-frameworks"><RouterLink to="/docs?section=vue"><strong>Vue 3</strong><span>{{ tr("主要指南 · script setup") }}</span></RouterLink><RouterLink to="/docs?section=react"><strong>React</strong><span>{{ tr("函式元件 · hooks") }}</span></RouterLink><RouterLink to="/docs?section=vanilla"><strong>JavaScript</strong><span>{{ tr("直接使用 Canvas") }}</span></RouterLink></div>
        <p>{{ tr("核心執行於瀏覽器，不需要外部 API key。Vue 與 React 是選用依賴；只匯入核心時不會載入這兩個框架。") }}</p>
      </template>
      <FrameworkReference v-else-if="active === 'component'" :framework="framework" integration />
      <template v-else-if="active === 'vanilla'">
        <p class="docs-lead">{{ tr("直接建立播放器，不依賴 Vue 或 React。適合既有網站與自訂互動。") }}</p><CodeBlock :code="vanillaCode" filename="character.ts" /><h2>{{ tr("Canvas 尺寸與動態空間") }}</h2><CodeBlock :code="vanillaStyle" filename="index.html" /><p>{{ tr("播放器不會修改你的容器樣式。原生 API 需要自行維持圖片比例並配置 12% overscan；Vue／React 包裝已經處理。") }}</p><h2>{{ tr("初始化失敗") }}</h2><p>{{ tr("圖片路徑錯誤、尺寸不符或 WebGL 不可用時，createPlayer 會 reject。請用 try/catch 顯示原畫或錯誤提示。") }}</p>
      </template>
      <template v-else-if="active === 'api'">
        <FrameworkReference :framework="framework" /><h2>{{ tr('共用 RigPlayer API') }}</h2><p>{{ tr('以下方法由所有 adapter 共用。Vue 從 @ready 或 ref 取得 player；React 從 onReady 或 handle.getPlayer() 取得。') }}</p>
        <p class="docs-lead">{{ tr("Vue、React 與原生 JavaScript 都使用 RigPlayer。方法會直接更新引擎，不需要重建元件。") }}</p><h2>createPlayer(options)</h2><p>{{ tr("回傳") }} <code>Promise&lt;RigPlayer&gt;</code>{{ tr("。設定格式與圖片尺寸會在開始播放前驗證。") }}</p><div class="table-scroll"><table><thead><tr><th>{{ tr("選項") }}</th><th>{{ tr("型別") }}</th><th>{{ tr("說明") }}</th></tr></thead><tbody><tr v-for="row in optionRows" :key="row[0]"><td><code>{{ row[0] }}</code></td><td><code>{{ row[1] }}</code></td><td>{{ tr(row[2]) }}</td></tr></tbody></table></div><h2>{{ tr("播放器方法") }}</h2><div class="table-scroll"><table><thead><tr><th>{{ tr("方法") }}</th><th>{{ tr("參數／回傳") }}</th><th>{{ tr("行為") }}</th></tr></thead><tbody><tr v-for="row in apiRows" :key="row[0]"><td><code>{{ row[0] }}</code></td><td><code>{{ row[1] }}</code></td><td>{{ tr(row[2]) }}</td></tr></tbody></table></div><h2>{{ tr("動態設定") }}</h2><CodeBlock :code="motionCode" /><h2>{{ tr("控制點與模型匯出") }}</h2><CodeBlock :code="pinCode" /><p>{{ tr("所有數值必須有限。模型欄位超出範圍時會 throw，原本的模型設定不會被部分更新。") }}</p>
      </template>
      <template v-else-if="active === 'model'">
        <p class="docs-lead">{{ tr("原畫與角色設定分開保存。骨架、頭髮、配件、網格與姿態區域都可以放在同一個 JSON 模型裡。") }}</p><h2>{{ tr("模型包含什麼？") }}</h2><div class="table-scroll"><table><thead><tr><th>{{ tr("欄位") }}</th><th>{{ tr("用途") }}</th></tr></thead><tbody><tr><td><code>version / id / name</code></td><td>{{ tr("格式版本與角色識別。") }}</td></tr><tr><td><code>texture</code></td><td>{{ tr("圖片來源與原始尺寸。") }}</td></tr><tr><td><code>pins</code></td><td>{{ tr("位置、類型、父節點、影響範圍與彈性設定。") }}</td></tr><tr><td><code>hair / accessories</code></td><td>{{ tr("頭髮三點鏈，以及配件根部與末端。") }}</td></tr><tr><td><code>mesh / pose / faceClearance</code></td><td>{{ tr("網格密度、姿態影響區域與臉部保護。") }}</td></tr><tr><td><code>motion</code></td><td>{{ tr("搖擺、速度、跟隨與局部動態強度。") }}</td></tr></tbody></table></div><h2>{{ tr("調整 Momo") }}</h2><p>{{ tr("在遊樂場選取控制點，調整位置、影響範圍或彈性並即時預覽。模型隨套件提供，不在網站下載。座標使用 0–1：左上角是 (0, 0)，右下角是 (1, 1)。") }}</p><RouterLink class="button primary" to="/playground">{{ tr("編輯 Momo 骨架") }}</RouterLink><h2>{{ tr("換成自己的角色") }}</h2><p>{{ tr("更新圖片尺寸、控制點、頭髮鏈與姿態區域。v0.1 的人形姿態使用 waist、head-root、head-top、shoulder-right 等語意名稱；請依 Momo 模型對應這些控制點，才能沿用轉頭與揮手。") }}</p><div class="notice"><strong>{{ tr("換圖片需要重新綁定。") }}</strong><p>{{ tr("目前提供資料化模型與編輯工具，不會自動辨識圖片或替新角色完成綁定。眨眼、嘴型與大角度轉身需要額外素材和動作機制。") }}</p></div><h2>{{ tr("使用自己的渲染器") }}</h2><CodeBlock :code="coreCode" /><p>{{ tr("動態核心不依賴 DOM。你可以自行更新時間與繪製 mesh，沿用相同的骨架計算與網格保護。") }}</p>
      </template>
      <template v-else>
        <p class="docs-lead">{{ tr("建立、更新、離開畫面。播放器與框架包裝各自處理該負責的生命週期。") }}</p><h2>{{ tr("元件卸載") }}</h2><p>{{ tr("Vue 與 React 包裝會取消尚未完成的圖片載入，停止動畫，斷開 ResizeObserver、IntersectionObserver 與事件監聽，並釋放 WebGL 資源。原生 API 請自行呼叫 destroy()。") }}</p><h2>{{ tr("減少動態") }}</h2><p>{{ tr("預設尊重 prefers-reduced-motion。使用者啟用減少動態時，角色維持原始靜態姿態；改變系統偏好時也會更新。遊樂場會提示目前的系統狀態。") }}</p><h2>{{ tr("為什麼圖片沒有顯示？") }}</h2><p>{{ tr("檢查圖片路徑、原圖尺寸與 WebGL 支援。跨來源圖片需要圖片服務允許 CORS。Vue／React 元件在載入或失敗時保留原畫作為備援。") }}</p><h2>{{ tr("暫停、重設與復原") }}</h2><p>{{ tr("pause() 保留姿態。reset() 恢復中立姿態，但保留模型編輯。遊樂場的「還原預設」才會把整個模型恢復為 Momo 的原始設定。") }}</p><h2>{{ tr("是否需要 MCP 或 Python？") }}</h2><p>{{ tr("播放與目前的模型編輯全部在瀏覽器內完成。這個版本不需要 MCP、Python 或外部 AI API；未來可以在相同核心上加上角色製作工具。") }}</p>
      </template>
      <div class="docs-bottom"><span>Yuragi v0.1.0 · TypeScript</span><RouterLink to="/playground">{{ tr("在遊樂場試試看") }} <Icon name="sliders" :size="17" /></RouterLink></div>
    </article>
  </div>
</template>
