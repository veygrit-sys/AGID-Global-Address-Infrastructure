import copy
from pathlib import Path
import runpy
import tempfile
import unittest

MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-bf-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]

class FakePage:
    def extract_text(self): return "marker"
class FakePdf:
    pages = [FakePage()]
    def __enter__(self): return self
    def __exit__(self, *args): return False

def fixtures(root):
    root = Path(root); pdf = root / "fixture.pdf"; web = root / "fixture.html"; script = root / "fixture.js"
    pdf.write_bytes(b"%PDF-fixture"); web.write_text("<p>marker</p>", encoding="utf-8"); script.write_text("marker", encoding="utf-8")
    return [
        {"file":pdf.name,"url":"https://official.invalid/x.pdf","bytes":pdf.stat().st_size,"sha256":digest(pdf.read_bytes()),"kind":"pdf","pages":1,"page_markers":{"0":["marker"]}},
        {"file":web.name,"url":"https://official.invalid/x","bytes":web.stat().st_size,"sha256":digest(web.read_bytes()),"kind":"html","markers":["marker"]},
        {"file":script.name,"url":"https://official.invalid/x.js","bytes":script.stat().st_size,"sha256":digest(script.read_bytes()),"kind":"javascript","markers":["marker"]}
    ]

class Tests(unittest.TestCase):
    def setUp(self): self.original = MODULE["pdfplumber"].open; MODULE["pdfplumber"].open = lambda _: FakePdf()
    def tearDown(self): MODULE["pdfplumber"].open = self.original
    def test_exact_complete_set_passes_without_promotion(self):
        with tempfile.TemporaryDirectory() as tmp:
            report = inspect_source_dir(tmp, fixtures(tmp))
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 3)
            self.assertEqual(report["currentPostalCodeFormat"], "NNNNN")
            self.assertTrue(report["currentPostalSystemConfirmed"])
            self.assertEqual(report["productionEligibleRecords"], 0)
    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            expected = fixtures(tmp); (Path(tmp)/"fixture.html").write_text("changed", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"): inspect_source_dir(tmp, expected)
    def test_source_set_drift_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            expected = fixtures(tmp); (Path(tmp)/"extra.html").write_text("x", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "source-set-mismatch"): inspect_source_dir(tmp, expected)
    def test_marker_drift_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            expected = fixtures(tmp); expected[1] = copy.deepcopy(expected[1]); expected[1]["markers"] = ["absent"]
            with self.assertRaisesRegex(ValueError, "missing-text-marker"): inspect_source_dir(tmp, expected)

if __name__ == "__main__": unittest.main()
