#!/usr/bin/env python3
"""Local artwork inspection, annotated visible-part extraction and Yuragi rig preparation.

Python measures pixels; an AI/user supplies semantic annotations. No network/model download.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
from PIL import Image, ImageChops, ImageDraw


def number(value, label, low=0, high=1):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
        raise ValueError(f'{label} must be a finite number within {low}..{high}')
    return float(value)


def point(value, label):
    if not isinstance(value, list) or len(value) != 2:
        raise ValueError(f'{label} must be [x, y] in full-image normalized coordinates')
    return [number(v, label) for v in value]


def bounds(value, label):
    if not isinstance(value, list) or len(value) != 4:
        raise ValueError(f'{label} must be [left, top, right, bottom]')
    b = [number(v, label) for v in value]
    if b[0] >= b[2] or b[1] >= b[3]:
        raise ValueError(f'{label} must have positive area')
    return b


def identifier(value, label):
    if not isinstance(value, str) or not re.fullmatch(r'[a-z][a-z0-9-]{0,63}', value):
        raise ValueError(f'{label} must use lowercase letters, numbers and hyphens, starting with a letter')
    return value


def read_image(source: Path):
    # Do not resize, rotate, strip margins or silently change the annotation coordinate frame.
    with Image.open(source) as original:
        if getattr(original, 'n_frames', 1) != 1:
            raise ValueError('Use a single still image, not an animated file')
        width, height = original.size
        if not 1 <= width <= 8192 or not 1 <= height <= 8192:
            raise ValueError('Image dimensions must each be within 1..8192 pixels')
        if original.getexif().get(274, 1) != 1:
            raise ValueError('Bake EXIF orientation into the image before annotating it')
        image = original.convert('RGBA')
    alpha = image.getchannel('A')
    box = alpha.point(lambda a: 255 if a > 8 else 0).getbbox()
    if box is None:
        raise ValueError('Artwork has no visible pixels')
    minimum, maximum = alpha.getextrema()
    # Compute center of visible silhouette at limited resolution to bound inspection cost.
    thumbnail = alpha.copy()
    thumbnail.thumbnail((256, 256))
    values = list(thumbnail.get_flattened_data()) if hasattr(thumbnail, 'get_flattened_data') else list(thumbnail.getdata())
    total = sum(values)
    cx = sum(((i % thumbnail.width) + .5) * v for i, v in enumerate(values)) / total / thumbnail.width
    cy = sum(((i // thumbnail.width) + .5) * v for i, v in enumerate(values)) / total / thumbnail.height
    info = {
        'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'width': width, 'height': height,
        'hasTransparency': minimum < 255, 'alphaRange': [minimum, maximum],
        'visibleBoundsPixels': list(box),
        'visibleBounds': [box[0] / width, box[1] / height, box[2] / width, box[3] / height],
        'silhouetteCenter': [cx, cy],
        'warnings': [] if minimum < 255 else ['Opaque artwork: the background will deform too; no background removal was performed.'],
    }
    return image, info


def save_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')


def overlay(image, pins=(), head=None, regions=()):
    result = Image.new('RGBA', image.size, '#eff7fa')
    result.alpha_composite(image)
    draw = ImageDraw.Draw(result)
    width, height = result.size
    line_width = max(1, round(width / 700))
    for step in range(1, 10):
        x, y = width * step / 10, height * step / 10
        draw.line([(x, 0), (x, height)], fill='#80bfcb', width=line_width)
        draw.line([(0, y), (width, y)], fill='#80bfcb', width=line_width)
        draw.text((x + 2, 2), str(step / 10), fill='#163a4c')
        draw.text((2, y + 2), str(step / 10), fill='#163a4c')
    for region in regions:
        poly = [(x * width, y * height) for x, y in region['polygon']]
        draw.line(poly + [poly[0]], fill='#f27836', width=line_width * 2)
    if head:
        draw.rectangle((head[0] * width, head[1] * height, head[2] * width, head[3] * height), outline='#df5291', width=line_width * 2)
    for pin in pins:
        x, y = pin['x'] * width, pin['y'] * height
        r = max(4, width / 160)
        draw.ellipse((x-r, y-r, x+r, y+r), fill='#007fa8', outline='white', width=line_width)
        draw.text((x+r+2, y), pin['name'], fill='#102e43')
    return result


def inspect(source: Path, output: Path):
    image, info = read_image(source)
    output.mkdir(parents=True, exist_ok=True)
    save_json(output / 'image-info.json', info)
    overlay(image).save(output / 'inspection-grid.png')
    draft = {'version': 1, 'image': {k: info[k] for k in ['sha256', 'width', 'height']},
             'id': 'my-character', 'name': 'My character', 'mode': 'silhouette',
             'confidence': 0, 'evidence': 'Silhouette measured by Python; semantic anatomy has not been reviewed.',
             'landmarks': {}, 'regions': [], 'hair': [], 'accessories': [], 'waveSafe': False,
             'unsupportedMotions': []}
    save_json(output / 'analysis.draft.json', draft)
    return info


def annotated_analysis(value, info):
    if not isinstance(value, dict) or value.get('version') != 1:
        raise ValueError('Analysis must be an object with version 1')
    provenance = value.get('image')
    if not isinstance(provenance, dict) or any(provenance.get(k) != info[k] for k in ['sha256', 'width', 'height']):
        raise ValueError('Analysis image fingerprint/dimensions do not match this artwork; re-inspect and annotate')
    identifier(value.get('id'), 'id')
    if not isinstance(value.get('name'), str) or not value['name'].strip():
        raise ValueError('name must be a nonempty string')
    if value.get('mode') not in ['humanoid', 'silhouette']:
        raise ValueError('mode must be humanoid or silhouette')
    confidence = number(value.get('confidence'), 'confidence')
    if not isinstance(value.get('evidence'), str) or not value['evidence'].strip():
        raise ValueError('evidence must describe the actual visual observations or lack of review')
    if not isinstance(value.get('waveSafe', False), bool):
        raise ValueError('waveSafe must be a boolean')
    landmarks = value.get('landmarks', {})
    if not isinstance(landmarks, dict) or len(landmarks) > 64:
        raise ValueError('landmarks must be an object with at most 64 points')
    for name, p in landmarks.items():
        identifier(name, 'landmark name'); point(p, name)
    if value['mode'] == 'humanoid':
        if confidence < .7:
            raise ValueError('Humanoid mode requires visual review confidence >= 0.7; use silhouette for uncertain anatomy')
        for name in ['waist', 'head-root', 'head-top']:
            if name not in landmarks:
                raise ValueError(f'Humanoid analysis requires a measured {name}')
        bounds(value.get('headBounds'), 'headBounds')
        if landmarks['head-top'][1] >= landmarks['head-root'][1]:
            raise ValueError('head-top must be above head-root; otherwise use a supported alternative profile')
    if value.get('waveSafe'):
        if value['mode'] != 'humanoid' or any(name not in landmarks for name in ['shoulder-right', 'elbow-right', 'wrist-right']):
            raise ValueError('waveSafe requires reviewed humanoid shoulder-right, elbow-right and wrist-right landmarks')
    regions = value.get('regions', [])
    if not isinstance(regions, list) or len(regions) > 64:
        raise ValueError('regions must be an array of at most 64 polygons')
    ids = set()
    for region in regions:
        if not isinstance(region, dict): raise ValueError('region must be an object')
        name = identifier(region.get('id'), 'region id')
        if name in ids: raise ValueError('region ids must be unique')
        ids.add(name)
        polygon = region.get('polygon')
        if not isinstance(polygon, list) or not 3 <= len(polygon) <= 512:
            raise ValueError('region polygon needs 3..512 points')
        polygon = [point(p, name) for p in polygon]
        area = abs(sum(polygon[i][0] * polygon[(i+1) % len(polygon)][1] - polygon[(i+1) % len(polygon)][0] * polygon[i][1] for i in range(len(polygon))))
        if area < .00001: raise ValueError('region polygon must have nonzero area')
    for key in ['hair', 'accessories']:
        chains = value.get(key, [])
        if not isinstance(chains, list) or len(chains) > 128: raise ValueError(f'{key} must be an array with at most 128 entries')
        ids = set()
        for chain in chains:
            if not isinstance(chain, dict): raise ValueError('chain must be an object')
            name = identifier(chain.get('id'), 'chain id')
            if name in ids: raise ValueError('chain ids must be unique')
            ids.add(name)
            number(chain.get('radius'), 'radius', .005, .5)
            number(chain.get('phase'), 'phase', -100, 100)
            if key == 'hair':
                points = chain.get('points')
                if not isinstance(points, list) or len(points) != 3: raise ValueError('hair points must have root, middle and tip')
                points = [point(p, 'hair point') for p in points]
                if points[0] == points[1] or points[1] == points[2]: raise ValueError('hair segments must have length')
                number(chain.get('gain'), 'gain', .001, 3)
            else:
                if point(chain.get('root'), 'root') == point(chain.get('tip'), 'tip'): raise ValueError('accessory must have length')
                for field in ['angle', 'stiffness', 'damping']: number(chain.get(field), field)
    unsupported = value.get('unsupportedMotions', [])
    if not isinstance(unsupported, list) or any(not isinstance(item, str) for item in unsupported):
        raise ValueError('unsupportedMotions must be a list of descriptions')
    return value


def build_model(analysis, info):
    box = info['visibleBounds']; center = info['silhouetteCenter']
    humanoid = analysis['mode'] == 'humanoid'
    landmarks = analysis.get('landmarks', {})
    span = max(box[2] - box[0], .02)
    pins = []
    if humanoid:
        parents = {'head-root': 'waist', 'head-top': 'head-root', 'shoulder-left': 'waist',
                   'shoulder-right': 'waist', 'elbow-right': 'shoulder-right', 'wrist-right': 'elbow-right',
                   'elbow-left': 'shoulder-left', 'wrist-left': 'shoulder-left'}
        # Preserve the engine's parent-before-child order; never invent missing shoulders/elbows.
        order = ['waist', 'head-root', 'head-top', 'shoulder-left', 'shoulder-right', 'elbow-left', 'elbow-right', 'wrist-left', 'wrist-right']
        for name in order:
            if name not in landmarks: continue
            p = landmarks[name]
            pin = {'name': name, 'type': 'joint' if name in ['head-top', 'elbow-left', 'elbow-right', 'wrist-left', 'wrist-right'] else 'fixed',
                   'x': p[0], 'y': p[1], 'radius': round(min(.18, max(.025, span * (.15 if 'wrist' in name else .22))), 5)}
            parent = parents.get(name)
            if parent in landmarks: pin['parent'] = parent
            pins.append(pin)
        head = analysis['headBounds']; head_x = (head[0] + head[2]) / 2
        half_head = (head[2] - head[0]) / 2
        pose = {'headCenter': head_x, 'headBounds': [head[3], min(1, head[3] + max(.02, (head[3]-head[1]) * .4))],
                'headHorizontal': [max(.001, half_head * .7), min(1, max(.002, half_head * 1.5))],
                'headWarpBounds': [head[1], head[3]],
                'bodyBounds': [landmarks['waist'][1], min(1, landmarks['waist'][1] + max(.02, (box[3]-landmarks['waist'][1]) * .8))],
                'bodyPivot': landmarks['waist'], 'swayPivot': [center[0], min(.99, box[3])]}
        # Saturation at the lower edge cannot form a zero-width falloff.
        if pose['headBounds'][0] >= pose['headBounds'][1] or pose['bodyBounds'][0] >= pose['bodyBounds'][1]:
            raise ValueError('Head/waist needs room below it for pose falloff; use silhouette mode for this layout')
        clearance = [[head_x, (head[1]+head[3])/2, max(.001, half_head), max(.001, (head[3]-head[1])/2)]]
    else:
        pins = [{'name': 'surface-anchor', 'type': 'fixed', 'x': center[0], 'y': center[1], 'radius': min(.5, max(.05, span/2))}]
        pose = {'headCenter': center[0], 'headBounds': [.01, .02], 'headHorizontal': [.01, .02],
                'bodyBounds': [.01, .02], 'bodyPivot': center, 'swayPivot': [center[0], min(.99, box[3])]}
        clearance = []
    hair = analysis.get('hair', []); accessories = analysis.get('accessories', [])
    aspect = info['height'] / info['width']
    columns = max(8, min(64, round(40 / math.sqrt(aspect))))
    rows = max(8, min(96, round(columns * aspect)))
    model = {'version': 1, 'id': analysis['id'], 'name': analysis['name'],
             'texture': {'src': './texture.png', 'width': info['width'], 'height': info['height']},
             'mesh': {'columns': columns, 'rows': rows}, 'pins': pins, 'hair': hair, 'accessories': accessories,
             'faceClearance': clearance, 'pose': pose,
             'motion': {'sway': .25, 'speed': .65, 'hair': .3 if hair else 0, 'accessories': .25 if accessories else 0, 'follow': .25 if humanoid else 0}}
    controls = {'idle': True, 'follow': humanoid, 'wave': bool(analysis.get('waveSafe', False))}
    return model, controls


PREVIEW = '''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Yuragi character preview</title><style>
*{box-sizing:border-box}body{margin:0;background:#eff7fa;color:#15394b;font:16px/1.6 system-ui}main{max-width:960px;margin:auto;padding:32px 24px}h1{margin:0}button,a{font:inherit}button{padding:8px 16px;border:1px solid #92c8d9;border-radius:8px;background:white;color:#15394b;cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible{outline:3px solid #007fa8}#stage{position:relative;width:min(100%,380px);margin:48px auto}#fallback{display:block;width:100%;height:100%;object-fit:contain;position:relative;z-index:1}#fallback[hidden]{display:none}canvas{position:absolute;left:-12%;top:-12%;width:124%;height:124%}.controls{display:flex;gap:8px;flex-wrap:wrap}#status{min-height:2em}pre{overflow:auto;background:white;padding:16px;border-radius:8px}
</style><main><h1 id="title">Your character</h1><p>Small motion on your original artwork. Review the binding before increasing intensity.</p>
<div id="stage"><img id="fallback" src="./texture.png" alt="Character artwork"><canvas id="canvas" aria-hidden="true"></canvas></div>
<div class="controls"><button id="play" disabled>Play</button><button id="pause" disabled>Pause</button><button id="wave" disabled>Wave</button><button id="reset" disabled>Reset</button></div>
<p id="status" role="status">Loading local runtime…</p><p><a href="./binding-overlay.png">Binding overlay</a> · <a href="./rig-spec.md">Rig spec</a></p>
<pre id="diagnostics">Waiting for player</pre></main><script type="module">
const fallback=document.querySelector('#fallback'),stage=document.querySelector('#stage'),status=document.querySelector('#status'),diagnostics=document.querySelector('#diagnostics');
const controller=new AbortController();let player;let controls;let ended=false;
const stop=()=>{ended=true;controller.abort();player?.destroy()};window.addEventListener('pagehide',stop,{once:true});
try {
 const {createPlayer,validateModel}=await import('./runtime/index.js');
 const [response,report]=await Promise.all([fetch('./model.json',{signal:controller.signal}),fetch('./build-report.json',{signal:controller.signal})]);
 if(!response.ok||!report.ok)throw new Error('Unable to load model or build report');
 const model=await response.json();controls=(await report.json()).controls;validateModel(model);
 model.texture.src=new URL(model.texture.src,location.href).href;
 document.querySelector('#title').textContent=model.name;fallback.alt=model.name;stage.style.aspectRatio=`${model.texture.width}/${model.texture.height}`;
 if(ended)throw new DOMException('Preview left','AbortError');
 player=await createPlayer({canvas:document.querySelector('#canvas'),model,signal:controller.signal,reducedMotion:'respect',
 onError:error=>{fallback.hidden=false;status.textContent=error.message},
 onFrame:snapshot=>{diagnostics.textContent=JSON.stringify({playing:snapshot.playing,...snapshot.diagnostics},null,2)}});
 fallback.hidden=true;status.textContent=controls.follow?'Move your pointer to try gentle following.':'Silhouette mode: gentle idle only; no anatomy was guessed.';
 for(const id of ['play','pause','reset'])document.querySelector('#'+id).disabled=false;
 document.querySelector('#wave').disabled=!controls.wave;
 stage.addEventListener('pointermove',event=>{if(!controls.follow)return;const r=stage.getBoundingClientRect();player.setPointer((event.clientX-r.left)/r.width-.5,(event.clientY-r.top)/r.height-.5)},{signal:controller.signal});
 stage.addEventListener('pointerleave',()=>player.setPointer(0,0),{signal:controller.signal});
 for(const id of ['play','pause','reset'])document.querySelector('#'+id).addEventListener('click',()=>player[id](),{signal:controller.signal});
 document.querySelector('#wave').addEventListener('click',()=>{if(controls.wave)player.wave()},{signal:controller.signal});
} catch(error) {fallback.hidden=false;if(!ended)status.textContent=error.name==='AbortError'?'Loading cancelled':`${error.message}. Build with --rig-package pointing to the installed @yuragi/rig package.`;}
</script></html>'''


def build(source: Path, analysis_path: Path | None, output: Path, rig_package: Path | None = None):
    if output.exists() and any(output.iterdir()):
        raise ValueError('Build output must be a new or empty directory; use a new version folder for corrections')
    image, info = read_image(source)
    if analysis_path:
        analysis = annotated_analysis(json.loads(analysis_path.read_text(encoding='utf-8')), info)
    else:
        analysis = {'version': 1, 'image': {k: info[k] for k in ['sha256', 'width', 'height']},
                    'id': 'my-character', 'name': 'My character', 'mode': 'silhouette', 'confidence': 0,
                    'evidence': 'Silhouette measured by Python; no semantic anatomy review.', 'waveSafe': False}
    model, controls = build_model(analysis, info)
    runtime_source = None
    if rig_package:
        metadata = json.loads((rig_package / 'package.json').read_text(encoding='utf-8'))
        if metadata.get('name') != '@yuragi/rig': raise ValueError('--rig-package must point to @yuragi/rig')
        runtime_source = rig_package / 'dist'
        if not (runtime_source / 'index.js').is_file(): raise ValueError('Build/install the library first; dist/index.js is missing')
    # Validate all annotations before creating any output or extracting parts.
    output.mkdir(parents=True, exist_ok=True)
    image.save(output / 'texture.png')
    save_json(output / 'image-info.json', info)
    save_json(output / 'analysis.json', analysis)
    save_json(output / 'model.json', model)
    regions = analysis.get('regions', [])
    overlay(image, model['pins'], analysis.get('headBounds'), regions).save(output / 'binding-overlay.png')
    part_paths = []
    if regions:
        parts = output / 'parts'; parts.mkdir(exist_ok=True)
        for region in regions:
            mask = Image.new('L', image.size, 0)
            ImageDraw.Draw(mask).polygon([(x*image.width, y*image.height) for x,y in region['polygon']], fill=255)
            part = image.copy(); part.putalpha(ImageChops.multiply(image.getchannel('A'), mask))
            path = 'parts/' + region['id'] + '.png'; part.save(output / path); part_paths.append(path)
    runtime_ready = bool(runtime_source)
    if runtime_source:
        destination = output / 'runtime'; destination.mkdir(exist_ok=True)
        for file in runtime_source.glob('*.js'): shutil.copyfile(file, destination / file.name)
    (output / 'preview.html').write_text(PREVIEW, encoding='utf-8')
    warnings = info['warnings'] + ['Extracted parts contain visible source pixels only; hidden anatomy was not reconstructed.',
                                  'Model data is a binding candidate; visual motion acceptance has not been performed.']
    report = {'mode': analysis['mode'], 'confidence': analysis.get('confidence',0), 'controls': controls,
              'runtimeReady': runtime_ready, 'parts': part_paths, 'warnings': warnings,
              'unsupportedMotions': analysis.get('unsupportedMotions', []), 'visualAcceptance': 'not-run'}
    save_json(output / 'build-report.json', report)
    rows = '\n'.join(f"| {p['name']} | {p['x']:.5f} | {p['y']:.5f} | {p['radius']:.5f} |" for p in model['pins'])
    unsupported = '\n'.join('- '+s for s in report['unsupportedMotions']) or '- None requested; blink, lip-sync, large turns and occlusion changes are not implemented.'
    spec = f"""# Rig specification: {analysis['name']}

