import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import ts from 'typescript'
import { parse, compileScript } from '@vue/compiler-sfc'
import catalogue from '../src/docs/api-generated.json'

const root=resolve(import.meta.dirname,'../../..')
test('API catalogue matches public exports and standalone skill references',()=>{
  execFileSync(process.execPath,['scripts/generate-api.mjs','--check'],{cwd:root})
  assert.equal(new Set(catalogue.entries.map(e=>e.id)).size,catalogue.entries.length)
  for(const entry of catalogue.entries){
    assert.ok(entry.signature);assert.ok(entry.example);assert.ok(entry.returns);assert.ok(entry.group in catalogue.groups, 'Missing API category: '+entry.group)
    for(const lang of ['zh-TW','en','ja'] as const){assert.ok(entry.summary[lang]);assert.ok(entry.notes[lang])}
    for(const id of entry.related)assert.ok(catalogue.entries.some(e=>e.id===id))
    const delivered=readFileSync(resolve(root,'skills/yuragi-rig-spec/references/api',entry.id.replaceAll('/','-')+'.md'),'utf8')
    assert.ok(delivered.includes(entry.signature));assert.ok(delivered.includes(entry.notes.en))
  }
  assert.ok(catalogue.entries.some(e=>e.id==='core/create-player'&&e.signature.includes('signal?')))
  assert.ok(catalogue.entries.some(e=>e.id==='simulation/update-vertices'))
  assert.ok(catalogue.entries.some(e=>e.id==='layered-simulation/update'))
  assert.ok(catalogue.entries.some(e=>e.id==='simulation-hair/bind'))
  assert.ok(catalogue.entries.some(e=>e.id==='simulation-parts/displacement'))
  assert.ok(catalogue.entries.some(e=>e.id==='simulation-pointer-groups/apply'))
  assert.ok(!catalogue.entries.some(e=>['createTimeline','createFaceState','startStudio'].includes(e.name)))
})
test('all API examples compile against the actual public TypeScript contracts',()=>{
  const rootFunctions=catalogue.entries.filter(e=>e.module==='@yuragi/rig'&&!e.owner).map(e=>e.name)
  const virtual=new Map<string,string>()
  for(const entry of catalogue.entries){
    const file=resolve(root,'apps/site/test/api-virtual-'+entry.id.replaceAll('/','-')+'.tsx')
    if(entry.group==='react'&&entry.name!=='getPlayer'){virtual.set(file,entry.example);continue}
    if(entry.group==='vue'&&entry.name!=='getPlayer'){
      const {descriptor}=parse(entry.example)
      assert.equal(descriptor.template?.content.includes(':model="model"'),true)
      const script=compileScript(descriptor,{id:entry.id}).content
      virtual.set(file,script);continue
    }
    const layered=entry.group.startsWith('layered')||entry.id.includes('layered-character')
    const modelDecl=/\bconst model\b/.test(entry.example)?'':'declare const model: RigModel;'
    const playerDecl=/\bconst player\b/.test(entry.example)?'':`declare const player: ${layered?'LayeredPlayer':'RigPlayer'};`
    const simulationDecl=entry.owner?.includes('imulation')?`declare const simulation: ReturnType<typeof ${layered?'createLayeredSimulation':'createSimulation'}>;`:''
    const meshDecl=entry.owner==='simulation'&&entry.name!=='buildContinuousMesh'?'declare const mesh: RigMesh;':''
    virtual.set(file,`import { ${rootFunctions.join(', ')} } from '@yuragi/rig';\nimport { createMireaModel } from '@yuragi/rig/mirea';\nimport type { RigModel, LayeredModel, RigPlayer, LayeredPlayer, RigMesh, AnimationClip } from '@yuragi/rig';\ndeclare const canvas: HTMLCanvasElement; declare const signal: AbortSignal; declare const serialized: string; declare const layeredModel: LayeredModel; declare const clip: AnimationClip; ${modelDecl} ${playerDecl} ${simulationDecl} ${meshDecl} declare const handle: { getPlayer(): ${layered?'LayeredPlayer':'RigPlayer'} | undefined };\n${entry.example}\nexport {};`)
  }
  const options:ts.CompilerOptions={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,strict:true,skipLibCheck:true,noEmit:true,baseUrl:root,paths:{'@yuragi/rig':['packages/rig/src/index.ts'],'@yuragi/rig/mirea':['packages/rig/src/mirea.ts'],'@yuragi/rig/react':['packages/rig/src/react.tsx'],'@yuragi/rig/vue':['packages/rig/src/vue.ts']}}
  const host=ts.createCompilerHost(options),read=host.readFile,fileExists=host.fileExists
  host.readFile=path=>virtual.get(path)??read(path);host.fileExists=path=>virtual.has(path)||fileExists(path)
  const program=ts.createProgram([...virtual.keys()],options,host)
  const errors=ts.getPreEmitDiagnostics(program)
  assert.equal(errors.length,0,ts.formatDiagnosticsWithColorAndContext(errors,{getCanonicalFileName:p=>p,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}))
})
