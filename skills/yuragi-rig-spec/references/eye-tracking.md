# Eye tracking integration

This is pointer-driven illustration gaze, not webcam or human eye detection. There is no camera input or remote tracking service. Use the current TypeScript runtime and an artwork-specific reviewed face. Models without reviewed face annotations reject setGaze/setGazeStrength.

## Author and validate

Measure each eye independently in full-source coordinates including margins. Required fields are id, center, radius, iris, irisRadius, travel, angle and sclera RGB. Eye radius .001–.06; iris radius .001–.03 and smaller than eye radius. Travel is 0–.01 and at most 45% of the radius difference. Iris offset + radius + travel must fit inside the eye; eye bounds must fit the canvas. Angle is −1…1 radians, RGB 0–1.

Face requires owned headFollow.region. Annotate headMotion/skull/neck first. Python accepts these eyes and pointerGroups directly; run inspect, annotate, extract, then build --prepared with the 0.2.0 local runtime. There is no eyelid/mouth rendering. Use the migration tool for legacy fields before validation.

## Input order and axes

| Call | Result |
| --- | --- |
| setPointer(x,y) | head/body follow plus eye target (x*2,y*2) |
| setGaze(x,y) | eye target only, finite inputs clamped to −1…1 |
| setPointer then setGaze | combined following with separately positioned eyes |
| setParameter('lookX'/'lookY', value) | eye direction resumes following head parameter |
| setGazeStrength(0) | disables pupil travel; does not clear eye target |
| reset() | neutral parameters, stops clip, resets gaze strength/direction; retains edited model/motion |

Positive X looks right in image/screen coordinates; positive Y looks down. setGaze has approximately 55ms smoothing. Pointer updates on the same engine loop do not require framework state updates. The gaze.strength animation channel is strength, not direction. There is no gazeX/gazeY animation channel.

## Vue example: eye-only stage tracking

Use a validated model with measured eyes. This maps stage position to eye direction; it does not target the exact moving face center. The adapter supplies overscan, static fallback, cancellable loading and cleanup.

```vue
<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { YuragiCharacter } from '@z7589xxz758/yuragi/vue'
import { validateModel, type RigModel, type RigPlayer } from '@z7589xxz758/yuragi'
const props = defineProps<{ model: RigModel }>()
validateModel(props.model)
let player: RigPlayer | undefined
let hasFace = false
function ready(next: RigPlayer) {
  player = next
  hasFace = !!next.getModel().face
  if (!hasFace) return
  next.setGazeStrength(1)
}
function move(event: PointerEvent) {
  if (!player || !hasFace || (event.pointerType === 'touch' && !event.buttons)) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  if (!rect.width || !rect.height) return
  player.setGaze((event.clientX - rect.left) / rect.width * 2 - 1,
                 (event.clientY - rect.top) / rect.height * 2 - 1)
}
function neutral() { if (player && hasFace) player.setGaze(0, 0) }
function key(event: KeyboardEvent) {
  if (event.target !== event.currentTarget || !player || !hasFace) return
  const points: Record<string, [number, number]> = {
    ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1], Escape: [0,0],
  }
  const point = points[event.key]
  if (point) { event.preventDefault(); player.setGaze(...point) }
}
onBeforeUnmount(() => { player = undefined })
</script>
<template>
  <div tabindex="0" role="group" aria-label="Character gaze controls"
    @pointermove="move" @pointerleave="neutral" @pointercancel="neutral"
    @pointerup="neutral" @blur="neutral" @keydown="key">
    <YuragiCharacter :model="model" @ready="ready" @error="player = undefined" />
  </div>
</template>
```

The handler caches face availability on ready; React uses @z7589xxz758/yuragi/react with onReady/onError and the same RigPlayer calls. Adapters do not install global pointer listeners: the application decides stage-only or page-wide tracking and cleans up its own listeners. On model replacement, clear stale player references until ready.

For combined tracking, calculate centered stage fractions, call setPointer first, then setGaze. For eyes aimed at the visible face, measure its source center and map it using toCanvas(center + trackingOffset) and the actual overscanned canvas bounding rectangle. Normalize event deltas by a reviewed screen-space range. trackingOffset is available in low-frequency snapshots; it covers whole-image translation only, not head rotation, sway or pointerGroups. Such alignment is approximate under motion. There is no public per-frame transformed eye-center API or exact 3D gaze solver. Keep geometry conservative and review at zoom.

## Acceptance and troubleshooting

Check center and ±X/±Y separately for each eye, combined corners, rapid reversal, pointerleave, touch drag/cancel and arrow keys. Inspect pupil edge leakage, original eye lines,  head/neck seams and clipping at face zoom. Test reduced motion, missing texture, navigation cleanup and fallback. Record executed checks and unverified ones.

- 'no reviewed face features': annotate an actual face; changing texture does not add it.
- Eye direction resets: setPointer or lookX/lookY tracks took ownership; call setGaze after pointer or stop the controlling clip.
- No visible pupil motion: check gaze strength, travel, paused state and reduced motion. Reduced motion preserves source pixels even when setters store targets.
- Distortion or edge leakage: fix measurements/masks and recreate after validateModel; increasing motion or mesh density does not supply missing pixels.

## Mirea / 海月 source and alignment

The reviewed Mirea model and original PNG now ship in assets/mirea. Import createMireaModel from @z7589xxz758/yuragi/mirea and copy assets/mirea to public/models/mirea. The website's createMireaDemoModel wraps this public factory with /images/home/mirea-base-v1.png. Historical prepared candidates may differ; compare the bundled reviewed model rather than assuming they are identical.

| Eye | center | iris | radius | irisRadius | travel | angle |
| --- | --- | --- | --- | --- | --- | --- |
| left | [.524,.167] | [.525,.1673] | [.0215,.00782] | [.0078,.0058] | [.003,.00065] | −.29 |
| right | [.584,.156] | [.585,.1558] | [.0215,.00782] | [.0078,.0058] | [.003,.00065] | −.29 |

Both use sclera [.98,.955,.99]; coordinates include original margins. HomeHeroCharacter centers pointer input on the stage, clamps each axis to ±.5 and calls setPointer first. It estimates the visible eye center from the source-eye average plus snapshot trackingOffset, then calls setGaze with deltas divided by artwork width×.18 and height×.11. Leave/cancel and touch release reset both; arrow keys control head-following through setPointer.

The Hero measures the actual artwork rectangle, so it does not apply canvas padding again. A native canvas handler instead maps source positions through toCanvas(n)=(n+.12)/1.24 and uses the overscanned canvas bounds. trackingOffset corrects whole-image drift only. Snapshots do not expose full skull rotation, sway or pointer-group transforms; aiming remains approximate. Keep travel small and visually check each eye at extremes. Pointer groups share source geometry, not independently loaded PNG layers.
