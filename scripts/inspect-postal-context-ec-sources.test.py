#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

MODULE_PATH = Path(__file__).with_name("inspect-postal-context-ec-sources.py")
SPEC = importlib.util.spec_from_file_location("inspect_ec", MODULE_PATH)
assert SPEC and SPEC.loader
inspect_ec = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(inspect_ec)


class FakePage:
    def __init__(self, text): self._text = text
    def extract_text(self): return self._text


class FakePdf:
    def __init__(self, pages): self.pages = [FakePage(text) for text in pages]
    def __enter__(self): return self
    def __exit__(self, *_args): return False


def lookup_body() -> bytes:
    pairs = [(float(index), float(index)) for index in range(226)]
    pairs.append(pairs[0])
    wkt = "MULTIPOLYGON(((" + ",".join(f"{x} {y}" for x, y in pairs) + ")))"
    return json.dumps({"data": [{"codigo_postal": "180204", "provincia": "TUNGURAHUA", "geometria": wkt, "lon": "1", "lat": "1"}]}).encode()


class EcuadorInspectorTests(unittest.TestCase):
    def setUp(self):
        self.original_expected = inspect_ec.EXPECTED
        self.original_inspect_lookup = inspect_ec._inspect_lookup
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        bodies = {
            "main.html": b"main marker",
            "client.js": b"client marker",
            "lookup.json": lookup_body(),
            "standard.pdf": b"%PDF-fake",
        }
        expected = {}
        for name, body in bodies.items():
            (self.root / name).write_bytes(body)
            expected[name] = {"bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(), "kind": "text", "markers": []}
        expected["lookup.json"] = {**expected["lookup.json"], "kind": "lookup"}
        expected["standard.pdf"] = {**expected["standard.pdf"], "kind": "pdf", "pages": 1, "page_markers": {0: ["PDF marker"]}}
        inspect_ec.EXPECTED = expected
        inspect_ec._inspect_lookup = mock.Mock(return_value={"lookupRows": 1})

    def tearDown(self):
        inspect_ec.EXPECTED = self.original_expected
        inspect_ec._inspect_lookup = self.original_inspect_lookup
        self.temp.cleanup()

    @mock.patch.object(inspect_ec.pdfplumber, "open", return_value=FakePdf(["PDF marker"]))
    def test_complete_fixed_set_emits_only_aggregates(self, _pdf_open):
        result = inspect_ec.inspect(self.root)
        self.assertEqual(result["lookupRows"], 1)
        self.assertEqual(result["productionEligibleRecords"], 0)
        self.assertEqual(result["rawSourceRowsEmitted"], 0)
        self.assertNotIn("data", result)

    @mock.patch.object(inspect_ec.pdfplumber, "open", return_value=FakePdf(["PDF marker"]))
    def test_changed_body_fails(self, _pdf_open):
        (self.root / "main.html").write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "exact bytes/SHA-256"):
            inspect_ec.inspect(self.root)

    def test_missing_extra_or_renamed_body_fails(self):
        (self.root / "main.html").rename(self.root / "renamed.html")
        with self.assertRaisesRegex(ValueError, "exact source set"):
            inspect_ec.inspect(self.root)

    @mock.patch.object(inspect_ec.pdfplumber, "open", return_value=FakePdf(["PDF marker"]))
    def test_text_marker_fails(self, _pdf_open):
        inspect_ec.EXPECTED["main.html"]["markers"] = ["missing"]
        with self.assertRaisesRegex(ValueError, "missing marker"):
            inspect_ec.inspect(self.root)

    def test_lookup_schema_geometry_and_closure_fail_closed(self):
        inspect_ec._inspect_lookup = self.original_inspect_lookup
        path = self.root / "lookup.json"
        payload = json.loads(path.read_text())
        payload["data"][0].pop("provincia")
        path.write_text(json.dumps(payload))
        with self.assertRaisesRegex(ValueError, "schema drift"):
            inspect_ec._inspect_lookup(path)
        payload = json.loads(lookup_body())
        payload["data"][0]["geometria"] = "POINT(1 1)"
        path.write_text(json.dumps(payload))
        with self.assertRaisesRegex(ValueError, "MultiPolygon"):
            inspect_ec._inspect_lookup(path)

    @mock.patch.object(inspect_ec.pdfplumber, "open")
    def test_pdf_signature_page_or_marker_fails(self, pdf_open):
        path = self.root / "standard.pdf"
        path.write_bytes(b"not-pdf")
        with self.assertRaisesRegex(ValueError, "signature"):
            inspect_ec._inspect_pdf(path, inspect_ec.EXPECTED["standard.pdf"])
        path.write_bytes(b"%PDF-fake")
        pdf_open.return_value = FakePdf([])
        with self.assertRaisesRegex(ValueError, "page count"):
            inspect_ec._inspect_pdf(path, inspect_ec.EXPECTED["standard.pdf"])
        pdf_open.return_value = FakePdf(["wrong"])
        with self.assertRaisesRegex(ValueError, "missing PDF marker"):
            inspect_ec._inspect_pdf(path, inspect_ec.EXPECTED["standard.pdf"])


if __name__ == "__main__":
    unittest.main()
