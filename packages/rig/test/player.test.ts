import { createTestModel } from './fixtures/model.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlayer } from '../src/index.js'
import { faceModel } from './fixtures/face.js'
import { createMireaModel } from '../src/mirea.js'
import { createSimulation } from '../src/simulation.js'

function environment(reduced = false, failImage = false) {
  const saved = new Map<string, PropertyDescriptor | undefined>()
  function install(name: string, value: unknown) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  }
  const scheduled = new Map<number, FrameRequestCallback>()
  let nextFrame = 0, disconnected = 0, created = 0, deleted = 0
  let submittedPositions: number[] = [], submittedIndices: number[] = []
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
    uniform1i() {}, uniform4f() {}, uniform2f() {}, enable() {}, blendFunc() {}, bindBuffer() {}, bufferData(target: number, data: ArrayLike<number>) { if(target===6)submittedIndices=Array.from(data) }, bindTexture() {},
    pixelStorei() {}, texParameteri() {}, texImage2D() {}, viewport() {}, clearColor() {}, clear() {},
    bufferSubData(_target: number, _offset: number, data: ArrayLike<number>) { submittedPositions=Array.from(data) }, enableVertexAttribArray() {}, vertexAttribPointer() {}, drawElements() {},
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
    geometry: () => ({ positions:submittedPositions,indices:submittedIndices }),
    step(time: number) { const entries = [...scheduled]; scheduled.clear(); for (const [, fn] of entries) fn(time) },
    changeMedia(value: boolean) { media.matches = value; for (const fn of listeners.get('change') ?? []) fn(new Event('change')) },
    stats: () => ({ frames: scheduled.size, disconnected, created, deleted, listeners: [...listeners.values()].reduce((n, set) => n + set.size, 0) }),
    restore() { for (const [name, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name) } },
  }
}

test('player owns one animation loop and releases every resource on idempotent destroy', async () => {
  const env = environment()
  try {
    const player = await createPlayer({ canvas: env.canvas, model: createTestModel() })
    assert.equal(env.stats().frames, 1)
    env.step(16); env.step(33)
    const allocations=env.stats().created
    player.setTracking({translation:[.045,.027],bodyFollow:0})
    assert.equal(env.stats().created,allocations)
    assert.equal(env.stats().frames,1)
    assert.throws(()=>player.setTracking({damping:Infinity}))
    assert.deepEqual(player.getModel().tracking?.translation,[.045,.027])
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
    player.setTracking({translation:[0,0]})
    const stats = env.stats()
    assert.equal(stats.frames, 0); assert.equal(stats.listeners, 0)
    assert.equal(stats.created, stats.deleted); assert.equal(stats.disconnected, 2)
  } finally { env.restore() }
})

test('reduced motion draws a static frame and responds to preference changes', async () => {
  const env = environment(true)
  try {
    const player = await createPlayer({ canvas: env.canvas, model: createTestModel() })
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
    await assert.rejects(createPlayer({ canvas: env.canvas, model: createTestModel() }), /Unable to load/)
    assert.equal(env.stats().created, 0); assert.equal(env.stats().listeners, 0)
  } finally { env.restore() }
})

test('part snapshots stay low-frequency, reset spring state and respect reduced motion', async () => {
  const env = environment()
  try {
    const model = createTestModel()
    model.parts = [{ id:'cloth', kind:'cloth', polygon:[[.05,.4],[.4,.4],[.4,.9],[.05,.9]],
      root:[.22,.4], tip:[.22,.85], feather:.03, rotation:.05,
      stiffness:.04, damping:.93, phase:1, wind:1, follow:1 }]
    let reports = 0
    const player = await createPlayer({ canvas:env.canvas, model, onFrame:()=>reports++ })
    for (let frame=1;frame<=60;frame++) env.step(frame*16.67)
    assert.ok(reports<20)
    assert.equal(player.getSnapshot().parts?.length,1)
    assert.ok(Math.abs(player.getSnapshot().parts![0].rotation)>.001)
    const allocated = env.stats().created
    const root: [number,number] = [.24,.42]
    player.setPart('cloth',{root,rotation:.025})
    root[0]=.9
    assert.equal(player.getModel().parts![0].root[0],.24)
    assert.equal(player.getSnapshot().parts![0].rotation,0)
    assert.equal(env.stats().created,allocated)
    const before=player.getModel()
    assert.throws(()=>player.setPart('cloth',{rotation:Infinity}))
    assert.throws(()=>player.setPart('missing',{rotation:.02}))
    assert.deepEqual(player.getModel(),before)
    player.reset(); assert.equal(player.getSnapshot().parts![0].rotation,0)
    env.changeMedia(true); assert.equal(player.getSnapshot().parts![0].rotation,0)
    assert.equal(player.getSnapshot().playing,false)
    player.destroy(); player.destroy()
    assert.equal(env.stats().created,env.stats().deleted)
    assert.equal(env.stats().frames,0)
  } finally { env.restore() }
})

