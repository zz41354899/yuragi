<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps<{
  modelValue: string
  label: string
  options: readonly { value: string; label: string }[]
  inline?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const open = ref(false)
const highlighted = ref(0)
const selectedIndex = computed(() => props.options.findIndex(option => option.value === props.modelValue))
const selectedLabel = computed(() => props.options[selectedIndex.value]?.label ?? '')
let search = ''
let lastTyped = 0

function close() {
  open.value = false
  search = ''
}
async function reveal(index = Math.max(0, selectedIndex.value)) {
  if (!props.options.length) return
  highlighted.value = index
  open.value = true
  await nextTick()
  scrollToHighlight()
}
function scrollToHighlight() {
  root.value?.querySelectorAll<HTMLElement>('[role="option"]')[highlighted.value]?.scrollIntoView({ block: 'nearest' })
}
function choose(index: number) {
  const option = props.options[index]
  if (!option) return
  close()
  trigger.value?.focus({ preventScroll: true })
  emit('update:modelValue', option.value)
}
async function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab') { close(); return }
  if (event.key === 'Escape') {
    if (open.value) { event.preventDefault(); event.stopPropagation(); close() }
    return
  }
  if (['Enter', ' '].includes(event.key)) {
    event.preventDefault()
    if (open.value) choose(highlighted.value)
    else await reveal()
    return
  }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
    if (!open.value) await reveal()
    else if (event.key === 'ArrowDown') highlighted.value = Math.min(props.options.length - 1, highlighted.value + 1)
    else if (event.key === 'ArrowUp') highlighted.value = Math.max(0, highlighted.value - 1)
    if (event.key === 'Home') highlighted.value = 0
    if (event.key === 'End') highlighted.value = props.options.length - 1
    await nextTick()
    scrollToHighlight()
    return
  }
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    const now = Date.now()
    search = now - lastTyped < 700 ? search + event.key : event.key
    lastTyped = now
    const index = props.options.findIndex(option => option.label.toLocaleLowerCase().startsWith(search.toLocaleLowerCase()))
    if (index >= 0) await reveal(index)
  }
}
function onOutside(event: Event) {
  if (event.target instanceof Node && !root.value?.contains(event.target)) close()
}
watch(() => props.modelValue, close)
onMounted(() => {
  document.addEventListener('pointerdown', onOutside)
  document.addEventListener('focusin', onOutside)
  window.addEventListener('resize', close)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside)
  document.removeEventListener('focusin', onOutside)
  window.removeEventListener('resize', close)
})
</script>

<template>
  <div ref="root" class="dropdown-select" :class="{ 'dropdown-select-inline': inline, 'dropdown-select-open': open }">
    <span :id="`${id}-label`" class="dropdown-select-label">{{ label }}</span>
    <div class="dropdown-select-control">
      <button ref="trigger" type="button" class="dropdown-select-trigger" role="combobox"
        :aria-labelledby="`${id}-label ${id}-value`" aria-haspopup="listbox" :aria-expanded="open"
        :aria-controls="`${id}-list`" :aria-activedescendant="open ? `${id}-option-${highlighted}` : undefined"
        @click="open ? close() : reveal()" @keydown="onKeydown">
        <span :id="`${id}-value`">{{ selectedLabel }}</span><Icon name="caret-down" :size="16" />
      </button>
      <ul v-if="open" :id="`${id}-list`" class="dropdown-select-list" role="listbox" :aria-labelledby="`${id}-label`">
        <li v-for="(option, index) in options" :id="`${id}-option-${index}`" :key="option.value"
          role="option" :aria-selected="option.value === modelValue"
          :class="{ highlighted: highlighted === index }" @pointermove="highlighted = index"
          @mousedown.prevent @click="choose(index)">
          <span>{{ option.label }}</span><Icon v-if="option.value === modelValue" name="check" :size="17" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.dropdown-select { min-width: 0; max-width: 100%; }
.dropdown-select-open { position: relative; z-index: 20; }
.dropdown-select-label { display: block; margin-bottom: 8px; color: var(--muted); font-size: 12px; line-height: 1.5; }
.dropdown-select-control { position: relative; min-width: 0; }
.dropdown-select-trigger { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; min-height: 48px; padding: 10px 12px; border: 1px solid #cfe4ee; border-radius: 8px; background: #f5fbff; color: var(--ink); font: inherit; font-size: 14px; line-height: 1.6; text-align: left; cursor: pointer; }
.dropdown-select-trigger > span { min-width: 0; overflow-wrap: anywhere; }
.dropdown-select-trigger > svg { flex-shrink: 0; transition: transform .15s ease; }
.dropdown-select-open .dropdown-select-trigger { border-color: #009fcc; }
.dropdown-select-open .dropdown-select-trigger > svg { transform: rotate(180deg); }
.dropdown-select-list { position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 1; max-height: min(360px, 45dvh); margin: 0; padding: 6px; overflow-y: auto; overscroll-behavior: contain; list-style: none; border: 1px solid #cfe4ee; border-radius: 10px; background: white; box-shadow: 0 12px 32px #12364c24; }
.dropdown-select-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 10px; border-radius: 6px; color: #486b81; font-size: 14px; line-height: 1.6; overflow-wrap: anywhere; cursor: pointer; }
.dropdown-select-list li[aria-selected=true] { color: #008bb7; font-weight: 600; }
.dropdown-select-list li.highlighted { background: #e7f7fe; }
.dropdown-select-list li > svg { flex-shrink: 0; }
.dropdown-select-inline { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; }
.dropdown-select-inline .dropdown-select-label { margin-bottom: 0; min-width: 0; }
.dropdown-select-inline .dropdown-select-control { width: 140px; flex: 0 0 140px; }
.dropdown-select-inline .dropdown-select-trigger { min-height: 40px; background: white; font-size: 13px; }
@media (prefers-reduced-motion: reduce) { .dropdown-select-trigger > svg { transition: none; } }
</style>
