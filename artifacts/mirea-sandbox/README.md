# 海月みれあ · 動態體驗沙盒

原畫保持不變。眼睛只跟隨視線，沒有眨眼或嘴型合成。頭頸保留小幅轉動，六束瀏海、側髮、衣料、飄帶與自由手臂有局部回擺。上半身、肩膀、持傘手臂、手掌、傘柄與傘蓋共用受保護的變換；骨盆、交叉雙腿與鞋子共用另一個變換，避免拉長皮膚或破壞握傘接點。

## 開啟與測試

單檔 `mirea.html` 內嵌原畫、模型與引擎。可編輯版本使用 `index.html`、`sandbox.js`、`model.json` 與 `runtime/`。

```sh
python3 -m http.server 4322 --bind 127.0.0.1 --directory artifacts/mirea-sandbox
```

開啟 `http://127.0.0.1:4322/mirea.html`：

- **游標跟隨**：在舞台內畫圈、慢移或快速反轉。方向鍵也可操作，Home 回中。空心圈表示目標，亮點表示目前跟隨方向。
- **流動展示**：引擎播放八秒 Bézier 循環，含斜向移動、轉向、回中；滑鼠不會打斷自動展示。
- **持傘與雙腿接點測試**：四方向停留並快速反轉，放大檢查持傘接點、交叉腿與鞋子。
- **動作質感**：俐落跟隨、海風浮動、壓力測試三個預設。漂移與慣性可調；部位層次 0–100% 比較新增群組動作，髮束與衣料回擺可獨立調整。
- **檢視**：50–400% 縮放、滾輪縮放、拖曳平移，附全身／臉部／雙腿／持傘特寫。鍵盤 +/- 縮放、0 回全身，開啟平移後方向鍵移動視窗。觸控支援雙指縮放，尚未用實體手機驗證。

整體動畫權重與曲線仍放在網站的 **Momo 遊樂場 → 動態設定**，角色固定；曲線控制整體動畫，不綁表情。

## 實際動作結構

25 個局部彈簧區域、5 個剛性保護區域、頭頸綁定與兩個 `pointerGroups` 仍共用原畫網格。上半身群組 response=105ms、骨盆群組 response=220ms；它們是指數收斂時間常數，與整體游標彈簧疊加，並非總延遲。頭部 rotation=.028、translation=[.004,.0025]；bodyFollow=.25。

`motion.layers` 控制群組的角度與位移，保留內部比例；`motion.parts` 控制局部回擺。握傘手臂停用獨立彈簧，避免手和道具互相拉扯。頭部與道具接近的邊界使用窄幅羽化，避免一個三角形內突然換歸屬。

骨盆與雙腳會跟隨，但交叉腿仍作為同一組，不提供獨立屈膝、走路或換步。這些動作需要遮擋補全的分層素材與關節約束。此版沒有獨立圖層、IK、Spine 匯入或 Live2D 模型播放器，不能宣稱已達完整模型能力。

`prepared/` 是先前可見素材的拆圖候選；使用本目錄的 model.json 與 mirea.html 檢查最新互動。眼皮／嘴巴候選不代表沙盒啟用表情。

## 驗證與重建

`verify.mjs` 檢查原圖 SHA-256、四方向反轉、50ms 延遲步進、五種設定共 9,000 幀、有限座標、正向三角形、臉部／腿部比例與減少動態。結果寫入 `simulation-report.json`。npm test 另驗證持傘手臂、手掌、傘柄、傘蓋在不同群組強度下的共同變換，以及 Momo baseline、30/60/120Hz 群組收斂與清理。

```sh
npm run build:lib
cp packages/rig/dist/*.js artifacts/mirea-sandbox/runtime/
node artifacts/mirea-sandbox/author-model.mjs
node artifacts/mirea-sandbox/verify.mjs
node artifacts/mirea-sandbox/build-standalone.mjs
node artifacts/mirea-sandbox/build-qa.mjs
```

[眼神與動畫 API](../../docs/face-and-animation.zh-TW.md) · [部位與分層規格](../../docs/parts-and-layers.zh-TW.md)
