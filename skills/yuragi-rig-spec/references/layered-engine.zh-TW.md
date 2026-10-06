# v2 分層引擎

2026-10-04：本機已實作獨立附件播放器、父子節點、稀疏權重、共享接點、局部彈簧、圖集批次與靜態 alpha 遮罩。v1 `RigModel` / `createPlayer` 與 既有 v1 動作維持原路徑。未發布或部署。

## 使用

先在 Yuragi 執行 `npm run build:lib`，在另一個專案執行 `npm install /path/to/yuragi/packages/rig`。v2 型別與函式由主入口匯出；框架元件分別由 Vue / React 入口匯出，不共用框架依賴。

```ts
import { createLayeredPlayer, validateLayeredModel } from '@z7589xxz758/yuragi'
const model: unknown = await fetch('/models/my-character/model.json').then(r => r.json())
validateLayeredModel(model)
// src 與 fallback 由呼叫者解析為可載入的 URL；JSON 中的相對路徑不會自動以 JSON URL 為基準。
model.source.fallback = '/models/my-character/' + model.source.fallback
model.atlases.forEach(a => { a.src = '/models/my-character/' + a.src })
const controller = new AbortController()
const player = await createLayeredPlayer({ canvas, model, signal: controller.signal })
player.setPointer(.5, -.2) // 每軸中心座標 −.5… .5，輸入會限幅
player.pause()
player.reset() // 中立姿態；暫停後檢查，避免下一幀重新加入風力
player.getSnapshot() // 低頻 UI 指標；不是动画時鐘
controller.abort() // 也可 player.destroy()；可重複清理
```

原生 canvas 保持來源長寬比，四側各保留 12% 動態空間（與 v1 相同）。WebGL / 載入失敗時，原生整合自行顯示 `source.fallback`。`YuragiLayeredCharacter` 元件會自動顯示備援圖、在 mount 後建立播放器、取消過期載入並處理卸載。

```vue
<script setup lang="ts">
import { YuragiLayeredCharacter } from '@z7589xxz758/yuragi/vue'
import type { LayeredModel, LayeredPlayer } from '@z7589xxz758/yuragi'
defineProps<{ model: LayeredModel }>()
let player: LayeredPlayer | undefined
</script>
<template>
  <YuragiLayeredCharacter :model="model" @ready="player = $event" />
</template>
```

React 使用 `import { YuragiLayeredCharacter } from '@z7589xxz758/yuragi/react'`，提供 `onReady`、`onFrame`、`onError` 與 ref.getPlayer。v2 沒有 v1 的 gaze / 動畫 / pin APIs；兩種模型不可互傳。重排附件、改權重、遮罩、素材或節點時驗證並重建播放器。

## 格式

完整型別：`packages/rig/src/layered-types.ts`，安裝 Skill 後見 `references/layered-api-types.ts`。

| 欄位 | 契約 |
| --- | --- |
| version / renderer | 固定 `2` / `layered`，與 v1 明確分開 |
| source | 原圖寬高（各 1–8192）、SHA-256 與完整備援圖 |
| atlases | 1–8 頁，各不超過 4096px，RGBA 解碼總預算 128 MiB；載入時另查 GPU 尺寸限制 |
| nodes | 1–256 個，父節點先列；pivot 為完整來源 0–1，rotation 為弧度，translation 為來源比例，每軸 ±.25；response 是 1–5000ms 指數收斂時間 |
| spring | 局部角度上限 0–.5、stiffness .001–1、damping 0–.9999、wind ±5、phase ±100；根部應綁父節點，末端才逐步綁 spring 節點 |
| joints | 最多 4096 個共享接點；引用者的座標和權重必須與接點完全相同 |
| attachments | 1–128 件，陣列順序即繪製順序；每件明確記錄 coverage 與 provenance |
| rect / bounds | rect 是圖集像素 `[x,y,width,height]`；bounds 是原圖正規化 `[left,top,right,bottom]`，對應裁片位置，UV 由兩者計算 |
| vertices / triangles | 全來源座標的局部網格、三角形索引；總頂點最多 65535，總三角形最多 131070 |
| weights | 每頂點 1–4 個不同節點的正值權重，總和為 1；編譯為 CSR typed arrays |
| mask | 選配，同一圖集中的靜態 alpha 圖矩形，對齊附件 bounds，隨網格一起變形；最多一個遮罩／附件，沒有巢狀遮罩或跨附件動態 stencil |
| opacity | 0–1，預設 1；預乘 alpha 合成 |

