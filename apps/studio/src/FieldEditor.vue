<script setup lang="ts">
import { computed } from 'vue'
import type { Json, Path } from '../../../packages/rig/src/studio/document'
import type { RigModel } from '@yuragi/rig'
import DropdownSelect from '../../site/src/components/DropdownSelect.vue'
import { arrayItem, optionalFields, choices } from './schema'
const props = defineProps<{ value: Json; path: Path; model: RigModel; readonly?: boolean; depth?: number }>()
const emit = defineEmits<{ change: [path: Path, value: Json | undefined]; select: [path: Path] }>()
const label = computed(() => String(props.path.at(-1) ?? 'model'))
const fixed = computed(() => props.readonly || props.path[0] === 'texture' || props.path.length === 1 && ['version','id'].includes(label.value))
const options = computed(() => choices(props.path, props.model))
const objectValue = computed(() => props.value && typeof props.value === 'object' && !Array.isArray(props.value) ? props.value : {})
const missing = computed(() => Object.entries(optionalFields(props.path, props.model)).filter(([key]) => !(key in objectValue.value)))
const removable = computed(() => !fixed.value && props.path.length > 0 && String(props.path.at(-1)) in optionalFields(props.path.slice(0,-1),props.model))
const newItem = computed(() => props.path.at(-1) === 'pins' && props.path[0] === 'surfaceRegions' ? props.model.pins[0]?.name : arrayItem(props.path, props.model))
function number(event: Event) { const input = event.target as HTMLInputElement; if (input.value !== '' && Number.isFinite(input.valueAsNumber)) emit('change', props.path, input.valueAsNumber) }
</script>
<template>
  <div class="field" :class="{ collection: value !== null && typeof value === 'object' }">
    <button v-if="removable" class="mini remove-optional" :aria-label="`Remove optional ${label}`" @click="emit('change',path,undefined)">× {{ label }}</button>
    <template v-if="Array.isArray(value)">
      <div class="field-caption"><button class="text-button" @click="emit('select', path)">{{ label }} <span>{{ value.length }}</span></button><button v-if="!fixed && newItem !== undefined" class="mini" @click="emit('change', path, [...value, newItem])">＋</button></div>
      <div v-for="(item, i) in value" :key="i" class="array-item"><FieldEditor :value="item" :path="[...path,i]" :model="model" :readonly="fixed" :depth="(depth ?? 0)+1" @change="(p,v) => emit('change',p,v)" @select="p => emit('select',p)" /><button v-if="!fixed && newItem !== undefined" class="remove-item" :aria-label="`Remove ${label} ${i}`" @click="emit('change',[...path,i],undefined)">×</button></div>
    </template>
    <template v-else-if="value !== null && typeof value === 'object'">
      <details :open="(depth ?? 0) < 2"><summary @click="emit('select',path)">{{ label }}</summary><FieldEditor v-for="(item, key) in value" :key="key" :value="item" :path="[...path,String(key)]" :model="model" :readonly="fixed" :depth="(depth ?? 0)+1" @change="(p,v) => emit('change',p,v)" @select="p => emit('select',p)" /><div v-if="!fixed" class="optional-fields"><button v-for="([key, initial]) in missing" :key="key" class="mini" @click="emit('change',[...path,key],initial)">＋ {{ key }}</button></div></details>
    </template>
    <label v-else-if="typeof value === 'number'" class="scalar"><span>{{ label }}</span><input type="number" step="any" :value="value" :disabled="fixed" @change="number" /></label>
    <label v-else-if="typeof value === 'boolean'" class="scalar"><span>{{ label }}</span><input type="checkbox" :checked="value" :disabled="fixed" @change="emit('change',path,($event.target as HTMLInputElement).checked)" /></label>
    <DropdownSelect v-else-if="options && !fixed" :label="label" :model-value="String(value)" :options="options.map(value => ({ value, label: value }))" @update:model-value="v => emit('change',path,v)" />
    <label v-else class="scalar"><span>{{ label }}</span><input :value="value ?? ''" :disabled="fixed" @change="emit('change',path,($event.target as HTMLInputElement).value)" /></label>
  </div>
</template>
