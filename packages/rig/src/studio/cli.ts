#!/usr/bin/env node
import { renderReview } from './review-cli.js'
import { spawn } from 'node:child_process'
import { startStudio } from './server.js'
import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'

export function parseArguments(args: string[]) {
  if (args.includes('--help') || !args.length) return undefined
  if (args[0] !== 'studio') throw new Error('Usage: yuragi studio [--project folder] [--out folder] [--port number] [--no-open]')
  const options: { project?: string; out?: string; port?: number; open: boolean } = { open: true }
  for (let i = 1; i < args.length; i++) {
    const flag = args[i]
    if (flag === '--no-open') { options.open = false; continue }
    if (!['--project', '--out', '--port'].includes(flag)) throw new Error('Unknown option: ' + flag)
    const value = args[++i]
    if (!value || value.startsWith('--')) throw new Error('Missing value for ' + flag)
    if (flag === '--port') { options.port = Number(value); if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) throw new Error('Port must be 0…65535') }
    else if (flag === '--project') options.project = value
    else options.out = value
  }
  return options
}
async function main() {
  if (process.argv[2] === 'review') {
    const options = parseArguments(['studio', ...process.argv.slice(3)])
    if (!options?.project || !options.out) throw new Error('Usage: yuragi review --project folder --out NEW-folder')
    process.stdout.write(JSON.stringify(await renderReview(options.project, options.out)) + '\n'); return
  }
  const options = parseArguments(process.argv.slice(2))
  if (!options) { process.stdout.write('Yuragi Studio\n\n  yuragi studio [--project folder] [--out folder] [--port number] [--no-open]\n\nAgent-first Vue preview and review. Models v1 / v2 supported.\n  yuragi review --project folder --out NEW-folder (optional Playwright peer).\n'); return }
  const studio = await startStudio(options)
  process.stdout.write('Yuragi Studio: ' + studio.url + '\nOutput: ' + studio.out + '\nPress Ctrl+C to stop.\n')
  let stopping = false
  const stop = () => { if (stopping) return; stopping = true; void studio.close().then(() => process.exit(0)) }
  process.on('SIGINT', stop); process.on('SIGTERM', stop)
  if (options.open) {
    const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'rundll32' : 'xdg-open'
    const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', studio.url] : [studio.url]
    const child = spawn(command, args, { stdio: 'ignore', detached: true })
    child.on('error', () => process.stderr.write('Open the Studio URL above in your browser.\n')); child.unref()
  }
}
// Importing this module for CLI tests must not start a server.
if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(resolve(process.argv[1]))) void main().catch(error => { process.stderr.write(String(error) + '\n'); process.exitCode = 1 })
