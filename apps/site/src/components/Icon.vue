<script setup lang="ts">
import { computed, type Component } from 'vue'
import { PhEye, PhDesktop, PhList, PhGlobe, PhCaretDown, PhPushPin, PhArrowsOutCardinal, PhArrowRight, PhWaveSine, PhPlay, PhPause, PhCopy, PhSlidersHorizontal, PhBone, PhDownloadSimple, PhArrowCounterClockwise, PhCode, PhX, PhCheck, PhCursor, PhHandWaving, PhBookOpen, PhWarningCircle, PhGridFour, PhCornersOut, PhPlus, PhMinus, PhStack } from '@phosphor-icons/vue'
const props = withDefaults(defineProps<{ name?: string; size?: number }>(), { name: 'wave', size: 20 })
const icons: Record<string, Component> = { eye: PhEye, desktop: PhDesktop, menu: PhList, globe: PhGlobe, 'caret-down': PhCaretDown, pin: PhPushPin, move: PhArrowsOutCardinal, 'arrow-right': PhArrowRight, wave: PhWaveSine, play: PhPlay, pause: PhPause, copy: PhCopy, sliders: PhSlidersHorizontal, bones: PhBone, download: PhDownloadSimple, reset: PhArrowCounterClockwise, code: PhCode, close: PhX, check: PhCheck, pointer: PhCursor, hand: PhHandWaving, book: PhBookOpen, warning: PhWarningCircle }
Object.assign(icons, { grid: PhGridFour, fit: PhCornersOut, plus: PhPlus, minus: PhMinus, layers: PhStack })
const icon = computed(() => icons[props.name] || PhWaveSine)
</script>
<template>
  <svg v-if="name === 'mesh'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 4 17 3 21 11 18 20 5 21 2 12Z M4 4 12 11 17 3 M21 11 12 11 18 20 M5 21 12 11 2 12" />
  </svg>
  <svg v-else-if="name === 'skeleton'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 6v9M5 10l7-2 7 2M12 15l-5 5M12 15l5 5" />
    <circle cx="12" cy="4" r="2" /><circle cx="5" cy="10" r="1.5" /><circle cx="19" cy="10" r="1.5" /><circle cx="12" cy="15" r="1.5" /><circle cx="7" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" />
  </svg>
  <component v-else :is="icon" :size="size" weight="regular" aria-hidden="true" />
</template>
