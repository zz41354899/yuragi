<script setup lang="ts">
import { computed, type Component } from 'vue'
import { PhDesktop, PhList, PhGlobe, PhCaretDown, PhPushPin, PhArrowsOutCardinal, PhArrowRight, PhWaveSine, PhPlay, PhPause, PhCopy, PhSlidersHorizontal, PhBone, PhDownloadSimple, PhArrowCounterClockwise, PhCode, PhX, PhCheck, PhCursor, PhHandWaving, PhBookOpen, PhWarningCircle, PhGridFour, PhCornersOut, PhPlus, PhMinus } from '@phosphor-icons/vue'
const props = withDefaults(defineProps<{ name?: string; size?: number }>(), { name: 'wave', size: 20 })
const icons: Record<string, Component> = { desktop: PhDesktop, menu: PhList, globe: PhGlobe, 'caret-down': PhCaretDown, pin: PhPushPin, move: PhArrowsOutCardinal, 'arrow-right': PhArrowRight, wave: PhWaveSine, play: PhPlay, pause: PhPause, copy: PhCopy, sliders: PhSlidersHorizontal, bones: PhBone, download: PhDownloadSimple, reset: PhArrowCounterClockwise, code: PhCode, close: PhX, check: PhCheck, pointer: PhCursor, hand: PhHandWaving, book: PhBookOpen, warning: PhWarningCircle }
Object.assign(icons, { grid: PhGridFour, fit: PhCornersOut, plus: PhPlus, minus: PhMinus })
const icon = computed(() => icons[props.name] || PhWaveSine)
</script>
<template><component :is="icon" :size="size" weight="regular" aria-hidden="true" /></template>
