# Yuragi 0.2.0 本機驗收紀錄

日期：2026-10-03。從既有未提交修改接續完成；未提交、發布 npm 或部署。模型仍為 version:1。

## 交付與實際流程

- 核心刪除 blink/setExpression、表情狀態與眼皮/嘴型 shader，新增有限數值 0–1 的 setGazeStrength（預設1）。舊 face 欄位與表情軌明確拒絕並提示遷移。
- 主要流程在 `skills/yuragi-rig-spec/SKILL.md`：先讀 Skill/API，再 inspect → Agent 標註 → extract → build --prepared --rig-package → 視覺驗收。Python 不會啟動 Skill。
- 海月來源 SHA-256：`6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05`，1024×1536，alpha 0–254。inspect 不拆件；extract 實際拆出61個可見區域；build 核對來源、分析與PNG指紋，經實際0.2.0 runtime validateModel 後產生預覽。
- `mirea-parts` 是完整畫布/裁片/遮罩/接點/manifest/contact sheet；`mirea-preview` 是單張原圖播放器。未補畫遮擋像素，補圖仍只屬製作素材包，不參與獨立分層播放。
- 舊海月資料備份在 `legacy`，移除內容記錄在 `mirea-migration-report.json`；migrate_gaze.py 另存輸出與報告，不覆寫原檔。歷史 sandbox/prepared 仍保留獨立的候選模型身分。

## 自動檢查

| 檢查 | 結果 |
| --- | --- |
| npm run typecheck | 通過，strict TypeScript |
| npm test | 核心39、網站10項通過；含 Skill 分發同步 |
| npm run build | 核心與 Vue 網站通過 |
| bundled Python -m unittest discover -s scripts/tests | 18項通過 |
| quick_validate.py：yuragi-rig-spec / yuragi-character | 兩者通過 |
| git diff --check | 通過 |
| 本機 tarball 隔離安裝 | 0.2.0、SSR import、套件 exports、Momo/海月驗證及 gaze 動畫通過 |

Python 測試涵蓋舊資料遷移與拒絕、pointerGroups、來源/分析指紋不符、遮罩遭改動、空遮罩、錯誤補圖位置、runtime 拒絕、缺少階段與失敗時不留下可播放半成品。核心測試保留原始 Momo baseline，涵蓋眼神範圍、海月腿部/持物接點、reduced motion、fallback、SSR、取消載入與重複清理。

另執行 sandbox/verify.mjs：5種設定共9000幀，動態保留率最低1、網格面積為正；最大臉部成對誤差約0.00009來源像素，最大腿部相對應變約0.0000085。這是既有 authored sandbox 的幾何檢查，不代表所有生成候選都具有相同品質。

## 瀏覽器與視覺範圍

本機預覽：<http://127.0.0.1:4320/mirea-preview/preview.html>。眼神強度、Eye X/Y、Pose X/Y、動態強度、播放/暫停/重置均可操作；沒有表情按鈕。持傘姿態的 wave 按鈕停用。

- 生成預覽：中立原圖、眼神0/1、鍵盤極值/Escape、姿態±30、快速反向、持續播放與有限診斷通過基本驗收。build-report.json 另記錄視覺範圍，沒有把拆件或模型驗證當作視覺通過。
- authored sandbox：桌面1280px CSS viewport檢視臉部比例、瞳孔、髮根、頭頸與持傘接點，保留 `mirea-face.png`、`mirea-prop.png`。沿用原畫眼皮與嘴型。
- 文件：桌面繁中眼神/API，英文眼神及日文Skill；390×844 CSS iframe實際觸發手機媒體查詢、檢查章節選單與水平溢出。直接 IAB viewport override 不一致，改以固定iframe尺寸驗證；桌面sandbox iframe只縮放顯示，內部CSS寬度維持1280。
- 觸控是測試fixture的 PointerEvent 模擬，未按下的移動保持中立，拖曳約+0.998、反向約−0.988、取消後約−0.000045；結果在 `touch-qa.json`。
- reduced motion：playing false、gaze [0,0]、strength0、變形梯度0。WebGL不可用時保留原圖、操作停用。切換fixture會卸載原預覽，核心測試另確認清理資源次數。
- 截圖證據：`mirea-preview.png`、`mirea-face.png`、`mirea-prop.png`、`docs-mobile-ja.png`；狀態證據：`reduced-motion-qa.txt`、`fallback-qa.txt`。

通過的是本機單張原圖的基本瀏覽器驗收。實體手機、所有作業系統/GPU與逐像素裁片美術驗收未測；遮罩邊緣仍可能需要畫師修整。未宣稱已完成獨立分層、GIF/APNG匯出或完整製作品質認證。

## 同機核心效能

使用 Node v25.9.0 / darwin、同一海月模型，esbuild bundle/minify後gzip。CPU每次300幀暖機、1200幀取樣，共3次，包含simulation/mesh/gaze更新，不包含瀏覽器GPU繪製、上傳及框架UI。

| 指標 | 改版前 | 改版後 | 變化 |
| --- | ---: | ---: | ---: |
| 核心gzip bytes | 19,873 | 18,889 | −4.95% |
| CPU每幀三次中位數 ms | 1.098287 | 1.084325 | −1.27% |

大小未增加，CPU成本未惡化10%，此量測範圍內符合門檻。原始數據在 before-benchmark.json / after-benchmark.json。parallel-load-benchmark.json 與npm測試同時執行、負載不同，明確排除，不用來比較。未做跨框架效能排名，也不是實體手機/GPU結果。

官方框架研究與尚未實作的分層設計見 `skills/yuragi-rig-spec/references/layered-engine-design.md`；歷史文件、目前初步實作與設計推論分開標示。
