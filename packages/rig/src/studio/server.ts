import { missingAssets, type MissingAssetsReport } from './materials.js'
import { createServer, type IncomingMessage } from 'node:http'
import { readFile, realpath, stat, lstat, mkdir, writeFile, rename, rm } from 'node:fs/promises'
import { resolve, relative, sep, dirname, basename, extname, join } from 'node:path'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { validateStudioModel, reviewChecks, type StudioModel, type StudioDraft, type StudioReview } from './document.js'
import { validateProject, type StudioProject, type StudioIssue } from './project.js'
import { imageSize } from 'image-size'
import { integrationExamples } from './examples.js'

const packageRoot = fileURLToPath(new URL('../../', import.meta.url))
const sha = (input: string | Uint8Array) => createHash('sha256').update(input).digest('hex')
const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2' }
function within(root: string, path: string) { const rel = relative(root, path); return rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !rel.startsWith(sep)) }
/** Recheck real paths on every read, including aliases and changed symlinks. */
export async function safeFile(root: string, path: string) {
  const candidate = resolve(root, path)
  if (!within(root, candidate)) throw new Error('Path leaves the selected directory')
  const canonical = await realpath(candidate)
  if (!within(root, canonical) || !(await stat(canonical)).isFile()) throw new Error('File leaves the selected directory')
  return canonical
}
async function canonicalOutput(path: string): Promise<string> {
  try { return await realpath(path) } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    const parent = await canonicalOutput(dirname(path))
    return join(parent, basename(path))
  }
}
async function outputDirectory(root: string, path: string) {
  const destination = resolve(root, path)
  if (!within(root, destination)) throw new Error('Output leaves configured root')
  await mkdir(root, { recursive: true })
  if (await realpath(root) !== root) throw new Error('Output root changed; restart Studio')
  let current = root
  for (const segment of relative(root, destination).split(sep).filter(Boolean)) {
    current = join(current, segment)
    try { await mkdir(current) } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e }
    const info = await lstat(current)
    if (info.isSymbolicLink() || !info.isDirectory() || await realpath(current) !== current) throw new Error('Unsafe output directory')
  }
  return destination
}
async function noExistingFile(path: string) {
  try { await lstat(path); throw new Error('Output file already exists') }
  catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e }
}
function assetRefs(model: StudioModel) { return model.version === 1 ? [model.texture.src] : [model.source.fallback, ...model.atlases.map(a => a.src)] }
function replaceRefs(model: StudioModel, mapping: Record<string, string>) {
  const result = structuredClone(model)
  if (result.version === 1) result.texture.src = mapping[result.texture.src]
  else { result.source.fallback = mapping[result.source.fallback]; result.atlases.forEach(a => { a.src = mapping[a.src] }) }
  return result
}
interface Asset { source: string; relative: string; hash: string; url: string; bytes: Buffer }
interface Session { versionId: string; root: string; model: StudioModel; assets: Asset[]; assetFingerprint: string; sourceFingerprint: string; records: Record<string, unknown> }
export interface StudioServerOptions { project?: string; out?: string; port?: number; uiRoot?: string }
async function readJson(root: string, name: string) { return JSON.parse(await readFile(await safeFile(root, name), 'utf8')) as unknown }
export async function loadProject(root: string, sample = false): Promise<Session> {
  root = await realpath(root)
  const model = await readJson(root, 'model.json')
  validateStudioModel(model)
  if (sample && model.version === 1) model.texture.src = './' + (model.texture.src.endsWith('.webp') ? 'texture.webp' : 'texture.png')
  const assets: Asset[] = []
  for (const source of [...new Set(assetRefs(model))]) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/|\\)/i.test(source) || source.includes('?') || source.includes('#')) throw new Error('Studio requires local, model-relative image references: ' + source)
    if (!['.png', '.webp', '.jpg', '.jpeg'].includes(extname(source).toLowerCase())) throw new Error('Unsupported image format')
    const file = await safeFile(root, source)
    const bytes = await readFile(file), dimensions = imageSize(bytes)
    const width = dimensions.orientation && dimensions.orientation > 4 ? dimensions.height : dimensions.width
    const height = dimensions.orientation && dimensions.orientation > 4 ? dimensions.width : dimensions.height
    const expected = model.version === 1 ? [model.texture] : [...(source === model.source.fallback ? [model.source] : []), ...model.atlases.filter(a => a.src === source)]
    if (expected.some(size => size.width !== width || size.height !== height)) throw new Error('Image dimensions do not match the model: '+source)
    assets.push({ source, relative: relative(root, file), bytes, hash: sha(bytes), url: '/project-assets/' + assets.length })
  }
  if (model.version === 2 && assets.find(a => a.source === model.source.fallback)?.hash !== model.source.sha256) throw new Error('Source artwork fingerprint mismatch')
  const records: Record<string, unknown> = {}
  for (const name of ['analysis.json', 'character-analysis.json', 'report.json', 'build-report.json', 'extract-report.json', 'parts-manifest.json', 'image-info.json', 'diagnosis.json', 'decomposition.json', 'missing-assets.json']) {
    try { records[name] = await readJson(root, name) } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  }
  const assetFingerprint = sha(JSON.stringify(assets.map(a => [a.source, a.hash])))
  return { versionId: 'legacy', root, model, assets, assetFingerprint, sourceFingerprint: sha(JSON.stringify(model) + ':' + assetFingerprint), records }
}
async function requestBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  let length = 0; const chunks: Buffer[] = []
  for await (const chunk of request) { const data = Buffer.from(chunk as Uint8Array); length += data.length; if (length > 8 * 1024 * 1024) throw new Error('Request exceeds 8 MiB'); chunks.push(data) }
  const result: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Object request required')
  return result as Record<string, unknown>
}
export async function startStudio(options: StudioServerOptions = {}) {
  const uiRoot = await realpath(options.uiRoot ?? resolve(packageRoot, 'studio'))
  const out = await canonicalOutput(resolve(options.out ?? 'yuragi-output'))
  const projectRoot = options.project ? await realpath(resolve(options.project)) : undefined
  let catalog: StudioProject | undefined
  async function readCatalog() {
    if (!projectRoot) return undefined
    let candidate: unknown
    try { candidate = await readJson(projectRoot, 'project.json') } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error }
    validateProject(candidate)
    if (sha(await readFile(await safeFile(projectRoot, candidate.source.file))) !== candidate.source.sha256) throw new Error('Project source fingerprint mismatch; inspect the source again')
    return candidate
  }
  async function versionSession(id: string, project: StudioProject) {
    const version = project.versions.find(v => v.id === id)
    if (!version || !projectRoot) throw new Error('Unknown version')
    const modelFile = await safeFile(projectRoot, version.path + '/model.json')
    const next = await loadProject(dirname(modelFile)); next.versionId = id; return next
  }
  catalog = await readCatalog()
  let session = catalog ? await versionSession(catalog.currentVersion, catalog) : projectRoot ? await loadProject(projectRoot) : undefined
  async function summary() {
    try {
      const next = await readCatalog()
      if (!next) return { currentVersion: session?.versionId, versions: [], stage: 'compiled' }
      const versions = await Promise.all(next.versions.map(async version => {
        try { const loaded = await versionSession(version.id, next); let stale = false
          for (const [file, hash] of Object.entries(version.inputs ?? {})) { try { stale ||= sha(await readFile(await safeFile(projectRoot!, file))) !== hash } catch { stale = true } }
          return { ...version, fingerprint: loaded.sourceFingerprint, ready: true, stale }
        }
        catch (error) { return { ...version, ready: false, error: String(error) } }
      }))
      catalog = next
      return { currentVersion: next.currentVersion, stage: next.stage, versions }
    } catch (error) { return { currentVersion: session?.versionId, versions: [], error: String(error) } }
  }
  const issues: StudioIssue[] = []
  try { const saved = await readJson(out, 'review/issues.json') as { issues?: StudioIssue[] }; if (Array.isArray(saved.issues)) issues.push(...saved.issues) } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  async function writeReview(name: string, content: string | Buffer) {
    const dir = await outputDirectory(out, 'review'), path = join(dir, name)
    try { if ((await lstat(path)).isSymbolicLink()) throw new Error('Unsafe review path') } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    const temporary = join(dir, '.' + randomBytes(12).toString('hex'))
    await writeFile(temporary, content, { flag: 'wx' }); await rename(temporary, path); return path
  }
  const token = randomBytes(32).toString('hex')
  let origin = ''
  let mutation = Promise.resolve()
  async function stableAssets(current: Session) {
    const storedModel = await readJson(current.root, 'model.json'); validateStudioModel(storedModel)
    if (current.root === resolve(packageRoot, 'assets', 'mirea') && storedModel.version === 1) storedModel.texture.src = './' + (storedModel.texture.src.endsWith('.webp') ? 'texture.webp' : 'texture.png')
    if (JSON.stringify(storedModel) !== JSON.stringify(current.model)) throw new Error('Model changed. Load a new version and repeat visual review.')
    for (const asset of current.assets) if (sha(await readFile(await safeFile(current.root, asset.relative))) !== asset.hash) throw new Error('Artwork changed. Restart Studio and repeat visual review.')
  }
  async function materialReport(current: Session) {
    const annotation = (current.records['analysis.json'] ?? current.records['character-analysis.json']) as { image?: { sha256?: string } } | undefined
    const sourceSha256 = current.model.version === 2 ? current.model.source.sha256 : annotation?.image?.sha256 ?? current.assets[0].hash
    const report: MissingAssetsReport = { version: 1, producer: 'studio', sourceSha256, modelFingerprint: current.sourceFingerprint, assetFingerprint: current.assetFingerprint, versionId: current.versionId, items: missingAssets(current.model) }
    const authored = current.records['missing-assets.json'] as MissingAssetsReport | undefined
    if (authored?.version === 1 && authored.sourceSha256 === sourceSha256 && Array.isArray(authored.items)) {
      const valid = authored.items.filter(item => item && !/^eye-(left|right)-(eyelid-skin|eyeball|half|closed)$/.test(item.id) && !/^mouth-(closed|open|a|i|u|e|o)$/.test(item.id) && /^[a-zA-Z0-9_-]+$/.test(item.id) && typeof item.partId === 'string' && typeof item.reason === 'string' && typeof item.required === 'boolean' && ['extract','revise-annotation','provide-artwork'].includes(item.nextAction))
      report.items = [...new Map([...report.items, ...valid].map(item => [item.id, item])).values()]
    }
    const dir = await outputDirectory(out, ''), path = join(dir, 'missing-assets.json')
    try { if ((await lstat(path)).isSymbolicLink()) throw new Error('Unsafe material report path') } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    const contents = JSON.stringify(report, null, 2) + '\n'
    try { if (await readFile(path, 'utf8') === contents) return { path, report } } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    const temporary = join(dir, '.' + randomBytes(12).toString('hex'))
    await writeFile(temporary, contents, { flag: 'wx' }); await rename(temporary, path)
    return { path, report }
  }
  async function payload(current: Session | undefined) {
    if (!current) return { model: null, output: out }
    let draft: unknown
    try {
      draft = await readJson(out, 'drafts/' + current.sourceFingerprint + '.json')
    } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e }
    return { model: current.model, assets: Object.fromEntries(current.assets.map(a => [a.source, a.url])), assetFingerprint: current.assetFingerprint, records: current.records, sourceFingerprint: current.sourceFingerprint, versionId: current.versionId, project: await summary(), missingAssets: await materialReport(current), issues: issues.filter(issue => issue.fingerprint === current.sourceFingerprint), draft, output: out }
  }
  async function exportProject(current: Session, data: Record<string, unknown>) {
    await stableAssets(current)
    const state = await summary()
    if ('error' in state && state.error || state.versions.some(v => v.id === current.versionId && 'stale' in v && v.stale)) throw new Error('Authoring inputs changed; rebuild before delivery')
    const model = data.model; validateStudioModel(model)
    if(model.version !== current.model.version)throw new Error('Model format cannot change during this session')
    if(model.version===1&&current.model.version===1&&(model.texture.width!==current.model.texture.width||model.texture.height!==current.model.texture.height))throw new Error('Image dimensions cannot change without reopening the artwork')
    if (current.model.version === 2 && JSON.stringify(model) !== JSON.stringify(current.model)) throw new Error('Layered models are inspection-only')
    if (assetRefs(model).some(ref => !current.assets.some(a => a.source === ref))) throw new Error('Unknown artwork reference')
    if (issues.some(i => i.fingerprint === current.sourceFingerprint && !i.resolved)) throw new Error('Observe and resolve current model issues before delivery')
    const review = data.review as StudioReview | undefined
    const fingerprint = sha(JSON.stringify(model) + ':' + current.assetFingerprint)
    if (!review || review.fingerprint !== fingerprint || !reviewChecks.every(check => review.checks?.[check] === true) || typeof review.notes !== 'string') throw new Error('Validate and complete the current model’s visual review before delivery')
    const dirName = 'character-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomBytes(3).toString('hex')
    const staging = await outputDirectory(out, '.pending-' + dirName)
    const destination = resolve(out, dirName)
    await noExistingFile(destination)
    try {
      const mapping: Record<string, string> = {}
      await outputDirectory(out, '.pending-' + dirName + '/assets')
      for (const [i, asset] of current.assets.entries()) {
        const fileName = i + extname(asset.relative).toLowerCase()
        mapping[asset.source] = './assets/' + fileName
        const bytes = await readFile(await safeFile(current.root, asset.relative))
        if (sha(bytes) !== asset.hash) throw new Error('Artwork changed during delivery')
        await writeFile(join(staging, 'assets', fileName), bytes, { flag: 'wx' })
      }
      const deliveredModel=replaceRefs(model,mapping)
      await writeFile(join(staging, 'model.json'), JSON.stringify(deliveredModel, null, 2) + '\n', { flag: 'wx' })
      await writeFile(join(staging, 'acceptance.json'), JSON.stringify({ version: 1, modelValidation: 'passed', visualAcceptance: 'human-reviewed', reviewedAt: new Date().toISOString(), fingerprint, deliveredModelSha256:sha(JSON.stringify(deliveredModel)), sourceFingerprint: current.sourceFingerprint, assetFingerprint: current.assetFingerprint, review, changes: data.changes, untested: ['Physical devices and other GPUs unless explicitly recorded in notes'], originalRecords: current.records, prototype: model.version === 2 && model.attachments.some(a => a.coverage === 'visible-only'), annotationStatus: 'Agent-authored source records; Studio previews and reviews models' }, null, 2), { flag: 'wx' })
      await outputDirectory(out, '.pending-' + dirName + '/examples')
      for (const [name, content] of Object.entries(integrationExamples(model.version === 2))) await writeFile(join(staging, 'examples', name), content, { flag: 'wx' })
      await rename(staging, destination)
      return destination
    } catch (e) { await rm(staging, { recursive: true, force: true }); throw e }
  }
  const server = createServer((request, response) => {
    void (async () => {
      const json = (status: number, value: unknown) => { response.writeHead(status, { 'Content-Type': mime['.json'] }); response.end(JSON.stringify(value)) }
      response.setHeader('Cache-Control', 'no-store')
      response.setHeader('X-Content-Type-Options', 'nosniff')
      response.setHeader('Referrer-Policy', 'no-referrer')
      response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
      try {
        if (request.headers.host !== new URL(origin).host || request.headers.origin && request.headers.origin !== origin) { json(403, { error: 'Invalid local origin' }); return }
        const url = new URL(request.url ?? '/', origin)
        if (url.pathname.startsWith('/api/')) {
          const submitted = request.headers['x-yuragi-session']
          if (typeof submitted !== 'string' || submitted.length !== token.length || !timingSafeEqual(Buffer.from(submitted), Buffer.from(token))) { json(403, { error: 'Invalid Studio session' }); return }
          if (url.pathname === '/api/pose-sheet' && request.method === 'GET') {
            if (!session) throw new Error('Open a character first')
            const sheet = await readJson(session.root, 'review/poses.json') as {fingerprint?: string; poses?: {id: string}[]}
            if (sheet.fingerprint !== session.sourceFingerprint || !Array.isArray(sheet.poses) || sheet.poses.length > 40 || sheet.poses.some(p => !/^[a-z0-9-]+$/.test(p.id))) throw new Error('Pose sheet does not match this model')
            for (const pose of sheet.poses) { await safeFile(session.root, 'review/'+pose.id+'.png'); await safeFile(session.root, 'review/'+pose.id+'-detail.png') }
            json(200, { ...sheet, images: sheet.poses.map(p => ({id:p.id, image:'/pose-assets/'+p.id+'.png',detail:'/pose-assets/'+p.id+'-detail.png'})), overview:'/pose-assets/contact-sheet.png' }); return
          }
          if (url.pathname === '/api/summary' && request.method === 'GET') { json(200, await summary()); return }
          if (url.pathname === '/api/session' && request.method === 'GET') { if(session)await stableAssets(session);json(200, await payload(session)); return }
          if (request.method !== 'POST') { json(405, { error: 'POST required' }); return }
          const body = await requestBody(request)
          // Serialize saves, exports and example switching so sessions cannot cross mid-write.
          const operation = mutation.then(async () => {
            if (url.pathname === '/api/example') {
              if (!['mirea'].includes(String(body.name))) throw new Error('Unknown example')
              session = await loadProject(resolve(packageRoot, 'assets', String(body.name)), true)
              return await payload(session)
            }
            if (url.pathname === '/api/version') {
              const project = await readCatalog(); if (!project) throw new Error('This legacy folder has no version catalog')
              const next = await versionSession(String(body.versionId), project); const result = await payload(next); session = next; catalog = project; return result
            }
            if (!session) throw new Error('Open a character first')
            if (body.sourceFingerprint !== session.sourceFingerprint) throw new Error('Character session changed; reload Studio')
            if (url.pathname === '/api/issue-status') {
              if (typeof body.id !== 'string' || typeof body.resolved !== 'boolean') throw new Error('Invalid issue status')
              const issue = issues.find(i => i.id === body.id && i.fingerprint === session!.sourceFingerprint)
              if (!issue) throw new Error('Unknown issue for this model')
              const updated = issues.map(i => i === issue ? { ...i, resolved: body.resolved as boolean } : i)
              await writeReview('issues.json', JSON.stringify({ version: 1, issues: updated }, null, 2))
              Object.assign(issue, { resolved: body.resolved }); return { issues: issues.filter(i => i.fingerprint === session!.sourceFingerprint) }
            }
            if (url.pathname === '/api/issues') {
              await stableAssets(session)
              if (typeof body.observation !== 'string' || !body.observation.trim() || body.observation.length > 10000 || typeof body.pose !== 'string' || body.pose.length > 100) throw new Error('Issue observation and pose required')
              const point = (value: unknown, low: number, high: number) => Array.isArray(value) && value.length === 2 && value.every(v => typeof v === 'number' && Number.isFinite(v) && v >= low && v <= high)
              if (!point(body.pointer, -.5, .5) || body.sourcePoint !== undefined && !point(body.sourcePoint, 0, 1) || typeof body.milliseconds !== 'number' || !Number.isFinite(body.milliseconds) || body.milliseconds < 0) throw new Error('Invalid issue coordinates/time')
              if (body.partId !== undefined && (typeof body.partId !== 'string' || body.partId.length > 200)) throw new Error('Invalid part ID')
              if (typeof body.screenshot !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(body.screenshot)) throw new Error('PNG screenshot required')
              const bytes = Buffer.from(body.screenshot.split(',')[1], 'base64')
              if (bytes.length > 6 * 1024 * 1024 || !bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('Invalid PNG screenshot')
              const id = randomBytes(12).toString('hex'), screenshot = id + '.png'
              await writeReview(screenshot, bytes)
              const issue: StudioIssue = { id, at: new Date().toISOString(), fingerprint: session.sourceFingerprint, assetFingerprint: session.assetFingerprint, versionId: session.versionId, partId: body.partId as string | undefined, pose: body.pose, milliseconds: body.milliseconds, pointer: body.pointer as [number,number], sourcePoint: body.sourcePoint as [number,number] | undefined, snapshot: body.snapshot, observation: body.observation.trim(), screenshot }
              const nextIssues = [...issues, issue]
              const path = await writeReview('issues.json', JSON.stringify({ version: 1, issues: nextIssues }, null, 2))
              issues.push(issue); return { path, issue }
            }
            if (url.pathname === '/api/draft') {
              const draft = body.draft as StudioDraft | undefined
              if (!draft || draft.version !== 1 || !Array.isArray(draft.changes) || !('model' in draft)) throw new Error('Invalid draft envelope')
              if (session.model.version === 2 && JSON.stringify(draft.model) !== JSON.stringify(session.model)) throw new Error('Layered draft is inspection-only')
              const dir = await outputDirectory(out, 'drafts')
              const target = join(dir, session.sourceFingerprint + '.json')
              try { if ((await lstat(target)).isSymbolicLink()) throw new Error('Unsafe draft file') } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e }
              const temp = join(dir, '.' + randomBytes(12).toString('hex') + '.json')
              await writeFile(temp, JSON.stringify(draft, null, 2), { flag: 'wx' }); await rename(temp, target)
              return { path: target }
            }
            if (url.pathname === '/api/export') return { path: await exportProject(session, body) }
            throw new Error('Unknown operation')
          })
          mutation = operation.then(() => {}, () => {})
          json(200, await operation); return
        }
        if (!['GET', 'HEAD'].includes(request.method ?? '')) { json(405, { error: 'GET required' }); return }
        let file: string
        if (url.pathname.startsWith('/pose-assets/')) { if (!session) throw new Error('Open a character first'); file = await safeFile(session.root, 'review/'+decodeURIComponent(url.pathname.slice('/pose-assets/'.length))) }
        else if (url.pathname.startsWith('/review-assets/')) { file = await safeFile(out, 'review/' + decodeURIComponent(url.pathname.slice('/review-assets/'.length))) }
        else if (url.pathname.startsWith('/project-assets/')) {
          const asset = session?.assets.find(a => a.url === url.pathname)
          if (!asset || !session) { json(404, { error: 'Asset not found' }); return }
          response.writeHead(200, { 'Content-Type': mime[extname(asset.relative)] ?? 'image/png' }); response.end(request.method === 'HEAD' ? undefined : asset.bytes); return
        } else file = await safeFile(uiRoot, url.pathname === '/' ? 'index.html' : '.' + decodeURIComponent(url.pathname))
        let content = await readFile(file)
        if (extname(file) === '.html') content = Buffer.from(content.toString('utf8').replace('</head>', '<meta name="studio-token" content="' + token + '"></head>'))
        response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }); response.end(request.method === 'HEAD' ? undefined : content)
      } catch (error) { json((error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 400, { error: error instanceof Error ? error.message : String(error) }) }
    })()
  })
  await new Promise<void>((res, rej) => { server.once('error', rej); server.listen(options.port ?? 0, '127.0.0.1', () => { server.off('error', rej); res() }) })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Studio failed to listen')
  origin = 'http://127.0.0.1:' + address.port
  return { server, url: origin, out, close: () => new Promise<void>((res, rej) => server.close(error => error ? rej(error) : res())) }
}
