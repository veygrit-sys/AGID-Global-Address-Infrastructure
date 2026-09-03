import copy, json, runpy, tempfile, unittest
from pathlib import Path

MODULE=runpy.run_path(str(Path(__file__).with_name('inspect-postal-context-cf-sources.py')))
inspect_source_dir=MODULE['inspect_source_dir']; digest=MODULE['digest']

def fixture(root):
 root=Path(root); path=root/'fixture.json'; path.write_text(json.dumps({'ok':True}),encoding='utf-8'); body=path.read_bytes()
 return [{'file':path.name,'url':'https://official.invalid/x','bytes':len(body),'sha256':digest(body),'kind':'text','markers':['true']}]

class Tests(unittest.TestCase):
 def test_missing_source_fails_closed(self):
  with tempfile.TemporaryDirectory() as tmp:
   with self.assertRaisesRegex(ValueError,'source-set-mismatch'):
    inspect_source_dir(tmp,fixture(tmp)+[{'file':'missing','url':'x','bytes':1,'sha256':'0'*64,'kind':'text'}])
 def test_changed_body_fails_closed(self):
  with tempfile.TemporaryDirectory() as tmp:
   expected=fixture(tmp); (Path(tmp)/'fixture.json').write_text('{}',encoding='utf-8')
   with self.assertRaisesRegex(ValueError,'source-changed-review-required'): inspect_source_dir(tmp,expected)
 def test_marker_drift_fails_closed(self):
  with tempfile.TemporaryDirectory() as tmp:
   expected=copy.deepcopy(fixture(tmp)); expected[0]['markers']=['absent']
   with self.assertRaisesRegex(ValueError,'missing-content-marker'): inspect_source_dir(tmp,expected)

if __name__=='__main__': unittest.main()
