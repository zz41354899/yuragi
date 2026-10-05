<script setup lang="ts">
import { computed, ref, shallowRef, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { createPlayer, createLayeredPlayer, reviewPoses } from '@yuragi/rig'
import type { RigPlayer, LayeredPlayer, RigSnapshot, LayeredSnapshot, Vec2 } from '@yuragi/rig'
import type { StudioModel } from '../../../packages/rig/src/studio/document'
import type { MissingAssetsReport } from '../../../packages/rig/src/studio/materials'
import DropdownSelect from '../../site/src/components/DropdownSelect.vue'
import Icon from '../../site/src/components/Icon.vue'
import { geometry } from './geometry'
import { pointerGaze } from '../../site/src/editor/gaze'
import { loadImage } from '../../../packages/rig/src/image'
import logo from '../../site/public/images/brand/yuragi-katakana-web-v1.png'

type Locale = 'zh-TW' | 'en' | 'ja'
const locale = ref<Locale>('zh-TW')
const t = (zh: string, en: string, ja: string) => locale.value === 'en' ? en : locale.value === 'ja' ? ja : zh
interface Summary { currentVersion?: string; stage?: string; error?: string; versions: { id: string; path?: string; label?: string; fingerprint?: string; ready: boolean; stale?: boolean; error?: string }[] }
interface Session { model: StudioModel | null; assets?: Record<string,string>; sourceFingerprint?: string; assetFingerprint?: string; versionId?: string; project?: Summary; records?: Record<string,unknown>; missingAssets?: {path:string;report:MissingAssetsReport}; output: string }
const session = shallowRef<Session>(), summary = shallowRef<Summary>(), canvas = ref<HTMLCanvasElement>(), overlay = ref<HTMLCanvasElement>(), stage = ref<HTMLElement>(), art = ref<HTMLElement>()
const model = computed(() => session.value?.model), size = computed(() => model.value?.version === 1 ? model.value.texture : model.value?.source)
const source = computed(() => { const m = model.value; return m ? session.value?.assets?.[m.version === 1 ? m.texture.src : m.source.fallback] : undefined })
const canvasStyle = computed(() => ({ aspectRatio: size.value ? `${size.value.width}/${size.value.height}` : '2/3', '--source-ratio': size.value ? size.value.width/size.value.height : 2/3 }))
const selection = ref(''), mode = ref<'original'|'neutral'|'motion'|'compare'>('neutral'), panel = ref<'preview'|'controls'>('preview')
const zoom = ref(1), pan = ref({ x: 0, y: 0 }), showMesh = ref(false), showAnnotations = ref(false), reduced = ref(false), busy = ref(false), failed = ref(false)
const message = ref(''), poseId = ref('neutral'), pointer = ref<Vec2>([0,0])
const snapshot = shallowRef<RigSnapshot|LayeredSnapshot>()
let player: RigPlayer|LayeredPlayer|undefined, raf = 0, last = 0, elapsed = 0, reportAt = 0, poll: ReturnType<typeof setInterval>|undefined, request = new AbortController(), loading: AbortController|undefined, media: MediaQueryList|undefined, generation = 0
let drag: { id: number; start: Vec2; pan: {x:number;y:number}; target: HTMLElement }|undefined
const api = async <T,>(path: string, body?: unknown): Promise<T> => {
  const token = document.querySelector<HTMLMetaElement>('meta[name="studio-token"]')?.content ?? ''
  const res = await fetch('/api/'+path,{method:body === undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Yuragi-Session':token},body:body === undefined?undefined:JSON.stringify(body),signal:request.signal})
  const data = await res.json(); if (!res.ok) throw new Error(data.error ?? 'Request failed'); return data
}
const graph = computed(() => model.value?.version === 1 ? geometry(model.value) : undefined)
const parts = computed(() => {
  const m=model.value;if(!m)return []
  return m.version===1 ? [
    ...m.pins.map(p=>({id:p.name,kind:t('控制點','Pin','制御点'),points:[[p.x,p.y]] as Vec2[],data:p})),
    ...(m.parts??[]).map(p=>({id:p.id,kind:t('柔性部件','Flexible part','柔軟パーツ'),points:p.polygon,data:p})),
    ...(m.surfaceRegions??[]).map(p=>({id:p.id,kind:t('綁定區域','Binding region','バインド領域'),points:p.polygon,data:p})),
  ] : m.attachments.map(a=>({id:a.id,kind:a.coverage==='complete'?t('完整素材','Complete artwork','完成素材'):t('僅可見像素','Visible pixels','可視ピクセル'),points:[[a.bounds[0],a.bounds[1]],[a.bounds[2],a.bounds[3]]] as Vec2[],data:a}))
})
const selected = computed(() => parts.value.find(p=>p.id===selection.value))
const stale = computed(() => summary.value?.versions.find(v=>v.id===session.value?.versionId)?.stale)
const newer = computed(() => summary.value?.versions.find(v=>v.id===summary.value?.currentVersion&&v.ready&&v.fingerprint!==session.value?.sourceFingerprint))
const versionOptions = computed(() => summary.value?.versions.filter(v=>v.ready).map(v=>({value:v.id,label:v.label??v.id}))??[])
const currentVersion = computed({get:()=>session.value?.versionId??'legacy',set:id=>{void switchVersion(id)}})
const poses = computed(() => reviewPoses)
function poseLabel(id:string){const names:Record<string,[string,string,string]>={neutral:['中立','Neutral','中立'],up:['上','Up','上'],down:['下','Down','下'],left:['左','Left','左'],right:['右','Right','右'],'top-left':['左上','Top left','左上'],'top-right':['右上','Top right','右上'],'bottom-left':['左下','Bottom left','左下'],'bottom-right':['右下','Bottom right','右下'],reversal:['快速反向','Rapid reversal','急な反転'],'eyes-half':['半閉眼','Half eyes','半閉眼'],'eyes-closed':['閉眼','Closed eyes','閉眼'],'mouth-closed':['閉嘴','Closed mouth','閉口'],'mouth-half':['輕微張嘴','Partly open mouth','軽く開口'],'mouth-open':['張嘴','Open mouth','開口']};if(names[id])return t(...names[id]);if(id.startsWith('hair-return-'))return t('髮絲回彈','Hair return','髪の戻り')+' '+id.slice(12)+'ms';if(id.startsWith('mouth-'))return t('嘴型','Mouth','口形')+' '+id.slice(6).toUpperCase();return id}
const stageLabel=computed(()=>{const names:Record<string,[string,string,string]>={inspected:['已檢視','Inspected','検査済み'],annotated:['已標註','Annotated','測定済み'],extracted:['已拆件','Extracted','抽出済み'],bound:['已綁定','Bound','バインド済み'],compiled:['已編譯','Compiled','コンパイル済み'],reviewed:['已檢查','Reviewed','確認済み']};return t(...(names[summary.value?.stage??'compiled']??names.compiled))})
const materialItems=computed(()=>session.value?.missingAssets?.report.items.filter(item=>!/^eye-(left|right)-(eyelid-skin|eyeball|half|closed)$/.test(item.id)&&!/^mouth-(closed|open|a|i|u|e|o)$/.test(item.id))??[])
const gazeEnabled=ref(true),gazeStrength=ref(.75)
const gazeCapable=computed(()=>model.value?.version===1&&!!model.value.face)
function applyGaze(){if(player&&'setGazeStrength'in player&&gazeCapable.value){player.setGazeStrength(gazeEnabled.value?gazeStrength.value:0);if(!gazeEnabled.value)player.setGaze(0,0);if(!snapshot.value?.playing)player.advance(100);report()}}
function followGaze(event:PointerEvent){if(!player||!gazeEnabled.value||reduced.value||model.value?.version!==1||!model.value.face)return;const box=art.value?.getBoundingClientRect();if(box)player.setGaze(...pointerGaze([event.clientX,event.clientY],box,model.value.face,(snapshot.value as RigSnapshot)?.trackingOffset));if(!snapshot.value?.playing)player.advance(100)}
function leave(){if(!drag&&player){pointer.value=[0,0];player.setPointer(0,0);if(gazeCapable.value)player.setGaze(0,0);if(!snapshot.value?.playing){if(mode.value==='neutral'){player.reset();applyGaze()}else player.advance(400)}report()}}

function restoreMotion(){if(player&&'setMotion'in player&&model.value?.version===1)player.setMotion({...model.value.motion,weight:model.value.motion.weight??1})}
function stop(){cancelAnimationFrame(raf);last=0;player?.pause()}
function report(){if(!player)return;snapshot.value=player.getSnapshot();drawOverlay()}
function drawOverlay(){const c=overlay.value;if(!c||!size.value)return;c.width=size.value.width;c.height=size.value.height;const ctx=c.getContext('2d');if(!ctx)return
  const point=(p:Vec2)=>[p[0]*c.width,p[1]*c.height] as Vec2
  if(showMesh.value&&player){const mesh=player.getMeshSnapshot();ctx.strokeStyle='#008bb780';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<mesh.indices.length;i+=3)for(let j=0;j<4;j++){const v=mesh.indices[i+j%3]*2,p=point([mesh.positions[v],mesh.positions[v+1]]);j?ctx.lineTo(...p):ctx.moveTo(...p)}ctx.stroke()}
  if(showAnnotations.value&&model.value?.version===2){ctx.strokeStyle='#006a94';ctx.lineWidth=2;for(const a of model.value.attachments)ctx.strokeRect(a.bounds[0]*c.width,a.bounds[1]*c.height,(a.bounds[2]-a.bounds[0])*c.width,(a.bounds[3]-a.bounds[1])*c.height);for(const eye of model.value.face?.eyes??[])for(const curve of [eye.top,eye.bottom]){ctx.beginPath();curve.forEach((p,i)=>i?ctx.lineTo(...point(p)):ctx.moveTo(...point(p)));ctx.stroke()}}
  if(showAnnotations.value){ctx.strokeStyle='#006a94';ctx.lineWidth=2;for(const outline of graph.value?.outlines??[]){ctx.beginPath();outline.points.forEach((p,i)=>i?ctx.lineTo(...point(p)):ctx.moveTo(...point(p)));if(outline.closed)ctx.closePath();ctx.stroke()}}
  if(selected.value){ctx.strokeStyle='#e49432';ctx.lineWidth=3;ctx.beginPath();selected.value.points.forEach((p,i)=>i?ctx.lineTo(...point(p)):ctx.moveTo(...point(p)));if(selected.value.points.length>2)ctx.closePath();if(model.value?.version===2&&selected.value.points.length===2){const [a,b]=selected.value.points;ctx.strokeRect(a[0]*c.width,a[1]*c.height,(b[0]-a[0])*c.width,(b[1]-a[1])*c.height)}else ctx.stroke();for(const p of selected.value.points){ctx.beginPath();ctx.arc(...point(p),4,0,Math.PI*2);ctx.fillStyle='#e49432';ctx.fill()}}
}
function tick(now:number){if(!player||!snapshot.value?.playing||reduced.value)return;raf=requestAnimationFrame(tick);if(document.hidden){last=0;return}const delta=last?Math.min(now-last,50):1000/60;last=now;elapsed+=delta;player.advance(delta);if(now-reportAt>=100){reportAt=now;report()}}
function play(){if(!player||reduced.value)return;restoreMotion();stop();player.play();snapshot.value=player.getSnapshot();raf=requestAnimationFrame(tick)}
function neutral(){stop();player?.reset();if(player&&'setMotion'in player)player.setMotion({weight:0});applyGaze();elapsed=0;pointer.value=[0,0];poseId.value='neutral';report()}
async function install(next:Session){const own=++generation;loading?.abort();loading=new AbortController();
  if(next.model){const m=next.model, files=m.version===1?[{src:m.texture.src,width:m.texture.width,height:m.texture.height}]: [...m.atlases,{src:m.source.fallback,width:m.source.width,height:m.source.height}];await Promise.all(files.map(async f=>{const image=await loadImage(next.assets?.[f.src]??'',loading!.signal);if(own!==generation)throw new Error('Loading cancelled');if(image.naturalWidth!==f.width||image.naturalHeight!==f.height)throw new Error('Artwork dimensions do not match the model')}))}
  if(own!==generation)return;stop();player?.destroy();player=undefined;session.value=next;summary.value=next.project;failed.value=false;selection.value='';elapsed=0;mode.value='neutral';await nextTick();if(own!==generation||!next.model||!canvas.value)return
  const m=structuredClone(next.model),assets=next.assets??{};if(m.version===1)m.texture.src=assets[m.texture.src];else{m.source.fallback=assets[m.source.fallback];m.atlases.forEach(a=>a.src=assets[a.src])}
  loading=new AbortController();try{const created=m.version===1?await createPlayer({canvas:canvas.value,model:m,autoplay:false,manual:true,signal:loading.signal,onError:e=>{failed.value=true;message.value=e.message;stop()}}):await createLayeredPlayer({canvas:canvas.value,model:m,autoplay:false,manual:true,signal:loading.signal,onError:e=>{failed.value=true;message.value=e.message;stop()}});if(own!==generation){created.destroy();return}player=created;neutral()}catch(e){if(own===generation){failed.value=true;message.value=String(e)}}
}
async function switchVersion(id:string){const previous=session.value?.versionId;busy.value=true;try{await install(await api<Session>('version',{versionId:id}))}catch(e){message.value=String(e);if(previous&&previous!=='legacy')try{await api('version',{versionId:previous})}catch{}}finally{busy.value=false}}
async function example(){busy.value=true;try{await install(await api<Session>('example',{name:'mirea'}))}catch(e){message.value=String(e)}finally{busy.value=false}}
function setMode(next:typeof mode.value){mode.value=next;if(next==='neutral'||next==='original')neutral();else play()}
function fit(){zoom.value=1;pan.value={x:0,y:0}}
async function fitPart(){panel.value='preview';await nextTick();const points=selected.value?.points;if(!points?.length)return;const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const extent=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),.12);zoom.value=Math.min(8,Math.max(1,.75/extent));const w=art.value?.clientWidth??300,h=art.value?.clientHeight??450;pan.value={x:(.5-(Math.min(...xs)+Math.max(...xs))/2)*w*zoom.value,y:(.5-(Math.min(...ys)+Math.max(...ys))/2)*h*zoom.value}}
function wheel(e:WheelEvent){zoom.value=Math.max(.25,Math.min(8,zoom.value*Math.exp(-Math.max(-200,Math.min(200,e.deltaY))*.002)))}
function point(e:PointerEvent):Vec2|undefined{const box=art.value?.getBoundingClientRect();if(!box)return;return [Math.max(0,Math.min(1,(e.clientX-box.left)/box.width)),Math.max(0,Math.min(1,(e.clientY-box.top)/box.height))]}
function down(e:PointerEvent){if(e.button!==0)return;const target=e.currentTarget as HTMLElement;target.setPointerCapture(e.pointerId);drag={id:e.pointerId,start:[e.clientX,e.clientY],pan:{...pan.value},target}}
function move(e:PointerEvent){if(drag?.id===e.pointerId){pan.value={x:drag.pan.x+e.clientX-drag.start[0],y:drag.pan.y+e.clientY-drag.start[1]};return}if(mode.value!=='original')followGaze(e);if(mode.value==='motion'||mode.value==='compare'){const p=point(e);if(p){pointer.value=[p[0]-.5,p[1]-.5];player?.setPointer(...pointer.value)}}}
function end(e:PointerEvent){if(drag?.id===e.pointerId){if(drag.target.hasPointerCapture(e.pointerId))drag.target.releasePointerCapture(e.pointerId);drag=undefined}if(e.pointerType==='touch'){pointer.value=[0,0];player?.setPointer(0,0);if(gazeCapable.value)player?.setGaze(0,0)}}
function key(e:KeyboardEvent){const values:Record<string,Vec2>={ArrowLeft:[-.5,0],ArrowRight:[.5,0],ArrowUp:[0,-.5],ArrowDown:[0,.5],Escape:[0,0]};if(values[e.key]){e.preventDefault();restoreMotion();pointer.value=values[e.key];player?.setPointer(...pointer.value);player?.advance(300);elapsed+=300;poseId.value='keyboard';report()}}
async function runPose(id:string){if(!player)return;stop();restoreMotion();mode.value='neutral';player.reset();elapsed=0;const pose=poses.value.find(p=>p.id===id);if(!pose)return;for(const step of pose.sequence){pointer.value=step.pointer;player.setPointer(...step.pointer);if(step.face&&'setFace'in player)player.setFace(step.face);player.advance(step.milliseconds);elapsed+=step.milliseconds}poseId.value=id;if(id==='neutral')neutral();else report()}
function motionChange(){reduced.value=!!media?.matches;if(reduced.value)neutral()}
watch([zoom,pan],async()=>{await nextTick();player?.advance(0);report()})
watch([selection,showMesh,showAnnotations],()=>drawOverlay())
onMounted(async()=>{media=matchMedia('(prefers-reduced-motion: reduce)');motionChange();media.addEventListener('change',motionChange);try{await install(await api<Session>('session'))}catch(e){message.value=String(e)}poll=setInterval(()=>{if(!document.hidden)void api<Summary>('summary').then(next=>{summary.value=next}).catch(e=>{message.value=String(e)})},2000)})
onBeforeUnmount(()=>{generation++;stop();request.abort();loading?.abort();player?.destroy();if(poll)clearInterval(poll);media?.removeEventListener('change',motionChange)})
</script>

