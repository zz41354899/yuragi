import { createTestInteractiveModel, createTestModel } from './fixtures/model.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import {   createSimulation, validateModel } from '../src/index.js'

const rect: [number,number][] = [[.3,.4],[.65,.4],[.65,.8],[.3,.8]]
test('rigid owned pixels preserve source distances despite unrelated hair and overlapping feathers', () => {
  const model=createTestModel(); model.motion.sway=.2
  model.surfaceRegions=[
    {id:'prop',mode:'rigid',polygon:rect,feather:.15,anchor:'waist',rotation:'body'},
    {id:'nearby-face',mode:'rigid',polygon:[[.66,.4],[.8,.4],[.8,.6],[.66,.6]],feather:.15,anchor:'head-root',rotation:'head'},
  ]
  const sim=createSimulation(model), mesh=sim.buildContinuousMesh(undefined,20,30)
  sim.setPointer(.25,.2)
  for(let f=0;f<100;f++)sim.updatePins(f*16.67,16.67)
  const d=sim.updateVertices(mesh,1667); assert.equal(d.motionScale,1)
  const vertices:number[]=[]
  for(let i=0;i<mesh.rest.length;i+=2)if(mesh.rest[i]>.32&&mesh.rest[i]<.62&&mesh.rest[i+1]>.45&&mesh.rest[i+1]<.75)vertices.push(i)
  const distance=(data:Float32Array,a:number,b:number)=>Math.hypot(data[b]-data[a],(data[b+1]-data[a+1])*1.5)
  for(const b of vertices.slice(1))assert.ok(Math.abs(distance(mesh.positions,vertices[0],b)-distance(mesh.rest,vertices[0],b))<2e-7)
  sim.updateVertices(mesh,1667,true);assert.deepEqual(mesh.positions,mesh.rest)
})
test('weighted ownership excludes unrelated pins and rigid anchors cannot reference missing joints', () => {
  const model=createTestModel();model.motion={sway:0,speed:1,hair:0,accessories:0,follow:1};model.surfaceRegions=[{id:'arm',mode:'weighted',polygon:rect,feather:.04,pins:['waist'],secondary:false}]
  const sim=createSimulation(model),mesh=sim.buildContinuousMesh();sim.setParameter('wave',.35);sim.updateVertices(mesh,0)
  for(let i=0;i<mesh.rest.length;i+=2)if(mesh.rest[i]>.35&&mesh.rest[i]<.6&&mesh.rest[i+1]>.45&&mesh.rest[i+1]<.75)assert.equal(mesh.positions[i],mesh.rest[i])
  for(const patch of [{pins:['missing']},{pins:['waist','waist']},{mode:'rigid',pins:undefined,anchor:'missing'},{feather:0}])assert.throws(()=>validateModel({...model,surfaceRegions:[{...model.surfaceRegions![0],...patch}]}))
  assert.throws(()=>validateModel({...model,tracking:{response:NaN,damping:.8,maxVelocity:1}}))
})
test('interactive legacy fixture uses bounded tracking and isolated parts while retaining the original fixture factory', () => {
  const original=createTestModel(),modern=createTestInteractiveModel()
  assert.equal(original.parts,undefined);assert.equal(original.tracking,undefined);assert.equal(original.pose.headFollow,undefined)
  assert.equal(modern.parts?.length,33);assert.equal(modern.hair.length,0)
  const sim=createSimulation(modern),mesh=sim.buildContinuousMesh()
  for(let f=0;f<240;f++){
    sim.setPointer(f%120<60?.5:-.5,.5);sim.updatePins(f*16.67,16.67)
    assert.ok(Math.abs(sim.parameters.lookX)<=30&&Math.abs(sim.parameters.lookY)<=30)
    assert.equal(sim.updateVertices(mesh,f*16.67).motionScale,1)
  }
  assert.equal(createTestModel().pins[3].type,'spring')
})
