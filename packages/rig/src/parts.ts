import type { Binding, RigModel, Vec2 } from './types.js'
import { regionInfluence } from './regions.js'

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))
function smooth(low: number, high: number, value: number) {
  const t = clamp((value - low) / (high - low), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Sparse, precomputed polygon ownership; no image cropping or hidden-pixel reconstruction. */
export function createPartDynamics(model: RigModel) {
  const aspect = model.texture.height / model.texture.width
  const states = (model.parts ?? []).map(spec => ({ spec, rotation: 0, velocity: 0 }))

  function update(time: number, delta: number, lookX: number, lookVelocity: number, lookY = 0, verticalVelocity = 0) {
    const duration = clamp(delta / 16.67, 0, 3), steps = Math.max(1, Math.ceil(duration / .5)), dt = duration / steps
    for (const state of states) {
      const p = state.spec
      const breeze = Math.sin(time * .001 + p.phase) * .65 + Math.sin(time * .0017 + p.phase * 1.6) * .18
      const target = p.rotation * Math.tanh(breeze * p.wind + (lookX / 30 * .22 - lookVelocity / 2.4) * p.follow
        + (lookY / 30 * .22 - verticalVelocity / 2.4) * (p.followY ?? 0))
      for (let step = 0; step < steps; step++) {
        state.velocity = (state.velocity + (target - state.rotation) * p.stiffness * dt) * Math.pow(p.damping, dt)
        const next = state.rotation + state.velocity * dt
        state.rotation = clamp(next, -p.rotation, p.rotation)
        if (next !== state.rotation) state.velocity *= .25
      }
    }
  }

  function polygonWeight(polygon: Vec2[], x: number, y: number, feather: number) {
    let inside = false, distance = Infinity
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [ax, ay0] = polygon[j], [bx, by0] = polygon[i], ay = ay0 * aspect, by = by0 * aspect, py = y * aspect
      if ((ay > py) !== (by > py) && x < (bx - ax) * (py - ay) / (by - ay) + ax) inside = !inside
      const dx = bx - ax, dy = by - ay
      const t = clamp(((x - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1)
      distance = Math.min(distance, Math.hypot(x - ax - t * dx, py - ay - t * dy))
    }
    return inside ? smooth(0, feather, distance) : 0
  }

  function bind(rest: Float32Array): Binding {
    const offsets = new Uint32Array(rest.length / 2 + 1), indices: number[] = [], weights: number[] = []
    for (let v = 0; v < rest.length / 2; v++) {
      const x = rest[v * 2], y = rest[v * 2 + 1]
      const start = weights.length
      let sum = 0, face = 1
      for (const [cx, cy, rx, ry] of model.faceClearance) face *= smooth(.9, 1.5, Math.hypot((x - cx) / rx, (y - cy) / ry))
      for (let i = 0; i < states.length; i++) {
        const p = states[i].spec, dx = p.tip[0] - p.root[0], dy = (p.tip[1] - p.root[1]) * aspect
        const progress = ((x - p.root[0]) * dx + (y - p.root[1]) * aspect * dy) / (dx * dx + dy * dy)
        let exclusion = 1
        for (const polygon of p.exclusions ?? []) exclusion *= 1 - regionInfluence(polygon, p.feather, aspect, x, y)
        const weight = polygonWeight(p.polygon, x, y, p.feather) * smooth(0, .55, progress) * face * exclusion
        if (weight < .00001) continue
        indices.push(i); weights.push(weight); sum += weight
      }
      // Overlap blends instead of multiplying displacement at intersecting cloth/hair regions.
      for (let i = start; i < weights.length; i++) weights[i] /= Math.max(1, sum)
      offsets[v + 1] = indices.length
    }
    return { offsets, indices: new Uint16Array(indices), weights: new Float32Array(weights) }
  }

  function displacement(binding: Binding | undefined, vertex: number, x: number, y: number) {
    const gain = model.motion.parts ?? 1
    if (!binding || gain === 0) return { x: 0, y: 0 }
    let dx = 0, dy = 0
    for (let i = binding.offsets[vertex]; i < binding.offsets[vertex + 1]; i++) {
      const { spec, rotation } = states[binding.indices[i]], px = x - spec.root[0], py = (y - spec.root[1]) * aspect
      const weight = binding.weights[i] * (spec.channel ? model.motion[spec.channel] : 1), sin = Math.sin(rotation), cos = Math.cos(rotation)
      dx += (px * (cos - 1) - py * sin) * weight
      dy += (px * sin + py * (cos - 1)) / aspect * weight
    }
    return { x: dx * gain, y: dy * gain }
  }

  function reset() { for (const state of states) { state.rotation = 0; state.velocity = 0 } }
  return { states, update, bind, displacement, reset }
}
