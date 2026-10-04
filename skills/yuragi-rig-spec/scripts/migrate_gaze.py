#!/usr/bin/env python3
"""Explicit 0.1 -> 0.2 gaze migration. Never overwrites input; reports every removed field/track."""
import argparse
import copy
import json
from pathlib import Path


def migrate(value):
    result = copy.deepcopy(value)
    changes = []
    def visit(node, path='$'):
        if isinstance(node, dict):
            face = node.get('face')
            if isinstance(face, dict):
                for key in ['mode', 'blink', 'mouth']:
                    if key in face:
                        del face[key]; changes.append({'path':path+'.face.'+key, 'action':'removed'})
                for i, eye in enumerate(face.get('eyes', [])):
                    if not isinstance(eye, dict): continue
                    for key in ['skinSample', 'ink']:
                        if key in eye:
                            del eye[key]; changes.append({'path':f'{path}.face.eyes[{i}].{key}', 'action':'removed'})
            if isinstance(node.get('tracks'), list):
                tracks=[]
                for i, track in enumerate(node['tracks']):
                    if isinstance(track, dict) and track.get('target') == 'expression':
                        if track.get('name') == 'gaze':
                            track['target']='gaze'; track['name']='strength'
                            changes.append({'path':f'{path}.tracks[{i}]', 'action':'expression.gaze -> gaze.strength'})
                        else:
                            changes.append({'path':f'{path}.tracks[{i}]', 'action':'removed', 'channel':track.get('name')}); continue
                    tracks.append(track)
                node['tracks']=tracks
                if not tracks: changes.append({'path':path, 'action':'empty clip; remove or author replacement before playback'})
            for key, item in node.items(): visit(item, path+'.'+key)
        elif isinstance(node, list):
            for i, item in enumerate(node): visit(item, f'{path}[{i}]')
    visit(result)
    return result, {'from':'0.1', 'to':'0.2.0', 'changes':changes, 'validation':'not-run; validate with target runtime before playback'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path); parser.add_argument('--out', type=Path, required=True)
    args=parser.parse_args()
    report=args.out.with_name(args.out.stem+'.migration-report.json')
    try:
        if args.out.resolve() == args.input.resolve() or args.out.exists() or report.exists():
            raise ValueError('Use a new output filename; input and existing output are never overwritten')
        result, details=migrate(json.loads(args.input.read_text(encoding='utf-8')))
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False)+'\n', encoding='utf-8')
        report.write_text(json.dumps(details, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        print(json.dumps(details, ensure_ascii=False, indent=2))
    except (ValueError, OSError) as error: parser.exit(2, str(error)+'\n')

if __name__ == '__main__': main()
