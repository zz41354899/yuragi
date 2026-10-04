import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { createLayeredSimulation, validateLayeredModel, createLayeredPlayer } from '../src/index.js'
import { layeredModel } from './fixtures/layered.js'

test('v2 rejects v1 extracts, missing coverage, invalid topology, atlases, cycles, bindings and seams',()=>{
  validateLayeredModel(layeredModel())
  const edits: ((m:ReturnType<typeof layeredModel>)=>void)[] = [
    m=>{m.version=1 as 2},m=>{m.nodes[0].parent='tip'},m=>{m.atlases[0].width=1},
    m=>{m.attachments[0].coverage=undefined as never},m=>{m.nodes[0].rotation=Infinity},
    m=>{m.attachments[0].vertices[0].weights[0].weight=.8},m=>{m.attachments[0].triangles=[0,1,1]},
    m=>{m.attachments[0].vertices[1].weights=[{node:'tip',weight:1}]},m=>{m.attachments[0].vertices[1].position=[.6,.5]},
    m=>{m.attachments[0].mask=[200,200,100,100]},m=>{m.nodes[1].id='root'},
  ]
  for(const edit of edits){const m=layeredModel();edit(m);assert.throws(()=>validateLayeredModel(m))}
  for(const value of [null,{},[],{version:2,renderer:'layered'}])assert.throws(()=>validateLayeredModel(value))
})

test('neutral and reduced frames reproduce rest exactly; joins stay coincident at all pointer extremes',()=>{
  const model=layeredModel(),sim=createLayeredSimulation(model)
  model.nodes[0].rotation=3
  assert.equal(sim.model.nodes[0].rotation,.4)
  assert.deepEqual(sim.mesh.positions,sim.mesh.rest)
  const buffers=sim.mesh.positions
  for(const x of [-.5,0,.5])for(const y of [-.5,0,.5]){
    sim.setPointer(x,y)
    for(let frame=1;frame<300;frame++)sim.update(frame*16.67,16.67)
    assert.equal(sim.mesh.positions[2],sim.mesh.positions[6]);assert.equal(sim.mesh.positions[3],sim.mesh.positions[7])
    // Both root-bound vertices are on the same rigid object; aspect-correct distance is unchanged.
    const distance=Math.hypot(sim.mesh.positions[0]-sim.mesh.positions[2],(sim.mesh.positions[1]-sim.mesh.positions[3])*2)
    assert.ok(Math.abs(distance-.4)<1e-6)
    assert.ok(Math.abs(sim.rotations[1])<=.08)
  }
  assert.equal(sim.mesh.positions,buffers)
  sim.update(5000,16.67,true);assert.deepEqual(sim.mesh.positions,sim.mesh.rest)
  sim.reset();sim.update(0,0);assert.deepEqual(sim.mesh.positions,sim.mesh.rest)
  assert.equal(sim.update(0,0),false)
  assert.throws(()=>sim.setPointer(Infinity,0));assert.throws(()=>sim.update(NaN,1))
})

test('batching preserves draw order and splits opacity, mask and atlas changes',()=>{
  const m=layeredModel()
  assert.equal(createLayeredSimulation(m).batches.length,1)
  m.attachments[1].opacity=.5;assert.equal(createLayeredSimulation(m).batches.length,2)
  m.attachments[1].opacity=1;m.attachments[1].mask=[2,2,100,200]
  const sim=createLayeredSimulation(m);assert.deepEqual(sim.batches.map(b=>[b.start,b.count,b.mask]),[[0,3,false],[3,3,true]])
  assert.deepEqual([...sim.mesh.indices],[0,1,2,3,4,5])
})

