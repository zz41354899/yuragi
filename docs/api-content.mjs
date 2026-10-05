// Behavior descriptions are maintained here; signatures and export coverage come from TypeScript.
const text = (zh, en, ja) => ({ 'zh-TW': zh, en, ja })
export const descriptions = {
  createPlayer: text('建立共享網格播放器；驗證模型並載入原圖後回傳 Promise。', 'Create a shared-surface player after model validation and source-image loading.', 'モデル検証と原画の読み込み後、共有メッシュプレイヤーを作成します。'),
  createLayeredPlayer: text('建立 v2 分層播放器，載入圖集並保留附件順序。', 'Create a v2 player, load atlases and preserve authored attachment order.', 'アトラスを読み込み、指定されたアタッチメント順で v2 を描画します。'),
  createSimulation: text('建立不依賴框架的共享網格模擬器；自行管理時間與渲染。', 'Create a framework-independent shared-surface simulation; the caller owns time and rendering.', '共有メッシュのシミュレーションを作成。時間・描画は呼び出し側で管理します。'),
  createLayeredSimulation: text('編譯 v2 節點、權重與批次；自行呼叫 update 更新。', 'Compile v2 nodes, sparse weights and consecutive draw batches; call update yourself.', 'v2 のノード・重み・連続描画バッチを構築し、update で更新します。'),
  createMireaModel: text('從獨立角色入口取得內附海月綁定；圖片必須符合原模型。', 'Create the bundled Mirea bindings through the separate character entry. The image must match the authored rig.', '独立した入口から海月のバインドを取得。画像は既存リグに一致する必要があります。'),
  validateModel: text('驗證 v1 模型；成功會縮窄 unknown，失敗會拋錯。', 'Assert the complete v1 model contract, narrow unknown on success and throw on failure.', 'v1 モデルを検証。成功時は unknown を絞り込み、失敗時は例外になります。'),
  validateLayeredModel: text('驗證 v2 圖集、父子節點、权重、共享接點與附件資料。', 'Assert v2 atlases, parent order, normalized weights, shared joints and attachments.', 'v2 のアトラス・親子順・正規化重み・共有接点・アタッチメントを検証します。'),
  validateAnimation: text('驗證動畫軌與關鍵影格；眼神強度軌需有已審核的 face。', 'Validate tracks and keyframes. Gaze-strength tracks require reviewed face features.', 'トラックとキーフレームを検証。視線強度には確認済みの face が必要です。'),
  sampleCurve: text('取樣線性、階梯或 cubic-bezier 曲線。', 'Sample a linear, step or cubic-bezier animation curve.', 'linear・step・cubic-bezier の曲線を評価します。'),
  sampleTrack: text('依毫秒時間取樣一條已驗證動畫軌。', 'Sample a validated animation track at a time in milliseconds.', '検証済みトラックをミリ秒の時刻で評価します。'),
  constrainSharedSurface: text('依三角形位移梯度降低整體動態，直接修改 positions。', 'Limit triangle displacement gradients by scaling the positions buffer in place.', '三角形の変位勾配を制限し、positions を直接調整します。'),
  toCanvas: text('將原圖 0–1 座標轉為含 12% 留白的 canvas 0–1 座標。', 'Convert source-normalized coordinates to canvas coordinates with 12% padding.', '原画の 0–1 座標を 12% の余白を含む canvas 座標に変換します。'),
  play: text('開始或恢復播放，尊重 reducedMotion 設定。', 'Start or resume playback while respecting reducedMotion.', 'reducedMotion に従って再生・再開します。'),
  pause: text('停止動畫迴圈並保留目前姿態。', 'Stop the animation loop and retain the current pose.', 'アニメーションループを停止し、現在の姿勢を保持します。'),
  setPointer: text('設定舞台中心的相對游標；一般每軸 −0.5…0.5，X 右、Y 下。', 'Set centered pointer coordinates, normally −0.5…0.5 per axis; positive X is right and Y is down.', '中央基準のポインターを設定。通常各軸 −0.5…0.5、X は右、Y は下です。'),
  setGaze: text('設定獨立眼神，每軸 −1…1；需已量測的 eyes，不改變頭身。', 'Set independent eye direction in −1…1 per axis; requires measured eyes and does not move the head/body.', '各軸 −1…1 の独立視線を設定。測定済みの目が必要で、頭・体は動かしません。'),
  setGazeStrength: text('設定眼神強度 0–1，預設 1；沒有 face 時不可使用。', 'Set gaze strength in 0…1, default 1; unavailable without face features.', '視線強度を 0…1 に設定。初期値は 1、face が必要です。'),
  setParameter: text('設定 lookX／lookY（−30…30）、bodyX（−10…10）或 wave（0…1）。', 'Set lookX/lookY (−30…30), bodyX (−10…10) or wave (0…1).', 'lookX/lookY（−30…30）、bodyX（−10…10）、wave（0…1）を設定します。'),
  setMotion: text('合併更新動態設定；省略欄位保留原值，驗證失敗不部分更新。', 'Merge motion settings; omitted fields retain their values and validation failures do not partially commit.', '動作設定をマージ。省略値を保持し、検証失敗時は一部だけ変更しません。'),
  setTracking: text('合併追蹤慣性設定；設定需符合 TrackingSettings 數值範圍。', 'Merge pointer inertia settings within the TrackingSettings bounds.', 'TrackingSettings の範囲内で追従の慣性を更新します。'),
  setPin: text('修改現有控制點座標與動態欄位；不能透過此方法改名、改父節點或新增。', 'Patch an existing pin’s position/dynamics; this setter does not rename, reparent or add pins.', '既存制御点の位置・動作を変更。名前変更・親変更・追加は行いません。'),
  setPart: text('修改既有柔性部件；播放器會在幾何欄位修改後重新計算綁定。', 'Patch an existing flexible part; the player rebinds when geometry fields change.', '既存の柔軟パーツを変更。形状変更時にプレイヤーがバインドを再計算します。'),
  wave: text('觸發共享網格的揮手進度；需符合可見自由手臂的素材與綁定。', 'Trigger shared-surface wave progress; requires suitable visible free-arm artwork and bindings.', '共有メッシュの手振りを開始。見える自由な腕と適切なバインドが必要です。'),
  reset: text('回到中立狀態，保留編輯過的模型設定。', 'Restore neutral state while retaining edited model settings.', '編集したモデル設定を保持し、中立状態に戻します。'),
  getModel: text('取得目前模型的深層獨立副本；圖片網址仍需由整合專案處理。', 'Return a deep model copy; resolve image URLs in the consuming project.', 'モデルの独立コピーを取得。画像 URL は利用側で解決します。'),
  getSnapshot: text('取得目前播放狀態及診斷；不是每幀渲染時鐘。', 'Read current state and diagnostics; snapshots are not a frame clock.', '現在の状態・診断を取得。フレームごとの時計として使いません。'),
  getMeshSnapshot: text('按需複製最後提交的網格；適合低頻檢視，避免每幀大量複製。', 'Copy the last submitted mesh on demand for low-frequency inspection.', '最後に送信したメッシュを必要時だけ複製。低頻度の確認向けです。'),
  destroy: text('取消播放、移除監聽並釋放 GPU 資源；可重複呼叫。', 'Stop playback, detach listeners and release GPU resources; repeated calls are safe.', '再生停止・監視解除・GPU 解放を行います。繰り返し呼び出せます。'),
  playAnimation: text('播放已驗證的參數、眼神強度或動態權重動畫。', 'Play a validated parameter, gaze-strength or motion-weight clip.', '検証済みのパラメーター・視線強度・動作重みのクリップを再生します。'),
  pauseAnimation: text('暫停片段時間軸；與暫停播放器迴圈分開。', 'Pause the clip timeline independently of the player loop.', 'プレイヤーループと独立してクリップの時間軸を停止します。'),
  seekAnimation: text('以毫秒定位目前片段，取樣後更新姿態。', 'Seek the current clip in milliseconds and apply its sampled pose.', '現在のクリップをミリ秒で移動し、評価した姿勢を適用します。'),
  stopAnimation: text('停止並清除片段；不自動還原片段已修改的數值。', 'Stop and clear the clip without restoring values it already changed.', 'クリップを停止・解除。変更済みの値は自動復元しません。'),
  updatePins: text('依經過時間與時間差更新參數、控制點及彈簧狀態；單位為毫秒。', 'Update parameters, pins and spring state using elapsed time and delta in milliseconds.', '経過時間と差分（ミリ秒）でパラメーター・制御点・ばねを更新します。'),
  updateVertices: text('將目前模擬狀態寫入網格 positions，並回傳變形保護診斷。', 'Write the simulated pose into mesh positions and return deformation diagnostics.', 'シミュレーションの姿勢を positions に書き、変形保護の診断を返します。'),
  buildContinuousMesh: text('建立原圖像素區域的連續三角網格與初始綁定。', 'Build a continuous triangle mesh and bindings for a source-pixel rectangle.', '原画のピクセル矩形に連続三角メッシュと初期バインドを構築します。'),
  rebindPin: text('重新計算指定網格的控制點權重；低階操作需與模型設定一致。', 'Recompute pin weights for a mesh; keep this low-level operation consistent with model settings.', '指定メッシュの制御点重みを再計算。モデル設定と整合させてください。'),
  update: text('更新 v2 節點矩陣與變形網格；時間為毫秒，回傳頂點是否改變。', 'Update v2 node matrices and mesh positions using milliseconds; return whether positions changed.', 'ミリ秒で v2 ノード行列・メッシュを更新し、頂点変更の有無を返します。'),
  getPointer: text('取得 v2 目前設定的游標目標。', 'Return the current v2 pointer target.', 'v2 の現在のポインター目標を返します。'),
  getPlayer: text('取得已就緒的播放器；載入前或卸載後為 undefined。', 'Get the ready player; undefined before loading or after cleanup.', '準備済みプレイヤーを取得。読み込み前・終了後は undefined です。'),
  YuragiCharacter: text('Vue／React 共享網格元件；提供原畫備援、減少動態與卸載清理。', 'Shared-surface component with artwork fallback, reduced motion and unmount cleanup.', '原画表示・動作軽減・終了処理を備えた共有メッシュコンポーネントです。'),
  YuragiLayeredCharacter: text('Vue／React v2 分層元件；支援取消載入、原畫備援與資源清理。', 'Layered v2 component with cancellable loading, artwork fallback and cleanup.', '読み込み取消・原画表示・終了処理を備えた v2 コンポーネントです。'),
}
export const extra = {
  createPlayer: 'autoplay=true; reducedMotion="respect"; pixelRatio defaults to devicePixelRatio, clamped to 1…2. signal is part of the callable options intersection. Initialization errors reject the Promise; onError reports later rendering errors. onFrame reports about every 100 ms plus explicit operations.',
  createLayeredPlayer: 'autoplay=true; reducedMotion="respect"; pixelRatio is clamped to 1…2. AbortSignal cancels loading and destroys an initialized player. Missing images/dimension mismatches reject; callbacks and cleanup are not framework render state.',
  setPointer: 'The v1 player also sets gaze. Call setPointer before setGaze for separate targets. Simulation-only setPointer has no face compositor. v2 drives authored node response; optional attachment-based setGaze/setFace is separate from v1 measured-eye APIs.',
  setParameter: 'The player rejects non-finite or unknown parameter inputs. The simulation returns a success boolean. lookX/lookY setters and parameter animation tracks restore gaze following the head.',
  setMotion: 'sway/hair/accessories/follow/parts: 0…2; speed: 0.25…2; weight/layers: 0…1. Defaults come from the loaded model, with optional weight/parts/layers defaulting to 1. layers scales pointer groups, not independent image layers.',
  setTracking: 'response: 0.001…0.2; damping: 0.1…0.98; maxVelocity: 0.1…5; bodyFollow: 0…1; translation per axis: 0…0.08. Invalid patches throw without partial mutation.',
  setGazeStrength: 'Finite 0…1 is required. This changes only pupil translation; v1 does not support blink/mouth/expression tracks; v2 attachment-based setFace is separate.',
  setPin: 'Model coordinates include all source margins, x/y in 0…1. Radius 0.005…0.5. Parent/type edits require validating a new model and recreating the player. The simulation setter does not automatically rebind an already-built mesh; call rebindPin.',
  setPart: 'Polygons contain 3…32 normalized vertices. Root/tip must differ. Geometry changes in a manually rendered simulation require rebuilding the mesh bindings; the player handles this for you.',
  wave: 'The player resumes its loop when paused; the simulation only sets progress at the supplied time. Do not use for a holding arm or claim universal limb animation.',
  reset: 'The v1 player stops its timeline and resets gaze/parameters. It preserves model motion values; zero motion.weight and gaze strength when comparing against unchanged artwork.',
  sampleCurve: 'Validate externally supplied clips first. Curve evaluation is not animation validation.',
  sampleTrack: 'Times are milliseconds. Validate the clip first. Values before/after the keyed range use the endpoint keys.',
  validateAnimation: 'The reviewed-face flag defaults to false. Track targets are parameter, gaze/strength and motion/weight. No arbitrary bone tracks, expressions or Spine imports.',
  constrainSharedSurface: 'Mutates positions, not rest/indices. The default gradient limit is 0.65. It is a geometric limiter, not a guarantee of visual acceptance.',
  toCanvas: 'CANVAS_PADDING is 0.12. Center remains 0.5. Positive source Y points down. Do not mix source coordinates, pointer offsets and parameter degrees.',
  buildContinuousMesh: 'spec is a pixel-space MeshSpec; default is the full source texture. columns/rowCount default to the model mesh dimensions. The returned rest/positions use normalized full-source coordinates.',
  updatePins: 'Call updatePins(time, deltaTime) before updateVertices(mesh, time). Time and deltaTime are milliseconds. Keep this state outside Vue/React render cycles.',
  updateVertices: 'Updates buffers in place; neutral=true requests neutral geometry. Diagnostics report motionScale and maximum displacement gradient, not material or artwork quality.',
  update: 'time and delta are milliseconds. reduced=false by default; true evaluates the static neutral pose. Mesh buffers and matrices are reused; do not replace them per frame.',
  getMeshSnapshot: 'v1 includes rest, positions, indices, base pin weights and pinNames. Base weights do not describe head/region/part ownership overrides. v2 includes rest, positions and indices only.',
  destroy: 'After destruction, create a new player to resume. Resource cleanup is idempotent. An AbortSignal also triggers cleanup.',
}
export const localizedNotes = {
  createSimulation: text('建立時完整驗證並複製模型；無效模型會拋錯，不載入圖片、不建立 GPU。自行管理毫秒時間與網格。原圖正規化座標包含圖片留白。','Validates and clones the model; invalid models throw. Does not load artwork or allocate a GPU. The caller owns millisecond timing and mesh rendering. Source-normalized coordinates include image margins.','生成時にモデルを検証・コピー。不正なモデルは例外。画像読み込み・GPU 生成なし。ミリ秒の時間と描画は利用側で管理し、原画座標に余白を含みます。'),
  createLayeredSimulation: text('建立時驗證 v2，無效節點、權重、附件與共享接點會拋錯。矩陣、稀疏綁定與批次為引擎狀態，不能每幀複製到框架 UI。','Validates v2 and throws for invalid nodes, weights, attachments or joints. Matrices, sparse bindings and batches are engine state; do not copy them into framework UI on every frame.','v2 を検証し、不正なノード・重み・アタッチメント・接点は例外。行列・バインド・バッチはエンジン状態として管理します。'),
  validateModel: text('純結構驗證，成功回傳 void 並縮窄 unknown；失敗拋出 Invalid rig model 錯誤。不会讀圖，也不建立視覺驗收紀錄。','Structural validation returns void and narrows unknown on success. Throws an Invalid rig model error on failure. It neither loads images nor establishes visual acceptance.','構造検証のみ。成功時は void、unknown を絞り込み、失敗時は Invalid rig model の例外。画像読み込み・見た目の認定は行いません。'),
  validateLayeredModel: text('純結構驗證，成功縮窄 unknown；錯誤會拋出。驗證拓樸、順序、權重與共享接點，不會驗證圖片內容或自動拆件。','Structural validation narrows unknown on success and throws on failure. Checks topology, ordering, weights and shared joints; does not inspect pixels or extract layers.','成功時は unknown を絞り込み、失敗時は例外。トポロジー・順序・重み・接点を検証。画素確認・自動分割は行いません。'),
  setGaze: text('需 face.eyes；缺少量測或輸入非有限數值會拋錯。有限值限制於每軸 −1…1；X 右、Y 下。減少動態時保留原畫瞳孔。','Requires face.eyes; missing measurements or non-finite coordinates throw. Finite input is clamped to −1…1 per axis, positive X right and Y down. Reduced motion preserves source pupils.','face.eyes が必要。測定不足・非有限座標は例外。各軸 −1…1 に制限し、X は右、Y は下。動作軽減時は原画の瞳孔を保持します。'),
  playAnimation: text('片段會複製並完整驗證，無效片段拋錯。時間與 duration 為毫秒，loop 預設 false；播放器會開始迴圈。減少動態保留中立原畫。','Clones and validates the clip, throwing for invalid tracks/keys. Time/duration use milliseconds; loop defaults to false. Resumes the player loop. Reduced motion preserves neutral artwork.','クリップを検証・コピー。不正なトラック・キーは例外。時間はミリ秒、loop は false。プレイヤーを再開し、動作軽減時は中立原画を保持します。'),
  seekAnimation: text('毫秒時間必須為有限數值，且須有活動片段，否則拋錯。時間限制於 0…duration；定位不會自動恢復暫停的片段。','Time must be finite and a clip must be active, otherwise throws. Clamps milliseconds to 0…duration. Seeking does not resume a paused clip.','有限のミリ秒と有効なクリップが必要。なければ例外。0…duration に制限し、停止中のクリップは再開しません。'),
  getPointer: text('回傳 v2 的正規化游標目標（每軸 −1…1），是 setPointer 輸入的兩倍後限制範圍，不是節點目前姿態。沒有位置參數。','Returns the v2 normalized target in −1…1 per axis: twice the setPointer input, clamped. This is a target, not the current node pose. No positional arguments.','v2 の目標を各軸 −1…1 で返します。setPointer 入力の2倍を制限した値で、現在の姿勢ではありません。引数なし。'),
  createPlayer: text('autoplay 預設 true；reducedMotion 預設 respect；pixelRatio 預設裝置倍率並限制 1–2。signal 在函式選項交集型別中。初始化失敗會 reject，onError 回報之後的渲染錯誤。onFrame 約每 100ms 與手動操作時回報。',extra.createPlayer,'autoplay は true、reducedMotion は respect、pixelRatio は装置値を 1–2 に制限。signal は実際の交差型に含まれます。初期化失敗は reject、その後は onError。onFrame は約100msごとと手動操作時。'),
  createLayeredPlayer: text('autoplay 預設 true，reducedMotion 預設 respect，pixelRatio 限制 1–2。AbortSignal 可取消載入並清理播放器。缺圖或尺寸不符會 reject。快照不應作為框架每幀渲染狀態。',extra.createLayeredPlayer,'autoplay は true、reducedMotion は respect、pixelRatio は 1–2。AbortSignal で読み込み取消・解放。画像不足・寸法不一致は reject。フレーム状態を UI レンダーに保存しません。'),
  setPointer: text('v1 播放器同時設定眼神；需要分開目標時先 setPointer，再 setGaze。純模擬器沒有眼睛合成器；v2 依作者節點反應；選用的分層 setGaze／setFace 與 v1 眼睛 API 分開。',extra.setPointer,'v1 プレイヤーは視線も変更。独立目標には setPointer の後に setGaze。シミュレーターに目の合成はなく、v2 はノード反応と、専用の分層 setGaze/setFace を使用。'),
  setParameter: text('播放器拒絕非有限或未知參數；模擬器回傳成功布林值。lookX／lookY 的 setter 或參數動畫會恢復眼神跟隨頭部。',extra.setParameter,'プレイヤーは非有限・未知の値を拒否。シミュレーターは成功の真偽値を返します。lookX/lookY の設定・トラックは視線を頭部追従に戻します。'),
  setMotion: text('sway／hair／accessories／follow／parts：0–2；speed：0.25–2；weight／layers：0–1。初始值來自模型，省略的 weight／parts／layers 預設 1。layers 是共同游標變換倍率。',extra.setMotion,'sway/hair/accessories/follow/parts：0–2、speed：0.25–2、weight/layers：0–1。初期値はモデル由来、省略 weight/parts/layers は1。layers は共有ポインター変換の倍率です。'),
  setTracking: text('response：0.001–0.2；damping：0.1–0.98；maxVelocity：0.1–5；bodyFollow：0–1；translation 各軸：0–0.08。無效更新拋錯且不部分修改。',extra.setTracking,'response：0.001–0.2、damping：0.1–0.98、maxVelocity：0.1–5、bodyFollow：0–1、translation：各軸0–0.08。不正な更新は例外で、部分変更しません。'),
  setGazeStrength: text('必須為有限的 0–1。只控制瞳孔平移；v1 不支援眨眼、嘴型或表情軌；v2 分層附件另有 setFace。',extra.setGazeStrength,'有限な0–1が必要。瞳孔移動のみで、v1 は瞬き・口・表情トラックに未対応。v2 の setFace は専用です。'),
  setPin: text('座標包含原圖留白，每軸 0–1；radius：0.005–0.5。未知名稱或無效更新會拋錯，保留舊設定。更改 parent／type 需驗證新模型並重建播放器。純模擬器 setter 不會重綁既有網格，需呼叫 rebindPin。',extra.setPin+' Unknown names or invalid patches throw without committing the patch.','余白を含む原画座標で各軸0–1、radius：0.005–0.5。未知の名前・不正な更新は例外で旧設定を保持。parent/type は新モデル検証後に再生成。シミュレーターでは rebindPin が必要。'),
  setPart: text('多邊形含 3–32 個正規化頂點；根與末端不同。未知 ID 或無效更新會拋錯。純模擬器修改幾何後需重建綁定；播放器會自行處理。',extra.setPart+' Unknown IDs or invalid patches throw without committing the patch.','多角形は正規化頂点3–32個、根と先端は別。未知の ID・不正な更新は例外。シミュレーターは再バインド、プレイヤーは自動処理。'),
  wave: text('播放器在暫停時恢復迴圈；純模擬器只在指定時間觸發。不可用於持物手臂，不是通用肢體動畫。',extra.wave,'プレイヤーは停止中に再開。シミュレーターは指定時刻で進捗のみ設定。持ち物の腕や汎用肢体アニメには使用しません。'),
  reset: text('v1 播放器停止時間軸、重設眼神與參數，但保留模型動態設定。與原畫比較時將 motion.weight 及眼神強度設為 0。',extra.reset,'v1 プレイヤーは時間軸・視線・パラメーターをリセット、動作設定を保持。原画比較時は motion.weight と視線強度を0にします。'),
  sampleCurve: text('先驗證外部動畫片段；曲線取樣不會驗證整個動畫。',extra.sampleCurve,'外部クリップを先に検証。曲線評価はアニメ全体の検証を行いません。'),
  sampleTrack: text('時間單位為毫秒，先驗證片段；關鍵影格範圍之外取端點值。',extra.sampleTrack,'時刻はミリ秒。クリップを先に検証し、範囲外は端点の値を使用。'),
  validateAnimation: text('face 旗標預設 false。支援 parameter、gaze.strength、motion.weight，沒有任意骨骼軌、表情或 Spine 匯入。',extra.validateAnimation,'face は false。parameter・gaze.strength・motion.weight に対応。任意骨格トラック・表情・Spine 読み込みは未対応。'),
  constrainSharedSurface: text('直接修改 positions，保留 rest／indices。梯度上限預設 0.65；幾何限制不代表視覺驗收通過。',extra.constrainSharedSurface,'positions を直接変更、rest/indices は保持。勾配上限は0.65。幾何制限は見た目の合格を保証しません。'),
  toCanvas: text('CANVAS_PADDING 為 0.12；中心仍是 0.5，Y 正值向下。原圖座標、游標位移及參數角度是不同單位。',extra.toCanvas,'CANVAS_PADDING は0.12、中央は0.5、Y は下向き。原画・ポインター・パラメーター角度は別の単位です。'),
  buildContinuousMesh: text('spec 使用原圖像素矩形，預設完整原圖；columns／rowCount 預設模型數值。回傳 rest／positions 使用原圖正規化座標。',extra.buildContinuousMesh,'spec は原画ピクセル矩形、既定は全画像。columns/rowCount はモデル値。rest/positions は原画正規化座標。'),
  updatePins: text('先 updatePins(time, deltaTime)，再 updateVertices(mesh, time)。時間均為毫秒，狀態維持在引擎內。',extra.updatePins,'updatePins(time, deltaTime) の後に updateVertices(mesh, time)。時間はミリ秒、状態はエンジン内で管理。'),
  updateVertices: text('直接更新網格緩衝區；neutral=true 使用中立幾何。診斷回報 motionScale 與最大位移梯度，不評估素材品質。',extra.updateVertices,'バッファを直接更新。neutral=true は中立形状。motionScale と最大変位勾配を診断し、素材品質は評価しません。'),
  update: text('time／delta 為毫秒。reduced 預設 false；true 使用靜態中立姿態。緩衝區與矩陣重用，勿每幀更換。',extra.update,'time/delta はミリ秒。reduced は false、true で静的中立姿勢。バッファ・行列は再使用。'),
  getMeshSnapshot: text('v1 包含 rest、positions、indices、基礎 weights 與 pinNames；基礎權重不代表頭頸／區域／部件覆蓋。v2 只有 rest、positions、indices。',extra.getMeshSnapshot,'v1：rest・positions・indices・基礎weights・pinNames。基礎重みは頭・領域・パーツ所有権を表しません。v2：rest・positions・indices。'),
  destroy: text('銷毀後需建立新的播放器才能繼續。清理可重複呼叫；AbortSignal 也觸發清理。',extra.destroy,'破棄後の再生には新プレイヤーが必要。終了処理は繰り返せ、AbortSignal でも実行されます。'),
}
export const parameterNotes = {
  canvas: 'A mounted HTMLCanvasElement; create players after mounting, not during SSR.',
  options: 'See the actual options signature and linked PlayerOptions/LayeredPlayerOptions. signal can cancel loading and trigger cleanup.',
  input: 'A validated model; the constructor clones it. Model v1 and layered v2 are separate formats.',
  model: 'The model data. Image URLs and reviewed bindings must match the artwork.',
  value: 'Finite numeric input or unknown data to validate, according to the signature.',
  x: 'X coordinate; units and accepted ranges are described above.',
  y: 'Y coordinate; positive is down. Units and ranges are described above.',
  name: 'An existing pin name or supported ParameterName, according to the signature.',
  id: 'The ID of an existing authored part.',
  patch: 'Partial update; omitted fields retain their current values. External model data must be validated.',
  settings: 'Partial settings merged with the current model; validation bounds still apply.',
  clip: 'AnimationClip with finite duration, valid tracks and ordered keyframes.',
  track: 'An animation track from a previously validated clip.',
  time: 'Milliseconds from the start of the simulation or clip, according to the method.',
  delta: 'Milliseconds since the previous simulation update.',
  deltaTime: 'Milliseconds since the previous simulation update.',
  textureSrc: 'URL of the exact artwork matching these bundled bindings; replacing the image does not produce a rig.',
  surface: 'The mutable mesh positions with immutable rest positions and triangle indices.',
  mesh: 'An already-built continuous mesh; keep model settings and bindings consistent.',
  spec: 'Source-pixel mesh rectangle. Omit for the full artwork.',
  columns: 'Horizontal mesh cell count; use the default shown in this signature.',
  rowCount: 'Vertical mesh cell count; defaults to the model value.',
  neutral: 'Whether to evaluate neutral geometry; defaults to false.',
  reduced: 'Whether to evaluate reduced-motion neutral geometry; defaults to false.',
  limit: 'Maximum displacement gradient; defaults to 0.65.',
  reviewedFace: 'Whether this clip has reviewed eyes; false by default.',
  face: 'Whether this clip has reviewed eyes; false by default.',
  curve: 'linear, step, or cubic-bezier [x1,y1,x2,y2].',
  progress: 'Normalized curve progress.',
  n: 'Source-normalized coordinate.',
}
const parameterTranslations = {
  canvas: ['掛載後的 HTMLCanvasElement；SSR 階段不建立播放器。','マウント済み HTMLCanvasElement。SSR 中はプレイヤーを作成しません。'],
  options: ['以實際型別簽名為準；signal 可取消載入並清理播放器。','実際の型シグネチャを参照。signal は読み込み取消・解放用です。'],
  input: ['模型或待驗證外部資料，依簽名指定。建構器會複製模型；v1、v2 格式分開。','型に応じたモデルまたは検証対象。生成時にコピーし、v1 と v2 は別形式です。'],
  model: ['圖片網址、尺寸與已審核的綁定必須符合原圖。','画像 URL・寸法・確認済みバインドは原画と一致させます。'],
  value: ['依簽名使用有限數值或待驗證的 unknown 資料。','型に応じて有限数値または検証対象の unknown を渡します。'],
  x: ['X 座標；單位與範圍見行為說明。','X 座標。単位・範囲は動作説明を参照。'],
  y: ['Y 正方向向下；單位與範圍見行為說明。','Y は下向き。単位・範囲は動作説明を参照。'],
  name: ['現有控制點名稱或支援的 ParameterName，依簽名指定。','型に応じた既存制御点名または ParameterName。'],
  id: ['既有部件的 ID。','既存パーツの ID。'],
  patch: ['部分更新；省略欄位保留原值，仍需符合驗證範圍。','部分更新。省略項目を保持し、検証範囲に従います。'],
  settings: ['合併到目前模型的部分設定，仍需符合数值範圍。','現在のモデルにマージする設定。値の範囲は維持します。'],
  clip: ['有限長度、合法動畫軌與依序排列的關鍵影格。','有限の長さ・有効なトラック・順序付きキーフレーム。'],
  track: ['來自已驗證片段的動畫軌。','検証済みクリップのトラック。'],
  time: ['片段或模擬開始後的毫秒時間，依方法指定。','メソッドに応じたクリップ・シミュレーション開始後のミリ秒。'],
  delta: ['距離上一次模擬更新的毫秒時間。','前回のシミュレーション更新からのミリ秒。'],
  deltaTime: ['距離上一次模擬更新的毫秒時間。','前回のシミュレーション更新からのミリ秒。'],
  textureSrc: ['與內附綁定相符的原圖網址；替換圖片不會自動綁定。','既存バインドに一致する原画 URL。画像の変更だけではバインドされません。'],
  surface: ['包含可變 positions、基礎 rest 與三角形 indices 的網格。','可変 positions・基準 rest・三角形 indices を持つメッシュ。'],
  mesh: ['已建立的連續網格，需與模型設定及綁定一致。','構築済みの連続メッシュ。モデル設定・バインドと整合させます。'],
  spec: ['原圖像素矩形；省略時使用完整原圖。','原画のピクセル矩形。省略時は全画像。'],
  columns: ['水平網格格數，預設值見此方法的簽名。','横方向のセル数。既定値はこのメソッドの型を参照。'],
  rowCount: ['垂直網格格數，預設使用模型設定。','縦方向のセル数。既定はモデル設定。'],
  neutral: ['是否取樣中立幾何，預設 false。','中立形状を評価するか。既定は false。'],
  reduced: ['是否使用減少動態的靜態中立幾何，預設 false。','動作軽減の静的中立形状を評価するか。既定は false。'],
  limit: ['最大位移梯度，預設 0.65。','最大変位勾配。既定は0.65。'],
  face: ['是否已有審核完成的眼睛綁定，預設 false。','確認済みの目のバインドがあるか。既定は false。'],
  curve: ['linear、step 或 cubic-bezier [x1,y1,x2,y2]。','linear・step・cubic-bezier [x1,y1,x2,y2]。'],
  progress: ['曲線的正規化進度。','曲線の正規化された進捗。'],
  n: ['原圖的正規化座標。','原画の正規化座標。'],
}
export function parameterDescription(name) {
  const [zh,ja]=parameterTranslations[name]??['參考簽名與關聯型別的參數契約。','型シグネチャと関連型の引数契約を参照。']
  return text(zh,parameterNotes[name]??'See the signature and linked type contract for this argument.',ja)
}
export const examples = {
  createPlayer: 'const player = await createPlayer({ canvas, model, signal });\nplayer.pause();\nplayer.destroy();',
  createLayeredPlayer: 'const player = await createLayeredPlayer({ canvas, model: layeredModel, signal });\nplayer.destroy();',
  createSimulation: 'const simulation = createSimulation(model);\nconst mesh = simulation.buildContinuousMesh();\nsimulation.updatePins(16.67, 16.67);\nsimulation.updateVertices(mesh, 16.67);',
  createLayeredSimulation: 'const simulation = createLayeredSimulation(layeredModel);\nsimulation.setPointer(.2, 0);\nsimulation.update(16.67, 16.67);',
  createMireaModel: 'const model = createMireaModel("/models/mirea/texture.png");',
  validateModel: 'const input: unknown = JSON.parse(serialized);\nvalidateModel(input);\nconsole.log(input.pins);',
  validateLayeredModel: 'const input: unknown = JSON.parse(serialized);\nvalidateLayeredModel(input);\nconsole.log(input.attachments);',
  validateAnimation: 'validateAnimation(clip, Boolean(model.face));',
  sampleCurve: 'const eased = sampleCurve(.5, [.42, 0, .58, 1]);',
  sampleTrack: 'validateAnimation(clip);\nconst value = sampleTrack(clip.tracks[0], 500);',
  constrainSharedSurface: 'const simulation = createSimulation(model);\nconst mesh = simulation.buildContinuousMesh();\nconst diagnostics = constrainSharedSurface(mesh, .65);',
  toCanvas: 'const center = toCanvas(.5);',
  play: 'player.play();', pause: 'player.pause();', setPointer: 'player.setPointer(.2, -.1);', setGaze: 'player.setGaze(.6, -.2);', setGazeStrength: 'player.setGazeStrength(.8);',
  setParameter: 'player.setParameter("bodyX", 4);', setMotion: 'player.setMotion({ sway: .6, speed: .8 });', setTracking: 'player.setTracking({ response: .024, damping: .65, maxVelocity: 1.8 });',
  setPin: 'player.setPin(model.pins[0].name, { x: .5, radius: .08 });', setPart: 'if (model.parts?.[0]) player.setPart(model.parts[0].id, { rotation: .05 });',
  wave: 'player.wave();', reset: 'player.reset();', getModel: 'const exported = player.getModel();', getSnapshot: 'const snapshot = player.getSnapshot();', getMeshSnapshot: 'const mesh = player.getMeshSnapshot();', destroy: 'player.destroy();',
  playAnimation: 'player.playAnimation(clip);', pauseAnimation: 'player.pauseAnimation();', seekAnimation: 'player.seekAnimation(500);', stopAnimation: 'player.stopAnimation();',
  updatePins: 'simulation.updatePins(16.67, 16.67);', updateVertices: 'const diagnostics = simulation.updateVertices(mesh, 16.67);', buildContinuousMesh: 'const mesh = simulation.buildContinuousMesh();',
  rebindPin: 'simulation.setPin(model.pins[0].name, { radius: .08 });\nsimulation.rebindPin(mesh, model.pins[0].name, { radius: .08 });', update: 'simulation.update(16.67, 16.67);', getPointer: 'const pointer = simulation.getPointer();', getPlayer: 'const player = handle.getPlayer();\nplayer?.pause();',
}

