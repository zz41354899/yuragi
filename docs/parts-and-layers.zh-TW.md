# Yuragi 多部位動態與分層協定

狀態：`parts`、`motion.parts`、`pose.headFollow` 已在本機 TypeScript 引擎實作。獨立 v2 分層播放器也已實作，使用另一個模型與 API，現有 createPlayer 仍只接受 `version: 1`。本次未發布 npm。

## 目前可運行的多部位模型

海月沙盒目前使用 25 個局部彈簧區域：12 束頭髮、6 塊袖口／裙片、5 條飄帶、1 個吊飾與自由手臂。原畫像素保持不變，每個區域獨立計算彈簧狀態，但仍在同一張連續網格上繪製。

這能改善不同材質同時僵硬移動的問題，也避免切開原畫後露洞、重複邊緣。它不是完整圖層分離；重疊的頭髮、衣料仍共用原畫可見像素，因此適合小幅到中幅變形。

```ts
import type { DeformationPart, RigModel } from '@yuragi/rig'

const sleeve: DeformationPart = {
  id: 'sleeve-left', name: '左袖薄紗', kind: 'cloth',
  polygon: [[.36,.28], [.44,.28], [.46,.37], [.36,.37]],
  root: [.40,.28], tip: [.41,.36],
  feather: .025, rotation: .045,
  stiffness: .052, damping: .90,
  phase: 1.4, wind: .65, follow: .75,
}
// 對現有、已驗證的 model 增加此部位：
const updated: RigModel = {
  ...model, parts: [sleeve],
  motion: { ...model.motion, parts: 1, follow: .95 },
  pose: { ...model.pose, headFollow: {
    rotation: .10, translation: [.011, .009],
  } },
}
```

上例座標只是範例，必須對實際角色重新標註。`headFollow` 使用現有 headCenter、headBounds、headHorizontal 定義羽化範圍；頭部使用像素長寬比修正後的旋轉和平移，取代舊的頭部壓縮公式。未提供新欄位時，既有模型維持原行為。

| 欄位 | 意義／範圍 |
| --- | --- |
| parts | 選配，0–64 個區域；id 必須非空且唯一 |
| kind | hair / cloth / ribbon / accessory，材質標籤；實際響應由以下數值決定 |
| polygon | 3–32 個頂點，整張原圖的 0–1 座標；不可自交、零面積或有零長邊 |
| root / tip | 同一座標系；根部局部位移為零，沿 root→tip 漸增；兩者不能相同 |
| feather | 遮罩內緣的羽化距離，以原图寬度為單位，Y 依圖片比例修正；0.002–0.2 |
| rotation | 最大彈簧轉角，弧度，0–0.35 |
| stiffness / damping | 0.001–1；剛性與每個參考幀的速度保留率 |
| phase | 風力相位，-100–100 |
| wind | 風力响应，0–2 |
| follow | 視線與轉向速度的慣性响应，-2–2；正值呈現拖尾，負值反向 |
| motion.parts | 所有部位的位移倍率，0–2，未提供為 1；0 關閉此類動態 |
| headFollow.rotation | lookX 在 ±30 時的最大頭部轉角，0–0.3 弧度 |
| headFollow.translation | lookX/lookY 在極值時的 X/Y 平移幅度，各 0–0.08 |

綁定預先計算為稀疏權重；重疊部位正規化，臉部保護區抑制局部變形。遮罩邊界不動，部位根部不額外位移。各部位在引擎內以固定子步進計算慣性；共同網格仍由梯度保護避免翻折。`motion.parts` 是最後的位移倍率，不擴大 spring.rotation 的狀態上限。

現在可用的 API：

```ts
player.setPointer(.5, -.2)   // centered coordinates; recommended -0.5…0.5
player.setMotion({ follow: 1.1, parts: 1.2 })
player.setMotion({ parts: 0 })
player.getSnapshot().parts   // [{ id, rotation }]; reduced motion reports zero
```

`getModel()` 回傳複本。新增／刪除部件時需驗證新模型並重建 player；修改既有部件可用 setPart(id, patch)，即時驗證並重算綁定。尚無 setLayer 或骨架 IK API。Vue 與 React adapters 都透過同一核心模型接受這些選配欄位。載入時取消、静態 fallback、SSR-safe 核心匯入、低頻快照與 destroy 仍由現有契約處理。

## 已實作的 v2 分層協定

獨立 `LayeredModel` 使用 `createLayeredPlayer`、`validateLayeredModel` 與 `YuragiLayeredCharacter`。父子節點、共享接點、稀疏網格、圖集與靜態 alpha 遮罩已實作；v1 的 createPlayer 仍只接受 RigModel。完整契約、Python 建置和驗收限制見 [v2 分層引擎](layered-engine.zh-TW.md)。

## 水母公主下一階段的素材需求

推薦先做 20–30 個可控圖層，再依實際動作細分；不是單純把裁片數量加到最多。

