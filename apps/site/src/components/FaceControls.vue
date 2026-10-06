<script setup lang="ts">
import {computed,ref,watch} from 'vue'
import type {RigModel,RigPlayer,RigSnapshot,AnimationClip} from '@z7589xxz758/yuragi'
import {useText} from '../i18n'
const {tr}=useText()
const props=defineProps<{player?:RigPlayer;model:RigModel;snapshot?:RigSnapshot;reduced?:boolean}>()
const strength=ref(1),eyeX=ref(0),eyeY=ref(0),curve=ref<[number,number,number,number]>([.25,.1,.25,1]),duration=ref(3200),loop=ref(false)
const disabled=computed(()=>!props.player||props.reduced)
const animation=computed(()=>props.snapshot?.animation)
const path=computed(()=>`M 15 115 C ${15+curve.value[0]*120} ${115-curve.value[1]*100}, ${15+curve.value[2]*120} ${115-curve.value[3]*100}, 135 15`)
watch(()=>props.model,()=>{strength.value=1;eyeX.value=eyeY.value=0})
function gaze(){props.player?.stopAnimation();props.player?.setGazeStrength(strength.value);props.player?.setGaze(eyeX.value,eyeY.value)}
function animate(){
 if(!Number.isFinite(duration.value)||duration.value<1000||duration.value>10000)return
 const c=[...curve.value] as [number,number,number,number],d=duration.value
 const clip:AnimationClip={id:'look-demo',duration:d,loop:loop.value,tracks:[
 {target:'parameter',name:'lookX',keys:[{time:0,value:0,curve:c},{time:d*.3,value:12,curve:c},{time:d*.7,value:-12,curve:c},{time:d,value:0}]},
 ...(props.model.face?[{target:'gaze' as const,name:'strength' as const,keys:[{time:0,value:1,curve:c},{time:d*.5,value:.2,curve:c},{time:d,value:1}]}]:[])]}
 props.player?.playAnimation(clip)
}
function seek(event:Event){props.player?.pauseAnimation();props.player?.seekAnimation((event.target as HTMLInputElement).valueAsNumber)}
function stop(){props.player?.stopAnimation();strength.value=1;eyeX.value=eyeY.value=0;props.player?.setPointer(0,0);if(props.model.face){props.player?.setGazeStrength(1);props.player?.setGaze(0,0)}}
</script>
<template>
 <section class="face-controls" :aria-label="tr('眼神與動畫曲線')">
  <h3>{{tr('眼神與動畫曲線')}}</h3>
  <template v-if="model.face">
   <p>{{tr('只平移瞳孔，保持原畫眼線、眼皮與嘴巴。')}}</p>
   <label>{{tr('眼神強度')}}<input type="range" min="0" max="1" step=".05" v-model.number="strength" :disabled="disabled" @input="gaze" /></label>
   <label>{{tr('眼神 X')}}<input type="range" min="-1" max="1" step=".05" v-model.number="eyeX" :disabled="disabled" @input="gaze" /></label>
   <label>{{tr('眼神 Y')}}<input type="range" min="-1" max="1" step=".05" v-model.number="eyeY" :disabled="disabled" @input="gaze" /></label>
  </template>
  <p v-else>{{tr('此模型缺少眼睛標註；請載入已審核的眼睛模型。')}}</p>
  <svg viewBox="0 0 150 130" role="img" :aria-label="tr('Bézier 動畫曲線')"><path d="M15 15V115H135" class="axis"/><path :d="path" class="curve"/><line :x1="15" :y1="115" :x2="15+curve[0]*120" :y2="115-curve[1]*100"/><line :x1="135" :y1="15" :x2="15+curve[2]*120" :y2="115-curve[3]*100"/><circle v-for="i in [0,2]" :key="i" :cx="15+curve[i]*120" :cy="115-curve[i+1]*100" r="3" /></svg>
  <div class="curve-fields"><label v-for="(name,i) in ['X1','Y1','X2','Y2']" :key="name">{{name}}<input type="range" min="0" max="1" step=".05" v-model.number="curve[i]" /></label></div>
  <label>{{tr('動畫長度')}}<input type="number" min="1000" max="10000" step="100" v-model.number="duration" /> ms</label>
  <label>{{tr('循環動畫')}}<input type="checkbox" v-model="loop" /></label>
  <div class="buttons"><button :disabled="disabled||!Number.isFinite(duration)||duration<1000||duration>10000" @click="animate">{{tr('播放曲線')}}</button><button :disabled="disabled||!animation" @click="player?.pauseAnimation()">{{tr('暫停曲線')}}</button><button :disabled="disabled||!animation" @click="stop">{{tr('停止曲線')}}</button></div>
  <label>{{tr('時間軸')}}<input type="range" min="0" :max="animation?.duration??duration" step="10" :value="animation?.time??0" :disabled="disabled||!animation" @input="seek" /></label>
  <output>{{Math.round(animation?.time??0)}} / {{animation?.duration??duration}} ms</output>
  <p>{{tr('此舞台使用 v1 完整原圖；v2 分層預覽見眼睛追蹤文件。')}}</p>
 </section>
</template>
<style scoped>
.face-controls{border-top:1px solid #dceaf0;margin-top:18px;padding-top:18px;font-size:13px}.face-controls h3{font-size:15px;margin:0 0 10px}.face-controls p{font-size:12px;line-height:1.7;color:#637985}.face-controls label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0}.face-controls input[type=range]{width:130px;accent-color:#567891}.face-controls input[type=number]{width:85px;padding:5px;border:1px solid #c5dae4;border-radius:5px}.buttons{display:flex;flex-wrap:wrap;gap:6px}.buttons button{font-size:12px;border:1px solid #c5dae4;border-radius:7px;padding:7px;background:white;color:#354e63}.buttons button:disabled{opacity:.4}.face-controls svg{width:100%;height:130px;background:#f6fafb;border-radius:8px}.face-controls svg path,.face-controls svg line{fill:none;stroke:#acc0cb;stroke-width:1}.face-controls svg .curve{stroke:#648ca6;stroke-width:2}.face-controls svg circle{fill:#648ca6}.curve-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}.curve-fields input[type=range]{width:80px}.face-controls output{font-size:12px;color:#637985}
</style>
