import copy
from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-bb-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]


def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    (root / "fixture.pdf").write_bytes(b"%PDF-fixture")
    (root / "fixture.html").write_text("<html>marker</html>", encoding="utf-8")
    (root / "fixture.json").write_text('{"id":"official","fields":[{"name":"LongPostal"}]}', encoding="utf-8")
    items = [
        {"file":"fixture.pdf","url":"https://official.invalid/fixture.pdf","kind":"pdf","pages":1,"page_markers":{0:["marker"]}},
        {"file":"fixture.html","url":"https://official.invalid/fixture.html","kind":"html","markers":["marker"]},
        {"file":"fixture.json","url":"https://official.invalid/fixture.json","kind":"json","checks":{"id":"official"},"field_names":["LongPostal"]},
    ]
    for item in items:
        body = (root / item["file"]).read_bytes()
        item.update(bytes=len(body), sha256=digest(body))
    return items


class FakePage:
    def extract_text(self):
        return "marker"


class FakePdf:
    pages = [FakePage()]
    def __enter__(self): return self
    def __exit__(self, *args): return False


class SourceInspectorTests(unittest.TestCase):
    def setUp(self):
        self.original_open = MODULE["pdfplumber"].open
        MODULE["pdfplumber"].open = lambda _path: FakePdf()

    def tearDown(self):
        MODULE["pdfplumber"].open = self.original_open

    def test_exact_set_accepts_metadata_without_rows_or_promotion(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 3)
            self.assertEqual(report["featureRowsQueried"], 0)
            self.assertEqual(report["officialPostalAreaPolygonRecords"], 0)
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

    def test_wrong_html_marker_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            expected[1] = copy.deepcopy(expected[1]); expected[1]["markers"] = ["absent"]
            with self.assertRaisesRegex(ValueError, "missing-html-marker"):
                inspect_source_dir(tmpdir, expected)

    def test_wrong_pdf_signature_page_count_and_marker_fail_closed(self):
        for mutation in ["signature", "pages", "marker"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "signature":
                    body=b"not-pdf"; path=Path(tmpdir)/"fixture.pdf"; path.write_bytes(body); expected[0].update(bytes=len(body),sha256=digest(body)); message="invalid-pdf"
                elif mutation == "pages": expected[0]["pages"]=2; message="pdf-page-count"
                else: expected[0]["page_markers"]={0:["absent"]}; message="missing-pdf-marker"
                with self.assertRaisesRegex(ValueError, message): inspect_source_dir(tmpdir, expected)

    def test_json_path_value_and_field_drift_fail_closed(self):
        for mutation, message in [("path","missing-json-path"),("value","json-value-drift"),("field","json-field-drift")]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected=synthetic_expected(tmpdir); expected[2]=copy.deepcopy(expected[2])
                if mutation=="path": expected[2]["checks"]={"absent":"x"}
                elif mutation=="value": expected[2]["checks"]={"id":"different"}
                else: expected[2]["field_names"]=["ShortPosta"]
                with self.assertRaisesRegex(ValueError,message): inspect_source_dir(tmpdir,expected)


if __name__ == "__main__":
    unittest.main()
