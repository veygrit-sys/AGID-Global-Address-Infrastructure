import copy, json, runpy, tempfile, unittest
from pathlib import Path
MODULE=runpy.run_path(str(Path(__file__).with_name('inspect-postal-context-lc-sources.py')))
canonical_codes,digest,code_digest=MODULE['canonical_codes'],MODULE['digest'],MODULE['code_digest']

class LcInspectorTests(unittest.TestCase):
    def test_canonicalization_preserves_official_double_space(self):
        self.assertEqual(canonical_codes('LC04 101 LC 15 201 LC15  201'),['LC04  101','LC15  201'])
    def test_assignment_digest_is_order_independent_after_normalization(self):
        codes=canonical_codes('LC15 201 LC04 101 LC15 201'); self.assertEqual(code_digest(codes),digest(b'LC04  101\nLC15  201\n'))
    def test_address_example_is_explicitly_separate(self):
        table=['LC04  101','LC15  201']; gazette=table+['LC04  113']; self.assertEqual(sorted(set(gazette)-{'LC04  113'}),table)
    def test_changed_body_digest_differs(self):
        self.assertNotEqual(digest(b'official'),digest(b'changed'))
    def test_missing_extra_and_renamed_sets_are_detectable(self):
        expected={'a.html','b.pdf'}
        for observed in [{'a.html'},{'a.html','b.pdf','x'},{'renamed.html','b.pdf'}]: self.assertNotEqual(expected,observed)
if __name__=='__main__': unittest.main()
