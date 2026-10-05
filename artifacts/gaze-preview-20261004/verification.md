# 原圖眼神預覽調整（2026-10-04）

本次方向：官網與 Studio 使用原圖瞳孔追蹤，不再提供臉部底圖、眼白補圖、半閉／閉眼與嘴型素材製作入口。既有 v2 API 保持相容。

- 移除 Studio 眼嘴測試控制和預設缺少素材建議；Python 與 Studio 仍保留其他部件的診斷。
- 眼睛改為有限範圍的连续紋理位移，保留眼睛邊緣，取代平白色覆蓋與虹膜貼回。此方法改善有限位移的觀感，不補出被遮擋像素。
- 官網 Hero、Playground、Studio 共用游標換算，納入缩放、平移及低頻角色位移快照。預設眼神強度 0.75。
- Studio 中立／暫停仍可預覽眼神，離開回正，開關關閉時停用強度滑桿。保留減少動態處理。
- 實際檢視桌面官網與 Studio、625% 頭部放大、游標左右位置、追蹤開關，以及 390×844 Studio 預覽與控制分頁。手機實體觸控未測試。
- 重新啟動 4340 本機服務後，Mirea 的 `artifacts/studio-preview-20261004/ui/missing-assets.json` 為 `items: []`，來源 SHA256 保持 `6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05`。
- `npm run typecheck` 通過；`npm test` 69 項函式庫＋17 項網站測試通過；`npm run build` 通過；Python 42 項測試通過；`git diff --check` 通過。
- Mirea 變形數值基準通過；原圖與內建 model.json 本次沒有差異。
- 先前補圖實驗保留在封存 artifacts，已退出有效專案版本，未接入官網／Studio。

未部署或發布。建置仍有既有的網站 chunk 大小提醒。
