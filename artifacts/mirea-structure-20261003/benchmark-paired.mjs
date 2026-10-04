import {readFileSync,writeFileSync} from 'node:fs'
import {performance} from 'node:perf_hooks'
import {build} from 'esbuild'
import {gzipSync} from 'node:zlib'
import {createSimulation} from '../../packages/rig/src/simulation.ts'
import {createFaceState} from '../../packages/rig/src/face.ts'
const after=JSON.parse(readFileSync('artifacts/mirea-sandbox/model.json','utf8'))
const before=structuredClone(after)
for(const pin of before.pins)if(['umbrella-grip','umbrella-canopy','feet-anchor','resting-hand'].includes(pin.name))delete pin.parent
const runs={before:[],after:[]}
function measure(model){
 const sim=createSimulation(model),mesh=sim.buildContinuousMesh(),face=createFaceState(model.face)
 let start=0
 for(let i=0;i<1500;i++){
  if(i===300)start=performance.now()
  sim.setPointer(i%120<60?.5:-.5,i%180<90?.5:-.5);face.setGaze(i%120<60?1:-1,0)
  sim.updatePins(i*16.67,16.67);face.update(16.67);sim.updateVertices(mesh,i*16.67);face.snapshot(sim.parameters.lookX,sim.parameters.lookY)
 }
 return {ms:(performance.now()-start)/1200,positions:mesh.positions}
}
let maxDifference=0
for(let run=0;run<3;run++){
 const pair={}
 for(const key of run%2 ? ['after','before'] : ['before','after']){pair[key]=measure(key==='before'?before:after);runs[key].push(pair[key].ms)}
 for(let i=0;i<pair.before.positions.length;i++)maxDifference=Math.max(maxDifference,Math.abs(pair.before.positions[i]-pair.after.positions[i]))
}
const median=values=>[...values].sort((a,b)=>a-b)[1]
const bundle=await build({entryPoints:['packages/rig/src/index.ts'],bundle:true,minify:true,format:'esm',write:false})
const result={node:process.version,runs,medians:{before:median(runs.before),after:median(runs.after)},relativeChange:median(runs.after)/median(runs.before)-1,maxDifference,coreGzipBytes:gzipSync(bundle.outputFiles[0].contents).length,scope:'Interleaved three-run CPU simulation/mesh/gaze comparison on the same device. Before removes this change’s four fixed-pin parent links. Debug overlays disabled; no browser/GPU/copy/overlay costs. 300 warm-up + 1200 measured frames per run. Simulation source is unchanged by the mesh snapshot API.'}
writeFileSync('artifacts/mirea-structure-20261003/benchmark-paired.json',JSON.stringify(result,null,2)+'\n');console.log(result)
