#!/usr/bin/env python3
"""Measured Mirea face extraction; preserve original pixels and never synthesize variants."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
from PIL import Image, ImageDraw


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--request', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--skill', type=Path, default=Path(__file__).resolve().parents[2]/'skills/yuragi-rig-spec')
    args = parser.parse_args()
    source, output = args.source.resolve(), args.out.resolve()
    if output.exists(): parser.error('Use a new output folder')
    spec = importlib.util.spec_from_file_location('prepare_character', args.skill/'scripts/prepare_character.py')
    helper = importlib.util.module_from_spec(spec); spec.loader.exec_module(helper)
    request = json.loads(args.request.read_text(encoding='utf-8'))
    original, info = helper.read_image(source)
    if request.get('sourceSha256') != info['sha256'] or info['sha256'] != '6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05':
        parser.error('Measured contours apply only to the inspected Mirea source')
    width, height = original.size
    polygons = {
        'eye-left-open': [[519,262],[523,256],[528,253],[534,251],[540,251],[546,252],[551,254],[553,257],[553,261],[550,264],[545,267],[538,269],[531,269],[525,267],[521,266]],
        'eye-right-open': [[581,236],[585,232],[590,230],[596,229],[602,230],[607,231],[612,234],[613,238],[611,242],[606,246],[600,248],[592,249],[586,246],[582,241]],
        'eye-left-iris-visible': [[528,253],[530,252],[535,251],[541,252],[545,253],[547,256],[547,261],[544,265],[539,267],[534,267],[530,265],[528,261],[527,257]],
        'eye-right-iris-visible': [[590,232],[594,231],[600,231],[605,232],[607,235],[607,241],[604,245],[600,247],[595,248],[591,245],[589,241],[589,236]],
        'eye-left-eyelid-line': [[515,263],[517,258],[522,253],[527,249],[532,247],[538,246],[543,247],[548,249],[553,252],[556,254],[552,254],[548,252],[543,251],[537,250],[531,251],[526,254],[522,258],[519,263]],
        'eye-right-eyelid-line': [[578,239],[580,234],[584,230],[589,227],[595,226],[601,225],[607,226],[613,229],[617,232],[618,235],[614,234],[610,232],[605,231],[600,231],[594,231],[589,232],[585,235],[582,239]],
        'eye-left-skin-visible': [[523,272],[529,273],[541,271],[552,267],[555,273],[545,279],[533,282],[525,279]],
        'eye-right-skin-visible': [[584,252],[593,253],[603,251],[612,247],[613,253],[603,259],[592,261],[585,259]],
        'mouth-closed': [[567,288],[571,287],[577,286],[582,284],[587,283],[591,281],[593,282],[591,286],[586,289],[580,292],[573,293],[568,292],[566,290]],
    }
    regions = []
    for name, polygon in polygons.items():
        role = 'mouth' if name == 'mouth-closed' else 'iris' if 'iris' in name else 'eyelid' if 'eyelid' in name else 'face' if 'skin' in name else 'eye'
        region = {'id':name,'role':role,'polygon':[[x/width,y/height] for x,y in polygon], 'confidence':.85,
                  'evidence':'AI-reviewed original source, full-image grid and 6x/10x face coordinate crops.',
                  'coverage':'visible-only', 'occlusion':'No invisible pixels reconstructed.',
                  'protectedAreas':['adjacent bangs','nose','unrelated cheek pixels']}
        if 'iris' in name: region['parent'] = name.split('-iris')[0]+'-open'
        regions.append(region)
    for side in ['left','right']:
        regions.append({'id':'eye-'+side+'-sclera-visible','role':'eye','parent':'eye-'+side+'-open',
                        'polygon':[[x/width,y/height] for x,y in polygons['eye-'+side+'-open']],
                        'subtract':['eye-'+side+'-iris-visible','eye-'+side+'-eyelid-line'],
                        'confidence':.8,'coverage':'visible-only','occlusion':'Sclera behind the original iris is absent.'})
    analysis = {'version':1,'image':{k:info[k] for k in ['sha256','width','height']},'id':'mirea-visible-face',
                'name':'Mirea visible facial materials','mode':'silhouette','confidence':.85,'waveSafe':False,
                'evidence':'Face-only extraction from observed source. No full rig, eyelid bed, hidden sclera, closed/half eyes or vowel variants inferred.',
                'landmarks':{},'regions':regions,'hair':[],'accessories':[],
                'provenance':{'artwork':'Unchanged original Mirea source','annotations':'AI-assisted measured contours','materials':'Python extraction of original RGBA pixels; no generated artwork'},
                'unsupportedMotions':['Layered blink needs clean face/eye bed and half/closed artwork','Mouth switching needs clean mouth bed and vowel artwork']}
    helper.annotated_analysis(analysis,info)
    output.mkdir(parents=True)
    helper.save_json(output/'request.json',request)
    helper.save_json(output/'character-analysis.json',analysis)
    helper.extract(source,output/'character-analysis.json',output/'prepared')
    manifest = json.loads((output/'prepared/parts-manifest.json').read_text())
    entries = {part['id']:part for part in manifest['parts']}
    validation = []
    pixels = original.load()
    for name, entry in entries.items():
        with Image.open(output/'prepared'/entry['fullCanvas']) as part:
            part = part.convert('RGBA'); data = part.load(); count = 0
            for y in range(height):
                for x in range(width):
                    value = data[x,y]
                    if value[3]:
                        if value != pixels[x,y]: raise ValueError('Modified source pixel in '+name)
                        count += 1
                    elif value != (0,0,0,0): raise ValueError('Invisible RGB contamination in '+name)
        if not count: raise ValueError('Empty extract: '+name)
        validation.append({'id':name,'visiblePixels':count,'sourcePixelsPreserved':True,'outsideMaskCleared':True,
                           'boundsPixels':entry['boundsPixels'], 'sha256':hashlib.sha256((output/'prepared'/entry['fullCanvas']).read_bytes()).hexdigest()})
    resolutions = []
    for item in request['items']:
        result = dict(item)
        name = item['id']
        available = []
        if name.endswith('-eyeball'):
            side = item['partId'].split('-')[-1]
            available = ['eye-'+side+'-open','eye-'+side+'-sclera-visible','eye-'+side+'-iris-visible','eye-'+side+'-eyelid-line']
            result.update(status='extracted-partial', reason='Visible open eye, iris, line and sclera extracted. Sclera behind the iris and a clean face bed are not in the source.', nextAction='provide-artwork', required=False)
        elif name.endswith('-eyelid-skin'):
            side = item['partId'].split('-')[-1]; available = ['eye-'+side+'-skin-visible']
            result.update(status='extracted-partial', reason='Adjacent visible skin only. This is not a complete eyelid background or an eye-free face bed.', nextAction='provide-artwork', required=False)
        elif name == 'mouth-closed':
            available = ['mouth-closed']; result.update(status='extracted', reason='Original closed-mouth smile extracted. Binding requires a clean base; this does not include vowel variants.', nextAction=None, required=False)
        else:
            result.update(status='absent-in-source', reason='Requested expression is not present in the inspected original image; extraction cannot create it.', nextAction='provide-artwork', required=False)
        result['assets'] = [{'id':asset_id,'fullCanvas':'prepared/'+entries[asset_id]['fullCanvas'],
                              'cropped':'prepared/'+entries[asset_id]['cropped'],'mask':'prepared/'+entries[asset_id]['mask'],
                              'boundsPixels':entries[asset_id]['boundsPixels'],'coverage':'visible-only'} for asset_id in available]
        result['bound'] = False; result['readyForLayeredPlayback'] = False
        resolutions.append(result)
    helper.save_json(output/'material-resolution.json',{'version':1,'producer':'agent-python','sourceSha256':info['sha256'],
        'requestedModelFingerprint':request['modelFingerprint'],'requestedAssetFingerprint':request['assetFingerprint'],
        'items':resolutions,'extractedTextureCount':len(entries),'bindingPerformed':False})
    helper.save_json(output/'missing-assets.json',{**request,'producer':'python','items':[r for r in resolutions if r['status']!='extracted']})
    helper.save_json(output/'verification.json',{'version':1,'sourceSha256':info['sha256'],'sourceUnchanged':hashlib.sha256(source.read_bytes()).hexdigest()==info['sha256'],
        'partsExtracted':True,'modelValidation':'not-run','visualAcceptance':'pending','checks':validation})
    sheet = Image.new('RGB',(1000,3*245),'#edf4f9'); draw = ImageDraw.Draw(sheet)
    for i,(name,entry) in enumerate(entries.items()):
        x,y = (i%4)*250,(i//4)*245
        with Image.open(output/'prepared'/entry['cropped']) as crop:
            crop=crop.convert('RGBA'); scale=min(6,220/crop.width,150/crop.height)
            crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.NEAREST)
            sheet.paste(crop,(x+(250-crop.width)//2,y+35+(150-crop.height)//2),crop)
        draw.text((x+10,y+10),name,fill='#183b50')
        draw.text((x+10,y+195),str(entry['boundsPixels'])+' source px',fill='#587284')
        draw.text((x+10,y+213),'Visible source only / unbound',fill='#587284')
    sheet.save(output/'contact-sheet.png')
    print(json.dumps({'out':str(output),'parts':len(entries),'extractedRequests':sum(r['status']=='extracted' for r in resolutions),
                      'partialRequests':sum(r['status']=='extracted-partial' for r in resolutions),'absentRequests':sum(r['status']=='absent-in-source' for r in resolutions)},ensure_ascii=False))


if __name__ == '__main__': main()