- 後髮／側髮／前髮：每側幾束，各自根部、2–5 節鏈；补全髮束後面的脖子、肩膀與其他髮絲。
- 皮膚／軀幹／手臂：握傘手、垂下手分開，但須補齊袖子遮住的手臂與接合處；手與傘柄用約束保持接觸。
- 傘：傘蓋、傘骨／柄、左右與中間飄帶、晶飾；分开繪製順序，傘柄維持剛性。
- 衣服：上衣、腰蝴蝶結、左右袖、前後裙片、蕾絲、長飄帶；补齊裙片互相遮挡的內層。
- 臉：眼白／眼球、上下眼皮、睫毛與嘴型需額外素材；v1 支援瞳孔平移；v2 可繪製作者提供的獨立附件，眼皮／嘴型參數仍未實作。

驗收必須包含：中立姿勢重建原圖、極端參數下無露洞／重複線／切邊、遮擋順序正確、握傘接點穩定、減少動態下正確合成、取消多圖載入及資源清理。單純裁出可見像素，只能作為 authoring 輔助素材，不能通過完整分層模型驗收。

## 本次可用的物件保護 API

官網、遊樂場與框架整合範例使用 `@yuragi/rig/mirea` 的 `createMireaModel(src)`，回傳具有局部部件、剛性區域和有界追蹤的 v1 RigModel。

```ts
import { validateModel } from '@yuragi/rig'
import { createMireaModel } from '@yuragi/rig/mirea'
const model = createMireaModel('/models/mirea/texture.png')
model.tracking = { response: .024, damping: .65, maxVelocity: 1.8 }
// 對實際握傘角色標註；不可直接套用其他角色的綁定：
model.surfaceRegions = [{
  id: 'umbrella', mode: 'rigid',
  polygon: [[.1,.1],[.3,.1],[.3,.4],[.1,.4]],
  feather: .08, anchor: 'wrist-left', rotation: 'body',
}]
validateModel(model)
```

`surfaceRegions` 最多 64 個，polygon 3–32 頂點、簡單不自交。`weighted` 必須列出唯一且存在的 pins；只篩選關節位移，頭／身體姿態仍保留，`secondary:false` 可排除局部髮絲／配件／parts。`rigid` 不接受 pins，使用存在的 anchor；省略 anchor 使用身體 pivot，`rotation:none/head/body` 決定姿態來源。傘蓋、傘柄和握柄手共用錨點與旋轉來源，飄帶另設 parts。

feather 在多邊形外緣，範圍 .002–.2；完全位於內部的頂點受到完整保護，其他部件的羽化不會稀釋此保護。多個內部重疊時後項優先；相衝突的硬物遮罩需重畫。全域梯度保護啟動時仍可能縮幅並影響剛性，不保證任意幅度都維持無拉扯。

tracking.response 為 .001–.2、damping .1–.98、maxVelocity .1–5（每參考 tick 的參數單位）；有界追蹤限制 lookX/lookY 在 ±30。part.channel 可使用 hair/accessories，額外乘上該動態控制；未提供只用 motion.parts。headFollow 搭配 headWarpBounds 時，也向上羽化，避免頭部影響延伸到遠處留白或道具。

Python `regions` 現在可包含角色部位 role、parent、root/tip、可選 chain、binding 及 deformation。binding 產生 surfaceRegions，deformation 產生 parts；不能同時使用舊髮絲鏈與新 polygon 彈簧，以免重複拉扯。`outline` 可另外給最多 512 點的精細拆圖輪廓。產出 full-canvas PNG、cropped PNG、mask、boundsPixels 與 parts-manifest.json。chain 的根／中／末端是作者編輯資料，尚不是自動多節 IK。

水母公主目前拆出 54 件可見素材，包含頭／臉／脖子／頭飾、六束瀏海、肩與上下臂、可見手指群、左右大腿／膝／小腿／腳踝／鞋後段／鞋尖，以及服裝、飄帶、吊飾與雨傘結構；存於 `artifacts/mirea-sandbox/prepared/parts`。所有素材標為 visible-only，需要補齊遮擋區才適合独立分層播放。拆圖不是已完成的 Live2D 模型。

`parts[].exclusions` 可指定最多 16 個排除多邊形，防止髮束或裙片順帶拖動皮膚、手或道具；排除區內完全停用該部件的柔性位移，外緣依 part.feather 漸變。Python 使用 `regions[].subtract` 引用其他 region IDs，同時輸出扣除鄰接物件的 PNG 遮罩與 runtime exclusions。來源像素不重畫，parts-contact-sheet.png 可檢查實際裁片。

既有部件可用 `player.setPart(id, patch)` 即時修改 root/tip、polygon/exclusions、彈性和 channel；先完整驗證再更新，重建綁定但重用 GPU buffers。該部件彈簧歸零，不新增動畫循環。getModel() 包含變更；新增／刪除部件、修改 surfaceRegions 或 tracking 仍需重建播放器。

## 頭頸追蹤修正

