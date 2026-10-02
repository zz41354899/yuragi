<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useText } from '../i18n'
import { integrationExamples, handleExamples, type Framework } from '../docs/framework-examples'
import CodeBlock from './CodeBlock.vue'
const props = defineProps<{ framework: Framework; integration?: boolean }>()
const { tr } = useText()
const ReactExample = defineAsyncComponent(() => import('./ReactExample.vue'))
const isVue = computed(() => props.framework === 'vue')
const commonProps = [
  ['model', 'RigModel', '必要', '完整模型物件；替換物件會取消舊載入並重建播放器。請保持物件身分穩定，不要在每次 render 建立模型。'],
  ['autoplay', 'boolean', 'true', '控制播放／暫停，變更時不重建 WebGL；系統減少動態仍優先。'],
  ['reducedMotion', "'respect' | 'ignore'", "'respect'", '尊重系統偏好；ignore 必須由產品明確決定，不建議預設略過。變更值會重新建立播放器。'],
  ['alt', 'string', "'Animated illustration'", '根元素的無障礙名稱；請填入角色名稱或描述。內部備援圖片不重複朗讀。'],
]
const callbacks = computed(() => [
  [isVue.value ? '@ready' : 'onReady', '(player: RigPlayer) => void', '初始化完成後提供播放器；每次模型重新載入都會再次觸發。'],
  [isVue.value ? '@error' : 'onError', '(error: Error) => void', '包含圖片載入、尺寸、WebGL 初始化或執行期間錯誤；元件自動退回原畫。取消卸載不當成錯誤。'],
  [isVue.value ? '@frame' : 'onFrame', '(snapshot: RigSnapshot) => void', '動畫中約每 100ms 回報快照；初始化、尺寸或手動操作也可能立即回報，不是固定 10Hz 計時器。'],
])
</script>
<template>
  <section class="framework-reference">
    <div class="framework-summary"><span class="framework-badge">{{ isVue ? 'Vue 3' : 'React 18 / 19' }}</span><code>{{ isVue ? '@yuragi/rig/vue' : '@yuragi/rig/react' }}</code></div>
    <p class="docs-lead">{{ tr(isVue ? 'Vue 元件管理載入、原畫備援與卸載清理。以 props 控制播放，透過事件或元件 ref 取得 RigPlayer。' : 'React adapter 獨立匯入，支援 Strict Mode。模型使用延遲初始化保持穩定，播放器留在 ref，不以逐幀 state 驅動動畫。') }}</p>
    <template v-if="integration"><h2>{{ tr('完整互動範例') }}</h2><p>{{ tr('先安裝本機套件並放入 Momo 圖片。以下包含載入錯誤、播放控制、游標互動、揮手與低頻 UI 快照。') }}</p><CodeBlock :code="integrationExamples[framework]" :filename="isVue ? 'Character.vue' : 'Character.tsx'" /></template>
    <h2>{{ tr('元件 Props') }}</h2>
    <div class="table-scroll"><table><thead><tr><th>{{ tr('屬性') }}</th><th>{{ tr('型別') }}</th><th>{{ tr('預設值') }}</th><th>{{ tr('行為') }}</th></tr></thead><tbody><tr v-for="row in commonProps" :key="row[0]"><td><code>{{ row[0] }}</code><small v-if="row[0] === 'reducedMotion' && isVue">reduced-motion</small></td><td><code>{{ row[1] }}</code></td><td><code>{{ tr(row[2]) }}</code></td><td>{{ tr(row[3]) }}</td></tr><template v-if="!isVue"><tr><td><code>className</code></td><td><code>string</code></td><td>undefined</td><td>{{ tr('套用在元件根容器，不是內部 canvas。') }}</td></tr><tr><td><code>style</code></td><td><code>CSSProperties</code></td><td>undefined</td><td>{{ tr('合併至根容器；可設定 width／maxWidth。除非刻意更改裁切，不要覆寫模型 aspectRatio。') }}</td></tr></template></tbody></table></div>
    <p v-if="isVue">{{ tr('Vue 的 class／style 是根元素透傳屬性，不是 adapter 宣告的 props；reducedMotion 在 template 可寫成 reduced-motion。') }}</p>
    <h2>{{ tr(isVue ? 'Vue 事件' : 'React callbacks') }}</h2><div class="table-scroll"><table><thead><tr><th>{{ tr('介面') }}</th><th>{{ tr('型別') }}</th><th>{{ tr('行為') }}</th></tr></thead><tbody><tr v-for="row in callbacks" :key="row[0]"><td><code>{{ row[0] }}</code></td><td><code>{{ row[1] }}</code></td><td>{{ tr(row[2]) }}</td></tr></tbody></table></div>
    <h2>{{ tr('透過 ref 取得播放器') }}</h2><p>{{ tr(isVue ? 'Vue expose 提供 getPlayer()。以下 handle 型別在使用端定義；套件沒有匯出 Vue 的 YuragiCharacterHandle。' : 'React adapter 匯出 YuragiCharacterHandle 與 YuragiCharacterProps。getPlayer() 在載入前與清理後可能是 undefined，呼叫方法前請判斷。') }}</p><CodeBlock :code="handleExamples[framework]" :filename="isVue ? 'Character.vue · ref' : 'Character.tsx · ref'" />
    <h2>{{ tr('更新、清理與 SSR') }}</h2><ul class="docs-checklist"><li>{{ tr('替換 model 或 reducedMotion 會取消舊載入、銷毀舊播放器，再建立新的實例；不要保留過期的 ready 實例。') }}</li><li>{{ tr('修改動態請呼叫 setMotion()／setPin()。直接深層修改 model 不會自動同步進既有播放器；需要更換完整物件或使用播放器方法。') }}</li><li>{{ tr('元件卸載自動取消圖片載入，移除 observer／事件並釋放 WebGL。不要自行啟動第二個 requestAnimationFrame 迴圈。') }}</li><li>{{ tr('SSR 可安全匯入並輸出備援原畫；WebGL 在掛載後才建立。Next.js 使用 hooks 的範例需放在 use client 元件。') }}</li><li>{{ tr('pixelRatio 與 signal 只屬於 createPlayer 原生 API，不是 Vue／React 元件 props；元件在內部管理取消訊號。') }}</li></ul>
    <template v-if="integration && !isVue"><h2>{{ tr('實際運作的 React 範例') }}</h2><ReactExample /></template>
  </section>
</template>
