"""Pack imagegen art into measured source slots for local face preview.
Artwork comes from imagegen, not procedural facial drawing. Python performs
the user-authorized cropping, size normalization, masks and packaging only.
"""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
SOURCE = ROOT/'packages/rig/assets/mirea/texture.png'
EXTRACTED = ROOT/'artifacts/mirea-face-extraction-20261004/extracted-v1/prepared/parts/cropped'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(SOURCE) == '6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05'
author = OUT/'authoring'
author.mkdir(exist_ok=True)
(author/'parts').mkdir(exist_ok=True)
shutil.copy2(SOURCE, author/'source.png')
original = Image.open(SOURCE).convert('RGBA')
generated_bed = Image.open(OUT/'generated/face-clean-bed.png').convert('RGBA').resize((145,100),Image.Resampling.LANCZOS)
bed = original.copy()
patches = {
 'eye-left-eyelid-skin': [(513,257),(516,248),(523,242),(545,241),(558,249),(560,265),(552,277),(528,279),(515,272)],
 'eye-right-eyelid-skin': [(575,235),(580,225),(594,221),(612,222),(622,229),(621,248),(615,257),(591,259),(580,253)],
 'mouth-skin': [(564,287),(571,282),(590,277),(598,280),(598,292),(582,299),(567,298),(563,293)]
}
assets = []
def save(id, image, bounds, provenance, generated=None):
 image.save(author/'parts'/f'{id}.png')
 record={'id':id,'image':f'parts/{id}.png','boundsPixels':bounds,'node':'head','coverage':'complete','provenance':provenance,'mesh':[4,4]}
 assets.append(record)
 if generated: record['generationSource']=generated
 return record

for id, polygon in patches.items():
 mask=Image.new('L',original.size);ImageDraw.Draw(mask).polygon(polygon,fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(.8))
 patch=Image.new('RGBA',original.size);patch.paste(generated_bed,(500,210))
 # Keep supplied alpha when producing a feathered local repair.
 patch.putalpha(ImageChops.multiply(patch.getchannel('A'),mask))
 bed=Image.alpha_composite(bed,patch)
 box=patch.getchannel('A').getbbox()
 save(id,patch.crop(box),list(box),'AI-completed clean skin from original face reference; measured local feathered patch','generated/face-clean-bed.png')
bed.save(author/'clean-base.png')
bed_record={'id':'clean-base','image':'clean-base.png','boundsPixels':[0,0,1024,1536],'node':'head','coverage':'complete','provenance':'Original Mirea with AI-completed local eye/mouth skin patches; source retained separately','mesh':[1,1]}

slots={
 'eye-left-eyeball':[519,251,554,270], 'eye-right-eyeball':[581,229,614,250],
 'eye-left-iris':[527,247,548,269], 'eye-right-iris':[589,226,608,250],
 'eye-left-half':[511,240,560,280], 'eye-right-half':[574,219,623,259],
 'eye-left-closed':[511,245,560,276], 'eye-right-closed':[574,224,623,255],
 'mouth-open':[564,279,596,296],
}
for id, box in slots.items():
 path=OUT/'generated'/f'{id}.png';image=Image.open(path).convert('RGBA')
 # Crop only transparent margins. Preserve generated alpha and keep originals.
 trim=image.getchannel('A').point(lambda a:255 if a>=3 else 0).getbbox()
 assert trim and image.getchannel('A').getextrema()[0]==0
 image=image.crop(trim).resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS)
 save(id,image,box,'AI-completed Mirea facial artwork; normalized to reviewed source slot',f'generated/{id}.png')

for id,box in {'eye-left-eyelid-line':[515,246,557,264],'eye-right-eyelid-line':[578,225,619,240],'mouth-closed':[566,281,594,294]}.items():
 save(id,Image.open(EXTRACTED/f'{id}.png').convert('RGBA'),box,'Visible original pixels, extracted with reviewed source mask')

def curve(xs,ys):return [[x/1024,y/1536] for x,y in zip(xs,ys)]
eyes=[]
for side,xs,top,bottom in [
 ('left',[519,525,534,542,550,554],[262,255,251,252,254,258],[262,267,270,269,264,258]),
 ('right',[581,586,595,603,610,614],[237,232,229,230,232,237],[237,246,249,248,244,237])]:
 eyes.append({'side':side,'node':'head','ball':f'eye-{side}-eyeball','iris':f'eye-{side}-iris','lines':[f'eye-{side}-eyelid-line'],'half':f'eye-{side}-half','closed':f'eye-{side}-closed','top':curve(xs,top),'bottom':curve(xs,bottom),'travel':[.002,.001]})
# The skin repairs are already composited into the base; avoid drawing twice.
runtime_assets=[bed_record]+[a for a in assets if a['id'] not in patches]
manifest={'version':2,'renderer':'layered-authoring','id':'mirea-face-natural','name':'Mirea · 自然眼嘴素材預覽','source':{'file':'source.png','size':[1024,1536],'sha256':sha(SOURCE)},'nodes':[{'id':'head','pivot':[.555,.175],'rotation':0,'translation':[0,0],'response':100}],'attachments':runtime_assets,'face':{'eyes':eyes,'mouth':{'node':'head','shapes':{'closed':'mouth-closed','open':'mouth-open'},'axis':[[567/1024,290/1536],[593/1024,282/1536]]}}}
(author/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
for a in assets+[bed_record]: a['sha256']=sha(author/a['image'])
(OUT/'materials.json').write_text(json.dumps({'version':1,'sourceSha256':sha(SOURCE),'mode':'natural-open-close','coordinateSpace':'full-source-pixels','assets':assets+[bed_record],'notRequested':['mouth-a','mouth-i','mouth-u','mouth-e','mouth-o'],'visualAcceptance':'pending','scope':'Face artwork preview; existing full-character rig retained separately'},ensure_ascii=False,indent=2)+'\n')
# Enlarged contact sheet with source placement noted.
sheet=Image.new('RGB',(1000,((len(assets)+3)//4)*220),(237,244,249));draw=ImageDraw.Draw(sheet)
for i,a in enumerate(assets):
 x=(i%4)*250;y=(i//4)*220;image=Image.open(author/a['image']).convert('RGBA')
 image.thumbnail((220,160),Image.Resampling.NEAREST)
 if image.width<180 and image.height<140:
  factor=min(6,220/image.width,145/image.height);image=image.resize((round(image.width*factor),round(image.height*factor)),Image.Resampling.NEAREST)
 sheet.paste(image,(x+(250-image.width)//2,y+30+(150-image.height)//2),image)
 draw.text((x+8,y+6),a['id'],fill=(30,70,100));draw.text((x+8,y+190),str(a['boundsPixels'])+' px',fill=(80,110,135))
sheet.save(OUT/'contact-sheet.png')
print(json.dumps({'assets':len(assets)+1,'manifest':str(author/'manifest.json'),'sourceUnchanged':sha(SOURCE)==manifest['source']['sha256']}))