// Authored methods reachable through the public simulation return type.
// The internal createHairDynamics/createPartDynamics factories are not public exports.
const nestedOwners = {
  hair: ['髮絲','hair','髪'], accessories: ['配件','accessories','アクセサリ'],
  parts: ['柔性部件','parts','柔軟パーツ'], pointerGroups: ['共同變換','pointer groups','ポインターグループ'],
}
for (const [owner,[zh,en,ja]] of Object.entries(nestedOwners)) {
  for (const name of ['update','bind',owner==='pointerGroups'?'apply':'displacement',...(['parts','pointerGroups'].includes(owner)?['reset']:[])]) {
    const key=owner+'.'+name, target='simulation.'+owner
    const purpose={
      update:text(`更新${zh}引擎狀態。`,`Update ${en} engine state.`,`${ja}のエンジン状態を更新します。`),
      bind:text(`計算${zh}的稀疏網格綁定。`,`Compute sparse mesh bindings for ${en}.`,`${ja}の疎メッシュバインドを計算します。`),
      displacement:text(`取樣指定頂點的${zh}位移。`,`Sample ${en} displacement at a vertex.`,`${ja}による指定頂点の変位を評価します。`),
      apply:text('對原圖頂點套用共同變換。','Apply shared transforms to a source vertex.','原画の頂点に共有変換を適用します。'),
      reset:text(`清除${zh}的彈簧或追蹤狀態。`,`Reset ${en} spring or following state.`,`${ja}のばね・追従状態をリセットします。`),
    }[name]
    descriptions[key]=purpose
    const units=name==='update'
      ? text('time／delta／deltaTime 為毫秒；lookX／lookY 為引擎角度，lookVelocity／verticalVelocity 使用 simulation.velocity。wave 為 0–1。','time/delta/deltaTime use milliseconds; lookX/lookY are engine angles; lookVelocity/verticalVelocity use simulation.velocity. wave is 0…1.','time/delta/deltaTime はミリ秒。lookX/lookY はエンジン角度、速度は simulation.velocity、wave は0–1。')
      : name==='bind'
      ? text('rest 是完整原圖正規化 x/y 交錯緩衝區。髮絲 columns 預設 0；規則網格請提供模型欄數。回傳綁定供同一網格的取樣方法使用。','rest is interleaved full-source normalized x/y. Hair columns defaults to 0; pass model columns for a regular grid. Use the returned binding only with its original mesh.','rest は全原画の正規化 x/y バッファ。髪の columns は0、規則メッシュにはモデルの列数を渡します。同じメッシュの評価に使います。')
      : name==='reset'
      ? text('無位置參數，保留部件規格與網格綁定。','No positional arguments; retains authored specs and mesh bindings.','引数なし。パーツ定義とバインドを保持します。')
      : text('vertex 是零起算網格頂點索引；x/y 與回傳位移均使用完整原圖正規化座標。apply 回傳變換後的絕對座標；displacement 回傳位移量。','vertex is a zero-based mesh index. x/y and displacement use full-source normalized coordinates. apply returns transformed absolute coordinates; displacement returns an offset.','vertex は0始まりの頂点番号。x/y と変位は全原画の正規化座標。apply は変換後の絶対座標、displacement は変位を返します。')
    localizedNotes[key]=text(`${purpose['zh-TW']} ${units['zh-TW']} 低階方法不另驗證外部缓衝區與索引；請使用已驗證模型與本模擬器建立的綁定。updatePins／updateVertices 已呼叫這些方法，勿在同一幀重複更新。綁定型別由回傳值推導，不需匯入內部工廠。`,`${purpose.en} ${units.en} Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.`,`${purpose.ja} ${units.ja} 低レベル API は外部バッファ・番号を別途検証しません。検証済みモデルとこのシミュレーターのバインドを使用。updatePins/updateVertices が呼び出すので同じフレームで二重更新しません。型は戻り値から推論します。`)
    const mesh='const mesh = simulation.buildContinuousMesh();'
    examples[key]=name==='reset'?`${target}.reset();`:name==='update'
      ? `${target}.update(${owner==='hair'?'16.67, 16.67, simulation.parameters.lookX, simulation.velocity.lookX':owner==='accessories'?'16.67, 16.67, simulation.velocity.lookX, simulation.parameters.wave':owner==='parts'?'16.67, 16.67, simulation.parameters.lookX, simulation.velocity.lookX':'16.67, simulation.parameters.lookX, simulation.parameters.lookY'});`
      : `${mesh}\nconst binding = ${target}.bind(mesh.rest${owner==='hair'?', model.mesh.columns':''});`+(name==='bind'?'':`\nconst result = ${target}.${name}(binding, 0${owner==='hair'?'':', mesh.rest[0], mesh.rest[1]'});`)
  }
}
Object.assign(parameterNotes,{
  rest:'Interleaved full-source normalized x/y vertex buffer.', binding:'Sparse binding returned by this subsystem for the same rest mesh.', vertex:'Zero-based vertex index into the bound mesh.', lookX:'Engine lookX parameter in degrees (normally −30…30).', lookY:'Engine lookY parameter in degrees (normally −30…30).', lookVelocity:'The simulation.velocity.lookX value.', verticalVelocity:'The simulation.velocity.lookY value.', wave:'Wave progress in 0…1.',
})
Object.assign(parameterTranslations,{
  rest:['完整原圖正規化 x/y 交錯頂點緩衝區。','全原画の正規化 x/y 頂点バッファ。'],binding:['同一網格由此子系統回傳的稀疏綁定。','同じメッシュに対してこのサブシステムが返したバインド。'],vertex:['零起算的網格頂點索引。','0始まりのメッシュ頂点番号。'],lookX:['引擎水平角度，通常 −30…30。','エンジンの水平角度、通常 −30…30。'],lookY:['引擎垂直角度，通常 −30…30。','エンジンの垂直角度、通常 −30…30。'],lookVelocity:['simulation.velocity.lookX 的值。','simulation.velocity.lookX の値。'],verticalVelocity:['simulation.velocity.lookY 的值。','simulation.velocity.lookY の値。'],wave:['揮手進度 0…1。','手振りの進捗0…1。'],
})

