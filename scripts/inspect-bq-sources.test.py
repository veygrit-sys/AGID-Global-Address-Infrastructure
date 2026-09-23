import copy
from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-bq-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]


HTML_MARKERS = {
    "rcn-post.html": ["no current postcode", "island address", "CC0 1.0"],
    "rcn-copyright.html": ["CC0 text boundary"],
    "rcn-postcode-consultation-news.html": ["no postcode system", "proposed range"],
    "acm-caribbean-post.html": ["FXDC concession"],
    "consultation.html": ["proposal", "result published"],
}


def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    specs = []
    for name, markers in HTML_MARKERS.items():
        body = ("<html>" + " ".join(markers) + "</html>").encode()
        (root / name).write_bytes(body)
        specs.append({
            "file": name,
            "url": f"https://official.invalid/{name}",
            "kind": "html",
            "markers": markers,
            "bytes": len(body),
            "sha256": digest(body),
        })
    for name in ["consultation-report.pdf", "upu-bes.pdf", "upu-general-addressing.pdf"]:
        body = b"%PDF-fixture"
        (root / name).write_bytes(body)
        specs.append({
            "file": name,
            "url": f"https://official.invalid/{name}",
            "kind": "pdf",
            "pages": 1,
            "edition": "fixture",
            "page_markers": {0: ["marker"]},
            "bytes": len(body),
            "sha256": digest(body),
        })
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
            self.assertEqual(report["currentPostalCodeFormat"], "none")
            self.assertEqual(report["currentCompletePostalCodeAssignmentsValidated"], 0)
            self.assertEqual(report["officialPostalGeometryRecords"], 0)
            self.assertEqual(report["productionEligibleRecords"], 0)

    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            (Path(tmpdir) / "rcn-post.html").write_text("changed", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"):
                inspect_source_dir(tmpdir, expected)

    def test_missing_extra_and_renamed_sources_fail_closed(self):
        for mutation in ["missing", "extra", "renamed"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                path = Path(tmpdir) / "rcn-post.html"
                if mutation == "missing":
                    path.unlink()
                elif mutation == "extra":
                    (Path(tmpdir) / "extra.html").write_text("x", encoding="utf-8")
                else:
                    path.rename(Path(tmpdir) / "renamed.html")
                with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                    inspect_source_dir(tmpdir, expected)

    def test_text_marker_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            expected[0] = copy.deepcopy(expected[0])
            expected[0]["markers"] = ["absent"]
            with self.assertRaisesRegex(ValueError, "missing-text-marker"):
                inspect_source_dir(tmpdir, expected)

    def test_pdf_signature_page_count_and_marker_fail_closed(self):
        for mutation in ["signature", "pages", "marker"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                index = 5
                path = Path(tmpdir) / expected[index]["file"]
                if mutation == "signature":
                    path.write_bytes(b"not-pdf")
                    expected[index].update(bytes=path.stat().st_size, sha256=digest(path.read_bytes()))
                    message = "invalid-pdf"
                elif mutation == "pages":
                    expected[index]["pages"] = 2
                    message = "pdf-page-count"
                else:
                    expected[index]["page_markers"] = {0: ["absent"]}
                    message = "missing-pdf-marker"
                with self.assertRaisesRegex(ValueError, message):
                    inspect_source_dir(tmpdir, expected)

    def test_operator_rights_or_no_code_marker_drift_fails_closed(self):
        for index in [0, 1, 3]:
            with self.subTest(index=index), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                expected[index] = copy.deepcopy(expected[index])
                expected[index]["markers"] = ["semantic drift"]
                with self.assertRaisesRegex(ValueError, "missing-text-marker"):
                    inspect_source_dir(tmpdir, expected)

    def test_proposal_and_workaround_identifiers_never_promote(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertEqual(report["proposalRange"], "0000AA-0999ZZ")
            self.assertFalse(report["proposalRangeTreatedAsCurrentAssignment"])
            self.assertFalse(report["workaround0000BQTreatedAsCurrentAssignment"])
            self.assertFalse(report["possible0100AATreatedAsCurrentAssignment"])
            self.assertEqual(report["featureOrAddressRowsQueried"], 0)
            self.assertEqual(report["rawSourceRowsEmitted"], 0)


if __name__ == "__main__":
    unittest.main()
