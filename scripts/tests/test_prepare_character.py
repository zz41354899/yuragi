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

    def test_fine_parts_export_coordinates_hierarchy_and_runtime_ownership(self):
        analysis=self.analysis();analysis['waveSafe']=False
        analysis['regions']=[
            {'id':'arm','role':'arm','polygon':[[.3,.3],[.7,.3],[.7,.6],[.3,.6]],
             'binding':{'mode':'weighted','pins':['shoulder-right','elbow-right','wrist-right'],'feather':.04,'secondary':False}},
            {'id':'umbrella','role':'prop','parent':'arm','polygon':[[.3,.1],[.6,.1],[.6,.3],[.3,.3]],
             'binding':{'mode':'rigid','anchor':'wrist-right','rotation':'body','feather':.08}},
            {'id':'strand','role':'hair','parent':'arm','polygon':[[.3,.35],[.4,.35],[.4,.7],[.3,.7]],
             'root':[.35,.35],'tip':[.35,.7],'chain':[[.35,.35],[.35,.5],[.35,.7]],
             'deformation':{'feather':.02,'rotation':.02,'stiffness':.04,'damping':.94,'phase':0,'wind':1,'follow':1}},
        ]
        report=helper.build(self.image,self.save_analysis(analysis),self.root/'fine')
        self.assertEqual(report['emptyParts'],[])
        model=json.loads((self.root/'fine/model.json').read_text())
        self.assertEqual(model['surfaceRegions'][1]['anchor'],'wrist-right')
        self.assertEqual(model['parts'][0]['root'],[.35,.35])
        manifest=json.loads((self.root/'fine/parts-manifest.json').read_text())
        entry=manifest['parts'][2]
        self.assertEqual(entry['parent'],'arm');self.assertEqual(entry['coverage'],'visible-only')
        self.assertEqual([p['type'] for p in entry['anchors']],['fixed','spring','spring'])
        full=Image.open(self.root/'fine'/entry['fullCanvas']).convert('RGBA')
        crop=Image.open(self.root/'fine'/entry['cropped']).convert('RGBA')
        box=entry['boundsPixels'];self.assertEqual(crop.tobytes(),full.crop(box).tobytes())
        original=Image.open(self.image).convert('RGBA')
        for y in range(box[1],box[3]):
            for x in range(box[0],box[2]):
                if full.getpixel((x,y))[3]:self.assertEqual(full.getpixel((x,y)),original.getpixel((x,y)))
        self.assertEqual(full.getpixel((150,350)),(0,0,0,0))
        analysis['regions'][2]['subtract']=['arm']
        helper.build(self.image,self.save_analysis(analysis),self.root/'excluded')
        clean=Image.open(self.root/'excluded/parts/strand.png').convert('RGBA')
        self.assertEqual(clean.getpixel((70,180))[3],0)
        self.assertEqual(clean.getpixel((70,265))[3],255)
        excluded_model=json.loads((self.root/'excluded/model.json').read_text())
        self.assertEqual(excluded_model['parts'][0]['exclusions'],[analysis['regions'][0]['polygon']])
    def test_invalid_ownership_and_held_prop_wave_fail_before_output(self):
        prop={'id':'umbrella','role':'prop','polygon':[[.3,.1],[.6,.1],[.6,.3],[.3,.3]],
              'binding':{'mode':'rigid','anchor':'wrist-right','feather':.04}}
        for patch in [prop,{**prop,'binding':{'mode':'rigid','anchor':'absent','feather':.04}},
                      {**prop,'binding':{'mode':'weighted','pins':['wrist-right'],'feather':.04}},
                      {**prop,'parent':'umbrella'},
                      {**prop,'polygon':[[.2,.2],[.7,.7],[.2,.7],[.7,.2]]}]:
            analysis=self.analysis();analysis['regions']=[patch]
            if patch!=prop:analysis['waveSafe']=False
            with self.assertRaises(ValueError):helper.build(self.image,self.save_analysis(analysis),self.root/'invalid')
            self.assertFalse((self.root/'invalid').exists())

    def test_head_neck_pose_and_fine_anatomy_export_without_erasing_bangs(self):
        a=self.analysis(); a['waveSafe']=False; a['landmarks']['neck-base']=[.5,.36]
        a['regions'][0]['role']='head'
        a['regions'] += [
            {'id':'neck','role':'neck','parent':'head','polygon':[[.45,.28],[.55,.28],[.55,.36],[.45,.36]]},
            {'id':'bang','role':'bangs','parent':'head','root':[.4,.12],'tip':[.4,.23],
             'polygon':[[.36,.11],[.44,.11],[.44,.24],[.36,.24]],
             'deformation':{'feather':.02,'rotation':.015,'stiffness':.04,'damping':.9,'phase':0,'wind':.5,'follow':.5}},
            *[{'id':role,'role':role,'polygon':[[.3,.5],[.4,.5],[.4,.6],[.3,.6]]} for role in ['face','thigh','knee','shin','ankle','toe','heel']],
        ]
        a['headMotion']={'head':'head','neck':'neck','base':'neck-base','feather':.06,'neckFeather':.025,
                         'rotation':.06,'translation':[.009,.004],'bodyFollow':0}
        helper.build(self.image,self.save_analysis(a),self.root/'fine')
        model=json.loads((self.root/'fine/model.json').read_text())
        self.assertEqual(model['pose']['headFollow']['region'],a['regions'][0]['polygon'])
        self.assertEqual(model['pose']['headFollow']['neck']['base'],[.5,.36])
        self.assertEqual(model['tracking']['bodyFollow'],0)
        self.assertEqual(model['parts'][0]['kind'],'hair')
        self.assertIsNotNone(Image.open(self.root/'fine/parts/bang.png').getbbox())
        # Invalid endpoints and unreviewed head/neck references must fail before writing output.
        for patch in [{'base':'head-root'},{'neck':'bang'},{'translation':[.2,0]},{'bodyFollow':2}]:
            candidate={**a,'headMotion':{**a['headMotion'],**patch}}
            with self.assertRaises(ValueError):helper.build(self.image,self.save_analysis(candidate),self.root/'bad-neck')
            self.assertFalse((self.root/'bad-neck').exists())

    def test_reviewed_face_features_export_and_reject_unsafe_pupil_travel(self):
        a=self.analysis();a['waveSafe']=False;a['regions'][0]['role']='head'
        a['landmarks']['neck-base']=[.5,.36]
        a['regions'].append({'id':'neck','role':'neck','polygon':[[.45,.28],[.55,.28],[.55,.36],[.45,.36]]})
        a['headMotion']={'head':'head','neck':'neck','base':'neck-base','feather':.06,'neckFeather':.025,'rotation':.02,'translation':[.003,.002],'bodyFollow':0}
        a['face']={'eyes':[{'id':side,'center':[x,.2],'radius':[.025,.015],'iris':[x,.2],'irisRadius':[.01,.006],'travel':[.003,.002],'angle':-.2,'sclera':[.98,.95,.96]} for side,x in [('left',.45),('right',.55)]]}
        helper.build(self.image,self.save_analysis(a),self.root/'facial')
        model=json.loads((self.root/'facial/model.json').read_text())
        self.assertEqual(model['face'],a['face'])
        self.assertFalse((self.root/'facial/preview.html').exists())
        self.assertEqual(json.loads((self.root/'facial/build-report.json').read_text())['modelValidation'],'not-run')
        for field,value in [('travel',[.03,.002]),('iris',[.9,.2]),('id','right')]:
            candidate=json.loads(json.dumps(a));candidate['face']['eyes'][0][field]=value
            with self.assertRaises(ValueError):helper.build(self.image,self.save_analysis(candidate),self.root/'unsafe-face')
            self.assertFalse((self.root/'unsafe-face').exists())

    def test_pointer_float_and_vertical_flow_export_and_preflight(self):
        a=self.analysis()
        a['tracking']={'response':.065,'damping':.7,'maxVelocity':3,'bodyFollow':0,'translation':[.028,.016]}
        a['regions']=[{'id':'ribbon','role':'ribbon','polygon':[[.3,.4],[.4,.4],[.4,.8],[.3,.8]],
                       'root':[.35,.4],'tip':[.35,.8],
                       'deformation':{'feather':.02,'rotation':.04,'stiffness':.013,'damping':.96,'phase':0,'wind':1,'follow':1,'followY':-.65}}]
        helper.build(self.image,self.save_analysis(a),self.root/'float')
        model=json.loads((self.root/'float/model.json').read_text())
        self.assertEqual(model['tracking'],a['tracking'])
        self.assertEqual(model['parts'][0]['followY'],-.65)
        for patch in [{'translation':[.081,0]},{'translation':[-.01,0]},{'response':0},{'unknown':1}]:
            candidate={**a,'tracking':{**a['tracking'],**patch}}
            with self.assertRaises(ValueError):helper.build(self.image,self.save_analysis(candidate),self.root/'bad-float')
            self.assertFalse((self.root/'bad-float').exists())
        a['regions'][0]['deformation']['followY']=float('inf')
        with self.assertRaises(ValueError):helper.build(self.image,self.save_analysis(a),self.root/'bad-float')

    def test_staged_extract_build_validates_real_runtime_and_prepared_hashes(self):
        a=self.analysis();a['waveSafe']=False
        a['pointerGroups']=[{'id':'upper-follow','pivot':[.5,.3],'translation':[.01,-.01],'rotation':.02,'response':105,
            'regions':[{'polygon':[[.3,.1],[.7,.1],[.7,.4],[.3,.4]],'feather':.02}]}]
        analysis=self.save_analysis(a);prepared=self.root/'prepared'
        helper.extract(self.image,analysis,prepared)
        self.assertFalse((prepared/'model.json').exists());self.assertFalse((prepared/'preview.html').exists())
        runtime=SCRIPT.parents[3]/'packages/rig'
        report=helper.build(self.image,analysis,self.root/'validated',runtime,prepared)
        self.assertEqual(report['modelValidation'],'passed');self.assertTrue(report['runtimeReady'])
        self.assertEqual(report['visualAcceptance'],'not-run')
        self.assertTrue((self.root/'validated/preview.html').exists())
        model=json.loads((self.root/'validated/model.json').read_text())
        self.assertEqual(model['pointerGroups'],a['pointerGroups'])
        preview=(self.root/'validated/preview.html').read_text()
        self.assertIn('setGazeStrength',preview);self.assertNotIn('setExpression',preview);self.assertNotIn('player.blink',preview)
        a['evidence']='revised review'
        with self.assertRaisesRegex(ValueError,'fingerprint'):helper.build(self.image,self.save_analysis(a),self.root/'stale',runtime,prepared)
        self.assertFalse((self.root/'stale').exists())
        a['evidence']='Measured synthetic fixture for coordinate and export tests.';analysis=self.save_analysis(a)
        Image.new('L',(200,400),0).save(prepared/'parts/masks/head.png')
        with self.assertRaisesRegex(ValueError,'fingerprint'):helper.build(self.image,analysis,self.root/'tampered',runtime,prepared)
        self.assertFalse((self.root/'tampered').exists())

    def test_extract_rejects_empty_masks_transactionally_and_records_supplements(self):
        a=self.analysis();a['waveSafe']=False
        a['regions'][0]['polygon']=[[0,0],[.05,0],[.05,.02],[0,.02]]
        with self.assertRaisesRegex(ValueError,'Empty visible mask'):helper.extract(self.image,self.save_analysis(a),self.root/'empty-parts')
        self.assertFalse((self.root/'empty-parts').exists())
        a=self.analysis();Image.new('RGBA',(20,30),'red').save(self.root/'completed.png')
        supplemental=self.root/'completed.json'
        helper.save_json(supplemental,[{'id':'head','image':'completed.png','positionPixels':[20,30],'source':'Test artist revision 2','completeness':'completed'}])
        helper.extract(self.image,self.save_analysis(a),self.root/'with-supplement',supplemental)
        manifest=json.loads((self.root/'with-supplement/parts-manifest.json').read_text())
        self.assertFalse(manifest['supplements'][0]['runtimeUsed']);self.assertEqual(manifest['supplements'][0]['positionPixels'],[20,30])
        self.assertIn('supplements/head.png',manifest['assets'])
        helper.save_json(supplemental,[{'id':'head','image':'completed.png','positionPixels':[195,390],'source':'Test artist','completeness':'partial'}])
        with self.assertRaisesRegex(ValueError,'leaves source'):helper.extract(self.image,self.save_analysis(a),self.root/'bad-supplement',supplemental)
        self.assertFalse((self.root/'bad-supplement').exists())

    def test_runtime_rejection_and_cli_missing_stage_never_deliver_preview(self):
        a=self.analysis();a['waveSafe']=False;prepared=self.root/'prepared'
        helper.extract(self.image,self.save_analysis(a),prepared)
        fake=self.root/'runtime';(fake/'dist').mkdir(parents=True)
        helper.save_json(fake/'package.json',{'name':'@z7589xxz758/yuragi','version':'0.2.0','type':'module'})
        (fake/'dist/index.js').write_text("export function validateModel(){throw new Error('fixture rejected')}\n")
        with self.assertRaisesRegex(ValueError,'fixture rejected'):helper.build(self.image,None,self.root/'rejected',fake,prepared)
        self.assertFalse((self.root/'rejected').exists())
        with self.assertRaises(SystemExit):helper.main(['build',str(self.image),'--out',str(self.root/'missing-stage')])
        self.assertFalse((self.root/'missing-stage').exists())

    def test_legacy_face_requires_explicit_migration_and_inspection_is_transactional(self):
        a=self.analysis();a['waveSafe']=False;a['regions'][0]['role']='head'
        a['landmarks']['neck-base']=[.5,.36]
        a['regions'].append({'id':'neck','role':'neck','polygon':[[.45,.28],[.55,.28],[.55,.36],[.45,.36]]})
        a['headMotion']={'head':'head','neck':'neck','base':'neck-base','feather':.06,'neckFeather':.025,'rotation':.02,'translation':[.003,.002]}
        a['face']={'mode':'gaze','eyes':[]}
        with self.assertRaisesRegex(ValueError,'migrate_gaze'):helper.extract(self.image,self.save_analysis(a),self.root/'legacy-face')
        self.assertFalse((self.root/'legacy-face').exists())
        helper.inspect(self.image,self.root/'inspect')
        with self.assertRaisesRegex(ValueError,'new or empty'):helper.inspect(self.image,self.root/'inspect')

    def test_pointer_groups_and_legacy_face_input_fail_before_export(self):
        for groups in [[{'id':'bad'}],[{'id':'bad','pivot':[.5,.3],'translation':[.04,0],'rotation':0,'response':100,'regions':[]}]]:
            a=self.analysis();a['pointerGroups']=groups
            with self.assertRaises(ValueError):helper.extract(self.image,self.save_analysis(a),self.root/'bad-group')
            self.assertFalse((self.root/'bad-group').exists())

if __name__=='__main__':unittest.main()
