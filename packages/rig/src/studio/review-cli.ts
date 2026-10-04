import { createServer } from 'node:http'
import { readFile, mkdir, mkdtemp, rename, rm, realpath, lstat } from 'node:fs/promises'
import { dirname, resolve, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadProject, safeFile } from './server.js'
import { validateProject } from './project.js'

/** The optional Playwright peer is needed only for offline rendered reviews. */
export async function renderReview(projectPath: string, outputPath: string) {
  const packageName = 'playwright'
  let chromium: any
  try { ({ chromium } = await import(packageName)) } catch { throw new Error('Rendered review requires Playwright in your project: npm install -D playwright; npx playwright install chromium') }
  let root = await realpath(resolve(projectPath))
  try {
    const project: unknown = JSON.parse(await readFile(await safeFile(root, 'project.json'), 'utf8')); validateProject(project)
    root = dirname(await safeFile(root, project.versions.find(v => v.id === project.currentVersion)!.path + '/model.json'))
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  const session = await loadProject(root)
  const assets = Object.fromEntries(session.assets.map(a => [a.source, 'data:image/' + (extname(a.relative) === '.jpg' ? 'jpeg' : extname(a.relative).slice(1)) + ';base64,' + a.bytes.toString('base64')]))
  const runtime = fileURLToPath(new URL('../', import.meta.url))
  const data = { model: session.model, assets }
  const server = createServer((req, res) => {
    void (async () => {
      try {
        if (req.url === '/') { res.setHeader('content-type', 'text/html'); res.end('<!doctype html><canvas id="avatar"></canvas>'); return }
        if (!req.url?.startsWith('/runtime/') || !req.url.endsWith('.js')) { res.writeHead(404); res.end(); return }
        const file = await safeFile(runtime, req.url.slice('/runtime/'.length)); res.setHeader('content-type', 'text/javascript'); res.end(await readFile(file))
      } catch { res.writeHead(404); res.end() }
    })()
  })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Review server failed')
  const origin = 'http://127.0.0.1:' + address.port
  let browser: any, temporary: string | undefined
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
    const errors: string[] = []; page.on('pageerror', (e: Error) => errors.push(e.message))
    await page.route('**/*', (route: any) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
    await page.goto(origin)
    // This browser function is serialized by Playwright; keep it self-contained.
    const result = await page.evaluate(async ({ model, assets }: typeof data) => {
      const runtimeUrl = '/runtime/index.js'
      const runtime = await import(runtimeUrl) as typeof import('../index.js')
      const images: { id: string; png: string }[] = []
      const m = structuredClone(model), size = m.version === 1 ? m.texture : m.source
      if (m.version === 1) m.texture.src = assets[m.texture.src]
      else { m.source.fallback = assets[m.source.fallback]; m.atlases.forEach(a => { a.src = assets[a.src] }) }
      const canvas = document.getElementById('avatar') as HTMLCanvasElement
      const scale = Math.min(900 / size.width, 900 / size.height)
      canvas.style.width = `${size.width * 1.24 * scale}px`; canvas.style.height = `${size.height * 1.24 * scale}px`
      const poses = [...runtime.reviewPoses]
      if (m.version === 2 && m.face) poses.push(...runtime.faceReviewPoses().filter(p => p.id.startsWith('eyes') ? m.face!.eyes?.length === 2 : !!m.face!.mouth?.shapes[p.id.slice(6) as import('../layered-types.js').MouthShape]))
      for (const pose of poses) {
        const player = m.version === 1 ? await runtime.createPlayer({ canvas, model: m, manual: true, autoplay: false, pixelRatio: 1 }) : await runtime.createLayeredPlayer({ canvas, model: m, manual: true, autoplay: false, pixelRatio: 1 })
        try {
          player.reset()
          for (const step of pose.sequence) { player.setPointer(...step.pointer); if (step.face && 'setFace' in player) player.setFace(step.face); player.advance(step.milliseconds) }
          images.push({ id: pose.id, png: canvas.toDataURL('image/png') })
        } finally { player.destroy() }
      }
      const sheet = document.createElement('canvas'); sheet.width = 1200; sheet.height = Math.ceil(images.length / 4) * 340
      const ctx = sheet.getContext('2d')!; ctx.fillStyle = '#edf7fc'; ctx.fillRect(0, 0, sheet.width, sheet.height)
      for (let i = 0; i < images.length; i++) {
        const image = new Image(); image.src = images[i].png; await image.decode()
        const x = i % 4 * 300, y = Math.floor(i / 4) * 340, factor = Math.min(280/image.width, 300/image.height)
        ctx.drawImage(image,x+(300-image.width*factor)/2,y+30,image.width*factor,image.height*factor)
        ctx.fillStyle = '#183b50'; ctx.font = '14px sans-serif'; ctx.fillText(images[i].id,x+10,y+20)
        // The face region stays in full-source coordinates, including padding.
        const bounds = m.version === 1 ? m.pose.headFollow?.region : m.face?.eyes?.flatMap(e => [...e.top,...e.bottom])
        const points = bounds?.length ? bounds : [[.25,.05],[.75,.4]]
        const left = Math.max(0,Math.min(...points.map(p=>p[0]))-.05), top = Math.max(0,Math.min(...points.map(p=>p[1]))-.05)
        const right = Math.min(1,Math.max(...points.map(p=>p[0]))+.05), bottom = Math.min(1,Math.max(...points.map(p=>p[1]))+.1)
        const crop = document.createElement('canvas'); crop.width=600; crop.height=Math.round(600*(bottom-top)*size.height/((right-left)*size.width))
        crop.getContext('2d')!.drawImage(image,(left+.12)/1.24*image.width,(top+.12)/1.24*image.height,(right-left)/1.24*image.width,(bottom-top)/1.24*image.height,0,0,crop.width,crop.height);
        (images[i] as { id: string; png: string; crop?: string }).crop=crop.toDataURL('image/png')
      }
      return { images: images as { id: string; png: string; crop?: string }[], sheet: sheet.toDataURL('image/png'), poses }
    }, data)
    if (errors.length) throw new Error(errors.join('\n'))
    const destination = resolve(outputPath)
    try { await lstat(destination); throw new Error('Review output already exists; choose a new folder') } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    await mkdir(dirname(destination), { recursive: true }); temporary = await mkdtemp(join(dirname(destination), '.review-'))
    const { writeFile } = await import('node:fs/promises')
    const save = (id: string, png: string) => writeFile(join(temporary!, id + '.png'), Buffer.from(png.split(',')[1], 'base64'))
    for (const image of result.images) { await save(image.id, image.png); if (image.crop) await save(image.id + '-detail', image.crop) }
    await save('contact-sheet', result.sheet)
    await writeFile(join(temporary, 'poses.json'), JSON.stringify({ version: 1, fingerprint: session.sourceFingerprint, assetFingerprint: session.assetFingerprint, fixedFps: 60, visualAcceptance: 'not-run', poses: result.poses }, null, 2))
    await rename(temporary, destination); temporary = undefined
    return { path: destination, poses: result.images.length, visualAcceptance: 'not-run' }
  } finally {
    await browser?.close(); await new Promise<void>((done, reject) => server.close(e => e ? reject(e) : done()))
    if (temporary) await rm(temporary, { recursive: true, force: true })
  }
}