function environment(reduced=false,failImage=false,failShader=false){
 const saved=new Map<string,PropertyDescriptor|undefined>(),listeners=new Map<string,Set<EventListener>>(),frames=new Map<number,FrameRequestCallback>()
 let created=0,deleted=0,id=0,disconnected=0,uploads=0;const draws:{count:number;offset:number}[]=[];const uniforms:number[]=[]
 const add=(name:string,fn:EventListener)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(fn)},remove=(name:string,fn:EventListener)=>listeners.get(name)?.delete(fn)
 const media={matches:reduced,addEventListener:add,removeEventListener:remove}
 const gl:any={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,ELEMENT_ARRAY_BUFFER:6,DYNAMIC_DRAW:7,STATIC_DRAW:8,TEXTURE_2D:9,UNPACK_PREMULTIPLY_ALPHA_WEBGL:10,TEXTURE_WRAP_S:11,TEXTURE_WRAP_T:12,CLAMP_TO_EDGE:13,TEXTURE_MIN_FILTER:14,TEXTURE_MAG_FILTER:15,LINEAR:16,RGBA:17,UNSIGNED_BYTE:18,BLEND:19,ONE:20,ONE_MINUS_SRC_ALPHA:21,COLOR_BUFFER_BIT:22,FLOAT:23,TRIANGLES:24,UNSIGNED_SHORT:25,MAX_TEXTURE_SIZE:26,
 createShader:()=>{created++;return {}},createProgram:()=>{created++;return {}},createBuffer:()=>{created++;return {}},createTexture:()=>{created++;return {}},deleteShader:()=>deleted++,deleteProgram:()=>deleted++,deleteBuffer:()=>deleted++,deleteTexture:()=>deleted++,getShaderParameter:()=>!failShader,getShaderInfoLog:()=> 'compile failed',getProgramParameter:()=>true,getAttribLocation:()=>0,getUniformLocation:()=>({}),getParameter:()=>4096,isContextLost:()=>false,bufferSubData:()=>uploads++,drawElements:(_mode:number,count:number,_type:number,offset:number)=>draws.push({count,offset}),uniform1f:(_location:unknown,value:number)=>uniforms.push(value)}
 for(const name of ['shaderSource','compileShader','attachShader','linkProgram','useProgram','uniform1i','enable','blendFunc','bindBuffer','bufferData','bindTexture','pixelStorei','texParameteri','texImage2D','viewport','clearColor','clear','enableVertexAttribArray','vertexAttribPointer'])gl[name]=()=>{}
 const canvas={width:0,height:0,clientWidth:100,clientHeight:200,getContext:()=>gl,addEventListener:add,removeEventListener:remove} as unknown as HTMLCanvasElement
 class Observer{observe(){}disconnect(){disconnected++}}
 class MockImage{naturalWidth=256;naturalHeight=256;onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(value:string){if(value)queueMicrotask(()=>failImage?this.onerror?.():this.onload?.())}}
 const install=(name:string,value:unknown)=>{saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value})}
 install('window',{matchMedia:()=>media,devicePixelRatio:1});install('document',{hidden:false,addEventListener:add,removeEventListener:remove});install('Image',MockImage);install('ResizeObserver',Observer);install('IntersectionObserver',Observer);install('requestAnimationFrame',(fn:FrameRequestCallback)=>{frames.set(++id,fn);return id});install('cancelAnimationFrame',(id:number)=>frames.delete(id))
 return {canvas,draws,uniforms,stats:()=>({created,deleted,disconnected,uploads,frames:frames.size,listeners:[...listeners.values()].reduce((s,l)=>s+l.size,0)}),step(time:number){const entries=[...frames];frames.clear();entries.forEach(([,fn])=>fn(time))},motion(value:boolean){media.matches=value;listeners.get('change')?.forEach(fn=>fn(new Event('change')))},restore(){for(const [key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else Reflect.deleteProperty(globalThis,key)}}}
}

