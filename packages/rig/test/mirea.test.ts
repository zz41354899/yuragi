import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createSimulation, validateModel, type RigModel, type Vec2 } from '../src/index.js'
import { regionInfluence } from '../src/regions.js'

const model = JSON.parse(readFileSync(new URL('../../../artifacts/mirea-sandbox/model.json', import.meta.url), 'utf8')) as RigModel
const annotation = JSON.parse(readFileSync(new URL('../../../artifacts/mirea-sandbox/character-analysis.json', import.meta.url), 'utf8')) as { regions: { id: string; polygon: Vec2[] }[] }
const anatomy = annotation.regions.filter(r => /^(thigh|knee|shin|ankle|heel|toe)-/.test(r.id))
const distance = (p: Float32Array, a: number, b: number) => Math.hypot(p[a]-p[b], (p[a+1]-p[b+1])*1.5)

test('Mirea crossed legs and shoes share a rigid transform through reversals and stalls', () => {
  validateModel(model)
  const sim = createSimulation(model), mesh = sim.buildContinuousMesh()
  const guard = model.surfaceRegions!.find(r => r.id === 'lower-body-rigid')!
  assert.equal(guard.mode, 'rigid')
  assert.equal(model.parts!.some(p => p.id.startsWith('leg-')), false)
  const visible = (i: number) => anatomy.some(r => regionInfluence(r.polygon,.002,1.5,mesh.rest[i],mesh.rest[i+1])===1)
  const edges: [number,number][] = []
  for(let i=0;i<mesh.indices.length;i+=3)for(let j=0;j<3;j++) {
    const a=mesh.indices[i+j]*2,b=mesh.indices[i+(j+1)%3]*2
    if(visible(a)&&visible(b))edges.push([a,b])
  }
  assert.ok(edges.length>100)
  for(const [a,b] of edges)for(const v of [a,b])assert.equal(regionInfluence(guard.polygon,guard.feather,1.5,mesh.rest[v],mesh.rest[v+1]),1,'visible anatomy must be fully owned, including the crossed-leg overlap')
  let maxStrain=0,maxTravel=0
  for(let f=0;f<480;f++) {
    const quadrant=Math.floor(f/60)%4
    sim.setPointer(quadrant%2?.5:-.5,quadrant>1?.5:-.5)
    sim.updatePins(f*16.67,f%121===0?50:16.67)
    assert.equal(sim.updateVertices(mesh,f*16.67).motionScale,1)
    for(const [a,b] of edges) {
      maxStrain=Math.max(maxStrain,Math.abs(distance(mesh.positions,a,b)/distance(mesh.rest,a,b)-1))
      maxTravel=Math.max(maxTravel,Math.hypot(mesh.positions[a]-mesh.rest[a],(mesh.positions[a+1]-mesh.rest[a+1])*1.5))
    }
  }
  assert.ok(maxStrain<.00005,`leg edge strain ${maxStrain} must stay at Float32 precision`)
  assert.ok(maxTravel>.02,'legs still move with the pose and whole-character tracking')
  sim.updateVertices(mesh,9000,true);assert.deepEqual(mesh.positions,mesh.rest)
})

test('Mirea held arm, grip, shaft and canopy keep one transform during layered motion', () => {
  const sim=createSimulation(model),mesh=sim.buildContinuousMesh()
  const held=model.surfaceRegions!.filter(r=>['upper-body-rigid','holding-hand-rigid','umbrella-shaft-rigid','umbrella-canopy-rigid'].includes(r.id))
  assert.equal(held.length,4)
  assert.ok(held.every(r=>r.anchor==='umbrella-grip'&&r.rotation==='body'))
  const vertices:number[]=[]
  for(let i=0;i<mesh.rest.length;i+=2)if(held.some(r=>regionInfluence(r.polygon,r.feather,1.5,mesh.rest[i],mesh.rest[i+1])===1))vertices.push(i)
  assert.ok(vertices.length>100)
  let error=0
  const a=vertices[0]
  for(let f=0;f<360;f++) {
    sim.setMotion({layers:Math.floor(f/120)*.5})
    sim.setPointer(f%120<60?.5:-.5,f%180<90?.5:-.5)
    sim.updatePins(f*16.67,f%79===0?50:16.67)
    assert.equal(sim.updateVertices(mesh,f*16.67).motionScale,1)
    for(const b of vertices.slice(1))error=Math.max(error,Math.abs(distance(mesh.positions,a,b)-distance(mesh.rest,a,b)))
  }
  assert.ok(error<3e-7,`held-prop source-distance error ${error}`)
})
