import { test } from 'node:test'
import assert from 'node:assert/strict'
import { imagePoint, zoomAtPoint, movePin } from '../src/editor/viewport.ts'

test('pin coordinates use the transformed artwork, not the viewport', () => {
  assert.deepEqual(imagePoint({ x: 300, y: 500 }, { left: 100, top: 200, width: 400, height: 600 }), { x: .5, y: .5 })
  assert.deepEqual(imagePoint({ x: 300, y: 500 }, { left: 0, top: 50, width: 600, height: 900 }), { x: .5, y: .5 })
})
test('pins are clamped to the full image and zero-size artwork is ignored', () => {
  assert.deepEqual(imagePoint({ x: -10, y: 900 }, { left: 0, top: 0, width: 100, height: 100 }), { x: 0, y: 1 })
  assert.equal(imagePoint({ x: 0, y: 0 }, { left: 0, top: 0, width: 0, height: 0 }), undefined)
})
test('zoom preserves the artwork position below the cursor', () => {
  const before = { x: 20, y: -10 }, anchor = { x: 70, y: 90 }
  const after = zoomAtPoint(1, 2, before, anchor)
  assert.deepEqual(after, { zoom: 2, pan: { x: -30, y: -110 } })
  assert.equal((anchor.x - before.x) / 1, (anchor.x - after.pan.x) / after.zoom)
  assert.equal((anchor.y - before.y) / 1, (anchor.y - after.pan.y) / after.zoom)
})
test('zoom limits apply before recalculating pan', () => {
  assert.equal(zoomAtPoint(1, 20, { x: 0, y: 0 }, { x: 20, y: 20 }).zoom, 3)
  assert.equal(zoomAtPoint(1, .1, { x: 0, y: 0 }, { x: 20, y: 20 }).zoom, .5)
})
test('keyboard editing supports fine steps, Shift and image boundaries', () => {
  assert.deepEqual(movePin({ x: .5, y: .5 }, 'ArrowRight'), { x: .501, y: .5 })
  assert.deepEqual(movePin({ x: .5, y: .5 }, 'ArrowUp', true), { x: .5, y: .49 })
  assert.deepEqual(movePin({ x: 1, y: 0 }, 'ArrowRight', true), { x: 1, y: 0 })
  assert.equal(movePin({ x: 0, y: 0 }, 'Enter'), undefined)
})
