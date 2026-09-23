import copy
import json
from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-bo-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]


def write_agbc_fixture(path):
    path.write_text(json.dumps({
        "slug": "home", "meta_title": "Correos de Bolivia", "sections": [
            {"key": "hero", "settings": {"tracking_label": "Codigo de seguimiento", "tracking_placeholder": "Ej: PE123456789"}},
            {"key": "services", "items": [{"name": "Casillas"}]},
            {"key": "tools", "items": [{"type": "office"} for _ in range(9)]},
            {"key": "footer", "settings": {"copyright": "© 2026 Correos de Bolivia. Todos los derechos reservados."}, "items": [{"name": "Terminos y Condiciones", "data": {"url": "#"}}]},
        ]
    }, ensure_ascii=False), encoding="utf-8")


def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    files = {
        "fixture.pdf": b"%PDF-fixture",
        "fixture.html": b"<html>marker</html>",
        "fixture.js": b"marker",
    }
    for name, body in files.items():
        (root / name).write_bytes(body)
    write_agbc_fixture(root / "agbc.json")
    arcgis_service = {"serviceDescription": "Capa de Código Postal", "layers": [{"id": 0}]}
    arcgis_layer = {"name": "Código postal", "geometryType": "esriGeometryPolygon", "extent": {"spatialReference": {"wkid": 3116}}, "fields": [{"name": "CODIGO_POS"}]}
    arcgis_item = {"id": "f69b67a266cc420b86bb3a8d6546ea31", "owner": "lider.planeacion", "type": "Feature Service", "extent": [[-75.63410222497822, 6.113132705468609], [-75.58854266098474, 6.163225889296734]], "licenseInfo": None, "accessInformation": None, "created": 1559161824000, "modified": 1575902309000}
    for name, value in [("service.json", arcgis_service), ("layer.json", arcgis_layer), ("item.json", arcgis_item)]:
        (root / name).write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
    specs = [
        {"file": "fixture.pdf", "url": "https://official.invalid/fixture.pdf", "kind": "pdf", "pages": 1, "page_markers": {0: ["marker"]}},
        {"file": "fixture.html", "url": "https://official.invalid/fixture.html", "kind": "html", "markers": ["marker"]},
        {"file": "fixture.js", "url": "https://official.invalid/fixture.js", "kind": "text", "markers": ["marker"]},
        {"file": "agbc.json", "url": "https://official.invalid/agbc.json", "kind": "agbc-json"},
        {"file": "service.json", "url": "https://official.invalid/service.json", "kind": "arcgis-service"},
        {"file": "layer.json", "url": "https://official.invalid/layer.json", "kind": "arcgis-layer"},
        {"file": "item.json", "url": "https://official.invalid/item.json", "kind": "arcgis-item"},
    ]
    for spec in specs:
        body = (root / spec["file"]).read_bytes()
        spec.update(bytes=len(body), sha256=digest(body))
    return specs


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
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 7)
            self.assertEqual(report["currentPostalCodeFormat"], "none")
            self.assertEqual(report["currentCompletePostalCodeAssignmentsValidated"], 0)
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

    def test_text_marker_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            expected[1] = copy.deepcopy(expected[1]); expected[1]["markers"] = ["absent"]
            with self.assertRaisesRegex(ValueError, "missing-text-marker"):
                inspect_source_dir(tmpdir, expected)

    def test_pdf_signature_page_count_and_marker_fail_closed(self):
        for mutation in ["signature", "pages", "marker"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "signature":
                    path = Path(tmpdir) / "fixture.pdf"; path.write_bytes(b"not-pdf")
                    expected[0].update(bytes=path.stat().st_size, sha256=digest(path.read_bytes())); message = "invalid-pdf"
                elif mutation == "pages":
                    expected[0]["pages"] = 2; message = "pdf-page-count"
                else:
                    expected[0]["page_markers"] = {0: ["absent"]}; message = "missing-pdf-marker"
                with self.assertRaisesRegex(ValueError, message):
                    inspect_source_dir(tmpdir, expected)

    def test_agbc_semantic_drift_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            path = Path(tmpdir) / "agbc.json"; value = json.loads(path.read_text(encoding="utf-8"))
            value["sections"][0]["settings"]["tracking_label"] = "Codigo postal"
            path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
            expected[3].update(bytes=path.stat().st_size, sha256=digest(path.read_bytes()))
            with self.assertRaisesRegex(ValueError, "unexpected-tracking-label"):
                inspect_source_dir(tmpdir, expected)

    def test_arcgis_extent_or_field_drift_fails_closed(self):
        for mutation in ["extent", "field"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                index = 6 if mutation == "extent" else 5; path = Path(tmpdir) / expected[index]["file"]
                value = json.loads(path.read_text(encoding="utf-8"))
                if mutation == "extent": value["extent"] = [[-70, -20], [-60, -10]]
                else: value["fields"] = []
                path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
                expected[index].update(bytes=path.stat().st_size, sha256=digest(path.read_bytes()))
                with self.assertRaisesRegex(ValueError, "unexpected-arcgis"):
                    inspect_source_dir(tmpdir, expected)


if __name__ == "__main__":
    unittest.main()
