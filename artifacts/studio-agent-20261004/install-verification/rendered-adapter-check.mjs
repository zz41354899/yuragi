import {createServer} from 'node:http'
import {readFile,writeFile} from 'node:fs/promises'
import {dirname,join,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const root=dirname(fileURLToPath(import.meta.resolve('@yuragi/rig')))
const vue=join(dirname(fileURLToPath(import.meta.resolve('vue'))),'dist/vue.esm-browser.js')
const m=JSON.parse(await readFile('face/model.json','utf8'))
const dataURL=async file=>'data:image/png;base64,'+(await readFile(file)).toString('base64')
m.source.fallback=await dataURL('face/fallback.png');for(const a of m.atlases)a.src=await dataURL('face/'+a.src)
const server=createServer(async(req,res)=>{try{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><script type="importmap">{"imports":{"vue":"/vue.js"}}</script><div id="host" style="width:300px"></div>');return}const file=req.url==='/vue.js'?vue:req.url?.startsWith('/runtime/')?resolve(root,req.url.slice(9)):undefined;if(!file||file!==vue&&!file.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type','text/javascript');res.end(await readFile(file))}catch{res.writeHead(404);res.end()}})
await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done)})
let browser
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage();await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://127.0.0.1:'+server.address().port)
 const result=await page.evaluate(async model=>{
  const {createApp,h,shallowRef,nextTick}=await import('/vue.js'),{YuragiLayeredCharacter}=await import('/runtime/vue.js')
  const current=shallowRef(model);let player,readyResolve,errorResolve;const ready=new Promise(r=>readyResolve=r);let error=new Promise(r=>errorResolve=r)
  const app=createApp({render:()=>h(YuragiLayeredCharacter,{model:current.value,onReady:p=>{player=p;readyResolve()},onError:e=>errorResolve(e.message)})});app.mount('#host');await ready;await nextTick()
  player.setPointer(.5,.5);player.setFace({eyeOpenLeft:0,eyeOpenRight:0,mouthShape:'a',mouthOpen:1});player.setGaze(1,1);player.advance(1500)
  const pose=player.getSnapshot(),mesh=player.getMeshSnapshot();const staticMesh=JSON.stringify([...mesh.rest])===JSON.stringify([...mesh.positions]);const rendered=document.querySelector('canvas').style.display==='block'
  const canvas=document.querySelector('canvas'),extension=canvas.getContext('webgl').getExtension('WEBGL_lose_context');extension.loseContext();const loss=await error;await nextTick();const lostFallback=document.querySelector('img').style.display==='block'
  app.unmount();player.play();const cleaned=player.getSnapshot().playing===false&&!document.querySelector('canvas')
  let nextPlayer,error2Resolve;const ready2=new Promise(r=>readyResolve=r);const error2=new Promise(r=>error2Resolve=r);const bad=shallowRef(model)
  const second=createApp({render:()=>h(YuragiLayeredCharacter,{model:bad.value,onReady:p=>{nextPlayer=p;readyResolve()},onError:e=>error2Resolve(e.message)})});second.mount('#host');await ready2
  const changed=structuredClone(model);changed.atlases[0].src=model.source.fallback;bad.value=changed;const invalid=await error2;await nextTick();const invalidFallback=document.querySelector('img').style.display==='block';second.unmount();nextPlayer.play()
  return {reduced:pose.reducedMotion,face:pose.face,staticMesh,rendered,loss,lostFallback,cleaned,invalid,invalidFallback,unmounted:nextPlayer.getSnapshot().playing===false}
 },m)
 assert.equal(result.reduced,true);assert.equal(result.face.eyeOpenLeft,1);assert.equal(result.face.mouthShape,'closed');for(const key of ['staticMesh','rendered','lostFallback','cleaned','invalidFallback','unmounted'])assert.equal(result[key],true,key);assert.match(result.loss,/context lost/);assert.match(result.invalid,/dimensions/)
 await writeFile('rendered-adapter-check.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result))
}finally{await browser?.close();await new Promise(done=>server.close(done))}
