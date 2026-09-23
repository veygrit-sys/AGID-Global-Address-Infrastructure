from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-ht-sources.py")))


class HaitiInspectorUnitTests(unittest.TestCase):
    def test_html_cleanup_decodes_and_collapses(self):
        self.assertEqual(MODULE["clean_html"]("<p>code&nbsp; postal</p>"), "code postal")

    def test_digest_is_stable(self):
        self.assertEqual(MODULE["digest"](b"HT"), "e4ebeb2baaed60915a0c4d99048bd8d5b5a2aba870e3f2c9d5eaaf1442364ffe")

    def test_missing_source_set_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                MODULE["inspect_source_dir"](tmpdir)


if __name__ == "__main__":
    unittest.main()
