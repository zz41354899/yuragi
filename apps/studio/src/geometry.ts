import type { RigModel, Vec2 } from '@z7589xxz758/yuragi'
import type { Path } from '../../../packages/rig/src/studio/document'
export interface Handle { id: string; path: Path; point: Vec2; pin?: number }
export interface Outline { id: string; path: Path; points: Vec2[]; closed: boolean }
export function geometry(model: RigModel) {
  const handles: Handle[] = [], outlines: Outline[] = []
  function point(path: Path, value: Vec2 | undefined) { if (Array.isArray(value) && value.length === 2 && value.every(Number.isFinite)) handles.push({ id: path.join('.'), path, point: value }) }
  function polygon(path: Path, points: Vec2[] | undefined, closed = true) {
    if (!Array.isArray(points)) return
    outlines.push({ id: path.join('.'), path, points, closed }); points.forEach((p,i) => point([...path,i],p))
  }
  model.pins?.forEach((p,i) => {
    handles.push({ id: p.name, path: ['pins',i], point: [p.x,p.y], pin: i })
    const parent = model.pins.find(q => q.name === p.parent)
    if (parent) outlines.push({ id: 'bone-'+p.name, path: ['pins',i], points: [[parent.x,parent.y],[p.x,p.y]], closed: false })
  })
  model.parts?.forEach((p,i) => { polygon(['parts',i,'polygon'],p.polygon); point(['parts',i,'root'],p.root); point(['parts',i,'tip'],p.tip); p.exclusions?.forEach((v,j) => polygon(['parts',i,'exclusions',j],v)) })
  model.surfaceRegions?.forEach((r,i) => polygon(['surfaceRegions',i,'polygon'],r.polygon))
  model.hair?.forEach((h,i) => polygon(['hair',i,'points'],h.points,false))
  model.accessories?.forEach((a,i) => { point(['accessories',i,'root'],a.root); point(['accessories',i,'tip'],a.tip) })
  model.pointerGroups?.forEach((g,i) => { point(['pointerGroups',i,'pivot'],g.pivot); g.regions?.forEach((r,j) => polygon(['pointerGroups',i,'regions',j,'polygon'],r.polygon)) })
  point(['pose','bodyPivot'],model.pose?.bodyPivot); point(['pose','swayPivot'],model.pose?.swayPivot)
  polygon(['pose','headFollow','region'],model.pose?.headFollow?.region)
  polygon(['pose','headFollow','neck','polygon'],model.pose?.headFollow?.neck?.polygon)
  point(['pose','headFollow','neck','base'],model.pose?.headFollow?.neck?.base)
  model.face?.eyes?.forEach((e,i) => { point(['face','eyes',i,'center'],e.center); point(['face','eyes',i,'iris'],e.iris) })
  return { handles, outlines }
}
export function selectedPath(candidate: Path, selected: Path) { return selected.every((key,i) => candidate[i] === key) }