test('aborted load and abort after initialization clean up safely', async () => {
  const env = environment()
  try {
    const cancelled = new AbortController(); cancelled.abort()
    await assert.rejects(createPlayer({ canvas: env.canvas, model: createTestModel(), signal: cancelled.signal }), { name: 'AbortError' })
    const active = new AbortController()
    const player = await createPlayer({ canvas: env.canvas, model: createTestModel(), signal: active.signal })
    active.abort()
    assert.equal(player.getSnapshot().playing, false)
    assert.equal(env.stats().frames, 0); assert.equal(env.stats().created, env.stats().deleted)
  } finally { env.restore() }
})


test('face and timeline APIs freeze with pause, seek deterministically, stay static in reduced motion and clean up', async()=>{
 const env=environment()
 try {
  const player=await createPlayer({canvas:env.canvas,model:faceModel()})
  player.setGaze(1,-1);env.step(16);env.step(96)
  assert.ok(player.getSnapshot().face!.gaze[0]>.5)
  const before=player.getSnapshot().face
  assert.throws(()=>player.setGazeStrength(Infinity));assert.throws(()=>player.setGaze(Infinity,0));assert.deepEqual(player.getSnapshot().face,before)
  assert.equal('blink' in player,false);assert.equal('setExpression' in player,false)
  const count=env.stats().created
  player.playAnimation({id:'gaze',duration:1000,tracks:[{target:'gaze',name:'strength',keys:[{time:0,value:0},{time:1000,value:1}]}]})
  env.step(220);const time=player.getSnapshot().animation!.time;player.pause();env.step(900);assert.equal(player.getSnapshot().animation!.time,time)
  player.pauseAnimation();player.seekAnimation(500);assert.equal(player.getSnapshot().face!.strength,.5);assert.equal(player.getSnapshot().animation!.time,500)
  assert.equal(env.stats().created,count);assert.throws(()=>player.playAnimation({id:'bad',duration:1000,tracks:[{target:'parameter',name:'lookX',keys:[{time:0,value:99}]}]}))
  assert.equal(player.getSnapshot().animation!.id,'gaze')
  env.changeMedia(true);assert.deepEqual(player.getSnapshot().face,{gaze:[0,0],strength:0})
  player.reset();assert.equal(player.getSnapshot().animation,undefined);player.destroy();player.destroy()
  assert.equal(env.stats().created,env.stats().deleted);assert.equal(env.stats().frames,0)
 }finally{env.restore()}
})

test('motion weight timeline works on legacy fixture, seeks exact weights and reports static reduced state', async () => {
 const env=environment()
 try {
  const player=await createPlayer({canvas:env.canvas,model:createTestModel()})
  player.playAnimation({id:'whole-motion',duration:1000,tracks:[{target:'motion',name:'weight',keys:[{time:0,value:0},{time:1000,value:1}]}]})
  assert.equal(player.getSnapshot().motionWeight,0)
  player.pauseAnimation();player.seekAnimation(500);assert.equal(player.getSnapshot().motionWeight,.5)
  assert.equal(player.getModel().motion.weight,.5)
  env.changeMedia(true);assert.equal(player.getSnapshot().motionWeight,0)
  player.destroy();assert.equal(env.stats().created,env.stats().deleted)
 } finally {env.restore()}
})


