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
import subprocess
import tempfile
from contextlib import contextmanager
from PIL import Image, ImageChops, ImageDraw

REGION_ROLES = ['unclassified', 'head', 'face', 'eye', 'iris', 'eyelid', 'mouth', 'neck', 'body', 'shoulder', 'arm', 'upper-arm', 'forearm', 'hand', 'finger',
                'leg', 'thigh', 'knee', 'shin', 'ankle', 'foot', 'toe', 'heel', 'bangs', 'hair', 'cloth', 'ribbon', 'accessory', 'prop']


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
        for i, p in enumerate(region.get('chain') or ([region['root'],region['tip']] if 'root' in region and 'tip' in region else [])):
            x,y = p[0]*width,p[1]*height; r=max(3,width/200)
            draw.ellipse((x-r,y-r,x+r,y+r),fill='#e53c72' if i==0 else '#008f94',outline='white')
    if head:
        draw.rectangle((head[0] * width, head[1] * height, head[2] * width, head[3] * height), outline='#df5291', width=line_width * 2)
    for pin in pins:
        x, y = pin['x'] * width, pin['y'] * height
        r = max(4, width / 160)
        draw.ellipse((x-r, y-r, x+r, y+r), fill='#007fa8', outline='white', width=line_width)
        draw.text((x+r+2, y), pin['name'], fill='#102e43')
    return result