`pose.headFollow.region/feather` 定義完整頭部的原圖範圍，以 head-root 為接點共用一個旋轉／平移。啟用後，頭部圖釘的 Gaussian 位移不再混入軀幹，也不疊加舊頭部 warp。`headFollow.neck` 用 polygon/base/feather 將上端接到頭部、下端留在身體；`tracking.bodyFollow: 0` 讓游標只帶動頭部。這些仍是連續網格，需校準傘與頭的間距、幅度和羽化，避免觸發全網格保護。

Python 的 `headMotion` 讀取審核過的 head/neck 區域與 neck-base landmark，產生上述 API。素材拆圖與頭部動態範圍分開：父頭部圖可以扣除子瀏海，不能反過來把整個頭部保護遮罩扣掉瀏海。腳本亦支援 face/neck/bangs/shoulder/upper-arm/forearm/finger/thigh/knee/shin/ankle/heel/toe 等細分類；inspect 輸出 annotation-guide.json，讓 AI 依可見結構標註。


## 飄逸追蹤（已實作）

用 player.setTracking({ response: .05425, damping: .757, maxVelocity: 2.72, bodyFollow: 0, translation: [.06,.04] }) 即時調整慣性與整體漂移，不必重建播放器。translation 各軸限制 0–.08，依完整原圖座標計算；所有頂點等量平移，不增加局部拉伸。setPointer 使用舞台中心為 (0,0) 的方向／比例，不會把角色瞬移到游標。

有 tracking 的模型依經過時間整合半參考 tick，30／60／120 Hz 具有一致的參數反應；暫停後最多補進 50ms。沒有 tracking 的既有模型保留原行為。followY 是部件可選的 -2–2 垂直慣性回應，搭配各髮束／布料的 stiffness 與 damping。trackingOffset 是低頻快照中的整体漂移，減少動態時為零；局部梯度診斷不包含等量平移。

[曲線與後續骨骼設計](spine-style-animation.zh-TW.md)列出後续動畫與 IK 設計，分層附件基礎已由 v2 實作；目前已有參數與眼神時間軸；這些仍需要完整素材與引擎工作。

## 已實作的臉部與曲線 API

`face`、`setGaze`、`setGazeStrength` 和 parameter／gaze.strength／motion.weight 的 `playAnimation/pauseAnimation/seekAnimation/stopAnimation` 已在本機 0.2.0 實作。這些不等於獨立分層骨架；任意骨骼、IK、動畫混合與 Spine 檔案匯入仍未實作。詳見 [欄位、範例與驗收](face-and-animation.zh-TW.md)。


## 游標部位位移群組（已實作）

`RigModel.pointerGroups` 讓多個可見區域共用同一個旋轉與位移，在局部髮束／衣料動態之後、整體 sway 與 tracking.translation 之前執行。每個群組有不同的收斂時間；共用剛性矩陣的區域內不使用頂點之間的旋轉插值，避免縮短腿或拉扯持傘接點。這仍是原圖網格，並非獨立圖層或骨架父子關係。

```ts
import type { PointerMotionGroup } from '@yuragi/rig'
const upper: PointerMotionGroup = {
  id: 'upper', name: '肩膀與持傘動作', pivot: [.58,.41],
  translation: [.008,.004], rotation: .014, response: 105,
  regions: [{ polygon: [[.2,.2],[.7,.2],[.7,.4],[.2,.4]], feather: .09 }],
}
// 座標必須按原畫重新審核；新增群組需重建 player。
model.pointerGroups = [upper]
player.setMotion({ layers: .5 }) // 即時角度／位移強度，0–1，預設 1
player.getSnapshot().pointerGroups // [{ id, offset: [x,y], rotation }]
```

最多 16 群組；每組 1–8 個簡單多邊形、外緣 feather .002–.2。同組多邊形以最大影響聯集，同一群組不重複加位移。完全在內部的頂點歸該組，內部重疊時後組優先；其餘邊緣正規化。pivot 為原圖 0–1 座標，translation 每軸 -.03–.03，rotation -.08–.08 弧度，response 16–1000ms。response 是指數收斂時間常數，群組跟隨已平滑的 lookX/lookY；不代表角色的總延遲。

群組狀態保留在引擎，UI 只讀低頻快照。減少動態時 offset／rotation 歸零，幾何回原圖；未提供 pointerGroups 的模型維持既有行為。setMotion({layers:0}) 關閉新增群組，既有 headFollow、局部 parts 與整體平移仍可保留。降低群組強度直接縮小角度及平移，不把旋轉矩陣與單位矩陣作線性混合。

海月的上半身、肩膀、持傘手臂、握傘手、傘柄與傘蓋共用一組；骨盆與交叉雙腿共用另一組，保留鞋子的比例。頭部另有 headFollow，瀏海等另有 parts。肩膀與持傘手臂的獨立彈簧已停用。任意大幅移動或相衝突的遮罩仍可能啟動梯度限幅；需測試實際模型，不能將此協定當作完整 Live2D 或 Spine 模型能力。
