import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createSimulation, createMomoModel, validateModel, toCanvas } from '../src/index.js'
const baseline = JSON.parse(readFileSync(new URL('./baseline.json', import.meta.url), 'utf8')) as { frame: number; diagnostics: { motionScale: number }; positions: number[]; parameters: Record<string, number> }[]

test('extracted default preserves original Momo deformation under pointer reversal and wave', () => {
  const rig = createSimulation(createMomoModel())
  const mesh = rig.buildContinuousMesh()
  for (let frame = 1; frame <= 180; frame++) {
    if (frame === 30) rig.setPointer(.3, -.2)
    if (frame === 60) rig.wave(frame * 1000 / 60)
    if (frame === 120) rig.setPointer(-.4, .25)
    rig.updatePins(frame * 1000 / 60, 1000 / 60)
    const diagnostics = rig.updateVertices(mesh, frame * 1000 / 60)
    const golden = baseline.find(b => b.frame === frame)
    if (!golden) continue
    const sampled = Array.from(mesh.positions).filter((_, i) => i % 149 === 0)
    assert.equal(sampled.length, golden.positions.length)
    sampled.forEach((value, index) => assert.ok(Math.abs(value - golden.positions[index]) < 1e-6, 'original artwork drift at frame ' + frame + ', sample ' + index))
    assert.ok(Math.abs(diagnostics.motionScale - golden.diagnostics.motionScale) < 1e-8)
  }
})

test('idle remains visible and its triangles preserve orientation', () => {
  const rig = createSimulation(createMomoModel())
  const mesh = rig.buildContinuousMesh()
  let minimum = Infinity, left = Infinity, right = -Infinity
  for (let frame = 1; frame <= 720; frame++) {
    rig.updatePins(frame * 1000 / 60, 1000 / 60)
    const report = rig.updateVertices(mesh, frame * 1000 / 60)
    assert.equal(report.motionScale, 1)
    const head = (18 * 65 + 33) * 2
    left = Math.min(left, mesh.positions[head]); right = Math.max(right, mesh.positions[head])
    assert.ok(mesh.positions.every(v => toCanvas(v) >= 0 && toCanvas(v) <= 1))
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const a = mesh.indices[i] * 2, b = mesh.indices[i + 1] * 2, c = mesh.indices[i + 2] * 2
      const area = (v: Float32Array) => (v[b] - v[a]) * (v[c + 1] - v[a + 1]) - (v[b + 1] - v[a + 1]) * (v[c] - v[a])
      minimum = Math.min(minimum, area(mesh.positions) / area(mesh.rest))
    }
  }
  assert.ok((right - left) * 1024 > 80)
  assert.ok(minimum > .5)
})

test('models and simulations have isolated mutable state', () => {
  const original = createMomoModel()
  const first = createSimulation(original), second = createSimulation(original)
  first.setPin('head-root', { x: .6, stiffness: .09 })
  first.setMotion({ sway: 1.5 })
  assert.equal(original.pins.find(p => p.name === 'head-root')!.x, .52)
  assert.equal(second.pins.find(p => p.name === 'head-root')!.x, .52)
  assert.equal(second.model.motion.sway, 1)
  const clone: unknown = JSON.parse(JSON.stringify(first.model))
  validateModel(clone)
  assert.equal(clone.motion.sway, 1.5)
})

test('turning off local motion removes hair and accessory displacement', () => {
  const model = createMomoModel()
  model.motion = { sway: 0, speed: 1, hair: 0, accessories: 0, follow: 1 }
  const rig = createSimulation(model), mesh = rig.buildContinuousMesh()
  for (let i = 0; i < 120; i++) rig.updatePins(i * 16.67, 16.67)
  for (const vertex of [20, 500, 2000]) {
    assert.deepEqual(rig.hair.displacement(mesh.hairBinding, vertex), { x: 0, y: 0 })
    const x = mesh.rest[vertex * 2], y = mesh.rest[vertex * 2 + 1]
    assert.deepEqual(rig.accessories.displacement(mesh.accessoryBinding, vertex, x, y), { x: 0, y: 0 })
  }
})

test('edited geometry changes skinning while remaining finite at maximum settings', () => {
  const rig = createSimulation(createMomoModel())
  rig.setPin('head-root', { x: .58, radius: .12 })
  rig.setMotion({ sway: 2, speed: 2, hair: 2, accessories: 2, follow: 2 })
  const mesh = rig.buildContinuousMesh()
  for (let i = 1; i <= 240; i++) {
    rig.setPointer(Math.sin(i / 5), Math.cos(i / 7))
    rig.updatePins(i * 1000 / 60, 1000 / 60)
    const report = rig.updateVertices(mesh, i * 1000 / 60)
    assert.ok(mesh.positions.every(Number.isFinite))
    assert.ok(report.maxDisplacementGradient <= .650001)
  }
})

test('invalid input is rejected before changing live settings', () => {
  const rig = createSimulation(createMomoModel())
  assert.throws(() => rig.setMotion({ speed: 0 }))
  assert.throws(() => rig.setPin('head-root', { x: Infinity }))
  assert.equal(rig.model.motion.speed, 1)
  assert.equal(rig.model.pins.find(p => p.name === 'head-root')!.x, .52)
  const model = createMomoModel()
  model.pins[0].parent = 'head-root'
  assert.throws(() => validateModel(model), /cyclic/)
  const wrong = createMomoModel()
  wrong.mesh.rows = 1.5
  assert.throws(() => validateModel(wrong))
})

test('custom head warping follows measured vertical bounds without changing the legacy preset', () => {
  const input = createMomoModel()
  const custom = structuredClone(input)
  custom.pose.headWarpBounds = [.28, .55]
  const original = createSimulation(input), adapted = createSimulation(custom)
  const first = original.buildContinuousMesh(), second = adapted.buildContinuousMesh()
  original.setParameter('lookX', 25); adapted.setParameter('lookX', 25)
  for (let frame = 1; frame <= 90; frame++) {
    original.updatePins(frame * 16.67, 16.67); adapted.updatePins(frame * 16.67, 16.67)
    original.updateVertices(first, frame * 16.67); adapted.updateVertices(second, frame * 16.67)
  }
  assert.ok(second.positions.every(Number.isFinite))
  assert.ok(second.positions.some((v, i) => Math.abs(v - first.positions[i]) > .00001))
  assert.equal(input.pose.headWarpBounds, undefined)
  for (const bounds of [[.5, .2], [0, 0], [-.1, .5], [.1, Infinity]]) {
    assert.throws(() => validateModel({ ...custom, pose: { ...custom.pose, headWarpBounds: bounds } }), /headWarpBounds/)
  }
})
