import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {mkdtemp,mkdir,cp,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {fixedSteps,REVIEW_STEP,reviewPoses,createSimulation,createLayeredSimulation,validateLayeredModel} from '../src/index.js'
import type {LayeredModel} from '../src/index.js'
import {layeredModel} from './fixtures/layered.js'
import {startStudio,loadProject} from '../src/studio/server.js'
import {validateProject} from '../src/studio/project.js'
import {reviewChecks} from '../src/studio/document.js'
import {missingAssets} from '../src/studio/materials.js'
const hash=(data:string|Uint8Array)=>createHash('sha256').update(data).digest('hex')
export function faceModel():LayeredModel {
 const m=layeredModel();m.joints=[]
 const ids=['ball','iris','line','half','closed','mouth-closed','mouth-a']
 m.attachments=ids.map(id=>({id,atlas:'atlas',rect:[2,2,100,200],bounds:[0,0,1,1],coverage:'complete',provenance:'synthetic test pixels',vertices:([[0,0],[1,0],[0,1],[1,1]] as [number,number][]).map(position=>({position,weights:[{node:'root',weight:1}]})),triangles:[0,2,1,1,2,3]}))
 m.face={eyes:[{side:'left',node:'root',ball:'ball',iris:'iris',lines:['line'],half:'half',closed:'closed',top:[[.2,.2],[.8,.2]],bottom:[[.2,.4],[.8,.4]],travel:[.02,.01]}],mouth:{node:'root',shapes:{closed:'mouth-closed',a:'mouth-a'}}}
 return m
}
test('manual fixed review steps and definitions repeat exactly and reject invalid elapsed time',()=>{
 const steps:number[]=[];fixedSteps(1000,dt=>steps.push(dt));assert.equal(steps.length,60);assert.ok(steps.every(dt=>dt===REVIEW_STEP))
 for(const value of [-1,Infinity,NaN,60001])assert.throws(()=>fixedSteps(value,()=>{}))
 const render=()=>{const sim=createLayeredSimulation(layeredModel());let time=0;for(const p of reviewPoses.find(p=>p.id==='reversal')!.sequence){sim.setPointer(...p.pointer);fixedSteps(p.milliseconds,dt=>sim.update(time+=dt,dt))}return sim.mesh.positions}
 assert.deepEqual(render(),render())
})
test('Mirea complete position buffers retain their pre-change numerical baseline',()=>{
 const baseline=JSON.parse(readFileSync(new URL('./fixtures/mirea-studio-baseline.json',import.meta.url),'utf8'))
 for(const [name,b]of Object.entries(baseline) as [string,{model:any;frames:{frame:number;sha256:string}[]}][]){
 const sim=name==='shared'?createSimulation(b.model):createLayeredSimulation(b.model),mesh='buildContinuousMesh'in sim?sim.buildContinuousMesh():sim.mesh
 for(let frame=0;frame<180;frame++){sim.setPointer(frame<60?.5:frame<120?-.5:0,.2);if('updatePins'in sim){sim.updatePins(frame*1000/60,1000/60);sim.updateVertices(mesh as ReturnType<typeof sim.buildContinuousMesh>,frame*1000/60)}else sim.update(frame*1000/60,1000/60)
 const expected=b.frames.find(f=>f.frame===frame);if(expected)assert.equal(hash(JSON.stringify([...mesh.positions])),expected.sha256,name+' frame '+frame)}
 }
})
test('face layers reject missing assets, use one head transform, hide variants and restore neutral',()=>{
 const m=faceModel();validateLayeredModel(m);const sim=createLayeredSimulation(m)
 m.face!.eyes![0].travel[0]=.1;sim.face.setGaze(1,0);assert.equal(sim.face.layer('iris').shift[0],.02)
 assert.equal(sim.face.layer('closed').opacity,0);assert.equal(sim.face.layer('ball').opacity,1)
 sim.setFace({eyeOpenLeft:.5,mouthShape:'a',mouthOpen:.8});sim.update(0,0)
 assert.equal(sim.face.layer('half').opacity,1);assert.equal(sim.face.layer('ball').opacity,0);assert.equal(sim.face.layer('mouth-a').opacity,1)
 assert.notDeepEqual(sim.mesh.positions,sim.mesh.rest)
 const state=sim.face.snapshot();assert.throws(()=>sim.setFace({eyeOpenLeft:.1,mouthShape:'o'}));assert.deepEqual(sim.face.snapshot(),state)
 assert.throws(()=>sim.setFace({eyeOpenRight:0}));assert.throws(()=>sim.setFace({mouthOpen:NaN}))
 sim.setFace({eyeOpenLeft:0});assert.equal(sim.face.layer('closed').opacity,1)
 sim.update(1000,16,true);assert.deepEqual(sim.mesh.positions,sim.mesh.rest);assert.equal(sim.face.layer('ball',true).opacity,1);assert.equal(sim.face.layer('mouth-closed',true).opacity,1)
 sim.reset();sim.update(0,0);assert.equal(sim.face.snapshot().mouthOpen,0)
 for(const modify of [(m:LayeredModel)=>{m.face!.eyes![0].top[1][0]=.1},(m:LayeredModel)=>{m.attachments[0].coverage='visible-only'},(m:LayeredModel)=>{m.attachments[0].vertices[0].weights[0].node='tip'},(m:LayeredModel)=>{m.face!.mouth!.shapes.a='not-found'}]){const m=faceModel();modify(m);assert.throws(()=>validateLayeredModel(m))}
})
test('sibling bangs couple within their individual limits and preserve legacy opt-in behavior',()=>{
 const m=layeredModel();m.nodes.push({...structuredClone(m.nodes[1]),id:'tip2',spring:{...m.nodes[1].spring!,phase:2}})
 const uncoupled=createLayeredSimulation(m);m.hairGroups=[{id:'bangs',nodes:['tip','tip2'],coupling:1}];const coupled=createLayeredSimulation(m)
 for(let i=1;i<120;i++){uncoupled.update(i*REVIEW_STEP,REVIEW_STEP);coupled.update(i*REVIEW_STEP,REVIEW_STEP)}
 assert.notEqual(uncoupled.rotations[1],uncoupled.rotations[2]);assert.equal(coupled.rotations[1],coupled.rotations[2]);assert.ok(Math.abs(coupled.rotations[1])<=.08)
 m.hairGroups[0].nodes=['root','tip'];assert.throws(()=>validateLayeredModel(m))
})
test('version catalog, issue capture, explicit resolution, stale inputs and failed switch preserve the active model',async t=>{
 const root=await mkdtemp(join(tmpdir(),'yuragi-agent-'));t.after(()=>rm(root,{recursive:true,force:true}));const ui=join(root,'ui'),out=join(root,'out');await mkdir(ui);await writeFile(join(ui,'index.html'),'<head></head>')
 await cp(new URL('../assets/mirea/texture.png',import.meta.url),join(root,'source.png'));await writeFile(join(root,'analysis.json'),'original')
 const m=JSON.parse(readFileSync(new URL('../assets/mirea/model.json',import.meta.url),'utf8'));m.texture.src='./texture.png'
 for(const id of ['v1','v2']){await mkdir(join(root,id));await cp(join(root,'source.png'),join(root,id,'texture.png'));await writeFile(join(root,id,'model.json'),JSON.stringify({...m,name:id}))}
 const catalog={version:1,source:{file:'source.png',sha256:hash(await readFile(join(root,'source.png')))},stage:'compiled',currentVersion:'v1',versions:[{id:'v1',path:'v1',inputs:{'analysis.json':hash('original')}},{id:'v2',path:'v2'}]};validateProject(catalog)
 const publish=()=>writeFile(join(root,'project.json'),JSON.stringify(catalog));await publish()
 const studio=await startStudio({project:root,out,uiRoot:ui});t.after(()=>studio.close());const token=(await(await fetch(studio.url)).text()).match(/studio-token" content="([a-f\d]+)"/)![1]
 const headers={'X-Yuragi-Session':token,'Content-Type':'application/json'},get=async(path:string)=>(await fetch(studio.url+'/api/'+path,{headers})).json(),post=(path:string,data:unknown)=>fetch(studio.url+'/api/'+path,{headers,method:'POST',body:JSON.stringify(data)})
 const first=await get('session');const issue=await(await post('issues',{sourceFingerprint:first.sourceFingerprint,pose:'right',milliseconds:1500,pointer:[.5,0],sourcePoint:[.4,.2],partId:'head-root',snapshot:{test:true},observation:'Hair root seam',screenshot:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg=='})).json()
 assert.equal(issue.issue.fingerprint,first.sourceFingerprint);assert.equal(issue.path,join(studio.out,'review/issues.json'));assert.deepEqual(JSON.parse(await readFile(issue.path,'utf8')).issues[0].sourcePoint,[.4,.2])
 const accepted={sourceFingerprint:first.sourceFingerprint,model:first.model,review:{fingerprint:first.sourceFingerprint,checks:Object.fromEntries(reviewChecks.map(k=>[k,true])),notes:'Human observation'}}
 assert.equal((await post('export',accepted)).status,400)
 assert.equal((await post('issue-status',{sourceFingerprint:first.sourceFingerprint,id:issue.issue.id,resolved:true})).status,200)
 assert.equal((await post('export',accepted)).status,200)
 await writeFile(join(root,'analysis.json'),'changed');assert.equal((await get('summary')).versions[0].stale,true);assert.equal((await post('export',accepted)).status,400)
 catalog.currentVersion='v2';await publish();const second=await(await post('version',{versionId:'v2'})).json();assert.notEqual(second.sourceFingerprint,first.sourceFingerprint);assert.equal(second.issues.length,0)
 await writeFile(join(root,'v1/model.json'),'{}');assert.equal((await post('version',{versionId:'v1'})).status,400);assert.equal((await get('session')).versionId,'v2')
 assert.throws(()=>validateProject({...catalog,versions:[{id:'oops',path:'../other'}]}))
})

test('image dimensions are verified before a candidate can be offered',async t=>{
 const root=await mkdtemp(join(tmpdir(),'yuragi-dimensions-'));t.after(()=>rm(root,{recursive:true,force:true}));await cp(new URL('../assets/mirea/texture.png',import.meta.url),join(root,'texture.png'));const m=JSON.parse(readFileSync(new URL('../assets/mirea/model.json',import.meta.url),'utf8'));m.texture.src='texture.png';m.texture.width++;await writeFile(join(root,'model.json'),JSON.stringify(m));await assert.rejects(loadProject(root),/dimensions/);
})

test('preview automatically saves fingerprint-bound missing materials and preserves authoring requests',async t=>{
 const root=await mkdtemp(join(tmpdir(),'yuragi-preview-'));t.after(()=>rm(root,{recursive:true,force:true}));const ui=join(root,'ui'),out=join(root,'out');await mkdir(ui);await writeFile(join(ui,'index.html'),'<head></head>')
 const artwork=await readFile(new URL('../assets/mirea/texture.png',import.meta.url));await writeFile(join(root,'texture.png'),artwork)
 const model=JSON.parse(readFileSync(new URL('../assets/mirea/model.json',import.meta.url),'utf8'));model.texture.src='texture.png';await writeFile(join(root,'model.json'),JSON.stringify(model))
 const sourceSha256=hash(artwork);await writeFile(join(root,'missing-assets.json'),JSON.stringify({version:1,sourceSha256,items:[{id:'rear-hair',partId:'hair',reason:'Review visible contour',nextAction:'revise-annotation',required:false},{id:'eye-left-half',partId:'eye-left',reason:'Retired auto-supplement request',nextAction:'provide-artwork',required:false}]}))
 const studio=await startStudio({project:root,out,uiRoot:ui});t.after(()=>studio.close());const token=(await(await fetch(studio.url)).text()).match(/studio-token" content="([a-f\d]+)"/)![1]
 const session=await(await fetch(studio.url+'/api/session',{headers:{'X-Yuragi-Session':token}})).json()
 const report=JSON.parse(await readFile(join(out,'missing-assets.json'),'utf8'));assert.equal(session.missingAssets.path,join(studio.out,'missing-assets.json'));assert.equal(report.modelFingerprint,session.sourceFingerprint);assert.equal(report.sourceSha256,sourceSha256)
 assert.ok(report.items.some((i:{id:string})=>i.id==='rear-hair'));assert.ok(!report.items.some((i:{id:string})=>i.id.startsWith('mouth-')))
 assert.ok(!report.items.some((i:{id:string})=>i.id==='mouth-a'));assert.ok(!report.items.some((i:{id:string})=>i.id==='eye-left-half'))
 const face=faceModel(),items=missingAssets(face);assert.ok(!items.some(i=>i.id.startsWith('eye-left-')));assert.ok(!items.some(i=>i.partId==='mouth'));assert.ok(items.every(i=>!i.required))
})
