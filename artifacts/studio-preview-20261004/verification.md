# Studio 純預覽與 Agent JSON 流程驗證

本次將前一版 Studio 的問題表單、驗收勾選、圖集介面與交付按鈕移出畫面。保留播放、回正、姿態、縮放平移、原圖比較、選用部件定位與眼嘴控制。模型製作、診斷、品質紀錄與交付由 Agent／Skill／Python 處理。

## JSON 與 Python

- Agent 保存 character-analysis.json；Python workflow.py diagnose 產生 decomposition.json、diagnosis.json、missing-assets.json，並保存原標註快照。
- workflow.py run 完成診斷、抽取、實際 runtime 驗證與編譯；--studio 成功後啟動本機套件的 Studio。所有重跑均使用新資料夾。
- Studio 自動保存 OUT/missing-assets.json，包含來源／模型／素材指紋及缺少素材 ID。Agent 可用 --missing 讀回 Python。
- 診斷區分 extract、revise-annotation、provide-artwork。必要缺件保留 JSON 並阻擋候選编譯；非必要眼嘴素材不阻擋既有動態。

## 已執行驗證

- npm run typecheck 通過。
- npm test：69 項 rig、15 項 site，共 84 項通過。
- npm run build 通過；網站保留原有大於 500 kB 的 bundle 提示。
- Python unittest：42 項通過，包含 v1／v2 流程、缺件阻擋、指紋不符與可抽取／需補圖的診斷。
- 兩個更新後的 Skill 通過官方 quick_validate.py；網站資源與 API 例子的檢查通過。
- Mirea 原圖未改動，既有變形數值基準測試通過。
- Mirea 61 個已標註部件走完診斷、抽取、編譯與 Studio 啟動（mirea-v1/）。將 Studio JSON 讀回 Python 的第二次診斷亦通過（feedback-diagnosis-v2/）。此處沿用先前已保存的角色標註，沒有宣稱重新產生完整角色素材。
- 實際瀏覽器確認桌面、390 × 844 手機預覽／控制分頁、姿態下拉選單、回正與縮放、比較、素材清單位置及更新的網站指南。
- 新本機 tarball 在獨立目錄離線安裝，Vue／React v1／v2 匯入與 SSR smoke 通過。複製可獨立安裝的 Skill，在該目錄由 Python 呼叫安裝包編譯 Mirea 並啟動 Studio；瀏覽器確認模型與缺件 JSON 均可用。未依賴 Yuragi 原始碼目錄。

## 檔案與限制

- studio-desktop.jpg、studio-mobile.jpg：本次介面截图。
- quality-observations.json：實際觀察項目與未測項目，未宣稱全面視覺驗收。
- package/yuragi-rig-0.2.0.tgz：本機安裝包。
- Mirea 尚缺分層閉眼、眼皮與嘴型素材。Python 不會重建原圖中不存在的像素，必須提供補圖；未執行圖片生成。
- 尚未實測實體手機；此次交付限本機，沒有部署或發布。

主預覽：http://127.0.0.1:4340/（CLI 程序運行期間有效）。
