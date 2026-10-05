export const projectStages = ['inspected', 'annotated', 'extracted', 'bound', 'compiled', 'reviewed'] as const
export interface StudioProject {
  version: 1
  source: { file: string; sha256: string }
  stage: typeof projectStages[number]
  currentVersion: string
  versions: { id: string; path: string; label?: string; runtimeVersion?: string; inputs?: Record<string,string> }[]
}
export function validateProject(value: unknown): asserts value is StudioProject {
  const p = value as StudioProject
  const local = (s: unknown) => typeof s === 'string' && !!s && !/^(?:[a-z][a-z\d+.-]*:|\/|\\)/i.test(s) && !s.split(/[\\/]/).includes('..')
  if (!p || p.version !== 1 || !p.source || !local(p.source.file) || !/^[a-f0-9]{64}$/.test(p.source.sha256) || !projectStages.includes(p.stage) || !Array.isArray(p.versions) || !p.versions.length || p.versions.length > 100) throw new Error('Invalid project manifest')
  const ids = new Set<string>()
  for (const version of p.versions) {
    if (!version || typeof version.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(version.id) || ids.has(version.id) || !local(version.path) || version.label !== undefined && typeof version.label !== 'string') throw new Error('Invalid project version')
    for (const [file, hash] of Object.entries(version.inputs ?? {})) if (!local(file) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid version input fingerprint')
    ids.add(version.id)
  }
  if (!ids.has(p.currentVersion)) throw new Error('Current version is not listed')
}
export interface StudioIssue {
  id: string
  resolved?: boolean
  at: string
  fingerprint: string
  assetFingerprint: string
  versionId: string
  partId?: string
  pose: string
  milliseconds: number
  pointer: [number, number]
  sourcePoint?: [number, number]
  snapshot: unknown
  observation: string
  screenshot: string
}
