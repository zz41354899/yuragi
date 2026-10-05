import test from 'node:test'
import assert from 'node:assert/strict'
import { pointerGaze } from '../src/editor/gaze.js'
import { features } from '../../../packages/rig/test/fixtures/face.js'

test('pointer gaze follows the same source location after zoom, pan and artwork translation',()=>{
 const center=[(features.eyes[0].center[0]+features.eyes[1].center[0])/2,(features.eyes[0].center[1]+features.eyes[1].center[1])/2]
 const source=[center[0]+.1,center[1]-.04],offset:[number,number]=[.03,-.02]
 const before=pointerGaze([source[0]*400,source[1]*600],{left:0,top:0,width:400,height:600},features)
 const after=pointerGaze([120+(source[0]+offset[0])*800,-50+(source[1]+offset[1])*1200],{left:120,top:-50,width:800,height:1200},features,offset)
 for(let i=0;i<2;i++)assert.ok(Math.abs(before[i]-after[i])<1e-12)
 assert.deepEqual(pointerGaze([0,0],{left:0,top:0,width:0,height:600},features),[0,0])
})
test('nearby gaze changes continuously and remains bounded at distant pointer positions',()=>{
 const box={left:0,top:0,width:400,height:600}
 const a=pointerGaze([100,100],box,features),b=pointerGaze([100.01,100.01],box,features)
 for(let i=0;i<2;i++)assert.ok(Math.abs(a[i]-b[i])<.001)
 for(const p of [[1e6,1e6],[-1e6,-1e6]] as [number,number][])assert.ok(pointerGaze(p,box,features).every(v=>Number.isFinite(v)&&Math.abs(v)<1))
})
