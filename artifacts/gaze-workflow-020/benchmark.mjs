import {build} from 'esbuild'
import {gzipSync} from 'node:zlib'
import {readFileSync,writeFileSync} from 'node:fs'
import {performance} from 'node:perf_hooks'
const label=process.argv[2] ?? 'after'
const bundle=await build({entryPoints:['packages/rig/src/index.ts'],bundle:true,minify:true,format:'esm',write:false})
const {createSimulation}=await import('../../packages/rig/src/simulation.ts')
const {createFaceState}=await import('../../packages/rig/src/face.ts')
const model=JSON.parse(readFileSync('artifacts/mirea-sandbox/model.json','utf8'))
const runs=[]
for(let r=0;r<3;r++){
 const sim=createSimulation(model),mesh=sim.buildContinuousMesh(),face=createFaceState(model.face)
 let start=0
 for(let i=0;i<1500;i++){
  if(i===300)start=performance.now()
  sim.setPointer(i%120<60?.5:-.5,i%180<90?.5:-.5);face.setGaze(i%120<60?1:-1,0)
  sim.updatePins(i*16.67,16.67);face.update(16.67);sim.updateVertices(mesh,i*16.67);face.snapshot(sim.parameters.lookX,sim.parameters.lookY)
 }
 runs.push((performance.now()-start)/1200)
}
const result={label,node:process.version,platform:process.platform,coreGzipBytes:gzipSync(bundle.outputFiles[0].contents).length,frameMs:runs,medianFrameMs:[...runs].sort((a,b)=>a-b)[1],scope:'CPU simulation, mesh and gaze state; excludes browser/GPU upload and rendering; 300 warmup + 1200 frames, three runs on same host'}
writeFileSync(`artifacts/gaze-workflow-020/${label}-benchmark.json`,JSON.stringify(result,null,2)+'\n');console.log(result)
