# Control-point playback repair — 2026-10-03

User clarification: after dragging a control point, the character stops while other controls remain usable.

## Cause and change

Entering the control-point tab previously paused the player and set motion weight to zero. A subsequent drag recorded that temporary pause as the prior playback state, so releasing the pin did not restart animation. Keyboard and numeric edits also left the neutral preview active.

The tab now preserves playback. A scoped edit-preview controller pauses only while positioning a pin, then restores the actual player's previous motion weight and playback state. Numeric and keyboard edits restore in a finally block. Explicit manual pauses and reduced motion remain respected.

Window capture listeners handle pointer release/cancellation beyond the canvas, and window blur completes an interrupted gesture. A mouse move reporting zero buttons saves its terminal position and completes the gesture when a release event was missed. Listeners are removed on unmount. Temporary event diagnostics were removed.

## Verification

- npm run typecheck: passed.
- npm test: 44 library tests and 17 website tests passed, including four edit-preview regression tests.
- npm run build: passed; Vite retains its existing >500 kB chunk advisory.
- git diff --check: passed.
- Live Chrome at http://127.0.0.1:4310/playground: skeleton, Mesh and triangle grid enabled together.
- Entering the control-point tab and keyboard/numeric edits retained playback.
- A playing drag updated head-top X from .569 to .572 and Y from .128 to .143, completed the drag and restored playback. The guide's rendered coordinates continued changing in subsequent samples.
- A manually paused drag updated coordinates and retained the manual pause. After removal of temporary diagnostics, this was repeated with head-top X .556 → .581.
- Influence radius .005/.010 and repeated slider inputs remained responsive. Final review state matches the user's X .556, Y .117, radius .180, with playback active.
- No captured browser warnings/errors during final verification.

Screenshot: `drag-playback-fixed.png`. These checks verify the reported edit/pause behavior locally, not every possible browser or runtime failure.
