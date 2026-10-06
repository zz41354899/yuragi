<script setup lang="ts">
import { useText } from '../i18n'
import CodeBlock from './CodeBlock.vue'
const { locale } = useText()
const t=(zh:string,en:string,ja:string)=>locale.value==='en'?en:locale.value==='ja'?ja:zh
const workflow=`# After the agent inspects artwork and saves annotations
python /path/to/skill/scripts/workflow.py diagnose source.png \\
  --analysis character-analysis.json --out diagnosis-v1
python /path/to/skill/scripts/workflow.py run source.png \\
  --analysis character-analysis.json --out character-v1 \\
  --rig-package ./node_modules/@z7589xxz758/yuragi --studio`
const feedback=`python /path/to/skill/scripts/workflow.py diagnose source.png \\
  --analysis character-analysis.json \\
  --missing character-v1/preview/missing-assets.json --out diagnosis-v2`
</script>
<template>
  <p class="docs-lead">{{ t('Agent 讀取 Skill 並保存標註 JSON，Python 診斷與拆件、編譯動態模型，Studio 只負責預覽。','The agent reads the Skill and saves annotation JSON. Python diagnoses, extracts and compiles; Studio only previews.','エージェントが Skill を読み測定 JSON を保存。Python が診断・抽出・コンパイルし、Studio はプレビューを担当します。') }}</p>
  <h2>{{ t('製作流程','Preparation workflow','制作フロー') }}</h2>
  <ol>
    <li>{{ t('Agent 查看原圖、整體網格與局部放大圖，把部件輪廓、父子關係、信心、遮擋及保護區保存到 character-analysis.json。','The agent views the source, grid and crops, then saves part contours, parents, confidence, occlusion and protection in character-analysis.json.','原画・グリッド・拡大を確認し、輪郭・親子関係・確信度・遮蔽・保護領域を character-analysis.json に保存します。') }}</li>
    <li>{{ t('Python 讀取標註，量測可见像素與拆件範圍，保存 decomposition.json、diagnosis.json 與 missing-assets.json。','Python reads annotations, measures visible pixels and extraction bounds, and saves decomposition.json, diagnosis.json and missing-assets.json.','Python が可視ピクセル・抽出範囲を測定し、decomposition.json・diagnosis.json・missing-assets.json を保存します。') }}</li>
    <li>{{ t('必要素材完整後，Python 抽取部件、建立模型並呼叫實際引擎驗證，再啟動 Studio 預覽。分層模型使用獨立 manifest。','Once required materials are available, Python extracts, compiles and validates against the real runtime, then launches Studio. Layered models use a separate manifest.','必要素材が揃うと抽出・コンパイル・実エンジン検証後に Studio を起動。分層モデルは専用 manifest を使用します。') }}</li>
  </ol>
  <CodeBlock :code="workflow" language="Terminal" />
  <p>{{ t('每次使用新資料夾。Skill、Python／Pillow 與本機 Yuragi 套件分別安裝；安裝 Skill 不會自動執行。--studio 在編譯成功後開啟預覽，省略時只產生模型。','Use a fresh folder each time. Install the Skill, Python/Pillow and local Yuragi package separately; installing a Skill does not run it. --studio opens the preview after compilation; omit it to build only.','毎回新規フォルダーを使用。Skill・Python/Pillow・ローカル Yuragi は別々に導入します。--studio はコンパイル成功後に表示し、省略時はモデル生成のみです。') }}</p>
  <h2>{{ t('Studio：單純預覽','Studio: a simple viewer','Studio：プレビュー専用') }}</h2>
  <p>{{ t('播放／暫停、回正、縮放平移、原圖比較與姿態選擇都只影響畫面。Studio 不編輯綁定，不提供問題表單、驗收勾選或模型交付操作。','Playback, reset, zoom/pan, source comparison and pose selection only affect the view. Studio has no binding editor, issue form, acceptance checklist or delivery operation.','再生・停止・姿勢・拡大・移動・原画比較は表示だけを変更。編集・問題フォーム・確認チェック・出力操作はありません。') }}</p>
  <CodeBlock :code="'npx yuragi studio --project ./character-v1/model --out ./character-v1/preview'" language="Terminal" />
  <p>{{ t('只有 model.json 的舊專案與 v1／v2 模型仍可預覽。可選的 project.json 保留版本切換；手機使用預覽／控制分頁。','Legacy model.json folders and v1/v2 models still open. Optional project.json supports version switching; mobile separates preview and controls.','旧 model.json フォルダーと v1/v2 に対応。任意の project.json で版切替、モバイルでは表示・操作を分けます。') }}</p>
  <h2>{{ t('缺少素材回到 Agent／Python','Missing assets return to the agent/Python','不足素材はエージェント・Python へ') }}</h2>
  <p>{{ t('Studio 自動保存 preview/missing-assets.json 並顯示檔案位置。Agent 讀取後重新診斷：可抽取的部件回到 Python 拆件，錯誤輪廓重新標註，原圖中不存在的素材列為需補圖。','Studio automatically saves preview/missing-assets.json and displays its path. The agent re-diagnoses: extract visible parts with Python, revise incorrect contours, or request artwork absent from the source.','Studio が preview/missing-assets.json を自動保存し場所を表示。可視パーツを再抽出し、輪郭を修正し、原画にない素材は補完を依頼します。') }}</p>
  <CodeBlock :code="feedback" language="Terminal" />
  <p>{{ t('眼神以原圖的瞳孔輕微跟隨滑鼠，保留原本的眼線、眼皮與嘴巴。Studio 提供追蹤開關與強度；製作流程不要求眼白補圖、眨眼或嘴型素材。','Eyes gently follow the pointer using source pixels, preserving the original lash lines, eyelids and mouth. Studio has tracking and strength controls; the workflow does not request sclera completion, blinking or mouth variants.','原画の瞳でマウスを軽く追従し、目の線・まぶた・口を保ちます。Studio では追従と強さを設定し、白目補完・まばたき・口形素材は要求しません。') }}</p>
  <p>{{ t('重複拆件無法還原被遮住的像素。其他部件缺少素材時由 Agent 記錄，回到 Python 診斷。','Repeated extraction cannot reconstruct hidden pixels. The agent records missing artwork for other parts and returns to Python diagnosis.','再抽出で隠れたピクセルは復元できません。他パーツの不足素材は記録して Python 診断に戻します。') }}</p>
  <p>{{ t('所有處理都在本機。Studio 隨套件預先建置、僅監聽 127.0.0.1；--no-open 只顯示網址，--port 指定埠號。','All processing is local. Studio is prebuilt and listens only on 127.0.0.1; --no-open prints the URL and --port selects a port.','すべてローカルで処理。Studio はビルド済みで 127.0.0.1 のみ。--no-open は URL 表示、--port はポート指定です。') }}</p>
</template>
