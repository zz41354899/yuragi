# Homepage artwork

The six-section reference is the approved `exec-b22c83dc-50f1-46ea-812a-d30a3c259ddb.png` mock.

- `mirea-base-v1.png` and `mirea-happy-v1.png`: byte-for-byte copies of the approved Mirea v1 base and Happy expression in `kirameki-catch/artifacts/idol-bloom-test-mirea-20261001`. Both are 1024 × 1536 transparent PNGs. Existing character design is preserved; image framing is done in the browser, not by repainting the character.
- `blue-stage-v1.png`: new opaque 1853 × 849 raster background, generated with the built-in image generator using the approved mock as style reference. Used behind hero and CTA.
- `demo-stage-v1.png`: new opaque 1448 × 1086 raster background for the live Momo demo. Momo is rendered independently on top.

Mirea is a static artwork showcase, not a working rig. Momo retains its original texture and bindings. No publication or deployment was performed.

Framework logos are unmodified official assets, used only to identify the respective integrations:
- Vue: https://github.com/vuejs/art/blob/master/logo.svg (Evan You; attribution and usage terms in https://github.com/vuejs/art).
- React: https://react.dev/images/brand/logo_dark.svg.

## Generation prompts

Blue stage: “Production raster background for Yuragi website hero and CTA, target 1920 × 880. Pristine cyan-blue stage, dominant #008bb7 and #0cadd7, understated broad translucent fluid ribbons across the lower quarter, restrained circular light echo on the right, calm darker left 55 percent text-safe zone. No text, logos, people, character, umbrella, UI, buttons, scenery, grid, sparkles, watermark. Full opaque image.”

Demo stage: White webpage base, extremely faint cyan circular light area in the center, pale blue elliptical platform below, sparse tiny cyan light points. Minimal Japanese creative-software presentation style, center empty for the original Momo artwork. No people, text, logo or interface.
