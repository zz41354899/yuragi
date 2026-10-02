# Yuragi · ゆらぎ

讓插畫輕輕動起來。從 Kirameki Catch 的 Momo 系統抽出的 TypeScript library，附帶 Vue 文件網站、React／Vue 包裝與骨架遊樂場。

## 開啟專案

需要 Node.js 22.12 以上版本與 npm。

```sh
npm install
npm run dev
```

網站預設位址：<http://127.0.0.1:4310>

- `/`：首頁與 Momo 即時展示。
- `/docs`：安裝、自製角色完整流程、Vue 主指南、React、原生 JavaScript 與完整播放器 API。
- `/docs?section=custom-character`：準備圖片 → 建立模型 → 綁定控制點 → 預覽驗證 → Vue／React 載入，以及完整欄位規格與錯誤說明。
- `/docs?section=skills`：Yuragi Skills 的安裝、角色設計與動態 spec 流程。
- `/playground`：大畫布、浮動工具、右側參數面板，支援拖曳圖釘、方向鍵微調、50–300% 縮放與模型 JSON 匯入；不提供模型下載／匯出。
- `/docs?section=component&framework=vue`：完整 Vue 整合、props、事件、ref、SSR 與清理說明。
- `/docs?section=component&framework=react`：對應 React API 與實際掛載的 Strict Mode 範例。
- `/docs?section=api&framework=react`：可用頁首選單切換 Vue／React；兩者共用 RigPlayer 方法。

遊樂場的縮放／平移只改變視圖，不會改寫模型座標。選取「編輯圖釘」後拖曳，或用方向鍵每次移動 0.001（Shift 為 0.01）；拖曳時暫停動畫，放開後恢復原本的播放狀態。「重設視圖」保留骨架修改，「還原預設」則還原 Momo 模型。此編輯器仍只支援既有 Momo 圖片，不會替任意新圖片自動綁定。

網站字體採本機提供的 Adobe Source Han Sans TW（思源黑體繁中）；日文使用 Source Han Sans JP。字體來源與 OFL 授權在 `apps/site/public/fonts/`。

## 專案結構

```text
packages/rig/
  src/
    types.ts          公開模型與播放器型別
    momo.ts           Momo 的原圖尺寸、骨架與局部動態設定
    simulation.ts     框架無關的控制點與網格計算
    hair.ts           頭髮彈性與網格綁定
    accessories.ts    耳朵、緞帶與配件跟隨
    sway.ts           待機搖擺
    validation.ts     外部模型資料驗證
    player.ts         WebGL、時間與資源管理
    vue.ts            Vue 3 包裝
    react.tsx         React 18／19 包裝
  test/               原始 Momo 動作比對、網格與框架 SSR 測試
apps/site/
  src/pages/          首頁、文件、遊樂場
  public/models/momo/ 網站展示用 Momo 原畫，不提供模型 JSON
artifacts/
  yuragi-rig-0.1.0.tgz 獨立套件安裝包
  momo-model.zip      圖片與模型包
  qa/                瀏覽器驗證截圖與交付記錄
```

## 在另一個專案安裝

目前尚未發布到 npm。先在 Yuragi 執行 `npm run build:lib`，再從本機套件目錄安裝：

```sh
npm install /path/to/yuragi/packages/rig
```

模型與圖片隨套件的 `assets/` 目錄提供。把 `node_modules/@yuragi/rig/assets/momo` 複製到目標網站的 `public/models/momo`。人形起始模型位於 `assets/starter/model.json`；網站不再提供獨立 JSON、模型包或套件包下載。未來正式發布後才可執行 `npm install @yuragi/rig`，目前不能宣稱 npm 已可安裝。

### Vue（主要使用方式）

```vue
<script setup lang="ts">
import { createMomoModel, type RigPlayer } from '@yuragi/rig'
import { YuragiCharacter } from '@yuragi/rig/vue'

const model = createMomoModel('/models/momo/texture.webp')
let player: RigPlayer | undefined
</script>

<template>
  <div style="width: 320px">
    <YuragiCharacter :model="model" @ready="instance => player = instance" />
  </div>
  <button @click="player?.wave()">打個招呼</button>
</template>
```

