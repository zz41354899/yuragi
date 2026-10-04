import { createTestModel } from './fixtures/model.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createSimulation,validateModel,sampleCurve,validateAnimation} from '../src/index.js'
import {createFaceState} from '../src/face.js'
import {createTimeline} from '../src/animation.js'
import type {FaceFeatures,AnimationClip} from '../src/types.js'
import {features,faceModel} from './fixtures/face.js'
test('gaze is independent of geometry, strength is bounded and reduced motion preserves source',()=>{
 const m=faceModel();validateModel(m)
 const base=structuredClone(m);delete base.face
 const a=createSimulation(m),b=createSimulation(base),am=a.buildContinuousMesh(),bm=b.buildContinuousMesh()
 const face=createFaceState(m.face);face.setGaze(2,-2);face.settle()
 assert.deepEqual(face.snapshot(0,0),{gaze:[1,-1],strength:1})
 face.setStrength(.5);face.settle();assert.deepEqual(face.snapshot(0,0),{gaze:[.5,-.5],strength:.5})
 face.setStrength(0);face.settle();assert.deepEqual(face.snapshot(0,0),{gaze:[0,-0],strength:0})
 assert.deepEqual(face.snapshot(30,30,true),{gaze:[0,0],strength:0})
 for(let i=0;i<240;i++){a.setPointer(.5,-.5);b.setPointer(.5,-.5);a.updatePins(i*16.67,16.67);b.updatePins(i*16.67,16.67);a.updateVertices(am,i*16.67);b.updateVertices(bm,i*16.67)}
 assert.deepEqual(am.positions,bm.positions)
 for(const v of [-.1,1.1,Infinity,NaN])assert.throws(()=>face.setStrength(v))
 assert.throws(()=>createFaceState().setStrength(1))
 face.reset();face.update(4000);assert.deepEqual(face.snapshot(0,0),{gaze:[0,0],strength:1})
})
test('invalid facial geometry cannot move a pupil outside the reviewed eye',()=>{
 for(const patch of [{travel:[.02,.001]},{iris:[.9,.2]},{irisRadius:[.03,.006]},{id:'right'}]){const m=faceModel();Object.assign(m.face!.eyes[0],patch);assert.throws(()=>validateModel(m))}
 const m=faceModel();delete m.pose.headFollow;assert.throws(()=>validateModel(m))
})
test('Bezier time inversion, step interpolation, loop, pause, seek and invalid clips',()=>{
 assert.ok(Math.abs(sampleCurve(.5,[.42,0,.58,1])-.5)<1e-5)
 assert.ok(sampleCurve(.25,[.1,.8,.2,1])>.7)
 assert.equal(sampleCurve(.99,'step'),0);assert.equal(sampleCurve(1,'step'),1)
 const clip:AnimationClip={id:'gaze',duration:1000,tracks:[{target:'gaze',name:'strength',keys:[{time:0,value:0,curve:[.1,.8,.2,1]},{time:1000,value:1}]}]}
 let value=0;const t=createTimeline((_track,v)=>value=v,true);t.play(clip);clip.tracks[0].keys[1].value=0;t.update(250);assert.ok(value>.7)
 t.pause();t.update(500);assert.equal(t.snapshot()!.time,250);t.seek(1000);assert.equal(value,1);assert.equal(t.snapshot()!.playing,false)
 t.play({...clip,loop:true});t.update(1200);assert.equal(t.snapshot()!.time,200);t.stop();assert.equal(t.snapshot(),undefined)
 assert.throws(()=>validateAnimation(clip,false));assert.throws(()=>t.play({...clip,duration:Infinity}))
 assert.throws(()=>validateAnimation({...clip,tracks:[{target:'parameter',name:'lookX',keys:[{time:100,value:0},{time:50,value:0}]}]}))
})

test('overall motion weight blends guarded geometry and translation, without changing baseline dynamics', () => {
 const model=createTestModel();model.tracking={response:.018,damping:.75,maxVelocity:2.4,translation:[.03,.02]}
 const sim=createSimulation(model),mesh=sim.buildContinuousMesh()
 sim.setPointer(.5,-.5)
 for(let i=0;i<120;i++)sim.updatePins(i*16.67,16.67)
 sim.updateVertices(mesh,2000);const full=mesh.positions.slice()
 assert.ok(full.some((v,i)=>Math.abs(v-mesh.rest[i])>.001))
 sim.setMotion({weight:.5});sim.updateVertices(mesh,2000)
 for(let i=0;i<full.length;i++)assert.ok(Math.abs(mesh.positions[i]-(mesh.rest[i]+(full[i]-mesh.rest[i])*.5))<1e-6)
 sim.setMotion({weight:0});sim.updateVertices(mesh,2000);assert.deepEqual(mesh.positions,mesh.rest)
 sim.setMotion({weight:1});sim.updateVertices(mesh,2000);assert.deepEqual(mesh.positions,full)
 assert.throws(()=>sim.setMotion({weight:1.01}));assert.equal(sim.model.motion.weight,1)
 const clip:AnimationClip={id:'weight',duration:1000,tracks:[{target:'motion',name:'weight',keys:[{time:0,value:0,curve:[.42,0,.58,1]},{time:1000,value:1}]}]}
 let weight=0;const timeline=createTimeline((_t,v)=>weight=v,false);timeline.play(clip);timeline.seek(500);assert.ok(Math.abs(weight-.5)<1e-6)
 assert.throws(()=>validateAnimation({...clip,tracks:[{target:'motion',name:'weight',keys:[{time:0,value:2}]}]}))
})

test('legacy face fields and expression tracks require explicit migration',()=>{
 for(const field of ['mode','mouth','blink']){
  const m=faceModel();Object.assign(m.face!,{[field]:{}});assert.throws(()=>validateModel(m),/migrate/)
 }
 for(const field of ['skinSample','ink']){
  const m=faceModel();Object.assign(m.face!.eyes[0],{[field]:[0,0]});assert.throws(()=>validateModel(m),/migrate/)
 }
 assert.throws(()=>validateAnimation({id:'old',duration:100,tracks:[{target:'expression',name:'gaze',keys:[{time:0,value:1}]}]} as unknown as AnimationClip,true),/migrate/)
})
