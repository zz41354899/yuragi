import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createSimulation, type RigModel } from '../src/index.js'
import { createMireaModel } from '../src/mirea.js'

interface FlowBaseline {
  profile: {
    motion: RigModel['motion']; tracking: RigModel['tracking']
    groups: { id: string; response: number }[]
    parts: { id: string; rotation: number; stiffness: number; damping: number; follow: number }[]
  }
  frames: { frame: number; look: number; positions: number[]; parts: number[] }[]
}
const baseline = JSON.parse(readFileSync(new URL('./fixtures/mirea-flow-baseline.json', import.meta.url), 'utf8')) as Record<'before' | 'after', FlowBaseline>

test('Mirea flow preserves both the previous and tuned numerical deformation baselines', () => {
  for (const name of ['before', 'after'] as const) {
    const model = createMireaModel(), golden = baseline[name]
    if (name === 'before') {
      model.motion = golden.profile.motion; model.tracking = golden.profile.tracking
      for (const group of model.pointerGroups!) Object.assign(group, golden.profile.groups.find(p => p.id === group.id))
      for (const part of model.parts!) Object.assign(part, golden.profile.parts.find(p => p.id === part.id))
    }
    const sim = createSimulation(model), mesh = sim.buildContinuousMesh()
    for (let frame = 1; frame <= 600; frame++) {
      if (frame === 61) sim.setPointer(.5, -.5)
      if (frame === 121) sim.setPointer(-.5, .5)
      if (frame === 181) sim.setPointer(0, 0)
      sim.updatePins(frame * 1000 / 60, 1000 / 60)
      const report = sim.updateVertices(mesh, frame * 1000 / 60)
      assert.equal(report.motionScale, 1, `${name}: no fold-limiter suppression at frame ${frame}`)
      const expected = golden.frames.find(f => f.frame === frame)
      if (!expected) continue
      assert.ok(Math.abs(sim.parameters.lookX - expected.look) < 1e-8)
      const positions = Array.from(mesh.positions).filter((_, i) => i % 509 === 0)
      assert.equal(positions.length, expected.positions.length)
      positions.forEach((value, i) => assert.ok(Math.abs(value - expected.positions[i]) < 1e-6, `${name}: frame ${frame}, vertex sample ${i}`))
      sim.parts.states.forEach((state, i) => assert.ok(Math.abs(state.rotation - expected.parts[i]) < 1e-8))
    }
    sim.updateVertices(mesh, 10000, true)
    assert.deepEqual(mesh.positions, mesh.rest, 'reduced motion retains the exact source artwork')
  }
  const at = (name: 'before' | 'after', frame: number) => baseline[name].frames.find(f => f.frame === frame)!.look
  assert.ok(at('after', 61) < at('before', 61) * .5, 'gentler initial acceleration')
  assert.ok(at('after', 78) > 25, 'tracking still responds within 300 ms')
  assert.ok(Math.abs(at('after', 198)) > 2, 'a short continuation after pointer release')
  assert.ok(Math.abs(at('after', 240)) < .1, 'return settles within one second')
})

test('tuned Mirea tracking has the same timing at 30, 60 and 120 Hz', () => {
  const endpoints = [30, 60, 120].map(hz => {
    const sim = createSimulation(createMireaModel())
    for (let frame = 0; frame < hz * 2; frame++) {
      sim.setPointer(frame < hz ? .5 : -.5, frame < hz ? -.5 : .5)
      sim.updatePins(frame * 1000 / hz, 1000 / hz)
      assert.ok(Math.abs(sim.parameters.lookX) <= 30)
    }
    return { ...sim.parameters }
  })
  assert.deepEqual(endpoints[0], endpoints[1]); assert.deepEqual(endpoints[1], endpoints[2])
})
