import { createTestModel } from './fixtures/model.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import {  createSimulation, validateModel } from '../src/index.js'

test('bounded tracking has matching elapsed-time response at 30, 60 and 120 Hz', () => {
  const endpoints = [30,60,120].map(hz => {
    const model = createTestModel()
    model.tracking = {response:.065,damping:.7,maxVelocity:3,bodyFollow:0,translation:[.045,.027]}
    const sim = createSimulation(model)
    for (let frame=0;frame<hz*2;frame++) {
      sim.setPointer(frame < hz ? .5 : -.5, frame < hz ? -.5 : .5)
      sim.updatePins(frame*1000/hz,1000/hz)
      assert.ok(Math.abs(sim.parameters.lookX)<=30 && Math.abs(sim.velocity.lookX)<=3)
    }
    return {...sim.parameters}
  })
  assert.deepEqual(endpoints[0],endpoints[1])
  assert.deepEqual(endpoints[1],endpoints[2])
})

test('live tracking edits copy inputs, retarget a stationary pointer and reject invalid patches atomically', () => {
  const sim = createSimulation(createTestModel())
  sim.setPointer(.5,.5)
  const translation: [number,number] = [.045,.027]
  sim.setTracking({translation,bodyFollow:0,response:.065,damping:.7,maxVelocity:3})
  translation[0] = .9
  assert.equal(sim.model.tracking!.translation![0],.045)
  sim.setMotion({follow:0})
  for (let frame=0;frame<600;frame++)sim.updatePins(frame*16.67,16.67)
  assert.ok(Math.abs(sim.parameters.lookX)<1e-8)
  assert.equal(sim.parameters.bodyX,0)
  sim.setMotion({follow:1})
  for(let frame=0;frame<60;frame++)sim.updatePins(frame*16.67,16.67)
  assert.ok(sim.parameters.lookX>29)
  const before=structuredClone(sim.model),velocity={...sim.velocity}
  assert.throws(()=>sim.setTracking({translation:[.081,0]}))
  assert.deepEqual(sim.model,before);assert.deepEqual(sim.velocity,velocity)
})

test('whole-artwork following preserves every guarded vertex offset and reduced-motion artwork', () => {
  const model = createTestModel()
  model.tracking = { response: .065, damping: .7, maxVelocity: 3, bodyFollow: 0 }
  const still = createSimulation(model)
  const floating = createSimulation({ ...model, tracking: { ...model.tracking, translation: [.028, .016] } })
  const a = still.buildContinuousMesh(undefined, 20, 30), b = floating.buildContinuousMesh(undefined, 20, 30)
  for (let frame = 0; frame < 240; frame++) {
    const pointer = frame < 120 ? .5 : -.5, time = frame * 16.67, dt = frame % 40 ? 16.67 : 50
    for (const sim of [still, floating]) { sim.setPointer(pointer, -pointer); sim.updatePins(time, dt) }
    assert.deepEqual(floating.updateVertices(b, time), still.updateVertices(a, time))
    const dx = floating.parameters.lookX / 30 * .028, dy = floating.parameters.lookY / 30 * .016
    for (let i = 0; i < a.positions.length; i += 2) {
      assert.ok(Math.abs(b.positions[i] - a.positions[i] - dx) < 1e-7)
      assert.ok(Math.abs(b.positions[i + 1] - a.positions[i + 1] - dy) < 1e-7)
    }
    if (frame === 39) assert.ok(floating.parameters.lookX > 29, 'follow reaches the pointer within about 650ms')
    assert.equal(floating.parameters.bodyX, 0)
  }
  floating.updateVertices(b, 5000, true); assert.deepEqual(b.positions, b.rest)
  for (const translation of [[.081, 0], [-.01, 0], [NaN, 0], [0]])
    assert.throws(() => validateModel({ ...model, tracking: { ...model.tracking, translation } }))
})

test('vertical part following is opt-in, delayed, bounded, and settles after a pointer impulse', () => {
  const model = createTestModel()
  model.parts = [{ id: 'ribbon', kind: 'ribbon', polygon: [[.1,.4],[.3,.4],[.3,.8],[.1,.8]],
    root: [.2,.4], tip: [.2,.8], feather: .02, rotation: .05, stiffness: .013, damping: .96,
    phase: 0, wind: 0, follow: 0, followY: .65 }]
  const flow = createSimulation(model).parts
  flow.update(0, 16.67, 0, 0, 0, 2.4)
  const first = flow.states[0].rotation
  assert.ok(first < 0 && Math.abs(first) < .005, 'no snap on pointer movement')
  for (let frame = 1; frame < 18; frame++) flow.update(frame * 16.67, 16.67, 0, 0, 0, 2.4)
  assert.ok(Math.abs(flow.states[0].rotation) > Math.abs(first) * 5, 'visible delayed follow-through')
  for (let frame = 18; frame < 900; frame++) {
    flow.update(frame * 16.67, frame % 35 ? 16.67 : 1000, 0, 0, 0, 0)
    assert.ok(Math.abs(flow.states[0].rotation) <= .05)
  }
  assert.ok(Math.abs(flow.states[0].rotation) < 1e-7)
  delete model.parts[0].followY
  const legacy = createSimulation(model).parts
  legacy.update(0, 16.67, 0, 0, 30, 2.4); assert.equal(legacy.states[0].rotation, 0)
  assert.throws(() => validateModel({ ...model, parts: [{ ...model.parts![0], followY: 3 }] }))
})
