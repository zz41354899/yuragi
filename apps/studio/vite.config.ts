import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: [
    { find: '@z7589xxz758/yuragi/vue', replacement: fileURLToPath(new URL('../../packages/rig/src/vue.ts', import.meta.url)) },
    { find: '@z7589xxz758/yuragi', replacement: fileURLToPath(new URL('../../packages/rig/src/index.ts', import.meta.url)) },
  ] },
  build: { outDir: '../../packages/rig/studio', emptyOutDir: true },
})
