import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { copy } from '../src/i18n/copy.ts'
import { guideCopy } from '../src/i18n/guide-copy.ts'
import { experienceCopy } from '../src/i18n/experience-copy.ts'
import { homeCopy } from '../src/i18n/home-copy.ts'
import { workspaceCopy } from '../src/i18n/workspace-copy.ts'
import { skillsCopy } from '../src/i18n/skills-copy.ts'
import { docsCopy } from '../src/i18n/docs-copy.ts'
import { footerCopy } from '../src/i18n/footer-copy.ts'
const entries = [...copy, ...guideCopy, ...experienceCopy, ...homeCopy, ...workspaceCopy, ...skillsCopy, ...docsCopy, ...footerCopy]
test('all registered translation keys are unique and provide three nonempty languages', () => {
  assert.equal(new Set(entries.map(row => row[0])).size, entries.length)
  for (const row of entries) {
    assert.equal(row.length, 3)
    for (const text of row) assert.ok(text.trim().length > 0)
  }
})
test('literal homepage and editor interface text has complete translations', () => {
  const sources = new Set(entries.map(row => row[0]))
  for (const file of ['../src/components/EyeTrackingGuide.vue', '../src/components/MotionControls.vue', '../src/pages/Home.vue', '../src/components/HomeRigPreview.vue', '../src/pages/Playground.vue', '../src/pages/Docs.vue', '../src/components/CharacterGuide.vue', '../src/components/SkillsGuide.vue', '../src/components/MobileEditorNotice.vue', '../src/components/OpeningLoader.vue']) {
    const code = readFileSync(new URL(file, import.meta.url), 'utf8')
    for (const [, source] of code.matchAll(/\btr\('([^']+)'\)/g)) {
      assert.ok(sources.has(source), 'Missing translation: ' + source)
    }
  }
})
