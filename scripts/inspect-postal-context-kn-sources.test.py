import copy
from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-kn-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]


class FakePage:
    def extract_text(self):
        return "KN + 4 digits marker"


class FakePdf:
    pages = [FakePage()]
    def __enter__(self): return self
    def __exit__(self, *args): return False


def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    pdf = root / "fixture.pdf"
    page = root / "fixture.html"
    pdf.write_bytes(b"%PDF-fixture")
    page.write_text('<a href="guide.pdf">guide</a> Post Code KN0101 marker', encoding="utf-8")
    return [
        {"file":"fixture.pdf","url":"https://official.invalid/fixture.pdf","bytes":pdf.stat().st_size,
         "sha256":digest(pdf.read_bytes()),"kind":"pdf","pages":1,"page_markers":{0:["KN + 4 digits"]}},
        {"file":"fixture.html","url":"https://official.invalid/fixture.html","bytes":page.stat().st_size,
         "sha256":digest(page.read_bytes()),"kind":"html","markers":["marker"],"exact_codes":["KN0101"],"forbid_dataset_links":True},
    ]


class KnInspectorTests(unittest.TestCase):
    def setUp(self):
        self.original_open = MODULE["pdfplumber"].open
        MODULE["pdfplumber"].open = lambda _path: FakePdf()

    def tearDown(self):
        MODULE["pdfplumber"].open = self.original_open

    def test_exact_complete_set_is_accepted_without_geometry_promotion(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 2)
            self.assertEqual(report["observedArticlePostcodes"], 1)
            self.assertEqual(report["officialPostalGeometryRecords"], 0)
            self.assertEqual(report["productionEligibleRecords"], 0)

    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            (Path(tmpdir) / "fixture.html").write_text("changed", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"):
                inspect_source_dir(tmpdir, expected)

    def test_missing_extra_and_renamed_sources_fail_closed(self):
        for mutation in ["missing", "extra", "renamed"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "missing": (Path(tmpdir) / "fixture.html").unlink()
                elif mutation == "extra": (Path(tmpdir) / "extra.html").write_text("x", encoding="utf-8")
                else: (Path(tmpdir) / "fixture.html").rename(Path(tmpdir) / "renamed.html")
                with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                    inspect_source_dir(tmpdir, expected)

    def test_code_set_and_dataset_link_drift_fail_closed(self):
        for mutation, message in [("code", "official-article-code-set-changed"), ("dataset", "dataset-link-review-required")]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                path = Path(tmpdir) / "fixture.html"
                text = path.read_text(encoding="utf-8")
                text = text.replace("KN0101", "KN0102") if mutation == "code" else text.replace("guide.pdf", "areas.geojson")
                path.write_text(text, encoding="utf-8")
                expected[1] = copy.deepcopy(expected[1]); expected[1]["bytes"] = path.stat().st_size; expected[1]["sha256"] = digest(path.read_bytes())
                with self.assertRaisesRegex(ValueError, message): inspect_source_dir(tmpdir, expected)

    def test_pdf_signature_page_and_marker_drift_fail_closed(self):
        for mutation, message in [("signature", "invalid-pdf"), ("pages", "pdf-page-count"), ("marker", "missing-pdf-marker")]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "signature":
                    path = Path(tmpdir) / "fixture.pdf"; path.write_bytes(b"not-pdf")
                    expected[0]["bytes"] = path.stat().st_size; expected[0]["sha256"] = digest(path.read_bytes())
                elif mutation == "pages": expected[0]["pages"] = 2
                else: expected[0]["page_markers"] = {0:["absent"]}
                with self.assertRaisesRegex(ValueError, message): inspect_source_dir(tmpdir, expected)


if __name__ == "__main__":
    unittest.main()
