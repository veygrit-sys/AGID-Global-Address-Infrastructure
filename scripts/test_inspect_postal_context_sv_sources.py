import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("inspect-postal-context-sv-sources.py")
SPEC = importlib.util.spec_from_file_location("inspect_sv", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class InspectorTests(unittest.TestCase):
    def test_rejects_incomplete_source_set(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                MODULE.inspect_source_dir(directory)

    def test_rejects_changed_body(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            expected = [{"file": "only.html", "url": "https://example.invalid/", "bytes": 3, "sha256": "0" * 64, "kind": "html", "markers": ["x"]}]
            (path / "only.html").write_bytes(b"abc")
            with self.assertRaisesRegex(ValueError, "source-changed-review-required"):
                MODULE.inspect_source_dir(directory, expected)


if __name__ == "__main__":
    unittest.main()
