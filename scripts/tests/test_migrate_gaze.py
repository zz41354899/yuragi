import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
SCRIPT=Path(__file__).resolve().parents[2]/'skills/yuragi-rig-spec/scripts/migrate_gaze.py'
spec=importlib.util.spec_from_file_location('migrate_gaze',SCRIPT);migration=importlib.util.module_from_spec(spec);spec.loader.exec_module(migration)
class MigrationTests(unittest.TestCase):
    def test_migration_preserves_measurements_reports_removals_and_does_not_mutate_input(self):
        old={'version':1,'face':{'mode':'gaze','blink':{'interval':3800},'mouth':{},'eyes':[{'id':'left','center':[.5,.2],'skinSample':[.5,.3],'ink':[1,1,1]}]},
             'clips':[{'id':'demo','tracks':[{'target':'expression','name':'gaze','keys':[{'time':0,'value':1}]},{'target':'expression','name':'smile','keys':[]},{'target':'motion','name':'weight','keys':[]}]}]}
        original=json.dumps(old);new,report=migration.migrate(old)
        self.assertEqual(json.dumps(old),original);self.assertEqual(new['face'],{'eyes':[{'id':'left','center':[.5,.2]}]})
        self.assertEqual(new['clips'][0]['tracks'][0]['target'],'gaze');self.assertEqual(new['clips'][0]['tracks'][0]['name'],'strength')
        self.assertEqual(len(new['clips'][0]['tracks']),2);self.assertEqual(len(report['changes']),7)
        empty,r=migration.migrate({'id':'old','tracks':[{'target':'expression','name':'smile'}]})
        self.assertEqual(empty['tracks'],[]);self.assertTrue(any('empty clip' in change['action'] for change in r['changes']))
    def test_cli_never_overwrites_and_writes_new_report(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);source=root/'old.json';source.write_text('{"face":{"eyes":[],"mode":"gaze"}}')
            args=[sys.executable,str(SCRIPT),str(source),'--out',str(root/'new.json')]
            self.assertEqual(subprocess.run(args,capture_output=True).returncode,0)
            self.assertTrue((root/'new.migration-report.json').is_file())
            self.assertNotEqual(subprocess.run(args,capture_output=True).returncode,0)
            self.assertIn('mode',source.read_text())
if __name__=='__main__':unittest.main()
