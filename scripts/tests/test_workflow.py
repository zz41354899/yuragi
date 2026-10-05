import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('workflow', ROOT/'skills/yuragi-rig-spec/scripts/workflow.py')
workflow = importlib.util.module_from_spec(spec)
spec.loader.exec_module(workflow)


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.source = self.root/'source.png'
        image = Image.new('RGBA', (80, 100))
        ImageDraw.Draw(image).rectangle((20, 10, 60, 90), fill='#4466aa')
        image.save(self.source)
        _, info = workflow.preparation.read_image(self.source)
        self.analysis = {'version': 1, 'image': {k: info[k] for k in ['sha256', 'width', 'height']},
                         'id': 'fixture', 'name': 'Fixture', 'mode': 'silhouette', 'confidence': .8,
                         'evidence': 'Measured visible rectangle; no hidden pixels supplied.', 'waveSafe': False,
                         'regions': [{'id': 'body', 'role': 'body', 'polygon': [[.25,.1],[.75,.1],[.75,.9],[.25,.9]]}]}
        self.path = self.root/'character-analysis.json'
        self.save()
    def tearDown(self): self.temporary.cleanup()
    def save(self): self.path.write_text(json.dumps(self.analysis))
    def test_diagnosis_measures_masks_and_preserves_annotations_without_modifying_source(self):
        original = self.source.read_bytes()
        workflow.diagnose(self.source, self.path, self.root/'diagnostics')
        result = json.loads((self.root/'diagnostics/decomposition.json').read_text())
        self.assertEqual(result['parts'][0]['boundsPixels'], [20,10,61,91])
        self.assertEqual(result['parts'][0]['visiblePixels'], 41*81)
        self.assertEqual(result['parts'][0]['nextAction'], 'extract')
        self.assertEqual(json.loads((self.root/'diagnostics/character-analysis.json').read_text()), self.analysis)
        self.assertEqual(self.source.read_bytes(), original)
        with self.assertRaises(ValueError): workflow.diagnose(self.source, self.path, self.root/'diagnostics')
    def test_feedback_requires_matching_source_and_does_not_invent_hidden_pixels(self):
        report = {'version': 1, 'sourceSha256': self.analysis['image']['sha256'], 'items': [
            {'id': 'visible-body', 'partId': 'body', 'sourceRegion': 'body', 'reason': 'Extract measured region.'},
            {'id': 'closed-eye', 'partId': 'eye-left', 'reason': 'Hidden closed-eye image.'}]}
        feedback = self.root/'missing-assets.json'; feedback.write_text(json.dumps(report))
        workflow.diagnose(self.source, self.path, self.root/'feedback', feedback)
        items = {i['id']: i for i in json.loads((self.root/'feedback/missing-assets.json').read_text())['items']}
        self.assertEqual(items['visible-body']['nextAction'], 'extract')
        self.assertEqual(items['closed-eye']['nextAction'], 'provide-artwork')
        report['sourceSha256'] = '0'*64; feedback.write_text(json.dumps(report))
        with self.assertRaisesRegex(ValueError, 'different source'): workflow.diagnose(self.source, self.path, self.root/'stale', feedback)
        self.assertFalse((self.root/'stale').exists())
    def test_empty_required_region_blocks_build_but_saves_agent_readable_diagnostics(self):
        self.analysis['regions'][0]['polygon'] = [[0,0],[.1,0],[.1,.1],[0,.1]]; self.save()
        result = workflow.run(self.source, self.path, self.root/'blocked', ROOT/'packages/rig')
        self.assertFalse(result['canBuild']); self.assertFalse(result['studioStarted'])
        self.assertTrue((self.root/'blocked/diagnostics/missing-assets.json').is_file())
        self.assertFalse((self.root/'blocked/model').exists())
    def test_run_extracts_validates_compiles_and_saves_missing_optional_materials(self):
        result = workflow.run(self.source, self.path, self.root/'run', ROOT/'packages/rig')
        self.assertEqual(result['modelValidation'], 'passed'); self.assertFalse(result['studioStarted'])
        self.assertTrue((self.root/'run/prepared/parts/body.png').is_file())
        self.assertTrue((self.root/'run/model/model.json').is_file())
        report = json.loads((self.root/'run/model/missing-assets.json').read_text())
        self.assertFalse(any(item['id'].startswith(('mouth-', 'eye-')) for item in report['items']))
        self.assertNotIn('mouth-a', [item['id'] for item in report['items']])
        self.assertTrue(all(not item['required'] for item in report['items']))

    def layered_manifest(self):
        manifest = {'version': 2, 'renderer': 'layered-authoring', 'id': 'fixture', 'name': 'Fixture',
                    'source': {'file': 'source.png', 'size': [80,100], 'sha256': self.analysis['image']['sha256']},
                    'nodes': [{'id': 'root', 'pivot': [.5,.5], 'rotation': .05, 'translation': [0,0], 'response': 100}],
                    'attachments': [{'id': 'body', 'image': 'source.png', 'boundsPixels': [0,0,80,100],
                                     'node': 'root', 'coverage': 'complete', 'provenance': 'Synthetic fixture', 'sourceRegion': 'body'}]}
        path = self.root/'layered-authoring.json'; path.write_text(json.dumps(manifest))
        return path, manifest

    def test_separate_layered_manifest_compiles_without_treating_v1_cuts_as_layers(self):
        path, _ = self.layered_manifest()
        result = workflow.run(self.source, self.path, self.root/'layered', ROOT/'packages/rig', manifest_path=path)
        self.assertEqual(result['modelValidation'], 'passed')
        model = json.loads((self.root/'layered/model/model.json').read_text())
        self.assertEqual(model['version'], 2)
        self.assertEqual(model['attachments'][0]['provenance'], 'Synthetic fixture')

    def test_missing_layered_file_stops_compilation_and_records_extractable_region(self):
        path, manifest = self.layered_manifest(); manifest['attachments'][0]['image'] = 'missing.png'; path.write_text(json.dumps(manifest))
        result = workflow.run(self.source, self.path, self.root/'missing-layer', ROOT/'packages/rig', manifest_path=path)
        self.assertFalse(result['canBuild'])
        report = json.loads((self.root/'missing-layer/diagnostics/missing-assets.json').read_text())
        self.assertEqual(report['items'][0]['nextAction'], 'extract')
        self.assertFalse((self.root/'missing-layer/model').exists())


if __name__ == '__main__': unittest.main()
