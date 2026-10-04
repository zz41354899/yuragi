import { createTestModel } from './fixtures/model.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import {  createSimulation, validateModel } from '../src/index.js'
import type { DeformationPart } from '../src/types.js'

const part: DeformationPart = {
  id: 'cloth-left', kind: 'cloth', polygon: [[.06,.4],[.4,.4],[.4,.9],[.06,.9]],
  root: [.23,.4], tip: [.23,.85], feather: .03, rotation: .06,
  stiffness: .04, damping: .93, phase: 1, wind: 1, follow: 1,
}
test('part masks protect face and unrelated source pixels; overlap is normalized', () => {
  const model = createTestModel(); model.parts = [part, { ...part, id: 'overlap' }]
  const sim = createSimulation(model)
  const binding = sim.parts.bind(new Float32Array([.23,.8, .8,.8, .23,.4, .5,.2]))
  const sum = (v: number) => Array.from(binding.weights.slice(binding.offsets[v], binding.offsets[v+1])).reduce((a,b)=>a+b,0)
  assert.ok(Math.abs(sum(0)-1)<1e-6)
  for (const v of [1,2,3]) assert.equal(sum(v),0)
  for (let frame=0;frame<180;frame++) sim.updatePins(frame*16.67,16.67)
  assert.ok(Math.abs(sim.parts.displacement(binding,0,.23,.8).x)>.001)
  assert.deepEqual(sim.parts.displacement(binding,1,.8,.8),{x:0,y:0})
  sim.setMotion({parts:0}); assert.deepEqual(sim.parts.displacement(binding,0,.23,.8),{x:0,y:0})
  sim.reset(); assert.ok(sim.parts.states.every(p=>p.rotation===0&&p.velocity===0))
})

test('explicit exclusions keep skin and held items outside flexible part binding', () => {
  const model=createTestModel();model.parts=[{...part,exclusions:[[[.15,.65],[.3,.65],[.3,.85],[.15,.85]]]}]
  const sim=createSimulation(model), binding=sim.parts.bind(new Float32Array([.23,.75,.23,.55]))
  assert.equal(binding.offsets[1],0)
  assert.ok(binding.offsets[2]>0)
  assert.throws(()=>validateModel({...model,parts:[{...part,exclusions:[[[0,0],[1,1],[0,1],[1,0]]]}]}))
})

test('part springs stay bounded through reversal and stalls; reduced motion restores original geometry', () => {
  const model=createTestModel(); model.parts=[part]; model.pose.headFollow={rotation:.1,translation:[.01,.006]}
  const sim=createSimulation(model), mesh=sim.buildContinuousMesh()
  for(let frame=0;frame<360;frame++) {
    sim.setPointer(frame%60<30?.5:-.5,.5); sim.updatePins(frame*16.67,frame%37===0?1000:16.67)
    const d=sim.updateVertices(mesh,frame*16.67)
    assert.ok(mesh.positions.every(Number.isFinite));assert.ok(d.maxDisplacementGradient<=.650001)
    assert.ok(Math.abs(sim.parts.states[0].rotation)<=part.rotation)
  }
  sim.updateVertices(mesh,6000,true);assert.deepEqual(mesh.positions,mesh.rest)
  assert.equal(model.pose.headFollow.rotation,.1)
})

test('malformed part geometry and head profiles are rejected before simulation', () => {
  const model=createTestModel(); model.parts=[part]
  for(const bad of [
    {polygon:[[0,0],[1,1],[0,1],[1,0]]}, {polygon:[[0,0],[.5,.5],[1,1]]},
    {polygon:[[0,0],[0,0],[1,1]]}, {root:part.tip}, {rotation:Infinity}, {feather:0},
  ]) assert.throws(()=>validateModel({...model,parts:[{...part,...bad}]}))
  assert.throws(()=>validateModel({...model,parts:[part,part]}),/unique/)
  assert.throws(()=>validateModel({...model,motion:{...model.motion,parts:NaN}}))
  assert.throws(()=>validateModel({...model,pose:{...model.pose,headFollow:{rotation:.4,translation:[0,0]}}}))
})
