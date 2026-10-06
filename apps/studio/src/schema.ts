import type { Json, Path } from '../../../packages/rig/src/studio/document'
import type { RigModel, Vec2 } from '@z7589xxz758/yuragi'
export const polygon: Vec2[] = [[.35,.35],[.65,.35],[.65,.65],[.35,.65]]
const part = { id: 'new-part', name: 'New part', kind: 'hair', polygon, root: [.5,.35], tip: [.5,.65], feather: .02, rotation: .05, stiffness: .04, damping: .75, phase: 0, wind: .1, follow: .1 }
const eye = (id: string) => ({ id, center: [id === 'left' ? .45 : .55,.25], radius: [.015,.012], iris: [id === 'left' ? .45 : .55,.25], irisRadius: [.006,.005], travel: [.003,.002], angle: 0, sclera: [.95,.95,.95] })
/** New geometry is a visible editable draft, never claimed to be measured anatomy. */
export function optionalFields(path: Path, model: RigModel): Record<string, Json> {
  const key = path.join('.')
  if (!path.length) return { parts: [], surfaceRegions: [], pointerGroups: [], tracking: { response: .024, damping: .65, maxVelocity: 1.8, bodyFollow: 0, translation: [0,0] }, face: { eyes: [eye('left'),eye('right')] } }
  if (/^pins\.\d+$/.test(key)) return { parent: model.pins[0]?.name ?? '', stiffness: .04, damping: .75, wind: .1 }
  if (/^parts\.\d+$/.test(key)) return { name: 'Part', channel: 'hair', exclusions: [], followY: 0 }
  if (/^surfaceRegions\.\d+$/.test(key)) return model.surfaceRegions?.[Number(path[1])]?.mode === 'weighted' ? { pins: [model.pins[0]?.name ?? ''], secondary: false } : { anchor: model.pins[0]?.name ?? '', rotation: 'none', secondary: false }
  if (key === 'pose') return { headWarpBounds: [.1,.3], headFollow: { region: polygon, feather: .02, rotation: .05, translation: [.005,.005] } }
  if (key === 'pose.headFollow') return { region: polygon, feather: .02, neck: { polygon, base: [.5,.45], feather: .02 } }
  if (/^pointerGroups\.\d+$/.test(key)) return { name: 'Pointer group' }
  if (key === 'tracking') return { bodyFollow: 0, translation: [0,0] }
  if (key === 'motion') return { weight: 1, parts: 1, layers: 1 }
  return {}
}
export function arrayItem(path: Path, model: RigModel): Json | undefined {
  const key = path.join('.')
  const serial = Date.now().toString(36)
  if (key === 'pins') return { name: 'pin-' + serial, type: 'fixed', x: .5, y: .5, radius: .08 }
  if (key === 'parts') return { ...part, id: 'part-' + serial }
  if (key === 'surfaceRegions') return { id: 'region-' + serial, polygon, feather: .02, mode: 'rigid', anchor: model.pins[0]?.name ?? '', rotation: 'none' }
  if (key === 'pointerGroups') return { id: 'group-' + serial, pivot: [.5,.5], regions: [{ polygon, feather: .02 }], translation: [0,0], rotation: 0, response: 120 }
  if (/^pointerGroups\.\d+\.regions$/.test(key)) return { polygon, feather: .02 }
  if (key.endsWith('exclusions')) return polygon
  if (key.endsWith('polygon') || key.endsWith('region')) return [.5,.5]
  if (key === 'hair') return { id: 'hair-' + serial, points: [[.4,.3],[.45,.5],[.5,.7]], phase: 0, radius: .08, gain: .2 }
  if (key === 'accessories') return { id: 'accessory-' + serial, root: [.4,.3], tip: [.5,.7], radius: .08, angle: .1, stiffness: .04, damping: .75, phase: 0 }
  if (key === 'faceClearance') return [.5,.25,.08,.06]
  return undefined
}
export function choices(path: Path, model: RigModel): string[] | undefined {
  const key = path.join('.')
  if (key.endsWith('.type')) return ['fixed','joint','spring']
  if (key.endsWith('.kind')) return ['hair','cloth','ribbon','accessory']
  if (key.endsWith('.channel')) return ['hair','accessories']
  if (key.endsWith('.mode')) return ['rigid','weighted']
  if (key.endsWith('.rotation') && key.startsWith('surfaceRegions')) return ['none','head','body']
  if (key.endsWith('.parent') || key.endsWith('.anchor') || /^surfaceRegions\.\d+\.pins\.\d+$/.test(key)) return model.pins.map(p => p.name)
  if (key.endsWith('.id') && key.startsWith('face.')) return ['left','right']
  return undefined
}
