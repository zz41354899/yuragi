#!/usr/bin/env python3
"""Publish an already compiled version; never launch an agent or infer anatomy."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
from PIL import Image

def publish(root, source, version_id, folder, rig_package, inputs=()):
    root=Path(root).resolve();source=Path(source).resolve();folder=Path(folder).resolve();rig_package=Path(rig_package).resolve()
    if not source.is_relative_to(root) or not folder.is_relative_to(root): raise ValueError('Source and version must stay inside project root')
    if not version_id or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-' for c in version_id): raise ValueError('Invalid version ID')
    metadata=json.loads((rig_package/'package.json').read_text())
    if metadata.get('name')!='@yuragi/rig': raise ValueError('Expected @yuragi/rig runtime')
    model=json.loads((folder/'model.json').read_text())
    code="const r=await import(process.argv[1]);const m=JSON.parse(process.argv[2]);(m.version===2?r.validateLayeredModel:r.validateModel)(m);"
    subprocess.run(['node','--input-type=module','-e',code,(rig_package/'dist/index.js').as_uri(),json.dumps(model)],check=True,capture_output=True)
    refs=[model['texture']['src']] if model['version']==1 else [model['source']['fallback'],*[a['src'] for a in model['atlases']]]
    for ref in refs:
        path=(folder/ref).resolve()
        if not path.is_relative_to(folder) or not path.is_file(): raise ValueError('Missing or escaping model asset')
        with Image.open(path) as image:
            image.load()
            expected=[model['texture']] if model['version']==1 else (([model['source']] if ref==model['source']['fallback'] else [])+[a for a in model['atlases'] if a['src']==ref])
            if any(image.size!=(entry['width'],entry['height']) for entry in expected): raise ValueError('Model image dimensions mismatch')
        if model['version']==2 and ref==model['source']['fallback'] and hashlib.sha256(path.read_bytes()).hexdigest()!=model['source']['sha256']: raise ValueError('Model source fingerprint mismatch')
    destination=root/'project.json'
    project=json.loads(destination.read_text()) if destination.exists() else {'version':1,'source':{'file':str(source.relative_to(root)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()},'versions':[]}
    if project['source']['sha256']!=hashlib.sha256(source.read_bytes()).hexdigest(): raise ValueError('Source changed; create a new project')
    if any(v['id']==version_id for v in project['versions']): raise ValueError('Version already exists')
    dependencies={}
    resources=[source,folder/'model.json',*[folder/ref for ref in refs],*map(Path,inputs)]
    for value in inputs:
        path=Path(value).resolve()
        if path.suffix=='.json':
            data=json.loads(path.read_text())
            if isinstance(data,dict) and data.get('renderer')=='layered-authoring':
                for attachment in data.get('attachments',[]):
                    resources.extend(path.parent/attachment[key] for key in ['image','mask'] if attachment.get(key))
    for value in resources:
        path=Path(value).resolve()
        if not path.is_relative_to(root) or not path.is_file(): raise ValueError('Input must be a local project file')
        dependencies[str(path.relative_to(root))]=hashlib.sha256(path.read_bytes()).hexdigest()
    project['versions'].append({'id':version_id,'path':str(folder.relative_to(root)),'inputs':dependencies,'runtimeVersion':metadata['version']})
    project.update(currentVersion=version_id,stage='compiled')
    with tempfile.NamedTemporaryFile(mode='w',dir=root,delete=False,encoding='utf-8') as output:
        json.dump(project,output,ensure_ascii=False,indent=2);temporary=output.name
    os.replace(temporary,destination)
    return project

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project',required=True);parser.add_argument('--source',required=True);parser.add_argument('--id',required=True)
    parser.add_argument('--folder',required=True);parser.add_argument('--rig-package',required=True);parser.add_argument('--input',action='append',default=[])
    args=parser.parse_args()
    try: print(json.dumps(publish(args.project,args.source,args.id,args.folder,args.rig_package,args.input),ensure_ascii=False))
    except (ValueError,OSError,KeyError,subprocess.CalledProcessError) as error: parser.exit(1,str(error)+'\n')
if __name__=='__main__': main()
