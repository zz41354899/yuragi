import importlib.util
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('build_layers',ROOT/'skills/yuragi-rig-spec/scripts/build_layers.py')
helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)

class LayerCompilerTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        source=Image.new('RGBA',(32,32),(200,100,50,180));source.save(self.root/'source.png')
        source.crop((0,0,16,32)).save(self.root/'left.png');source.crop((16,0,32,32)).save(self.root/'right.png')
        self.manifest={'version':2,'renderer':'layered-authoring','id':'fixture','name':'Fixture',
            'source':{'file':'source.png','size':[32,32],'sha256':hashlib.sha256((self.root/'source.png').read_bytes()).hexdigest()},
            'nodes':[{'id':'root','pivot':[.5,.5],'rotation':.1,'translation':[0,0],'response':100}],
            'attachments':[{'id':'left','image':'left.png','boundsPixels':[0,0,16,32],'node':'root','coverage':'complete','provenance':'Synthetic fixture'},
                           {'id':'right','image':'right.png','boundsPixels':[16,0,32,32],'node':'root','coverage':'complete','provenance':'Synthetic fixture'}]}
    def tearDown(self): self.temp.cleanup()
    def build(self,**kwargs):
        path=self.root/'manifest.json';path.write_text(json.dumps(self.manifest))
        return helper.compile_layers(path,self.root/'output',ROOT/'packages/rig',atlas_size=128,**kwargs)
    def test_roundtrip_dimensions_gutters_and_runtime_validation(self):
        report=self.build();self.assertEqual(report['modelValidation'],'passed');self.assertEqual(report['neutralMaxChannelError'],0)
        model=json.loads((self.root/'output/model.json').read_text());atlas=Image.open(self.root/'output/atlas-0.png')
        for entry in model['attachments']:
            x,y,w,h=entry['rect'];self.assertEqual(atlas.getpixel((x-2,y)),atlas.getpixel((x,y)))
        self.assertEqual(len(model['attachments']),2)
        with self.assertRaises(ValueError): self.build()
    def test_requires_explicit_coverage_and_fingerprint(self):
        self.manifest['attachments'][0]['coverage']='visible-only'
        with self.assertRaises(ValueError): self.build()
        self.assertTrue(self.build(allow_visible_only=True)['prototype'])
    def test_mismatch_and_invalid_topology_leave_no_output(self):
        self.manifest['source']['sha256']='0'*64
        with self.assertRaises(ValueError): self.build()
        self.assertFalse((self.root/'output').exists())
    def test_invalid_runtime_model_is_not_published(self):
        self.manifest['nodes'][0]['rotation']=float('inf')
        with self.assertRaises(ValueError): self.build()
        self.assertFalse((self.root/'output').exists())
    def test_sparse_pruning_uses_an_error_budget(self):
        nodes={str(i):{'rotation':.2,'translation':[0,0]} for i in range(5)}
        weights=[{'node':str(i),'weight':.2}for i in range(5)]
        with self.assertRaises(ValueError): helper.sparse(weights,nodes,1000,1000,.25)
        weights=[{'node':str(i),'weight':.24999975 if i<4 else .000001}for i in range(5)]
        result,bound=helper.sparse(weights,nodes,1000,1000,.25)
        self.assertEqual(len(result),4);self.assertAlmostEqual(sum(w['weight']for w in result),1);self.assertLess(bound,.25)
    def test_sampled_folding_is_rejected_before_output(self):
        self.manifest['nodes'].append({'id':'tip','parent':'root','pivot':[.25,.5],'rotation':3.1,'translation':[0,0],'response':10})
        entry=self.manifest['attachments'][0]
        entry['vertices']=[{'position':position,'weights':[{'node':'root' if i<2 else 'tip','weight':1}]} for i,position in enumerate([[0,0],[.5,0],[0,1],[.5,1]])]
        entry['triangles']=[0,2,1,1,2,3]
        with self.assertRaises(helper.subprocess.CalledProcessError): self.build()
        self.assertFalse((self.root/'output').exists())
    def test_masks_are_alpha_not_rgb_and_require_matching_size(self):
        mask=Image.new('RGBA',(16,32),(255,255,255,0));mask.save(self.root/'mask.png')
        self.manifest['attachments'][0]['mask']='mask.png'
        self.assertGreater(self.build()['neutralMaxChannelError'],0)

if __name__=='__main__': unittest.main()
