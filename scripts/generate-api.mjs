import ts from 'typescript'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { descriptions, extra, localizedNotes, parameterDescription, examples } from '../docs/api-content.mjs'
const root = fileURLToPath(new URL('../', import.meta.url))
const configFile = ts.readConfigFile(resolve(root, 'packages/rig/tsconfig.json'), ts.sys.readFile)
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, resolve(root, 'packages/rig'))
const program = ts.createProgram(config.fileNames, config.options)
const checker = program.getTypeChecker()
const slug = value => value.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()
const text = (zh, en, ja) => ({ 'zh-TW': zh, en, ja })
const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
const clean = value => value.replace(/import\("[^"\n]*\/(?:types|layered-types|react-layered)"\)\./g, '').replace(/import\("[^"\n]*\/(?:types|layered-types|react-layered)\.js"\)\./g, '')
const typeString = (type, location) => clean(checker.typeToString(type, location, flags))
const entries = [], types = [], seenTypes = new Set()
const manifest=JSON.parse(readFileSync(resolve(root,'packages/rig/package.json'),'utf8'))
const modules=[], resources=[]
for(const [entry,contract] of Object.entries(manifest.exports)) {
  const module=entry==='.'?manifest.name:manifest.name+entry.slice(1)
  if(typeof contract==='string'){resources.push({module,target:contract});continue}
  if(!contract.types?.startsWith('./dist/')||!contract.types.endsWith('.d.ts'))throw new Error('Undocumented package entry: '+module)
  const base=contract.types.slice('./dist/'.length,-'.d.ts'.length)
  const file=[base+'.ts',base+'.tsx'].find(file=>existsSync(resolve(root,'packages/rig/src',file)))
  if(!file)throw new Error('No owning TypeScript source for package entry: '+module)
  modules.push([file,module])
}
function signatureData(signature, location) {
  const declaration = signature.getDeclaration()
  return {
    signature: clean(checker.signatureToString(signature, location, flags)),
    parameters: signature.parameters.map((parameter,i) => ({ name: parameter.name, type: typeString(checker.getTypeOfSymbolAtLocation(parameter, location),location), optional: !!(parameter.flags & ts.SymbolFlags.Optional) || !!declaration?.parameters[i]?.questionToken || !!declaration?.parameters[i]?.initializer, default: declaration?.parameters[i]?.initializer?.getText(), description: parameterDescription(parameter.name) })),
    returns: typeString(checker.getReturnTypeOfSignature(signature),location),
  }
}
function add(name, group, module, signature, location, owner) {
  const key=owner?.startsWith('simulation.')?owner.slice('simulation.'.length)+'.'+name:name
  if (!descriptions[key]) throw new Error('Missing behavior documentation: '+group+'/'+key)
  const data = signatureData(signature,location)
  let example = examples[key]
  if (owner === 'simulation') example = example?.replaceAll('player.','simulation.')
  if (owner === 'layeredSimulation') example = example?.replaceAll('player.','simulation.')
  const entry = { id:group+'/'+slug(name), name, group, module, owner, summary:descriptions[key], ...data,
    notes:localizedNotes[key] ?? descriptions[key], example,
    related:[] }
  if(!example)throw new Error('Missing example: '+entry.id)
  entries.push(entry)
}
function addMethods(type, group, module, location, owner) {
  for(const symbol of type.getProperties()) {
    const memberType=checker.getTypeOfSymbolAtLocation(symbol,location)
    const callable = memberType.getCallSignatures()[0]
    if(callable)add(symbol.name,group,module,callable,symbol.valueDeclaration??location,owner)
    else if(owner==='simulation'||owner==='layeredSimulation') {
      // Reachable authored methods are public even when their factory is internal.
      // Exclude Array/typed-array/other platform methods from the library API.
      const owned=memberType.getProperties().some(member=>{
        const declaration=member.valueDeclaration??member.declarations?.[0]
        return declaration?.getSourceFile().fileName.startsWith(resolve(root,'packages/rig/src')+'/')&&checker.getTypeOfSymbolAtLocation(member,location).getCallSignatures().length
      })
      if(owned)addMethods(memberType,group+'-'+slug(symbol.name),module,symbol.valueDeclaration??location,owner+'.'+symbol.name)
    }
  }
}
for(const [file,module] of modules) {
  const source = program.getSourceFile(resolve(root,'packages/rig/src',file))
  const exported = checker.getExportsOfModule(checker.getSymbolAtLocation(source))
  for(const exportSymbol of exported) {
    const symbol = exportSymbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exportSymbol) : exportSymbol
    const name=exportSymbol.name, location=symbol.valueDeclaration??symbol.declarations?.[0]??source
    if(name==='YuragiCharacter'||name==='YuragiLayeredCharacter') {
      const group=module.endsWith('/vue')?'vue':'react', layered=name.includes('Layered')
      const optionsFile=program.getSourceFile(resolve(root,'packages/rig/src',group==='vue'?(layered?'vue-layered.ts':'vue.ts'):(layered?'react-layered.tsx':'react.tsx')))
      const modelType=layered?'LayeredModel':'RigModel'
      entries.push({id:group+'/'+slug(name),name,group,module,summary:descriptions[name],signature:group==='vue'?`<${name} :model="model" :autoplay="true" reduced-motion="respect" alt="Character" @ready="ready" @error="onError" @frame="onFrame" />`:`<${name} model={model} autoplay reducedMotion="respect" alt="Character" onReady={ready} onError={onError} onFrame={onFrame} />`,parameters:[],returns:group==='vue'?'Vue component instance with getPlayer()':'React component with an optional imperative ref',notes:text('model 為必要 prop；autoplay=true、reducedMotion="respect"、alt="Animated illustration"。Vue 事件為 ready(player)、error(Error)、frame(snapshot)，ref 暴露 getPlayer()。React 使用 onReady／onError／onFrame，ref.current?.getPlayer()；另支援 className、style。載入可取消，model／reducedMotion 更新會重建播放器，卸載會清理。載入中或 WebGL 失敗時顯示原畫。','Props: model (required), autoplay=true, reducedMotion="respect", alt="Animated illustration". Vue emits ready(player), error(Error), frame(snapshot); expose getPlayer(). React: onReady, onError, onFrame; ref.current?.getPlayer(); className and style are optional. Loading is cancellable; model/reducedMotion changes recreate the player; unmount destroys it. Artwork is shown while loading or on WebGL failure.','model は必須。autoplay=true、reducedMotion="respect"、alt="Animated illustration"。Vue イベント：ready(player)・error(Error)・frame(snapshot)、ref に getPlayer()。React：onReady/onError/onFrame、ref.current?.getPlayer()、className/style。読み込み取消・モデル変更の再生成・終了時の解放に対応。読み込み中・WebGL 失敗時は原画を表示。'),example:group==='react'?`import { ${name} } from '${module}'\nimport type { ${modelType} } from '@yuragi/rig'\nexport function Example({ model }: { model: ${modelType} }) {\n  return <${name} model={model} alt="Character" />\n}`:`<script setup lang="ts">\nimport { ${name} } from '${module}'\nimport type { ${modelType} } from '@yuragi/rig'\ndefineProps<{ model: ${modelType} }>()\n</script>\n<template>\n  <${name} :model="model" alt="Character" />\n</template>`,related:[]})
      if(!optionsFile.text.includes('getPlayer'))throw new Error('Component no longer exposes getPlayer')
      entries.push({id:group+'/'+slug(name)+'-get-player',name:'getPlayer',group,module,owner:group+'Handle',summary:descriptions.getPlayer,signature:`getPlayer(): ${layered?'LayeredPlayer':'RigPlayer'} | undefined`,parameters:[],returns:(layered?'LayeredPlayer':'RigPlayer')+' | undefined',notes:text('Vue 在掛載後透過元件 ref 呼叫；React 使用型別化的 forwarded ref。替換模型載入期間 player 可能尚未就緒。','Vue: call through a component template ref after mount. React: use the typed forwarded ref. Readiness may change while loading a replacement model.','Vue はマウント後のコンポーネント ref、React は型付き forwarded ref。モデル置換の読み込み中は未準備の場合があります。'),example:examples.getPlayer,related:[]})
      continue
    }
    if(symbol.flags & ts.SymbolFlags.Type) {
      const key=module+':'+name
      if(seenTypes.has(key))continue
      seenTypes.add(key)
      const declaration=symbol.declarations?.find(n=>ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n))
      if(declaration)types.push({name,module,definition:declaration.getText(),description:ts.displayPartsToString(symbol.getDocumentationComment(checker))})
      if(name==='RigPlayer')addMethods(checker.getDeclaredTypeOfSymbol(symbol),'player',module,location,'player')
      if(name==='LayeredPlayer')addMethods(checker.getDeclaredTypeOfSymbol(symbol),'layered-player',module,location,'layeredPlayer')
      continue
    }
    const type=checker.getTypeOfSymbolAtLocation(symbol,location),signature=type.getCallSignatures()[0]
    if(signature) {
      const group=name==='createMireaModel'?'characters':name.includes('Layered')?'layered': ['validateAnimation','sampleCurve','sampleTrack'].includes(name)?'animation':'core'
      add(name,group,module,signature,location)
      if(name==='createSimulation')addMethods(checker.getReturnTypeOfSignature(signature),'simulation',module,location,'simulation')
      if(name==='createLayeredSimulation')addMethods(checker.getReturnTypeOfSignature(signature),'layered-simulation',module,location,'layeredSimulation')
    } else if(name==='REVIEW_STEP'||name==='reviewPoses')types.push({name,module,definition:'export const '+name+': '+typeString(type,location),description:name==='REVIEW_STEP'?'Shared fixed step: 1000 / 60 milliseconds.':'Shared pose definitions: source-centered pointer values and millisecond sequences; generating images does not establish visual acceptance.'})
    else if(name==='CANVAS_PADDING')types.push({name,module,definition:'export const CANVAS_PADDING: '+typeString(type,location),description:'Canvas overscan on each edge: 0.12 (12%).'})
  }
}
if(new Set(entries.map(e=>e.id)).size!==entries.length)throw new Error('Duplicate API routes')
const groups = {
  core:text('核心','Core','コア'),player:text('播放器','Player','プレイヤー'),simulation:text('模擬器','Simulation','シミュレーション'),animation:text('動畫','Animation','アニメーション'),characters:text('角色工廠','Characters','キャラクター'),vue:text('Vue','Vue','Vue'),react:text('React','React','React'),layered:text('分層引擎','Layered engine','分層エンジン'),'layered-player':text('分層播放器','Layered player','分層プレイヤー'),'layered-simulation':text('分層模擬器','Layered simulation','分層シミュレーション'),types:text('型別與常數','Types / constants','型・定数'),
}
Object.assign(groups,{
  'layered-simulation-face':text('分層模擬器・眼嘴','Layered simulation / face','分層シミュレーション・顔'),
  'simulation-hair':text('模擬器・髮絲','Simulation / hair','シミュレーション・髪'),
  'simulation-accessories':text('模擬器・配件','Simulation / accessories','シミュレーション・アクセサリ'),
  'simulation-parts':text('模擬器・柔性部件','Simulation / parts','シミュレーション・パーツ'),
  'simulation-pointer-groups':text('模擬器・共同變換','Simulation / pointer groups','シミュレーション・グループ'),
})
for(const entry of entries)entry.related=entries.filter(e=>e.id!==entry.id&&(e.group===entry.group||e.name===entry.name)).slice(0,6).map(e=>e.id)
entries.sort((a,b)=>a.id.localeCompare(b.id))
const generated={version:manifest.version,modules:modules.map(([,module])=>module),resources,groups,entries,types}
const json=JSON.stringify(generated,null,2)+'\n'
const destination=resolve(root,'apps/site/src/docs/api-generated.json');mkdirSync(dirname(destination),{recursive:true})
const skillDir=resolve(root,'skills/yuragi-rig-spec/references/api');mkdirSync(skillDir,{recursive:true})
const contents=new Map([[destination,json]])
const index=[`# Public API index (${manifest.version})`,'','Generated from the package public exports and TypeScript signatures. Behavior and examples are maintained in docs/api-content.mjs. Read individual references only as needed. Vue and React have separate imports. Model format v1 and layered v2 are separate contracts.','','## Package entries','',...modules.map(([,module])=>'- `'+module+'`'),...resources.map(resource=>'- `'+resource.module+'` — installed package files at `'+resource.target+'`. Copy the matching model/artwork into your project’s public assets; a replacement image is not a rig.'),'','## Functions and methods','']
for(const entry of entries) {
  const file=entry.id.replaceAll('/','-')+'.md'
  index.push(`- [${entry.group} / ${entry.name}](${file})`)
  const lines=[`# ${entry.group} / ${entry.name}`,'',entry.summary.en,'',`Import: \`${entry.module}\``, '', '## Signature','','```ts',entry.signature,'```','','## Parameters','']
  lines.push(...entry.parameters.map(p=>`- \`${p.name}${p.optional?'?':''}: ${p.type}\`${p.default?' (default: `'+p.default+'`)':''} — ${p.description.en}`))
  if(!entry.parameters.length)lines.push('No positional parameters.')
  lines.push('','## Returns','',entry.returns,'','## Behavior, defaults and limits','',entry.notes.en,'','## Example','','```'+(entry.group==='vue'&&entry.name!=='getPlayer'?'vue':entry.group==='react'&&entry.name!=='getPlayer'?'tsx':'ts'),entry.example,'```','','## Related','',...entry.related.map(id=>`- [${id}](${id.replaceAll('/','-')}.md)`),'','- [Types and constants](types.md)','- [API index](index.md)','')
  contents.set(resolve(skillDir,file),lines.join('\n'))
}
index.push('','## Types and constants','','- [Complete type and constant index](types.md)','')
contents.set(resolve(skillDir,'index.md'),index.join('\n'))
contents.set(resolve(skillDir,'types.md'),['# Public types and constants','',...types.flatMap(type=>[`## ${type.name}`,'',`Import: \`${type.module}\``, '',type.description,'','```ts',type.definition,'```','']),'[API index](index.md)',''].join('\n'))
if(process.argv.includes('--check')) {
  for(const [path,content] of contents)if(readFileSync(path,'utf8')!==content)throw new Error('Stale generated API file: '+path)
} else for(const [path,content] of contents)writeFileSync(path,content)
console.log(`API catalogue: ${entries.length} callable pages, ${types.length} types/constants`)
export { generated }
