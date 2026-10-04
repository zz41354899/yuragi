import fs from 'node:fs/promises';
const here=new URL('./',import.meta.url);
await fs.mkdir(new URL('qa/',here),{recursive:true});
const source=await fs.readFile(new URL('index.html',here),'utf8');
const reduced=`<script>
const nativeMedia=window.matchMedia.bind(window), preference=new EventTarget();
preference.matches=true;preference.media='(prefers-reduced-motion: reduce)';
window.matchMedia=query=>query===preference.media?preference:nativeMedia(query);
window.addEventListener('DOMContentLoaded',()=>{
 const button=document.createElement('button');button.textContent='QA：關閉模擬減少動態';
 button.addEventListener('click',()=>{preference.matches=!preference.matches;preference.dispatchEvent(new Event('change'));button.textContent=preference.matches?'QA：關閉模擬減少動態':'QA：啟用模擬減少動態';});
 document.querySelector('header').append(button);
});
</script>`;
const fallback=`<script>
const nativeContext=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl'?null:nativeContext.call(this,kind,...args);};
</script>`;
for(const [name,hook] of [['reduced-motion',reduced],['no-webgl',fallback]]) {
 const html=source.replace('<head>','<head><base href="../">'+hook).replace('飄逸追蹤沙盒','QA · '+name);
 await fs.writeFile(new URL('qa/'+name+'.html',here),html);
}
console.log('Built isolated QA fixtures; main sandbox preferences remain unchanged.');
