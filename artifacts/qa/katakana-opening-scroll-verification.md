# Katakana logo, opening, and scroll polish — 2026-10-02

- Removed all wordmark animation and replaced header/footer with the original generated blue ユラギ / YURAGI PNG. Updated favicon to ユ. PNG alpha confirmed; original retained and a smaller website copy provided.
- Initial homepage opening waits for eager images/fonts, shows settled-asset progress, and uses GSAP decorative orbit/star motion plus a curtain exit. The logo has no independent transform or tween. Skip control restores focus to main. Readiness is bounded at 3.5 seconds and an optional animation-chunk stall does not trap the page.
- Opening locks scroll temporarily, makes background controls inert, restores both after exit, cancels image listeners/timers on unmount, and respects reduced-motion preferences.
- Kept native scrolling. Blue thin scrollbar plus a GSAP ScrollTrigger reading progress indicator; per-section child reveals, light hero decoration parallax, and scroll-linked workflow markers. Playground geometry is excluded. Route/media changes revert GSAP contexts; ResizeObserver is disconnected on cleanup.
- Final npm run typecheck, npm test (13 library + 8 website tests), npm run build, and git diff --check passed. Existing translation test now includes OpeningLoader.
- Live browser: default desktop viewport and 390 × 844 mobile; header logo loaded, static transform=none, no horizontal overflow. Opening exited automatically. Skip explicitly verified: main focus, inert removed, overflow restored. SPA return from docs did not replay opening.
- Scroll ratio measured at 0.2415477; GSAP indicator matrix scaleX=0.2415. Native scrollbar colors verified. Momo wave selection still works. Browser error/warning logs empty.
- System reduced-motion preference was not changed during browser QA. New reduced-motion branches were inspected in code; existing rig preference-change tests passed.
- Screenshots include katakana-opening-desktop.jpg, katakana-opening-mobile.jpg, katakana-home-mobile.jpg, katakana-scroll-progress-desktop.jpg.
