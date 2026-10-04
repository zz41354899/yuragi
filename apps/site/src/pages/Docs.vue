<script setup lang="ts">
import StudioGuide from '../components/StudioGuide.vue'
import EyeTrackingGuide from '../components/EyeTrackingGuide.vue'
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
  { id: 'studio', title: 'Yuragi Studio', group: '' },
  { id: 'skills', title: 'Yuragi Skills', group: '' },
  { id: 'custom-character', title: '自製角色完整流程', group: '' },
  { id: 'component', title: '框架整合', group: '' },
  { id: 'vanilla', title: '原生 JavaScript', group: '' },
  { id: 'api', title: '所有 API', group: '深入使用' },
  { id: 'eyes', title: '眼睛追蹤', group: '' },
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
const installAssets = `# 在你的專案目錄執行，複製套件內附的海月素材
node --input-type=module -e "import { mkdirSync, cpSync } from 'node:fs'; mkdirSync('public/models', { recursive: true }); cpSync('node_modules/@yuragi/rig/assets/mirea', 'public/models/mirea', { recursive: true });"`
const vanillaCode = `import { createPlayer } from '@yuragi/rig'
import { createMireaModel } from '@yuragi/rig/mirea'

const canvas = document.querySelector<HTMLCanvasElement>('#mirea')!
const player = await createPlayer({
  canvas,
  model: createMireaModel('/models/mirea/texture.png'),
  onError: error => console.error(error),
})

player.setMotion({ sway: 0.8, hair: 1.2 })
player.setGaze(.6, -.2)

// 離開畫面時
player.destroy()`
const vanillaStyle = `<!-- 素材區域保持 2:3 的比例；canvas 預留 12% 的動態空間 -->
<div class="character"><canvas id="mirea"></canvas></div>

<style>
.character { position: relative; width: 320px; aspect-ratio: 2 / 3; }
#mirea {
  position: absolute; left: -12%; top: -12%;
  width: 124%; height: 124%;
}
</style>`
const motionCode = `player.setMotion({
  weight: 1,      // 0–1：整體幾何動態權重，不控制眼神
  layers: 1,      // 0–1：pointerGroups 共同倍率，非獨立圖片圖層
  sway: 1,        // 0–2：待機搖擺與浮動的幅度
  speed: 1,       // 0.25–2：待機搖擺的速度
  hair: 1,        // 0–2：局部頭髮變形的強度
  accessories: 1,// 0–2：耳朵與配件變形的強度
  parts: 1,      // 0–2：局部部件動態的共同倍率
  follow: 1,      // 0–2：游標對姿態參數的影響
})

player.setParameter('lookX', 15) // -30–30
player.setParameter('lookY', -8) // -30–30
player.setParameter('bodyX', 4)  // -10–10
player.setParameter('wave', 0.5) // 0–1：揮手動作的進度`
const pinCode = `player.setPin('head-root', {
  x: 0.57,
  y: 0.213,
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
const coreExports = `import {
  createPlayer, createSimulation,
  validateModel, validateAnimation, sampleCurve, sampleTrack,
  constrainSharedSurface, CANVAS_PADDING, toCanvas,
} from '@yuragi/rig'
// Optional character entry: no Mirea data in the core bundle.
import { createMireaModel } from '@yuragi/rig/mirea'

// Validate clips before sampling. Gaze strength tracks need reviewed face=true.
validateAnimation(clip, true)
sampleCurve(.5, [.42, 0, .58, 1])
sampleTrack(clip.tracks[0], 1200)
// Source 0–1 -> overscanned canvas 0–1
toCanvas(.5)`
const coreCode = `import { createSimulation } from '@yuragi/rig'
import { createMireaModel } from '@yuragi/rig/mirea'

const rig = createSimulation(createMireaModel())
const mesh = rig.buildContinuousMesh()

// 自行管理時間，再交給自己的渲染器繪製
rig.setPointer(0.2, 0)
rig.updatePins(16.67, 16.67)
const diagnostics = rig.updateVertices(mesh, 16.67)

