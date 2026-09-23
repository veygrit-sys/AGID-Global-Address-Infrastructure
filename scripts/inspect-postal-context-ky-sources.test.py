import copy
import json
from pathlib import Path
import runpy
import tempfile
import unittest

MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-ky-sources.py")))
inspect_source_dir, digest = MODULE["inspect_source_dir"], MODULE["digest"]

class FakePage:
    def extract_text(self): return "required PDF marker"
class FakePdf:
    pages = [FakePage()]
    def __enter__(self): return self
    def __exit__(self, *args): return False

def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    (root / "faq.html").write_text("permission marker", encoding="utf-8")
    (root / "service.json").write_text(json.dumps({"layers":[{"name":"Street Address","geometryType":"esriGeometryPolygon"}],"tables":[]}), encoding="utf-8")
    (root / "layer.json").write_text(json.dumps({"geometryType":"esriGeometryPolygon","fields":[{"name":x} for x in MODULE["EXPECTED_FIELDS"]]}), encoding="utf-8")
    (root / "sheet.pdf").write_bytes(b"%PDF-fixture")
    items = [
        {"file":"faq.html","url":"https://official.invalid/faq","kind":"html","markers":["permission marker"]},
        {"file":"service.json","url":"https://official.invalid/service","kind":"service-json"},
        {"file":"layer.json","url":"https://official.invalid/layer","kind":"layer-json"},
        {"file":"sheet.pdf","url":"https://official.invalid/sheet","kind":"pdf","pages":1,"page_markers":{"0":["required PDF marker"]}},
    ]
    for item in items:
        body=(root/item["file"]).read_bytes(); item["bytes"]=len(body); item["sha256"]=digest(body)
    return items

class KyInspectorTests(unittest.TestCase):
    def setUp(self): self.original_open=MODULE["pdfplumber"].open; MODULE["pdfplumber"].open=lambda _path:FakePdf()
    def tearDown(self): MODULE["pdfplumber"].open=self.original_open
    def test_exact_complete_set_is_accepted_without_geometry_promotion(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report=inspect_source_dir(tmpdir,synthetic_expected(tmpdir)); self.assertEqual(report["exactBodiesByteAndSha256Bound"],4); self.assertEqual(report["officialPostalGeometryRecords"],0); self.assertEqual(report["productionEligibleRecords"],0)
    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected=synthetic_expected(tmpdir); (Path(tmpdir)/"faq.html").write_text("changed",encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"source-changed-review-required"): inspect_source_dir(tmpdir,expected)
    def test_missing_extra_and_renamed_sources_fail_closed(self):
        for mutation in ["missing","extra","renamed"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected=synthetic_expected(tmpdir)
                if mutation=="missing": (Path(tmpdir)/"faq.html").unlink()
                elif mutation=="extra": (Path(tmpdir)/"extra.html").write_text("x",encoding="utf-8")
                else: (Path(tmpdir)/"faq.html").rename(Path(tmpdir)/"renamed.html")
                with self.assertRaisesRegex(ValueError,"source-set-mismatch"): inspect_source_dir(tmpdir,expected)
    def test_pdf_signature_page_and_marker_drift_fail_closed(self):
        for mutation,message in [("signature","invalid-pdf"),("pages","pdf-page-count"),("marker","missing-pdf-marker")]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected=synthetic_expected(tmpdir)
                if mutation=="signature":
                    path=Path(tmpdir)/"sheet.pdf"; path.write_bytes(b"not-pdf"); expected[3]["bytes"]=path.stat().st_size; expected[3]["sha256"]=digest(path.read_bytes())
                elif mutation=="pages": expected[3]["pages"]=2
                else: expected[3]["page_markers"]={"0":["absent"]}
                with self.assertRaisesRegex(ValueError,message): inspect_source_dir(tmpdir,expected)
    def test_gis_postcode_field_and_rights_marker_drift_fail_closed(self):
        for mutation,message in [("postcode","postcode-field-review-required"),("rights","missing-html-marker")]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected=synthetic_expected(tmpdir)
                if mutation=="postcode":
                    path=Path(tmpdir)/"layer.json"; value=json.loads(path.read_text()); value["fields"].append({"name":"POSTCODE"}); path.write_text(json.dumps(value)); expected[2]["bytes"]=path.stat().st_size; expected[2]["sha256"]=digest(path.read_bytes()); MODULE["EXPECTED_FIELDS"].append("POSTCODE")
                    try:
                        with self.assertRaisesRegex(ValueError,message): inspect_source_dir(tmpdir,expected)
                    finally: MODULE["EXPECTED_FIELDS"].pop()
                else:
                    path=Path(tmpdir)/"faq.html"; path.write_text("changed permission"); expected[0]["bytes"]=path.stat().st_size; expected[0]["sha256"]=digest(path.read_bytes())
                    with self.assertRaisesRegex(ValueError,message): inspect_source_dir(tmpdir,expected)
if __name__ == "__main__": unittest.main()