Status: generated binding candidate; visual acceptance not run.

## Artwork and evidence

- Image fingerprint: `{info['sha256']}`; {image.width} × {image.height} pixels.
- Profile: {analysis['mode']}; semantic confidence: {analysis.get('confidence', 0)}.
- Evidence: {analysis['evidence']}
- Original pixel canvas and alpha preserved in `texture.png`.
- {len(part_paths)} visible-region extracts. These are optional authoring assets; the current player renders the single full texture.

## API mapping

| Intent | Runtime API | Enabled |
| --- | --- | --- |
| Gentle idle | setMotion / play / pause | true |
| Pointer following | setPointer | {str(controls['follow']).lower()} |
| Humanoid greeting | wave | {str(controls['wave']).lower()} |
| Head warping | pose.headWarpBounds | {str(analysis['mode']=='humanoid').lower()} |
| Local hair / accessories | hair / accessories chains | {bool(model['hair'])} / {bool(model['accessories'])} |

## Normalized bindings

Full original image: left/top (0,0), right/bottom (1,1). No trimmed-image or display-size coordinates.

| Pin | x | y | radius |
| --- | --- | --- | --- |
{rows}

Pose and chain details are in `model.json`; inspect `binding-overlay.png` before previewing.

## Unsupported or additional work

{unsupported}

