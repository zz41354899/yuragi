import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'

// Vite's static Markdown MIME type omits a charset. Browsers can then guess Big5
// for Traditional Chinese instead of decoding the UTF-8 skill resources.
function skillMarkdownUtf8(): Plugin {
  const middleware = (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const pathname = request.url?.split('?')[0] ?? ''
    if (pathname.startsWith('/.well-known/skills/') && /\.md$/i.test(pathname)) {
      response.setHeader('Content-Type', 'text/plain; charset=utf-8')
    }
    next()
  }
  return {
    name: 'skill-markdown-utf8',
    configureServer(server) { server.middlewares.use(middleware) },
    configurePreviewServer(server) { server.middlewares.use(middleware) },
  }
}

export default defineConfig({
  plugins: [vue(), skillMarkdownUtf8()],
  resolve: { alias: [
    { find: '@z7589xxz758/yuragi/mirea', replacement: fileURLToPath(new URL('../../packages/rig/src/mirea.ts', import.meta.url)) },
    { find: '@z7589xxz758/yuragi/vue', replacement: fileURLToPath(new URL('../../packages/rig/src/vue.ts', import.meta.url)) },
    { find: '@z7589xxz758/yuragi/react', replacement: fileURLToPath(new URL('../../packages/rig/src/react.tsx', import.meta.url)) },
    { find: '@z7589xxz758/yuragi', replacement: fileURLToPath(new URL('../../packages/rig/src/index.ts', import.meta.url)) },
  ] },
})
