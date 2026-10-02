import test from 'node:test'
import assert from 'node:assert/strict'
import { createSSRApp, h } from 'vue'
import { renderToString as renderVue } from '@vue/server-renderer'
import { createElement } from 'react'
import { renderToString as renderReact } from 'react-dom/server'
import { YuragiCharacter as VueCharacter } from '../src/vue.js'
import { YuragiCharacter as ReactCharacter } from '../src/react.js'
import { createMomoModel } from '../src/index.js'

test('Vue adapter is safe to render on the server and provides fallback art', async () => {
  const html = await renderVue(createSSRApp({ render: () => h(VueCharacter, { model: createMomoModel(), alt: 'Momo test' }) }))
  assert.match(html, /Momo test/)
  assert.match(html, /texture.webp/)
  assert.match(html, /canvas/)
})

test('React adapter is safe to render on the server and provides fallback art', () => {
  const html = renderReact(createElement(ReactCharacter, { model: createMomoModel(), alt: 'Momo test' }))
  assert.match(html, /Momo test/)
  assert.match(html, /texture.webp/)
  assert.match(html, /canvas/)
})
