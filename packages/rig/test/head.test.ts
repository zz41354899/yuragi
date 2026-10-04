import { createTestModel } from './fixtures/model.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import {  createSimulation, validateModel } from '../src/index.js'
import { bindHead } from '../src/head.js'

function fixture() {
  const model = createTestModel()
  model.hair = []; model.accessories = []
  model.pins = model.pins.map(p => ({ ...p, wind: 0, type: 'fixed' }))
  Object.assign(model.pins.find(p => p.name === 'head-root')!, {x:.5,y:.3})
  model.motion = { sway: 0, speed: 1, hair: 0, accessories: 0, follow: 1 }
  model.tracking = { response: .024, damping: .65, maxVelocity: 1.8, bodyFollow: 0 }
  model.pose.headFollow = {rotation:.024,translation:[.003,.003],
    region:[[.3,.1],[.65,.1],[.65,.3],[.3,.3]],feather:.07,
    neck:{polygon:[[.47,.28],[.53,.28],[.53,.4],[.47,.4]],base:[.5,.4],feather:.07}}
  return model
}
test('owned head keeps pixel distances through pointer reversals without dragging the lower body', () => {
  const model=fixture(), sim=createSimulation(model), still=createSimulation(model)
  const mesh=sim.buildContinuousMesh(undefined,40,60), rest=still.buildContinuousMesh(undefined,40,60)
  const vertices:number[]=[]
  for(let i=0;i<mesh.rest.length;i+=2) if(mesh.rest[i]>.35&&mesh.rest[i]<.6&&mesh.rest[i+1]>.14&&mesh.rest[i+1]<.24)vertices.push(i)
  const distance=(data:Float32Array,a:number,b:number)=>Math.hypot(data[b]-data[a],1.5*(data[b+1]-data[a+1]))
  for(let f=0;f<360;f++) {
    const time=f*16.67,dt=f%90===0?50:16.67
    sim.setPointer(f%120<60?.5:-.5,f%180<90?.5:-.5)
    sim.updatePins(time,dt);still.updatePins(time,dt)
    assert.equal(sim.parameters.bodyX,0)
    assert.equal(sim.updateVertices(mesh,time).motionScale,1);still.updateVertices(rest,time)
    for(const b of vertices.slice(1))assert.ok(Math.abs(distance(mesh.positions,vertices[0],b)-distance(mesh.rest,vertices[0],b))<3e-7)
    for(let i=0;i<mesh.rest.length;i+=2)if(mesh.rest[i+1]>.6) {
      assert.equal(mesh.positions[i],rest.positions[i]);assert.equal(mesh.positions[i+1],rest.positions[i+1])
    }
  }
  sim.updateVertices(mesh,6000,true);assert.deepEqual(mesh.positions,mesh.rest)
})
test('neck endpoints blend body to head and props retain ownership inside a head overlap', () => {
  const model=fixture()
  const sample=new Float32Array([.5,.3,.5,.4,.5,.35,.4,.2])
  const binding=bindHead(model,sample)!
  assert.ok(binding.neckProgress[0]>.99999);assert.ok(binding.neckProgress[1]<.00001)
  assert.ok(Math.abs(binding.neckProgress[2]-.5)<.00001)
  model.surfaceRegions=[{id:'prop',mode:'rigid',polygon:[[.38,.18],[.42,.18],[.42,.22],[.38,.22]],feather:.05}]
  assert.equal(bindHead(model,sample)!.head[3],0)
  for(const patch of [{feather:0},{region:undefined},{neck:{...model.pose.headFollow!.neck!,base:[.5,.3]}}])
    assert.throws(()=>validateModel({...model,pose:{...model.pose,headFollow:{...model.pose.headFollow,...patch}}}))
  assert.throws(()=>validateModel({...model,tracking:{...model.tracking!,bodyFollow:2}}))
})
