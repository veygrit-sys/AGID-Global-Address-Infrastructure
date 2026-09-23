import copy
from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-br-sources.py")))
inspect_source_dir = MODULE["inspect_source_dir"]
digest = MODULE["digest"]


HTML_MARKERS = {
    "correios-dne.html": ["licensed DNE", "V.26082"],
    "correios-api-busca-cep.html": ["contract", "Bearer Token"],
    "correios-busca-cep.html": ["CAPTCHA", "query portal"],
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
    body = b"%PDF-fixture"
    (root / "upu-brazil.pdf").write_bytes(body)
    specs.append({
        "file": "upu-brazil.pdf",
        "url": "https://official.invalid/upu-brazil.pdf",
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
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 4)
            self.assertEqual(report["postcodeNormalizedFormat"], "NNNNNNNN")
            self.assertFalse(report["dneCompleteDatasetAcquired"])
            self.assertEqual(report["apiFeatureOrAddressRowsQueried"], 0)
            self.assertEqual(report["officialPostalGeometryRecords"], 0)
            self.assertEqual(report["productionEligibleRecords"], 0)

    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir)
            (Path(tmpdir) / "correios-dne.html").write_text("changed", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"):
                inspect_source_dir(tmpdir, expected)

    def test_missing_extra_and_renamed_sources_fail_closed(self):
        for mutation in ["missing", "extra", "renamed"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                path = Path(tmpdir) / "correios-dne.html"
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
                index = 3
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

    def test_contract_licence_and_captcha_markers_fail_closed(self):
        for index in [0, 1, 2]:
            with self.subTest(index=index), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                expected[index] = copy.deepcopy(expected[index])
                expected[index]["markers"] = ["semantic drift"]
                with self.assertRaisesRegex(ValueError, "missing-text-marker"):
                    inspect_source_dir(tmpdir, expected)

    def test_no_proxy_or_secret_access_is_implied(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertFalse(report["apiCredentialsOrContractUsed"])
            self.assertEqual(report["derivedOrVirtualPostalGeometryRecords"], 0)
            self.assertEqual(report["rawSourceRowsEmitted"], 0)


if __name__ == "__main__":
    unittest.main()
