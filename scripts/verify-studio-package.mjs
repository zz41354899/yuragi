// Run against an installed tarball, never against workspace aliases.
// node scripts/verify-studio-package.mjs /path/to/installed/@yuragi/rig /path/to/test-output [/path/to/v2-character]
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

if (!process.argv[2] || !process.argv[3]) throw new Error('Provide the installed package and temporary output directories')
const packageRoot = resolve(process.argv[2]), output = resolve(process.argv[3])
const { startStudio } = await import(pathToFileURL(join(packageRoot, 'dist/studio/server.js')).href)
const { reviewChecks } = await import(pathToFileURL(join(packageRoot, 'dist/studio/document.js')).href)
const { validateModel, validateLayeredModel } = await import(pathToFileURL(join(packageRoot, 'dist/index.js')).href)
const server = await startStudio({ out: output })
const delivered = []
try {
  const html = await (await fetch(server.url)).text()
  const token = html.match(/name="studio-token" content="([^"]+)"/)?.[1]
  assert.ok(token)
  for (const asset of [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]) {
    const response = await fetch(server.url + asset[1]); assert.equal(response.status, 200)
    assert.ok((await response.arrayBuffer()).byteLength > 100)
  }
  const request = async (path, body) => {
    const response = await fetch(server.url + '/api/' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'x-yuragi-session': token, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await response.json(); assert.equal(response.status, 200, JSON.stringify(data)); return data
  }
  assert.equal((await request('session')).model, null)
  assert.equal((await fetch(server.url + '/api/session')).status, 403)
  for (const sample of ['mirea']) {
    const session = await request('example', { name: sample })
    validateModel(session.model)
    for (const url of Object.values(session.assets)) assert.equal((await fetch(server.url + url)).status, 200)
    const model = structuredClone(session.model); model.pins[0].x += .001
    validateModel(model)
    await request('draft', { sourceFingerprint: session.sourceFingerprint, draft: { version: 1, model, changes: [{ label: 'Package smoke test', at: new Date().toISOString() }] } })
    assert.deepEqual((await request('session')).draft.model, model)
    const fingerprint = createHash('sha256').update(JSON.stringify(model) + ':' + session.assetFingerprint).digest('hex')
    const review = { fingerprint, checks: Object.fromEntries(reviewChecks.map(key => [key, true])), notes: 'Synthetic package smoke test. These flags exercise export gating; this is not a visual acceptance of a production character.' }
    const result = await request('export', { sourceFingerprint: session.sourceFingerprint, model, review, changes: [] })
    const reloaded = JSON.parse(await readFile(join(result.path, 'model.json'), 'utf8')); validateModel(reloaded)
    assert.ok((await readFile(join(result.path, reloaded.texture.src))).byteLength > 100)
    const report = JSON.parse(await readFile(join(result.path, 'acceptance.json'), 'utf8'))
    assert.equal(report.deliveredModelSha256, createHash('sha256').update(JSON.stringify(reloaded)).digest('hex'))
    delivered.push(result.path)
    const reopened = await startStudio({ project: result.path, out: join(output, 'reopened') })
    try { assert.equal((await fetch(reopened.url)).status, 200) } finally { await reopened.close() }
  }
  if (process.argv[4]) {
    const layered = await startStudio({ project: resolve(process.argv[4]), out: output })
    try {
      const layeredToken = (await (await fetch(layered.url)).text()).match(/name="studio-token" content="([^"]+)"/)[1]
      const headers = { 'x-yuragi-session': layeredToken, 'content-type': 'application/json' }
      const session = await (await fetch(layered.url + '/api/session', { headers })).json()
      assert.equal(session.model.version, 2); validateLayeredModel(session.model)
      const review = { fingerprint: createHash('sha256').update(JSON.stringify(session.model) + ':' + session.assetFingerprint).digest('hex'), checks: Object.fromEntries(reviewChecks.map(key => [key, true])), notes: 'Synthetic package test only; not production visual acceptance.' }
      const body = { sourceFingerprint: session.sourceFingerprint, model: session.model, review, changes: [] }
      const edited = structuredClone(body); edited.model.name += ' edited'
      const rejected = await fetch(layered.url + '/api/export', { method: 'POST', headers, body: JSON.stringify(edited) })
      assert.equal(rejected.status, 400); assert.match((await rejected.json()).error, /inspection-only/)
      const response = await fetch(layered.url + '/api/export', { method: 'POST', headers, body: JSON.stringify(body) })
      const result = await response.json(); assert.equal(response.status, 200, JSON.stringify(result))
      const model = JSON.parse(await readFile(join(result.path, 'model.json'), 'utf8')); validateLayeredModel(model)
      for (const source of [model.source.fallback, ...model.atlases.map(a => a.src)]) assert.ok((await readFile(join(result.path, source))).byteLength > 100)
      delivered.push(result.path)
      const reopened = await startStudio({ project: result.path, out: join(output, 'v2-reopened') })
      try { assert.equal((await fetch(reopened.url)).status, 200) } finally { await reopened.close() }
    } finally { await layered.close() }
  }
  await writeFile(join(output, 'deliveries.json'), JSON.stringify(delivered, null, 2))
  console.log('Installed Studio assets, bundled Mirea, drafts, authenticated versioned export and exported model reload passed.')
} finally { await server.close() }