def _inspect(source: Path, output: Path):
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
    save_json(output / 'annotation-guide.json', {
        'version':1, 'coordinateSpace':'full-source-normalized', 'roles':REGION_ROLES,
        'reviewGroups':['skull / face / headpiece', 'both eyes / irises / radii / travel / sclera colors', 'neck top and body-attached base', 'each visible bang / side-lock / rear strand',
                        'torso / shoulders / upper arms / forearms / visible fingers', 'left and right thigh / knee / shin / ankle / heel / toe',
                        'cloth panels / rigid prop canopy and shaft / flexible ribbons'],
        'rules':['AI must inspect and annotate visible contours; this script does not infer segmentation.',
                 'Use raw skull/neck polygons for headMotion, separate from subtract masks used for exported child images.',
                 'Do not subtract a whole head protection polygon from bangs. Exclude only reviewed adjacent visible skin/props.',
                 'Record missing or merged anatomy rather than inventing hidden parts.'],
    })
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
        if 'outline' in region:
            outline = region['outline']
            if not isinstance(outline, list) or not 3 <= len(outline) <= 512: raise ValueError('outline requires 3..512 points')
            outline = [point(p, 'outline') for p in outline]
            validate_simple_polygon(outline)
        role = region.get('role', 'unclassified')
        if role not in REGION_ROLES:
            raise ValueError('Unknown region role')
        if 'parent' in region: identifier(region['parent'], 'region parent')
        if 'root' in region: point(region['root'], 'region root')
        if 'tip' in region: point(region['tip'], 'region tip')
        chain = region.get('chain', [])
        if not isinstance(chain, list) or len(chain) > 8 or len(chain) == 1: raise ValueError('chain requires 2..8 reviewed root-to-tip points')
        for p in chain: point(p, 'chain point')
        if any(a == b for a,b in zip(chain, chain[1:])): raise ValueError('chain segments need length')
        if region.get('binding') is not None or region.get('deformation') is not None:
            if len(polygon) > 32: raise ValueError('Runtime polygon requires 3..32 vertices; use a separate authoring outline for finer extraction')
            validate_simple_polygon(polygon)
        binding = region.get('binding')
        if binding is not None:
            if not isinstance(binding, dict) or binding.get('mode') not in ['rigid', 'weighted']: raise ValueError('binding needs rigid or weighted mode')
            if set(binding) - {'mode','feather','pins','anchor','rotation','secondary'}: raise ValueError('Unknown binding field')
            number(binding.get('feather'), 'binding.feather', .002, .2)
            if binding['mode'] == 'rigid':
                if 'pins' in binding: raise ValueError('Rigid props use an anchor, not pin weights')
                if 'anchor' in binding: identifier(binding['anchor'], 'binding.anchor')
                if binding.get('rotation', 'none') not in ['none','head','body']: raise ValueError('Invalid rigid rotation')
            else:
                allowed = binding.get('pins')
                if not isinstance(allowed, list) or not allowed or len(allowed) > 256 or any(not isinstance(pin,str) for pin in allowed) or len(set(allowed)) != len(allowed): raise ValueError('weighted binding requires unique pins')
                for pin in allowed: identifier(pin, 'binding pin')
                if 'anchor' in binding or 'rotation' in binding: raise ValueError('Weighted binding cannot specify rigid transforms')
            if 'secondary' in binding and not isinstance(binding['secondary'], bool): raise ValueError('secondary must be boolean')
        dynamics = region.get('deformation')
        if dynamics is not None:
            if role not in ['bangs','hair','cloth','ribbon','accessory']: raise ValueError('Only flexible visible parts can have deformation')
            if binding and binding['mode'] == 'rigid': raise ValueError('A rigid object cannot have flexible deformation')
            if point(region.get('root'), 'root') == point(region.get('tip'), 'tip'): raise ValueError('root and tip must differ')
            if not isinstance(dynamics, dict): raise ValueError('deformation must be an object')
            if set(dynamics) - {'feather','rotation','stiffness','damping','phase','wind','follow','followY','channel'}: raise ValueError('Unknown deformation field')
            for field, low, high in [('feather',.002,.2),('rotation',0,.35),('stiffness',.001,1),('damping',.001,1),('phase',-100,100),('wind',0,2),('follow',-2,2)]:
                number(dynamics.get(field), 'deformation.' + field, low, high)
            if 'channel' in dynamics and dynamics['channel'] not in ['hair','accessories']: raise ValueError('Invalid deformation channel')
            if 'followY' in dynamics: number(dynamics['followY'], 'deformation.followY', -2, 2)
    by_id = {r['id']:r for r in regions}
    for region in regions:
        seen = {region['id']}; parent = region.get('parent')
        subtract = region.get('subtract', [])
        if not isinstance(subtract,list) or len(subtract) > 16 or any(not isinstance(key,str) or key not in by_id or key == region['id'] for key in subtract):
            raise ValueError('subtract requires at most 16 known other region IDs')
        if len(set(subtract)) != len(subtract): raise ValueError('subtract IDs must be unique')
        if region.get('deformation'):
            for key in subtract:
                if len(by_id[key]['polygon']) > 32: raise ValueError('Runtime exclusion polygon requires at most 32 vertices')
                validate_simple_polygon(by_id[key]['polygon'])
        while parent:
            if parent not in by_id: raise ValueError('Unknown region parent')
            if parent in seen: raise ValueError('Cyclic region hierarchy')
            seen.add(parent); parent = by_id[parent].get('parent')
        if region.get('role') == 'prop' and region.get('binding', {}).get('mode') != 'rigid':
            raise ValueError('Props require explicit rigid binding to avoid accidental flexible deformation')
        if value.get('waveSafe') and region.get('role') == 'prop' and region['binding'].get('anchor') in ['shoulder-right','elbow-right','wrist-right']:
            raise ValueError('Disable waveSafe for the arm holding a rigid prop')
    head_motion = value.get('headMotion')
    if head_motion is not None:
        if value['mode'] != 'humanoid' or not isinstance(head_motion, dict): raise ValueError('headMotion requires reviewed humanoid anatomy')
        if set(head_motion) - {'head','neck','base','feather','neckFeather','rotation','translation','bodyFollow'}: raise ValueError('Unknown headMotion field')
        for field, role in [('head','head'),('neck','neck')]:
            identifier(head_motion.get(field), 'headMotion.' + field)
            region = by_id.get(head_motion.get(field))
            if not region or region.get('role') != role: raise ValueError('headMotion requires a reviewed ' + role + ' region')
            if len(region['polygon']) > 32: raise ValueError('Head/neck runtime polygon requires at most 32 vertices')
            validate_simple_polygon(region['polygon'])
        identifier(head_motion.get('base'), 'headMotion.base')
        base = landmarks.get(head_motion.get('base'))
        if base is None or point(base,'neck base') == landmarks['head-root']: raise ValueError('headMotion needs a distinct measured neck base landmark')
        number(head_motion.get('feather'), 'headMotion.feather', .002, .2)
        number(head_motion.get('neckFeather'), 'headMotion.neckFeather', .002, .2)
        number(head_motion.get('rotation'), 'headMotion.rotation', 0, .3)
        translation = point(head_motion.get('translation'),'headMotion.translation')
        if any(v > .08 for v in translation): raise ValueError('Head translation must be at most .08')
        number(head_motion.get('bodyFollow', 0), 'bodyFollow', 0, 1)
    face = value.get('face')
    if face is not None:
        if not head_motion or not isinstance(face, dict): raise ValueError('face requires reviewed owned headMotion')
        if set(face) - {'eyes'}: raise ValueError('Legacy/unknown face fields; run migrate_gaze.py for 0.2.0')
        eyes = face.get('eyes')
        if not isinstance(eyes, list) or len(eyes) != 2 or {e.get('id') for e in eyes if isinstance(e, dict)} != {'left','right'}: raise ValueError('face needs reviewed left/right eyes')
        def colors(color):
            if not isinstance(color, list) or len(color) != 3: raise ValueError('Face color needs three channels')
            for channel in color: number(channel, 'face color', 0, 1)
        for eye in eyes:
            if set(eye) - {'id','center','radius','iris','irisRadius','travel','angle','sclera'}: raise ValueError('Legacy/unknown eye field; run migrate_gaze.py for 0.2.0')
            for field in ['center','iris']: point(eye.get(field), 'eye.'+field)
            for field,low,high in [('radius',.001,.06),('irisRadius',.001,.03),('travel',0,.01)]:
                pair=point(eye.get(field), 'eye.'+field)
                for v in pair: number(v, 'eye.'+field, low, high)
            number(eye.get('angle'),'eye.angle',-1,1); colors(eye.get('sclera'))
            for axis in [0,1]:
                radius,iris,travel = eye['radius'][axis],eye['irisRadius'][axis],eye['travel'][axis]
                if iris >= radius or travel > (radius-iris)*.45: raise ValueError('Pupil travel must stay within the eye')
                if abs(eye['iris'][axis]-eye['center'][axis])+iris+travel > radius: raise ValueError('Iris exceeds reviewed eye bounds')
                if not 0 <= eye['center'][axis]-radius < eye['center'][axis]+radius <= 1: raise ValueError('Eye leaves original canvas')
    tracking = value.get('tracking')
    if tracking is not None:
        if not isinstance(tracking, dict) or set(tracking) - {'response','damping','maxVelocity','bodyFollow','translation'}: raise ValueError('Unknown tracking field')
        for field, low, high in [('response',.001,.2),('damping',.1,.98),('maxVelocity',.1,5)]: number(tracking.get(field), 'tracking.' + field, low, high)
        if 'bodyFollow' in tracking: number(tracking['bodyFollow'], 'tracking.bodyFollow', 0, 1)
        if 'translation' in tracking and any(v > .08 for v in point(tracking['translation'],'tracking.translation')): raise ValueError('Tracking translation must be at most .08')
    groups = value.get('pointerGroups', [])
    if not isinstance(groups, list) or len(groups) > 16: raise ValueError('pointerGroups requires at most 16 groups')
    group_ids = set()
    for group in groups:
        if not isinstance(group, dict) or set(group) - {'id','name','pivot','translation','rotation','response','regions'}: raise ValueError('Unknown pointerGroups field')
        gid=identifier(group.get('id'), 'pointer group id')
        if gid in group_ids: raise ValueError('Duplicate pointer group id')
        group_ids.add(gid)
        if 'name' in group and not isinstance(group['name'], str): raise ValueError('Pointer group name must be text')
        point(group.get('pivot'), 'pointer pivot')
        travel=group.get('translation')
        if not isinstance(travel, list) or len(travel) != 2: raise ValueError('Pointer translation requires [x,y]')
        for v in travel: number(v,'pointer translation',-.03,.03)
        number(group.get('rotation'),'pointer rotation',-.08,.08);number(group.get('response'),'pointer response',16,1000)
        regions=group.get('regions')
        if not isinstance(regions,list) or not 1 <= len(regions) <= 8: raise ValueError('Pointer group needs 1..8 regions')
        for region in regions:
            if not isinstance(region,dict) or set(region) != {'polygon','feather'}: raise ValueError('Invalid pointer region')
            polygon=region['polygon']
            if not isinstance(polygon,list) or not 3 <= len(polygon) <= 32: raise ValueError('Pointer polygon needs 3..32 points')
            for v in polygon: point(v,'pointer polygon')
            validate_simple_polygon(polygon);number(region['feather'],'pointer feather',.002,.2)
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


