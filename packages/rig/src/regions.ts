import type { Binding, RigModel, Vec2 } from './types.js'

const clamp = (v: number) => Math.max(0, Math.min(1, v))
export function regionInfluence(polygon: Vec2[], feather: number, aspect: number, x: number, normalizedY: number) {
  const y = normalizedY * aspect
  let inside = false, distance = Infinity
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay0] = polygon[j], [bx, by0] = polygon[i], ay = ay0 * aspect, by = by0 * aspect
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside
    const dx = bx - ax, dy = by - ay
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))
    distance = Math.min(distance, Math.hypot(x - ax - t * dx, y - ay - t * dy))
  }
  const t = clamp(distance / feather)
  return inside ? 1 : 1 - t * t * (3 - 2 * t)
}

/** Outside feathering preserves a rigid interior, including its edge vertices. */
export function bindSurfaceRegions(model: RigModel, rest: Float32Array): Binding {
  const aspect = model.texture.height / model.texture.width
  const offsets = new Uint32Array(rest.length / 2 + 1), indices: number[] = [], weights: number[] = []
  for (let v = 0; v < rest.length / 2; v++) {
    const x = rest[v * 2], y = rest[v * 2 + 1] * aspect
    const start = weights.length
    for (const [index, region] of (model.surfaceRegions ?? []).entries()) {
      const weight = regionInfluence(region.polygon, region.feather, aspect, x, y / aspect)
      if (weight > .00001) { indices.push(index); weights.push(weight) }
    }
    let owner = -1, remaining = 1
    for (let i = start; i < weights.length; i++) { if (weights[i] === 1) owner = i; remaining *= 1 - weights[i] }
    if (owner >= 0) {
      for (let i = start; i < weights.length; i++) weights[i] = i === owner ? 1 : 0
    } else {
      // Relative ownership increases smoothly toward a fully protected interior.
      const scores = weights.slice(start).map(w => w / (1 - w))
      const sum = scores.reduce((a,b) => a+b,0)
      for (let i = start; i < weights.length; i++) weights[i] = scores[i-start] / sum * (1-remaining)
    }
    offsets[v + 1] = indices.length
  }
  return { offsets, indices: new Uint16Array(indices), weights: new Float32Array(weights) }
}
