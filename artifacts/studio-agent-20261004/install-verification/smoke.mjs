import assert from 'node:assert/strict'
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {dirname,join} from 'node:path'
import {createSimulation,validateModel} from '@yuragi/rig'
import {createMireaModel} from '@yuragi/rig/mirea'
import {YuragiCharacter,YuragiLayeredCharacter} from '@yuragi/rig/vue'
import {YuragiCharacter as ReactCharacter,YuragiLayeredCharacter as ReactLayered} from '@yuragi/rig/react'
import {createSSRApp,h} from 'vue'
import {renderToString as renderVue} from '@vue/server-renderer'
import {createElement} from 'react'
import {renderToString as renderReact} from 'react-dom/server'
const root=dirname(fileURLToPath(import.meta.resolve('@yuragi/rig'))).replace(/\/dist$/,'')
const model=createMireaModel('/mirea/texture.png');validateModel(model)
for(const html of [await renderVue(createSSRApp({render:()=>h(YuragiCharacter,{model})})),renderReact(createElement(ReactCharacter,{model}))])assert.match(html,/mirea\/texture.png/)
const sim=createSimulation(model),mesh=sim.buildContinuousMesh();sim.updatePins(1000,16.67);sim.updateVertices(mesh,1000);assert.ok([...mesh.positions].every(Number.isFinite))
await mkdir('mirea',{recursive:true});await copyFile(join(root,'assets/mirea/texture.png'),'mirea/texture.png');model.texture.src='./texture.png';await writeFile('mirea/model.json',JSON.stringify(model))
const face=JSON.parse(await readFile('face/model.json','utf8'))
for(const html of [await renderVue(createSSRApp({render:()=>h(YuragiLayeredCharacter,{model:face})})),renderReact(createElement(ReactLayered,{model:face}))])assert.match(html,/fallback.png/)
assert.ok((await readFile(join(root,'studio/index.html'),'utf8')).includes('/assets/'))
console.log(JSON.stringify({installedRoot:root,vue:true,react:true,v1:true,v2:true,sourceCheckoutRequired:false}))
