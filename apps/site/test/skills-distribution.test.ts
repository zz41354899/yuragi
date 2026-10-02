import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateModel } from '../../../packages/rig/src/validation.ts'

test('website discovery includes complete, current skill resources and resolving local references', () => {
  const base = new URL('../public/.well-known/skills/', import.meta.url)
  const index = JSON.parse(readFileSync(new URL('index.json', base), 'utf8')) as {
    skills: { name: string; description: string; files: string[] }[]
  }
  assert.deepEqual(index.skills.map(skill => skill.name), ['yuragi-character', 'yuragi-rig-spec'])
  for (const skill of index.skills) {
    assert.ok(skill.description)
    assert.ok(skill.files.includes('SKILL.md'))
    for (const file of skill.files) {
      const delivered = readFileSync(new URL(skill.name + '/' + file, base), 'utf8')
      const canonical = readFileSync(new URL('../../../skills/' + skill.name + '/' + file, import.meta.url), 'utf8')
      assert.equal(delivered, canonical, 'Stale distribution: ' + skill.name + '/' + file)
      if (!file.endsWith('.md')) continue
      for (const [, link] of delivered.matchAll(/\]\(([^\s)]+)\)/g)) {
        if (/^(?:https?:|#)/.test(link)) continue
        const resource = new URL(link, new URL(skill.name + '/' + file, base))
        assert.ok(readFileSync(resource).length, 'Missing skill reference: ' + link)
      }
    }
  }
})

test('installed rig skill carries the current model contract and a valid starter', () => {
  const references = new URL('../../../skills/yuragi-rig-spec/references/', import.meta.url)
  assert.equal(readFileSync(new URL('api-types.ts', references), 'utf8'), readFileSync(new URL('../../../packages/rig/src/types.ts', import.meta.url), 'utf8'))
  assert.equal(readFileSync(new URL('custom-character.md', references), 'utf8'), readFileSync(new URL('../../../docs/custom-character.en.md', import.meta.url), 'utf8'))
  const starter: unknown = JSON.parse(readFileSync(new URL('../assets/starter-model.json', references), 'utf8'))
  validateModel(starter)
})
