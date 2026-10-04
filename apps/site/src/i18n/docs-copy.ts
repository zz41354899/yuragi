export const docsCopy: [string, string, string][] = [
  ["所有 API", "All APIs", "すべての API"],
  ["目前以海月みれあ為主要範例：1024 × 1536 的完整原畫，搭配控制點、局部部件、持傘保護、頭頸跟隨與左右眼量測。圖片與綁定設定分開保存，模型隨套件提供。","Mirea is the current primary example: a complete 1024 × 1536 illustration with pins, local parts, umbrella protection, head and neck following, and measured eyes. Artwork and bindings are stored separately and ship with the package.","現在の主なサンプルは海月みれあです。1024 × 1536 の原画に、制御点、局所パーツ、傘の保護、頭・首の追従、両目の測定値を設定しています。画像とバインドは別々に保存され、パッケージに同梱されています。"],
  ["載入海月模型","Load the Mirea model","海月モデルを読み込む"],
  ["從 @yuragi/rig/mirea 匯入 createMireaModel()，取得海月綁定的獨立副本。網站與套件使用相同模型，圖片路徑依你的專案設定。","Import createMireaModel() from @yuragi/rig/mirea to get an independent copy of Mirea’s bindings. The site and package use the same model; set the image URL for your project.","@yuragi/rig/mirea の createMireaModel() で海月のバインドのコピーを取得します。サイトとパッケージは同じモデルを使い、画像 URL はプロジェクトに合わせて指定します。"],
  ["海月模型包含什麼？","What is in Mirea’s model?","海月モデルの内容"],
  ["模型格式版本與海月的角色識別；格式版本和套件版本分開管理。","Model format version and Mirea’s identity; format and package versions are managed separately.","モデル形式のバージョンと海月の識別情報。形式とパッケージのバージョンは別々に管理します。"],
  ["海月原畫的圖片路徑與 1024 × 1536 尺寸。","Mirea’s artwork URL and 1024 × 1536 dimensions.","海月原画の画像 URL と 1024 × 1536 のサイズ。"],
  ["腰部、頭根、頭頂、持傘接點、傘面、腳部與垂放手的 7 個控制點。","Seven pins for the waist, head root, head top, umbrella grip, canopy, feet and resting hand.","腰、頭の根元、頭頂、持ち傘の接点、傘面、足、下ろした手の7つの制御点。"],
  ["25 個髮束、服裝、飄帶與配件區域，包含根部、末端、彈簧與排除範圍。","25 hair, clothing, ribbon and accessory regions with roots, tips, springs and exclusions.","髪、服、リボン、アクセサリーの25領域。根元、先端、ばね、除外範囲を含みます。"],
  ["傘面、傘柄、持傘手與上下身的剛性保護區域。","Rigid protection regions for the canopy, shaft, holding hand, upper body and lower body.","傘面、傘の柄、持ち手、上半身、下半身を保護する剛性領域。"],
  ["上半身與骨盆兩組游標跟隨區域，分別設定位移、轉角與反應時間。","Two pointer-follow groups for the upper body and pelvis, each with its own translation, rotation and response time.","上半身と骨盤の2つのポインター追従グループ。移動、回転、反応時間を個別に設定します。"],
  ["48 × 72 網格設定、頭頸銜接、身體姿態範圍與臉部保護。","48 × 72 mesh settings, head and neck connection, body pose regions and face protection.","48 × 72 のメッシュ設定、頭と首の接続、体の姿勢領域、顔の保護。"],
  ["左右眼與瞳孔的中心、範圍與移動距離；眼皮與嘴巴保留原畫。","Measured eye and pupil centers, bounds and travel; eyelids and mouth retain the original artwork.","両目と瞳孔の中心、範囲、移動量。まぶたと口は原画を保ちます。"],
  ["待機搖擺、局部部件強度，以及游標反應、阻尼與整體漂移。","Idle sway, local part strength, pointer response, damping and overall drift.","待機の揺れ、局所パーツの強さ、ポインター応答、減衰、全体の移動。"],
  ["海月的髮束與服裝使用 parts，不使用舊式 hair／accessories 鏈；目前這兩個陣列為空。motion.parts 控制局部部件強度，motion.layers 控制 pointerGroups 的共同倍率。","Mirea’s hair and clothing use parts rather than legacy hair/accessories chains; both arrays are currently empty. motion.parts scales local parts, while motion.layers scales pointerGroups.","海月の髪と服は parts を使います。旧式の hair／accessories チェーンは現在空です。motion.parts は局所パーツ、motion.layers は pointerGroups の共通倍率です。"],
  ["海月的部件與持傘保護","Mirea’s parts and umbrella protection","海月のパーツと傘の保護"],
  ["髮束與布料在各自的標註區域內變形，並排除臉部與身體等範圍。傘面、傘柄與持傘手共用 umbrella-grip 接點，避免局部彈簧把傘拉彎或讓手與傘分離。這些設定作用於同一張完整原畫。","Hair and cloth deform within annotated regions, excluding areas such as the face and body. The canopy, shaft and holding hand share the umbrella-grip anchor to keep local springs from bending the umbrella or separating it from the hand. These bindings act on one complete illustration.","髪と布は注釈領域内で変形し、顔や体などを除外します。傘面、柄、持ち手は umbrella-grip を共有し、局所ばねによる傘の曲がりや手との分離を防ぎます。同じ一枚の原画に作用する設定です。"],
  ["海月的頭頸與游標跟隨","Mirea’s head, neck and pointer following","海月の頭・首とポインター追従"],
  ["pose.headFollow 定義頭部的旋轉、位移與頸部銜接。pointerGroups 讓上半身與骨盆以不同反應時間跟隨游標；目前 tracking.bodyFollow 為 0.25，保留小幅身體跟隨。setPointer 控制姿態，setGaze 可另外指定眼神方向。","pose.headFollow defines head rotation, translation and the neck connection. pointerGroups give the upper body and pelvis different response times. tracking.bodyFollow is currently 0.25 for subtle body following. setPointer controls pose; setGaze can set eye direction separately.","pose.headFollow は頭の回転、移動、首の接続を定義します。pointerGroups で上半身と骨盤の反応時間を分けます。tracking.bodyFollow は現在 0.25 で、小さな体の追従を残します。setPointer は姿勢、setGaze は独立した視線方向を設定できます。"],
  ["海月已包含左右眼量測，眼神只平移瞳孔。setGaze 控制方向，setGazeStrength 控制強度；中立與減少動態時保留原畫。下方片段示範眼神強度的 Bézier 曲線，不改變眼皮或嘴巴。","Mirea includes measured eyes; gaze translates pupils only. setGaze controls direction and setGazeStrength controls intensity. Neutral and reduced-motion states preserve the original artwork. This clip uses a Bézier curve for gaze strength, leaving eyelids and mouth intact.","海月は両目の測定値を含み、視線は瞳孔だけを移動します。setGaze は方向、setGazeStrength は強さを制御します。中立時と動作軽減時は原画を保ちます。例は視線の強さに Bézier 曲線を使い、まぶたと口は変えません。"],
  ["調整海月","Adjust Mirea","海月を調整"],
  ["在遊樂場的「圖層」頁籤選取海月部件，調整最大轉角、剛性與阻尼，再查看骨架、部件區域或網格。這裡的部件區域仍共用完整原畫。模型座標使用 0–1：左上角是 (0, 0)，右下角是 (1, 1)。","Select Mirea’s parts in the playground’s Layers tab, adjust rotation, stiffness and damping, then inspect the rig, part regions or mesh. These regions still share the complete artwork. Model coordinates run from top-left (0, 0) to bottom-right (1, 1).","プレイグラウンドの「レイヤー」タブで海月のパーツを選び、最大回転角、剛性、減衰を調整し、リグ、領域、メッシュを確認します。領域は完全な原画を共有します。座標は左上 (0, 0) から右下 (1, 1) です。"],
  ["查看海月部件與骨架","Inspect Mirea’s parts and rig","海月のパーツとリグを見る"],
  ["以海月為參考，重新量測新角色的圖片尺寸、控制點、部件遮罩、頭頸範圍與眼睛。持傘接點與排除區域是依海月原畫設定，不能直接套用到不同姿勢或道具。","Use Mirea as a reference, then measure your own image dimensions, pins, part masks, head and neck regions, and eyes. Her umbrella anchors and exclusions are specific to her artwork and cannot be applied directly to other poses or props.","海月を参考に、新しいキャラクターの画像サイズ、制御点、パーツマスク、頭・首、目を測定します。持ち傘の接点と除外範囲は海月の原画専用で、異なる姿勢や道具にはそのまま適用できません。"],
  ["這份海月模型以完整原畫的網格變形與瞳孔平移為主。大角度轉身或新的肢體動作仍需補全遮擋素材，並重新設計綁定與動畫；只替換圖片不會自動完成。","This Mirea model uses whole-artwork mesh deformation and pupil translation. Large turns or new limb motions require completed occluded artwork and redesigned bindings and animation; replacing the image alone does not provide them.","この海月モデルは原画全体のメッシュ変形と瞳孔の移動が中心です。大きな回転や新しい手足の動きには、隠れた原画の補完とバインド・アニメーションの再設計が必要です。画像の差し替えだけでは完成しません。"],
  [
    "眼睛追蹤",
    "Eye tracking",
    "視線追従"
  ],
  [
    "讓角色的瞳孔跟著游標移動。需先依原圖量測 face；這裡使用游標輸入，不需要攝影機。",
    "Move illustrated pupils with the pointer. Measure face features from the artwork first; this uses pointer input without a camera.",
    "原画から face を測定し、ポインターで瞳孔を動かします。カメラは不要です。"
  ],
  [
    "01. 準備已審核的臉部模型",
    "01. Prepare a reviewed face model",
    "01. 確認済みの顔モデルを準備"
  ],
  [
  "缺少 face 的模型無法使用眼神 setter。setGaze 與 setGazeStrength 需要已審核的左右眼與 headFollow.region；只換圖片不會建立眼睛綁定。",
  "Models without face cannot use gaze setters. setGaze and setGazeStrength require reviewed eyes and headFollow.region; replacing the image does not create bindings.",
  "setGaze と setGazeStrength には両目と headFollow.region が必要です。画像差し替えだけではバインドされません。"
],
  [
  "face 只包含左右眼量測。setGazeStrength 控制 0–1 強度，預設 1；眼皮與嘴巴保留原畫。",
  "face contains only measured eyes. setGazeStrength controls 0–1 strength, default 1; original eyelids and mouth remain intact.",
  "face は両目の測定値のみです。setGazeStrength は 0–1、初期値は1。まぶたと口は原画を保ちます。"
],
  [
    "02. 輸入座標與呼叫順序",
    "02. Coordinates and call order",
    "02. 座標と呼び出し順序"
  ],
  [
    "setPointer 是舞台中心的相對位置，建議每軸 −0.5…0.5；setGaze 是獨立眼神方向，每軸 −1…1。X 正值往右、Y 正值往下。",
    "setPointer uses centered stage fractions, normally −0.5…0.5 per axis; setGaze uses independent eye direction, −1…1. Positive X is right; positive Y is down.",
    "setPointer は中央基準で通常 −0.5…0.5、setGaze は独立した視線で −1…1。X 正方向は右、Y は下です。"
  ],
  [
    "setPointer 也會設定眼神。結合頭部與眼睛時先呼叫 setPointer，再呼叫 setGaze；lookX／lookY 的 setParameter 或動畫軌會讓眼神重新跟隨頭部。",
    "setPointer also sets gaze. For separate head and eye targets, call setPointer before setGaze. lookX/lookY parameter setters or tracks restore gaze following the head.",
    "setPointer は視線も設定します。頭と目を分けるなら setPointer の後に setGaze を呼びます。lookX/lookY の設定・トラックは頭に追従する視線へ戻します。"
  ],
  [
    "03. 在元件取得 player 後接上互動",
    "03. Connect input after player readiness",
    "03. player の準備後に入力を接続"
  ],
  [
    "Vue 使用 @ready，React 使用 onReady 取得同一個 RigPlayer。將事件綁在角色容器；只改眼神時呼叫 setGaze。離開、觸控取消與鍵盤 Escape 都可回到 (0, 0)。",
    "Vue @ready and React onReady provide the same RigPlayer. Bind events to the character container and call setGaze for eyes only. Leave, touch cancellation and Escape can restore (0, 0).",
    "Vue の @ready、React の onReady で同じ RigPlayer を取得します。容器の入力を setGaze に渡し、離脱・タッチ取消・Escape で (0, 0) に戻せます。"
  ],
  [
    "這個範例以舞台位置控制方向。要對準移動中的臉部，需考慮原圖眼睛中心、canvas 的 12% 留白與 trackingOffset；快照不包含完整頭部轉換，對位仍是近似。",
    "This example maps stage position to direction. Targeting a moving face requires its source eye center, 12% canvas padding and trackingOffset. Snapshots do not expose the complete head transform, so alignment remains approximate.",
    "例は舞台位置を方向へ変換します。動く顔への照準には目の原画座標、canvas の12%余白、trackingOffset が必要です。頭の完全な変換は公開されず、位置合わせは近似です。"
  ],
  [
    "04. 驗證與常見錯誤",
    "04. Verification and common errors",
    "04. 検証とよくあるエラー"
  ],
  [
    "逐眼檢查中心、上下左右、四個角落與快速反向；確認瞳孔不穿出眼白、眼線不變形。另測試觸控、方向鍵、減少動態、原畫備援與頁面卸載。",
    "Inspect each eye at center, all directions, corners and rapid reversal. Check pupil containment and intact eye lines; also verify touch, arrow keys, reduced motion, fallback and unmount.",
    "各目の中央・上下左右・四隅・急な反転を確認。瞳孔のはみ出しや線の変形、タッチ・矢印キー・動作軽減・原画表示・終了処理も検証します。"
  ],
  [
  "沒有 face 時呼叫眼神 API 會拋錯。眼睛不動時，先檢查 strength、travel、播放器是否暫停與系統減少動態。",
  "Eye APIs throw without face. If eyes do not move, check strength, travel, pause state and reduced motion.",
  "face がなければ視線 API はエラーです。動かない場合は strength、travel、一時停止、動作軽減を確認します。"
],
  [
  "Python 分階段流程",
  "Staged Python workflow",
  "Python の段階的な処理"
],
  [
  "Agent 先讀 yuragi-rig-spec，再 inspect、看圖標註、extract，最後 build --prepared。Python 支援 eyes 與 pointerGroups，建模時呼叫實際 runtime 驗證。",
  "Read yuragi-rig-spec first, then inspect, annotate, extract and build --prepared. Python exports eyes and pointerGroups and runs the actual runtime validator.",
  "最初に yuragi-rig-spec を読み、inspect・注釈・extract・build --prepared の順に進めます。eyes と pointerGroups を出力し、実際の runtime で検証します。"
],
  [
    "完整眼睛標註與整合範例",
    "Full eye authoring and integration examples",
    "目の測定と統合の詳細例"
  ],
  [
    "Python 命令、錯誤與功能缺口",
    "Python commands, failures and capability gaps",
    "Python コマンド・エラー・機能差分"
  ],
  [
    "核心匯出與工具函式",
    "Core exports and utility functions",
    "コアの公開関数とツール"
  ],
  [
    "完整 API 契約與欄位範圍",
    "Complete API contract and field ranges",
    "完全な API 契約と欄位の範囲"
  ],
  [
    "動畫通道與暫停行為",
    "Animation channels and pause behavior",
    "アニメーションのチャンネルと停止動作"
  ],
  [
  "動畫支援 parameter、gaze.strength 與 motion.weight；strength 是眼神強度，不是 X／Y 方向。pause() 凍結整個播放器，pauseAnimation() 只凍結片段，stopAnimation() 保留最後值。",
  "Tracks support parameter, gaze.strength and motion.weight. Strength controls intensity, not X/Y direction. pause() freezes the player, pauseAnimation() only the clip; stopAnimation() retains final values.",
  "parameter・gaze.strength・motion.weight に対応。strength は方向ではなく強度です。pause() は全体、pauseAnimation() はクリップのみ停止し、stopAnimation() は最後の値を保持します。"
],
  [
    "眼睛追蹤的前置條件與範例",
    "Eye tracking prerequisites and examples",
    "視線追従の前提と例"
  ],
  [
    "Skill 如何呼叫 Python？",
    "How does the Skill use Python?",
    "Skill は Python をどう使う？"
  ],
  [
  "Agent 必須先讀 yuragi-rig-spec 與 API 契約，再看圖標註並執行 inspect／extract／build。Python 不會啟動 Skill；角色設計與素材製作交給 yuragi-character。",
  "The agent must read yuragi-rig-spec and the API contract before inspecting, annotating and running inspect/extract/build. Python does not launch Skills; character design and artwork belong to yuragi-character.",
  "Agent は先に yuragi-rig-spec と API 契約を読み、原画の注釈と inspect/extract/build を実行します。Python は Skill を起動しません。キャラクター設計と素材制作は yuragi-character が担当します。"
],
  [
    "產出檔案與完成條件",
    "Outputs and completion evidence",
    "出力と完了の根拠"
  ],
  [
  "inspect 產生量測、格線與標註草稿；extract 產生部件、遮罩與指紋 manifest；build --prepared --rig-package 驗證模型並產生本機互動預覽。",
  "inspect emits measurements, grid and annotation draft; extract emits parts, masks and fingerprint manifest; build --prepared --rig-package validates the model and creates a local interactive preview.",
  "inspect は測定・グリッド・注釈草案、extract は部品・マスク・指紋 manifest を出力。build --prepared --rig-package はモデル検証とローカルプレビューを行います。"
],
  [
  "partsExtracted 表示部件已拆出；modelValidation: passed 表示實際 runtime 驗證通過。visualAcceptance 仍為 not-run，需開啟 HTTP 預覽檢查動態後才更新。",
  "partsExtracted confirms extraction; modelValidation: passed confirms actual runtime validation. visualAcceptance remains not-run until motion is reviewed in the HTTP preview.",
  "partsExtracted は切り出し完了、modelValidation: passed は実際の runtime 検証成功を示します。visualAcceptance は HTTP プレビューで確認するまで not-run です。"
],
  [
    "輸出資料夾非空時請換新版本；SHA 不符時重新 inspect。缺少 PIL 時在同一個 Python 環境安裝 requirements；缺少 dist/index.js 時先建置本機 library。",
    "Use a new version for nonempty output; re-inspect a mismatched SHA. Install requirements in the same Python environment for missing PIL; build the local library for missing dist/index.js.",
    "出力先が空でなければ新バージョンへ、SHA 不一致なら再測定。PIL がなければ同じ Python 環境へ requirements を導入し、dist/index.js がなければ library をビルドします。"
  ],
  [
  "AI 負責原圖分析，Python 負責量測與拆件。此流程輸出 v1 完整原圖；v2 獨立附件需另用 build_layers.py 建置並提供遮擋補圖。",
  "AI analyzes artwork; Python measures and extracts parts. This workflow outputs v1 shared-surface models. Use build_layers.py for independent v2 attachments, supplying completed occluded artwork.",
  "AI が原画を分析し、Python が測定と切り出しを行います。この手順は v1 を出力。独立した v2 パーツは build_layers.py と隠れた原画の補完が必要です。"
],
["只平移瞳孔，保持原畫眼線、眼皮與嘴巴。", "Translate pupils while preserving original eye lines, eyelids and mouth.", "原画の線・まぶた・口を保ち、瞳孔だけを移動します。"],
["眼神強度", "Gaze strength", "視線の強度"],
["眼神 X", "Gaze X", "視線 X"],
["眼神 Y", "Gaze Y", "視線 Y"],
["此模型缺少眼睛標註；請載入已審核的眼睛模型。", "This model has no eye annotations; load a reviewed eye model.", "このモデルには目の注釈がありません。確認済みのモデルを読み込んでください。"],
["此舞台使用 v1 完整原圖；v2 分層預覽見眼睛追蹤文件。", "This stage uses the v1 source image. See the eye-tracking guide for the v2 layered preview.", "このステージは v1 原画を使用。v2 レイヤープレビューは視線追跡ガイドにあります。"],
["眼神強度，預設 1；需有 face 標註。", "Gaze strength, default 1; requires face annotations.", "視線強度、初期値1。face の注釈が必要です。"],
["05. 海月的實際綁定", "05. Mirea’s actual bindings", "05. Mirea の実際のバインド"],
  ["海月模型已隨套件提供。從 @yuragi/rig/mirea 匯入 createMireaModel，並使用複製到 public/models/mirea 的 texture.png。網站也以同一套件工廠載入模型，再改用網站圖片路徑。", "Mirea ships with the package. Import createMireaModel from @yuragi/rig/mirea and copy texture.png into public/models/mirea. The website uses the same factory with its own image URL.", "海月モデルはパッケージに同梱されています。@yuragi/rig/mirea から createMireaModel を読み込み、texture.png を public/models/mirea にコピーします。サイトも同じファクトリーで画像 URL だけを変更します。"],
["Hero 先 setPointer，再 setGaze；使用左右眼平均中心加 trackingOffset 修正整體漂移，X／Y 感應距離分別為原畫顯示寬度的 18% 與高度的 11%。", "The Hero calls setPointer before setGaze. Average eye center plus trackingOffset corrects whole-image drift; sensitivity ranges are 18% of displayed artwork width and 11% of height.", "Hero は setPointer の後に setGaze を呼びます。両目の平均中心に trackingOffset を加えて全体移動を補正。感応範囲は表示原画の幅18%、高さ11%です。"],
["Hero 使用原畫容器座標，不再加 canvas 留白；若改用 canvas 邊界，需用 toCanvas 換算。快照不含完整頭部、搖擺與群組變換，所以對準移動中的臉仍是近似。", "The Hero uses artwork-container coordinates without adding canvas padding again. Canvas-based input needs toCanvas. Snapshots omit full head, sway and group transforms, so face targeting remains approximate.", "Hero は原画容器座標を使い、canvas の余白を再加算しません。canvas 境界なら toCanvas が必要です。頭・揺れ・グループの完全変換は快照に含まれず、照準は近似です。"],
["來源座標", "Source coordinates", "原画座標"],
["分層引擎使用注意事項", "Layered engine usage notes", "レイヤーエンジンの使用上の注意"],
["06. 分層引擎預覽", "06. Layered engine preview", "06. レイヤーエンジンのプレビュー"],
["v2 分層播放器使用獨立附件與圖集。這份海月預覽只有可見裁片，尚缺遮擋補圖；持傘手與傘共用剛性變換，髮尾使用局部彈簧。", "The v2 player draws independent attachments from an atlas. This Mirea preview has visible extracts only, with occluded artwork still missing. The holding hand and umbrella share a rigid transform; the hair tip uses a local spring.", "v2 は独立したパーツをアトラスから描画します。この海月プレビューは可視部分のみで、隠れた原画の補完が必要です。手と傘は同じ剛性変換、髪先は局所ばねを使います。"],
["分層角色互動預覽", "Interactive layered character preview", "レイヤーキャラクターの操作プレビュー"],
["移動游標或使用方向鍵，Escape 回到中心。", "Move the pointer or use arrow keys. Escape returns to center.", "ポインターまたは矢印キーで操作。Escape で中央に戻ります。"],
["檢查中立原畫", "Inspect neutral artwork", "中立の原画を確認"],
["CPU 更新與提交", "CPU update and submission", "CPU 更新と描画送信"],
["數據是此瀏覽器的 CPU 更新與繪製提交，不包含 GPU 完成時間。實體手機與補圖後的視覺驗收仍需另測。", "Metrics measure CPU updates and draw submission in this browser, excluding GPU completion. Physical mobile testing and visual acceptance with completed artwork remain pending.", "数値はこのブラウザーの CPU 更新と描画送信で、GPU 完了時間は含みません。実機モバイルと補完原画の目視検証は別途必要です。"]
]