test('mesh inspection copies the actual GPU submission, including motion and rebuilt pin weights', async () => {
  const env=environment()
  try {
    const player=await createPlayer({canvas:env.canvas,model:createTestModel()})
    player.setPointer(.5,-.5)
    for(let frame=1;frame<=30;frame++)env.step(frame*16.67)
    const mesh=player.getMeshSnapshot()
    assert.deepEqual(Array.from(mesh.positions),env.geometry().positions)
    assert.deepEqual(Array.from(mesh.indices),env.geometry().indices)
    assert.ok(mesh.positions.some((value,index)=>Math.abs(value-mesh.rest[index])>.001))
    assert.equal(mesh.weights.length,mesh.positions.length/2*mesh.pinNames.length)
    const original=player.getMeshSnapshot()
    mesh.positions.fill(99);mesh.rest.fill(99);mesh.indices.fill(0);mesh.weights.fill(0);mesh.pinNames.fill('changed')
    assert.deepEqual(player.getMeshSnapshot(),original)
    player.pause();player.setMotion({weight:0})
    const neutral=player.getMeshSnapshot()
    assert.deepEqual(neutral.positions,neutral.rest)
    player.setPin('head-root',{x:.56})
    const rebound=player.getMeshSnapshot()
    assert.notDeepEqual(rebound.weights,neutral.weights)
    assert.deepEqual(Array.from(rebound.positions),env.geometry().positions)
    player.destroy();player.destroy()
  } finally {env.restore()}
})

test('repeated Mirea pin and part edits report once, preserve resources and keep rendering', async () => {
  const env = environment()
  try {
    let reports = 0
    const player = await createPlayer({ canvas: env.canvas, model: createMireaModel(), autoplay: false, onFrame: () => reports++ })
    const resources = env.stats().created
    const topology = player.getMeshSnapshot().indices
    for (let edit = 0; edit < 12; edit++) {
      const before = reports
      player.setPin('head-root', { x: .57 + edit * .001, radius: .18 + edit * .005 })
      assert.equal(reports, before + 1)
      player.setPart('bang-left-outer', { root: [.509 + edit * .001, .104], rotation: .011 + edit * .001 })
      assert.equal(reports, before + 2)
      assert.ok(env.geometry().positions.every(Number.isFinite))
    }
    assert.equal(env.stats().created, resources)
    assert.deepEqual(player.getMeshSnapshot().indices, topology)
    player.play(); env.step(16); env.step(120)
    assert.equal(player.getSnapshot().playing, true)
    assert.equal(env.stats().frames, 1)
    player.destroy()
    assert.equal(env.stats().created, env.stats().deleted)
  } finally { env.restore() }
})

test('incremental pin binding matches a full rebuild, including the edited neck transition', () => {
  const sim = createSimulation(createMireaModel())
  const mesh = sim.buildContinuousMesh()
  const partBinding = mesh.partBinding, regionBinding = mesh.regionBinding, pointerBinding = mesh.pointerBinding
  for (const [name, patch] of [
    ['head-root', { x: .58, y: .22 }], ['waist', { radius: .25 }], ['head-top', { stiffness: .2 }],
  ] as const) {
    sim.setPin(name, patch); sim.rebindPin(mesh, name, patch)
    const rebuilt = sim.buildContinuousMesh()
    for (let i = 0; i < mesh.weights.length; i++) assert.ok(Math.abs(mesh.weights[i] - rebuilt.weights[i]) < 2e-7)
    assert.deepEqual(mesh.headBinding, rebuilt.headBinding)
    sim.setPointer(.4, -.3); sim.updatePins(120, 16.67)
    sim.updateVertices(mesh, 120); sim.updateVertices(rebuilt, 120)
    for (let i = 0; i < mesh.positions.length; i++) assert.ok(Math.abs(mesh.positions[i] - rebuilt.positions[i]) < 2e-7)
    assert.equal(mesh.partBinding, partBinding); assert.equal(mesh.regionBinding, regionBinding); assert.equal(mesh.pointerBinding, pointerBinding)
  }
})

test('minimum influence radii remain normalized and finite through live edits and a fresh load', () => {
  const sim = createSimulation(createMireaModel()), mesh = sim.buildContinuousMesh()
  for (const pin of sim.model.pins) {
    sim.setPin(pin.name, { radius: .005 }); sim.rebindPin(mesh, pin.name, { radius: .005 })
  }
  const fresh = sim.buildContinuousMesh()
  for (const surface of [mesh, fresh]) {
    assert.ok(surface.weights.every(Number.isFinite))
    for (let v = 0; v < surface.rest.length / 2; v++) {
      const start = v * sim.pins.length
      const sum = surface.weights.subarray(start, start + sim.pins.length).reduce((total, weight) => total + weight, 0)
      assert.ok(Math.abs(sum - 1) < 1e-6)
    }
    sim.setPointer(.5, -.5); sim.updatePins(120, 16.67); sim.updateVertices(surface, 120)
    assert.ok(surface.positions.every(Number.isFinite))
  }
})
