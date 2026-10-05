"""Generate geometric test pixels, not character completion artwork."""
import sys,json,hashlib,importlib.util
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
root=Path(sys.argv[1]).resolve();root.mkdir(parents=True,exist_ok=True)
source=Image.new('RGBA',(64,64));attachments=[];eyes=[]
def add(id,box,draw,neutral=True):
    image=Image.new('RGBA',(box[2]-box[0],box[3]-box[1]));draw(ImageDraw.Draw(image));image.save(root/(id+'.png'))
    attachments.append({'id':id,'image':id+'.png','boundsPixels':box,'node':'head','coverage':'complete','provenance':'geometric regression fixture','mesh':[2,2]})
    if neutral: source.alpha_composite(image,(box[0],box[1]))
add('skin',[0,0,64,64],lambda d:d.rectangle([4,4,60,60],fill=(240,200,150,255)))
for side,x in [('left',12),('right',38)]:
    box=[x,18,x+14,30];ids={k:side+'-'+k for k in ['ball','iris','line','half','closed']}
    add(ids['ball'],box,lambda d:d.ellipse([0,0,13,11],fill='white'))
    add(ids['iris'],box,lambda d:d.ellipse([4,2,9,9],fill=(0,80,200,255)))
    add(ids['line'],box,lambda d:d.arc([0,0,13,11],180,360,fill='black',width=1))
    add(ids['half'],box,lambda d:d.rectangle([0,6,13,7],fill=(0,80,200,255)),False)
    add(ids['closed'],box,lambda d:d.line([0,6,13,6],fill='black',width=2),False)
    eyes.append({'side':side,'node':'head','ball':ids['ball'],'iris':ids['iris'],'lines':[ids['line']],'half':ids['half'],'closed':ids['closed'],'top':[[x/64,18/64],[(x+14)/64,18/64]],'bottom':[[x/64,30/64],[(x+14)/64,30/64]],'travel':[.03,.02]})
shapes={}
for i,k in enumerate(['closed','a','i','u','e','o']):
    shapes[k]='mouth-'+k
    def mouth(d,k=k,i=i):
        if k=='closed':d.line([1,6,15,6],fill=(120,0,40,255),width=2)
        else:d.ellipse([2+i%3,2,14-i%3,10],fill=(120+i*15,0,40,255))
    add(shapes[k],[24,40,40,52],mouth,k=='closed')
source.save(root/'source.png')
manifest={'version':2,'renderer':'layered-authoring','id':'face-fixture','name':'Geometric face fixture','source':{'file':'source.png','size':[64,64],'sha256':hashlib.sha256((root/'source.png').read_bytes()).hexdigest()},'nodes':[{'id':'head','pivot':[.5,.5],'rotation':.1,'translation':[.02,.01],'response':100}],'attachments':attachments,'face':{'eyes':eyes,'mouth':{'node':'head','shapes':shapes}}}
(root/'manifest.json').write_text(json.dumps(manifest))
spec=importlib.util.spec_from_file_location('layers',ROOT/'skills/yuragi-rig-spec/scripts/build_layers.py');helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
print(helper.compile_layers(root/'manifest.json',root/'compiled',ROOT/'packages/rig',atlas_size=256))
