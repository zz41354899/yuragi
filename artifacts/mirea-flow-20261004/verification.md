# Mirea interaction flow — 2026-10-04

Adjusted the built-in Mirea motion profile in the authored model, package asset,
and generated opt-in TypeScript entry. No runtime algorithm or public API changed.
The source illustration, masks, ownership regions, face data and pivots are preserved.

- Idle sway: 0.32 → 0.52; speed: 0.62 → 0.72.
- Tracking response: 0.0735 → 0.028; damping: 0.694 → 0.80;
  maximum velocity: 3.14 → 1.8; translation: [0.07, 0.046667] → [0.052, 0.036].
- Upper/pelvis group delay: 105/220 → 160/300 ms.
- Long hair angle limits increase 26%; ribbon limits increase 66.5%; cloth limits
  increase 8%. Softer springs give curls, hems and ribbons different delays.
  Bangs, pendant and arm angle limits decrease 10% to leave deformation headroom.

## Validation

`npm run typecheck`, `npm test` (71 rig + 17 site tests), `npm run build`, and
`git diff --check` passed. The first sandboxed test run could not bind localhost;
the full suite passed on rerun with permission to launch local test servers.
Build reports the existing large-chunk advisory.

The numeric fixture retains previous and tuned snapshots at 12 frames covering
idle, movement, reversal and return. The original legacy and studio baselines pass.
At the first 60 Hz tracking frame, lookX changes by 0.54248 rather than 1.29399
(42% of the previous initial movement). At 300 ms it reaches 27.22/30; one second
after release it is within 0.053 of neutral. Tracking timing matches at 30/60/120 Hz.
In the recorded 600-frame sequence, the minimum triangle area ratio improves from
0.59731 to 0.62181, and the tuned profile never needs fold-limiter suppression.
Existing reversal/stall tests also preserve rigid crossed legs and held umbrella.
Reduced-motion geometry exactly matches rest positions; the artwork checksum passes.

Live browser: loaded the tuned Playground values, checked ArrowRight, ArrowLeft
and Escape interactions, and reviewed the artwork with the complete umbrella and
crossed legs. Canvas reports motionScale=1. No browser warning/error logs were seen.
`playground.jpg` records the resulting preview. Physical touch-device testing was
not performed.

`model-before.json` captures the pre-edit profile. `measure.ts` reproduces the
before/after numeric fixture from that model and the current packaged model.
