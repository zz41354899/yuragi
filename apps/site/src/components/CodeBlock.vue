<script setup lang="ts">
import { useText } from "../i18n"
const { tr } = useText()
import { computed, ref } from 'vue'
import Icon from './Icon.vue'
const props = defineProps<{ code: string; language?: string; filename?: string }>()
const displayCode = computed(() => props.code.replace(/(\/\/ |# |<!-- )(.+?)( -->)?$/gm, (_, prefix: string, text: string, closing: string | undefined) => prefix + tr(text) + (closing || '')).replaceAll('打個招呼', tr('打個招呼')).replaceAll('My character', tr('我的角色')))
const copied = ref(false)
const message = ref('')
async function copy() {
  try { await navigator.clipboard.writeText(displayCode.value); copied.value = true; setTimeout(() => { copied.value = false }, 1800) }
  catch { message.value = '無法複製，請選取程式碼後手動複製。' }
}
</script>
<template>
  <div class="code-block"><div class="code-header"><span>{{ tr(filename || language || 'TypeScript') }}</span><button @click="copy" :aria-label="tr(copied ? '已複製程式碼' : '複製程式碼')"><Icon :name="copied ? 'check' : 'copy'" :size="15" />{{ tr(copied ? '已複製' : '複製') }}</button></div><pre><code>{{ displayCode }}</code></pre><p v-if="message" role="status">{{ tr(message) }}</p></div>
</template>
