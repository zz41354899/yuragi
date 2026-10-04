# 眼神與動畫曲線：0.2.0

眨眼、嘴型、setExpression 與表情軌已移除。face 只保存依完整原圖量測的左右眼；眼皮、嘴巴與臉部比例維持原畫。缺少 face 的模型不能呼叫眼神 setter。

setGaze(x,y) 控制 −1…1 方向，setGazeStrength(value) 控制 0–1 強度、預設1。兩者需有審核過的眼睛與 headFollow.region。先 setPointer 再 setGaze；lookX/lookY 的參數或動畫軌會讓眼神重新跟隨頭部。引擎平滑約55ms，減少動態時 gaze 與 strength 回報0並保留原畫。

```ts
player.setPointer(.3, -.1)
player.setGaze(.8, -.2)
player.setGazeStrength(1)
player.playAnimation({id:'gaze-fade',duration:1000,tracks:[
  {target:'gaze',name:'strength',keys:[{time:0,value:1,curve:[.42,0,.58,1]},{time:1000,value:0}]},
]})
```

動畫支援 parameter（lookX/lookY/bodyX/wave）、gaze.strength、motion.weight；時間為毫秒，曲線是線性、階梯或四個0–1控制值的 Bézier。每位播放器一個片段，最多32軌，每軌1–2048個時間遞增的 key，長度最多600000ms。pause 暫停全體，pauseAnimation 僅暫停片段，seekAnimation 定位並立即 settle，stopAnimation 保留最後值，reset 回到中立眼神與強度1。

眼睛字段為 id、center、radius、iris、irisRadius、travel、angle、sclera。眼睛半徑 .001–.06，瞳孔半徑 .001–.03 且更小，travel 0–.01 且不超過半徑差45%；中心偏移＋瞳孔半徑＋travel 必須位於眼睛內。angle 為 ±1弧度，RGB 為0–1。所有座標包含原圖透明留白。

舊資料使用 Skill 的 migrate_gaze.py old.json --out new.json，另存並逐項記錄移除內容。expression.gaze 轉為 gaze.strength，其餘表情軌移除；空片段需重寫或刪除，再使用實際 runtime 驗證。模型 version 仍為1，套件版本為0.2.0。

完整 [眼神與海月案例](../skills/yuragi-rig-spec/references/eye-tracking.md) 說明左右眼量測、網站模型來源、Hero 呼叫順序與 trackingOffset 對位。快照不包含完整頭部變換，因此游標對準移動中的臉仍是近似。

製作順序：先讀 yuragi-rig-spec，再 inspect → Agent 看圖標註 → extract → build --prepared --rig-package → HTTP 動態驗收。Python 不啟動 Skill。拆圖與畫師補圖仍是製作素材，獨立分層播放尚未實作。
