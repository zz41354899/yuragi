import test from 'node:test'
import assert from 'node:assert/strict'
import { meshPoint } from '../src/editor/mesh-view.ts'
import type { RigMeshSnapshot } from '@z7589xxz758/yuragi'

test('overlay samples the rendered triangle, not bilinear coordinates or undeformed pins',()=>{
  const mesh: RigMeshSnapshot={
    rest:new Float32Array([0,0,1,0,0,1,1,1]),
    positions:new Float32Array([0,0,1,0,0,1,2,3]),
    indices:new Uint16Array([0,1,3,0,3,2]),weights:new Float32Array(),pinNames:[],
  }
  assert.deepEqual(meshPoint(mesh,1,1,[.75,.25]),[1, .75])
  assert.deepEqual(meshPoint(mesh,1,1,[.25,.75]),[.5,1.25])
  assert.deepEqual(meshPoint(mesh,1,1,[1,1]),[2,3])
  assert.deepEqual(meshPoint(mesh,1,1,[0,0]),[0,0])
})