<template>
  <header class="studio-header"><a class="brand" href="#" @click.prevent="fit"><img :src="logo" alt="Yuragi" /><span>Studio</span></a><nav :aria-label="t('工作流程','Workflow','ワークフロー')"><span>01 {{ t('Agent 製作','Agent preparation','エージェント制作') }}</span><span class="active">02 {{ t('預覽','Preview','プレビュー') }}</span><span>03 {{ t('專案整合','Integration','組み込み') }}</span></nav><DropdownSelect v-model="locale" :label="t('語言','Language','言語')" :options="[{value:'zh-TW',label:'繁體中文'},{value:'en',label:'English'},{value:'ja',label:'日本語'}]" inline /></header>
  <div v-if="message" role="status" class="notice">{{ message }}<button @click="message=''" :aria-label="t('關閉通知','Dismiss','閉じる')">×</button></div>
  <main v-if="!model" class="welcome"><span class="eyebrow">YURAGI STUDIO</span><h1>{{ t('讓 Agent 製作，\n在這裡看見角色動起來。','Prepare with an agent.\nSee your character move here.','エージェントで制作。\nここで動きを確認。') }}</h1><p>{{ t('從原圖標註、拆件到模型綁定，交給 Skill 與本機 Python 工具。Studio 只負責預覽；缺少素材會自動保存成 JSON，交由 Agent 回到 Python 處理。','Use the Skill and local Python tools to annotate, extract and bind artwork. Studio previews the model and saves missing assets as JSON for the agent’s Python workflow.','Skill とローカル Python で測定・切り出し・バインド。Studio はプレビューのみ。不足素材は JSON に保存し、エージェントが Python で処理します。') }}</p><button class="primary" :disabled="busy" @click="example"><Icon name="play" :size="16" />{{ t('預覽海月 Mirea','Preview Mirea','海月 Mirea を見る') }}</button><div class="start-guide"><h2>{{ t('開啟 Agent 製作的模型','Open an agent-built model','制作したモデルを開く') }}</h2><code>npx yuragi studio --project ./my-character --out ./yuragi-output</code><p>{{ t('請 Agent 先讀取 yuragi-rig-spec，保存標註 JSON，再用 Python diagnose → extract → build → Studio。只更換圖片不會產生綁定。','Ask the agent to read yuragi-rig-spec and save annotation JSON, then run Python diagnose → extract → build → Studio. Replacing an image does not create a rig.','yuragi-rig-spec を読み、測定 JSON を保存し、Python diagnose → extract → build → Studio を実行。画像変更だけではバインドされません。') }}</p></div></main>
  <main v-else>
    <section class="project-bar"><div><span class="eyebrow">{{ model.version===1?'SHARED SURFACE':'LAYERED MODEL' }}</span><h1>{{ model.name }}</h1><p>{{ size?.width }} × {{ size?.height }} · {{ session?.versionId }} · {{ t('唯讀模型預覽','Read-only model preview','読み取り専用プレビュー') }}</p></div><div class="actions"><button @click="example" :disabled="busy">{{ t('海月範例','Mirea sample','海月サンプル') }}</button></div></section>
    <div v-if="newer" class="notice">{{ t('Agent 已完成新版模型。','A new version is ready.','新しいモデルが完成しました。') }}<button @click="switchVersion(newer.id)">{{ t('載入新版','Load new version','新版を開く') }} {{ newer.id }}</button></div>
    <div v-if="stale||summary?.error" class="notice warning">{{ summary?.error??t('製作輸入已變更，需要 Agent 重新抽取／編譯。保留上一個有效预覽。','Authoring inputs changed. Ask the agent to extract / compile again. Last valid preview retained.','入力が変わりました。再抽出・コンパイルが必要です。最後のプレビューを保持。') }}</div>
    <div class="mobile-tabs"><button v-for="tab in ['preview','controls'] as const" :key="tab" :class="{active:panel===tab}" @click="panel=tab">{{ tab==='preview'?t('預覽','Preview','プレビュー'):t('預覽控制','Controls','操作') }}</button></div>
    <div class="workspace" :class="'mobile-'+panel">
      <section class="preview-panel"><div class="preview-toolbar"><div class="mode-tabs"><button v-for="v in ['original','neutral','motion','compare'] as const" :key="v" :class="{active:mode===v}" @click="setMode(v)">{{ v==='original'?t('原圖','Source','原画'):v==='neutral'?t('中立','Neutral','ニュートラル'):v==='motion'?t('動畫','Motion','動き'):t('並排比較','Compare','比較') }}</button></div><div class="toggles"><button :aria-pressed="showMesh" @click="showMesh=!showMesh">{{ t('網格','Mesh','メッシュ') }}</button><button :aria-pressed="showAnnotations" @click="showAnnotations=!showAnnotations">{{ t('標註','Annotations','測定') }}</button></div></div>
        <div class="comparison" :style="{'--source-ratio':size?size.width/size.height:2/3}" :class="{split:mode==='compare'}"><div v-if="mode==='compare'" class="reference"><span>{{ t('原始插畫','Source artwork','原画') }}</span><img :src="source" :alt="model.name" :style="{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}" /></div><div ref="stage" class="canvas-stage" tabindex="0" :aria-label="t('角色預覽，方向鍵控制姿態，拖曳平移','Character preview: arrows control pose, drag pans','矢印でポーズ、ドラッグで移動')" @wheel.prevent="wheel" @pointerdown="down" @pointermove="move" @pointerup="end" @pointercancel="end" @pointerleave="leave" @blur="leave" @keydown="key"><div ref="art" class="artwork" :style="{...canvasStyle,transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}"><img :src="source" :alt="model.name" class="fallback" :class="{hidden:mode!=='original'&&!failed}" /><canvas ref="canvas" class="player-canvas" :class="{hidden:mode==='original'||failed}" aria-hidden="true" /><canvas ref="overlay" class="overlay" aria-hidden="true" /></div></div></div>
        <div class="preview-controls"><div><button @click="snapshot?.playing?(stop(),report()):play()" :disabled="reduced||failed">{{ snapshot?.playing?t('暫停','Pause','停止'):t('播放','Play','再生') }}</button><button @click="neutral">{{ t('回正','Reset pose','ポーズを戻す') }}</button></div><div class="zoom"><button @click="zoom=Math.max(.25,zoom/1.25)" :aria-label="t('縮小','Zoom out','縮小')">−</button><output>{{ Math.round(zoom*100) }}%</output><button @click="zoom=Math.min(8,zoom*1.25)" :aria-label="t('放大','Zoom in','拡大')">＋</button><button @click="fit">{{ t('適合視窗','Fit view','全体表示') }}</button></div></div><p class="hint caption">{{ reduced?t('系統已啟用減少動態，顯示原始姿態。','System reduced motion is enabled.','動作軽減が有効です。'):t('移動游標／方向鍵測試；拖曳平移，滾輪縮放。','Move pointer / use arrows to test; drag to pan, scroll to zoom.','ポインター・矢印でテスト。ドラッグで移動、スクロールで拡大。') }}</p>
      </section>
      <aside class="review-panel"><h2>{{ t('預覽控制','Preview controls','プレビュー操作') }}</h2><DropdownSelect v-if="versionOptions.length" v-model="currentVersion" :label="t('模型版本','Model version','モデル版')" :options="versionOptions" /><p class="hint">{{ stageLabel }}</p><DropdownSelect :model-value="poseId" @update:model-value="runPose" :label="t('姿態','Pose','ポーズ')" :options="poses.map(p=>({value:p.id,label:poseLabel(p.id)}))" :disabled="reduced||failed" /><details><summary>{{ t('部件定位','Locate part','パーツ位置') }}</summary><DropdownSelect v-model="selection" :label="t('部件','Part','パーツ')" :options="parts.map(p=>({value:p.id,label:p.id}))" /><button v-if="selected" @click="fitPart">{{ t('放大選取部件','Fit selected part','選択パーツを拡大') }}</button></details>
        <div v-if="gazeCapable" class="face-controls"><h3>{{ t('眼神跟隨','Eye tracking','視線追従') }}</h3><button :aria-pressed="gazeEnabled" @click="gazeEnabled=!gazeEnabled;applyGaze()" :disabled="reduced">{{ gazeEnabled?t('滑鼠追蹤已啟用','Pointer tracking enabled','ポインター追従オン'):t('啟用滑鼠追蹤','Enable pointer tracking','ポインター追従を有効にする') }}</button><label>{{ t('眼神強度','Gaze strength','視線の強さ') }}<input type="range" min="0" max="1" step="0.05" v-model.number="gazeStrength" @input="applyGaze" :disabled="reduced||!gazeEnabled" /></label><p class="hint">{{ t('瞳孔在原圖的眼睛範圍內輕微跟隨游標；離開預覽時回正。','Pupils gently follow the pointer within the source eye area; leaving the preview centers them.','原画の目の範囲で瞳がポインターを追い、離れると中央に戻ります。') }}</p></div>
        <div v-if="materialItems.length&&session?.missingAssets" class="material-note"><strong>{{ t('素材清單已保存','Material list saved','素材リストを保存しました') }}</strong><p>{{ t('缺少的素材已寫入 JSON。請 Agent 讀取後，回到 Python 診斷與拆件。','Missing assets were saved as JSON. Ask the agent to read it and return to Python diagnosis/extraction.','不足素材を JSON に保存しました。エージェントが読み、Python の診断・抽出に戻ります。') }}</p><code class="report-path">{{ session.missingAssets.path }}</code></div>
      </aside>
    </div>
  </main>
  <footer><span>Yuragi Studio · {{ t('Agent 製作，本機預覽','Agent preparation · local preview','エージェント制作・ローカル確認') }}</span><span>TypeScript / Vue / React</span></footer>
</template>
