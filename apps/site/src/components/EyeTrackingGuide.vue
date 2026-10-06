<script setup lang="ts">
import { useText } from '../i18n'
import CodeBlock from './CodeBlock.vue'
import LayeredEngineDemo from './LayeredEngineDemo.vue'
const { tr } = useText()
const vueCode = "<script setup lang=\"ts\">\nimport { onBeforeUnmount } from 'vue'\nimport { YuragiCharacter } from '@z7589xxz758/yuragi/vue'\nimport { validateModel, type RigModel, type RigPlayer } from '@z7589xxz758/yuragi'\nconst props = defineProps<{ model: RigModel }>()\nvalidateModel(props.model)\nlet player: RigPlayer | undefined\nlet hasFace = false\nfunction ready(next: RigPlayer) {\n  player = next\n  hasFace = !!next.getModel().face\n  if (!hasFace) return\n  next.setGazeStrength(1)\n}\nfunction move(event: PointerEvent) {\n  if (!player || !hasFace || (event.pointerType === 'touch' && !event.buttons)) return\n  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()\n  if (!rect.width || !rect.height) return\n  player.setGaze((event.clientX - rect.left) / rect.width * 2 - 1,\n                 (event.clientY - rect.top) / rect.height * 2 - 1)\n}\nfunction neutral() { if (player && hasFace) player.setGaze(0, 0) }\nfunction key(event: KeyboardEvent) {\n  if (event.target !== event.currentTarget || !player || !hasFace) return\n  const points: Record<string, [number, number]> = {\n    ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1], Escape: [0,0],\n  }\n  const point = points[event.key]\n  if (point) { event.preventDefault(); player.setGaze(...point) }\n}\nonBeforeUnmount(() => { player = undefined })\n<\/script>\n<template>\n  <div tabindex=\"0\" role=\"group\" aria-label=\"Character gaze controls\"\n    @pointermove=\"move\" @pointerleave=\"neutral\" @pointercancel=\"neutral\"\n    @pointerup=\"neutral\" @blur=\"neutral\" @keydown=\"key\">\n    <YuragiCharacter :model=\"model\" @ready=\"ready\" @error=\"player = undefined\" />\n  </div>\n</template>"
const inputCode = `// Combined head/body and independent eyes; reviewed face required.
player.setPointer(.3, -.1)
player.setGaze(.8, -.2)
player.setGazeStrength(1)
// Eye-only shader preserves source eyelids and mouth.`
</script>
<template>
  <p class="docs-lead">{{ tr('讓角色的瞳孔跟著游標移動。需先依原圖量測 face；這裡使用游標輸入，不需要攝影機。') }}</p>
  <h2>{{ tr('01. 準備已審核的臉部模型') }}</h2>
  <p>{{ tr('套件的海月範例已有經審核的左右眼與頭頸綁定。自製角色仍需量測，不能只換圖片。') }}</p>
  <p>{{ tr('face 只包含左右眼量測。setGazeStrength 控制 0–1 強度，預設 1；眼皮與嘴巴保留原畫。') }}</p>
  <h2>{{ tr('02. 輸入座標與呼叫順序') }}</h2>
  <p>{{ tr('setPointer 是舞台中心的相對位置，建議每軸 −0.5…0.5；setGaze 是獨立眼神方向，每軸 −1…1。X 正值往右、Y 正值往下。') }}</p>
  <p>{{ tr('setPointer 也會設定眼神。結合頭部與眼睛時先呼叫 setPointer，再呼叫 setGaze；lookX／lookY 的 setParameter 或動畫軌會讓眼神重新跟隨頭部。') }}</p>
  <CodeBlock :code="inputCode" />
  <h2>{{ tr('03. 在元件取得 player 後接上互動') }}</h2>
  <p>{{ tr('Vue 使用 @ready，React 使用 onReady 取得同一個 RigPlayer。將事件綁在角色容器；只改眼神時呼叫 setGaze。離開、觸控取消與鍵盤 Escape 都可回到 (0, 0)。') }}</p>
  <CodeBlock :code="vueCode" filename="EyeTracking.vue" />
  <p>{{ tr('這個範例以舞台位置控制方向。要對準移動中的臉部，需考慮原圖眼睛中心、canvas 的 12% 留白與 trackingOffset；快照不包含完整頭部轉換，對位仍是近似。') }}</p>
  <h2>{{ tr('04. 驗證與常見錯誤') }}</h2>
  <p>{{ tr('逐眼檢查中心、上下左右、四個角落與快速反向；確認瞳孔不穿出眼白、眼線不變形。另測試觸控、方向鍵、減少動態、原畫備援與頁面卸載。') }}</p>
  <p>{{ tr('沒有 face 時呼叫眼神 API 會拋錯。眼睛不動時，先檢查 strength、travel、播放器是否暫停與系統減少動態。') }}</p>
  <div class="notice"><strong>{{ tr('Python 分階段流程') }}</strong><p>{{ tr('Agent 先讀 yuragi-rig-spec，再 inspect、看圖標註、extract，最後 build --prepared。Python 支援 eyes 與 pointerGroups，建模時呼叫實際 runtime 驗證。') }}</p></div>
  <p><a href="/.well-known/skills/yuragi-rig-spec/references/eye-tracking.md">{{ tr('完整眼睛標註與整合範例') }}</a></p>
  <p><a href="/.well-known/skills/yuragi-rig-spec/references/character-preparation.md#cli-contract-and-current-exporter-gaps">{{ tr('Python 命令、錯誤與功能缺口') }}</a></p>
  <h2>{{ tr('05. 海月的實際綁定') }}</h2>
  <p>{{ tr('海月模型已隨套件提供。從 @z7589xxz758/yuragi/mirea 匯入 createMireaModel，並使用複製到 public/models/mirea 的 texture.png。網站也以同一套件工廠載入模型，再改用網站圖片路徑。') }}</p>
  <div class="table-scroll"><table><thead><tr><th>Eye</th><th>{{tr('來源座標')}}</th><th>iris</th><th>travel</th></tr></thead><tbody><tr><td>left</td><td>[.524, .167]</td><td>[.525, .1673]</td><td>[.003, .00065]</td></tr><tr><td>right</td><td>[.584, .156]</td><td>[.585, .1558]</td><td>[.003, .00065]</td></tr></tbody></table></div>
  <p><code>radius: [.0215, .00782] · irisRadius: [.0078, .0058] · angle: −.29 · sclera: [.98, .955, .99]</code></p>
  <p>{{ tr('Hero 先 setPointer，再 setGaze；使用左右眼平均中心加 trackingOffset 修正整體漂移，X／Y 感應距離分別為原畫顯示寬度的 18% 與高度的 11%。') }}</p>
  <p>{{ tr('Hero 使用原畫容器座標，不再加 canvas 留白；若改用 canvas 邊界，需用 toCanvas 換算。快照不含完整頭部、搖擺與群組變換，所以對準移動中的臉仍是近似。') }}</p>
  <p><a href="/.well-known/skills/yuragi-rig-spec/references/layered-engine-design.md">{{tr('分層引擎使用注意事項')}}</a></p>
  <LayeredEngineDemo />
</template>
