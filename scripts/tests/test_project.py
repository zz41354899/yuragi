import importlib.util,json,tempfile,shutil,hashlib,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('project',ROOT/'skills/yuragi-rig-spec/scripts/project.py');helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
class ProjectTests(unittest.TestCase):
    def test_publish_is_atomic_records_runtime_and_assets_and_rejects_invalid_new_versions(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);shutil.copyfile(ROOT/'packages/rig/assets/mirea/texture.png',root/'source.png');version=root/'v1';version.mkdir();shutil.copyfile(root/'source.png',version/'texture.png')
            model=json.loads((ROOT/'packages/rig/assets/mirea/model.json').read_text());model['texture']['src']='texture.png';(version/'model.json').write_text(json.dumps(model))
            result=helper.publish(root,root/'source.png','v1',version,ROOT/'packages/rig');self.assertEqual(result['currentVersion'],'v1');self.assertEqual(result['versions'][0]['runtimeVersion'],json.loads((ROOT/'packages/rig/package.json').read_text())['version']);self.assertIn('v1/texture.png',result['versions'][0]['inputs'])
            before=(root/'project.json').read_bytes()
            with self.assertRaises(ValueError):helper.publish(root,root/'source.png','v1',version,ROOT/'packages/rig')
            model['pins'][0]['x']=3;(version/'model.json').write_text(json.dumps(model))
            with self.assertRaises(helper.subprocess.CalledProcessError):helper.publish(root,root/'source.png','v2',version,ROOT/'packages/rig')
            self.assertEqual((root/'project.json').read_bytes(),before)
