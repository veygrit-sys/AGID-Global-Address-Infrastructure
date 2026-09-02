import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("inspect-postal-context-tt-sources.py")
SPEC = importlib.util.spec_from_file_location("tt_inspector", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class TrinidadTobagoSourceInspectorTests(unittest.TestCase):
    def materialize(self, target, source_dir):
        for item in MODULE.EXPECTED:
            (target / item["file"]).write_bytes((source_dir / item["file"]).read_bytes())

    def test_exact_official_set_passes(self):
        source_dir = Path(self.source_dir)
        result = MODULE.inspect_source_dir(source_dir)
        self.assertEqual(result["exactBodiesByteAndSha256Bound"], 5)
        self.assertEqual(result["exactOfficialBodiesBytes"], 2571401)
        self.assertTrue(result["ttPostSystemCompletedForAllAddresses"])
        self.assertTrue(result["mixedAreaAndNonAreaPostalObjectSemantics"])
        self.assertEqual(result["officialPostalGeometryRecords"], 0)

    def test_changed_body_fails_closed(self):
        source_dir = Path(self.source_dir)
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp)
            self.materialize(target, source_dir)
            path = target / "ttpost-postal-code.html"
            path.write_bytes(path.read_bytes() + b" ")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"):
                MODULE.inspect_source_dir(target)

    def test_missing_or_extra_body_fails_closed(self):
        source_dir = Path(self.source_dir)
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp)
            self.materialize(target, source_dir)
            (target / "ttpost-system.html").unlink()
            with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                MODULE.inspect_source_dir(target)

    def test_html_marker_drift_fails_closed(self):
        expected = [dict(item) for item in MODULE.EXPECTED]
        expected[0] = dict(expected[0], markers=["marker that must not exist"])
        with self.assertRaisesRegex(ValueError, "missing-html-marker"):
            MODULE.inspect_source_dir(Path(self.source_dir), expected=expected)

    @classmethod
    def setUpClass(cls):
        import os
        cls.source_dir = os.environ["AGID_TT_SOURCE_DIR"]


if __name__ == "__main__":
    unittest.main()
