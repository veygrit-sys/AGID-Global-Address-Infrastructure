from pathlib import Path
from xml.sax.saxutils import escape
import json
import runpy
import tempfile
import unittest
import zipfile


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-pe-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]


HEADERS = [
    "Departamento",
    "Provincia",
    "Distrito",
    "Capital Distrito",
    "Ubigeo Centro Poblado",
    "Centro Poblado / Localidad",
    "Código Postal",
]


def write_xlsx(path, headers=HEADERS):
    rows = [
        headers,
        ["Lima", "Lima", "Lima", "Lima", "1501010001", "Lima", "15082"],
        ["Piura", "Ayabaca", "Ayabaca", "Ayabaca", "2002010001", "Ayabaca", "20001"],
    ]
    strings = []
    indices = {}
    for row in rows:
        for value in row:
            if value not in indices:
                indices[value] = len(strings)
                strings.append(value)
    shared = '<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + "".join(f"<si><t>{escape(value)}</t></si>" for value in strings) + "</sst>"
    sheet_rows = []
    for row_number, row in enumerate(rows, 2):
        cells = []
        for offset, value in enumerate(row, 2):
            column = chr(64 + offset)
            cells.append(f'<c r="{column}{row_number}" t="s"><v>{indices[value]}</v></c>')
        sheet_rows.append(f'<row r="{row_number}">{"".join(cells)}</row>')
    sheet = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + "".join(sheet_rows) + "</sheetData></worksheet>"
    workbook = '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Listado CPN-MTC" sheetId="1"/></sheets></workbook>'
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("xl/sharedStrings.xml", shared)
        archive.writestr("xl/worksheets/sheet1.xml", sheet)
        archive.writestr("xl/workbook.xml", workbook)


def synthetic_bundle(tmpdir, headers=HEADERS):
    root = Path(tmpdir)
    bodies = {
        "orientation.html": b"orientation marker",
        "dataset.html": b"dataset marker",
        "resource.html": b"resource marker",
        "legal.pdf": b"%PDF- legal",
        "bulletin-2022.pdf": b"%PDF- bulletin",
        "odc-by-1.0.html": b"licence marker",
        "app-wrapper.html": b"blocked marker",
    }
    for name, body in bodies.items():
        (root / name).write_bytes(body)
    write_xlsx(root / "codigo_postal.xlsx", headers=headers)
    kinds = {
        "orientation.html": "html",
        "dataset.html": "html",
        "resource.html": "html",
        "codigo_postal.xlsx": "xlsx",
        "legal.pdf": "pdf",
        "bulletin-2022.pdf": "pdf",
        "odc-by-1.0.html": "html",
        "app-wrapper.html": "html",
    }
    markers = {
        "orientation.html": ["orientation marker"],
        "dataset.html": ["dataset marker"],
        "resource.html": ["resource marker"],
        "odc-by-1.0.html": ["licence marker"],
        "app-wrapper.html": ["blocked marker"],
    }
    expected = []
    for name, kind in kinds.items():
        body = (root / name).read_bytes()
        expected.append({
            "file": name,
            "url": "https://official.invalid/" + name,
            "bytes": len(body),
            "sha256": digest(body),
            "kind": kind,
            "markers": markers.get(name, []),
        })
    metrics = {
        "sheet": "Listado CPN-MTC",
        "headers": headers,
        "nonemptyDataRows": 2,
        "postalCodeRows": 2,
        "fiveDigitRows": 2,
        "invalidPostalCodeRows": 0,
        "uniquePostalCodes": 2,
        "uniquePopulatedCentreIds": 2,
        "sample15082Count": 1,
        "geometryColumns": int(any("geometry" in value.casefold() for value in headers)),
        "coordinateColumns": 0,
    }
    return expected, metrics


class PeInspectorTests(unittest.TestCase):
    def test_exact_complete_set_accepts_dated_rows_without_promoting_geometry(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected, metrics = synthetic_bundle(tmpdir)
            report = inspect_source_dir(tmpdir, expected, metrics)
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 8)
            self.assertEqual(report["datedRelease"]["uniquePostalCodes"], 2)
            self.assertEqual(report["productionEligibleRecords"], 0)

    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected, metrics = synthetic_bundle(tmpdir)
            (Path(tmpdir) / "dataset.html").write_text("changed")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"):
                inspect_source_dir(tmpdir, expected, metrics)

    def test_missing_extra_and_renamed_sources_fail_closed(self):
        for mutation in ("missing", "extra", "renamed"):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected, metrics = synthetic_bundle(tmpdir)
                if mutation == "missing":
                    (Path(tmpdir) / "legal.pdf").unlink()
                elif mutation == "extra":
                    (Path(tmpdir) / "extra.html").write_text("x")
                else:
                    (Path(tmpdir) / "legal.pdf").rename(Path(tmpdir) / "renamed.pdf")
                with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                    inspect_source_dir(tmpdir, expected, metrics)

    def test_invalid_xlsx_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected, metrics = synthetic_bundle(tmpdir)
            path = Path(tmpdir) / "codigo_postal.xlsx"
            path.write_bytes(b"not-a-zip")
            item = next(item for item in expected if item["file"] == path.name)
            item["bytes"] = path.stat().st_size
            item["sha256"] = digest(path.read_bytes())
            with self.assertRaisesRegex(ValueError, "invalid-xlsx-review-required"):
                inspect_source_dir(tmpdir, expected, metrics)

    def test_geometry_header_drift_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected, metrics = synthetic_bundle(tmpdir)
            path = Path(tmpdir) / "codigo_postal.xlsx"
            headers = HEADERS.copy()
            headers[-1] = "Geometry"
            write_xlsx(path, headers=headers)
            item = next(item for item in expected if item["file"] == path.name)
            item["bytes"] = path.stat().st_size
            item["sha256"] = digest(path.read_bytes())
            with self.assertRaisesRegex(ValueError, "xlsx-schema-or-count-drift-review-required"):
                inspect_source_dir(tmpdir, expected, metrics)


if __name__ == "__main__":
    unittest.main()
