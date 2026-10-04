const $ = (id) => document.getElementById(id);
const stage = $('stage'), art = $('art'), canvas = $('canvas'), fallback = $('fallback');
const media = matchMedia('(prefers-reduced-motion: reduce)');
const presets = {
  gentle: { sway: .32, speed: .62, hair: 0, accessories: 0, parts: 1, follow: 1 },
  breeze: { sway: .5, speed: .7, hair: 0, accessories: 0, parts: 1.15, follow: 1 },
  test: { sway: .55, speed: .85, hair: 0, accessories: 0, parts: 1.3, follow: 1.15 },
};
const flowPresets = { gentle:{range:.07,inertia:.3},breeze:{range:.07,inertia:.8},test:{range:.08,inertia:1} };
const regionNames={'umbrella-canopy-rigid':'雨傘傘蓋｜剛性保護','umbrella-shaft-rigid':'雨傘傘柄｜剛性保護','holding-hand-rigid':'握傘手｜接點保護','lower-body-rigid':'骨盆・雙腿・鞋子｜保持比例','upper-body-rigid':'身體・肩膀・持傘手臂｜保持接點'};
function displayRegions(model) {
 const head=model.pose.headFollow;
 return [...(model.parts??[]),...(model.surfaceRegions??[]).map(r=>({...r,name:regionNames[r.id]??r.id})),
 ...(head?.region?[{id:'head-motion',name:'頭部整體｜旋轉與位移',polygon:head.region}]:[]),
 ...(head?.neck?[{id:'neck-bridge',name:'脖子｜上下接點銜接',polygon:head.neck.polygon}]:[])];
}
let player, controller, selected = 'gentle', paused = false, original = false, failed = false;
let pins = new Map(), lastSnapshot, reportCount = 0, currentModel;
let keyboardTracking = false, mode = 'pointer', targetPointer, demoClip, sampleTrack;
const modeLabels={pointer:'游標跟隨',showcase:'流動展示',contact:'接點測試'};
const modeNotes={
 pointer:'在舞台內畫圈或快速換方向。頭部先回應，上半身跟進，骨盆稍慢收住；瀏海與飄帶延遲回擺。',
 showcase:'自動播放八秒循環，包含斜向移動、轉向與回中。可放大觀察瀏海、肩膀與飄帶的收尾。',
 contact:'自動保持四個極端方向並快速反轉。選擇「持傘」或「雙腿」特寫，檢查握傘接點和交叉腿的比例。',
};
function applyMode(){
 if(!player)return;
 player.stopAnimation();player.setPointer(0,0);targetPointer=undefined;demoClip=undefined;
 if(mode!=='pointer' && $('follow').checked){
  const curve=mode==='contact'?'step':[.42,0,.3,1];
  const strength=Math.min(1,Number($('follow-strength').value));
  const poses=mode==='contact'?[[0,-30,-30],[1800,30,-30],[3600,30,30],[5400,-30,30],[7200,-30,-30]]:
   [[0,0,0],[1400,24,-16],[2800,27,16],[4200,-24,18],[5800,-27,-16],[7200,0,0],[8000,0,0]];
  demoClip={id:'mirea-'+mode,duration:poses.at(-1)[0],loop:true,tracks:['lookX','lookY','bodyX'].map((name,i)=>({target:'parameter',name,keys:poses.map(([time,x,y])=>({time,value:(i===0?x:i===1?y:x/3*.25)*strength,curve}))}))};
  player.playAnimation(demoClip);
  if(paused||original||media.matches)player.pause();
 }
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 text('mode-note',modeNotes[mode]);text('mode-tag',modeLabels[mode]);updateTarget();
}
function updateTarget(){
 const active=!!player&&!failed&&!original&&!media.matches&&$('follow').checked&&!$('pan-view').checked && (mode!=='pointer'||targetPointer);
 for(const id of ['pointer-target','pointer-response'])$(id).hidden=!active;
 if(!active)return;
 const p=mode==='pointer'?targetPointer:demoClip&&sampleTrack?demoClip.tracks.slice(0,2).map(t=>sampleTrack(t,lastSnapshot?.animation?.time??0)/60):[0,0];
 $('pointer-target').style.left=(p[0]+.5)*100+'%';$('pointer-target').style.top=(p[1]+.5)*100+'%';
 $('pointer-response').style.left=((lastSnapshot?.parameters.lookX??0)/60+.5)*100+'%';$('pointer-response').style.top=((lastSnapshot?.parameters.lookY??0)/60+.5)*100+'%';
}
let zoom = 1, pan = [0,0], viewGesture;
const touches = new Map();
let pinch, viewTouchMode = false;
function renderView() {
  art.style.transform=`translate(${pan[0]}px, ${pan[1]}px) scale(${zoom})`;
  $('zoom').value=String(zoom*100);text('zoom-value',Math.round(zoom*100)+'%');
  $('zoom-out').disabled=zoom<=.5;$('zoom-in').disabled=zoom>=4;
  if(player && !lastSnapshot?.playing)player.pause();
}
function setZoom(next, client) {
  const rect=art.getBoundingClientRect(), center=[rect.left+rect.width/2-pan[0],rect.top+rect.height/2-pan[1]];
  const anchor=client?[client[0]-center[0],client[1]-center[1]]:[0,0];
  const bounded=Math.max(.5,Math.min(4,next)), ratio=bounded/zoom;
  pan=anchor.map((v,i)=>v-(v-pan[i])*ratio);zoom=bounded;renderView();
}
function focusView(x,y,next) {
  zoom=next;pan=[-(x-.5)*art.clientWidth*zoom,-(y-.5)*art.clientHeight*zoom];renderView();
}
function endViewGesture(event) {
  touches.delete(event.pointerId);pinch=undefined;
  if(!touches.size)viewTouchMode=false;
  if(viewGesture?.id===event.pointerId)viewGesture=undefined;
  if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);
  stage.classList.toggle('is-dragging',!!viewGesture);
}
const interactive = document.querySelectorAll('[data-preset], #play, #reset, #follow, #follow-strength, #float-range, #flow-inertia, #original, #show-bindings, #part-select, #eye-gaze, [data-mode], #layer-strength, #detail-strength');
function text(id, value) { if ($(id).textContent !== value) $(id).textContent = value; }
function showBindings(show) { $('bindings').toggleAttribute('hidden', !show); }
function status() {
  text('status', failed ? '動態載入失敗，已保留原圖。可重新載入。' : original ? '原圖對照中。' : media.matches ? '系統減少動態已啟用，顯示靜態角色。' : paused ? '已暫停；可繼續播放。' : mode==='pointer'?'移動游標，感受頭部、肩膀與骨盆的跟進。':mode==='showcase'?'流動展示播放中；可縮放觀察動作收尾。':'極端方向與反轉測試中；請觀察持傘和雙腿。');
  text('playing', failed ? '載入失敗' : original ? '原圖' : media.matches ? '減少動態' : lastSnapshot?.playing ? '播放中' : '暫停');
  text('play', paused ? '繼續播放' : '暫停');
  $('play').disabled = !player || original || media.matches || failed;updateTarget();
}
function showArtwork() { fallback.hidden = false; canvas.style.visibility = 'hidden'; }
function showPlayer() { fallback.hidden = true; canvas.style.visibility = 'visible'; }
function fail(error) {
  failed = true; controller?.abort(); player?.destroy(); player = undefined;
  showArtwork(); interactive.forEach(control => control.disabled = true);
  showBindings(false); $('retry').hidden = false;
  status(); console.error('Mirea sandbox:', error);
}
function update(snapshot) {
  lastSnapshot = snapshot; reportCount += 1;
  // Player reports at ~10 Hz; UI work never owns the engine's frame state.
  canvas.dataset.reports = String(reportCount);
  text('scale', (snapshot.diagnostics.motionScale * 100).toFixed(1) + '%');
  text('gradient', snapshot.diagnostics.maxDisplacementGradient.toFixed(4));
  text('look', snapshot.parameters.lookX.toFixed(1) + ' / ' + snapshot.parameters.lookY.toFixed(1));
  text('travel',(snapshot.trackingOffset??[0,0]).map(v=>(v*100).toFixed(1)+'%').join(' / '));
  for (const pin of snapshot.pins) {
    const marker = pins.get(pin.name);
    if (marker) { const [x,y]=snapshot.trackingOffset??[0,0]; marker.setAttribute('cx', (pin.x+x + .12) / 1.24); marker.setAttribute('cy', (pin.y+y + .12) / 1.24); }
  }
  if(snapshot.face)text('face-state',`眼神 ${snapshot.face.gaze.map(v=>v.toFixed(2)).join(' / ')} · 保留原畫眼皮與嘴巴`);
  for(const group of snapshot.pointerGroups??[]){
    const prefix=group.id==='upper-follow'?'upper':'pelvis';
    text(prefix+'-motion',`${(group.offset[0]*1024).toFixed(1)} px · ${(group.rotation*180/Math.PI).toFixed(1)}°`);
    $(prefix+'-meter').style.width=(50+group.rotation/.014*45)+'%';
  }
  updateTarget();status();
}
function applyTracking() {
  const range=Number($('float-range').value), inertia=Number($('flow-inertia').value);
  player?.setTracking({translation:[range,range*2/3],response:.09-inertia*.055,damping:.64+inertia*.18,maxVelocity:3.5-inertia*1.2,bodyFollow:.25});
  text('float-value',(range*100).toFixed(1)+'%'); text('inertia-value',Math.round(inertia*100)+'%');
}
function applyMotion() {
  player?.setMotion({ ...presets[selected], follow: $('follow').checked ? Number($('follow-strength').value) : 0, layers:Number($('layer-strength').value),parts:Number($('detail-strength').value) });
  text('layer-value',Math.round(Number($('layer-strength').value)*100)+'%');text('detail-value',Number($('detail-strength').value).toFixed(2)+'×');
  text('follow-value',Number($('follow-strength').value).toFixed(2)+'×');
  document.querySelectorAll('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === selected)));
}
function mountBindings(model) {
  const svg = $('bindings'); svg.replaceChildren(); pins = new Map();
  const ns = 'http://www.w3.org/2000/svg';
  for (const [index, part] of displayRegions(model).entries()) {
    if ($('part-select').value !== 'all' && $('part-select').value !== part.id) continue;
    const polygon = document.createElementNS(ns,'polygon');
    polygon.setAttribute('points',part.polygon.map(([x,y])=>`${(x+.12)/1.24},${(y+.12)/1.24}`).join(' '));
    polygon.setAttribute('fill',`hsl(${index*41%360} 80% 70% / .17)`);
    polygon.setAttribute('stroke',`hsl(${index*41%360} 85% 75%)`);polygon.setAttribute('stroke-width','.002');
    const title=document.createElementNS(ns,'title');title.textContent=part.name ?? part.id;polygon.append(title);svg.append(polygon);
  }
  for (const chain of model.hair) {
    const line = document.createElementNS(ns, 'polyline');
    line.setAttribute('points', chain.points.map(([x,y]) => `${(x+.12)/1.24},${(y+.12)/1.24}`).join(' '));
    line.setAttribute('fill', 'none'); line.setAttribute('stroke', '#95f4e2'); line.setAttribute('stroke-width', '.003'); svg.append(line);
  }
  for (const chain of model.accessories) {
    const line = document.createElementNS(ns, 'line');
    for (const [suffix, point] of [['1',chain.root], ['2',chain.tip]]) {
      line.setAttribute('x'+suffix, (point[0]+.12)/1.24); line.setAttribute('y'+suffix, (point[1]+.12)/1.24);
    }
    line.setAttribute('stroke', '#ffdc9f'); line.setAttribute('stroke-width', '.003'); svg.append(line);
  }
  for (const pin of model.pins) {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('r', '.006'); circle.setAttribute('fill', '#f49db8');
    const title = document.createElementNS(ns, 'title'); title.textContent = pin.name; circle.append(title);
    pins.set(pin.name, circle); svg.append(circle);
  }
}
async function load() {
  controller?.abort(); player?.destroy(); player = undefined;
  const lifetime = new AbortController(); controller = lifetime;
  failed = false; lastSnapshot = undefined; reportCount = 0;
  interactive.forEach(control => control.disabled = true); $('retry').hidden = true;
  showArtwork(); $('status').textContent = '正在載入本機模型…';
  try {
    const embedded = $('embedded-model');
    if (location.protocol === 'file:' && !embedded) throw new Error('Use mirea.html for direct opening, or serve index.html over local HTTP');
    const [runtime, response] = await Promise.all([
      import('./runtime/index.js'), embedded ? Promise.resolve(null) : fetch('./model.json', {signal: lifetime.signal}),
    ]);
    const {createPlayer,validateModel}=runtime;sampleTrack=runtime.sampleTrack;
    if (response && !response.ok) throw new Error('Model request failed: ' + response.status);
    const model = embedded ? JSON.parse(embedded.textContent) : await response.json(); validateModel(model);
    model.texture.src = new URL(model.texture.src, document.baseURI).href;
    currentModel=model;
    $('part-select').replaceChildren(new Option('全部部位','all'),...displayRegions(model).map(p=>new Option(p.name??p.id,p.id)));
    text('part-count',String(displayRegions(model).length));
    mountBindings(model); $('vertices').textContent = ((model.mesh.columns+1)*(model.mesh.rows+1)).toLocaleString();
    const created = await createPlayer({canvas, model, signal: lifetime.signal, autoplay: false, reducedMotion: 'respect', onFrame: update, onError: fail});
    if (lifetime.signal.aborted) { created.destroy(); return; }
    player = created; applyMotion(); applyTracking(); applyExpression(); applyMode();
    if (original) showArtwork(); else showPlayer();
    if (!paused && !original) player.play();
    interactive.forEach(control => control.disabled = false); status();
  } catch (error) { if (!lifetime.signal.aborted) fail(error); }
}
function pointer(event) {
  if (mode!=='pointer' || viewGesture || viewTouchMode || $('pan-view').checked || touches.size > 1 || !player || original || paused || media.matches || !$('follow').checked) return;
  const rect = stage.getBoundingClientRect();
  keyboardTracking = false;
  targetPointer=[Math.max(-.5,Math.min(.5,(event.clientX-rect.left)/rect.width-.5)),Math.max(-.5,Math.min(.5,(event.clientY-rect.top)/rect.height-.5))];
  player.setPointer(...targetPointer);updateTarget();
  if(currentModel.face && !$('eye-gaze').checked)player.setGaze(0,0);
  if(currentModel.face && $('eye-gaze').checked){
    const box=canvas.getBoundingClientRect(),eyes=currentModel.face.eyes;
    const travel=lastSnapshot?.trackingOffset??[0,0];
    const cx=((eyes[0].center[0]+eyes[1].center[0])/2+travel[0]+.12)/1.24;
    const cy=((eyes[0].center[1]+eyes[1].center[1])/2+travel[1]+.12)/1.24;
    player.setGaze((event.clientX-box.left-box.width*cx)/(box.width*.18),(event.clientY-box.top-box.height*cy)/(box.height*.11));
  }
}
stage.addEventListener('pointermove', pointer);
stage.addEventListener('pointerdown', pointer);
stage.addEventListener('pointerleave',()=>{if(mode!=='pointer'||viewGesture||paused||original||media.matches)return;keyboardTracking=false;targetPointer=undefined;player?.setPointer(0,0);player?.setGaze(0,0);updateTarget();});
for (const name of ['pointerup', 'pointercancel']) stage.addEventListener(name,event=>{if(event.pointerType!=='mouse'&&mode==='pointer'&&!paused&&!original&&!media.matches){targetPointer=undefined;player?.setPointer(0,0);updateTarget();}});
art.addEventListener('blur',()=>{if(keyboardTracking){keyboardTracking=false;targetPointer=undefined;if(!paused&&!original&&!media.matches)player?.setPointer(0,0);updateTarget();}});
art.addEventListener('keydown', event => {
  if (mode!=='pointer' || $('pan-view').checked || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key) || !player || original || paused || media.matches || !$('follow').checked) return;
  event.preventDefault(); const x = event.key === 'ArrowLeft' ? -.5 : event.key === 'ArrowRight' ? .5 : 0;
  keyboardTracking = true;
  const y = event.key === 'ArrowUp' ? -.5 : event.key === 'ArrowDown' ? .5 : 0; targetPointer=[x,y];player.setPointer(x,y);updateTarget(); if(!$('eye-gaze').checked)player.setGaze(0,0);
});
document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => { selected = button.dataset.preset; $('follow-strength').value=presets[selected].follow; $('float-range').value=flowPresets[selected].range; $('flow-inertia').value=flowPresets[selected].inertia; $('detail-strength').value=presets[selected].parts; applyMotion(); applyTracking(); if(mode!=='pointer')applyMode(); }));
$('follow').addEventListener('change', () => { player?.setPointer(0,0); applyMotion();applyMode(); });
$('follow-strength').addEventListener('input',()=>{applyMotion();if(mode!=='pointer')applyMode()});
for(const id of ['layer-strength','detail-strength'])$(id).addEventListener('input',applyMotion);
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;applyMode()}));
for (const id of ['float-range','flow-inertia']) $(id).addEventListener('input',applyTracking);
$('part-select').addEventListener('change',()=>{if(currentModel)mountBindings(currentModel);$('show-bindings').checked=true;showBindings(!original);if(lastSnapshot)update(lastSnapshot);});
$('play').addEventListener('click', () => { paused = !paused; paused ? player?.pause() : player?.play(); status(); });
$('original').addEventListener('change', () => {
  original = $('original').checked;
  if (original) { player?.pause(); showArtwork(); showBindings(false); }
  else { showPlayer(); showBindings($('show-bindings').checked); if (!paused) player?.play(); }
  status();
});
$('show-bindings').addEventListener('change', () => showBindings(!original && $('show-bindings').checked));
$('background').addEventListener('change', () => { stage.dataset.background = $('background').value; });
$('reset').addEventListener('click', () => {
  // Recreate to reset accumulated sway time and secondary springs as well.
  selected = 'gentle'; mode='pointer';paused = false; original = false;targetPointer=undefined;
  $('layer-strength').value='1';$('detail-strength').value='1';
  focusView(.5,.5,1); $('pan-view').checked=false; stage.classList.remove('is-panning');
  $('follow-strength').value=presets.gentle.follow;
  $('float-range').value=flowPresets.gentle.range; $('flow-inertia').value=flowPresets.gentle.inertia;
  $('eye-gaze').checked=true;
  $('original').checked = false; $('follow').checked = true; $('show-bindings').checked = false; showBindings(false);
  void load();
});
$('retry').addEventListener('click', () => void load());
media.addEventListener('change', () => { if (!player) return; if (media.matches || paused || original) player.pause(); else player.play(); status(); });
window.addEventListener('pagehide', () => { controller?.abort(); player?.destroy(); player = undefined; });
window.addEventListener('pageshow', event => { if (event.persisted) void load(); });
void load();

