import type { RigMeshSnapshot, RigModel, Vec2 } from '@z7589xxz758/yuragi'
import { meshPoint } from './mesh-view'

/** A tapered bone follows the same sampled surface as the artwork. Coordinates are source pixels. */
export function boneOutline(start: Vec2, end: Vec2, model: RigModel, mesh?: RigMeshSnapshot): string {
  const { width, height } = model.texture
  const steps = Math.max(4, Math.ceil(Math.max(Math.abs(end[0] - start[0]) * model.mesh.columns, Math.abs(end[1] - start[1]) * model.mesh.rows) * 2))
  const center: Vec2[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const source: Vec2 = [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t]
    const point = mesh ? meshPoint(mesh, model.mesh.columns, model.mesh.rows, source) : source
    center.push([point[0] * width, point[1] * height])
  }
  const left: Vec2[] = [], right: Vec2[] = []
  for (let i = 0; i < center.length; i++) {
    const before = center[Math.max(0, i - 1)], after = center[Math.min(steps, i + 1)]
    const dx = after[0] - before[0], dy = after[1] - before[1], length = Math.hypot(dx, dy)
    const radius = Math.sin(Math.PI * i / steps) * Math.min(9, Math.hypot((end[0] - start[0]) * width, (end[1] - start[1]) * height) * .08)
    const nx = length ? -dy / length * radius : 0, ny = length ? dx / length * radius : 0
    left.push([center[i][0] + nx, center[i][1] + ny]); right.push([center[i][0] - nx, center[i][1] - ny])
  }
  return [...left, ...right.reverse()].map(([x, y]) => `${x},${y}`).join(' ')
}

export function boneColor(id: string): string {
  if (/holding|umbrella/.test(id)) return '#ffe3a3'
  if (/hip|knee|ankle|toe/.test(id)) return '#d2baff'
  return '#9ef4e4'
}
