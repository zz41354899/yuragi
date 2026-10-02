import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { validateModel } from '../src/validation.ts'

test('installable package includes valid Momo and starter assets', () => {
  for (const name of ['momo', 'starter']) {
    const model: unknown = JSON.parse(readFileSync(new URL('../assets/' + name + '/model.json', import.meta.url), 'utf8'))
    validateModel(model)
    assert.equal(model.version, 1)
    assert.equal(model.texture.width, 1024)
    assert.equal(model.texture.height, 1536)
  }
  assert.ok(existsSync(new URL('../assets/momo/texture.webp', import.meta.url)))
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(pkg.files.includes('assets'))
  assert.equal(pkg.exports['./assets/*'], './assets/*')
})
