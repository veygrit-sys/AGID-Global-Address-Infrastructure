from pathlib import Path
import runpy
import tempfile
import unittest

MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-ni-sources.py")))
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
    (root / "operator.html").write_text("Un momento Verificación de seguridad en curso operator marker", encoding="utf-8")
    (root / "spatial.html").write_text("spatial marker WMS WFS", encoding="utf-8")
    (root / "rights.html").write_text("rights marker", encoding="utf-8")
    (root / "general.pdf").write_bytes(b"%PDF-general")
    (root / "country.pdf").write_bytes(b"%PDF-country")
    items = [
        {"file":"operator.html","url":"https://official.invalid/operator","kind":"html","markers":["operator marker"],"cloudflare_challenge":True},
        {"file":"spatial.html","url":"https://official.invalid/spatial","kind":"html","markers":["spatial marker"],"spatial_catalog":True},
        {"file":"rights.html","url":"https://official.invalid/rights","kind":"html","markers":["rights marker"],"upu_rights":True},
        {"file":"general.pdf","url":"https://official.invalid/general","kind":"pdf","pages":2,"page_markers":{"0":["Nicaragua"],"1":["Nicaragua","99999","N"]}},
        {"file":"country.pdf","url":"https://official.invalid/country","kind":"pdf","pages":1,"page_markers":{"0":["5 digits","05/2014"]}},
    ]
    for item in items:
        body = (root / item["file"]).read_bytes(); item["bytes"] = len(body); item["sha256"] = digest(body)
    return items

class NiInspectorTests(unittest.TestCase):
    def setUp(self):
        self.original_open = MODULE["pdfplumber"].open
        MODULE["pdfplumber"].open = lambda path: FakePdf(["Nicaragua", "Nicaragua 99999 N"] if str(path).endswith("general.pdf") else ["5 digits 05/2014"])
    def tearDown(self): MODULE["pdfplumber"].open = self.original_open
    def test_exact_complete_set_is_accepted_without_geometry_promotion(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 5)
            self.assertEqual(report["correosCloudflareChallengeBodies"], 1)
            self.assertEqual(report["officialPostalPolygonOrMultiPolygonRecords"], 0)
            self.assertEqual(report["productionEligibleRecords"], 0)
    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir); (Path(tmpdir) / "operator.html").write_text("changed", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"): inspect_source_dir(tmpdir, expected)
    def test_missing_extra_and_renamed_sources_fail_closed(self):
        for mutation in ["missing", "extra", "renamed"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "missing": (Path(tmpdir) / "operator.html").unlink()
                elif mutation == "extra": (Path(tmpdir) / "extra.html").write_text("x", encoding="utf-8")
                else: (Path(tmpdir) / "operator.html").rename(Path(tmpdir) / "renamed.html")
                with self.assertRaisesRegex(ValueError, "source-set-mismatch"): inspect_source_dir(tmpdir, expected)
    def test_pdf_signature_page_and_marker_drift_fail_closed(self):
        for mutation, message in [("signature", "invalid-pdf"), ("pages", "pdf-page-count"), ("marker", "missing-pdf-marker")]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "signature":
                    path = Path(tmpdir) / "country.pdf"; path.write_bytes(b"not-pdf"); expected[4]["bytes"] = path.stat().st_size; expected[4]["sha256"] = digest(path.read_bytes())
                elif mutation == "pages": expected[4]["pages"] = 2
                else: expected[4]["page_markers"] = {"0":["absent"]}
                with self.assertRaisesRegex(ValueError, message): inspect_source_dir(tmpdir, expected)
    def test_html_marker_drift_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir); path = Path(tmpdir) / "rights.html"; path.write_text("changed", encoding="utf-8"); expected[2]["bytes"] = path.stat().st_size; expected[2]["sha256"] = digest(path.read_bytes())
            with self.assertRaisesRegex(ValueError, "missing-html-marker"): inspect_source_dir(tmpdir, expected)

if __name__ == "__main__": unittest.main()
