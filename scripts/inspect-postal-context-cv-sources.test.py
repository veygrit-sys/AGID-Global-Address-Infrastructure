import hashlib
import tempfile
import unittest
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("inspect-postal-context-cv-sources.py")
SPEC = spec_from_file_location("inspect_postal_context_cv_sources", MODULE_PATH)
MODULE = module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CaboVerdeSourceInspectorTest(unittest.TestCase):
    def test_small_digest_bound_source_passes(self):
        with tempfile.TemporaryDirectory() as folder:
            body = b"official marker"
            Path(folder, "source.txt").write_bytes(body)
            expected = [{"file": "source.txt", "url": "https://example.invalid", "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(), "kind": "text", "markers": ["official marker"]}]
            result = MODULE.inspect_source_dir(folder, expected)
            self.assertEqual(result["exactBodiesByteAndSha256Bound"], 1)
            self.assertEqual(result["productionEligibleRecords"], 0)

    def test_missing_or_changed_source_fails_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            expected = [{"file": "missing.txt", "url": "https://example.invalid", "bytes": 1, "sha256": "0" * 64, "kind": "text", "markers": []}]
            with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                MODULE.inspect_source_dir(folder, expected)
            Path(folder, "missing.txt").write_bytes(b"x")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"):
                MODULE.inspect_source_dir(folder, expected)

    def test_marker_drift_fails_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            body = b"different"
            Path(folder, "source.txt").write_bytes(body)
            expected = [{"file": "source.txt", "url": "https://example.invalid", "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(), "kind": "text", "markers": ["required"]}]
            with self.assertRaisesRegex(ValueError, "missing-content-marker"):
                MODULE.inspect_source_dir(folder, expected)


if __name__ == "__main__":
    unittest.main()
