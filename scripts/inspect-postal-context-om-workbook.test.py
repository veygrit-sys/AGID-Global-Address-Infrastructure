import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('oman', Path(__file__).with_name('inspect-postal-context-om-workbook.py'))
oman = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oman)


class OmanWorkbookTests(unittest.TestCase):
    def setUp(self):
        # Synthetic values only; not an office assignment or geographic fixture.
        self.rows = [oman.HEADERS.copy(), [0, 'Synthetic A', ' ', ' ', 'post office', 'مكتب بريد', 0.0, 0.0],
                     [1, 'Synthetic B', 'اختبار', 'Synthetic town', 'post office', 'مكتب بريد', 0.0, 0.0]]

    def test_missingness_and_duplicates_do_not_impute(self):
        before = copy.deepcopy(self.rows)
        p = oman.profile_rows(self.rows)
        self.assertEqual(p['rows'], 2)
        self.assertEqual(p['missingArabicNames'], 1)
        self.assertEqual(p['missingTownLabels'], 1)
        self.assertEqual(p['uniqueCoordinatePairs'], 1)
        self.assertEqual(p['rowsInDuplicateCoordinateGroups'], 2)
        self.assertEqual(p['rowsDeduplicated'], 0)
        self.assertEqual(self.rows, before)

    def test_no_postal_geometry_or_building_promotion(self):
        p = oman.profile_rows(self.rows)
        self.assertFalse(p['postalCodeColumnPresent'])
        self.assertFalse(p['fidIsPostalCode'])
        self.assertIsNone(p['sourceCrs'])
        self.assertIsNone(p['fidIsStableAcrossEditions'])
        self.assertEqual(p['geometriesMaterialized'], 0)
        self.assertEqual(p['addressBuildingRelations'], 0)

    def test_extra_sensitive_column_rejected(self):
        self.rows[0].append('OWNER')
        with self.assertRaisesRegex(ValueError, 'headers'):
            oman.profile_rows(self.rows)

    def test_duplicate_fid_rejected(self):
        self.rows[2][0] = 0
        with self.assertRaisesRegex(ValueError, 'duplicate-fid'):
            oman.profile_rows(self.rows)

    def test_numeric_text_not_silently_coerced(self):
        self.rows[1][6] = '0'
        with self.assertRaisesRegex(ValueError, 'coordinate-type'):
            oman.profile_rows(self.rows)

    def test_bool_not_numeric_identifier(self):
        self.rows[1][0] = False
        with self.assertRaisesRegex(ValueError, 'fid-type'):
            oman.profile_rows(self.rows)

    def test_nan_and_infinity_rejected(self):
        for bad in [float('nan'), float('inf'), -float('inf'), True]:
            self.rows[1][7] = bad
            with self.assertRaisesRegex(ValueError, 'coordinate-type'):
                oman.profile_rows(self.rows)

    def test_invalid_ranges_rejected_without_crs_guess(self):
        self.rows[1][7] = 91
        with self.assertRaisesRegex(ValueError, 'coordinate-range'):
            oman.profile_rows(self.rows)

    def test_short_row_rejected(self):
        self.rows[1].pop()
        with self.assertRaisesRegex(ValueError, 'row-width'):
            oman.profile_rows(self.rows)

    def test_unknown_feature_category_rejected(self):
        self.rows[1][4] = 'private residence'
        with self.assertRaisesRegex(ValueError, 'feature-category'):
            oman.profile_rows(self.rows)

    def test_changed_workbook_never_executes_or_unzips(self):
        for data in [b'PK\x03\x04', b'A' * 9827, b'<html>error</html>']:
            with self.assertRaisesRegex(ValueError, 'content-drift'):
                oman.inspect_workbook(data)

    def test_aggregates_do_not_leak_rows(self):
        p = oman.profile_rows(self.rows)
        import json
        self.assertNotIn('Synthetic A', json.dumps(p))
        self.assertNotIn('Synthetic town', json.dumps(p))


if __name__ == '__main__':
    unittest.main()
