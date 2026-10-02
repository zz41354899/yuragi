# Yuragi v0.1.0 交付驗證

驗證日期：2026-10-01。原 Kirameki Catch 專案沒有因這次抽離而修改。

## 自動檢查

- `npm run typecheck`：library 與 Vue 網站通過。
- `npm test`：12 個測試全數通過。
- `npm run build`：library 與網站正式產物成功建立。
- `git diff --check`：通過。
- `npm run pack:lib`：產生包含 ESM、型別、source map 與原始 TypeScript 的獨立套件。
- 將 .tgz 安裝到另一個無 Vue／React 依賴的專案：成功；公開 API 的 TypeScript 檢查通過。建立 33 個控制點、6305 個網格頂點，數值全部有限。

## 動態與生命週期

- 與原始 Momo 系統的預設網格資料比對：待機、游標反轉、揮手保留原始結果。
- 待機幅度可見，三角形方向保護通過；最大動態設定保持有限數值。
- 模型實例互不污染、不合法輸入不改變目前設定。
- Vue 與 React 伺服器端渲染提供靜態原畫，不存取瀏覽器全域物件。
- 播放器只有一個動畫迴圈；重複 destroy、載圖失敗、取消載圖及初始化後取消均會正確清理。
- 減少動態偏好提供靜態姿態，偏好變更可更新播放器。

## 實際瀏覽器

- 桌面 `/Users/zz41354899/Desktop/yuragi` 的正式建置預覽已啟動；首頁確認載入 `/assets/` 產物且 canvas 正在播放。React 正式建置範例也確認載入成功，沒有 error／warn。
- 首頁原始 Momo 圖片成功載入 WebGL 並播放。
- React 文件中的 StrictMode 範例顯示「React 播放器已就緒」，揮手按鈕可操作。
- 遊樂場輕柔預設、個別動態滑桿、播放／暫停、控制點選取、位置調整與骨架疊圖已操作。
- 鍵盤 ArrowRight 可把控制點 X 從 0.520 調為 0.521。
- 匯出 JSON 保留 sway=0.8 與 33 個控制點；貼上匯出內容可重新載入。無效 JSON 顯示驗證錯誤。
- 本機瀏覽器未回傳原生下載檔案路徑；因此 JSON 驗證使用頁面的完整匯出預覽及貼上匯入，而非宣稱下載到 Downloads 的檔案已驗證。
- library 下載端點回傳 HTTP 200；.tgz 本身通過上述獨立安裝測試。
- 390×844 手機版首頁／文件／遊樂場沒有水平溢出；768×1024 遊樂場沒有水平溢出。
- 桌面預覽的固定高度與滾動區域已修正，整個角色和骨架可見。
- 頁面切換與 React 範例操作後，瀏覽器沒有 error／warn 記錄。

截圖：home-desktop.jpg、home-mobile.jpg、playground-desktop.jpg、playground-mobile.jpg、docs-mobile.jpg。

## 邊界

尚未部署、未發布 npm、沒有 MCP／Plugin。本版不提供自動圖片辨識、眨眼或大角度轉身；其他角色仍需要自己的圖片與骨架綁定。沒有改動使用者的系統減少動態設定，其行為由播放器自動測試驗證。
