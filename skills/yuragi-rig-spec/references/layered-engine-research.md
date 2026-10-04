# 分層角色引擎研究與 Yuragi 後續設計

研究查核日期：2026-10-03；實作更新：2026-10-04。已新增獨立 v2 分層 runtime、Python 圖集建置與 Vue／React adapters；v1 共用表面與眼神 shader 繼續使用原路徑。沒有加入其他框架 runtime；IK、大角度轉身與海月遮擋补圖尚未完成。

使用方式與實際契約見 [v2 分層引擎](layered-engine.md)，完整型別見 [layered-api-types.ts](layered-api-types.ts)。

## 官方機制與可借鑑方法

| 框架 | 官方機制／效果來源 | Yuragi 可借鑑與限制 |
| --- | --- | --- |
| Live2D Cubism | 旋轉變形器維持旋轉形狀，Warp Deformer 控制局部頂點變形，父子結構共用變換；大角度線性頂點插值可能使形狀縮小。[官方變形器說明](https://docs.live2d.com/en/cubism-editor-manual/deformer/) | 頭、硬物用共用剛性變換；局部表情/轉向需額外形狀與素材，不能單靠原圖拉伸。 |
| Spine | 網格頂點以正規化骨骼權重變換；裁減微小權重降低頂點運算量；共用邊界權重有助接縫一致。[官方權重指南](https://esotericsoftware.com/spine-weights) | 離線裁減稀疏綁定、統一持物與肢體接點。大幅關節旋轉仍需可見/遮擋素材及附件繪製。 |
| Rive | 官方2022年文章介紹圖片網格變形、骨骼權重與PSD匯入保留圖層位置/順序。[官方文章](https://rive.app/blog/new-features-released-mesh-deformation-and-psd-support) | 保存完整來源位置、製作資料與runtime資料分開；此文是歷史功能介紹，不當作目前效能基準。 |
| Inochi2D | 0.7文件描述分層圖片的網格變形與參數驅動。[官方歷史文件](https://docs.inochi2d.com/en/latest/inochi2d/about.html) | 建立節點與附件協定；0.7文件不能推定目前所有實作。後續renderer介面可參考[目前主分支設計文件](https://github.com/Inochi2D/inochi2d/blob/main/tech-docs/building-a-renderer.md)，其內容仍屬初步且會變動。 |
| PixiJS v8 | 圖集有助批次繪製，混合模式會影響批次，遮罩與場景組織帶來成本；先量測再最佳化。[官方效能指南](https://pixijs.com/8.x/guides/concepts/performance-tips) | 未來將相容部件放入圖集並預排draw order，限制遮罩數。PixiJS是渲染基礎，並不自動提供角色標註與rig。 |

Live2D 的[官方素材拆分指南](https://docs.live2d.com/cubism-editor-manual/divide-the-material/)也指出應拆開眼睛等部件並補足移動時露出的隱藏區域。這是素材準備需求，不代表框架能憑空恢復像素。

## Yuragi 目前實作與差距

inspect 量測來源；Agent 標註；extract 輸出可見裁片、遮罩、接點、指紋及可選畫師補圖；build 核對完整性並呼叫實際 runtime validateModel。眼神只平移瞳孔。v1 parts 與 pointerGroups 都作用在同一張原圖。v2 另以 attachments 陣列順序繪製獨立裁片／作者補圖；現有 PNG extracts 不會自動轉為可播放 v2。附件交換與獨立翻轉尚無 API。

接點保真優先於大動作：海月握傘手、傘柄、傘面共用變換，腿部剛性保護；柔性髮束/布料使用局部綁定與固定根部。這些實作已有變形測試，但跨框架品質與效能排名未量測。

## 架構與本機實作

採「Python 離線準備＋小型 TypeScript runtime」，保留共用表面為預設路徑。新增分層renderer時使用獨立的版本化附件格式，不把現有模型 version:1 的 PNG extracts 當成可播放附件。

離線階段驗證來源與補圖完整性、接點和圖層順序；計算局部網格、根部鎖定、稀疏正規化權重、共享接點索引、圖集座標與有限遮罩。對同一硬物組預計算一個變換，不把硬物分成互相漂移的彈簧。裁減權重需以誤差上限和極值預覽驗證，不能只追求更少索引。

runtime 使用 typed arrays 更新變換與柔性狀態，重用緩衝區與uniform位置；框架只接收低頻快照。局部高密度網格限於眼睛或接縫，整體保持低密度；未變動的網格不重算。圖集批次保留正確draw order，必要遮罩另算成本。全局/局部效能與真實畫面都通過後，再評估是否採用骨骼/約束，而非先擴大控制數量。

實作順序：先以一個有補圖的海月附件驗證原畫中立姿態與持物接點，再驗證局部柔性變形與遮擋順序；最後量測圖集批次和手機。原有共用表面renderer持續可用，不能用更大動作掩蓋原畫比例改變。

## 評估方法

本次核心基準位於 artifacts/gaze-workflow-020：同一台主機、相同海月模型、三次測量中位數。gzip 比較打包後核心；每幀比較 CPU simulation/mesh/gaze 更新，不包含瀏覽器GPU繪製。這些數據不能宣稱優於 Live2D/Spine/Rive，也不是實體手機結果。

未來分層原型須另測 draw calls、CPU/GPU成本、atlas記憶體、遮罩切換、載入時間、極值接縫誤差與縮放品質；把實測、預測和未測分開。接受標準是中立像素保真、接點不斷裂、合法瞳孔邊界與減少動態，而非只看FPS。

## 本次實作驗證

v2 編譯與播放器已在本機完成。海月三附件原型的來源尺寸中立預乘 RGBA 誤差為 0，255 頂點、436 三角形、1 次繪製、16 MiB 圖集。共享接點和極值剛性距離另以合成 fixture 驗證。海月素材仍為 visible-only：沒有畫師補圖，無法完成原設計所需的補圖後全幅視覺驗收。GPU 計時、實體手機與跨框架比較未測。
