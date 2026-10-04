import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

test('website offers no model or package download endpoints or export controls', () => {
  for (const path of ['../public/models/momo/model.json', '../public/models/starter/model.json', '../public/downloads/momo-model.zip', '../public/downloads/yuragi-rig-0.1.0.tgz']) {
    assert.equal(existsSync(new URL(path, import.meta.url)), false, path)
  }
  for (const file of ['Home', 'Docs', 'Playground']) {
    const code = readFileSync(new URL('../src/pages/' + file + '.vue', import.meta.url), 'utf8')
    assert.doesNotMatch(code, /href=["']\/downloads\//)
    assert.doesNotMatch(code, /@click=["']exportModel["']/)
  }
  assert.ok(existsSync(new URL('../../../packages/rig/assets/mirea/model.json', import.meta.url)))
})
