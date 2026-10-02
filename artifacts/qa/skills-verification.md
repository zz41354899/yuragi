# Yuragi Skills verification · 2026-10-02

- Migrated Kirameki Catch’s character skill into `skills/yuragi-character`, including seven reference guides and updated invocation metadata. The original project was preserved.
- Added `skills/yuragi-rig-spec` with an API reference, current TypeScript model contract, custom-character guide, humanoid starter, and a spec template.
- Site docs at `/docs?section=skills` provide install commands, two workflow paths, prompts, and links to the source files in Traditional Chinese, English, and Japanese. The homepage links to this section.
- `npm run sync:skills` generates the complete `/.well-known/skills/index.json` directory distribution before dev/test/build. These generated public files are included in the production build.

## Validation

- `npm run typecheck`: passed.
- `npm test`: 23 tests passed (13 library, 10 site), including distribution resource/link integrity, starter validation and current API/document parity.
- `npm run build`: passed.
- `git diff --check`: passed.
- skill-creator `quick_validate.py`: both skills valid (PyYAML installed only in a temporary validation directory).
- Actual `npx --offline skills add http://127.0.0.1:4313 --skill yuragi-character yuragi-rig-spec --agent codex --copy --yes`: installed both in a temporary project.
- Local directory install using the cached official Skills CLI: installed both in a separate temporary project.
- Actual npx single-skill website install: only `yuragi-rig-spec` installed in a third temporary project.
- All 9 installed character files and 7 installed rig files byte-match the current canonical source. Single-skill install excludes the character skill.
- Live browser: desktop 1280 × 900 and mobile 390 × 844; two cards reflow to one column. English and Japanese mobile DOM width equals document scroll width (379px with scrollbar); no page-wide horizontal overflow. Long code blocks scroll within their own containers.
- Copy action shows success. Locale switching retains the skills chapter; localized prompts and HTML lang update correctly. Browser error/warning log was empty.
- Screenshots: `skills-desktop.jpg`, `skills-mobile.jpg`. Viewport override reset and Traditional Chinese restored.

## Scope

No library behavior or artwork changes. No npm publication, deployment, image generation, MCP or Plugin implementation. Website is still local; public installation requires hosting the built site, including the dot-directory distribution. Skills install instructions/templates, not the runtime library or a finished rig. Structural analysis does not produce layered image files automatically.