### React

```tsx
import { useMemo, useRef } from 'react'
import { createMomoModel, type RigPlayer } from '@yuragi/rig'
import { YuragiCharacter } from '@yuragi/rig/react'

export function Character() {
  const model = useMemo(() => createMomoModel('/models/momo/texture.webp'), [])
  const player = useRef<RigPlayer | null>(null)

  return <>
    <div style={{ width: 320 }}>
      <YuragiCharacter model={model} onReady={instance => { player.current = instance }} />
    </div>
    <button onClick={() => player.current?.wave()}>打個招呼</button>
  </>
}
```

### 原生 TypeScript

```ts
import { createPlayer, createMomoModel } from '@yuragi/rig'

const player = await createPlayer({
  canvas: document.querySelector<HTMLCanvasElement>('#momo')!,
  model: createMomoModel('/models/momo/texture.webp'),
})
player.setMotion({ sway: .8, hair: 1.2 })
player.setPin('head-root', { radius: .2 })
player.wave()
// 離開畫面時
player.destroy()
```

原生 Canvas 的容器保持圖片比例，canvas 放大至 124%，left 與 top 設為 -12%，提供動態 overscan 空間。Vue 與 React 包裝已經處理。

## 調整與模型資產

第一次製作自己的角色，請從 [完整繁體中文指南](docs/custom-character.zh-TW.md) 開始。安裝套件後，從 `node_modules/@yuragi/rig/assets/starter/model.json` 複製起始模型。起始模型不含圖片，座標是示意值，必須依原圖重新綁定。目前網站遊樂場專門編輯 Momo，不適合驗證其他圖片的模型綁定。

「可以擴充」不等於「任何圖片都能自動套用」。類似 Momo 的人形角色最容易延伸；動物、四足、翅膀或不同結構需要擴充引擎動作綁定。

遊樂場可調整待機幅度、速度、頭髮、配件與游標影響。選取骨架控制點後，可修改位置、半徑與彈性參數並即時預覽。網站不提供 JSON 匯出／下載；在自己安裝的套件中，仍可使用 `player.getModel()` 處理自己的模型資料。

`reset()` 恢復中立姿態，保留模型編輯；遊樂場的「還原預設」則恢復完整 Momo 預設。

`model.json` 的 texture.src 預設為 `/models/momo/texture.webp`。搬到其他路徑時，請同步更新來源。跨來源圖片需要圖片服務提供 CORS。

## Yuragi Skills

同一個 Yuragi 專案提供兩個可一起安裝、也可分開使用的 skill：

- [`yuragi-character`](skills/yuragi-character/SKILL.md)：由 Kirameki Catch 的 Idol Bloom 搬入並以 Yuragi 重新命名，從零設計角色或延伸素材，交付角色基準與 `character-brief.md`。
- [`yuragi-rig-spec`](skills/yuragi-rig-spec/SKILL.md)：AI 判讀既有原畫，使用本機 Python 輔助工具產出可見部位、綁定、`model.json`、`rig-spec.md` 與實際 API 播放預覽；也支援只寫 spec。

在要使用 AI 的目標專案目錄安裝（把路徑換成取得的 Yuragi checkout）：

```sh
npx skills add /path/to/yuragi --skill yuragi-character yuragi-rig-spec
```

已有角色時可只安裝 `--skill yuragi-rig-spec`。使用 `$yuragi-character` 建立角色基準，再把摘要與實際原畫交給 `$yuragi-rig-spec`；已完成角色可直接從第二步開始。兩份 skill 與所有隨附指南均以英文撰寫，接受各種語言 Prompt 並以使用者的語言回答。安裝 skill 不會安裝播放器 library 或生成圖片。

