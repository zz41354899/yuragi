import { createTestModel } from './fixtures/model.js'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, cp, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { validateModel } from '../src/validation.ts'
import { StudioDocument, writePath, readPath, reviewChecks, validateStudioModel } from '../src/studio/document.ts'
import { startStudio, safeFile } from '../src/studio/server.ts'
import { parseArguments } from '../src/studio/cli.ts'
import { geometry } from '../../../apps/studio/src/geometry.ts'
import { imagePoint, zoomAtPoint } from '../../../apps/site/src/editor/viewport.ts'

test('Studio edits keep valid preview, undo/redo preserve drafts and invalidate acceptance', () => {
  const model=createTestModel(), document=new StudioDocument(model)
  document.review={fingerprint:'before',checks:{neutral:true},notes:'reviewed'}
  document.edit(writePath(document.draft,['pins',0,'x'],.4),'Move pin')
  assert.equal(document.valid.version===1&&document.valid.pins[0].x,.4)
  assert.equal(document.review,undefined)
  document.edit(writePath(document.draft,['pins',0,'parent'],model.pins[0].name),'Invalid cycle')
  assert.match(document.error,/cyclic/)
  assert.equal(readPath(document.draft,['pins',0,'parent']),model.pins[0].name)
  assert.equal(document.valid.version===1&&document.valid.pins[0].parent,undefined)
  document.undo();assert.equal(document.error,'');document.redo();assert.match(document.error,/cyclic/)
  const restored=new StudioDocument(model);restored.restore(document.save());assert.match(restored.error,/cyclic/);assert.equal(restored.review,undefined)
  assert.equal(model.pins[0].x,createTestModel().pins[0].x)
})
test('Studio supports polygon/parent edits and exposes source geometry, independent from Mirea',()=>{
  const model=createTestModel();model.parts=[{id:'test',kind:'cloth',polygon:[[.2,.2],[.4,.2],[.4,.4]],root:[.3,.2],tip:[.3,.4],feather:.02,rotation:.04,stiffness:.04,damping:.7,phase:0,wind:.1,follow:.1}]
  const document=new StudioDocument(model)
  document.edit(writePath(document.draft,['parts',0,'polygon',0],[.18,.21]),'Polygon vertex')
  assert.equal(document.error,'')
  const graph=geometry(document.valid as typeof model)
  assert.deepEqual(graph.handles.find(h=>h.id==='parts.0.polygon.0')?.point,[.18,.21])
  document.edit(writePath(document.draft,['parts',0,'polygon',1],[.18,.21]),'Duplicate vertex')
  assert.match(document.error,/length/)
  assert.deepEqual((document.valid as typeof model).parts?.[0].polygon[1],[.4,.2])
})
test('transformed source rect converts pointer positions independently of padding and zoom',()=>{
  assert.deepEqual(imagePoint({x:350,y:250},{left:200,top:100,width:300,height:600}),{x:.5,y:.25})
  const zoom=zoomAtPoint(1,2,{x:0,y:0},{x:50,y:20})
  assert.deepEqual(zoom,{zoom:2,pan:{x:-50,y:-20}})
})
test('CLI rejects missing/invalid options and parses explicit local roots',()=>{
  assert.deepEqual(parseArguments(['studio','--project','./character','--out','./output','--port','0','--no-open']),{open:false,project:'./character',out:'./output',port:0})
  assert.throws(()=>parseArguments(['studio','--project','--out']),/Missing/)
  assert.throws(()=>parseArguments(['studio','--port','99999']),/Port/)
  assert.throws(()=>parseArguments(['studio','--remote']),/Unknown/)
})

