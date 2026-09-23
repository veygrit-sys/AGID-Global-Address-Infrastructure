#!/usr/bin/env python3

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock


MODULE_PATH = Path(__file__).with_name("inspect-postal-context-do-sources.py")
SPEC = importlib.util.spec_from_file_location("inspect_do", MODULE_PATH)
assert SPEC and SPEC.loader
inspect_do = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(inspect_do)


class FakePage:
    def __init__(self, text):
        self._text = text

    def extract_text(self):
        return self._text


class FakePdf:
    def __init__(self, pages):
        self.pages = [FakePage(text) for text in pages]

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


def square():
    return [[[-69.0, 18.0], [-69.1, 18.0], [-69.1, 18.1], [-69.0, 18.0]]]


class DominicanRepublicInspectorTests(unittest.TestCase):
    def setUp(self):
        self.original_expected = inspect_do.EXPECTED
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        rows = []
        for index in range(1403):
            code = f"{10000 + (index % 528):05d}" if index < 1401 else (["", "Sin titulo"][index - 1401])
            rows.append({"zipcode": code, "place": f"p{index}", "coor_z": 0, "coor_y": 0, "lng": -69.0, "lat": 18.0})
        for index in range(29):
            rows[index + 29] = dict(rows[index])
        bodies = {
            "search.html": b"postal-app.js Codigo Postal",
            "config.js": b"config marker",
            "app.js": b"json/data.json polygon.php?zipcode= fitBounds fillOpacity: 0.18",
            "data.json": json.dumps(rows).encode(),
            "poly.geojson": json.dumps({"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"zipcode": "10100"}, "geometry": {"type": "Polygon", "coordinates": square()}}]}).encode(),
            "terms.html": b"terms marker",
            "sheet.pdf": b"%PDF-fake",
        }
        expected = {}
        for name, body in bodies.items():
            (self.root / name).write_bytes(body)
            expected[name] = {"bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(), "kind": "text", "markers": []}
        expected["data.json"] = {**expected["data.json"], "kind": "index"}
        expected["poly.geojson"] = {**expected["poly.geojson"], "kind": "geojson", "postcode": "10100", "features": 1, "rings": 1, "vertices": 4}
        expected["sheet.pdf"] = {**expected["sheet.pdf"], "kind": "pdf", "pages": 1, "page_markers": {0: ["PDF marker"]}}
        inspect_do.EXPECTED = expected

    def tearDown(self):
        inspect_do.EXPECTED = self.original_expected
        self.temp.cleanup()

    def fake_pdf(self, *_args, **_kwargs):
        return FakePdf(["PDF marker"])

    @mock.patch.object(inspect_do.pdfplumber, "open")
    def test_complete_fixed_set_emits_only_aggregates(self, pdf_open):
        pdf_open.side_effect = self.fake_pdf
        result = inspect_do.inspect(self.root)
        self.assertEqual(result["searchIndexRows"], 1403)
        self.assertEqual(result["productionEligibleRecords"], 0)
        self.assertEqual(result["rawSourceRowsEmitted"], 0)
        self.assertNotIn("rows", result)

    @mock.patch.object(inspect_do.pdfplumber, "open")
    def test_changed_body_fails(self, pdf_open):
        pdf_open.side_effect = self.fake_pdf
        (self.root / "search.html").write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "exact bytes/SHA-256"):
            inspect_do.inspect(self.root)

    @mock.patch.object(inspect_do.pdfplumber, "open")
    def test_missing_extra_or_renamed_body_fails(self, pdf_open):
        pdf_open.side_effect = self.fake_pdf
        (self.root / "search.html").rename(self.root / "renamed.html")
        with self.assertRaisesRegex(ValueError, "exact source set"):
            inspect_do.inspect(self.root)

    @mock.patch.object(inspect_do.pdfplumber, "open")
    def test_text_marker_fails(self, pdf_open):
        pdf_open.side_effect = self.fake_pdf
        spec = inspect_do.EXPECTED["search.html"]
        spec["markers"] = ["missing"]
        with self.assertRaisesRegex(ValueError, "missing marker"):
            inspect_do.inspect(self.root)

    def test_malformed_index_or_schema_fails(self):
        rows = json.loads((self.root / "data.json").read_text())
        rows[0].pop("place")
        (self.root / "data.json").write_text(json.dumps(rows))
        with self.assertRaisesRegex(ValueError, "schema drift"):
            inspect_do._inspect_index(self.root / "data.json")

    def test_point_or_unclosed_polygon_fails(self):
        path = self.root / "poly.geojson"
        payload = json.loads(path.read_text())
        payload["features"][0]["geometry"] = {"type": "Point", "coordinates": [-69.0, 18.0]}
        path.write_text(json.dumps(payload))
        with self.assertRaisesRegex(ValueError, "only Polygon"):
            inspect_do._inspect_geojson(path, inspect_do.EXPECTED["poly.geojson"])

        payload["features"][0]["geometry"] = {"type": "Polygon", "coordinates": [[[-69.0, 18.0], [-69.1, 18.0], [-69.1, 18.1], [-69.0, 18.1]]]}
        path.write_text(json.dumps(payload))
        with self.assertRaisesRegex(ValueError, "unclosed"):
            inspect_do._inspect_geojson(path, inspect_do.EXPECTED["poly.geojson"])

    @mock.patch.object(inspect_do.pdfplumber, "open")
    def test_pdf_signature_page_or_marker_fails(self, pdf_open):
        path = self.root / "sheet.pdf"
        path.write_bytes(b"not-pdf")
        with self.assertRaisesRegex(ValueError, "signature"):
            inspect_do._inspect_pdf(path, inspect_do.EXPECTED["sheet.pdf"])
        path.write_bytes(b"%PDF-fake")
        pdf_open.return_value = FakePdf([])
        with self.assertRaisesRegex(ValueError, "page count"):
            inspect_do._inspect_pdf(path, inspect_do.EXPECTED["sheet.pdf"])
        pdf_open.return_value = FakePdf(["wrong"])
        with self.assertRaisesRegex(ValueError, "missing PDF marker"):
            inspect_do._inspect_pdf(path, inspect_do.EXPECTED["sheet.pdf"])


if __name__ == "__main__":
    unittest.main()
