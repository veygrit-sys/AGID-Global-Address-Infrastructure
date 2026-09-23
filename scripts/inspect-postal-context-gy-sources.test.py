from pathlib import Path
import runpy
import tempfile
import unittest


MODULE = runpy.run_path(str(Path(__file__).with_name("inspect-postal-context-gy-sources.py")))


class GuyanaInspectorUnitTests(unittest.TestCase):
    def test_html_cleanup_decodes_and_collapses(self):
        self.assertEqual(MODULE["clean_html"]("<p>7-digit&nbsp; code</p>"), "7-digit code")

    def test_digest_is_stable(self):
        self.assertEqual(MODULE["digest"](b"GY"), "c79a94a92d8db5323f4fe2a3ef291a67111ed7f7de529758fd6ced19fa0f519f")

    def test_missing_source_set_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with self.assertRaisesRegex(ValueError, "source-set-mismatch"):
                MODULE["inspect_source_dir"](tmpdir)


if __name__ == "__main__":
    unittest.main()
