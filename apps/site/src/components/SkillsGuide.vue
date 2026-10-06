<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useText } from '../i18n'
import CodeBlock from './CodeBlock.vue'
const { tr } = useText()
const installCharacter = 'npx skills add zz41354899/yuragi --skill yuragi-character'
const installRig = 'npx skills add zz41354899/yuragi --skill yuragi-rig-spec'
const characterPrompt = '$yuragi-character\n' + '請從零建立我的原創角色，先整理角色設定與固定特徵。\n' + '交付角色基準與 character-brief.md，供後續動態規劃使用。'
const rigPrompt = "$yuragi-rig-spec\n請把 /path/to/my-character.png 轉成我的動態角色，保留原本設計。\n先看圖判斷合適的動作，使用 Python 量測、拆解可見部位並建立綁定。\n對應 Yuragi API，交付 model.json、rig-spec.md 與可播放的預覽，實際檢查並修正動態。"
const prepareCommand = `python3 -m venv .venv
.venv/bin/python -m pip install -r /path/to/yuragi-rig-spec/scripts/requirements.txt
.venv/bin/python /path/to/yuragi-rig-spec/scripts/prepare_character.py inspect artwork.png --out character-inspect
# AI writes character-analysis.json after inspecting the image
.venv/bin/python /path/to/yuragi-rig-spec/scripts/prepare_character.py extract artwork.png --analysis character-analysis.json --out character-parts
.venv/bin/python /path/to/yuragi-rig-spec/scripts/prepare_character.py build artwork.png --prepared character-parts --out character-v1 --rig-package /path/to/node_modules/@z7589xxz758/yuragi
python3 -m http.server 4320 --bind 127.0.0.1 --directory character-v1`
</script>