轉換流程是 AI 看圖與選動作 → Python 量測與依註記抽取可見部位 → 綁定模型 → 本機 Yuragi API 播放 → 視覺檢查與修正。工具不會自己識別人體或補回被遮住的像素；非人形／不確定造型使用保守整體微動，不適合或持道具的手臂不啟用揮手。

Python 3.10+ 與 Pillow 安裝及操作見 [preparation workflow](skills/yuragi-rig-spec/references/character-preparation.md)。使用 `--rig-package` 指向已建置／安裝的本機 library，產生可透過 HTTP 開啟的 `preview.html`。產出資料仍需呼叫 validateModel 並檢查實際動態。新增的可選 `pose.headWarpBounds` 對應不同角色的頭部位置，省略時保留 Momo 原始變形。

網站提供 `/.well-known/skills/index.json` 與完整 skill 資源供官方 [Skills CLI](https://github.com/vercel-labs/skills) 發現。本機伺服器開啟時也可測試：

```sh
npx skills add http://127.0.0.1:4310 --skill yuragi-character yuragi-rig-spec
```

網址 port 以 dev server 實際輸出為準。公開網站後，在安裝指令換成該網站的 origin；文件頁會依目前網址顯示指令。現在沒有設定 Git remote，也尚未公開網站，不能宣稱其他人已可從公開網址安裝。

`skills/` 是唯一編輯來源。`npm run sync:skills` 同步 rig 型別、完整角色指南與 starter，並建立網站的 skill 分發目錄；網站 dev、test、build 都會先執行。分發包含英文工作文件、Python 工具與示意模型，不包含 Momo 原畫或 runtime 套件。變更 API 時也須更新 `skills/yuragi-rig-spec/references/api-reference.md` 的行為說明。

## 驗證與打包

```sh
npm run typecheck
npm test
npm run build
npm run pack:lib
npm run preview
```

核心測試使用原始 Momo 系統產生的資料比對：游標反轉、揮手與預設變形；Python 工具測試：安裝 Pillow 後執行 `python3 -m unittest discover -s scripts/tests -v`。

另外檢查待機幅度、三角形方向、設定上限與不合法資料。Vue／React 包裝也有 SSR 測試。

`npm run pack:lib` 產生獨立 ESM 套件，含 TypeScript declarations、`assets/momo` 與 `assets/starter`。安裝包只留在本機 `artifacts/`，不要放回網站的 public 目錄；這個指令不會發布 npm。

## 目前範圍

- 角色模型已抽成資料，動態核心可以與自訂渲染器配合。
- v0.1 仍使用 Momo 的人形控制點語意名稱來驅動轉頭與揮手。新角色需要調整自己的圖片尺寸、座標、姿態區域與頭髮／配件綁定。
- 單張圖片的網格變形適合小幅姿態與局部跟隨。眨眼、嘴型、大角度轉身與遮擋切換尚未實作。
- 本版沒有 MCP server、Plugin 或外部 AI API；由使用 skill 的 AI 看圖判讀，本機 Python 工具不內建語意辨識模型。
- 未部署網站、未發布 npm 套件；原 Kirameki Catch 專案保留。

## 設計參考

- [hololive 官方網站](https://hololive.hololivepro.com/)：清亮青藍色與白底的配色方向。Yuragi 使用原創英文字標、Y 形搖擺線條標記與 Momo 原素材。

- [CLIP STUDIO PAINT 日本官網](https://www.clipstudio.net/ja/)：角色主視覺、明確的試用入口與創作導向介紹。
- [ibisPaint](https://ibispaint.com/)：作品與創作者內容優先的呈現。

Yuragi 採用自己的排版、色彩與 Momo 原素材，沒有搬用參考網站的圖片或程式碼。

## 網站語系

網站使用 Vue I18n 11，提供完整繁體中文、英文、日文文案，首次開啟預設為繁體中文。右上角語言選單會保留選擇；頁面標題、HTML lang、替代文字與程式碼註解同步更新。也可透過 `?lang=zh-TW`、`?lang=en`、`?lang=ja` 分享指定語系。語系資源位於 `apps/site/src/i18n/`。
