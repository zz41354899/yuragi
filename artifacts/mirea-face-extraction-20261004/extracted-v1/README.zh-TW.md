# Mirea 臉部可見素材拆件

從既有 Mirea 原圖以人工檢視標註及 Python 遮罩抽出 11 張透明 PNG，保留原始像素與來源位置。原圖及現有模型未修改。

## 內容

- 左右張眼、可見虹膜、上眼線、可見眼白及眼旁皮膚：共 10 張。
- 閉嘴微笑：1 張。
- `prepared/parts/`：1024 × 1536 全畫布 PNG，直接對齊原圖座標。
- `prepared/parts/cropped/`：依範圍裁切的 PNG；放回原圖時使用 JSON 的 `boundsPixels`。
- `prepared/parts/masks/`：全畫布遮罩。
- `character-analysis.json`：細部輪廓、信心、遮擋與保護區標註。
- `material-resolution.json`：原先 14 項需求逐項對應素材與狀態。
- `missing-assets.json`：尚待補圖的 13 項需求，供 Agent 續接。
- `verification.json`、`visual-review.json`：像素檢查及裁片檢視紀錄。

`boundsPixels` 為 `[左, 上, 右, 下]`，右與下不包含在裁切範圍內。部件 ID 沿用既有標註；不要自行交換左右命名。

## 原先 14 項需求的結果

| 狀態 | 數量 | 說明 |
| --- | --- | --- |
| 已抽取 | 1 | `mouth-closed`，原圖的閉嘴微笑 |
| 局部抽取 | 4 | 左右眼球及眼皮底圖需求，目前只有可見區域 |
| 原圖不存在 | 9 | 左右半閉／閉眼，以及 A／I／U／E／O 嘴型 |

眼旁皮膚裁片不能當成完整的眼皮底圖；眼白及虹膜裁片沒有被遮住的像素。可見眼白的邊緣仍帶有原圖的抗鋸齒及眼部線條，移動前還需要完整眼白、清除眼睛後的臉部底圖及接縫處理。裁切無法產生原圖不存在的表情。

## 狀態與續接

這些是製作素材，尚未綁定，也不是可直接播放的完整 v2 模型。像素一致性檢查及裁片檢視不代表眨眼、嘴型或動畫驗收完成。

Agent 應先讀取 `material-resolution.json` 與 `missing-assets.json`，在取得必要補圖後建立分層 authoring manifest，再以 Skill 的 Python 流程編譯及預覽。不要使用眼旁皮膚覆蓋替代完整閉眼素材，不要把閉嘴裁片複製並宣稱為五個母音嘴型。

原需求的模型／素材指紋僅表示這批拆件對應哪個預覽版本；它們不是新增裁片的指紋。各裁片的 SHA-256 記錄在 `verification.json`，沒有以舊指紋發布新模型。
