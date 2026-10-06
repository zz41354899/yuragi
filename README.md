# Yuragi · ゆらぎ

**讓插畫輕輕動起來。**

Yuragi 是為網頁角色製作的 TypeScript 2D 動態工具。從待機搖擺、髮梢與衣料跟隨，到游標互動與眼神控制，把量測過的角色模型接到 Vue、React 或原生 JavaScript，保留插畫的原有風格。

專案包含動態引擎、以海月みれあ（Mirea）為主角的展示與文件網站、本機 Yuragi Studio，以及協助 AI 整理角色設計和模型製作流程的 Agent Skills。

目前套件版本為 `0.2.0`，以本機建置與安裝為主，尚未發布至 npm。

## 從哪裡開始

| 你的目標 | 入口 |
| --- | --- |
| 看海月動起來、調整互動效果 | 啟動網站，開啟 `/playground` |
| 把海月接到自己的網站 | [安裝套件](#安裝套件)與 [Vue 範例](#vue) |
| 製作自己的角色模型 | [自訂角色流程](#製作自己的角色) |
| 預覽與比較本機模型 | [Yuragi Studio](#yuragi-studio) |
| 查閱模型欄位與播放器方法 | 網站 `/docs/api` 或 [API 參考](skills/yuragi-rig-spec/references/api/index.md) |

## 啟動展示與文件網站

需要 Node.js 22.12 以上版本與 npm。在專案根目錄執行：

```sh
npm install
npm run dev
```

預設網址為 `http://127.0.0.1:4310`，實際位址以終端機輸出為準。

| 路徑 | 內容 |
| --- | --- |
| `/` | Yuragi 介紹與海月互動展示 |
| `/playground` | 海月即時預覽、部件與動態調整 |
| `/docs` | 安裝、模型製作與框架整合指南 |
| `/docs?section=custom-character` | 自訂角色的圖片準備、綁定與驗證 |
| `/docs?section=eyes` | 眼神控制、前置條件與素材製作流程 |
| `/docs?section=skills` | Agent Skills 安裝與使用 |
| `/docs?section=component&framework=vue` | Vue 元件、事件與生命週期 |
| `/docs?section=component&framework=react` | React 元件與整合範例 |
| `/docs/api` | 公開 API 索引與個別方法說明 |

網站提供繁體中文、英文與日文，預設為繁體中文。可透過語言選單切換，或在網址加入 `?lang=zh-TW`、`?lang=en`、`?lang=ja`。

遊樂場以海月的既有模型為展示對象，可調整眼神強度、待機節奏與部件彈性，並查看骨架、綁定區域及網格。介面的「圖層」是 v1 共用表面的部件分組；獨立附件使用另一套 v2 模型。自訂角色請使用本機 Studio，網站不提供模型 JSON 匯入、模型匯出或套件下載。

## 安裝套件

先在 Yuragi 專案根目錄建置並打包：

```sh
npm run pack:lib
```

此指令會建置引擎與 Studio，並在 `artifacts/` 產生本機安裝包。接著在你的目標專案執行，將路徑換成實際檔案位置：

```sh
npm install /path/to/yuragi/artifacts/z7589xxz758-yuragi-0.2.0.tgz
```

也可在執行 `npm run build:lib` 後，安裝本機的 `packages/rig` 目錄。打包不會發布 npm；目前請使用實際的本機路徑。

### 準備海月素材

套件內含 `assets/mirea/model.json` 與 `assets/mirea/texture.png`。把目標專案中 `node_modules/@z7589xxz758/yuragi/assets/mirea/` 的內容複製到網站的 `public/models/mirea/`。

`createMireaModel()` 預設使用 `/models/mirea/texture.png`，也接受自訂圖片 URL。安裝套件不會自動把素材複製到網站；調整路徑時須同步更新模型的圖片來源。角色素材的使用範圍見 [授權說明](#授權與-ai-產出)。

### Vue

Vue 是主要文件與網站使用的框架。目標專案需安裝 Vue 3.5 以上版本。

```vue
<script setup lang="ts">
import { createMireaModel } from '@z7589xxz758/yuragi/mirea'
import { YuragiCharacter } from '@z7589xxz758/yuragi/vue'

const model = createMireaModel('/models/mirea/texture.png')
</script>

<template>
  <div style="width: 320px">
    <YuragiCharacter :model="model" alt="海月みれあ" />
  </div>
</template>
```

元件處理畫布比例、動態留白、備援原畫、載入取消與卸載清理。透過 `ready` 事件取得播放器後，可呼叫 `setPointer()`、`setMotion()` 等方法加入自己的互動。

### React

React 18.3／19 使用獨立入口：

```tsx
import { useMemo } from 'react'
import { createMireaModel } from '@z7589xxz758/yuragi/mirea'
import { YuragiCharacter } from '@z7589xxz758/yuragi/react'

export function Character() {
  const model = useMemo(() => createMireaModel('/models/mirea/texture.png'), [])

  return (
    <div style={{ width: 320 }}>
      <YuragiCharacter model={model} alt="海月みれあ" />
    </div>
  )
}
```

使用 `onReady` 取得播放器。Vue 與 React 是選配依賴，主入口不會載入任一框架。

### 原生 TypeScript

```ts
import { createPlayer } from '@z7589xxz758/yuragi'
import { createMireaModel } from '@z7589xxz758/yuragi/mirea'

const canvas = document.querySelector<HTMLCanvasElement>('#mirea')
if (!canvas) throw new Error('找不到角色畫布')

const player = await createPlayer({
  canvas,
  model: createMireaModel('/models/mirea/texture.png'),
})

player.setMotion({ sway: 0.8, hair: 1.2 })
player.setPointer(0.3, -0.2)
player.setGaze(0.6, -0.2)

// 頁面或角色移除時呼叫。
player.destroy()
```

原生整合需自行設定容器比例、備援圖片與生命週期。畫布四側各預留 12% 動態空間：容器保持原圖比例，canvas 的寬高設為 `124%`，`left`／`top` 設為 `-12%`。播放器支援 `AbortSignal`；`destroy()` 可重複呼叫。

## 兩種模型與引擎

套件版本與模型版本各自管理。`@z7589xxz758/yuragi@0.2.0` 同時提供 v1 和 v2，兩種模型使用各自的播放器與驗證器。

| | v1：共用表面 | v2：獨立分層 |
| --- | --- | --- |
| 模型型別 | `RigModel`，`version: 1` | `LayeredModel`，`version: 2`、`renderer: 'layered'` |
| 播放與驗證 | `createPlayer`、`validateModel` | `createLayeredPlayer`、`validateLayeredModel` |
| 框架元件 | `YuragiCharacter` | `YuragiLayeredCharacter` |
| 素材結構 | 原圖共用網格、控制點與局部變形區域 | 圖集、獨立附件、父子節點與稀疏頂點權重 |
| 動態能力 | 待機、頭部與游標跟隨、髮束／配件彈性、眼神及動畫曲線 | 階層變換、局部彈簧、共享接點、附件繪製順序與靜態 alpha 遮罩 |
| 臉部控制 | 經標註的眼睛可用 `setGaze`／`setGazeStrength`；眼皮與嘴巴保留原畫 | 配備對應附件與 face 綁定時，可用 `setGaze`／`setFace` 控制眼神、眼睛開合與嘴形 |
| Studio | 唯讀模型預覽 | 唯讀模型預覽 |

海月內建主範例使用 v1。持傘手與道具需要保護，不適合直接套用揮手。替換圖片也不會自動重建控制點、網格或臉部綁定。

v2 需要作者準備完整分層素材。只抽出原圖中看得到的像素，仍會缺少被頭髮、衣服或道具遮住的部分；大幅移動前須補齊並驗收。詳細資料見 [分層引擎指南](docs/layered-engine.zh-TW.md)與 [v2 型別契約](packages/rig/src/layered-types.ts)。

每幀動態由引擎管理，UI 使用低頻快照更新。框架元件支援 SSR 安全匯入、減少動態偏好與失敗時的原畫顯示。原生整合則需接好對應的載入、錯誤與清理流程。

## Yuragi Studio

Studio 隨本機套件預先建置，安裝後即可啟動：

```sh
npx yuragi studio --project ./my-character --out ./yuragi-output
```

`my-character/` 可包含 `model.json` 與其引用的本機相對路徑圖片；也支援透過 `project.json` 管理已編譯的模型版本。Studio 只監聽 `127.0.0.1`，啟動時會印出本機網址。

- v1 與 v2 均為唯讀預覽，可選取部件、縮放平移、並排比較與測試姿勢。
- 缺少素材自動保存到 `OUT/missing-assets.json`，請 Agent 讀取後回到 Python 診斷、拆件與編譯。
- 版本專案可載入 `project.json` 指定的模型版本；JSON 報告保留模型與素材指紋，供 Agent 後續修正比對。
- Studio 只負責預覽；標註、診斷、品質紀錄與模型交付都由 Agent／Skill 與 Python 處理。

Agent 保存 `character-analysis.json`，Python 流程產生 `decomposition.json`、`diagnosis.json` 與 `missing-assets.json`，並將模型編譯到獨立資料夾。品質觀察另外保存為 JSON；原始圖片和標註保留。

使用 `--port 4321` 指定埠號，`--no-open` 只輸出網址。省略 `--project` 可開啟起始畫面與內建海月範例。安裝套件不會自動啟動 Studio，使用者也不需另行安裝 Vite。

需要離線瀏覽器檢查圖時，可在裝有 Playwright 與 Chromium 的目標專案執行：

```sh
npx yuragi review --project ./my-character --out ./review-output
```

輸出路徑須為新的資料夾。檢查圖仍需實際觀看，不能代替視覺驗收。完整流程見 [Agent JSON／Python 流程](skills/yuragi-rig-spec/references/agent-workflow.md)與 [Studio 使用指南](skills/yuragi-rig-spec/references/studio.md)。

## 製作自己的角色

從 [完整繁體中文指南](docs/custom-character.zh-TW.md)開始，或把製作工作交給 Yuragi Skills 協助。

1. **確認原畫與動作範圍。** 保留來源，標出可動部位、固定道具及遮擋限制。
2. **量測並標註。** 依實際圖片設定控制點、區域、材質反應與必要的臉部資料。
3. **建置模型。** v1 可參考套件的 `assets/starter/model.json`；v2 使用獨立作者 manifest 與分層素材。
4. **在實際播放器中檢查。** 查看中立姿態、各方向、快速反轉、接縫、道具接觸及減少動態模式。
5. **修正、驗收與整合。** Agent 保存標註、細分與缺少素材 JSON，Python 編譯後啟動 Studio 預覽，再把模型和素材接到自己的網站。

Starter 是示意範本，未附圖片，座標必須依原畫重新設定。動物、四足、翅膀或不同角色結構需要適合的動作綁定。模型內的相對圖片路徑須由載入端解析；整合時使用以模型 URL 為基準的載入方式。

### Agent Skills

| Skill | 用途 |
| --- | --- |
| [`yuragi-character`](skills/yuragi-character/SKILL.md) | 設計或延伸角色，整理角色基準、素材與 `character-brief.md` |
| [`yuragi-rig-spec`](skills/yuragi-rig-spec/SKILL.md) | 判讀原畫、制定動作、協助標註與建置模型，產出規格和播放器預覽 |

在使用 AI 的目標專案中，依需求擇一從 GitHub 安裝。

從零建立角色：

```sh
npx skills add zz41354899/yuragi --skill yuragi-character
```

已有角色，只需要轉換動態：

```sh
npx skills add zz41354899/yuragi --skill yuragi-rig-spec
```

兩個 Skill 可獨立安裝；之後需要另一種功能時，再執行對應指令即可。安裝後以 `$yuragi-character` 或 `$yuragi-rig-spec` 提出需求。Skill 工作文件以英文撰寫，可接受不同語言的需求並以使用者語言回覆。

v1 製作流程為 **inspect → AI 標註 → extract → build → 播放與視覺修正**。AI 負責看圖與決定綁定；本機 Python／Pillow 工具依標註量測、抽取可見像素，並透過實際 runtime 驗證模型。Python 不會自行辨識角色或補回遮住的圖像。v2 另用 `build_layers.py` 建置分層模型。

安裝 Skill、runtime 與 Python 工具是不同步驟，安裝本身不會生成圖片。操作與環境需求見 [角色準備流程](skills/yuragi-rig-spec/references/character-preparation.md)。

`skills/` 是 Skill 的編輯來源。`npm run sync:skills` 同步必要的型別與指南，並產生網站 `/.well-known/skills/` 分發資源；網站 dev、test、build 會先執行同步。分發不包含角色原畫或 runtime 套件。

## 專案結構

```text
packages/rig/       TypeScript 引擎、框架包裝、CLI 與內建模型
apps/site/          Vue 展示網站、遊樂場與三語文件
apps/studio/        本機 Studio 的 Vue 介面
skills/             角色設計與模型製作 Skills、Python 工具
scripts/            素材同步、API 產生、打包驗證與輔助工具
docs/              模型指南、引擎契約與版本說明
artifacts/          本機安裝包、預覽素材與驗證紀錄
```

Vue／React 與海月資料各有獨立匯入入口：

```text
@z7589xxz758/yuragi         核心播放器、模擬、驗證器與型別
@z7589xxz758/yuragi/vue     Vue 元件
@z7589xxz758/yuragi/react   React 元件
@z7589xxz758/yuragi/mirea   createMireaModel()
```

## 開發與驗證

```sh
npm run typecheck
npm test
npm run build
npm run pack:lib
npm run preview
```

測試涵蓋數值變形基準、模型驗證、框架 SSR、載入取消、資源清理、分層綁定與 Studio 流程。UI 變更也需要在實際瀏覽器檢查。

Python 工具需 Python 3.10 以上版本與 Pillow，測試指令為：

```sh
python3 -m unittest discover -s scripts/tests -v
```

變更公開 API 後，執行 `npm run sync:api` 與 `npm run sync:skills`，並更新行為說明。0.2.0 的 API 遷移見 [版本說明](docs/releases-0.2.0.md)。

## 目前邊界

Yuragi 適合已綁定角色的網頁動態與預覽。分層渲染和臉部控制都依賴對應素材；目前未提供通用自動綁定、遮擋補圖、IK、Spine 匯入、多動畫混合或語音口型同步。

Studio 和 Python 工具在本機執行。專案目前沒有 MCP server、Plugin 或內建外部 AI API，也未部署公開網站。Agent Skills 由使用者選用的 AI 助手載入與執行。

## 授權與 AI 產出

Yuragi 自有程式碼、文件、Skills、輔助工具、通用範本與模型綁定資料採 [MIT 授權](LICENSE)。角色插畫、貼圖、角色形象及品牌素材不包含在此授權中；第三方素材依各自條款使用。詳見 [授權範圍與 AI 產出說明](LICENSE-SCOPE.md)。

Skill 交付應說明實際 AI 參與、來源素材與本機處理範圍。原畫和抽取的可見像素不應標為新生成圖片。AI 生成或修改的圖片不保證可合法商用；商用前須確認素材授權與工具條款。Yuragi 不提供權利審查或法律爭議處理服務。
