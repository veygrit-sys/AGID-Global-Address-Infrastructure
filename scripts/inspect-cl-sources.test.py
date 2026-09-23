import copy
from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-cl-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]


def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    specs = []
    kinds = ["html", "pdf", "html", "pdf", "xml", "csw-json", "csw-json", "html"]
    for index, kind in enumerate(kinds):
        suffix = "json" if kind == "csw-json" else kind
        name = f"source-{index}.{suffix}"
        if kind == "pdf":
            body = b"%PDF-fixture"
            spec = {"file": name, "url": "https://official.invalid/" + name, "kind": kind, "pages": 1, "edition": "fixture", "page_markers": {0: ["marker"]}}
        elif kind == "csw-json":
            body = b'{"csw:GetRecordsResponse":{"csw:SearchResults":{"@numberOfRecordsMatched":"0","@numberOfRecordsReturned":"0"}}}'
            spec = {"file": name, "url": "https://official.invalid/" + name, "kind": kind, "records_matched": 0, "records_returned": 0}
        else:
            body = b"<document>marker</document>"
            spec = {"file": name, "url": "https://official.invalid/" + name, "kind": kind, "markers": ["marker"]}
        (root / name).write_bytes(body)
        spec.update(bytes=len(body), sha256=digest(body))
        specs.append(spec)
    return specs


class FakePage:
    def extract_text(self):
        return "marker"


class FakePdf:
    pages = [FakePage()]


class SourceInspectorTests(unittest.TestCase):
    def setUp(self):
        self.original_reader = inspect_source_dir.__globals__["PdfReader"]
        inspect_source_dir.__globals__["PdfReader"] = lambda _path: FakePdf()

    def tearDown(self):
        inspect_source_dir.__globals__["PdfReader"] = self.original_reader

    def test_exact_complete_set_is_accepted_without_rows_or_promotion(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 8)
            self.assertEqual(report["currentPostalCodeFormat"], "NNNNNNN")
            self.assertFalse(report["currentCompleteSevenDigitAssignmentAcquired"])
            self.assertEqual(report["officialSevenDigitPostalPolygonRecords"], 0)
            self.assertEqual(report["productionEligibleRecords"], 0)

    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            (Path(tmpdir) / "source-0.html").write_text("changed", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"):
                inspect_source_dir(tmpdir, expected)

    def test_missing_extra_and_renamed_sources_fail_closed(self):
        for mutation in ["missing", "extra", "renamed"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                path = Path(tmpdir) / "source-0.html"
                if mutation == "missing": path.unlink()
                elif mutation == "extra": (Path(tmpdir) / "extra.html").write_text("x", encoding="utf-8")
                else: path.rename(Path(tmpdir) / "renamed.html")
                with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                    inspect_source_dir(tmpdir, expected)

    def test_text_markers_fail_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            expected[0] = copy.deepcopy(expected[0]); expected[0]["markers"] = ["absent"]
            with self.assertRaisesRegex(ValueError, "missing-text-marker"):
                inspect_source_dir(tmpdir, expected)

    def test_pdf_signature_page_count_and_marker_fail_closed(self):
        for mutation in ["signature", "pages", "marker"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir); index = 1; path = Path(tmpdir) / expected[index]["file"]
                if mutation == "signature":
                    path.write_bytes(b"not-pdf"); expected[index].update(bytes=path.stat().st_size, sha256=digest(path.read_bytes())); message = "invalid-pdf"
                elif mutation == "pages": expected[index]["pages"] = 2; message = "pdf-page-count"
                else: expected[index]["page_markers"] = {0: ["absent"]}; message = "missing-pdf-marker"
                with self.assertRaisesRegex(ValueError, message): inspect_source_dir(tmpdir, expected)

    def test_csw_counts_and_titles_fail_closed(self):
        for mutation in ["count", "title"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir); index = 5
                expected[index] = copy.deepcopy(expected[index])
                if mutation == "count": expected[index]["records_matched"] = 1; message = "csw-count-changed"
                else: expected[index]["allowed_titles"] = ["postal area"]; message = "csw-title-changed"
                with self.assertRaisesRegex(ValueError, message): inspect_source_dir(tmpdir, expected)

    def test_non_area_semantics_and_admin_catalog_never_promote(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertFalse(report["completeAssignmentDenominatorEstablished"])
            self.assertFalse(report["broadPostalResultsArePostcodeLayers"])
            self.assertEqual(report["featureOrAddressRowsQueried"], 0)
            self.assertEqual(report["rawSourceRowsEmitted"], 0)


if __name__ == "__main__":
    unittest.main()
