import copy
import json
from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-bm-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]


WORKBOOK_SUMMARY = {
    "decryptedBytes": 10,
    "decryptedSha256": "0" * 64,
    "sheetNames": ["Sheet1"],
    "physicalRows": 2,
    "physicalColumns": 5,
    "nonEmptyRows": 1,
}


def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    (root / "fixture.html").write_text("<html>marker</html>", encoding="utf-8")
    (root / "fixture.pdf").write_bytes(b"%PDF-fixture")
    (root / "fixture.xls").write_bytes(b"xls-fixture")
    (root / "fixture.json").write_text('{"id":"official","fields":[{"name":"AREA"}]}', encoding="utf-8")
    items = [
        {"file":"fixture.html","url":"https://official.invalid/a","kind":"html","markers":["marker"]},
        {"file":"fixture.pdf","url":"https://official.invalid/b","kind":"pdf","pages":1,"page_markers":{0:["marker"]}},
        {"file":"fixture.xls","url":"https://official.invalid/c","kind":"xls","workbook":copy.deepcopy(WORKBOOK_SUMMARY)},
        {"file":"fixture.json","url":"https://official.invalid/d","kind":"json","checks":{"id":"official"},"field_names":["AREA"],"prohibited_field_names":["POSTCODE"]},
    ]
    for item in items:
        body = (root / item["file"]).read_bytes()
        item.update(bytes=len(body), sha256=digest(body))
    return items


class SourceInspectorTests(unittest.TestCase):
    def inspect(self, tmpdir, expected):
        return inspect_source_dir(
            tmpdir,
            expected,
            pdf_reader=lambda _body: ["marker"],
            workbook_reader=lambda _body: copy.deepcopy(WORKBOOK_SUMMARY),
        )

    def test_exact_set_accepts_aggregate_metadata_without_rows_or_geometry(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = self.inspect(tmpdir, synthetic_expected(tmpdir))
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 4)
            self.assertEqual(report["featureRowsQueried"], 0)
            self.assertEqual(report["rawWorkbookRowsEmitted"], 0)
            self.assertEqual(report["officialOrRightsClearedPostcodePolygonRecords"], 0)
            self.assertEqual(report["productionEligibleRecords"], 0)

    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            (Path(tmpdir) / "fixture.html").write_text("changed", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"):
                self.inspect(tmpdir, expected)

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
                    self.inspect(tmpdir, expected)

    def test_html_and_pdf_marker_or_page_drift_fails_closed(self):
        for mutation, message in [("html", "missing-html-marker"), ("pages", "pdf-page-count"), ("pdf-marker", "missing-pdf-marker")]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "html":
                    expected[0]["markers"] = ["absent"]
                    reader = lambda _body: ["marker"]
                elif mutation == "pages":
                    expected[1]["pages"] = 2
                    reader = lambda _body: ["marker"]
                else:
                    expected[1]["page_markers"] = {0:["absent"]}
                    reader = lambda _body: ["marker"]
                with self.assertRaisesRegex(ValueError, message):
                    inspect_source_dir(tmpdir, expected, pdf_reader=reader, workbook_reader=lambda _body: copy.deepcopy(WORKBOOK_SUMMARY))

    def test_workbook_summary_drift_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            drift = copy.deepcopy(WORKBOOK_SUMMARY)
            drift["nonEmptyRows"] = 2
            with self.assertRaisesRegex(ValueError, "workbook-summary-drift"):
                inspect_source_dir(tmpdir, expected, pdf_reader=lambda _body:["marker"], workbook_reader=lambda _body:drift)

    def test_json_path_value_field_and_prohibited_field_drift_fails_closed(self):
        cases = [
            ("path", "missing-json-path"),
            ("value", "json-value-drift"),
            ("field", "json-field-drift"),
            ("prohibited", "unexpected-postcode-field"),
        ]
        for mutation, message in cases:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                item = expected[3]
                if mutation == "path": item["checks"] = {"missing":"x"}
                elif mutation == "value": item["checks"] = {"id":"wrong"}
                elif mutation == "field": item["field_names"] = ["POSTCODE"]
                else: item["prohibited_field_names"] = ["AREA"]
                with self.assertRaisesRegex(ValueError, message):
                    self.inspect(tmpdir, expected)

    def test_extra_decrypted_workbook_helper_is_ignored_but_other_extra_is_not(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            (Path(tmpdir) / "fixture-decrypted.xls").write_bytes(b"temporary")
            report = self.inspect(tmpdir, expected)
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 4)


if __name__ == "__main__":
    unittest.main()