def validate_simple_polygon(polygon):
    if abs(sum(polygon[i][0]*polygon[(i+1)%len(polygon)][1]-polygon[(i+1)%len(polygon)][0]*polygon[i][1] for i in range(len(polygon)))) < 1e-8: raise ValueError('Polygon needs nonzero area')
    def cross(a,b,c): return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
    for i,a in enumerate(polygon):
        b = polygon[(i+1)%len(polygon)]
        if math.dist(a,b) < 1e-8: raise ValueError('Polygon edges need length')
        for j in range(i+2,len(polygon)):
            if i == 0 and j == len(polygon)-1: continue
            c,d = polygon[j],polygon[(j+1)%len(polygon)]
            overlap = all(max(min(a[k],b[k]),min(c[k],d[k])) <= min(max(a[k],b[k]),max(c[k],d[k])) for k in [0,1])
            if overlap and cross(a,b,c)*cross(a,b,d) <= 0 and cross(c,d,a)*cross(c,d,b) <= 0:
                raise ValueError('Polygon must not self-intersect')


def build_model(analysis, info):
    box = info['visibleBounds']; center = info['silhouetteCenter']
    humanoid = analysis['mode'] == 'humanoid'
    landmarks = analysis.get('landmarks', {})
    span = max(box[2] - box[0], .02)
    pins = []
    if humanoid:
        parents = {'head-root': 'waist', 'head-top': 'head-root', 'shoulder-left': 'waist',
                   'shoulder-right': 'waist', 'elbow-right': 'shoulder-right', 'wrist-right': 'elbow-right',
                   'elbow-left': 'shoulder-left', 'wrist-left': 'elbow-left',
                   'hip-left': 'waist', 'hip-right': 'waist', 'knee-left': 'hip-left', 'knee-right': 'hip-right',
                   'ankle-left': 'knee-left', 'ankle-right': 'knee-right'}
        # Preserve the engine's parent-before-child order; never invent missing shoulders/elbows.
        order = ['waist', 'head-root', 'head-top', 'shoulder-left', 'shoulder-right', 'elbow-left', 'elbow-right', 'wrist-left', 'wrist-right',
                 'hip-left', 'hip-right', 'knee-left', 'knee-right', 'ankle-left', 'ankle-right']
        for name in order:
            if name not in landmarks: continue
            p = landmarks[name]
            pin = {'name': name, 'type': 'joint' if name.startswith(('head-top', 'elbow-', 'wrist-', 'knee-', 'ankle-')) else 'fixed',
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
        pose['headFollow'] = {'rotation': .075, 'translation': [.01, .006]}
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
    regions = analysis.get('regions', [])
    parts = [{'id':r['id'], 'kind':'hair' if r['role']=='bangs' else r['role'], 'polygon':r['polygon'], 'root':r['root'], 'tip':r['tip'], **r['deformation']} for r in regions if r.get('deformation')]
    by_id = {r['id']:r for r in regions}
    for part in parts:
        subtract = by_id[part['id']].get('subtract', [])
        if subtract: part['exclusions'] = [by_id[key]['polygon'] for key in subtract]
    surfaces = [{'id':r['id'], 'polygon':r['polygon'], **r['binding']} for r in regions if r.get('binding')]
    names = {p['name'] for p in pins}
    for surface in surfaces:
        if surface.get('anchor') and surface['anchor'] not in names: raise ValueError('Unknown runtime anchor: ' + surface['anchor'])
        if any(name not in names for name in surface.get('pins', [])): raise ValueError('Unknown runtime binding pin')
    if parts:
        if hair or accessories: raise ValueError('Use polygon parts OR legacy chains, avoiding duplicate deformation of the same pixels')
        model['parts'] = parts; model['motion']['parts'] = 1
        model['motion']['hair'] = 1; model['motion']['accessories'] = 1
    if surfaces: model['surfaceRegions'] = surfaces
    if humanoid:
        model['tracking'] = {'response':.024, 'damping':.65, 'maxVelocity':1.8}
        if surfaces: model['motion']['follow'] = .85
        head = analysis.get('headMotion')
        if head:
            model['pose']['headFollow'] = {'rotation':head['rotation'], 'translation':head['translation'],
                'region':by_id[head['head']]['polygon'], 'feather':head['feather'],
                'neck':{'polygon':by_id[head['neck']]['polygon'], 'base':landmarks[head['base']], 'feather':head['neckFeather']}}
            model['tracking']['bodyFollow'] = head.get('bodyFollow', 0)
            model['motion']['follow'] = .95
    if analysis.get('tracking') is not None: model['tracking'] = {**model.get('tracking', {}), **analysis['tracking']}
    if analysis.get('face') is not None: model['face'] = json.loads(json.dumps(analysis['face']))
    if analysis.get('pointerGroups') is not None: model['pointerGroups'] = json.loads(json.dumps(analysis['pointerGroups']))
    controls = {'idle': True, 'follow': humanoid, 'wave': bool(analysis.get('waveSafe', False))}
    return model, controls


PREVIEW = '''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Yuragi character preview</title><style>
*{box-sizing:border-box}body{margin:0;background:#eff7fa;color:#15394b;font:16px/1.6 system-ui}main{max-width:960px;margin:auto;padding:32px 24px}h1{margin:0}button,a{font:inherit}button{padding:8px 16px;border:1px solid #92c8d9;border-radius:8px;background:white;color:#15394b;cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible{outline:3px solid #007fa8}#stage{position:relative;width:min(100%,380px);margin:48px auto}#fallback{display:block;width:100%;height:100%;object-fit:contain;position:relative;z-index:1}#fallback[hidden]{display:none}canvas{position:absolute;left:-12%;top:-12%;width:124%;height:124%}.controls{display:flex;gap:8px;flex-wrap:wrap}#status{min-height:2em}pre{overflow:auto;background:white;padding:16px;border-radius:8px}
</style><main><h1 id="title">Your character</h1><p>Small motion on your original artwork. Review the binding before increasing intensity.</p>
<div id="stage" tabindex="0" role="group" aria-label="Character pointer and arrow-key controls"><img id="fallback" src="./texture.png" alt="Character artwork"><canvas id="canvas" aria-hidden="true"></canvas></div>
<div class="controls"><button id="play" disabled>Play</button><button id="pause" disabled>Pause</button><button id="wave" disabled>Wave</button><button id="reset" disabled>Reset</button></div>
<div id="face-controls" hidden><label>Gaze strength <input id="gaze-strength" type="range" min="0" max="1" step=".05" value="1"></label><label>Eye X <input id="gaze-x" type="range" min="-1" max="1" step=".05" value="0"></label><label>Eye Y <input id="gaze-y" type="range" min="-1" max="1" step=".05" value="0"></label></div><label>Motion strength <input id="motion-strength" type="range" min="0" max="1" step=".05" value="1"></label>
<div id="pose-controls" hidden><label>Pose X <input id="pose-x" type="range" min="-30" max="30" step="1" value="0"></label><label>Pose Y <input id="pose-y" type="range" min="-30" max="30" step="1" value="0"></label></div>
<p id="status" role="status">Loading local runtime…</p><p><a href="./binding-overlay.png">Binding overlay</a> · <a href="./rig-spec.md">Rig spec</a></p>
<pre id="diagnostics">Waiting for player</pre></main><script type="module">
const fallback=document.querySelector('#fallback'),stage=document.querySelector('#stage'),status=document.querySelector('#status'),diagnostics=document.querySelector('#diagnostics');
const controller=new AbortController();let player;let controls;let ended=false;
const stop=()=>{ended=true;controller.abort();player?.destroy()};window.addEventListener('pagehide',stop,{once:true});window.addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
try {
 const {createPlayer,validateModel}=await import('./runtime/index.js');
 const [response,report]=await Promise.all([fetch('./model.json',{signal:controller.signal}),fetch('./build-report.json',{signal:controller.signal})]);
 if(!response.ok||!report.ok)throw new Error('Unable to load model or build report');
 const model=await response.json();controls=(await report.json()).controls;validateModel(model);
 model.texture.src=new URL(model.texture.src,response.url).href;
 document.querySelector('#title').textContent=model.name;fallback.alt=model.name;stage.style.aspectRatio=`${model.texture.width}/${model.texture.height}`;
 if(ended)throw new DOMException('Preview left','AbortError');
 player=await createPlayer({canvas:document.querySelector('#canvas'),model,signal:controller.signal,reducedMotion:'respect',
 onError:error=>{fallback.hidden=false;document.querySelector('#canvas').hidden=true;player?.destroy();status.textContent=error.message},
 onFrame:snapshot=>{diagnostics.textContent=JSON.stringify({playing:snapshot.playing,...snapshot.diagnostics,parameters:snapshot.parameters,face:snapshot.face},null,2)}});
 fallback.hidden=true;status.textContent=controls.follow?'Move your pointer to try gentle following.':'Silhouette mode: gentle idle only; no anatomy was guessed.';
 for(const id of ['play','pause','reset'])document.querySelector('#'+id).disabled=false;
 document.querySelector('#wave').disabled=!controls.wave;
 document.querySelector('#reset').addEventListener('click',()=>{for(const id of ['gaze-x','gaze-y','pose-x','pose-y'])document.querySelector('#'+id).value='0';for(const id of ['gaze-strength','motion-strength'])document.querySelector('#'+id).value='1'},{signal:controller.signal});
 document.querySelector('#pose-controls').hidden=!controls.follow;
 for(const [id,name] of [['pose-x','lookX'],['pose-y','lookY']])document.querySelector('#'+id).addEventListener('input',event=>player.setParameter(name,Number(event.target.value)),{signal:controller.signal});
 document.querySelector('#face-controls').hidden=!model.face;
 document.querySelector('#gaze-strength').addEventListener('input',event=>player.setGazeStrength(Number(event.target.value)),{signal:controller.signal});
 for(const id of ['gaze-x','gaze-y'])document.querySelector('#'+id).addEventListener('input',()=>player.setGaze(Number(document.querySelector('#gaze-x').value),Number(document.querySelector('#gaze-y').value)),{signal:controller.signal});
 document.querySelector('#motion-strength').addEventListener('input',event=>player.setMotion({weight:Number(event.target.value)}),{signal:controller.signal});
 stage.addEventListener('pointermove',event=>{if(!controls.follow||event.pointerType==='touch'&&!event.buttons)return;const r=stage.getBoundingClientRect();player.setPointer((event.clientX-r.left)/r.width-.5,(event.clientY-r.top)/r.height-.5)},{signal:controller.signal});
 for(const name of ['pointerup','pointercancel'])stage.addEventListener(name,event=>{if(event.pointerType==='touch')player.setPointer(0,0)},{signal:controller.signal});
 stage.addEventListener('blur',()=>player.setPointer(0,0),{signal:controller.signal});
 stage.addEventListener('keydown',event=>{if(event.target!==stage||!controls.follow)return;const points={ArrowLeft:[-.5,0],ArrowRight:[.5,0],ArrowUp:[0,-.5],ArrowDown:[0,.5],Escape:[0,0]};if(points[event.key]){event.preventDefault();player.setPointer(...points[event.key])}},{signal:controller.signal});
 stage.addEventListener('pointerleave',()=>player.setPointer(0,0),{signal:controller.signal});
 for(const id of ['play','pause','reset'])document.querySelector('#'+id).addEventListener('click',()=>player[id](),{signal:controller.signal});
 document.querySelector('#wave').addEventListener('click',()=>{if(controls.wave)player.wave()},{signal:controller.signal});
} catch(error) {fallback.hidden=false;if(!ended)status.textContent=error.name==='AbortError'?'Loading cancelled':`${error.message}. Original artwork remains available; check browser WebGL support and local runtime files.`;}
</script></html>'''


def analysis_fingerprint(analysis):
    return hashlib.sha256(json.dumps(analysis,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode()).hexdigest()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


@contextmanager
def new_output(output):
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise ValueError('Output must be a new or empty directory; use a new version folder')
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.yuragi-',dir=output.parent) as folder:
        stage=Path(folder)/'output';stage.mkdir()
        yield stage
        if output.exists(): output.rmdir()
        stage.rename(output)


def export_parts(image, analysis, output):
    regions=analysis.get('regions',[])
    part_paths = []; entries = []
    if regions:
        parts = output / 'parts'; parts.mkdir(exist_ok=True)
        (parts / 'cropped').mkdir(); (parts / 'masks').mkdir()
        by_id = {region['id']:region for region in regions}
        def raw_mask(region):
            mask = Image.new('L', image.size, 0)
            ImageDraw.Draw(mask).polygon([(x*image.width,y*image.height) for x,y in region.get('outline',region['polygon'])],fill=255)
            return mask
        # Bound memory independently of part count; subtraction reads reviewed raw outlines.
        for region in regions:
            mask = raw_mask(region)
            for key in region.get('subtract', []): mask = ImageChops.subtract(mask,raw_mask(by_id[key]))
            # Binary mask: keep source RGBA exactly inside, clear invisible RGB outside as well.
            part = Image.new('RGBA', image.size); part.paste(image, (0,0), mask)
            path = 'parts/' + region['id'] + '.png'; part.save(output / path); part_paths.append(path)
            box = part.getchannel('A').getbbox()
            if box is None: raise ValueError('Empty visible mask for '+region['id']+'; correct annotations before build')
            crop_path = 'parts/cropped/' + region['id'] + '.png'
            (part.crop(box) if box else Image.new('RGBA', (1,1))).save(output / crop_path)
            mask_path = 'parts/masks/' + region['id'] + '.png'; mask.save(output / mask_path)
            chain = region.get('chain') or ([region['root'],region['tip']] if 'root' in region and 'tip' in region else [])
            entries.append({'id':region['id'], 'role':region.get('role', 'unclassified'), 'parent':region.get('parent'),
                            'coverage':'visible-only', 'needsCompletion':True, 'fullCanvas':path, 'cropped':crop_path, 'mask':mask_path,
                            'boundsPixels':list(box) if box else [0,0,0,0], 'empty':box is None,
                            'anchors':[{'id':region['id'] + ('-root' if i==0 else '-tip' if i==len(chain)-1 else '-mid-'+str(i)),
                                        'position':p, 'type':'fixed' if i==0 else 'spring'} for i,p in enumerate(chain)],
                            'subtract':region.get('subtract', []), 'binding':region.get('binding'), 'deformation':region.get('deformation')})
    save_json(output / 'parts-manifest.json', {'version':1, 'analysisSha256':analysis_fingerprint(analysis), 'image':analysis['image'], 'canvas':[image.width,image.height],
              'coordinateSpace':'full-source-normalized', 'renderer':'shared-surface',
              'parts':entries, 'originalTexture':'texture.png',
              'note':'Visible-pixel authoring exports; cropped images and authoring anchors are not automatically loaded as runtime layers.'})
    if entries:
        sheet = Image.new('RGB', (800, math.ceil(len(entries)/4)*220), '#edf4f9')
        draw = ImageDraw.Draw(sheet)
        for i,entry in enumerate(entries):
            x,y = (i%4)*200,(i//4)*220
            with Image.open(output/entry['cropped']) as crop:
                thumb=crop.convert('RGBA');thumb.thumbnail((180,180))
                sheet.paste(thumb,(x+(200-thumb.width)//2,y+(180-thumb.height)//2),thumb)
            draw.text((x+8,y+185),entry['id'],fill='#15394b')
            draw.text((x+8,y+201),entry['role']+' / visible-only',fill='#517081')
        sheet.save(output/'parts-contact-sheet.png')
    return entries, part_paths


def supplements(manifest, spec_path, analysis, output):
    if spec_path is None: return
    specs=json.loads(spec_path.read_text(encoding='utf-8'))
    if not isinstance(specs,list) or len(specs)>64: raise ValueError('Supplement list requires at most 64 entries')
    ids={r['id'] for r in analysis.get('regions',[])};seen=set();items=[]
    for entry in specs:
        if not isinstance(entry,dict) or set(entry) != {'id','image','positionPixels','source','completeness'}: raise ValueError('Supplement needs id/image/positionPixels/source/completeness')
        name=identifier(entry['id'],'supplement id')
        if name not in ids or name in seen: raise ValueError('Supplement id must match one unique annotated part')
        seen.add(name)
        if not isinstance(entry['source'],str) or not entry['source'].strip(): raise ValueError('Supplement source is required')
        if entry['completeness'] not in ['completed','partial']: raise ValueError('Invalid supplement completeness')
        position=entry['positionPixels']
        if not isinstance(position,list) or len(position)!=2 or any(isinstance(v,bool) or not isinstance(v,int) or v<0 for v in position): raise ValueError('positionPixels requires nonnegative integer [x,y]')
        if not isinstance(entry['image'],str): raise ValueError('Supplement image must be a local path')
        source=(spec_path.parent/entry['image']).resolve()
        image,info=read_image(source)
        if position[0]+image.width>manifest['canvas'][0] or position[1]+image.height>manifest['canvas'][1]: raise ValueError('Supplement leaves source canvas')
        folder=output/'supplements';folder.mkdir(exist_ok=True)
        filename='supplements/'+name+'.png';image.save(output/filename)
        items.append({'id':name,'image':filename,'positionPixels':position,'source':entry['source'],'sourceSha256':info['sha256'],'completeness':entry['completeness'],'runtimeUsed':False})
    manifest['supplements']=items


def extract(source, analysis_path, output, supplemental_path=None):
    if analysis_path is None: raise ValueError('extract requires --analysis after inspecting and annotating the source')
    image,info=read_image(source)
    analysis=annotated_analysis(json.loads(analysis_path.read_text(encoding='utf-8')),info)
    with new_output(output) as stage:
        image.save(stage/'texture.png');save_json(stage/'image-info.json',info);save_json(stage/'analysis.json',analysis)
        overlay(image,head=analysis.get('headBounds'),regions=analysis.get('regions',[])).save(stage/'binding-overlay.png')
        entries,_=export_parts(image,analysis,stage)
        manifest=json.loads((stage/'parts-manifest.json').read_text())
        supplements(manifest,supplemental_path,analysis,stage)
        manifest['assets']={str(p.relative_to(stage)):digest(p) for p in sorted(stage.rglob('*.png'))}
        save_json(stage/'parts-manifest.json',manifest)
        report={'partsExtracted':True,'partCount':len(entries),'modelValidation':'not-run','visualAcceptance':'not-run','analysisSha256':analysis_fingerprint(analysis)}
        save_json(stage/'extract-report.json',report)
    return report


def verify_prepared(prepared, analysis, info):
    manifest=json.loads((prepared/'parts-manifest.json').read_text(encoding='utf-8'))
    if manifest.get('version')!=1 or manifest.get('image')!=analysis['image'] or manifest.get('canvas')!=[info['width'],info['height']] or manifest.get('analysisSha256')!=analysis_fingerprint(analysis):
        raise ValueError('Prepared source/analysis fingerprint mismatch; run extract again')
    if [e.get('id') for e in manifest.get('parts',[])] != [r['id'] for r in analysis.get('regions',[])]: raise ValueError('Prepared part IDs do not match analysis')
    if any(e.get('empty') for e in manifest['parts']): raise ValueError('Prepared package has empty masks')
    assets=manifest.get('assets')
    required={'texture.png','binding-overlay.png'}
    for entry in manifest['parts']: required.update(entry[k] for k in ['fullCanvas','cropped','mask'])
    for entry in manifest.get('supplements',[]): required.add(entry['image'])
    if not isinstance(assets,dict) or not required.issubset(assets): raise ValueError('Prepared asset fingerprints are incomplete')
    for relative, fingerprint in assets.items():
        path=(prepared/relative).resolve()
        if not path.is_relative_to(prepared.resolve()) or not path.is_file() or digest(path)!=fingerprint: raise ValueError('Prepared asset fingerprint mismatch: '+relative)
    return manifest


def validate_runtime(model, rig_package):
    metadata=json.loads((rig_package/'package.json').read_text(encoding='utf-8'))
    if metadata.get('name')!='@z7589xxz758/yuragi' or not isinstance(metadata.get('version'),str): raise ValueError('--rig-package must point to a built @z7589xxz758/yuragi package')
    entry=(rig_package/'dist/index.js').resolve()
    if not entry.is_file(): raise ValueError('Build/install library first; dist/index.js is missing')
    node=shutil.which('node')
    if not node: raise ValueError('Node.js is required to run the actual TypeScript runtime validator')
    code="import {readFileSync} from 'node:fs'; const {validateModel}=await import(process.argv[1]); if(typeof validateModel!=='function') throw new Error('Runtime lacks validateModel'); validateModel(JSON.parse(readFileSync(0,'utf8')));"
    try:
        completed=subprocess.run([node,'--input-type=module','-e',code,entry.as_uri()],input=json.dumps(model,allow_nan=False),text=True,capture_output=True,timeout=30)
    except subprocess.TimeoutExpired as error: raise ValueError('Runtime validation timed out') from error
    if completed.returncode: raise ValueError('Runtime validateModel failed: '+completed.stderr.strip())
    return rig_package/'dist'


def _build(source: Path, analysis_path: Path | None, output: Path, rig_package: Path | None = None, prepared_path: Path | None = None):
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
    if prepared_path: verify_prepared(prepared_path,analysis,info)
    runtime_source = validate_runtime(model,rig_package) if rig_package else None
    # Validate all annotations before creating any output or extracting parts.
    output.mkdir(parents=True, exist_ok=True)
    image.save(output / 'texture.png')
    save_json(output / 'image-info.json', info)
    save_json(output / 'analysis.json', analysis)
    save_json(output / 'model.json', model)
    regions = analysis.get('regions', [])
    overlay(image, model['pins'], analysis.get('headBounds'), regions).save(output / 'binding-overlay.png')
    if prepared_path:
        manifest=verify_prepared(prepared_path,analysis,info)
        for path in prepared_path.iterdir():
            if path.is_dir(): shutil.copytree(path,output/path.name)
            elif path.name not in ['analysis.json','image-info.json','texture.png','binding-overlay.png']:
                shutil.copyfile(path,output/path.name)
        entries=manifest['parts'];part_paths=[e['fullCanvas'] for e in entries]
    else:
        entries,part_paths=export_parts(image,analysis,output)
    runtime_ready = bool(runtime_source)
    if runtime_source:
        destination = output / 'runtime'; destination.mkdir(exist_ok=True)
        for file in runtime_source.glob('*.js'): shutil.copyfile(file, destination / file.name)
    if runtime_ready: (output / 'preview.html').write_text(PREVIEW, encoding='utf-8')
    warnings = info['warnings'] + ['Extracted parts contain visible source pixels only; hidden anatomy was not reconstructed.',
                                  'Model data is a binding candidate; visual motion acceptance has not been performed.']
    report = {'mode': analysis['mode'], 'confidence': analysis.get('confidence',0), 'controls': controls,
              'runtimeReady': runtime_ready, 'runtimeVersion':json.loads((rig_package/'package.json').read_text())['version'] if rig_package else None, 'partsExtracted':True, 'modelValidation':'passed' if runtime_ready else 'not-run', 'parts': part_paths, 'partsManifest':'parts-manifest.json',
              'emptyParts':[entry['id'] for entry in entries if entry['empty']], 'surfaceRegions':len(model.get('surfaceRegions',[])),
              'deformationParts':len(model.get('parts',[])), 'warnings': warnings,
              'unsupportedMotions': analysis.get('unsupportedMotions', []), 'visualAcceptance': 'not-run'}
    save_json(output / 'build-report.json', report)
    rows = '\n'.join(f"| {p['name']} | {p['x']:.5f} | {p['y']:.5f} | {p['radius']:.5f} |" for p in model['pins'])
    unsupported = '\n'.join('- '+s for s in report['unsupportedMotions']) or '- None requested; large turns, independent layer playback and occlusion changes need further engine/material work.'
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
| Legacy head warping | pose.headWarpBounds | {str(analysis['mode']=='humanoid' and not analysis.get('headMotion')).lower()} |
| Whole head / neck bridge | pose.headFollow.region / neck | {str(bool(analysis.get('headMotion'))).lower()} |
| Pointer body movement | tracking.bodyFollow | {model.get('tracking', {}).get('bodyFollow', 1)} |
| Whole-artwork pointer travel | tracking.translation | {str(bool(model.get('tracking', {}).get('translation'))).lower()} |
| Local hair / accessories | hair / accessories chains | {bool(model['hair'])} / {bool(model['accessories'])} |
| Local polygon parts | parts / motion.parts / setPart | {len(model.get('parts', []))} parts |
| Surface ownership | surfaceRegions | {len(model.get('surfaceRegions', []))} regions |
| Bounded pointer spring | tracking | {str(bool(model.get('tracking'))).lower()} |

## Facial controls

Reviewed face features included: {str(bool(model.get('face'))).lower()}. Use setGaze and setGazeStrength only with reviewed eyes. Pupils translate within eye bounds; source eyelids and mouth remain unchanged. Curves use playAnimation/pauseAnimation/seekAnimation/stopAnimation; milliseconds, linear/step/Bezier. No Spine file import, independent bones or IK.

## Normalized bindings

Full original image: left/top (0,0), right/bottom (1,1). No trimmed-image or display-size coordinates.

| Pin | x | y | radius |
| --- | --- | --- | --- |
{rows}

Pose and chain details are in `model.json`; inspect `binding-overlay.png` before previewing.
`parts-manifest.json` records visible extracts, cropped source bounds, attachment metadata and completion needs.
Existing flexible parts can be updated with setPart(id, patch); surfaceRegions and added/removed parts require player recreation. Tracking can be edited live with setTracking(patch).

## Unsupported or additional work

{unsupported}

## Preview and integration

Run a local HTTP server in this output folder, then open `preview.html`. Runtime included: {runtime_ready}.
If missing, rebuild with `--rig-package /path/to/node_modules/@z7589xxz758/yuragi` (or a built local library checkout).
The preview uses native createPlayer, AbortSignal, a static fallback, low-frequency UI diagnostics and idempotent destroy. Vue uses `@z7589xxz758/yuragi/vue`; React uses `@z7589xxz758/yuragi/react`.

## Acceptance

- Schema validation: {report['modelValidation']} using the target runtime; visual review remains separate.
- Neutral / pointer extremes / enabled wave / continuous idle / face / seams / hair roots: not run.
- Desktop / touch / keyboard / reduced motion / load failures / navigation cleanup: not run.
- Require finite diagnostics; sustained motionScale below 1 means reduce motion or repair binding.
- Reinspect after changing artwork; fingerprints must match the annotated image.

## Limitations

""" + '\n'.join('- '+w for w in warnings) + '\n'
    (output / 'rig-spec.md').write_text(spec, encoding='utf-8')
    return report


def build(source: Path, analysis_path: Path | None, output: Path, rig_package: Path | None = None, prepared_path: Path | None = None):
    """Direct preparation without runtime remains available to Python callers; CLI playback requires staged inputs."""
    if prepared_path and analysis_path is None: analysis_path=prepared_path/'analysis.json'
    with new_output(output) as stage:
        return _build(source,analysis_path,stage,rig_package,prepared_path)


def inspect(source: Path, output: Path):
    with new_output(output) as stage:
        return _inspect(source,stage)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['inspect', 'extract', 'build'])
    parser.add_argument('image', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--analysis', type=Path)
    parser.add_argument('--rig-package', type=Path)
    parser.add_argument('--prepared', type=Path)
    parser.add_argument('--supplements', type=Path)
    args = parser.parse_args(argv)
    try:
        if args.command == 'inspect':
            if args.analysis or args.prepared or args.rig_package or args.supplements: raise ValueError('inspect only accepts image and --out')
            result=inspect(args.image,args.out)
        elif args.command == 'extract':
            if args.prepared or args.rig_package: raise ValueError('extract accepts --analysis and optional --supplements, not runtime inputs')
            result=extract(args.image,args.analysis,args.out,args.supplements)
        else:
            if not args.prepared or not args.rig_package: raise ValueError('build requires --prepared and --rig-package; run inspect, annotate and extract first')
            if args.supplements: raise ValueError('Supply supplements during extract')
            result=build(args.image,args.analysis,args.out,args.rig_package,args.prepared)
        print(json.dumps(result, indent=2))
    except (ValueError, OSError, KeyError, Image.DecompressionBombError) as error:
        parser.exit(2, 'Character preparation failed: ' + str(error) + '\n')


if __name__ == '__main__':
    main()