Object.assign(descriptions, {
  advance: text('以共用固定步進更新手動播放器並繪製。', 'Advance a manual player using shared fixed steps and render the result.', '共通の固定ステップで手動プレイヤーを更新・描画します。'),
  fixedSteps: text('將 0–60000 毫秒拆成固定步進與最後餘數。', 'Split 0–60000 milliseconds into fixed steps and a final remainder.', '0–60000 ミリ秒を固定ステップと最後の余りに分割します。'),
  faceReviewPoses: text('取得分層眼嘴的固定測試定義；需依模型素材篩選。', 'Return fixed face review definitions; filter by available authored assets.', '顔の固定テスト定義を返します。利用可能な素材で絞り込みます。'),
  setFace: text('設定 v2 眼睛開合、嘴型與開合；缺素材或無效值會拋錯。', 'Set v2 eye openness, mouth shape and openness; missing assets or invalid values throw.', 'v2 の目・口の開閉と口形を設定。素材不足・不正値は例外になります。'),
  eyeFor: text('查詢附件所屬的眼睛設定。', 'Find the authored eye owning an attachment.', 'アタッチメントに対応する目の設定を取得します。'),
  layer: text('取得眼嘴附件的可見度、裁切與虹膜位移。', 'Read face attachment visibility, clipping and iris translation.', '顔の表示・クリップ・虹膜移動を取得します。'),
  snapshot: text('取得目前眼嘴與眼神狀態；減少動態時回傳中立值。', 'Read face and gaze state; reduced motion returns neutral values.', '顔・視線の状態を取得。動作軽減時は中立値を返します。'),
})
Object.assign(examples, {
  advance: 'player.advance(1000);', fixedSteps: 'fixedSteps(1000, delta => console.log(delta));',
  faceReviewPoses: 'const poses = faceReviewPoses().filter(pose => pose.id === "eyes-closed");',
  setFace: 'player.setFace({ eyeOpenLeft: 0, eyeOpenRight: 0 });',
  eyeFor: 'const eye = simulation.face.eyeFor("left-iris");',
  layer: 'const state = simulation.face.layer("left-iris");',
  snapshot: 'const pose = simulation.face.snapshot();',
})
Object.assign(parameterNotes, { milliseconds: 'Finite elapsed milliseconds, 0…60000.', step: 'Callback receiving each fixed delta in milliseconds.', next: 'Authored face pose patch; openness values in 0…1.', pose: 'Authored face pose patch; openness values in 0…1.' })
// Manual rendering is opt-in; normal autoplay and legacy models retain their behavior.
extra.advance = 'Use manual:true at creation. advance does not schedule requestAnimationFrame; it runs the shared fixed-step engine and draws. Fixed review definitions are shared by Studio and the CLI.'
localizedNotes.advance = text('建立時設 manual:true；advance 不啟動 RAF。共用固定步進及姿勢定義供 Studio 和 CLI 使用。', extra.advance, '生成時に manual:true。advance は RAF を開始せず、Studio と CLI が同じ固定ステップを使用します。')