test('local server enforces session, source paths, draft isolation, review and versioned delivery',async t=>{
  const root=await mkdtemp(join(tmpdir(),'yuragi-studio-test-')),project=join(root,'project'),out=join(root,'out'),ui=join(root,'ui')
  t.after(()=>rm(root,{recursive:true,force:true}))
  await mkdir(project);await mkdir(ui);await writeFile(join(ui,'index.html'),'<html><head></head><body>Studio</body></html>')
  await cp(new URL('../assets/mirea/texture.png',import.meta.url),join(project,'texture.png'))
  const model=createTestModel('./texture.png');await writeFile(join(project,'model.json'),JSON.stringify(model));await writeFile(join(project,'analysis.json'),JSON.stringify({evidence:'original'}))
  const studio=await startStudio({project,out,uiRoot:ui});t.after(()=>studio.close())
  const html=await (await fetch(studio.url)).text(),token=html.match(/studio-token" content="([a-f\d]+)"/)?.[1]
  assert.ok(token)
  assert.equal((await fetch(studio.url+'/api/session')).status,403)
  const get=await fetch(studio.url+'/api/session',{headers:{'X-Yuragi-Session':token}})
  const session=await get.json() as {assetFingerprint:string;sourceFingerprint:string;records:Record<string,unknown>}
  assert.equal(get.status,200);assert.deepEqual(session.records['analysis.json'],{evidence:'original'})
  const post=async(path:string,body:unknown)=>fetch(studio.url+'/api/'+path,{method:'POST',headers:{'X-Yuragi-Session':token!,'Content-Type':'application/json'},body:JSON.stringify({sourceFingerprint:session.sourceFingerprint,...body as object})})
  const invalid=structuredClone(model);invalid.pins[0].x=2
  assert.equal((await post('draft',{draft:{version:1,model:invalid,changes:[]}})).status,200)
  assert.equal((await readFile(join(project,'model.json'),'utf8')),JSON.stringify(model))
  assert.equal((await post('export',{model,review:{checks:{}}})).status,400)
  const fingerprint=createHash('sha256').update(JSON.stringify(model)+':'+session.assetFingerprint).digest('hex')
  const body={model,changes:[],review:{fingerprint,checks:Object.fromEntries(reviewChecks.map(key=>[key,true])),notes:'Observed in test browser; external devices untested'}}
  assert.equal((await fetch(studio.url+'/api/export',{method:'POST',headers:{'X-Yuragi-Session':token,'Origin':'https://attacker.invalid'},body:JSON.stringify(body)})).status,403)
  const response=await post('export',body),result=await response.json() as {path:string;error?:string}
  assert.equal(response.status,200,result.error)
  const delivered:unknown=JSON.parse(await readFile(join(result.path,'model.json'),'utf8'));validateModel(delivered)
  assert.match(delivered.texture.src,/^\.\/assets\/0\.png$/)
  assert.equal((await safeFile(result.path,delivered.texture.src)),join(result.path,'assets','0.png'))
  assert.match(await readFile(join(result.path,'examples','Character.vue'),'utf8'),/<script setup lang="ts">\n/)
  assert.match(await readFile(join(result.path,'examples','vanilla.ts'),'utf8'),/signal/)
  const second=await post('export',body);assert.notEqual((await second.json() as {path:string}).path,result.path)
  const changed=structuredClone(model);changed.pins[0].x=.4
  assert.equal((await post('export',{...body,model:changed})).status,400)
  await writeFile(join(project,'texture.png'),'changed')
  assert.equal((await post('export',body)).status,400)
  assert.equal((await fetch(studio.url+'/api/session',{headers:{'X-Yuragi-Session':token}})).status,400)
})
test('local reads and output writes reject escaping symlinks',async t=>{
  const root=await mkdtemp(join(tmpdir(),'yuragi-path-test-')),project=join(root,'project'),out=join(root,'out'),ui=join(root,'ui')
  t.after(()=>rm(root,{recursive:true,force:true}))
  await mkdir(project);await mkdir(out);await mkdir(ui);await writeFile(join(ui,'index.html'),'<head></head>');await writeFile(join(root,'secret.png'),'private')
  await symlink(join(root,'secret.png'),join(project,'escape.png'))
  await assert.rejects(safeFile(project,'escape.png'),/leaves/);await assert.rejects(safeFile(project,'../secret.png'),/leaves/)
  await cp(new URL('../assets/mirea/texture.png',import.meta.url),join(project,'texture.png'))
  const model=createTestModel('./texture.png');await writeFile(join(project,'model.json'),JSON.stringify(model))
  await symlink(root,join(out,'drafts'))
  const studio=await startStudio({project,out,uiRoot:ui});t.after(()=>studio.close())
  const token=(await(await fetch(studio.url)).text()).match(/studio-token" content="([a-f\d]+)"/)![1]
  // A session read also rejects a draft symlink rather than reading external records.
  const response=await fetch(studio.url+'/api/draft',{method:'POST',headers:{'X-Yuragi-Session':token},body:JSON.stringify({sourceFingerprint:createHash('sha256').update(JSON.stringify(model)+':'+createHash('sha256').update(JSON.stringify([[model.texture.src,createHash('sha256').update(await readFile(join(project,'texture.png'))).digest('hex')]])).digest('hex')).digest('hex'),draft:{version:1,model,changes:[]}})})
  assert.equal(response.status,400)
})
test('layered v2 remains inspection-only through document and server',async t=>{
  const model:unknown=JSON.parse(await readFile(new URL('../../../apps/site/src/models/layered-mirea.json',import.meta.url),'utf8'));validateStudioModel(model)
  assert.equal(model.version,2)
  const document=new StudioDocument(model);assert.throws(()=>document.edit(writePath(model,['name'],'changed'),'Edit'),/inspection-only/)
  assert.throws(()=>document.restore({version:1,model:writePath(model,['name'],'changed'),changes:[]}),/cannot edit/)
})

test('npm bin symlink invokes the CLI instead of silently skipping main',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'yuragi-bin-'))
  try {
    const bin=join(directory,'yuragi')
    await symlink(resolve('src/studio/cli.ts'),bin)
    const output=execFileSync(process.execPath,['--import','tsx',bin,'--help'],{encoding:'utf8'})
    assert.match(output,/Yuragi Studio/);assert.match(output,/--project folder/);assert.match(output,/--no-open/)
  } finally {await rm(directory,{recursive:true,force:true})}
})
