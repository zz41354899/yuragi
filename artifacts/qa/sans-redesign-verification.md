# Yuragi 黑體與網站視覺更新

2026-10-01。本機預覽：http://127.0.0.1:4312/。

## 設計

- 參考 Rive（https://rive.app/）的大字無襯線與清楚產品入口，以及 Spline（https://spline.design/）的互動示範與分區層次；沒有複製素材或程式碼。
- 維持 Yuragi 的明亮藍色、原創品牌標誌、繁體中文預設與三語切換。
- 移除首頁裝飾大字與旋轉註解，改為 Momo 即時展示區、功能卡片、五步自製角色入口與深藍 CTA。
- 標題、內文、導覽、表單、程式碼、座標皆使用無襯線字型。繁中使用 Noto Sans TC；日文優先 Noto Sans JP。
- Momo 圖片、引擎、綁定與原始動態未修改；沒有新增圖片生成或部署。

## 驗證

- `npm run typecheck` 通過。
- `npm test`：12/12 通過，包含 Momo baseline、reduced-motion、清理與 SSR 測試。
- `npm run build` 與 `git diff --check` 通過。
- 首頁：桌面預設視窗、390 × 844、320 × 844，繁中／英／日的標題、按鈕與新增內容均檢查。
- 文件：390 × 844，日文安裝與繁中自製角色流程；全站水平捲動已修正，章節導覽／程式碼內部仍允許必要捲動。
- 遊樂場：390 × 844，繁中預覽、骨架切換確認正常。
- 各檢查頁的 computed font-family 都為 Noto Sans 系列／系統無襯線，無明體或襯線字型。
- 頁寬檢查使用 documentElement.clientWidth，而非包含捲軸的 innerWidth。

## 截圖

- `sans-redesign-home-desktop.jpg`
- `sans-redesign-home-mobile.jpg`
- `sans-redesign-docs-mobile.jpg`
