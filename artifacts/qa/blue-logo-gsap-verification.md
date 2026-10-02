# Blue wordmark and GSAP website polish — 2026-10-02

- Original SVG Yuragi wordmark: rounded blue lettering, white sticker silhouette, cyan stars and heart; reference used only for visual direction. Applied to navigation and footer, with a matching favicon.
- GSAP 3.15: staggered hero/document headings, scroll-triggered section/card reveals, finite star flourishes, button hover/focus/press feedback, and wordmark letter bounce.
- GSAP and ScrollTrigger load asynchronously after mount. Character artwork and rig deformation are unchanged. Playground canvas/tool transforms are excluded from page animation.
- Motion is scoped through GSAP matchMedia to prefers-reduced-motion: no-preference. Page changes and unmount revert contexts and remove event listeners. Asynchronous setup is guarded against obsolete routes/unmount.
- Typecheck passed; npm test passed (13 library + 8 website tests); final production build passed with animation code in separate chunks and no chunk-size warning. git diff --check passed.
- Live in-app browser: desktop 1440 × 960 and mobile 390 × 844; no horizontal overflow. Header logo widths verified at 210 px on desktop home and 144 px on mobile docs.
- Verified Momo wave selection, navigation to the complete pin editor, mobile menu, docs navigation and route return. Browser error/warning logs empty during the final inspection.
- The new GSAP media-query behavior was reviewed in code. Browser/system reduced-motion preference was not changed during this pass; existing rig reduced-motion tests passed.
- Screenshots: blue-logo-gsap-desktop.jpg, blue-logo-home-mobile.jpg, blue-logo-docs-mobile.jpg.
