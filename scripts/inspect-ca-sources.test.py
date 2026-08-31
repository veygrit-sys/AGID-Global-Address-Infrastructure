import copy
from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-ca-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]


def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    specs = []
    for index, kind in enumerate(["html", "html", "pdf", "pdf", "pdf", "html", "html", "html", "pdf", "json", "html"]):
        name = f"source-{index}.{kind}"
        if kind == "pdf":
            body = b"%PDF-fixture"
            spec = {"file": name, "url": "https://official.invalid/" + name, "kind": kind, "pages": 1, "edition": "fixture", "page_markers": {0: ["marker"]}}
        else:
            body = ("{\"marker\": \"marker\"}" if kind == "json" else "<html>marker</html>").encode()
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
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 11)
            self.assertEqual(report["currentPostalCodeFormat"], "ANA NAN")
            self.assertFalse(report["currentCompleteLicensedAssignmentAcquired"])
            self.assertEqual(report["fullSixCharacterPostalPolygonRecords"], 0)
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

    def test_text_and_json_markers_fail_closed(self):
        for index in [0, 9]:
            with self.subTest(index=index), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                expected[index] = copy.deepcopy(expected[index]); expected[index]["markers"] = ["absent"]
                with self.assertRaisesRegex(ValueError, "missing-text-marker"):
                    inspect_source_dir(tmpdir, expected)

    def test_pdf_signature_page_count_and_marker_fail_closed(self):
        for mutation in ["signature", "pages", "marker"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir); index = 2; path = Path(tmpdir) / expected[index]["file"]
                if mutation == "signature":
                    path.write_bytes(b"not-pdf"); expected[index].update(bytes=path.stat().st_size, sha256=digest(path.read_bytes())); message = "invalid-pdf"
                elif mutation == "pages": expected[index]["pages"] = 2; message = "pdf-page-count"
                else: expected[index]["page_markers"] = {0: ["absent"]}; message = "missing-pdf-marker"
                with self.assertRaisesRegex(ValueError, message): inspect_source_dir(tmpdir, expected)

    def test_geometry_schema_marker_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir); expected[2] = copy.deepcopy(expected[2]); expected[2]["forbidden_markers"] = ["marker"]
            with self.assertRaisesRegex(ValueError, "unexpected-geometry-marker"):
                inspect_source_dir(tmpdir, expected)

    def test_licensed_rows_cfsa_and_non_area_objects_never_promote(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertEqual(report["currentLicensedAssignmentReleaseIdentified"], "260807ad.zip")
            self.assertFalse(report["licensedProductContainsPolygonGeometrySchema"])
            self.assertFalse(report["cfsaIsCurrentCanadaPostFullCodeGeometry"])
            self.assertEqual(report["featureOrAddressRowsQueried"], 0)
            self.assertEqual(report["rawSourceRowsEmitted"], 0)


if __name__ == "__main__":
    unittest.main()
