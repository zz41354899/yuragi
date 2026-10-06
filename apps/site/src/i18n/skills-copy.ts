export const skillsCopy: [string, string, string][] = [
  [
    "讓 AI 把角色變成動態",
    "Let AI bring your character to motion",
    "AI でキャラクターを動かす"
  ],
  [
    "同一套 Yuragi，兩個英文 skill。從零設計角色，或讓 AI 看懂既有立繪、選擇合適動作並建立可播放的預覽；Prompt 可使用任何語言。",
    "One Yuragi toolkit, two English skills. Design a character or let AI inspect existing artwork, select suitable motion and build a playable preview. Prompts can use any language.",
    "Yuragi の2つの英語スキル。キャラクター設計、または原画の分析・適した動きの選択・再生プレビューを AI が行います。プロンプトは任意の言語で使えます。"
  ],
  [
    "從零建立角色",
    "Create a character from scratch",
    "キャラクターをゼロから作る"
  ],
  [
    "把既有角色轉成動態",
    "Animate an existing character",
    "既存キャラクターを動かす"
  ],
  [
    "從想法開始，鎖定角色設定、立繪與素材品質，交付可接續的角色基準。",
    "Start with an idea, establish the character and artwork, check assets, and deliver a reusable character brief.",
    "アイデアから設定と立ち絵を固め、素材を確認して次の工程に使える基準を作ります。"
  ],
  [
    "AI 判讀造型與可動部位，Python 產出綁定、可見部位素材與 spec，再使用 Yuragi API 建立並驗證動態預覽。",
    "AI reviews anatomy and suitable motion; Python exports bindings, visible-part assets and a spec. Yuragi APIs create a preview for visual verification.",
    "AI が形状と動く部位を判断し、Python がバインド・可視部位素材・仕様を出力。Yuragi API で動きのプレビューを作成・検証します。"
  ],
  [
    "安裝 Yuragi Skills",
    "Install Yuragi Skills",
    "Yuragi Skills を導入"
  ],
  [
    "在你使用 AI 的專案目錄執行，依需求擇一安裝。以下指令透過 npx skills 從 GitHub 取得對應的 Skill。",
    "Run in your AI project and choose the Skill you need. These commands use npx skills to install the selected Skill from GitHub.",
    "AI を使うプロジェクトで、目的に合う Skill を1つ選んで導入してください。以下のコマンドは npx skills で GitHub から選んだ Skill を取得します。"
  ],
  [
    "兩個 Skill 可獨立安裝；之後需要另一種功能時，再執行對應指令即可。",
    "Each Skill can be installed independently. If you need the other later, run its installation command.",
    "各 Skill は個別に導入できます。後でもう一方が必要になったら、対応するコマンドを実行してください。"
  ],
  [
    "GitHub 原始碼與 Skills",
    "Source code and Skills on GitHub",
    "GitHub のソースコードと Skills"
  ],
  [
    "已有角色，只需要轉換動態",
    "Already have a character? Install the conversion skill",
    "既存キャラクターには変換スキル"
  ],
  [
    "Skill 包含英文指南、Python 輔助工具與 spec 範本。執行工具需要 Python 3.10+ 和 Pillow；播放需要另外安裝目前的本機 Yuragi 套件。",
    "Skills include English instructions, a Python helper and spec templates. The helper requires Python 3.10+ and Pillow; playback requires the separately installed local Yuragi package.",
    "英語ガイド、Python ツール、仕様テンプレートを含みます。Python 3.10+ と Pillow、および別途導入したローカル Yuragi パッケージが必要です。"
  ],
  [
    "讓 AI 接續你的進度",
    "Let AI continue from your progress",
    "進捗に合わせて AI を使う"
  ],
  [
    "沒有角色時，先用角色設計 skill；已有立繪時，提供原畫路徑與想要的互動，AI 會完成判讀、轉換與預覽。也可以指定只寫 spec。",
    "Start with the design skill if needed. Otherwise provide your artwork path and intended interactions; AI performs review, conversion and preview. You can also request a spec only.",
    "必要なら設計スキルから。原画のパスと希望する操作を渡すと、AI が分析・変換・プレビューを行います。仕様のみも指定できます。"
  ],
  [
    "角色設計 Prompt",
    "Character design prompt",
    "キャラクター設計のプロンプト"
  ],
  [
    "角色轉換 Prompt",
    "Character conversion prompt",
    "キャラクター変換のプロンプト"
  ],
  [
    "AI 如何完成轉換？",
    "How does AI complete the conversion?",
    "AI の変換手順"
  ],
  [
    "看懂原畫：量測尺寸、透明度與留白，判讀身體、髮束、配件和遮擋。",
    "Inspect artwork: measure dimensions, alpha and margins; review anatomy, hair, accessories and occlusion.",
    "画像サイズ・透明度・余白を測定し、身体・髪・装飾・遮蔽を判断。"
  ],
  [
    "選擇適合的動作：人形可嘗試輕微跟隨；持道具或手臂不適合時停用揮手，其他造型先用整體微動。",
    "Choose suitable motion: gentle following for reviewed humanoids; disable unsuitable or prop-holding waves; start other structures with silhouette idle.",
    "人型は穏やかな追従、道具を持つ腕や不適切な手振りは無効化。他の形状は全体の小さな揺れから。"
  ],
  [
    "Python 輸出：依原畫座標建立 model.json、綁定圖、可見部位 PNG 與 rig-spec.md。",
    "Python exports model.json, a binding overlay, visible-part PNGs and rig-spec.md in original-image coordinates.",
    "原画座標で model.json、バインド図、可視部位 PNG、rig-spec.md を出力。"
  ],
  [
    "API 播放與驗收：使用本機 runtime 預覽，檢查臉部、接縫與動態品質，再修正綁定。",
    "Play and verify: preview with the local runtime, inspect faces, seams and motion, then refine bindings.",
    "ローカル runtime で再生し、顔・継ぎ目・動きを確認してバインドを修正。"
  ],
  [
    "AI 負責圖片語意判讀，Python 負責量測與檔案產出。可見部位拆圖不會補出被遮住的像素；播放器使用完整原畫的單一網格。眨眼、口型與大幅轉身需要額外素材和引擎功能。",
    "AI supplies visual judgment; Python measures and exports files. Visible-part extraction does not reconstruct hidden pixels. Playback uses one mesh on the full artwork. Blink, lip-sync and large turns need extra assets and engine behavior.",
    "画像の意味は AI が判断し、Python は測定と出力を行います。隠れた画素は復元しません。再生は原画全体の単一メッシュです。まばたき・口形・大きな回転には追加素材と機能が必要です。"
  ],
  [
    "查看角色綁定完整流程",
    "Read the full character binding guide",
    "キャラクターのバインド手順を見る"
  ],
  [
    "查看 skill 原始文件",
    "Read the skill source files",
    "スキルの原文を見る"
  ],
  [
    "安裝工具：官方 Skills CLI",
    "Installer: official Skills CLI",
    "導入ツール：公式 Skills CLI"
  ],
  [
    "$yuragi-character\n請從零建立我的原創角色，先整理角色設定與固定特徵。\n交付角色基準與 character-brief.md，供後續動態規劃使用。",
    "$yuragi-character\nCreate my original character from scratch. Establish the brief and fixed features first.\nDeliver a character baseline and character-brief.md for motion planning.",
    "$yuragi-character\nオリジナルキャラクターをゼロから作り、設定と固定要素を整理してください。\n動きの設計に使える基準と character-brief.md を作成してください。"
  ],
  [
    "$yuragi-rig-spec\n請把 /path/to/my-character.png 轉成我的動態角色，保留原本設計。\n先看圖判斷合適的動作，使用 Python 量測、拆解可見部位並建立綁定。\n對應 Yuragi API，交付 model.json、rig-spec.md 與可播放的預覽，實際檢查並修正動態。",
    "$yuragi-rig-spec\nAnimate /path/to/my-character.png while preserving its design.\nInspect the image, choose suitable motion, and use Python to measure, extract visible parts and prepare bindings.\nMap Yuragi APIs; deliver model.json, rig-spec.md and a playable preview. Inspect and refine the actual motion.",
    "$yuragi-rig-spec\n/path/to/my-character.png のデザインを保ち、動くキャラクターにしてください。\n画像を見て適した動きを選び、Python で測定・可視部位の抽出・バインドを行ってください。\nYuragi API に対応する model.json、rig-spec.md、再生プレビューを作成し、実際に動きを確認・修正してください。"
  ],
  [
    "Python 輔助工具",
    "Python preparation helper",
    "Python 補助ツール"
  ],
  [
    "安裝後，AI 會從 skill 目錄執行以下流程，並依你的原畫寫出 character-analysis.json；你不用自己標控制點。",
    "After installation, AI runs this workflow from the skill directory and writes character-analysis.json from your artwork. You do not need to annotate pins manually.",
    "導入後、AI がスキル内のツールを実行し、原画から character-analysis.json を作成します。制御点の手動入力は不要です。"
  ],
  [
    "查看 Python 判讀與轉換指南",
    "Read the Python preparation workflow",
    "Python の準備・変換ガイドを見る"
  ],
  [
    "只要 spec 時，在 Prompt 加上「這次只完成 spec，不建立播放器」。",
    "For a spec only, add “Deliver the spec only; do not implement the player.”",
    "仕様のみなら「今回は仕様のみで、プレイヤーは作成しない」と指定してください。"
  ],
  [
    "MIT 授權與 AI 圖片商用提醒",
    "MIT license and commercial use of AI images",
    "MIT ライセンスと AI 画像の商用利用について"
  ],
  [
    "程式碼與 Skills 採 MIT 授權；角色素材與生成圖片的權利另行確認。",
    "Code and Skills use the MIT license; rights to character assets and generated images must be checked separately.",
    "コードと Skills には MIT ライセンスを適用します。キャラクター素材と生成画像の権利は別途確認してください。"
  ],
  [
    "透過 Skill 與 AI 工具生成或修改的圖片，可能涉及第三方權利，不保證可合法商用。商用前請自行確認素材授權與工具條款。",
    "Images generated or edited with a Skill and AI tools may involve third-party rights and are not guaranteed lawful for commercial use. Check source permissions and tool terms before commercial use.",
    "Skill と AI ツールで生成・編集した画像は第三者の権利に関わる可能性があり、適法な商用利用は保証されません。商用利用前に素材の許諾とツールの規約を確認してください。"
  ],
  [
    "使用者須自行處理生成圖片的授權與使用爭議；Yuragi 不提供權利審查或法律爭議處理服務。雙方責任仍依適用法律判斷。",
    "Users must address permissions and disputes over their use of generated images. Yuragi does not provide rights review or legal dispute handling. Both parties’ responsibilities remain subject to applicable law.",
    "生成画像の許諾と利用上の紛争には利用者自身で対応してください。Yuragi は権利審査や法的紛争の処理サービスを提供しません。双方の責任は適用法令に従います。"
  ]
]
