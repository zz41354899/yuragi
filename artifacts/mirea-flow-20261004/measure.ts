import { readFileSync, writeFileSync } from 'node:fs'
import { createSimulation, type RigModel } from '../../packages/rig/src/index.js'
import { createMireaModel } from '../../packages/rig/src/mirea.js'
const before = JSON.parse(readFileSync(new URL('./model-before.json',import.meta.url),'utf8')) as RigModel
const models = { before, after: createMireaModel() }
const profile = (m:RigModel) => ({motion:m.motion,tracking:m.tracking,groups:m.pointerGroups!.map(p=>({id:p.id,response:p.response})),parts:m.parts!.map(p=>({id:p.id,rotation:p.rotation,stiffness:p.stiffness,damping:p.damping,follow:p.follow}))})
const baseline:Record<string,unknown> = {}
for(const [name,model] of Object.entries(models)) {
 const sim=createSimulation(model),mesh=sim.buildContinuousMesh(),frames=[]
 let minimumArea=1,maximumGradient=0
 for(let frame=1;frame<=600;frame++) {
  if(frame===61)sim.setPointer(.5,-.5)
  if(frame===121)sim.setPointer(-.5,.5)
  if(frame===181)sim.setPointer(0,0)
  sim.updatePins(frame*1000/60,1000/60)
  const diagnostics=sim.updateVertices(mesh,frame*1000/60)
  maximumGradient=Math.max(maximumGradient,diagnostics.maxDisplacementGradient)
  for(let t=0;t<mesh.indices.length;t+=3){
   const [a,b,c]=[mesh.indices[t]*2,mesh.indices[t+1]*2,mesh.indices[t+2]*2]
   const area=(v:Float32Array)=>(v[b]-v[a])*(v[c+1]-v[a+1])-(v[b+1]-v[a+1])*(v[c]-v[a])
   minimumArea=Math.min(minimumArea,area(mesh.positions)/area(mesh.rest))
  }
  if([60,61,66,78,120,126,180,181,198,240,360,600].includes(frame))frames.push({frame,look:sim.parameters.lookX,positions:Array.from(mesh.positions).filter((_,i)=>i%509===0),parts:sim.parts.states.map(s=>s.rotation)})
 }
 baseline[name]={profile:profile(model),frames,minimumArea,maximumGradient}
 console.log(name,JSON.stringify({minimumArea,maximumGradient,look:frames.map(f=>[f.frame,f.look])}))
}
writeFileSync(new URL('../../packages/rig/test/fixtures/mirea-flow-baseline.json',import.meta.url),JSON.stringify(baseline,null,2)+'\n')