<template>
  <div class="skills-guide">
    <p class="docs-lead">{{ tr('同一套 Yuragi，兩個英文 skill。從零設計角色，或讓 AI 看懂既有立繪、選擇合適動作並建立可播放的預覽；Prompt 可使用任何語言。') }}</p>
    <div class="notice">
      <strong>{{ tr('MIT 授權與 AI 圖片商用提醒') }}</strong>
      <p>{{ tr('程式碼與 Skills 採 MIT 授權；角色素材與生成圖片的權利另行確認。') }}</p>
      <p>{{ tr('透過 Skill 與 AI 工具生成或修改的圖片，可能涉及第三方權利，不保證可合法商用。商用前請自行確認素材授權與工具條款。') }}</p>
      <p>{{ tr('使用者須自行處理生成圖片的授權與使用爭議；Yuragi 不提供權利審查或法律爭議處理服務。雙方責任仍依適用法律判斷。') }}</p>
    </div>
    <div class="skill-paths">
      <article><span class="skill-step">01 · CHARACTER</span><h2>{{ tr('從零建立角色') }}</h2><code>yuragi-character</code><p>{{ tr('從想法開始，鎖定角色設定、立繪與素材品質，交付可接續的角色基準。') }}</p><strong>character-brief.md</strong></article>
      <article><span class="skill-step">02 · CHARACTER MOTION</span><h2>{{ tr('把既有角色轉成動態') }}</h2><code>yuragi-rig-spec</code><p>{{ tr('AI 判讀造型與可動部位，Python 產出綁定、可見部位素材與 spec，再使用 Yuragi API 建立並驗證動態預覽。') }}</p><strong>model.json · rig-spec.md · preview.html</strong></article>
    </div>
    <h2>{{ tr('安裝 Yuragi Skills') }}</h2>
    <p>{{ tr('在你使用 AI 的專案目錄執行，依需求擇一安裝。以下指令透過 npx skills 從 GitHub 取得對應的 Skill。') }}</p>
    <h3>{{ tr('從零建立角色') }}</h3>
    <CodeBlock :code="installCharacter" language="Terminal" />
    <h3>{{ tr('已有角色，只需要轉換動態') }}</h3>
    <CodeBlock :code="installRig" language="Terminal" />
    <p>{{ tr('兩個 Skill 可獨立安裝；之後需要另一種功能時，再執行對應指令即可。') }}</p>
    <p><a href="https://github.com/zz41354899/yuragi" target="_blank" rel="noreferrer">{{ tr('GitHub 原始碼與 Skills') }}</a></p>
    <p>{{ tr('Skill 包含英文指南、Python 輔助工具與 spec 範本。執行工具需要 Python 3.10+ 和 Pillow；播放需要另外安裝目前的本機 Yuragi 套件。') }} <RouterLink to="/docs?section=installation">{{ tr('查看套件安裝') }}</RouterLink></p>
    <h2>{{ tr('讓 AI 接續你的進度') }}</h2>
    <p>{{ tr('沒有角色時，先用角色設計 skill；已有立繪時，提供原畫路徑與想要的互動，AI 會完成判讀、轉換與預覽。也可以指定只寫 spec。') }}</p>
    <CodeBlock :code="tr(characterPrompt)" :language="tr('角色設計 Prompt')" />
    <CodeBlock :code="tr(rigPrompt)" :language="tr('角色轉換 Prompt')" />
    <p>{{ tr('只要 spec 時，在 Prompt 加上「這次只完成 spec，不建立播放器」。') }}</p>
    <h2>{{ tr('AI 如何完成轉換？') }}</h2>
    <ul><li>{{ tr('看懂原畫：量測尺寸、透明度與留白，判讀身體、髮束、配件和遮擋。') }}</li><li>{{ tr('選擇適合的動作：人形可嘗試輕微跟隨；持道具或手臂不適合時停用揮手，其他造型先用整體微動。') }}</li><li>{{ tr('Python 輸出：依原畫座標建立 model.json、綁定圖、可見部位 PNG 與 rig-spec.md。') }}</li><li>{{ tr('API 播放與驗收：使用本機 runtime 預覽，檢查臉部、接縫與動態品質，再修正綁定。') }}</li></ul>
    <p>{{ tr('AI 負責原圖分析，Python 負責量測與拆件。此流程輸出 v1 完整原圖；v2 獨立附件需另用 build_layers.py 建置並提供遮擋補圖。') }}</p>
    <h2>{{ tr('Skill 如何呼叫 Python？') }}</h2><p>{{ tr('Agent 必須先讀 yuragi-rig-spec 與 API 契約，再看圖標註並執行 inspect／extract／build。Python 不會啟動 Skill；角色設計與素材製作交給 yuragi-character。') }}</p>
    <h2>{{ tr('Python 輔助工具') }}</h2>
    <p>{{ tr('安裝後，AI 會從 skill 目錄執行以下流程，並依你的原畫寫出 character-analysis.json；你不用自己標控制點。') }}</p>
    <CodeBlock :code="prepareCommand" language="Terminal · Python" />
    <h2>{{ tr('產出檔案與完成條件') }}</h2><p>{{ tr('inspect 產生量測、格線與標註草稿；extract 產生部件、遮罩與指紋 manifest；build --prepared --rig-package 驗證模型並產生本機互動預覽。') }}</p><p>{{ tr('partsExtracted 表示部件已拆出；modelValidation: passed 表示實際 runtime 驗證通過。visualAcceptance 仍為 not-run，需開啟 HTTP 預覽檢查動態後才更新。') }}</p><p>{{ tr('輸出資料夾非空時請換新版本；SHA 不符時重新 inspect。缺少 PIL 時在同一個 Python 環境安裝 requirements；缺少 dist/index.js 時先建置本機 library。') }}</p><p><a href="/.well-known/skills/yuragi-rig-spec/references/character-preparation.md#cli-contract-and-current-exporter-gaps">{{ tr('Python 命令、錯誤與功能缺口') }}</a></p>
    <p><a href="/.well-known/skills/yuragi-rig-spec/references/character-preparation.md">{{ tr('查看 Python 判讀與轉換指南') }}</a></p>
    <RouterLink to="/docs?section=custom-character">{{ tr('查看角色綁定完整流程') }}</RouterLink>
    <h2>{{ tr('查看 skill 原始文件') }}</h2>
    <div class="skill-sources"><a href="/.well-known/skills/yuragi-character/SKILL.md">Yuragi Character · SKILL.md</a><a href="/.well-known/skills/yuragi-rig-spec/SKILL.md">Yuragi Rig Spec · SKILL.md</a></div>
    <p class="skill-cli-source"><a href="https://github.com/vercel-labs/skills" target="_blank" rel="noreferrer">{{ tr('安裝工具：官方 Skills CLI') }}</a></p>
  </div>
</template>

<style scoped>
.skill-paths { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 28px 0 36px; }
.skill-paths article { padding: 24px; border: 1px solid #dceaf0; border-radius: 16px; background: #f7fbfd; min-width: 0; }
.skill-paths h2 { margin: 12px 0; font-size: 21px; }
.skill-step { color: #007fa8; font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.skill-paths code { overflow-wrap: anywhere; font-size: 14px; }
.skill-paths strong { display: block; color: #244a5e; font-size: 14px; }
.skill-sources { display: flex; flex-wrap: wrap; gap: 12px 24px; }
.skill-cli-source { font-size: 13px; }
@media (max-width: 640px) { .skill-paths { grid-template-columns: 1fr; } .skill-paths article { padding: 20px; } }
</style>
