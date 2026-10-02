import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image, ImageDraw

SCRIPT = Path(__file__).resolve().parents[2] / 'skills/yuragi-rig-spec/scripts/prepare_character.py'
spec = importlib.util.spec_from_file_location('prepare_character', SCRIPT)
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)

class PrepareCharacterTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.image = self.root/'artwork.png'
        self.make_image(self.image, (200, 400), (40, 20, 160, 380))
    def tearDown(self):
        self.temp.cleanup()
    def make_image(self, path, size, box):
        image = Image.new('RGBA', size)
        ImageDraw.Draw(image).rectangle(box, fill=(20,120,180,255))
        image.save(path)
    def analysis(self):
        _, info = helper.read_image(self.image)
        return {'version':1, 'id':'test-character', 'name':'Test Character', 'mode':'humanoid',
                'image':{key:info[key] for key in ['sha256','width','height']}, 'confidence':.9,
                'evidence':'Measured synthetic fixture for coordinate and export tests.',
                'headBounds':[.35,.1,.65,.3], 'landmarks':{'waist':[.5,.6],'head-root':[.5,.29],'head-top':[.5,.12],
                'shoulder-right':[.65,.35],'elbow-right':[.75,.4],'wrist-right':[.8,.5]},
                'waveSafe':True, 'regions':[{'id':'head','polygon':[[.35,.1],[.65,.1],[.65,.3],[.35,.3]]}],
                'hair':[], 'accessories':[]}
    def save_analysis(self, analysis):
        path = self.root/'analysis.json'; helper.save_json(path, analysis); return path
    def test_silhouette_uses_actual_canvas_and_changes_with_artwork_geometry(self):
        info = helper.inspect(self.image,self.root/'inspect')
        self.assertEqual(info['visibleBoundsPixels'],[40,20,161,381])
        report = helper.build(self.image,None,self.root/'build')
        self.assertEqual(report['controls'],{'idle':True,'follow':False,'wave':False})
        model=json.loads((self.root/'build/model.json').read_text())
        self.assertEqual(model['texture']['width'],200)
        self.assertAlmostEqual(model['pins'][0]['x'],.5025,places=2)
        wide=self.root/'wide.png'; self.make_image(wide,(500,120),(10,10,210,110))
        helper.build(wide,None,self.root/'wide-build')
        other=json.loads((self.root/'wide-build/model.json').read_text())
        self.assertLess(other['pins'][0]['x'],.25)
        self.assertGreater(other['mesh']['columns'],other['mesh']['rows'])
        self.assertNotEqual(model['pose']['swayPivot'],other['pose']['swayPivot'])
    def test_reviewed_humanoid_generates_measured_pose_and_visible_parts(self):
        analysis=self.analysis(); report=helper.build(self.image,self.save_analysis(analysis),self.root/'build')
        self.assertTrue(report['controls']['follow']); self.assertTrue(report['controls']['wave'])
        model=json.loads((self.root/'build/model.json').read_text())
        self.assertEqual(model['pose']['headWarpBounds'],[.1,.3])
        self.assertEqual(model['pins'][1]['name'],'head-root')
        self.assertEqual(model['pins'][1]['y'],.29)
        part=Image.open(self.root/'build/parts/head.png').convert('RGBA')
        self.assertEqual(part.size,(200,400))
        self.assertEqual(part.getpixel((100,80)),(20,120,180,255))
        self.assertEqual(part.getpixel((100,250))[3],0)
        original=Image.open(self.image).convert('RGBA')
        output=Image.open(self.root/'build/texture.png').convert('RGBA')
        self.assertEqual(original.tobytes(),output.tobytes())
    def test_stale_provenance_and_uncertain_anatomy_are_rejected_before_outputs(self):
        for patch in [{'image':{'sha256':'wrong','width':200,'height':400}}, {'confidence':.4}, {'headBounds':[.5,.2,.1,.4]}]:
            with self.subTest(patch=patch):
                analysis=self.analysis(); analysis.update(patch)
                with self.assertRaises(ValueError):helper.build(self.image,self.save_analysis(analysis),self.root/'invalid')
                self.assertFalse((self.root/'invalid').exists())
    def test_wave_and_unsafe_regions_require_valid_reviewed_annotations(self):
        analysis=self.analysis(); del analysis['landmarks']['elbow-right']
        with self.assertRaisesRegex(ValueError,'waveSafe'):helper.build(self.image,self.save_analysis(analysis),self.root/'invalid')
        analysis=self.analysis(); analysis['regions'][0]['id']='../../outside'
        with self.assertRaisesRegex(ValueError,'region id'):helper.build(self.image,self.save_analysis(analysis),self.root/'invalid')
        self.assertFalse((self.root/'invalid').exists())
    def test_empty_images_and_nonfinite_coordinates_fail(self):
        empty=self.root/'empty.png';Image.new('RGBA',(100,100)).save(empty)
        with self.assertRaisesRegex(ValueError,'visible pixels'):helper.inspect(empty,self.root/'inspect')
        analysis=self.analysis();analysis['landmarks']['waist'][0]=float('inf')
        _,info=helper.read_image(self.image)
        with self.assertRaisesRegex(ValueError,'finite'):helper.annotated_analysis(analysis,info)
    def test_output_reuse_is_refused_and_opaque_background_is_disclosed(self):
        helper.build(self.image,None,self.root/'build')
        with self.assertRaisesRegex(ValueError,'new or empty'):helper.build(self.image,None,self.root/'build')
        opaque=self.root/'opaque.png';Image.new('RGB',(100,100),'blue').save(opaque)
        report=helper.build(opaque,None,self.root/'opaque-build')
        self.assertTrue(any('background will deform' in warning for warning in report['warnings']))
        self.assertFalse(report['runtimeReady'])

if __name__=='__main__':unittest.main()
