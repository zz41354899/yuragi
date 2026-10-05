import { fixedSteps } from './review.js'
import { loadImage } from './image.js'
import type { PlayerOptions, RigPlayer, RigSnapshot, Diagnostics, RigMesh } from './types.js'
import { createSimulation } from './simulation.js'
import { validateModel } from './validation.js'
import { applySway } from './sway.js'
import { createFaceState } from './face.js'
import { faceFragment, uploadFace } from './face-renderer.js'
import { createTimeline } from './animation.js'
export const CANVAS_PADDING = .12
export const toCanvas = (n: number) => (n + CANVAS_PADDING) / (1 + CANVAS_PADDING * 2)


export async function createPlayer(options: PlayerOptions & { signal?: AbortSignal }): Promise<RigPlayer> {
  validateModel(options.model)
  const simulation = createSimulation(options.model)
  const face = createFaceState(simulation.model.face)
  const timeline = createTimeline((track,value)=>{
    if(track.target==='parameter'){simulation.setParameter(track.name,value);if(track.name==='lookX'||track.name==='lookY')face.followHead()}
    else if(track.target==='motion') simulation.model.motion.weight=value
    else face.setStrength(value)
  },!!simulation.model.face)
  const image = await loadImage(simulation.model.texture.src, options.signal)
  if (image.naturalWidth !== simulation.model.texture.width || image.naturalHeight !== simulation.model.texture.height) throw new Error('Texture dimensions do not match the model')
  if (options.signal?.aborted) throw new DOMException('Loading cancelled', 'AbortError')
  const canvas = options.canvas
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: !!options.manual })
  if (!gl) throw new Error('WebGL is unavailable')
  const shaders: WebGLShader[] = []
  const buffers: WebGLBuffer[] = []
  let program: WebGLProgram | null = null
  let texture: WebGLTexture | null = null
  let mesh: RigMesh
  let positionLocation = 0, uvLocation = 0
  let destroyed = false, playing = false, visible = true, lastTime = 0, elapsed = 0, frame = 0, lastReport = -100
  let diagnostics: Diagnostics = { motionScale: 1, maxDisplacementGradient: 0 }
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const reduced = () => options.reducedMotion !== 'ignore' && media.matches

  function release() {
    for (const buffer of buffers) gl!.deleteBuffer(buffer)
    for (const shader of shaders) gl!.deleteShader(shader)
    if (program) gl!.deleteProgram(program)
    if (texture) gl!.deleteTexture(texture)
  }
  function shader(type: number, source: string) {
    const value = gl!.createShader(type)
    if (!value) throw new Error('Cannot allocate shader')
    shaders.push(value); gl!.shaderSource(value, source); gl!.compileShader(value)
    if (!gl!.getShaderParameter(value, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(value) || 'Shader compile failed')
    return value
  }
  try {
    program = gl.createProgram()
    if (!program) throw new Error('Cannot allocate program')
    gl.attachShader(program, shader(gl.VERTEX_SHADER, `
      attribute vec2 a_position; attribute vec2 a_uv; varying vec2 v_uv;
      void main() {
        vec2 p = (a_position + vec2(0.12)) / 1.24;
        gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
        v_uv = a_uv;
      }
    `))
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, simulation.model.face ? faceFragment(simulation.model.face,simulation.model.texture.width,simulation.model.texture.height) : `
      precision mediump float; uniform sampler2D u_image; varying vec2 v_uv;
      void main() { gl_FragColor = texture2D(u_image, v_uv); }
    `))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Program link failed')
    gl.useProgram(program)
    positionLocation = gl.getAttribLocation(program, 'a_position')
    uvLocation = gl.getAttribLocation(program, 'a_uv')
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0)
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    mesh = simulation.buildContinuousMesh()
    for (const [data, target, usage] of [
      [mesh.positions, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW],
      [mesh.uvs, gl.ARRAY_BUFFER, gl.STATIC_DRAW],
      [mesh.indices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW],
    ] as const) {
      const buffer = gl.createBuffer()
      if (!buffer) throw new Error('Cannot allocate buffer')
      buffers.push(buffer); gl.bindBuffer(target, buffer); gl.bufferData(target, data, usage)
    }
    texture = gl.createTexture()
    if (!texture) throw new Error('Cannot allocate texture')
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  } catch (error) { release(); throw error }

  function snapshot(): RigSnapshot {
    return {
      motionWeight: reduced() ? 0 : simulation.model.motion.weight ?? 1,
      parameters: { ...simulation.parameters },
      pins: simulation.pins.map(p => ({
        name: p.name, parent: p.parent, type: p.type,
        ...(() => {
          if (reduced()) return { x: p.x, y: p.y }
          const posed = applySway(p.px, p.py, simulation.sway, simulation.model), weight = simulation.model.motion.weight ?? 1
          return { x: p.x + (posed.x - p.x) * weight, y: p.y + (posed.y - p.y) * weight }
        })(),
      })),
      diagnostics: { ...diagnostics }, sway: { ...simulation.sway }, playing,
      ...(simulation.model.face ? { face: face.snapshot(simulation.parameters.lookX,simulation.parameters.lookY,reduced()) } : {}),
      ...(timeline.snapshot() ? { animation:timeline.snapshot() } : {}),
      ...(simulation.model.tracking ? { trackingOffset: [
        reduced() ? 0 : simulation.parameters.lookX / 30 * (simulation.model.tracking.translation?.[0] ?? 0) * (simulation.model.motion.weight ?? 1),
        reduced() ? 0 : simulation.parameters.lookY / 30 * (simulation.model.tracking.translation?.[1] ?? 0) * (simulation.model.motion.weight ?? 1),
      ] as [number, number] } : {}),
      ...(simulation.parts.states.length ? { parts: simulation.parts.states.map(p => ({ id: p.spec.id, rotation: reduced() ? 0 : p.rotation })) } : {}),
      ...(simulation.pointerGroups.states.length ? { pointerGroups: simulation.pointerGroups.states.map(s => ({
        id: s.spec.id, offset: reduced() ? [0,0] : [s.dx,s.dy], rotation: reduced() ? 0 : s.rotation,
      })) } : {}),
    }
  }
  function draw(report = true) {
    if (destroyed || gl!.isContextLost()) return
    const density = Math.min(2, Math.max(1, options.pixelRatio ?? window.devicePixelRatio ?? 1))
    // CSS zoom must retain enough pixels for eyelids and pupils.
    const displayed=canvas.getBoundingClientRect?.()
    const width = Math.max(1, Math.min(4096, Math.round((displayed?.width || canvas.clientWidth) * density)))
    const height = Math.max(1, Math.min(4096, Math.round((displayed?.height || canvas.clientHeight) * density)))
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
    gl!.viewport(0, 0, width, height)
    gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT)
    diagnostics = simulation.updateVertices(mesh, elapsed, reduced())
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buffers[0]); gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, mesh.positions)
    gl!.enableVertexAttribArray(positionLocation); gl!.vertexAttribPointer(positionLocation, 2, gl!.FLOAT, false, 0, 0)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buffers[1]); gl!.enableVertexAttribArray(uvLocation); gl!.vertexAttribPointer(uvLocation, 2, gl!.FLOAT, false, 0, 0)
    gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, buffers[2]); gl!.bindTexture(gl!.TEXTURE_2D, texture)
    const facePose=face.snapshot(simulation.parameters.lookX,simulation.parameters.lookY,reduced())
    if(facePose)uploadFace(gl!,program!,facePose)
    gl!.drawElements(gl!.TRIANGLES, mesh.indices.length, gl!.UNSIGNED_SHORT, 0)
    canvas.dataset.motionScale = String(diagnostics.motionScale)
    canvas.dataset.playing = String(playing)
    if (report && options.onFrame) options.onFrame(snapshot())
  }
  function tick(time: number) {
    if (destroyed || !playing) return
    frame = requestAnimationFrame(tick)
    if (!visible || document.hidden || reduced()) { lastTime = 0; return }
    const dt = Math.min(lastTime ? time - lastTime : 16.67, 50)
    if (dt < 15 && lastTime) return
    lastTime = time; step(dt)
    draw(time - lastReport >= 100)
    if (time - lastReport >= 100) lastReport = time
  }
  function step(dt: number) { elapsed += dt; timeline.update(dt); face.update(dt); simulation.updatePins(elapsed, dt) }
  function play() {
    if (destroyed || playing || reduced()) return
    playing = true; lastTime = 0; if (!options.manual) frame = requestAnimationFrame(tick); draw()
  }
  function pause() {
    playing = false; cancelAnimationFrame(frame); lastTime = 0; draw()
  }
  function settle() {
    if (playing || destroyed || options.manual) return
    for (let i = 0; i < 30; i++) simulation.updatePins(elapsed, 0)
    face.settle()
    draw()
  }
  const resize = new ResizeObserver(() => draw())
  resize.observe(canvas)
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; lastTime = 0 }, { rootMargin: '160px' })
  intersection.observe(canvas)
  const visibility = () => { lastTime = 0 }
  const motionChange = () => { if (reduced()) pause(); else if (options.autoplay !== false) play(); draw() }
  const contextLost = (event: Event) => {
    event.preventDefault(); pause()
    options.onError?.(new Error('WebGL context lost. Remount the player to restore it.'))
  }
  document.addEventListener('visibilitychange', visibility)
  media.addEventListener('change', motionChange)
  canvas.addEventListener('webglcontextlost', contextLost)
  const player: RigPlayer = {
    play, pause,
    advance(milliseconds) { if (destroyed) return; fixedSteps(milliseconds, step); const report = elapsed-lastReport >= 100; draw(report); if(report)lastReport=elapsed },
    setPointer(x, y) {
      if (destroyed) return
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Pointer coordinates must be finite')
      simulation.setPointer(x, y); face.setGaze(x*2,y*2); settle()
    },
    setGaze(x,y){if(destroyed)return;if(!simulation.model.face)throw new Error('This model has no reviewed face features');if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Gaze coordinates must be finite');face.setGaze(x,y);settle()},
    setParameter(name, value) {
      if (destroyed) return
      if (!Number.isFinite(value) || !simulation.setParameter(name, value)) throw new Error('Invalid parameter')
      if(name==='lookX'||name==='lookY')face.followHead()
      settle()
    },
    setMotion(settings) { if (!destroyed) { simulation.setMotion(settings); simulation.updatePins(elapsed, 0); draw() } },
    setTracking(settings) { if (!destroyed) { simulation.setTracking(settings); settle(); draw() } },
    setGazeStrength(value) { if (!destroyed) { face.setStrength(value); settle(); draw() } },
    playAnimation(clip) { if (!destroyed) { timeline.play(clip); play(); draw() } },
    pauseAnimation() { if(!destroyed){timeline.pause();draw()} },
    seekAnimation(time) { if(!destroyed){timeline.seek(time);face.settle();for(let i=0;i<30;i++)simulation.updatePins(elapsed,0);draw()} },
    stopAnimation() { if(!destroyed){timeline.stop();draw()} },
    setPin(name, patch) {
      if (destroyed) return
      simulation.setPin(name, patch); simulation.rebindPin(mesh, name, patch)
      if (playing) draw(); else settle()
    },
    setPart(id, patch) {
      if (destroyed) return
      simulation.setPart(id, patch)
      if (['root','tip','polygon','exclusions','feather'].some(key => key in patch)) mesh.partBinding = simulation.parts.bind(mesh.rest)
      if (playing) draw(); else settle()
    },
    wave() { if (!destroyed) { simulation.wave(elapsed); if (!playing) play() } },
    reset() {
      if (destroyed) return
      const previousMotion = { ...simulation.model.motion }
      for (const p of simulation.pins) { p.px = p.x; p.py = p.y; p.vx = 0; p.vy = 0 }
      for (const p of simulation.hair.pins) { p.dx = 0; p.dy = 0; p.vx = 0; p.vy = 0 }
      for (const p of simulation.accessories.pins) { p.rotation = 0; p.velocity = 0 }
      elapsed = 0; lastReport = -100; simulation.reset(); simulation.velocity.lookX = 0; simulation.velocity.lookY = 0
      timeline.stop(); face.reset()
      Object.assign(simulation.parameters, { lookX: 0, lookY: 0, bodyX: 0, wave: 0 })
      simulation.setMotion(previousMotion); draw()
    },
    getModel: () => structuredClone(simulation.model),
    getSnapshot: snapshot,
    getMeshSnapshot: () => ({
      rest: mesh.rest.slice(), positions: mesh.positions.slice(), indices: mesh.indices.slice(),
      weights: mesh.weights.slice(), pinNames: simulation.pins.map(pin => pin.name),
    }),
    destroy() {
      if (destroyed) return
      pause(); destroyed = true
      resize.disconnect(); intersection.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      media.removeEventListener('change', motionChange)
      canvas.removeEventListener('webglcontextlost', contextLost)
      options.signal?.removeEventListener('abort', player.destroy)
      release()
    },
  }
  options.signal?.addEventListener('abort', player.destroy, { once: true })
  draw()
  if (options.autoplay !== false) play()
  return player
}
