#!/usr/bin/env python3
"""Diagnose saved agent annotations, extract/build locally, then open the preview-only Studio.

Python measures annotated pixels; it does not recognize anatomy or reconstruct hidden art.
All outputs use a new directory. Failed candidates never replace an existing model.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys
from PIL import Image, ImageChops, ImageDraw

# Also works when loaded by importlib in an installed Skill or the test suite.
sys.path.insert(0, str(Path(__file__).resolve().parent))
import prepare_character as preparation
import build_layers


def write_json(path, data):
    path = Path(path)
    temporary = path.with_name('.' + path.name + '.pending')
    temporary.write_text(json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False) + '\n', encoding='utf-8')
    temporary.replace(path)


def missing_item(asset_id, part_id, reason, action, required=False, region=None):
    value = {'id': asset_id, 'partId': part_id, 'reason': reason, 'nextAction': action, 'required': required}
    if region: value['sourceRegion'] = region
    return value


def diagnose(source, analysis_path, output, feedback=None, manifest_path=None):
    source, analysis_path, output = Path(source), Path(analysis_path), Path(output)
    if output.exists(): raise ValueError('Use a new diagnosis directory')
    image, info = preparation.read_image(source)
    analysis = preparation.annotated_analysis(json.loads(analysis_path.read_text(encoding='utf-8')), info)
    regions = analysis.get('regions', [])
    by_id = {r['id']: r for r in regions}
    def mask(region):
        result = Image.new('L', image.size)
        ImageDraw.Draw(result).polygon([(x*image.width, y*image.height) for x,y in region.get('outline', region['polygon'])], fill=255)
        return result
    parts, missing = [], []
    for region in regions:
        selected = mask(region)
        for other in region.get('subtract', []): selected = ImageChops.subtract(selected, mask(by_id[other]))
        visible = ImageChops.multiply(selected, image.getchannel('A'))
        bounds = visible.getbbox()
        motion = 'flexible' if region.get('deformation') else 'rigid' if region.get('binding', {}).get('mode') == 'rigid' else 'shared-surface'
        parts.append({'id': region['id'], 'role': region.get('role', 'unclassified'), 'parent': region.get('parent'),
                      'polygon': region.get('outline', region['polygon']), 'boundsPixels': list(bounds) if bounds else None,
                      'visiblePixels': sum(visible.histogram()[1:]), 'coverage': 'visible-only', 'motion': motion,
                      'nextAction': 'extract' if bounds else 'revise-annotation',
                      'confidence': region.get('confidence', analysis['confidence']),
                      'occlusion': region.get('occlusion'), 'protectedAreas': region.get('protectedAreas', [])})
        if not bounds: missing.append(missing_item(region['id'], region['id'], 'Annotated mask contains no visible source pixels.', 'revise-annotation', True, region['id']))
    requested = analysis.get('missingAssets', [])
    if not isinstance(requested, list) or len(requested) > 256: raise ValueError('missingAssets must be an array of at most 256 requests')
    requests = list(requested)
    if feedback:
        report = json.loads(Path(feedback).read_text(encoding='utf-8'))
        if report.get('version') != 1 or report.get('sourceSha256') != info['sha256']: raise ValueError('Missing-assets report belongs to a different source; re-inspect before extraction')
        if not isinstance(report.get('items'), list) or len(report['items']) > 256: raise ValueError('Invalid missing-assets items')
        requests.extend(report['items'])
    for request in requests:
        if not isinstance(request, dict): raise ValueError('Invalid missing asset request')
        asset_id = preparation.identifier(request.get('id'), 'missing asset id')
        part_id = preparation.identifier(request.get('partId', asset_id), 'missing part id')
        reason = request.get('reason', 'Requested artwork is unavailable.')
        if not isinstance(reason, str) or not reason.strip(): raise ValueError('Missing asset reason is required')
        required = request.get('required', False)
        if not isinstance(required, bool): raise ValueError('required must be boolean')
        region_id = request.get('sourceRegion')
        candidate = next((p for p in parts if p['id'] == region_id), None)
        # Only an explicit reviewed source region establishes extractability.
        action = candidate['nextAction'] if candidate else 'provide-artwork'
        if region_id and not candidate: action = 'revise-annotation'
        missing.append(missing_item(asset_id, part_id, reason, action, required, region_id))
    if manifest_path:
        manifest_path = Path(manifest_path).resolve()
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        if manifest.get('version') != 2 or manifest.get('renderer') != 'layered-authoring': raise ValueError('Explicit layered-authoring manifest required')
        if manifest.get('source', {}).get('sha256') != info['sha256']: raise ValueError('Manifest source fingerprint mismatch')
        for attachment in manifest.get('attachments', []):
            for field in ['image', 'mask']:
                if field not in attachment: continue
                target = (manifest_path.parent / attachment[field]).resolve()
                if not target.is_relative_to(manifest_path.parent): raise ValueError('Attachment resource leaves manifest directory')
                if not target.is_file():
                    region_id = attachment.get('sourceRegion')
                    candidate = next((p for p in parts if p['id'] == region_id), None)
                    missing.append(missing_item(attachment['id']+'-'+field, attachment['id'], 'Layered '+field+' file is missing: '+attachment[field], candidate['nextAction'] if candidate else 'provide-artwork', True, region_id))
    # Stable IDs keep feedback consumable across repeated diagnosis; explicit analysis wins.
    missing = list({item['id']: item for item in reversed(missing)}.values())
    blocking = [item['id'] for item in missing if item['required']]
    common = {'version': 1, 'sourceSha256': info['sha256'], 'analysisSha256': preparation.analysis_fingerprint(analysis)}
    decomposition = {**common, 'coordinateSpace': 'full-source-normalized', 'parts': parts}
    material_report = {**common, 'producer': 'python', 'items': missing}
    diagnosis = {**common, 'stage': 'diagnosed', 'canBuild': not blocking, 'blockingAssets': blocking,
                 'partCount': len(parts), 'sourceSize': [image.width, image.height], 'partsExtracted': False,
                 'modelValidation': 'not-run', 'visualAcceptance': 'not-run'}
    output.mkdir(parents=True)
    write_json(output/'character-analysis.json', analysis)
    write_json(output/'decomposition.json', decomposition)
    write_json(output/'missing-assets.json', material_report)
    write_json(output/'diagnosis.json', diagnosis)
    return diagnosis


def preview_missing(model):
    items = []
    for part in model.get('attachments', []):
        if part['coverage'] == 'visible-only': items.append(missing_item(part['id']+'-completion', part['id'], 'Only visible source pixels are available; hidden coverage requires supplied artwork.', 'provide-artwork'))
    return items


def run(source, analysis_path, output, rig_package, feedback=None, manifest_path=None, supplements=None, studio=False, port=4321, no_open=False):
    output, rig_package = Path(output).resolve(), Path(rig_package).resolve()
    if output.exists(): raise ValueError('Use a new workflow directory')
    if not 0 <= port <= 65535: raise ValueError('Port must be 0..65535')
    if studio and not (rig_package/'dist/studio/cli.js').is_file(): raise ValueError('Runtime does not include Studio; rebuild/install the current package')
    metadata = json.loads((rig_package/'package.json').read_text(encoding='utf-8'))
    if metadata.get('name') != '@yuragi/rig' or not isinstance(metadata.get('version'), str): raise ValueError('A built @yuragi/rig package is required')
    validator = 'validateLayeredModel' if manifest_path else 'validateModel'
    subprocess.run(['node', '--input-type=module', '-e', "const runtime = await import(process.argv[1]); if(typeof runtime[process.argv[2]] !== 'function') throw new Error('Runtime validator unavailable')", (rig_package/'dist/index.js').as_uri(), validator], check=True, capture_output=True, text=True, timeout=30)
    diagnosis = diagnose(source, analysis_path, output/'diagnostics', feedback, manifest_path)
    diagnosis['runtimeVersion'] = metadata['version']
    write_json(output/'diagnostics/diagnosis.json', diagnosis)
    if not diagnosis['canBuild']: return {**diagnosis, 'missingAssets': str(output/'diagnostics/missing-assets.json'), 'studioStarted': False}
    saved_analysis = output/'diagnostics/character-analysis.json'
    try:
        preparation.extract(Path(source), saved_analysis, output/'prepared', Path(supplements) if supplements else None)
        diagnosis['partsExtracted'] = True
        if manifest_path:
            build_layers.compile_layers(manifest_path, output/'model', rig_package)
        else:
            preparation.build(Path(source), saved_analysis, output/'model', rig_package, output/'prepared')
    except (ValueError, OSError, KeyError, subprocess.SubprocessError) as error:
        diagnosis.update(stage='failed', error=str(error))
        write_json(output/'diagnostics/diagnosis.json', diagnosis)
        raise
    model = json.loads((output/'model/model.json').read_text(encoding='utf-8'))
    report = json.loads((output/'diagnostics/missing-assets.json').read_text(encoding='utf-8'))
    report['items'] = list({item['id']: item for item in [*preview_missing(model), *report['items']]}.values())
    write_json(output/'diagnostics/missing-assets.json', report)
    diagnosis.update(stage='compiled', partsExtracted=True, modelValidation='passed')
    write_json(output/'diagnostics/diagnosis.json', diagnosis)
    for name in ['character-analysis.json', 'decomposition.json', 'missing-assets.json', 'diagnosis.json']:
        shutil.copyfile(output/'diagnostics'/name, output/'model'/name)
    result = {**diagnosis, 'model': str(output/'model'), 'missingAssets': str(output/'diagnostics/missing-assets.json'), 'studioStarted': studio}
    print(json.dumps(result, ensure_ascii=False), flush=True)
    if studio:
        cli = rig_package/'dist/studio/cli.js'
        command = ['node', str(cli), 'studio', '--project', str(output/'model'), '--out', str(output/'preview'), '--port', str(port)]
        if no_open: command.append('--no-open')
        subprocess.run(command, check=True)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['diagnose', 'run'])
    parser.add_argument('image', type=Path)
    parser.add_argument('--analysis', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--missing', type=Path, help='Read a saved Studio missing-assets.json')
    parser.add_argument('--manifest', type=Path, help='Use the separately authored v2 manifest')
    parser.add_argument('--supplements', type=Path)
    parser.add_argument('--rig-package', type=Path)
    parser.add_argument('--studio', action='store_true', help='Open Studio after successful compilation; process stays running')
    parser.add_argument('--port', type=int, default=4321)
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    try:
        if args.command == 'diagnose':
            if args.studio or args.supplements: raise ValueError('diagnose only measures annotations; use run to extract/build/open')
            print(json.dumps(diagnose(args.image, args.analysis, args.out, args.missing, args.manifest), ensure_ascii=False))
        else:
            if not args.rig_package: raise ValueError('run requires --rig-package')
            result = run(args.image, args.analysis, args.out, args.rig_package, args.missing, args.manifest, args.supplements, args.studio, args.port, args.no_open)
            if not result['canBuild']: print(json.dumps(result, ensure_ascii=False)); return 2
    except KeyboardInterrupt:
        return 130
    except (ValueError, OSError, KeyError, subprocess.SubprocessError) as error:
        parser.exit(2, str(error)+'\n')
    return 0


if __name__ == '__main__': sys.exit(main())
