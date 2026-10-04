import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { validateModel } from '../src/validation.ts'
import { createHash } from 'node:crypto'
import { createMireaModel } from '../src/mirea.js'

test('installable package includes valid Mirea and starter assets', () => {
  for (const name of ['mirea', 'starter']) {
    const model: unknown = JSON.parse(readFileSync(new URL('../assets/' + name + '/model.json', import.meta.url), 'utf8'))
    validateModel(model)
    assert.equal(model.version, 1)
    assert.equal(model.texture.width, 1024)
    assert.equal(model.texture.height, 1536)
  }
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(pkg.files.includes('assets'))
  assert.equal(pkg.exports['./assets/*'], './assets/*')
})


test('packaged Mirea pairs the reviewed source with isolated model data through its opt-in entry',()=>{
  const canonical=JSON.parse(readFileSync(new URL('../assets/mirea/model.json',import.meta.url),'utf8'))
  assert.deepEqual(createMireaModel(),canonical)
  const authored=JSON.parse(readFileSync(new URL('../../../artifacts/mirea-sandbox/model.json',import.meta.url),'utf8'))
  authored.texture.src=canonical.texture.src
  assert.deepEqual(canonical,authored)
  const png=readFileSync(new URL('../assets/mirea/texture.png',import.meta.url))
  assert.equal(png.readUInt32BE(16),canonical.texture.width)
  assert.equal(png.readUInt32BE(20),canonical.texture.height)
  assert.equal(createHash('sha256').update(png).digest('hex'),'6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05')
  const edited=createMireaModel('/different.png')
  edited.pins[0].x=.1
  edited.face!.eyes[0].iris[0]=.1
  assert.deepEqual(createMireaModel(),canonical)
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'))
  assert.deepEqual(pkg.exports['./mirea'],{types:'./dist/mirea.d.ts',import:'./dist/mirea.js'})
  // The character data stays outside the core entry so core-only users do not pay for it.
  assert.ok(!readFileSync(new URL('../src/index.ts',import.meta.url),'utf8').includes("'./mirea.js'"))
})
