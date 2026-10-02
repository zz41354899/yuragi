import type { RigModel, Binding } from './types.js'
export function createAccessoryDynamics(model: RigModel) {
const chains = model.accessories
const aspect = model.texture.height / model.texture.width
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }


  const pins = chains.map((chain) => ({ ...chain, rotation: 0, velocity: 0 }))

  function update(time: number, deltaTime: number, lookVelocity: number, wave: number) {
    // Fixed substeps keep springs stable even after a stalled/background frame.
    const duration = clamp(deltaTime / 16.67, 0, 2)
    const steps = Math.max(1, Math.ceil(duration / .5)), dt = duration / steps
    for (const pin of pins) {
      const breeze = Math.sin(time * .0008 + pin.phase) * .28 + Math.sin(time * .0013 + pin.phase * 2) * .10
      const waveForce = pin.id === 'sleeve-right' || pin.id === 'ribbon-right'
        ? Math.sin(wave * Math.PI) * Math.sin(wave * Math.PI * 6) * .32 : 0
      const target = pin.angle * Math.tanh(-lookVelocity / 2.4 * 1.8 + breeze + waveForce)
      for (let step = 0; step < steps; step += 1) {
        pin.velocity = (pin.velocity + (target - pin.rotation) * pin.stiffness * dt) * Math.pow(pin.damping, dt)
        const next = pin.rotation + pin.velocity * dt
        pin.rotation = clamp(next, -pin.angle, pin.angle)
        if (pin.rotation !== next) pin.velocity *= .25
      }
    }
  }

  function bind(rest: Float32Array): Binding {
    const offsets = new Uint32Array(rest.length / 2 + 1), indices = [], weights = []
    for (let vertex = 0; vertex < rest.length / 2; vertex += 1) {
      const x = rest[vertex * 2], y = rest[vertex * 2 + 1]
      for (let i = 0; i < pins.length; i += 1) {
        const pin = pins[i], [rx, ry] = pin.root
        const ax = pin.tip[0] - rx, ay = (pin.tip[1] - ry) * aspect
        const length = Math.hypot(ax, ay)
        const px = x - rx, py = (y - ry) * aspect
        const progress = (px * ax + py * ay) / (length * length)
        const across = Math.abs(px * ay - py * ax) / length
        // C1-continuous falloff, including beyond the tip. Never cut weights at
        // an image boundary. The root plane has exactly zero local influence.
        const weight = smooth(.08, .70, progress) * (1 - smooth(1.05, 1.65, progress)) * (1 - smooth(.1, 1, across / pin.radius))
        if (weight < .00001) continue
        indices.push(i); weights.push(weight)
      }
      offsets[vertex + 1] = indices.length
    }
    return { offsets, indices: new Uint16Array(indices), weights: new Float32Array(weights) }
  }

  function displacement(binding: Binding, vertex: number, x: number, y: number) {
    if (model.motion.accessories === 0) return { x: 0, y: 0 }
    let dx = 0, dy = 0
    for (let i = binding.offsets[vertex]; i < binding.offsets[vertex + 1]; i += 1) {
      const pin = pins[binding.indices[i]], angle = pin.rotation * binding.weights[i]
      const px = x - pin.root[0], py = (y - pin.root[1]) * aspect
      dx += px * (Math.cos(angle) - 1) - py * Math.sin(angle)
      dy += (px * Math.sin(angle) + py * (Math.cos(angle) - 1)) / aspect
    }
    return { x: dx * model.motion.accessories, y: dy * model.motion.accessories }
  }
  return { pins, update, bind, displacement }
}
