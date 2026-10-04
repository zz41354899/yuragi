import './generate-api.mjs'
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const names = ['yuragi-character', 'yuragi-rig-spec']
// Preserve the canonical MIT terms and scope in standalone installable copies.
for (const directory of ['packages/rig', ...names.map(name => 'skills/' + name)]) {
  for (const file of ['LICENSE', 'LICENSE-SCOPE.md']) {
    cpSync(resolve(root, file), resolve(root, directory, file))
  }
}
const rig = resolve(root, 'skills/yuragi-rig-spec')
// Installed skills carry the same model contract and guide as this checkout.
mkdirSync(resolve(rig, 'references'), { recursive: true })
cpSync(resolve(root, 'packages/rig/src/types.ts'), resolve(rig, 'references/api-types.ts'))
writeFileSync(resolve(rig, 'references/layered-api-types.ts'), readFileSync(resolve(root, 'packages/rig/src/layered-types.ts'), 'utf8').replace('./types.js', './api-types.js'))
cpSync(resolve(root, 'docs/layered-engine.zh-TW.md'), resolve(rig, 'references/layered-engine.zh-TW.md'))
writeFileSync(resolve(rig, 'references/layered-engine.md'), '# Layered v2 runtime\n\nSee [the complete v2 contract](layered-engine.zh-TW.md) and [public types](layered-api-types.ts). Independent attachments use createLayeredPlayer, createLayeredSimulation and validateLayeredModel; v1 shared-surface models continue to use createPlayer.\n')
cpSync(resolve(root, 'docs/custom-character.en.md'), resolve(rig, 'references/custom-character.md'))
cpSync(resolve(root, 'packages/rig/assets/starter/model.json'), resolve(rig, 'assets/starter-model.json'))

function files(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === '__pycache__' || entry.name.endsWith('.pyc')) return []
    const relative = prefix + entry.name
    if (entry.isDirectory()) return files(resolve(directory, entry.name), relative + '/')
    if (!entry.isFile()) throw new Error('Skill resources must be regular files: ' + relative)
    return [relative]
  })
}
// Directory-based discovery works with the CLI's supported legacy index format.
// https://github.com/vercel-labs/skills/blob/main/src/providers/wellknown.ts
const output = resolve(root, 'apps/site/public/.well-known/skills')
mkdirSync(output, { recursive: true })
const index = { skills: names.map(name => {
  const source = resolve(root, 'skills', name)
  const markdown = readFileSync(resolve(source, 'SKILL.md'), 'utf8')
  if (!markdown.startsWith('---\nname: ' + name + '\n')) throw new Error('Skill name mismatch: ' + name)
  const description = JSON.parse(markdown.match(/^description: (".*")$/m)?.[1] ?? 'null')
  if (typeof description !== 'string' || !description) throw new Error('Missing description: ' + name)
  const target = resolve(output, name)
  rmSync(target, { recursive: true, force: true })
  const resources = files(source)
  for (const file of resources) {
    mkdirSync(resolve(target, file, '..'), { recursive: true })
    cpSync(resolve(source, file), resolve(target, file))
  }
  return { name, description, files: resources }
}) }
writeFileSync(resolve(output, 'index.json'), JSON.stringify(index, null, 2) + '\n')
console.log('Prepared Yuragi skills: ' + names.join(', '))
