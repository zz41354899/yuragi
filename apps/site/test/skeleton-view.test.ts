import { createMireaModel } from '@z7589xxz758/yuragi/mirea'
import test from 'node:test'
import assert from 'node:assert/strict'
import { type RigMeshSnapshot } from '@z7589xxz758/yuragi'
import { boneOutline } from '../src/editor/skeleton-view.ts'

test('tapered bones follow the submitted triangles and retain exact joint endpoints', () => {
  const model = createMireaModel(); model.mesh = { columns: 1, rows: 1 }
  const mesh: RigMeshSnapshot = {
    rest: new Float32Array([0,0,1,0,0,1,1,1]), positions: new Float32Array([0,0,1,0,0,1,2,3]),
    indices: new Uint16Array([0,1,3,0,3,2]), weights: new Float32Array(), pinNames: [],
  }
  const points = boneOutline([0,0], [1,1], model, mesh).split(' ').map(pair => pair.split(',').map(Number))
  assert.deepEqual(points[0], [0,0])
  assert.ok(points.some(([x,y]) => x === 2048 && y === 4608))
  assert.ok(points.flat().every(Number.isFinite))
  assert.ok(points.length > 8)
  assert.deepEqual(points.at(-1), [0,0])
})

test('coincident edited joints do not produce invalid bone coordinates', () => {
  const model = createMireaModel()
  const values = boneOutline([.5,.5], [.5,.5], model).split(/[ ,]/).map(Number)
  assert.ok(values.every(Number.isFinite))
  assert.ok(values.every((value, index) => value === (index % 2 ? 768 : 512)))
})
