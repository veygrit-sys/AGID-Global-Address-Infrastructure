from pathlib import Path
import json
import runpy
import tempfile
import unittest

MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-pa-sources.py")))
inspect_source_dir, digest = MODULE["inspect_source_dir"], MODULE["digest"]

def synthetic_expected(tmpdir):
    root = Path(tmpdir)
    bodies = {
        "correos-launch.html": b"launch marker",
        "postal-portal.html": b"portal marker",
        "postal-portal-index.js": b"api marker postal-cell-",
        "postal-portal-index.css": b"leaflet-container postal-pico-label",
        "postal-api-location.json": json.dumps({"postal":{"codigo_completo":"A7C95-69R3E","grid":{"level":"PICO","cells":[]}}}).encode(),
        "postal-api-decode.json": json.dumps({"codigo_normalizado":"A7C95-69R3E","postal":{"codigo_completo":"A7C95-69R3E","grid":{"level":"PICO","cells":[]}}}).encode(),
        "upu-copyright.html": b"rights marker",
    }
    cells = []
    for index in range(9):
        row, column = divmod(index, 3)
        cells.append({"bounds":[[row, column],[row + 0.5, column + 0.5]],"center":[row + 0.25,column + 0.25],"selected":index == 4})
    for name in ["postal-api-location.json", "postal-api-decode.json"]:
        value = json.loads(bodies[name]); value["postal"]["grid"]["cells"] = cells; bodies[name] = json.dumps(value).encode()
    kinds = {"correos-launch.html":"html","postal-portal.html":"html","postal-portal-index.js":"javascript","postal-portal-index.css":"css","postal-api-location.json":"location_json","postal-api-decode.json":"decode_json","upu-copyright.html":"html"}
    markers = {"correos-launch.html":["launch marker"],"postal-portal.html":["portal marker"],"postal-portal-index.js":["api marker","postal-cell-"],"postal-portal-index.css":["leaflet-container","postal-pico-label"],"upu-copyright.html":["rights marker"]}
    expected = []
    for name, body in bodies.items():
        (root / name).write_bytes(body)
        expected.append({"file":name,"url":"https://official.invalid/" + name,"bytes":len(body),"sha256":digest(body),"kind":kinds[name],"markers":markers.get(name,[])})
    return expected

class PaInspectorTests(unittest.TestCase):
    def test_exact_complete_set_accepts_observations_without_promoting_geometry(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report = inspect_source_dir(tmpdir, synthetic_expected(tmpdir))
            self.assertEqual(report["exactBodiesByteAndSha256Bound"], 7)
            self.assertEqual(report["locationPicoCells"], 9)
            self.assertEqual(report["productionEligibleRecords"], 0)
    def test_changed_body_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir); (Path(tmpdir) / "correos-launch.html").write_text("changed")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"): inspect_source_dir(tmpdir, expected)
    def test_missing_extra_and_renamed_sources_fail_closed(self):
        for mutation in ["missing", "extra", "renamed"]:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmpdir:
                expected = synthetic_expected(tmpdir)
                if mutation == "missing": (Path(tmpdir) / "correos-launch.html").unlink()
                elif mutation == "extra": (Path(tmpdir) / "extra.html").write_text("x")
                else: (Path(tmpdir) / "correos-launch.html").rename(Path(tmpdir) / "renamed.html")
                with self.assertRaisesRegex(ValueError, "source-set-mismatch"): inspect_source_dir(tmpdir, expected)
    def test_invalid_json_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir); path = Path(tmpdir) / "postal-api-location.json"; path.write_text("not-json"); expected[4]["bytes"] = path.stat().st_size; expected[4]["sha256"] = digest(path.read_bytes())
            with self.assertRaisesRegex(ValueError, "invalid-api-json"): inspect_source_dir(tmpdir, expected)
    def test_geometry_and_selected_cell_drift_fail_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            expected = synthetic_expected(tmpdir); path = Path(tmpdir) / "postal-api-location.json"; value = json.loads(path.read_text()); value["postal"]["grid"]["cells"][4]["selected"] = False; path.write_text(json.dumps(value)); expected[4]["bytes"] = path.stat().st_size; expected[4]["sha256"] = digest(path.read_bytes())
            with self.assertRaisesRegex(ValueError, "selected-cell-count"): inspect_source_dir(tmpdir, expected)

if __name__ == "__main__": unittest.main()
