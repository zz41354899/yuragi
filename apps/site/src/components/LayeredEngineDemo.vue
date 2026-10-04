<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { YuragiLayeredCharacter } from '@yuragi/rig/vue'
import { validateLayeredModel, type LayeredPlayer, type LayeredSnapshot } from '@yuragi/rig'
import authored from '../models/layered-mirea.json'
import { useText } from '../i18n'
const { tr } = useText()
const model: unknown = structuredClone(authored)
validateLayeredModel(model)
model.source.fallback = '/models/layered-mirea/fallback.png'
model.atlases.forEach(atlas => { atlas.src = '/models/layered-mirea/' + atlas.src })
const player = shallowRef<LayeredPlayer>(), snapshot = shallowRef<LayeredSnapshot>(), failure = ref('')
const autoplay = ref(true)
function ready(next: LayeredPlayer) { player.value = next; failure.value = '' }
function move(event: PointerEvent) {
  if (event.pointerType === 'touch' && !event.buttons) return
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  if (box.width && box.height) player.value?.setPointer((event.clientX-box.left)/box.width-.5,(event.clientY-box.top)/box.height-.5)
}
function key(event: KeyboardEvent) {
  if(event.target !== event.currentTarget) return
  const points: Record<string,[number,number]> = {ArrowLeft:[-.5,0],ArrowRight:[.5,0],ArrowUp:[0,-.5],ArrowDown:[0,.5],Escape:[0,0]}
  const point = points[event.key]; if(point) { event.preventDefault(); player.value?.setPointer(...point) }
}
function neutral() { autoplay.value = false; player.value?.pause(); player.value?.reset() }
</script>
<template>
  <h2>{{ tr('06. 分層引擎預覽') }}</h2>
  <p>{{ tr('v2 分層播放器使用獨立附件與圖集。這份海月預覽只有可見裁片，尚缺遮擋補圖；持傘手與傘共用剛性變換，髮尾使用局部彈簧。') }}</p>
  <div class="layered-demo">
    <div class="layered-demo-stage" tabindex="0" role="group" :aria-label="tr('分層角色互動預覽')" @pointermove="move" @pointerleave="player?.setPointer(0,0)" @pointercancel="player?.setPointer(0,0)" @pointerup="($event.pointerType === 'touch') && player?.setPointer(0,0)" @blur.self="player?.setPointer(0,0)" @keydown="key">
      <YuragiLayeredCharacter :model="model" :autoplay="autoplay" :alt="model.name" @ready="ready" @frame="snapshot = $event" @error="failure = $event.message; player = undefined" />
    </div>
    <div class="layered-demo-controls">
      <p>{{ tr('移動游標或使用方向鍵，Escape 回到中心。') }}</p>
      <button class="button" @click="autoplay = !autoplay">{{ autoplay ? tr('暫停') : tr('播放') }}</button>
      <button class="button" @click="neutral">{{ tr('檢查中立原畫') }}</button>
      <dl v-if="snapshot">
        <dt>Draw calls</dt><dd>{{ snapshot.diagnostics.drawCalls }}</dd>
        <dt>Vertices / triangles</dt><dd>{{ snapshot.diagnostics.vertices }} / {{ snapshot.diagnostics.triangles }}</dd>
        <dt>Atlas</dt><dd>{{ (snapshot.diagnostics.atlasBytes / 1048576).toFixed(1) }} MiB</dd>
        <dt>{{ tr('CPU 更新與提交') }}</dt><dd>{{ snapshot.diagnostics.cpuMilliseconds.toFixed(2) }} ms</dd>
      </dl>
      <p>{{ tr('數據是此瀏覽器的 CPU 更新與繪製提交，不包含 GPU 完成時間。實體手機與補圖後的視覺驗收仍需另測。') }}</p>
      <p v-if="failure" role="alert">{{ tr('目前顯示原畫。') }} {{ failure }}</p>
    </div>
  </div>
</template>
<style scoped>
.layered-demo{display:grid;grid-template-columns:minmax(0,320px) minmax(0,1fr);gap:32px;align-items:center;margin:24px 0}
.layered-demo-stage{background:linear-gradient(145deg,#e9efff,#f5f0fa);border-radius:24px;overflow:hidden;padding:24px}
.layered-demo-stage:focus-visible{outline:3px solid #537ade;outline-offset:4px}
.layered-demo-controls .button{margin:0 8px 12px 0}
dl{display:grid;grid-template-columns:1fr auto;gap:8px;font-size:.85rem}dd{margin:0;font-variant-numeric:tabular-nums}
@media(max-width:680px){.layered-demo{grid-template-columns:1fr}.layered-demo-stage{max-width:320px;width:100%;box-sizing:border-box;margin:auto}}
</style>