// mesh.positions：變形後頂點
// mesh.uvs：貼圖座標
// mesh.indices：三角形索引`
const mireaModelCode = `import { validateModel } from '@yuragi/rig'
import { createMireaModel } from '@yuragi/rig/mirea'

// 先將套件 assets/mirea 複製到 public/models/mirea
const model = createMireaModel('/models/mirea/texture.png')
validateModel(model)

// model.texture：1024 × 1536 原畫
// model.parts：25 個局部部件
// model.face.eyes：左右眼的量測與瞳孔移動範圍`
const regionCode = `import { validateModel } from '@yuragi/rig'

// Vue 的 @ready 回呼取得 player 後，調整海月既有部件
player.setPart('bang-left-outer', { rotation: .012, stiffness: .018 })
player.setTracking({ bodyFollow: .25 })

const model = player.getModel()
// 傘面、傘柄與持傘手共用 umbrella-grip 接點
const canopy = model.surfaceRegions?.find(
  region => region.id === 'umbrella-canopy-rigid',
)
validateModel(model)
// 修改區域 polygon 或新增部件後，使用驗證過的模型重建播放器`
const mireaAnimationCode = `// 海月已包含左右眼量測；方向與強度可分別控制
player.setGaze(.8, -.2)     // 每軸 -1–1
player.setGazeStrength(1)   // 0–1

player.playAnimation({
  id: 'mirea-gaze-strength', duration: 2400, loop: true,
  tracks: [{ target: 'gaze', name: 'strength', keys: [
    { time: 0, value: 0, curve: [.42, 0, .58, 1] },
    { time: 1200, value: 1, curve: [.42, 0, .58, 1] },
    { time: 2400, value: 0 },
  ] }],
})
player.pauseAnimation()
player.seekAnimation(1200)
player.stopAnimation()      // 保留片段最後的數值
player.setGazeStrength(1)
player.setGaze(0, 0)`
const animationCode = `// 角色整體動畫：權重控制原圖到完整動態的混合
player.playAnimation({
  id: 'whole-motion', duration: 2400, loop: true,
  tracks: [{ target: 'motion', name: 'weight', keys: [
    { time: 0, value: 0, curve: [.42, 0, .58, 1] },
    { time: 1200, value: 1, curve: [.42, 0, .58, 1] },
    { time: 2400, value: 0 },
  ] }],
})
player.pauseAnimation()
player.seekAnimation(1200)
player.stopAnimation()
player.setMotion({ weight: 1 })
player.setPointer(0, 0)

// 海月模型依原圖量測左右眼，只平移瞳孔
// 以下僅適用已審核的眼睛模型
// player.setGaze(.8, -.2)
// player.setGazeStrength(1)`
</script>
<template>
  <div class="docs-shell section-shell reading-workspace">
    <div class="docs-mobile-navigation">
      <DropdownSelect :label="tr('文件章節')" :model-value="active" :options="sections.map(section => ({ value: section.id, label: tr(section.title) }))" @update:model-value="changeSection" />
    </div>
    <aside class="docs-sidebar" :aria-label="tr('文件章節')"><template v-for="section in sections" :key="section.id"><p v-if="section.group" class="sidebar-group">{{ tr(section.group) }}</p><RouterLink :to="{ path: '/docs', query: { section: section.id, framework } }" :class="{ active: active === section.id }" :aria-current="active === section.id ? 'page' : undefined"><Icon :name="({ installation: 'code', skills: 'book', 'custom-character': 'pin', component: 'sliders', vanilla: 'code', api: 'book', studio: 'sliders', eyes: 'sliders', model: 'bones', lifecycle: 'warning' } as Record<string, string>)[section.id]" :size="17" />{{ tr(section.title) }}</RouterLink></template><div class="docs-sidebar-note"><Icon name="wave" :size="25" /><p>{{ tr("先到遊樂場找到節奏，") }}<br>{{ tr("再把設定帶進你的專案。") }}</p><RouterLink to="/playground">{{ tr("打開遊樂場") }}<Icon name="arrow-right" :size="17" /></RouterLink></div></aside>
    <article class="docs-content" :key="active">
      <div class="docs-page-toolbar"><div class="docs-breadcrumb">{{ tr("文件 /") }} {{ tr(title) }}</div><DropdownSelect class="docs-version-switch" inline :label="tr('文件版本')" :model-value="framework" :options="[{ value: 'vue', label: 'Vue 3' }, { value: 'react', label: 'React 18 / 19' }]" @update:model-value="changeFramework" /></div><h1>{{ tr(title) }}</h1>
      <StudioGuide v-if="active === 'studio'" />
      <SkillsGuide v-else-if="active === 'skills'" />
      <EyeTrackingGuide v-else-if="active === 'eyes'" />
      <CharacterGuide v-else-if="active === 'custom-character'" :framework="framework" />
      <template v-else-if="active === 'installation'">
        <p class="docs-lead">{{ tr("Yuragi 是用 TypeScript 寫成的 2D 插畫動態 library。網站與主要指南使用 Vue；React 與原生 JavaScript 共用同一套核心。") }}</p>
        <div class="notice"><strong>{{ tr("目前是本機預覽版 v0.2.0。") }}</strong><p>{{ tr('模型與圖片隨套件提供，網站不提供獨立 JSON 下載。目前尚未發布 npm；發布後可透過 npm 安裝取得。') }}</p></div>
        <h2>{{ tr('你安裝的是什麼？') }}</h2>
        <div class="table-scroll"><table><thead><tr><th>{{ tr('項目') }}</th><th>{{ tr('內容與用途') }}</th></tr></thead><tbody>
          <tr><td><code>@yuragi/rig</code></td><td>{{ tr('安裝到你的網站專案：TypeScript 播放器、模型驗證器、Vue／React adapter，以及海月與 starter 範例素材。') }}</td></tr>
          <tr><td><code>yuragi-rig-spec</code></td><td>{{ tr('另行安裝給 Agent 的 Skill：原圖分析、標註、拆件與建模指引；不會安裝播放器。') }}</td></tr>
          <tr><td>Python / Pillow</td><td>{{ tr('本機素材準備工具的執行環境；需另外準備。Agent 先讀 Skill，再呼叫 Python；Python 不會啟動 Skill。') }}</td></tr>
          <tr><td>{{ tr('海月套件範例') }}</td><td>{{ tr('海月圖片與模型已內附於套件的 assets/mirea。使用 @yuragi/rig/mirea 的 createMireaModel() 載入相同綁定；網站的結構參考標記仍屬展示工具。') }}</td></tr>
        </tbody></table></div>
        <p>{{ tr('下方命令只安裝網站播放器。製作自己的角色時，另依 Skill 流程準備圖片、標註與模型；換一張圖片不會自動完成綁定。') }}</p>
        <p><RouterLink to="/docs?section=skills">{{ tr('查看 Skill 的安裝與製作流程') }}</RouterLink></p>
        <h2>{{ tr('01. 安裝套件') }}</h2><CodeBlock :code="install" :language="tr('終端機')" />
        <h2>{{ tr("02. 放入角色素材") }}</h2><p>{{ tr('目前主要範例使用海月：將 assets/mirea 複製到 public/models/mirea，再用 createMireaModel() 載入。製作自己的角色時可參考 assets/starter。') }}</p><CodeBlock :code="installAssets" :language="tr('終端機')" /><CodeBlock :code="'node_modules/@yuragi/rig/assets/\n├── mirea/\n│   ├── texture.png\n│   └── model.json\n└── starter/\n    └── model.json'" :language="tr('海月與起始素材目錄')" />
        <h2>{{ tr("03. 選擇你的框架") }}</h2><div class="docs-frameworks"><RouterLink to="/docs?section=vue"><strong>Vue 3</strong><span>{{ tr("主要指南 · script setup") }}</span></RouterLink><RouterLink to="/docs?section=react"><strong>React</strong><span>{{ tr("函式元件 · hooks") }}</span></RouterLink><RouterLink to="/docs?section=vanilla"><strong>JavaScript</strong><span>{{ tr("直接使用 Canvas") }}</span></RouterLink></div>
        <p>{{ tr("核心執行於瀏覽器，不需要外部 API key。Vue 與 React 是選用依賴；只匯入核心時不會載入這兩個框架。") }}</p>
      </template>
      <FrameworkReference v-else-if="active === 'component'" :framework="framework" integration />
      <template v-else-if="active === 'vanilla'">
        <p class="docs-lead">{{ tr("直接建立播放器，不依賴 Vue 或 React。適合既有網站與自訂互動。") }}</p><CodeBlock :code="vanillaCode" filename="character.ts" /><h2>{{ tr("Canvas 尺寸與動態空間") }}</h2><CodeBlock :code="vanillaStyle" filename="index.html" /><p>{{ tr("播放器不會修改你的容器樣式。原生 API 需要自行維持圖片比例並配置 12% overscan；Vue／React 包裝已經處理。") }}</p><h2>{{ tr("初始化失敗") }}</h2><p>{{ tr("圖片路徑錯誤、尺寸不符或 WebGL 不可用時，createPlayer 會 reject。請用 try/catch 顯示原畫或錯誤提示。") }}</p>
      </template>
      <template v-else-if="active === 'model'">
        <p class="docs-lead">{{ tr('目前以海月みれあ為主要範例：1024 × 1536 的完整原畫，搭配控制點、局部部件、持傘保護、頭頸跟隨與左右眼量測。圖片與綁定設定分開保存，模型隨套件提供。') }}</p>
        <h2>{{ tr('載入海月模型') }}</h2>
        <p>{{ tr('從 @yuragi/rig/mirea 匯入 createMireaModel()，取得海月綁定的獨立副本。網站與套件使用相同模型，圖片路徑依你的專案設定。') }}</p>
        <CodeBlock :code="mireaModelCode" />
        <h2>{{ tr('海月模型包含什麼？') }}</h2>
        <div class="table-scroll"><table>
          <thead><tr><th>{{ tr('欄位') }}</th><th>{{ tr('用途') }}</th></tr></thead>
          <tbody>
            <tr><td><code>version / id / name</code></td><td>{{ tr('模型格式版本與海月的角色識別；格式版本和套件版本分開管理。') }}</td></tr>
            <tr><td><code>texture</code></td><td>{{ tr('海月原畫的圖片路徑與 1024 × 1536 尺寸。') }}</td></tr>
            <tr><td><code>pins</code></td><td>{{ tr('腰部、頭根、頭頂、持傘接點、傘面、腳部與垂放手的 7 個控制點。') }}</td></tr>
            <tr><td><code>parts</code></td><td>{{ tr('25 個髮束、服裝、飄帶與配件區域，包含根部、末端、彈簧與排除範圍。') }}</td></tr>
            <tr><td><code>surfaceRegions</code></td><td>{{ tr('傘面、傘柄、持傘手與上下身的剛性保護區域。') }}</td></tr>
            <tr><td><code>pointerGroups</code></td><td>{{ tr('上半身與骨盆兩組游標跟隨區域，分別設定位移、轉角與反應時間。') }}</td></tr>
            <tr><td><code>mesh / pose / faceClearance</code></td><td>{{ tr('48 × 72 網格設定、頭頸銜接、身體姿態範圍與臉部保護。') }}</td></tr>
            <tr><td><code>face</code></td><td>{{ tr('左右眼與瞳孔的中心、範圍與移動距離；眼皮與嘴巴保留原畫。') }}</td></tr>
            <tr><td><code>motion / tracking</code></td><td>{{ tr('待機搖擺、局部部件強度，以及游標反應、阻尼與整體漂移。') }}</td></tr>
          </tbody>
        </table></div>
        <p>{{ tr('海月的髮束與服裝使用 parts，不使用舊式 hair／accessories 鏈；目前這兩個陣列為空。motion.parts 控制局部部件強度，motion.layers 控制 pointerGroups 的共同倍率。') }}</p>
        <h2>{{ tr('海月的部件與持傘保護') }}</h2>
        <p>{{ tr('髮束與布料在各自的標註區域內變形，並排除臉部與身體等範圍。傘面、傘柄與持傘手共用 umbrella-grip 接點，避免局部彈簧把傘拉彎或讓手與傘分離。這些設定作用於同一張完整原畫。') }}</p>
        <CodeBlock :code="regionCode" />
        <h2>{{ tr('海月的頭頸與游標跟隨') }}</h2>
        <p>{{ tr('pose.headFollow 定義頭部的旋轉、位移與頸部銜接。pointerGroups 讓上半身與骨盆以不同反應時間跟隨游標；目前 tracking.bodyFollow 為 0.25，保留小幅身體跟隨。setPointer 控制姿態，setGaze 可另外指定眼神方向。') }}</p>
        <h2>{{ tr('眼神與動畫曲線') }}</h2>
        <p>{{ tr('海月已包含左右眼量測，眼神只平移瞳孔。setGaze 控制方向，setGazeStrength 控制強度；中立與減少動態時保留原畫。下方片段示範眼神強度的 Bézier 曲線，不改變眼皮或嘴巴。') }}</p>
        <CodeBlock :code="mireaAnimationCode" />
        <p>{{ tr('動畫支援線性、階梯與 Bézier 曲線；時間單位是毫秒。曲線控制參數目標，骨架仍經原本的彈簧處理。暫停播放器會凍結時間軸，seekAnimation 可定位預覽。') }}</p>
        <h2>{{ tr('調整海月') }}</h2>
        <p>{{ tr('在遊樂場的「圖層」頁籤選取海月部件，調整最大轉角、剛性與阻尼，再查看骨架、部件區域或網格。這裡的部件區域仍共用完整原畫。模型座標使用 0–1：左上角是 (0, 0)，右下角是 (1, 1)。') }}</p>
        <RouterLink class="button primary" to="/playground?tab=layers">{{ tr('查看海月部件與骨架') }}</RouterLink>
        <h2>{{ tr('換成自己的角色') }}</h2>
        <p>{{ tr('以海月為參考，重新量測新角色的圖片尺寸、控制點、部件遮罩、頭頸範圍與眼睛。持傘接點與排除區域是依海月原畫設定，不能直接套用到不同姿勢或道具。') }}</p>
        <div class="notice"><strong>{{ tr('換圖片需要重新綁定。') }}</strong><p>{{ tr('這份海月模型以完整原畫的網格變形與瞳孔平移為主。大角度轉身或新的肢體動作仍需補全遮擋素材，並重新設計綁定與動畫；只替換圖片不會自動完成。') }}</p></div>
        <p><RouterLink to="/docs?section=custom-character">{{ tr('自製角色完整流程') }}</RouterLink></p>
        <h2>{{ tr('使用自己的渲染器') }}</h2>
        <CodeBlock :code="coreCode" />
        <p>{{ tr('動態核心不依賴 DOM。你可以自行更新時間與繪製 mesh，沿用相同的骨架計算與網格保護。') }}</p>
      </template>
      <template v-else>
        <p class="docs-lead">{{ tr("建立、更新、離開畫面。播放器與框架包裝各自處理該負責的生命週期。") }}</p><h2>{{ tr("元件卸載") }}</h2><p>{{ tr("Vue 與 React 包裝會取消尚未完成的圖片載入，停止動畫，斷開 ResizeObserver、IntersectionObserver 與事件監聽，並釋放 WebGL 資源。原生 API 請自行呼叫 destroy()。") }}</p><h2>{{ tr("減少動態") }}</h2><p>{{ tr("預設尊重 prefers-reduced-motion。使用者啟用減少動態時，角色維持原始靜態姿態；改變系統偏好時也會更新。遊樂場會提示目前的系統狀態。") }}</p><h2>{{ tr("為什麼圖片沒有顯示？") }}</h2><p>{{ tr("檢查圖片路徑、原圖尺寸與 WebGL 支援。跨來源圖片需要圖片服務允許 CORS。Vue／React 元件在載入或失敗時保留原畫作為備援。") }}</p><h2>{{ tr("暫停、重設與復原") }}</h2><p>{{ tr("pause() 保留姿態。reset() 恢復中立姿態，但保留模型編輯。遊樂場的「還原預設」才會把整個模型恢復為 海月的互動預設。") }}</p><h2>{{ tr("是否需要 MCP 或 Python？") }}</h2><p>{{ tr("播放與模型編輯在瀏覽器內完成，不需要 MCP、Python 或外部 AI API。角色素材製作可另外使用 Skill 內附的 Python／Pillow 腳本，依 AI 審核的區域輸出部件圖片與綁定資料。") }}</p>
      </template>
      <div class="docs-bottom"><span>Yuragi v0.2.0 · TypeScript</span><RouterLink to="/playground">{{ tr("在遊樂場試試看") }} <Icon name="sliders" :size="17" /></RouterLink></div>
    </article>
  </div>
</template>
