#!/usr/bin/env python3
"""Compile explicitly authored layered attachments; never infer missing artwork.
Requires Pillow, Node and a built local @z7589xxz758/yuragi. Output is committed only after runtime validation.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import tempfile
from copy import deepcopy
from PIL import Image, ImageChops


def finite(value, low, high):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
        raise ValueError('Invalid finite number')
    return value


def sparse(weights, nodes, width, height, error_pixels):
    """Conservative pruning bound across the full declared parent-chain motion envelope."""
    used = set()
    for weight in weights:
        if weight['node'] not in nodes or weight['node'] in used:
            raise ValueError('Unknown or duplicate node binding')
        used.add(weight['node']); finite(weight['weight'], 0, 1)
    if not weights or abs(sum(w['weight'] for w in weights) - 1) > 1e-5:
        raise ValueError('Weights must sum to one')
    original_total = sum(w['weight'] for w in weights)
    ranked = sorted([{'node':w['node'],'weight':w['weight']/original_total} for w in weights], key=lambda w: -w['weight'])
    kept = [w for w in ranked[:4] if w['weight'] >= 1e-6]
    total = sum(w['weight'] for w in kept)
    if not total:
        raise ValueError('Empty binding')
    # Maximum point-to-pivot distance uses source diagonal. Rotation/translation bounds add along parents.
    diagonal = math.hypot(width, height)
    def envelope(node_id):
        node = nodes[node_id]
        angle = abs(node['rotation']) + node.get('spring', {}).get('rotation', 0)
        displacement = 2 * diagonal * math.sin(min(math.pi, angle) / 2) + math.hypot(node['translation'][0] * width, node['translation'][1] * height)
        return displacement + (envelope(node['parent']) if node.get('parent') else 0)
    bound = 2 * max(0, 1 - total) * max(envelope(w['node']) for w in ranked)
    if bound > error_pixels:
        raise ValueError(f'Pruned weight error bound {bound:.4f}px exceeds {error_pixels}px')
    return [{'node': w['node'], 'weight': w['weight'] / total} for w in kept], bound


def compile_layers(manifest_path, output, rig_package, allow_visible_only=False, atlas_size=2048, error_pixels=.25):
    manifest_path, output, rig_package = Path(manifest_path).resolve(), Path(output).resolve(), Path(rig_package).resolve()
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output must be empty; use a new directory')
    finite(atlas_size, 64, 4096); finite(error_pixels, 0, 4)
    if not isinstance(atlas_size, int): raise ValueError('Atlas size must be integer')
    manifest = json.loads(manifest_path.read_text())
    if manifest.get('version') != 2 or manifest.get('renderer') != 'layered-authoring':
        raise ValueError('Explicit v2 layered-authoring manifest required; v1 extracts cannot be played')
    base = manifest_path.parent
    def resource(value):
        path = (base / value).resolve()
        if not path.is_relative_to(base): raise ValueError('Resource must stay inside manifest directory')
        return path
    source = resource(manifest['source']['file'])
    fingerprint = hashlib.sha256(source.read_bytes()).hexdigest()
    if fingerprint != manifest['source']['sha256']: raise ValueError('Source fingerprint mismatch')
    with Image.open(source) as original:
        width, height = original.size
        reference = original.convert('RGBA')
    if [width,height] != manifest['source']['size']: raise ValueError('Source size mismatch')
    if not 1 <= width <= 8192 or not 1 <= height <= 8192: raise ValueError('Source exceeds limits')
    nodes = {n['id']: n for n in manifest['nodes']}
    if len(nodes) != len(manifest['nodes']): raise ValueError('Duplicate nodes')
    seen = set()
    for node in manifest['nodes']:
        if node.get('parent') and node['parent'] not in seen: raise ValueError('Parent must precede child')
        seen.add(node['id'])
    model = {'version':2, 'renderer':'layered', 'id':manifest['id'], 'name':manifest['name'],
             'source':{'width':width,'height':height,'fallback':'fallback.png','sha256':fingerprint},
             'atlases':[], 'nodes':manifest['nodes'], 'joints':manifest.get('joints',[]), 'attachments':[]}
    for field in ['hairGroups','face']:
        if field in manifest: model[field]=deepcopy(manifest[field])
    max_error = 0
    for joint in model['joints']:
        joint['weights'], bound = sparse(joint['weights'],nodes,width,height,error_pixels); max_error=max(max_error,bound)
    joint_map = {j['id']: j for j in model['joints']}
    pages, page = [], None
    cursor_x = cursor_y = row_height = 0
    def pack(image):
        nonlocal page,cursor_x,cursor_y,row_height
        w,h=image.size
        if w+4>atlas_size or h+4>atlas_size: raise ValueError('Image exceeds atlas size with gutters')
        if page is None or cursor_y+h+4>atlas_size:
            page=Image.new('RGBA',(atlas_size,atlas_size));pages.append(page);cursor_x=cursor_y=row_height=0
        if cursor_x+w+4>atlas_size:
            cursor_x=0;cursor_y+=row_height;row_height=0
            if cursor_y+h+4>atlas_size:
                page=Image.new('RGBA',(atlas_size,atlas_size));pages.append(page);cursor_y=0
        x,y=cursor_x+2,cursor_y+2
        page.paste(image,(x,y))
        # Two extruded texels prevent linear-filter bleeding across atlas entries.
        page.paste(image.crop((0,0,1,h)).resize((2,h),Image.Resampling.NEAREST),(x-2,y));page.paste(image.crop((w-1,0,w,h)).resize((2,h),Image.Resampling.NEAREST),(x+w,y))
        page.paste(page.crop((x-2,y,x+w+2,y+1)).resize((w+4,2),Image.Resampling.NEAREST),(x-2,y-2))
        page.paste(page.crop((x-2,y+h-1,x+w+2,y+h)).resize((w+4,2),Image.Resampling.NEAREST),(x-2,y+h))
        cursor_x+=w+4;row_height=max(row_height,h+4)
        return len(pages)-1,[x,y,w,h]
    composite=Image.new('RGBA',(width,height))
    hidden_neutral=set()
    for eye in manifest.get('face',{}).get('eyes',[]): hidden_neutral.update([eye['half'],eye['closed']])
    mouth=manifest.get('face',{}).get('mouth',{}).get('shapes',{})
    hidden_neutral.update(value for key,value in mouth.items() if key!='closed')
    for entry in manifest['attachments']:
        if entry.get('coverage') not in ['complete','visible-only'] or not entry.get('provenance'):
            raise ValueError('Coverage and provenance required')
        if entry['coverage'] != 'complete' and not allow_visible_only:
            raise ValueError('Missing completed artwork; --allow-visible-only is for prototypes')
        box=entry['boundsPixels']
        if len(box)!=4 or any(not isinstance(v,int) or isinstance(v,bool) for v in box) or not (0<=box[0]<box[2]<=width and 0<=box[1]<box[3]<=height):
            raise ValueError('Invalid source pixel bounds')
        with Image.open(resource(entry['image'])) as original: image=original.convert('RGBA')
        if image.size != (box[2]-box[0],box[3]-box[1]): raise ValueError('Attachment image size mismatch')
        if not image.getchannel('A').getbbox(): raise ValueError('Empty attachment')
        page_index,rect=pack(image)
        layer={'id':entry['id'],'atlas':f'atlas-{page_index}','rect':rect,'bounds':[box[0]/width,box[1]/height,box[2]/width,box[3]/height],
               'coverage':entry['coverage'],'provenance':entry['provenance'],'vertices':[],'triangles':[],'opacity':entry.get('opacity',1)}
        preview=image.copy()
        if entry.get('mask'):
            with Image.open(resource(entry['mask'])) as original:
                if 'A' not in original.getbands(): raise ValueError('Mask requires an explicit alpha channel')
                mask=original.convert('RGBA')
            if mask.size!=image.size: raise ValueError('Mask size mismatch')
            # Keep mask and image on one page even if a page boundary would split them.
            mask_page,mask_rect=pack(mask)
            if mask_page!=page_index: raise ValueError('Mask must fit on the same atlas page; increase atlas size')
            layer['mask']=mask_rect
            preview.putalpha(ImageChops.multiply(preview.getchannel('A'),mask.getchannel('A')))
        if entry.get('vertices'):
            layer['vertices']=entry['vertices'];layer['triangles']=entry['triangles']
        else:
            columns,rows=entry.get('mesh',[1,1])
            for value in [columns,rows]:
                if not isinstance(value,int) or isinstance(value,bool) or not 1<=value<=128: raise ValueError('Invalid mesh dimensions')
            xs={x/columns for x in range(columns+1)};ys={y/rows for y in range(rows+1)}
            for refine in entry.get('refine',[]):
                region=refine['boundsPixels'];cell=refine['cellPixels']
                if len(region)!=4 or any(not isinstance(v,int) for v in region) or not(box[0]<=region[0]<region[2]<=box[2] and box[1]<=region[1]<region[3]<=box[3]): raise ValueError('Refinement must stay inside attachment bounds')
                if not isinstance(cell,int) or not 1<=cell<=256: raise ValueError('Invalid refinement cell size')
                xs.update((x-box[0])/(box[2]-box[0]) for x in [*range(region[0],region[2],cell),region[2]])
                ys.update((y-box[1])/(box[3]-box[1]) for y in [*range(region[1],region[3],cell),region[3]])
            xs,ys=sorted(xs),sorted(ys)
            if len(xs)*len(ys)>65535: raise ValueError('Refined vertex budget exceeded')
            for y in ys:
                for x in xs:
                    position=[(box[0]+x*(box[2]-box[0]))/width,(box[1]+y*(box[3]-box[1]))/height]
                    weights=[{'node':entry['node'],'weight':1}]
                    if entry.get('flex'):
                        flex=entry['flex'];rx,ry=flex['root'];tx,ty=flex['tip']
                        dx=(tx-rx)*width;dy=(ty-ry)*height;length=dx*dx+dy*dy
                        if length<=0: raise ValueError('Flexible root and tip must differ')
                        t=max(0,min(1,((position[0]-rx)*width*dx+(position[1]-ry)*height*dy)/length));t=t*t*(3-2*t)
                        weights=[{'node':entry['node'],'weight':1-t},{'node':flex['node'],'weight':t}]
                        weights=[w for w in weights if w['weight']>=1e-6]
                    layer['vertices'].append({'position':position,'weights':weights})
            alpha=preview.getchannel('A')
            for y in range(len(ys)-1):
                for x in range(len(xs)-1):
                    if entry.get('pruneTransparent'):
                        pixel_box=(int(xs[x]*image.width),int(ys[y]*image.height),math.ceil(xs[x+1]*image.width),math.ceil(ys[y+1]*image.height))
                        if not alpha.crop(pixel_box).getbbox(): continue
                    a=y*len(xs)+x;b=a+1;c=a+len(xs);layer['triangles'] += [a,c,b,b,c,c+1]
            if not layer['triangles']: raise ValueError('Attachment mesh is empty after transparent pruning')
            if entry.get('pruneTransparent'):
                used=sorted(set(layer['triangles']));mapping={old:new for new,old in enumerate(used)}
                layer['vertices']=[layer['vertices'][i] for i in used];layer['triangles']=[mapping[i] for i in layer['triangles']]
        for vertex in layer['vertices']:
            if vertex.get('joint'):
                joint=joint_map[vertex['joint']];vertex['position']=joint['position'];vertex['weights']=joint['weights']
            else:
                vertex['weights'],bound=sparse(vertex['weights'],nodes,width,height,error_pixels);max_error=max(max_error,bound)
        preview.putalpha(preview.getchannel('A').point(lambda a:round(a*finite(layer['opacity'],0,1))))
        if entry['id'] not in hidden_neutral and entry.get('neutralVisible',True): composite.alpha_composite(preview,(box[0],box[1]))
        model['attachments'].append(layer)
    if len(pages)>8: raise ValueError('Atlas page budget exceeded')
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(dir=output.parent) as temporary:
        staging=Path(temporary)
        for i,page in enumerate(pages):
            filename=f'atlas-{i}.png';page.save(staging/filename)
            model['atlases'].append({'id':f'atlas-{i}','src':filename,'width':atlas_size,'height':atlas_size})
        shutil.copyfile(source,staging/'fallback.png')
        (staging/'model.json').write_text(json.dumps(model,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
        metadata=json.loads((rig_package/'package.json').read_text())
        if metadata.get('name')!='@z7589xxz758/yuragi': raise ValueError('Expected built @z7589xxz758/yuragi package')
        module=rig_package/'dist/index.js'
        script = """
