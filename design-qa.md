# Yuragi workspace redesign QA

final result: passed

## Comparison target and evidence

- Source visual truth: `/Users/zz41354899/.codex/generated_images/01a0f785-1f2c-73a3-8931-efd9afda987a/exec-4335dd95-842f-4457-a241-511cb41cd7a2.png` (1051 × 1496 px).
- Source crops: document `(0, 0, 1051, 890)`; playground `(0, 902, 1051, 1496)`.
- Local implementation: `http://127.0.0.1:4310/docs?section=custom-character` and `/playground`.
- Matched CSS viewports: documents 1051 × 890; playground 1051 × 594. State: Traditional Chinese, Vue selected, light theme, default Momo model, head-root selected, 100% zoom, paused for stable capture. Playground select has visible focus in the final small-screen capture.
- Browser screenshots: `artifacts/qa/reading-reference-size.jpg` (1036 × 877 returned content pixels; browser scrollbar/content capture differs from full CSS viewport), `artifacts/qa/studio-reference-size.jpg` (1051 × 594). Source crops and actual captures are compared at native pixel size without stretching. No claim of exact pixel identity or identical mockup font metrics.
- Combined full-view evidence, inspected together: `artifacts/qa/reading-comparison.jpg`, `artifacts/qa/studio-comparison.jpg`.
- Combined native-scale typography/controls evidence: `artifacts/qa/reading-detail-comparison.jpg`, `artifacts/qa/studio-detail-comparison.jpg`.
- Additional responsive evidence: `artifacts/qa/reading-desktop-final.jpg`, `artifacts/qa/studio-desktop-final.jpg` at 1440 × 900 CSS; `artifacts/qa/reading-mobile-final.jpg`, `artifacts/qa/studio-mobile-final.jpg` at 390 × 844 CSS.

## Findings and comparison history

No remaining actionable P0/P1/P2 findings within the approved layout and the user's latest no-download requirement.

1. **P2, numeric field submission:** initial editing of X appeared in the input but did not update the pin after Tab. Changed the handler to validated numeric input updates. Post-fix evidence: `studio-edit-verified.jpg`; X 0.540 moved the pin to 54%, ArrowRight produced X 0.541 and 54.1%.
2. **P2, desktop region proportions:** initial sidebar/inspector were too narrow against the board. Changed documentation sidebar to responsive 20.2% (215–290px) and inspector to 28% (310–400px), adjusted title/body scale. Compared the revised full-view captures together again.
3. **P2, short desktop viewport:** a 660px workspace minimum pushed persistent controls outside a 594px-high viewport. Reduced the minimum and introduced compact desktop header/panel spacing and height-aware artwork sizing. Post-fix DOM dimensions: viewport and scroll size both 1051 × 594; installation footer remained entirely in view. Revised full-view and focused control comparisons were inspected after the fix.
4. **P2, compact sidebar wrapping:** long Chinese chapter names wrapped at the reference width. Reduced compact sidebar padding/gap and text to 14px. Revised document comparison shows single-line chapter entries.
5. **P3, native range styling:** replaced the dark platform-default track with a light blue-gray track and cyan thumb. Revised detail comparison confirms consistent palette and no replacement of the actual range control.

## Required fidelity surfaces

- **Fonts/typography:** uses the existing locally served Source Han Sans TW/JP families, confirmed loaded in the live browser. Sans-serif headings, body and UI retain clear weight hierarchy, generous line height, no clipped headings. Compact desktop sidebar avoids forced wrapping. Framework examples retain a readable monospace font for code semantics.
- **Spacing/layout:** canvas-first split, floating left tools, bottom transport and right inspector match the selected playground direction. Chapter sidebar, breadcrumb/version selector, blue warning, five-step navigation and artwork/specification card match the selected document direction. Desktop inspector content scrolls independently; persistent installation action stays visible. Mobile stacks inspector below canvas and uses a chapter selector.
- **Colors/tokens:** white/light blue surfaces, cyan selected controls, navy text, quiet borders. Contrast/focus rings are visible; no new decorative gradient/illustration approximation was introduced.
- **Image quality:** original Momo WebP is reused without distortion or regeneration, with original transparency and original motion. Supplied brand mark and library icons are reused. The original model has 33 pins, deliberately all available rather than reducing it to the mockup's illustrative few pins.
- **Copy/content:** download/export text in the reference is intentionally superseded by the latest user instruction. CTAs lead to package installation. Documentation retains the full five-stage workflow, exact model limits/coordinates/errors, and explicit image-replacement limitations. Longer real guidance naturally moves later steps below the first fold; shortening essential content to the mock's placeholder text is not an acceptance requirement. Future npm installation is explicitly described as not yet published.

## Verified interactions and distribution

- Native pin drag changed X/Y from 0.520/0.280 to 0.573/0.299; native pan produced `translate(45px, 35px) scale(1)`.
- Numeric pin edit, arrow-key fine adjustment, zoom to 120%, fit/reset, pause/play and wave work. Wave restored the playing state.
- Inspector tabs support ArrowLeft/ArrowRight and move focus to the selected tab.
- Vue/React document switching changes adapter imports, lifecycle examples and API reference; framework selection survives chapter navigation.
- Three-language mobile smoke checks found no horizontal overflow. Traditional Chinese playground scroll width was 390 for a 390 viewport; EN/JA and documents had 375 content width including the browser's reserved scrollbar space. The existing mobile editor notice can be dismissed to continue previewing.
- Browser console error queries returned no errors during these checks. Reduced-motion, SSR fallback and cleanup remain covered by existing library tests; OS preference switching was not separately performed in the live browser.
- Public standalone model JSON, model ZIP and package TGZ are no longer served as static website files. Export/download UI is removed. Recoverable copies of the old downloadable archives are retained under `artifacts/retired-site-downloads/`.
- Package contains `assets/momo/model.json`, `assets/momo/texture.webp`, and `assets/starter/model.json`, with asset exports. An isolated local tarball installation loaded and validated Momo, resolved starter JSON and copied the 277066-byte texture successfully. No npm publication occurred.
- This removes standalone download delivery, not browser inspection of model data required for rendering.

## Implementation checklist

- [x] Approved playground direction and document direction implemented without replacing homepage artwork/layout.
- [x] Latest no-JSON-download instruction implemented and installation docs updated.
- [x] Full-view and focused comparisons inspected after fixes.
- [x] Desktop, compact desktop, mobile and core interactions inspected live.
- [x] `npm run typecheck`, `npm test` (21 tests), `npm run build`, `git diff --check` pass.
- [x] Browser viewport override reset; local preview left running.

## Follow-up polish / residual test gaps

- The functional inspector is less densely packed than the illustrative reference, particularly with all original pins; its scroll behavior is intentional.
- Exhaustive screen-reader, every model import failure, high text zoom and all browser engines were not re-tested in this scoped visual update.
- Do not imply the package has been published or the browser's rendering data is private.