## Preview and integration

Run a local HTTP server in this output folder, then open `preview.html`. Runtime included: {runtime_ready}.
If missing, rebuild with `--rig-package /path/to/node_modules/@yuragi/rig` (or a built local library checkout).
The preview uses native createPlayer, AbortSignal, a static fallback, low-frequency UI diagnostics and idempotent destroy. Vue uses `@yuragi/rig/vue`; React uses `@yuragi/rig/react`.

## Acceptance

- Schema validation: call validateModel in the installed target runtime (the preview does this before loading).
- Neutral / pointer extremes / enabled wave / continuous idle / face / seams / hair roots: not run.
- Desktop / touch / keyboard / reduced motion / load failures / navigation cleanup: not run.
- Require finite diagnostics; sustained motionScale below 1 means reduce motion or repair binding.
- Reinspect after changing artwork; fingerprints must match the annotated image.

## Limitations

""" + '\n'.join('- '+w for w in warnings) + '\n'
    (output / 'rig-spec.md').write_text(spec, encoding='utf-8')
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['inspect', 'build'])
    parser.add_argument('image', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--analysis', type=Path)
    parser.add_argument('--rig-package', type=Path)
    args = parser.parse_args(argv)
    try:
        result = inspect(args.image, args.out) if args.command == 'inspect' else build(args.image, args.analysis, args.out, args.rig_package)
        print(json.dumps(result, indent=2))
    except (ValueError, OSError, KeyError, Image.DecompressionBombError) as error:
        parser.exit(2, 'Character preparation failed: ' + str(error) + '\n')


if __name__ == '__main__':
    main()
