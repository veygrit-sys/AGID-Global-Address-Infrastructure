from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-hn-sources.py")))


class HondurasInspectorUnitTests(unittest.TestCase):
    def test_html_cleanup_decodes_and_collapses(self):
        self.assertEqual(MODULE["clean_html"]("<p>código&nbsp; postal</p>"), "código postal")

    def test_digest_is_stable(self):
        self.assertEqual(MODULE["digest"](b"HN"), "aaadeb0ab2919487c1534f903a2a10049d3764fb1f7c5f718a4bf817a930636a")

    def test_missing_source_set_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                MODULE["inspect_source_dir"](tmpdir)


if __name__ == "__main__":
    unittest.main()
