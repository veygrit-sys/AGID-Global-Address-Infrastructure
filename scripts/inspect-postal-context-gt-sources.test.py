from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-gt-sources.py")))


class GuatemalaInspectorUnitTests(unittest.TestCase):
    def test_code_extraction_is_five_digit_and_unique(self):
        self.assertEqual(MODULE["codes"]("01001 01001 A01002 9999 100000"), {"01001", "01002"})

    def test_html_cleanup_decodes_and_collapses(self):
        self.assertEqual(MODULE["clean_html"]("<p>acceso&nbsp; libre</p>"), "acceso libre")

    def test_digest_is_stable(self):
        self.assertEqual(MODULE["digest"](b"GT"), "ba464bd29d8e092a7995e35e8ae54f6b5af1ea1773a1a92f42bb2a9ce9e033d1")

    def test_missing_source_set_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                MODULE["inspect_source_dir"](tmpdir)


if __name__ == "__main__":
    unittest.main()
