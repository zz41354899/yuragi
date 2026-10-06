# 自製角色完整流程

準備圖片 → 建立模型 → 綁定控制點 → 預覽驗證 → 在 Vue／React 載入

可以擴充，不代表任何圖片都能自動套用。

目前最容易延伸的是具有已量測語意控制點的人形角色。動物、四足、翅膀或其他結構需要擴充動作綁定；只改圖片或控制點名稱，不能產生新的動作機制。

## 01. 準備自己的圖片

使用一張正面或輕微側身的完整角色圖片，建議透明 PNG／WebP，頭部、手臂與髮梢清楚分開。JPEG 可載入，但背景也會一起變形。避免裁掉手腳，並在原圖邊緣留白；Canvas 的動態空間不能補回被裁掉的像素。

寬、高必須填入圖片實際像素尺寸，各為 1–8192；不是 CSS 顯示尺寸。格式驗證接受此範圍，實際可用尺寸仍受裝置 WebGL 貼圖上限與記憶體限制。先以約 1024 × 1536 的素材試作，並優先使用同來源圖片。

## 02. 建立模型檔案

先安裝套件，再把 `node_modules/@z7589xxz758/yuragi/assets/starter/model.json` 複製為 `public/models/my-character/model.json`，圖片放在同目錄的 `texture.png`。範例座標只是人形示意，必須逐點依自己的原圖重新配置；起始模型不包含圖片，也沒有替你完成綁定。網站不提供獨立 JSON 下載。

修改 id、name、texture 與所有位置設定。不要直接對新圖片套用 createMireaModel()：它仍會帶入海月的尺寸、控制點、局部鏈與姿態。所有頂層欄位都必須存在；沒有頭髮、配件或臉部遮罩時，使用空陣列。

目前 npm 尚未發布，請先在 Yuragi 執行 `npm run build:lib`，再於自己的專案執行 `npm install /path/to/yuragi/packages/rig`。未來發布後才可直接使用 `npm install @z7589xxz758/yuragi`；兩種安裝方式都包含套件的 `assets/` 目錄。

```json
{
  "version": 1,
  "id": "my-character",
  "name": "My character",
  "texture": { "src": "/models/my-character/texture.png", "width": 1024, "height": 1536 },
  "mesh": { "columns": 32, "rows": 48 },
  "pins": [
    { "name": "waist", "type": "fixed", "x": 0.5, "y": 0.55, "radius": 0.2 },
    { "name": "head-root", "type": "fixed", "parent": "waist", "x": 0.5, "y": 0.28, "radius": 0.15 },
    { "name": "head-top", "type": "joint", "parent": "head-root", "x": 0.5, "y": 0.12, "radius": 0.12 },
    { "name": "shoulder-left", "type": "fixed", "parent": "waist", "x": 0.38, "y": 0.35, "radius": 0.12 },
    { "name": "wrist-left", "type": "joint", "parent": "shoulder-left", "x": 0.22, "y": 0.43, "radius": 0.08 },
    { "name": "shoulder-right", "type": "fixed", "parent": "waist", "x": 0.62, "y": 0.35, "radius": 0.12 },
    { "name": "elbow-right", "type": "joint", "parent": "shoulder-right", "x": 0.73, "y": 0.41, "radius": 0.09 },
    { "name": "wrist-right", "type": "joint", "parent": "elbow-right", "x": 0.82, "y": 0.46, "radius": 0.08 }
  ],
  "hair": [],
  "accessories": [],
  "faceClearance": [],
  "motion": { "sway": 0.4, "speed": 0.7, "hair": 0, "accessories": 0, "follow": 0.4 },
  "pose": {
    "headCenter": 0.5,
    "headBounds": [0.28, 0.42],
    "headHorizontal": [0.16, 0.3],
    "bodyBounds": [0.55, 0.9],
    "bodyPivot": [0.5, 0.58],
    "swayPivot": [0.5, 0.85]
  }
}
```

## 03. 綁定控制點與局部動態