function applyExpression(){player?.setGazeStrength($('eye-gaze').checked?1:0);if(!$('eye-gaze').checked)player?.setGaze(0,0)}
$('eye-gaze').addEventListener('change',applyExpression);


$('zoom-in').addEventListener('click',()=>setZoom(zoom*1.25));
$('zoom-out').addEventListener('click',()=>setZoom(zoom/1.25));
$('zoom').addEventListener('input',()=>setZoom(Number($('zoom').value)/100));
$('view-home').addEventListener('click',()=>focusView(.5,.5,1));
$('view-face').addEventListener('click',()=>focusView(.554,.17,4));
$('view-prop').addEventListener('click',()=>focusView(.39,.23,2.1));
$('view-legs').addEventListener('click',()=>focusView(.54,.725,2));
$('pan-view').addEventListener('change',()=>{stage.classList.toggle('is-panning',$('pan-view').checked);if(mode==='pointer'&&!paused&&!original&&!media.matches)player?.setPointer(0,0);targetPointer=undefined;updateTarget()});
stage.addEventListener('wheel',event=>{event.preventDefault();setZoom(zoom*Math.exp(-Math.max(-200,Math.min(200,event.deltaY))*.002),[event.clientX,event.clientY]);},{passive:false});
stage.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  if(event.pointerType==='touch')touches.set(event.pointerId,[event.clientX,event.clientY]);
  if(touches.size===2){
    const [a,b]=[...touches.values()];pinch={distance:Math.hypot(a[0]-b[0],a[1]-b[1]),zoom,center:[(a[0]+b[0])/2,(a[1]+b[1])/2]};
    viewGesture=undefined;viewTouchMode=true;if(mode==='pointer'&&!paused&&!original&&!media.matches)player?.setPointer(0,0);targetPointer=undefined;updateTarget();
  }else if($('pan-view').checked){viewGesture={id:event.pointerId,start:[event.clientX,event.clientY],pan:[...pan]};stage.classList.add('is-dragging');}
  if(viewGesture||pinch){event.preventDefault();stage.setPointerCapture(event.pointerId);}
},true);
stage.addEventListener('pointermove',event=>{
  if(touches.has(event.pointerId))touches.set(event.pointerId,[event.clientX,event.clientY]);
  if(pinch&&touches.size===2){
    const [a,b]=[...touches.values()],center=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    if(pinch.distance>0)setZoom(pinch.zoom*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch.distance,pinch.center);
    pan=pan.map((v,i)=>v+center[i]-pinch.center[i]);pinch.center=center;renderView();event.preventDefault();
  }else if(viewGesture?.id===event.pointerId){
    pan=viewGesture.pan.map((v,i)=>v+(i===0?event.clientX:event.clientY)-viewGesture.start[i]);renderView();event.preventDefault();
  }
},true);
for(const name of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(name,endViewGesture);
renderView();

art.addEventListener('keydown',event=>{
  if(event.key==='+'||event.key==='='||event.key==='-'||event.key==='0'){
    event.preventDefault();event.key==='0'?focusView(.5,.5,1):setZoom(zoom*(event.key==='-'?.8:1.25));
  }else if($('pan-view').checked && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
    event.preventDefault();const step=event.shiftKey?50:20;
    if(event.key==='ArrowLeft')pan[0]+=step;if(event.key==='ArrowRight')pan[0]-=step;
    if(event.key==='ArrowUp')pan[1]+=step;if(event.key==='ArrowDown')pan[1]-=step;renderView();
  }
});
