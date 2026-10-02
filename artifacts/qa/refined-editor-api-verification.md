# 思源黑體、圖釘編輯與框架 API 驗證

驗證日期：2026-10-02。預覽：http://127.0.0.1:4310/。

## 本次調整

- 本機 Adobe Source Han Sans TW／JP variable WOFF2，保留官方 OFL 授權；沒有使用遠端字體服務。
- 調整標題字重、字距、段落行高與元件留白。保留既有藍色品牌、Momo 原畫與預設引擎動態。
- 遊樂場增加拖曳圖釘、方向鍵 0.001／Shift 0.01 微調、畫布平移、滾輪／按鈕 50–300% 縮放與視圖重設。
- 拖曳圖釘時暫停並以中立姿態編輯；放開後恢復原播放狀態。視圖變換不寫入模型座標。沒有實作雙指 pinch。
- 文件的 Vue／React 選單會切換匯入、元件 props、事件／callbacks、ref、完整程式範例；共用 RigPlayer 方法維持單一版本。
- 原生 API、模型規格、自製角色流程與錯誤說明仍保留。編輯器仍限 Momo，不宣稱任意圖片可自動套用。

## 實際瀏覽器結果

- 桌面預覽：Source Han Sans TW 載入成功，頁面無水平溢位。
- 144% 視圖拖曳 head-root：X 0.520 → 0.562，Y 0.280 → 0.297。
- 平移 (+30px, +20px)：artwork transform 為 matrix(1.44, 0, 0, 1.44, 30, 20)，圖釘座標未改變。
- 方向鍵右移後 X 0.563，Shift＋上移後 Y 0.287。
- 重設視圖回到 100%；還原預設後 head-root 回到 X 0.520、Y 0.280。
- React API 網址 `?section=api&framework=react` 顯示 onReady 與 className；切換 Vue 後留在 API 章節，改顯示 @ready 並移除 React 專用 props。
- 重新載入保留文件版本；章節導覽保留 framework 查詢參數。React 實際範例仍能掛載。
- 390 × 844 與 320 × 844 手機預覽無頁面水平溢位；工具列換行，API 表格自身橫向捲動。
- 中／英／日文工具與文件標題正確切換；日文 Source Han Sans JP 載入成功。
- 本次頁籤 console warn/error：0。

## 程式驗證

- 四份文件 Vue SFC／React TSX 範例以真實 vue-tsc 編譯：通過（檢查用暫存來源已移除）。
- npm run typecheck、npm test（12 個核心測試＋5 個編輯器座標測試）、npm run build 與 git diff --check：通過。

## 尚待確認

使用者第 3 點「官網那個滑鼠控制」含意尚未確認；首頁保留既有預設搖擺與手動切換游標跟隨，不宣稱已完成該項變更。

## 截圖

- source-han-home-desktop.png、source-han-home-mobile.png
- pin-editor-desktop.png、pin-editor-mobile.png
- framework-api-desktop.png、framework-api-mobile.png
