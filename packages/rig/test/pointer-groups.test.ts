import { createTestModel } from './fixtures/model.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import {  createSimulation, validateModel } from '../src/index.js'
import { createPointerGroups } from '../src/pointer-groups.js'
import type { RigModel } from '../src/index.js'

function grouped(): RigModel {
  const model = createTestModel()
  model.pointerGroups = [
    { id: 'upper', pivot: [.5,.4], regions: [{ polygon: [[.1,.1],[.9,.1],[.9,.5],[.1,.5]], feather: .1 }], translation: [.01,.006], rotation: .02, response: 100 },
    { id: 'pelvis', pivot: [.5,.6], regions: [{ polygon: [[.3,.5],[.7,.5],[.7,.95],[.3,.95]], feather: .1 }], translation: [.005,.003], rotation: .01, response: 240 },
  ]
  return model
}

test('shared group transforms have consistent timing, slower pelvis response and rigid fractional gains', () => {
  const model = grouped()
  const results = [30,60,120].map(hz => {
    const groups = createPointerGroups(model)
    for (let f=0;f<hz;f++) groups.update(1000/hz,30,-30)
    return groups.states.map(s => [s.x,s.y])
  })
  for (const r of results.slice(1)) for (let i=0;i<r.length;i++) for(let j=0;j<2;j++) assert.ok(Math.abs(r[i][j]-results[0][i][j])<1e-12)
  const groups = createPointerGroups(model)
  groups.update(16.67,30,0)
  assert.ok(groups.states[0].x>groups.states[1].x*2,'upper body responds before pelvis')
  const rest = new Float32Array([.4,.2,.6,.3,.4,.7,.6,.8]), binding=groups.bind(rest)
  for (const gain of [0,.5,1]) {
    model.motion.layers=gain
    groups.update(50,30,-30)
    const p=Array.from({length:4},(_,i)=>groups.apply(binding,i,rest[i*2],rest[i*2+1]))
    for (const [a,b] of [[0,1],[2,3]]) {
      const before=Math.hypot(rest[a*2]-rest[b*2],(rest[a*2+1]-rest[b*2+1])*1.5)
      const after=Math.hypot(p[a].x-p[b].x,(p[a].y-p[b].y)*1.5)
      assert.ok(Math.abs(before-after)<1e-12,'gain changes angle/translation without shrinking the rigid group')
    }
    if(gain===0)for(let i=0;i<4;i++)assert.deepEqual(p[i],{x:rest[i*2],y:rest[i*2+1]})
  }
  groups.reset();assert.ok(groups.states.every(s=>s.x===0&&s.y===0&&s.rotation===0))
})

test('pointer-group input is validated before allocation and motion patches reject atomically', () => {
  const model=grouped(), g=model.pointerGroups![0]
  for(const patch of [{response:0},{rotation:Infinity},{translation:[.04,0]},{regions:[]},{pivot:[NaN,0]}])
    assert.throws(()=>validateModel({...model,pointerGroups:[{...g,...patch}]}))
  assert.throws(()=>validateModel({...model,pointerGroups:[g,g]}))
  const sim=createSimulation(model),before=structuredClone(sim.model)
  assert.throws(()=>sim.setMotion({layers:1.1}));assert.deepEqual(sim.model,before)
  assert.equal(createTestModel().pointerGroups,undefined)
})