座標以完整原圖為基準，包含透明留白：左上 (0, 0)，右下 (1, 1)，X 向右、Y 向下。像素座標 (px, py) 轉為 (px / width, py / height)。例如 1024 × 1536 圖中的 (512, 384) 是 (0.5, 0.25)。畫面縮放、Canvas 的 12% 留白都不改變模型座標。

先標記腰部、頭根、頭頂與左右肩，再依序標記右肘、右腕與左腕。left／right 沿用模型語意；請對照範例的揮手側，不要僅憑解剖左右猜測。父控制點放在子控制點之前，彈性鏈會依陣列順序更新。

用繪圖軟體開啟原圖，讀取游標像素位置，除以圖片寬／高後填入 JSON 的 x／y；每調整一區就重新預覽。下方頭髮與配件程式碼同樣只是座標示意，請先載入自己的 model，並把各點改成自己的位置。

腰部呼吸與身體位移；頭根視線位移；頭頂繞 head-root 轉動。這些名稱由引擎辨識，不能任意改名而期待相同動作。

右側三點驅動 wave()；wrist-left 會以 shoulder-left 做小幅配合。shoulder-left、hip-raised、hip-standing 也參與身體呼吸。

fixed 仍可能被人形動作帶動，不代表像素永遠固定。joint 不會自動解算整條手腳；parent 對 spring 有位移跟隨作用，並用於骨架顯示。沒有被既有動作辨識的關節，通常只是中立控制點。

控制點的 radius 是正規化影響半徑，不是像素或硬邊界；引擎會平滑分配並正規化權重。先從 0.08–0.2 試起，避免大範圍把臉與軀幹一起拉動。

頭髮鏈與配件鏈要另外配置，不會從 pins 自動產生。頭髮三點依序為髮根、髮中、髮梢；配件使用固定根部與自由末端。先以空陣列驗證身體，再逐組增加，避免沿用其他角色的髮梢座標。

```ts
import { validateModel } from '@z7589xxz758/yuragi'
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
console.log(JSON.stringify(model, null, 2))
```

## 04. 預覽並驗證

目前網站遊樂場只編輯海月：匯入時會檢查 1024 × 1536、海月模型 ID 並使用海月原圖。請在自己的 Vue／React 專案建立預覽頁，或使用下方的原生預覽；不要把新角色 JSON 匯入此遊樂場驗證圖片綁定。

先呼叫 validateModel，再確認圖片尺寸與載入結果。把動態降低，分別檢查中立、左右／上下視線、揮手與連續待機；觀察臉部、接縫、髮根與圖片邊緣。格式正確只代表資料合法，不代表綁定品質正確。

motionScale 接近 1 代表較少觸發網格保護；長期顯著低於 1 時，縮小 radius、降低動態或修正局部鏈。另測試手機、快速切換模型、離開頁面與系統減少動態。請用本機 HTTP 伺服器預覽，不要直接打開 file://。

原生預覽的 2 / 3 比例只對應 1024 × 1536 範例。使用其他尺寸時，把 aspect-ratio 改成圖片 width / height；圖片與模型都放在 public，TypeScript 檔案放在專案 src，透過現有開發伺服器開啟預覽。

```html
<div style="position: relative; width: 320px; aspect-ratio: 2 / 3">
  <img id="fallback" src="/models/my-character/texture.png"
    alt="我的角色" style="width: 100%; height: 100%; object-fit: contain; position: relative; z-index: 1">
  <canvas id="character" aria-hidden="true"
    style="position: absolute; left: -12%; top: -12%; width: 124%; height: 124%"></canvas>
</div>
```

```ts
import { createPlayer } from '@z7589xxz758/yuragi'
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
}
```

## 05. 在 Vue／React 載入自己的模型

先完成本機套件安裝。共用載入函式檢查 HTTP 狀態，以 unknown 接收 JSON，再由 validateModel 縮窄型別。模型中的 texture.src 使用從網站根目錄開始的 URL；相對路徑會依文件網址解析，不會自動相對於 model.json。

