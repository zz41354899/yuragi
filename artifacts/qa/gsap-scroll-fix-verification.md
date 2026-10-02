# GSAP scroll flicker investigation — 2026-10-02

## Reproduced cause

The original paused from-tween used immediateRender:false and started at top 86%. Before reaching that threshold, content had already entered the viewport at opacity=1. Starting the tween then set opacity back to 0, causing a visible disappearance and re-entry.

Desktop reproduction (720 px viewport): Momo preview was already visible at scrollY=130, top=645.59, opacity=1. After scrolling past the old 619.2 px threshold to scrollY=202, its opacity dropped to 0.8738 and transform was still moving. No browser console errors were needed to reproduce this visual bug.

## Changes

- Only prepare reveal start states for groups that are offscreen. Never hide a group already in view during setup or a restored position.
- Render the initial state immediately while offscreen; start at the viewport boundary and play once. Retain focus-in completion and context cleanup.
- Reduce entry displacement to 16 px and duration to 0.6 s. Make workflow number scrubbing linear with only 5% scale change instead of elastic overshoot.
- Ignore unchanged ResizeObserver measurements; coalesce actual layout changes for 150 ms and use safe ScrollTrigger.refresh(true). Cancel the observer and scheduled callback on cleanup.
- Pause opening decorations in place before the curtain exit instead of reverting them to their original positions. Remove the second GSAP writer to the meter transform already owned by Vue. Context reversion still runs during unmount.

## Verification

- Desktop after fix: offscreen preview opacity=0. At first entry it rose to 0.9119. At scrollY=130 it reached 1; crossing the former threshold to scrollY=202 kept opacity=1 and transform=none.
- Mobile 390 × 844: offscreen title opacity=0 at top=958.34; first entry reached 0.7712 at top=744.34, then 1. Crossing the former 725.84 px threshold to top=617.34 retained opacity=1.
- Fast down/up scrolling left already-revealed groups opaque. Mobile reversal, docs navigation, homepage return, and automatic opening exit checked. No horizontal overflow or browser errors/warnings observed.
- npm run typecheck passed. npm test passed (13 library + 8 website). npm run build and git diff --check passed.
- Momo artwork/rig calculations and static katakana logo were not changed. System reduced-motion preference was not changed during this browser pass; preference handling remains scoped through matchMedia and existing rig tests passed.

Screenshots: gsap-scroll-fix-desktop.jpg, gsap-scroll-fix-mobile.jpg.
