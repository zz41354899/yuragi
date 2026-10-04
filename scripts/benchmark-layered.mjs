import { readFileSync, writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { createLayeredSimulation } from '../packages/rig/dist/index.js'
const file = new URL('../artifacts/layered-engine/mirea/model.json', import.meta.url)
const model = JSON.parse(readFileSync(file, 'utf8'))
const simulation = createLayeredSimulation(model)
simulation.setPointer(.5, -.5)
for (let i = 0; i < 500; i++) simulation.update(i * 16.67, 16.67)
const samples = []
for (let run = 0; run < 3; run++) {
  const start = performance.now()
  for (let i = 0; i < 10000; i++) simulation.update((i + run * 10000) * 16.67, 16.67)
  samples.push((performance.now() - start) / 10000)
}
const report = {
  measuredAt: new Date().toISOString(),
  scope: 'Node CPU simulation and mesh update only; no browser, GPU, texture loading or phone measurement',
  samplesMilliseconds: samples, medianMilliseconds: [...samples].sort((a, b) => a - b)[1],
  vertices: simulation.mesh.positions.length / 2, triangles: simulation.mesh.indices.length / 3,
  drawCallsFromBatchPlan: simulation.batches.length,
  decodedAtlasBytes: model.atlases.reduce((sum, a) => sum + a.width * a.height * 4, 0),
}
writeFileSync(new URL('../artifacts/layered-engine/cpu-benchmark.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
