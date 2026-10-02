import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlayer, createMomoModel } from '../src/index.js'

function environment(reduced = false, failImage = false) {
  const saved = new Map<string, PropertyDescriptor | undefined>()
  function install(name: string, value: unknown) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  }
  const scheduled = new Map<number, FrameRequestCallback>()
  let nextFrame = 0, disconnected = 0, created = 0, deleted = 0
  const listeners = new Map<string, Set<EventListener>>()
  const add = (name: string, fn: EventListener) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(fn) }
  const remove = (name: string, fn: EventListener) => listeners.get(name)?.delete(fn)
  const media = { matches: reduced, addEventListener: add, removeEventListener: remove }
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
    ARRAY_BUFFER: 5, ELEMENT_ARRAY_BUFFER: 6, DYNAMIC_DRAW: 7, STATIC_DRAW: 8,
    TEXTURE_2D: 9, UNPACK_PREMULTIPLY_ALPHA_WEBGL: 10, TEXTURE_WRAP_S: 11,
    TEXTURE_WRAP_T: 12, CLAMP_TO_EDGE: 13, TEXTURE_MIN_FILTER: 14, TEXTURE_MAG_FILTER: 15,
    LINEAR: 16, RGBA: 17, UNSIGNED_BYTE: 18, BLEND: 19, ONE: 20, ONE_MINUS_SRC_ALPHA: 21,
    COLOR_BUFFER_BIT: 22, FLOAT: 23, TRIANGLES: 24, UNSIGNED_SHORT: 25,
    createShader: () => { created++; return {} }, createProgram: () => { created++; return {} },
    createBuffer: () => { created++; return {} }, createTexture: () => { created++; return {} },
    deleteShader: () => { deleted++ }, deleteProgram: () => { deleted++ },
    deleteBuffer: () => { deleted++ }, deleteTexture: () => { deleted++ },
    getShaderParameter: () => true, getProgramParameter: () => true,
    getAttribLocation: () => 0, getUniformLocation: () => ({}), isContextLost: () => false,
    shaderSource() {}, compileShader() {}, attachShader() {}, linkProgram() {}, useProgram() {},
    uniform1i() {}, enable() {}, blendFunc() {}, bindBuffer() {}, bufferData() {}, bindTexture() {},
    pixelStorei() {}, texParameteri() {}, texImage2D() {}, viewport() {}, clearColor() {}, clear() {},
    bufferSubData() {}, enableVertexAttribArray() {}, vertexAttribPointer() {}, drawElements() {},
  }
  const canvas = {
    width: 0, height: 0, clientWidth: 446, clientHeight: 670, dataset: {},
    getContext: () => gl, addEventListener: add, removeEventListener: remove,
  } as unknown as HTMLCanvasElement
  class Observer { observe() {} disconnect() { disconnected++ } }
  class MockImage {
    naturalWidth = 1024; naturalHeight = 1536; onload: (() => void) | null = null; onerror: (() => void) | null = null
    set src(value: string) { if (value) queueMicrotask(() => { if (failImage) this.onerror?.(); else this.onload?.() }) }
  }
  install('window', { matchMedia: () => media, devicePixelRatio: 1 })
  install('document', { hidden: false, addEventListener: add, removeEventListener: remove })
  install('Image', MockImage); install('ResizeObserver', Observer); install('IntersectionObserver', Observer)
  install('requestAnimationFrame', (fn: FrameRequestCallback) => { scheduled.set(++nextFrame, fn); return nextFrame })
  install('cancelAnimationFrame', (id: number) => scheduled.delete(id))
  return {
    canvas, media,
    step(time: number) { const entries = [...scheduled]; scheduled.clear(); for (const [, fn] of entries) fn(time) },
    changeMedia(value: boolean) { media.matches = value; for (const fn of listeners.get('change') ?? []) fn(new Event('change')) },
    stats: () => ({ frames: scheduled.size, disconnected, created, deleted, listeners: [...listeners.values()].reduce((n, set) => n + set.size, 0) }),
    restore() { for (const [name, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name) } },
  }
}

test('player owns one animation loop and releases every resource on idempotent destroy', async () => {
  const env = environment()
  try {
    const player = await createPlayer({ canvas: env.canvas, model: createMomoModel() })
    assert.equal(env.stats().frames, 1)
    env.step(16); env.step(33)
    assert.equal(env.stats().frames, 1)
    player.pause(); assert.equal(env.stats().frames, 0); assert.equal(player.getSnapshot().playing, false)
    player.setParameter('lookX', 15)
    assert.ok(player.getSnapshot().parameters.lookX > 10)
    player.setPin('head-root', { x: .55 })
    const exported = player.getModel()
    assert.equal(exported.pins.find(p => p.name === 'head-root')!.x, .55)
    exported.pins[0].x = .1
    assert.equal(player.getModel().pins[0].x, .51)
    player.wave(); assert.equal(env.stats().frames, 1)
    player.destroy(); player.destroy()
    const stats = env.stats()
    assert.equal(stats.frames, 0); assert.equal(stats.listeners, 0)
    assert.equal(stats.created, stats.deleted); assert.equal(stats.disconnected, 2)
  } finally { env.restore() }
})

test('reduced motion draws a static frame and responds to preference changes', async () => {
  const env = environment(true)
  try {
    const player = await createPlayer({ canvas: env.canvas, model: createMomoModel() })
    assert.equal(player.getSnapshot().playing, false); assert.equal(env.stats().frames, 0)
    assert.ok(env.canvas.width > 0)
    env.changeMedia(false); assert.equal(player.getSnapshot().playing, true)
    env.changeMedia(true); assert.equal(player.getSnapshot().playing, false)
    player.destroy()
  } finally { env.restore() }
})

test('failed image load rejects without allocating WebGL resources', async () => {
  const env = environment(false, true)
  try {
    await assert.rejects(createPlayer({ canvas: env.canvas, model: createMomoModel() }), /Unable to load/)
    assert.equal(env.stats().created, 0); assert.equal(env.stats().listeners, 0)
  } finally { env.restore() }
})

test('aborted load and abort after initialization clean up safely', async () => {
  const env = environment()
  try {
    const cancelled = new AbortController(); cancelled.abort()
    await assert.rejects(createPlayer({ canvas: env.canvas, model: createMomoModel(), signal: cancelled.signal }), { name: 'AbortError' })
    const active = new AbortController()
    const player = await createPlayer({ canvas: env.canvas, model: createMomoModel(), signal: active.signal })
    active.abort()
    assert.equal(player.getSnapshot().playing, false)
    assert.equal(env.stats().frames, 0); assert.equal(env.stats().created, env.stats().deleted)
  } finally { env.restore() }
})