兩個範例都在掛載後載入，取消未完成的請求，並在模型固定後才建立角色元件。框架包裝負責圖片備援、減少動態與播放器清理；只把約每 100ms 的快照用於 UI，避免逐幀更新框架狀態。

### load-model.ts

```ts
import { validateModel, type RigModel } from '@z7589xxz758/yuragi'

export async function loadModel(signal?: AbortSignal): Promise<RigModel> {
  const response = await fetch('/models/my-character/model.json', { signal })
  if (!response.ok) throw new Error('Model HTTP ' + response.status)
  const value: unknown = await response.json()
  validateModel(value)
  return value
}
```

### Vue 3：Character.vue

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import { YuragiCharacter } from '@z7589xxz758/yuragi/vue'
import type { RigModel } from '@z7589xxz758/yuragi'
import { loadModel } from './load-model'

const model = shallowRef<RigModel>()
const error = ref('')
const controller = new AbortController()
onMounted(async () => {
  try { model.value = await loadModel(controller.signal) }
  catch (cause) { if (!controller.signal.aborted) error.value = String(cause) }
})
onBeforeUnmount(() => controller.abort())
</script>

<template>
  <div style="width: 320px">
    <YuragiCharacter v-if="model" :model="model" :alt="model.name"
      @error="cause => error = cause.message" />
    <img v-else src="/models/my-character/texture.png" alt="我的角色" style="width: 100%" />
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
```

### React：Character.tsx

```tsx
import { useEffect, useState } from 'react'
import { YuragiCharacter } from '@z7589xxz758/yuragi/react'
import type { RigModel } from '@z7589xxz758/yuragi'
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
      : <img src="/models/my-character/texture.png" alt="我的角色" style={{ width: '100%' }} />}
    {error && <p role="alert">{error}</p>}
  </div>
}
```

## 完整模型規格

| 欄位 | 型別、範圍與限制 |
| --- | --- |
| `version / id / name` | 必要且只能為 1。id 為非空字串，name 為字串；驗證器允許空 name，但請提供可辨識名稱。 |
| `texture.src` | 非空圖片 URL／路徑；支援 http(s)、blob、PNG/WebP/JPEG data URL 與一般路徑，拒絕 javascript:。跨來源須允許 CORS；blob URL 不能當永久模型網址。 |
| `texture.width / height` | 各 1–8192，有限數值；必須與 naturalWidth／naturalHeight 完全一致，實際圖片尺寸為整數像素。 |
| `mesh.columns / rows` | 各為 2–200 的整數，(columns + 1) × (rows + 1) ≤ 65535。先用 32 × 48；越密計算量越高，不會自動提高綁定品質。 |
| `pins[].name / type` | 必要陣列，1–256 個控制點。name 非空且不可重複；type 只能是 fixed／joint／spring。 |
| `pins[].parent` | 可省略；存在時必須引用現有 name，不可指向自己或形成循環。建議依父到子的順序排列 pins。 |
| `pins[].x / y / radius` | 各 0–1，完整原圖的正規化座標。radius 為 0.005–0.5 的影響半徑；無單位，非硬邊界。 |
| `pins[].stiffness / damping / wind` | 可省略，各為 0–1。剛性越低跟隨越慢；damping 越接近 1 越保留動量，不是摩擦量；wind 是 spring 的風位移係數，不是速度。 |
| `hair[].id` | 必要陣列，0–128 組。id 為不可重複字串；bang- 前綴啟用較小幅瀏海與臉部保護，pony- 前綴擴大馬尾影響範圍，其他 id 使用一般頭髮行為。 |
| `hair[].points` | 恰好三組 [x, y]，每個值 0–1；順序為根、中、梢，相鄰點不可重合，建議三點皆分開。 |
| `hair[].phase / radius / gain` | phase 為 -100–100 的相位偏移（弧度）；radius 0.005–0.5；gain 0–3 的局部強度。無頭髮時用 []；先以 gain 1 試作。 |
| `accessories[].id` | 必要陣列，0–128 組，id 為字串。建議唯一；sleeve-right／ribbon-right 額外接收揮手作用。 |
| `accessories[].root / tip` | 各為 [x, y]，值 0–1，兩點不可重合；root 是固定根部，tip 決定配件方向與長度。 |
| `accessories[].radius / angle` | radius 0.005–0.5；angle 0–1 弧度，為旋轉幅度上限，非角度制或初始朝向。 |
| `accessories[].stiffness / damping / phase` | stiffness／damping 必填，各 0–1；phase 必填，-100–100 弧度。建議先參考 0.03／0.93／0。 |
| `faceClearance[]` | 必要陣列，可為 []。每組 [cx, cy, rx, ry] 是橢圓中心與半徑：中心 0–1、半徑 0.001–1。削弱臉部的局部髮絲位移，不會保護全部姿態變形。 |
| `motion.sway / hair / accessories / follow / speed` | 必填，各 0–2 的倍率；speed 另為 0.25–2。0 關閉對應局部強度，但不代表關閉所有控制點呼吸與人形動作。 |
| `pose.headCenter` | 0–1，頭部水平中心 X，不是頭部的 Y 座標。 |
| `pose.headBounds` | [startY, endY]，各 0–1 且 start < end；頭部作用在 start 上方最強，到 end 逐漸降為 0。 |
| `pose.headHorizontal` | [inner, outer]，各 0–1 且 inner < outer；代表距 headCenter 的水平距離，不是左右邊界 X。 |
| `pose.headWarpBounds` | 可省略的 [topY, bottomY]，各 0–1 且 top < bottom；依新原畫頭部位置調整局部變形。省略時保留 既有 v1 動作。舊版 runtime 可能忽略此欄位，需重新 build／安裝套件。 |
| `pose.bodyBounds` | [startY, endY]，各 0–1 且 start < end；身體傾斜作用由上向下淡出。 |
| `pose.bodyPivot / swayPivot` | 各為 [x, y]，值 0–1；分別是身體傾斜與整體待機搖擺的旋轉支點。 |

## 常見錯誤與處理

### Invalid rig model / SyntaxError

validateModel 同步拋出。依訊息檢查版本、缺漏欄位、範圍、重複 name／hair id、未知 parent、循環或零長度鏈；JSON.parse 的語法錯誤需另外捕捉。

### Unable to load texture / Texture load timed out / AbortError

檢查 texture.src、404、CORS 與網路；載入逾時為 20 秒。請求取消的 AbortError 在卸載時可忽略。

### Texture dimensions do not match the model

重新量測原圖 naturalWidth／naturalHeight 並更新 texture；CSS 放大或縮小不能修正此錯誤。

### WebGL is unavailable

保留原圖備援並提示使用者；檢查瀏覽器 WebGL 與圖形加速支援。

### Unknown pin / Invalid parameter

setPin 的 name 必須存在；setParameter 使用 lookX／lookY／bodyX／wave 與有限數值；其他動態與控制點範圍依規格檢查。

### 驗證通過但動錯位置

這是綁定問題。檢查完整原圖座標、headHorizontal 的距離語意、父節點順序與沿用的人形動作；動物／不同結構需修改引擎動作綁定。

## 多部位區域與頭部跟隨（選配擴充）

已實作 `parts?: DeformationPart[]`、`motion.parts` 與 `pose.headFollow`，保留原有 version:1 模型及 數值基準行為。完整欄位、驗證範圍、可用 API 與真正分層的能力界線，見 [多部位與分層協定](./parts-and-layers.zh-TW.md)。parts 仍是共用原畫上的變形區域；獨立 v2 schema 已實作，使用方式見 [v2 分層引擎](layered-engine.zh-TW.md)。

目前官網與遊樂場使用 `@z7589xxz758/yuragi/mirea` 的 `createMireaModel()` 展示局部部件、剛性區域與有界追蹤；舊 Momo 工廠及素材已移除。自製角色的 Python 分析可用 `regions[].binding` 產生 surfaceRegions、`regions[].deformation` 產生 parts；裁片、遮罩、來源矩形與根／中／末端作者資料由 parts-manifest.json 管理。請閱讀 [完整部件 API 與分層邊界](parts-and-layers.zh-TW.md)。硬物與握柄手共用附件錨點，柔性飄帶獨立標註，不能因裁出圖片就推定已完成獨立圖層或 Live2D 綁定。

既有部件可用 `player.setPart(id, patch)` 即時修改 root/tip、polygon/exclusions、彈性和 channel；先完整驗證再更新，重建綁定但重用 GPU buffers。該部件彈簧歸零，不新增動畫循環。getModel() 包含變更；新增／刪除部件、修改 surfaceRegions 或 tracking 仍需重建播放器。

頭頸模式使用 pose.headFollow.region/feather、neck.polygon/base/feather 與 tracking.bodyFollow。以單一頭部旋轉／平移取代頭部圖釘 warp，脖子平順接到身體。Python 的 headMotion 根據已審核區域與 landmark 產生設定；瀏海與細分四肢仍是可見素材。姿勢設定修改後需重建播放器並校準傘與頭的間距。


## 飄逸追蹤（已實作）

用 player.setTracking({ response: .05425, damping: .757, maxVelocity: 2.72, bodyFollow: 0, translation: [.06,.04] }) 即時調整慣性與整體漂移，不必重建播放器。translation 各軸限制 0–.08，依完整原圖座標計算；所有頂點等量平移，不增加局部拉伸。setPointer 使用舞台中心為 (0,0) 的方向／比例，不會把角色瞬移到游標。

有 tracking 的模型依經過時間整合半參考 tick，30／60／120 Hz 具有一致的參數反應；暫停後最多補進 50ms。沒有 tracking 的既有模型保留原行為。followY 是部件可選的 -2–2 垂直慣性回應，搭配各髮束／布料的 stiffness 與 damping。trackingOffset 是低頻快照中的整体漂移，減少動態時為零；局部梯度診斷不包含等量平移。

[眼神與曲線 API](face-and-animation.zh-TW.md) 說明目前能力；[分層引擎研究](layered-engine-research.zh-TW.md) 說明分層實作與後續限制。

## 0.2.0 眼神與分階段製作

先讀取 yuragi-rig-spec，再 inspect 量測原圖、Agent 看圖標註、extract 拆件、build --prepared --rig-package 驗證並建立互動預覽。Python 不會啟動 Skill。角色設計與素材製作由 yuragi-character 負責。

face 僅包含左右眼量測；setGaze 控制 −1…1 方向，setGazeStrength 控制 0–1 強度（預設 1）。眼皮與嘴巴保留原畫。舊表情接口已移除，舊資料用 migrate_gaze.py 另存轉換結果並驗證。

partsExtracted、modelValidation 與 visualAcceptance 是不同階段。可提供畫師補圖及來源紀錄；此流程仍輸出 v1 完整原圖；獨立附件需另外使用 v2 build_layers.py 建置。

詳細契約見 [Python 製作指南](../skills/yuragi-rig-spec/references/character-preparation.md)、[眼神與海月案例](../skills/yuragi-rig-spec/references/eye-tracking.md)、[API 參考](../skills/yuragi-rig-spec/references/api-reference.md)。

## 套件範例素材

主要範例改為海月：複製 assets/mirea 到 public/models/mirea，從 @z7589xxz758/yuragi/mirea 匯入 createMireaModel。starter 保留作新原圖的範本。不能只換圖片就套用任一範例的綁定。


## Independent layered v2

The existing preparation workflow still builds v1 shared-surface models. Independent attachments now use the separate `LayeredModel` / `createLayeredPlayer` contract and `build_layers.py` authoring compiler. See [the v2 guide](layered-engine.zh-TW.md). Visible extracts require completed occluded artwork before full visual acceptance; prototype mode does not supply those pixels.
