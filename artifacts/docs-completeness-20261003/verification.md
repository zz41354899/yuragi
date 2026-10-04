# Yuragi 文件補齊驗證 · 2026-10-03

本次範圍為網站文件、Skill 指引與 Python 使用流程；保留工作區既有程式修改，未新增引擎功能、部署或 npm 發布。

## 完成內容

- 網站新增 `/docs?section=eyes`，包含 face 條件、座標、輸入優先順序、Vue 範例、驗收與常見錯誤。
- API 章節補上核心公開匯出、曲線取樣、幾何權重與時間軸生命週期。
- Skill 新增 `references/eye-tracking.md`，主入口連結到該指南與 Python 缺口表。
- Python 指南補上 CLI 參數、產出檔案、失敗排查、完成證據與已知匯出限制。
- 修正 README、角色指南與 API 參考中過時的眨眼／曲線描述；網站新文案提供繁中、英文、日文。
- 網站的 `.well-known/skills` 已由建置同步；其型別仍直接來自目前 TypeScript 原始碼。

## 已執行驗證

- `npm run typecheck`：通過。
- 文件中的 Vue SFC 範例暫存為真正 `.vue` 後進行 `vue-tsc`：通過，暫存檔已移除。
- `npm test`：核心 39／網站 10，全部通過。
- `npm run build`：通過。
- `quick_validate.py skills/yuragi-rig-spec`：通過。
- Python `unittest discover -s scripts/tests -v`：11 個測試通過。
- 以內附 Momo 原畫實跑 Python `--help`、`inspect`、`build --rig-package packages/rig`：通過；產出模型通過目前建置的 `validateModel`。這是命令流程驗證，沒有將產出角色標成視覺驗收完成；`visualAcceptance` 保留 `not-run`。
- 瀏覽器：繁中桌面眼睛章節、390×844 英文手機版／自訂章節選單切至 Skills、日文 React API 頁新標題、主控台錯誤檢查。已回到繁中桌面，暫時 viewport 已還原。未驗證實體手機。
- `git diff --check`：通過。

系統 Python 缺少 Pillow／PyYAML，因此 Python 測試使用 Codex 內附 Python（Pillow 12.3.0），Skill 驗證使用現有快取的 PyYAML。未修改系統 Python 或安裝新服務。

## 已知功能缺口（本次僅記錄）

1. Python 分析驗證尚未接受 runtime 的 `face.mode`；需要輸出後在自訂整合中設定、再次驗證並記錄。
2. Python 產生的 preview 未依 gaze 模式或 mouth 是否存在篩選表情控制，也沒有獨立眼神控制。
3. Python 未匯出 `pointerGroups` 或動畫片段；引擎目前已有相應群組與參數／表情／權重播放能力。
4. 產生 spec 的舊預設限制句仍可能把 blink 列為未實作；指南要求依實際模型模式與驗收結果修正。
5. 完整分層附件、IK、Spine 匯入、大角度转身與語音口型同步仍未實作。

畫面證據：[eye-tracking-desktop.png](eye-tracking-desktop.png)。