同硬物組的每個頂點綁同一節點，共用一個矩陣。父子變換在來源寬度座標系計算，Y 依來源長寬比修正。局部網格只在節點狀態變更時更新；GPU 緩衝區與 uniform 位置重用。只有連續且 atlas、mask 使用狀態、opacity 相同的附件合批，絕不為少一次 draw call 改變遮擋順序。遮罩使用同一圖集的另一組 UV，不增加獨立 texture sampler。

## Python 建置

`build_layers.py` 與舊 `prepare_character.py` 分開。輸入必須是明確作者資料 `version:2 / renderer:layered-authoring`，不可直接把 v1 parts-manifest 傳入。

```sh
python skills/yuragi-rig-spec/scripts/build_layers.py my-character/manifest.json \
  --output my-character/runtime-v1 --rig-package packages/rig \
  --atlas-size 2048 --max-prune-error .25
```

Python 需 Pillow；Node 需已建置的本機 `@z7589xxz758/yuragi`。原图 hash、尺寸與裁片來源位置均須吻合；輸出目錄必須空白。可見裁片預設拒絕，只有明確 `--allow-visible-only` 才輸出 prototype。這個旗標不代表補圖完成或視覺驗收通过。

作者 manifest 範例見 `artifacts/layered-engine/authoring/manifest.json`。`source` 指定 file、size、sha256；nodes 同 runtime；attachments 指定 image、boundsPixels、coverage、provenance、node、mesh `[columns,rows]`。選配 `flex: { root, tip, node }` 以根到末端進度產生平滑的雙節點權重；需要高密度局部網格或共享接點時直接提供 vertices、triangles、joints。圖片必須是已裁至 boundsPixels 的 RGBA，補圖由作者另行提供並註明來源。mask 必須以 alpha 表示，RGB 顏色不作遮罩值。

工具產生帶兩像素外擴邊界的圖集、稀疏正規化權重、fallback、model、neutral.png 和 report.json。超過四個權重時裁減小權重，以完整父鏈角度／位移包絡估算保守像素誤差；超過誤差預算就拒絕。所有模型交由實際 runtime `validateLayeredModel` 驗證，再於九個游標位置檢查網格方向與共享接點；發現取樣翻折就拒絕。取樣不代表所有素材遮擋已通過視覺驗收。成功後才寫入輸出。

## 驗收與範圍

海月範例只有可見像素，三件附件分別是原圖剩餘表面、髮尾、持傘組。持傘手與傘跟隨同一 whole 節點；髮尾根部跟父節點、末端跟 spring。完整遮擋補圖尚未提供，因此不宣稱大幅分離時無露洞。

離線中立合成的預乘 RGBA 最大通道誤差為 0；這是來源尺寸下的素材還原，不等於所有瀏覽器縮放後逐像素相等。瀏覽器預覽在文件的眼睛追蹤章節，提供播放、暫停、中立與鍵盤控制；draw calls、頂點、三角形、RGBA 圖集記憶體與 CPU 更新／提交時間由實際播放器回報。GPU 完成時間、實體手機、不同 GPU 與完整補圖的極值畫面未測。

新增測試涵蓋共享接點、剛性距離、彈簧限幅、權重與圖集驗證、批次顺序、mask／opacity 提交、低頻快照、暫停編輯、減少動態、取消載入與資源釋放。數值 baseline 仍須通過。

仍未實作：IK、骨骼約束求解、Spine 匯入、多動畫混合、任意動態遮罩與大角度轉身。分層渲染提供繪製與綁定基礎，素材完整性仍是作者需求。

## 選用的瀏海、網格與眼嘴

`hairGroups` 設定兄弟彈簧節點的聯動及限幅；未設定的模型維持舊行為。Python `refine` 在量測區域加入局部網格列／欄，`pruneTransparent` 移除透明格；跨附件接縫仍使用明確共享 joints。

既有 v2 模型的眼嘴附件與 `setFace` 仍保留格式相容性。官網與 Studio 的主要預覽改採原圖眼神滑鼠追蹤，不提供補眼白、眨眼與嘴型切換入口，也不把這些附件列為素材需求。v1 使用 `setGaze`／`setGazeStrength`，保留原本的眼線、眼皮與嘴巴。

Studio 依實際能力顯示測試。完整製作契約見 `skills/yuragi-rig-spec/references/layered-authoring.md`。Mirea 不因引擎新增功能而自動具備閉眼、眼皮底圖或嘴型素材。
