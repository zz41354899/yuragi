import test from 'node:test'
import assert from 'node:assert/strict'
import { createSSRApp, h } from 'vue'
import { renderToString as renderVue } from '@vue/server-renderer'
import { createElement } from 'react'
import { renderToString as renderReact } from 'react-dom/server'
import { YuragiLayeredCharacter as VueCharacter } from '../src/vue.js'
import { YuragiLayeredCharacter as ReactCharacter } from '../src/react.js'
import { layeredModel } from './fixtures/layered.js'

test('layered Vue component renders the complete fallback during SSR without loading WebGL', async () => {
  const html = await renderVue(createSSRApp({ render: () => h(VueCharacter, { model: layeredModel(), alt: 'Layered fixture' }) }))
  assert.match(html, /Layered fixture/)
  assert.match(html, /fallback.png/)
  assert.match(html, /aspect-ratio:100\/200/)
  assert.match(html, /aria-hidden="true"/)
})

test('layered React component renders the complete fallback during SSR without loading WebGL', () => {
  const html = renderReact(createElement(ReactCharacter, { model: layeredModel(), alt: 'Layered fixture' }))
  assert.match(html, /Layered fixture/)
  assert.match(html, /fallback.png/)
  assert.match(html, /aspect-ratio:100\/200/)
  assert.match(html, /aria-hidden="true"/)
})
