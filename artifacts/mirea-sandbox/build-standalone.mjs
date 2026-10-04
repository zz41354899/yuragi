import fs from 'node:fs/promises';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const here = new URL('./', import.meta.url);
const model = JSON.parse(await fs.readFile(new URL('model.json',here),'utf8'));
const texture = 'data:image/png;base64,'+(await fs.readFile(new URL('texture.png',here))).toString('base64');
model.texture.src=texture;
const {outputFiles} = await build({entryPoints:[fileURLToPath(new URL('sandbox.js',here))],bundle:true,write:false,format:'esm',target:'es2022',minify:true});
let html=await fs.readFile(new URL('index.html',here),'utf8');
html=html.replace('src="./texture.png"','src="'+texture+'"');
html=html.replace('<a href="./model.json">檢視模型 JSON</a>','模型與原畫已內嵌在本 HTML；可完全離線測試。');
// A callback keeps minified dollar identifiers literal; replacement strings interpret $&/$'.
html=html.replace('<script type="module" src="./sandbox.js"></script>', () =>
 '<script type="application/json" id="embedded-model">'+JSON.stringify(model).replace(/</g,'\\u003c')+'</script>\n'+
 '<script type="module">'+outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
assert.equal((html.match(/<script type="module"/g)??[]).length,1,'Exactly one bundled module must be present');
assert.ok(!html.includes('src="./sandbox.js"'),'Standalone must not retain an external module');
await fs.writeFile(new URL('mirea.html',here),html);
console.log('Built standalone mirea.html: '+(Buffer.byteLength(html)/1024/1024).toFixed(2)+' MB');
