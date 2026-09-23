import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('bn_profile', Path(__file__).with_name('profile-postal-context-bn-booklet.py'))
bn = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bn)
HEADER = ['BIL', 'NAMA KAMPONG', 'POSKOD']


class BookletPreflightTests(unittest.TestCase):
    def group(self, rows):
        return bn.profile_tables([[[HEADER, *rows]]])['groups']['locality']

    def test_text_codes_and_multiline_labels(self):
        r = self.group([['1', 'SYNTHETIC\nLOCALITY', 'BB0010']])
        self.assertEqual(r['distinctPostcodes'], 1)
        self.assertEqual(r['multilineNameCells'], 1)
        self.assertEqual(r['invalidPostcodeRows'], 0)

    def test_missing_and_malformed_are_not_filled(self):
        r = self.group([['1', None, None], ['2', 'Synthetic', 'bb0010'], ['3', 'Synthetic', 'BB 0010']])
        self.assertEqual((r['missingNameRows'], r['missingPostcodeRows'], r['invalidPostcodeRows']), (1, 1, 2))

    def test_repeated_codes_and_names_are_not_identifiers(self):
        r = self.group([['1', 'Synthetic A', 'BB0010'], ['2', 'Synthetic B', 'BB0010']])
        self.assertEqual(r['repeatedPostcodeGroups'], 1)
        self.assertEqual(r['rowsInRepeatedPostcodeGroups'], 2)
        self.assertEqual(r['duplicateNameCodeRows'], 0)

    def test_blank_row_and_serial_gap_are_reported(self):
        r = self.group([['1', 'Synthetic', 'BB0010'], [None, None, None], ['3', 'Synthetic B', 'BB0011']])
        self.assertEqual(r['rows'], 2)
        self.assertEqual(r['blankStructuralRows'], 1)
        self.assertEqual(r['serialSequenceMismatches'], 1)

    def test_merged_code_cell_is_not_split(self):
        r = self.group([['1', 'Synthetic', 'BB0010\nBB0011']])
        self.assertEqual(r['multiCodeCells'], 1)
        self.assertEqual(r['distinctPostcodes'], 0)

    def test_unknown_or_private_schema_is_rejected(self):
        for header in [['BIL', 'OWNER', 'POSKOD'], ['BIL', 'NAMA KAMPONG', 'POSKOD', 'IDENTITY']]:
            with self.assertRaises(ValueError):
                bn.profile_tables([[[header]]])

    def test_invalid_types_prefixes_and_numeric_ids_are_not_normalized(self):
        with self.assertRaises(ValueError):
            self.group([['1', 'Synthetic', 123456]])
        r = self.group([['x', 'Synthetic', 'ZA0010']])
        self.assertEqual((r['invalidSerialRows'], r['invalidPostcodeRows']), (1, 1))

    def test_limits_and_unreviewed_document_fail_closed(self):
        with self.assertRaises(ValueError):
            bn.profile_tables([[]] * 61)
        with self.assertRaisesRegex(ValueError, 'unreviewed-pdf'):
            bn.inspect_pdf(b'%PDF-synthetic')


if __name__ == '__main__':
    unittest.main()
