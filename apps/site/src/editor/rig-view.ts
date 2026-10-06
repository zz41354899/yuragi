import type { DeformationPart, RigMeshSnapshot, RigModel, Vec2 } from '@z7589xxz758/yuragi'
import { meshPoint } from './mesh-view'

export interface RigRegion { id: string; name: string; polygon: Vec2[]; color: string }

/** The same authored part, rigid-region, head and neck outlines used in the Mirea sandbox. */
export function rigRegions(model: RigModel, parts: DeformationPart[] = model.parts ?? []): RigRegion[] {
  const head = model.pose.headFollow
  return [
    ...parts.map(part => ({ id: part.id, name: part.name ?? part.id, polygon: part.polygon })),
    ...(model.surfaceRegions ?? []).map(region => ({ id: region.id, name: region.id, polygon: region.polygon })),
    ...(head?.region ? [{ id: 'head-motion', name: '頭部整體', polygon: head.region }] : []),
    ...(head?.neck ? [{ id: 'neck-bridge', name: '頸部銜接', polygon: head.neck.polygon }] : []),
  ].map((region, index) => ({ ...region, color: `hsl(${index * 41 % 360} 85% 75%)` }))
}

/** Sample along source edges so outlines follow the rendered surface during playback. */
export function rigOutline(points: Vec2[], model: RigModel, mesh?: RigMeshSnapshot, closed = true): string {
  const sampled: Vec2[] = []
  const edges = closed ? points.length : points.length - 1
  for (let i = 0; i < edges; i++) {
    const a = points[i], b = points[(i + 1) % points.length]
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]) * model.mesh.columns, Math.abs(b[1] - a[1]) * model.mesh.rows) * 2))
    for (let step = 0; step < steps; step++) {
      const t = step / steps
      const source: Vec2 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      sampled.push(mesh ? meshPoint(mesh, model.mesh.columns, model.mesh.rows, source) : source)
    }
  }
  if (!closed && points.length) {
    const last = points[points.length - 1]
    sampled.push(mesh ? meshPoint(mesh, model.mesh.columns, model.mesh.rows, last) : last)
  }
  return sampled.map(([x, y]) => `${x * 100},${y * 100}`).join(' ')
}