import {readFileSync} from 'node:fs';
const {validateLayeredModel,createLayeredSimulation}=await import(process.argv[1]);if(typeof validateLayeredModel!=='function'||typeof createLayeredSimulation!=='function')throw new Error('Runtime lacks layered capability');
const model=JSON.parse(readFileSync(process.argv[2],'utf8'));validateLayeredModel(model);
const sim=createLayeredSimulation(model),rest=sim.mesh.rest,indices=sim.mesh.indices;
const area=(positions,i)=>{const a=indices[i]*2,b=indices[i+1]*2,c=indices[i+2]*2;return (positions[b]-positions[a])*(positions[c+1]-positions[a+1])-(positions[b+1]-positions[a+1])*(positions[c]-positions[a]);};
let minimumAreaRatio=Infinity,maxJointErrorPixels=0;
const groups=new Map();let offset=0;
for(const attachment of model.attachments){for(const [i,v]of attachment.vertices.entries())if(v.joint){if(!groups.has(v.joint))groups.set(v.joint,[]);groups.get(v.joint).push(offset+i);}offset+=attachment.vertices.length;}
const frames=Math.max(120,Math.ceil(Math.max(...model.nodes.map(n=>n.response))*8/50));
for(const x of [-.5,0,.5])for(const y of [-.5,0,.5]){
 sim.reset();sim.setPointer(x,y);
 for(let frame=0;frame<frames;frame++){
  sim.update(frame*50,50);
  for(let i=0;i<indices.length;i+=3){const ratio=area(sim.mesh.positions,i)/area(rest,i);if(!Number.isFinite(ratio)||ratio<=0)throw new Error('Layered mesh folds at a sampled pointer extreme');minimumAreaRatio=Math.min(minimumAreaRatio,ratio);}
  for(const group of groups.values())for(const vertex of group){const first=group[0];maxJointErrorPixels=Math.max(maxJointErrorPixels,Math.hypot((sim.mesh.positions[vertex*2]-sim.mesh.positions[first*2])*model.source.width,(sim.mesh.positions[vertex*2+1]-sim.mesh.positions[first*2+1])*model.source.height));}
 }
}
console.log(JSON.stringify({pointerSamples:9,framesPerSample:frames,minimumAreaRatio,sharedJointGroups:groups.size,maxJointErrorPixels:groups.size?maxJointErrorPixels:null}));
"""
        checked=subprocess.run(['node','--input-type=module','-e',script,module.as_uri(),str(staging/'model.json')],check=True,capture_output=True,text=True)
        geometry=json.loads(checked.stdout)
        composite.save(staging/'neutral.png')
        # RGB under zero alpha is not visible; compare premultiplied channels and alpha.
        def premultiplied(image):
            r,g,b,a=image.split();return Image.merge('RGBA',(ImageChops.multiply(r,a),ImageChops.multiply(g,a),ImageChops.multiply(b,a),a))
        diff=ImageChops.difference(premultiplied(composite),premultiplied(reference))
        report={'runtimeVersion':metadata['version'],'modelValidation':'passed','visualAcceptance':'not-run','prototype':any(a['coverage']!='complete' for a in model['attachments']),
                'neutralMaxChannelError':max(channel.getextrema()[1] for channel in diff.split()),'prunedWeightErrorBoundPixels':max_error,
                'atlasBytes':len(pages)*atlas_size*atlas_size*4,'attachments':len(model['attachments']),
                'sampledGeometry':geometry,
                'manifestSha256':hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
                'maskFingerprints':{a['id']:hashlib.sha256(resource(a['mask']).read_bytes()).hexdigest() for a in manifest['attachments'] if a.get('mask')},
                'attachmentFingerprints':{a['id']:hashlib.sha256(resource(a['image']).read_bytes()).hexdigest() for a in manifest['attachments']}}
        (staging/'report.json').write_text(json.dumps(report,indent=2)+'\n')
        if output.exists(): output.rmdir()
        shutil.copytree(staging,output)
    return report


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest',type=Path);parser.add_argument('--output',required=True,type=Path);parser.add_argument('--rig-package',required=True,type=Path)
    parser.add_argument('--allow-visible-only',action='store_true');parser.add_argument('--atlas-size',type=int,default=2048);parser.add_argument('--max-prune-error',type=float,default=.25)
    args=parser.parse_args()
    try: print(json.dumps(compile_layers(args.manifest,args.output,args.rig_package,args.allow_visible_only,args.atlas_size,args.max_prune_error),indent=2))
    except (ValueError,KeyError,OSError,subprocess.CalledProcessError) as error: parser.exit(1,str(error)+'\n')

if __name__=='__main__': main()
