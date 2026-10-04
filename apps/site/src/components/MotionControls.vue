<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RigModel, RigPlayer, RigSnapshot, AnimationClip } from '@yuragi/rig'
import { useText } from '../i18n'
const { tr } = useText()
const props = defineProps<{ player?: RigPlayer; model: RigModel; snapshot?: RigSnapshot; reduced?: boolean }>()
const emit = defineEmits<{ play: [] }>()
const curve = ref<[number, number, number, number]>([.42, 0, .58, 1])
const duration = ref(4800), loop = ref(false), weight = ref(1)
const disabled = computed(() => !props.player || props.reduced)
const animation = computed(() => props.snapshot?.animation)
const path = computed(() => `M15 115 C ${15 + curve.value[0]*120} ${115 - curve.value[1]*100}, ${15 + curve.value[2]*120} ${115 - curve.value[3]*100}, 135 15`)
const presets: { label: string; curve: [number,number,number,number] }[] = [
  { label: '平滑進出', curve: [.42, 0, .58, 1] },
  { label: '緩慢收尾', curve: [.16, 1, .3, 1] },
  { label: '均速', curve: [0, 0, 1, 1] },
]
watch(() => props.model, () => { weight.value = 1 })
function manualWeight() { props.player?.stopAnimation(); props.player?.setMotion({ weight: weight.value }) }
function animate() {
  if (disabled.value || !Number.isFinite(duration.value) || duration.value < 1000 || duration.value > 10000) return
  const c = [...curve.value] as [number, number, number, number], d = duration.value
  const keys = (values: number[]) => values.map((value, i) => ({ time: d*i/4, value, curve: c }))
  const clip: AnimationClip = { id: 'character-motion-weight', duration: d, loop: loop.value, tracks: [
    { target: 'motion', name: 'weight', keys: keys([0, weight.value, weight.value, weight.value, 0]) },
    { target: 'parameter', name: 'lookX', keys: keys([0, 18, 0, -18, 0]) },
    { target: 'parameter', name: 'lookY', keys: keys([0, -8, 6, 0, 0]) },
    { target: 'parameter', name: 'bodyX', keys: keys([0, 5, 0, -5, 0]) },
  ] }
  props.player?.playAnimation(clip); emit('play')
}
function seek(event: Event) { props.player?.pauseAnimation(); props.player?.seekAnimation((event.target as HTMLInputElement).valueAsNumber) }
function stop() { props.player?.stopAnimation(); props.player?.setMotion({ weight: weight.value }); props.player?.setPointer(0, 0) }
</script>
<template>
  <section class="motion-controls" :aria-label="tr('整體動畫曲線')">
    <h3>{{ tr('整體動畫曲線') }}</h3>
    <p>{{ tr('曲線控制姿態的進出節奏與整體動作權重，頭、身體、頭髮與配件一起平順過渡。') }}</p>
    <label>{{ tr('動作權重') }} <output>{{ Math.round((snapshot?.motionWeight ?? weight)*100) }}%</output><input aria-label="Motion weight" type="range" min="0" max="1" step=".05" v-model.number="weight" :disabled="disabled" @input="manualWeight" /></label>
    <div class="buttons"><button v-for="preset in presets" :key="preset.label" @click="curve = [...preset.curve] as [number,number,number,number]">{{ tr(preset.label) }}</button></div>
    <svg viewBox="0 0 150 130" role="img" :aria-label="tr('Bézier 動畫曲線')"><path d="M15 15V115H135" class="axis"/><path :d="path" class="curve"/><line x1="15" y1="115" :x2="15+curve[0]*120" :y2="115-curve[1]*100"/><line x1="135" y1="15" :x2="15+curve[2]*120" :y2="115-curve[3]*100"/><circle v-for="i in [0,2]" :key="i" :cx="15+curve[i]*120" :cy="115-curve[i+1]*100" r="3"/></svg>
    <div class="curve-fields"><label v-for="(name,i) in ['X1','Y1','X2','Y2']" :key="name">{{name}}<input type="range" min="0" max="1" step=".01" v-model.number="curve[i]" /></label></div>
    <label>{{ tr('動畫長度') }}<input type="number" min="1000" max="10000" step="100" v-model.number="duration" /> ms</label>
    <label>{{ tr('循環動畫') }}<input type="checkbox" v-model="loop" /></label>
    <div class="buttons"><button :disabled="disabled || !Number.isFinite(duration) || duration<1000 || duration>10000" @click="animate">{{ tr('播放動作曲線') }}</button><button :disabled="disabled || !animation" @click="player?.pauseAnimation()">{{ tr('暫停曲線') }}</button><button :disabled="disabled || !animation" @click="stop">{{ tr('停止曲線') }}</button></div>
    <label>{{ tr('時間軸') }}<input type="range" min="0" :max="animation?.duration ?? duration" step="10" :value="animation?.time ?? 0" :disabled="disabled || !animation" @input="seek" /></label>
    <output>{{ Math.round(animation?.time ?? 0) }} / {{ animation?.duration ?? duration }} ms</output>
    <p>{{ tr('權重 0 為原圖，1 為完整動態。停止曲線後恢復游標互動。') }}</p>
  </section>
</template>
<style scoped>
.motion-controls{border-top:1px solid #dceaf0;margin-top:18px;padding-top:18px;font-size:13px}.motion-controls h3{font-size:15px;margin:0 0 10px}.motion-controls p{font-size:12px;line-height:1.7;color:#637985}.motion-controls label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0}.motion-controls input[type=range]{width:130px;accent-color:#567891}.motion-controls input[type=number]{width:85px;padding:5px;border:1px solid #c5dae4;border-radius:5px}.buttons{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}.buttons button{font-size:12px;border:1px solid #c5dae4;border-radius:7px;padding:7px;background:white;color:#354e63}.buttons button:disabled{opacity:.4}.motion-controls svg{width:100%;height:130px;background:#f6fafb;border-radius:8px}.motion-controls svg path,.motion-controls svg line{fill:none;stroke:#acc0cb;stroke-width:1}.motion-controls svg .curve{stroke:#648ca6;stroke-width:2}.motion-controls svg circle{fill:#648ca6}.curve-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}.curve-fields input[type=range]{width:80px}.motion-controls output{font-size:12px;color:#637985}
</style>
