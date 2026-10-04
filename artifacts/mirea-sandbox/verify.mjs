import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createSimulation,validateModel} from './runtime/index.js';
import {regionInfluence} from './runtime/regions.js';
const anatomy=JSON.parse(fs.readFileSync(new URL('character-analysis.json',import.meta.url),'utf8')).regions.filter(r=>/^(thigh|knee|shin|ankle|heel|toe)-/.test(r.id));

const here = new URL('./', import.meta.url);
const model = JSON.parse(fs.readFileSync(new URL('model.json',here),'utf8'));
validateModel(model);
const hash = createHash('sha256').update(fs.readFileSync(new URL('texture.png',here))).digest('hex');
assert.equal(hash, '6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05', 'Original artwork must remain unchanged');
const results=[];
for(const [name,profile] of Object.entries({
 gentle:{sway:.32,speed:.62,parts:1,range:.07,inertia:.3},
 breeze:{sway:.5,speed:.7,parts:1.15,range:.07,inertia:.8},
 test:{sway:.55,speed:.85,parts:1.3,range:.08,inertia:1},
 'minimum-inertia':{sway:.55,speed:.85,parts:1.3,range:.08,inertia:0},
 'maximum-inertia':{sway:.55,speed:.85,parts:1.3,range:.08,inertia:1},
})) {
 const motion={sway:profile.sway,speed:profile.speed,parts:profile.parts,hair:0,accessories:0,follow:1.3};
 const sim=createSimulation({...model,motion}); const mesh=sim.buildContinuousMesh();
 sim.setTracking({translation:[profile.range,profile.range*2/3],response:.09-profile.inertia*.055,damping:.64+profile.inertia*.18,maxVelocity:3.5-profile.inertia*1.2});
 let minScale=1,maxGradient=0,minArea=Infinity,maxOffset=0,maxHeadDistanceErrorPixels=0,maxLegEdgeStrain=0;
 const face=[];
 for(let i=0;i<mesh.rest.length;i+=2) if(mesh.rest[i]>.525&&mesh.rest[i]<.60&&mesh.rest[i+1]>.165&&mesh.rest[i+1]<.19)face.push(i);
 assert.ok(face.length>3,'sample multiple facial vertices');
 const distance=(data,a,b)=>Math.hypot(data[a]-data[b],(data[a+1]-data[b+1])*1.5);
 const legEdges=[];
 for(let i=0;i<mesh.indices.length;i+=3)for(let j=0;j<3;j++){
   const a=mesh.indices[i+j]*2,b=mesh.indices[i+(j+1)%3]*2;
   if([a,b].every(k=>anatomy.some(r=>regionInfluence(r.polygon,.002,1.5,mesh.rest[k],mesh.rest[k+1])===1)))legEdges.push([a,b]);
 }
 assert.ok(legEdges.length>100,'sample both visible legs and shoes');
 for(let frame=0;frame<1800;frame++) {
  const dt=frame%121===0?50:16.67, time=frame*16.67;
  const quadrant=Math.floor(frame/90)%4;
  sim.setPointer(quadrant%2?.5:-.5,quadrant>1?.5:-.5);
  sim.updatePins(time,dt); const d=sim.updateVertices(mesh,time);
  minScale=Math.min(minScale,d.motionScale);maxGradient=Math.max(maxGradient,d.maxDisplacementGradient);
  assert.ok(Math.abs(sim.parameters.bodyX)<=4.551,'body follow stays bounded');
  for(const [a,b]of legEdges)maxLegEdgeStrain=Math.max(maxLegEdgeStrain,Math.abs(distance(mesh.positions,a,b)/distance(mesh.rest,a,b)-1));
  for(const b of face.slice(1)) maxHeadDistanceErrorPixels=Math.max(maxHeadDistanceErrorPixels,Math.abs(distance(mesh.positions,face[0],b)-distance(mesh.rest,face[0],b))*1024);
  for(let i=0;i<mesh.positions.length;i++) {
   assert.ok(Number.isFinite(mesh.positions[i]), name+' finite vertices');
   maxOffset=Math.max(maxOffset,Math.abs(mesh.positions[i]-mesh.rest[i]));
  }
  for(let i=0;i<mesh.indices.length;i+=3) {
   const a=mesh.indices[i]*2,b=mesh.indices[i+1]*2,c=mesh.indices[i+2]*2,p=mesh.positions;
   const area=(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]);
   assert.ok(area>0,name+' no inverted mesh triangles');minArea=Math.min(minArea,area);
  }
 }
 assert.equal(minScale,1,name+' must not depend on fold limiter');
 assert.ok(maxHeadDistanceErrorPixels<.001,name+' facial proportions must remain rigid');
 assert.ok(maxLegEdgeStrain<.00005,name+' visible leg and shoe lengths must remain rigid');
 assert.ok(sim.parts.states.every(p=>Math.abs(p.rotation)>.00001),name+' every part has independent spring motion');
 sim.updateVertices(mesh,30000,true);
 assert.deepEqual(mesh.positions,mesh.rest,name+' reduced motion returns original geometry');
 results.push({preset:name,frames:1800,minMotionScale:minScale,maxGradient,minTriangleArea:minArea,maxNormalizedOffset:maxOffset,maxHeadDistanceErrorPixels,maxLegEdgeStrain});
}
function tracking(input) {
 const sim=createSimulation({...input,motion:{...input.motion,sway:0,hair:0,accessories:0,parts:0}}),mesh=sim.buildContinuousMesh();
 sim.setPointer(.5,0);for(let i=0;i<180;i++)sim.updatePins(i*16.67,16.67);sim.updateVertices(mesh,3000);
 let sum=0,count=0;for(let i=0;i<mesh.rest.length;i+=2)if(mesh.rest[i]>.51&&mesh.rest[i]<.61&&mesh.rest[i+1]>.155&&mesh.rest[i+1]<.205){sum+=mesh.positions[i]-mesh.rest[i];count++;}
 return {lookX:sim.parameters.lookX,averageFaceShiftSourcePixels:sum/count*1024};
}
const report={textureSHA256:hash,vertices:(model.mesh.columns+1)*(model.mesh.rows+1),parts:model.parts.length,
 headMotion:'single rigid rotation/translation with body-attached neck bridge',pointerGroups:model.pointerGroups.map(g=>({id:g.id,response:g.response,translation:g.translation,rotation:g.rotation})),tracking:tracking(model),results};
fs.writeFileSync(new URL('simulation-report.json',here),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

// Confirm that each reviewed limb actually contributes geometry, not only spring state.
for(const id of ['arm-right-follow']) {
 const full=createSimulation(model),without=createSimulation({...model,parts:model.parts.filter(p=>p.id!==id)});
 const a=full.buildContinuousMesh(),b=without.buildContinuousMesh();let maxPixels=0;
 for(let f=0;f<120;f++) {
  full.setPointer(.5,-.5);without.setPointer(.5,-.5);
  full.updatePins(f*16.67,16.67);without.updatePins(f*16.67,16.67);
  full.updateVertices(a,f*16.67);without.updateVertices(b,f*16.67);
  for(let i=0;i<a.positions.length;i+=2)maxPixels=Math.max(maxPixels,Math.hypot((a.positions[i]-b.positions[i])*1024,(a.positions[i+1]-b.positions[i+1])*1536));
 }
 assert.ok(maxPixels>.05,id+' must contribute visible-source geometry');
 console.log(id+' max local displacement: '+maxPixels.toFixed(3)+' source pixels');
}