test('renderer draws real batches, uploads paused edits, throttles snapshots and cleans aborts',async()=>{
 const env=environment();try{
  const controller=new AbortController(),m=layeredModel();m.attachments[1].mask=[2,2,100,200];m.attachments[1].opacity=.5
  let reports=0;const player=await createLayeredPlayer({canvas:env.canvas,model:m,signal:controller.signal,onFrame:()=>reports++})
  assert.deepEqual(env.draws.slice(0,2),[{count:3,offset:0},{count:3,offset:6}]);assert.deepEqual(env.uniforms.slice(0,4),[0,1,1,.5])
  for(let i=1;i<=60;i++)env.step(i*16.67)
  assert.ok(reports<15);assert.equal(env.stats().frames,1)
  player.pause();const uploads=env.stats().uploads;player.setPointer(.5,.5);assert.ok(env.stats().uploads>uploads)
  assert.notDeepEqual(player.getMeshSnapshot().positions,player.getMeshSnapshot().rest)
  const exported=player.getModel();exported.nodes[0].rotation=3;assert.equal(player.getModel().nodes[0].rotation,.4)
  env.motion(true);assert.deepEqual(player.getMeshSnapshot().positions,player.getMeshSnapshot().rest);assert.equal(player.getSnapshot().playing,false)
  env.motion(false);assert.equal(player.getSnapshot().playing,true)
  controller.abort();player.destroy();assert.equal(env.stats().created,env.stats().deleted);assert.equal(env.stats().frames,0);assert.equal(env.stats().listeners,0);assert.equal(env.stats().disconnected,2)
 }finally{env.restore()}
})

test('static reduced player, cancelled loads and renderer initialization failure release resources',async()=>{
 for(const [reduced,failImage,failShader]of [[true,false,false],[false,true,false],[false,false,true]]){
  const env=environment(reduced,failImage,failShader);try{
   const controller=new AbortController();controller.abort()
   await assert.rejects(createLayeredPlayer({canvas:env.canvas,model:layeredModel(),signal:controller.signal}),{name:'AbortError'})
   if(failImage||failShader)await assert.rejects(createLayeredPlayer({canvas:env.canvas,model:layeredModel()}))
   else{const player=await createLayeredPlayer({canvas:env.canvas,model:layeredModel()});player.setPointer(.5,.5);assert.deepEqual(player.getMeshSnapshot().positions,player.getMeshSnapshot().rest);assert.equal(env.stats().frames,0);player.destroy()}
   assert.equal(env.stats().created,env.stats().deleted);assert.equal(env.stats().listeners,0)
  }finally{env.restore()}
 }
})

test('Mirea prototype validates and measures actual sparse CPU updates with no seam substitution',()=>{
 const model=JSON.parse(readFileSync(new URL('../../../artifacts/layered-engine/mirea/model.json',import.meta.url),'utf8'))
 const sim=createLayeredSimulation(model);sim.setPointer(.5,-.5)
 const samples:number[]=[]
 for(let run=0;run<3;run++){const start=performance.now();for(let i=0;i<1000;i++)sim.update(i*16.67,16.67);samples.push((performance.now()-start)/1000)}
 assert.deepEqual(sim.batches.map(b=>b.count),[sim.mesh.indices.length]);assert.ok(samples.every(Number.isFinite))
 sim.reset();sim.update(0,0);assert.deepEqual(sim.mesh.positions,sim.mesh.rest)
})

test('hierarchical pointer transforms settle equally at 30, 60 and 120Hz and seam bindings are canonical',()=>{
  const samples = [30,60,120].map(fps=>{
    const sim=createLayeredSimulation(layeredModel());sim.setPointer(.5,-.5)
    for(let i=1;i<=fps;i++)sim.update(i*1000/fps,1000/fps)
    return sim.matrices.slice(0,6)
  })
  for(const sample of samples)for(let i=0;i<6;i++)assert.ok(Math.abs(sample[i]-samples[0][i])<1e-10)
  const model=layeredModel()
  model.joints[0].weights=[{node:'root',weight:.4},{node:'tip',weight:.6}]
  model.attachments[0].vertices[1].weights=model.joints[0].weights
  model.attachments[1].vertices[0].weights=[...model.joints[0].weights].reverse()
  const sim=createLayeredSimulation(model);sim.setPointer(.5,.5);sim.update(1000,50)
  assert.equal(sim.mesh.positions[2],sim.mesh.positions[6]);assert.equal(sim.mesh.positions[3],sim.mesh.positions[7])
})
