import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const names = ['yuragi-character', 'yuragi-rig-spec']
const rig = resolve(root, 'skills/yuragi-rig-spec')
// Installed skills carry the same model contract and guide as this checkout.
mkdirSync(resolve(rig, 'references'), { recursive: true })
cpSync(resolve(root, 'packages/rig/src/types.ts'), resolve(rig, 'references/api-types.ts'))
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
