import copy
import json
from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-ar-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]


def synthetic_openapi():
    paths = {
        path: {}
        for path in [
            "/provincias", "/departamentos", "/municipios", "/localidades-censales", "/asentamientos",
            "/localidades", "/calles", "/direcciones", "/ubicacion", "/{filename}",
        ]
    }
    return {
        "openapi": "3.0.1",
        "info": {"title": "georef-ar-api", "version": "0.5.X"},
        "paths": paths,
        "components": {"schemas": {"direccion": {"type": "object", "properties": {"altura": {"type": "integer"}}}}},
    }


def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    pdf_path = root / "fixture.pdf"
    html_path = root / "fixture.html"
    json_path = root / "fixture.json"
    pdf_path.write_bytes(b"%PDF-fixture")
    html_path.write_text("<html>marker</html>", encoding="utf-8")
    json_path.write_text(json.dumps(synthetic_openapi()), encoding="utf-8")
    return [
        {
            "file": "fixture.pdf", "url": "https://official.invalid/fixture.pdf", "bytes": pdf_path.stat().st_size,
            "sha256": digest(pdf_path.read_bytes()), "kind": "pdf", "pages": 1, "page_markers": {0: ["marker"]},
        },
        {
            "file": "fixture.html", "url": "https://official.invalid/fixture.html", "bytes": html_path.stat().st_size,
            "sha256": digest(html_path.read_bytes()), "kind": "html", "markers": ["marker"],
        },
        {
            "file": "fixture.json", "url": "https://official.invalid/fixture.json", "bytes": json_path.stat().st_size,
            "sha256": digest(json_path.read_bytes()), "kind": "json", "markers": ["georef-ar-api", "0.5.X"],
        },
    ]


class FakePage:
    def extract_text(self):
        return "marker"


class FakePdf:
    pages = [FakePage()]

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class SourceInspectorTests(unittest.TestCase):
    def setUp(self):
        self.original_open = MODULE["pdfplumber"].open
        MODULE["pdfplumber"].open = lambda _path: FakePdf()

    def tearDown(self):
        MODULE["pdfplumber"].open = self.original_open

    def test_exact_complete_set_is_accepted_without_rows_or_promotion(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 3)
            self.assertEqual(report["currentCompleteCpaAssignmentRowsValidated"], 0)
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
                if mutation == "missing":
                    (Path(tmpdir) / "fixture.html").unlink()
                elif mutation == "extra":
                    (Path(tmpdir) / "extra.html").write_text("x", encoding="utf-8")
                else:
                    (Path(tmpdir) / "fixture.html").rename(Path(tmpdir) / "renamed.html")
                with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                    inspect_source_dir(tmpdir, expected)

    def test_wrong_html_marker_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            expected[1] = copy.deepcopy(expected[1])
            expected[1]["markers"] = ["absent"]
            with self.assertRaisesRegex(ValueError, "missing-html-marker"):
                inspect_source_dir(tmpdir, expected)

    def test_wrong_pdf_signature_page_count_and_marker_fail_closed(self):
        for mutation in ["signature", "pages", "marker"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "signature":
                    body = b"not-pdf"
                    path = Path(tmpdir) / "fixture.pdf"
                    path.write_bytes(body)
                    expected[0].update(bytes=len(body), sha256=digest(body))
                    message = "invalid-pdf"
                elif mutation == "pages":
                    expected[0]["pages"] = 2
                    message = "pdf-page-count"
                else:
                    expected[0]["page_markers"] = {0: ["absent"]}
                    message = "missing-pdf-marker"
                with self.assertRaisesRegex(ValueError, message):
                    inspect_source_dir(tmpdir, expected)

    def test_georef_postal_key_or_path_change_fails_closed(self):
        for mutation in ["postal-key", "path"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                path = Path(tmpdir) / "fixture.json"
                body = json.loads(path.read_text(encoding="utf-8"))
                if mutation == "postal-key":
                    body["components"]["schemas"]["direccion"]["properties"]["codigo_postal"] = {"type": "string"}
                    message = "georef-openapi-postal-key-review-required"
                else:
                    body["paths"]["/postal-zones"] = {}
                    message = "georef-openapi-path-set-review-required"
                path.write_text(json.dumps(body), encoding="utf-8")
                expected[2].update(bytes=path.stat().st_size, sha256=digest(path.read_bytes()))
                with self.assertRaisesRegex(ValueError, message):
                    inspect_source_dir(tmpdir, expected)


if __name__ == "__main__":
    unittest.main()
