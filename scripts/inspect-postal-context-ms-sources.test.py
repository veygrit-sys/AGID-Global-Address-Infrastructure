import json
from pathlib import Path
import runpy
import tempfile
import unittest

MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-ms-sources.py")))
inspect_source_dir, digest = MODULE["inspect_source_dir"], MODULE["digest"]

class FakePage:
    def __init__(self, text): self.text = text
    def extract_text(self): return self.text

class FakePdf:
    def __init__(self, pages): self.pages = [FakePage(text) for text in pages]
    def __enter__(self): return self
    def __exit__(self, *args): return False

def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    (root / "postal.html").write_text("operator marker", encoding="utf-8")
    (root / "rights.html").write_text("scope marker", encoding="utf-8")
    (root / "guide.pdf").write_bytes(b"%PDF-guide")
    items = [
        {"file":"postal.html","url":"https://official.invalid/postal","kind":"html","markers":["operator marker"]},
        {"file":"rights.html","url":"https://official.invalid/rights","kind":"html","markers":["scope marker"]},
        {"file":"guide.pdf","url":"https://official.invalid/guide","kind":"pdf","pages":1,"page_markers":{"0":["guide marker"]}},
    ]
    for item in items:
        body = (root / item["file"]).read_bytes()
        item["bytes"] = len(body)
        item["sha256"] = digest(body)
    return items

class MsInspectorTests(unittest.TestCase):
    def setUp(self):
        self.original_open = MODULE["pdfplumber"].open
        MODULE["pdfplumber"].open = lambda _path: FakePdf(["guide marker"])
    def tearDown(self): MODULE["pdfplumber"].open = self.original_open
    def test_exact_complete_set_is_accepted_without_geometry_promotion(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 3)
            self.assertEqual(report["officialPostalPolygonOrMultiPolygonRecords"], 0)
            self.assertEqual(report["productionEligibleRecords"], 0)
    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            (Path(tmpdir) / "postal.html").write_text("changed", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"): inspect_source_dir(tmpdir, expected)
    def test_missing_extra_and_renamed_sources_fail_closed(self):
        for mutation in ["missing", "extra", "renamed"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "missing": (Path(tmpdir) / "postal.html").unlink()
                elif mutation == "extra": (Path(tmpdir) / "extra.html").write_text("x", encoding="utf-8")
                else: (Path(tmpdir) / "postal.html").rename(Path(tmpdir) / "renamed.html")
                with self.assertRaisesRegex(ValueError, "source-set-mismatch"): inspect_source_dir(tmpdir, expected)
    def test_pdf_signature_page_and_marker_drift_fail_closed(self):
        for mutation, message in [("signature", "invalid-pdf"), ("pages", "pdf-page-count"), ("marker", "missing-pdf-marker")]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "signature":
                    path = Path(tmpdir) / "guide.pdf"; path.write_bytes(b"not-pdf"); expected[2]["bytes"] = path.stat().st_size; expected[2]["sha256"] = digest(path.read_bytes())
                elif mutation == "pages": expected[2]["pages"] = 2
                else: expected[2]["page_markers"] = {"0":["absent"]}
                with self.assertRaisesRegex(ValueError, message): inspect_source_dir(tmpdir, expected)
    def test_html_marker_drift_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            path = Path(tmpdir) / "rights.html"; path.write_text("changed scope", encoding="utf-8"); expected[1]["bytes"] = path.stat().st_size; expected[1]["sha256"] = digest(path.read_bytes())
            with self.assertRaisesRegex(ValueError, "missing-html-marker"): inspect_source_dir(tmpdir, expected)

if __name__ == "__main__": unittest.main()
