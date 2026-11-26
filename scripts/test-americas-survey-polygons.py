import copy
from collections import Counter
from pathlib import Path
import runpy
import unittest


audit = runpy.run_path(str(Path(__file__).with_name('verify-americas-survey-polygons.py')))
check = audit['check_window']
GeometryError = audit['GeometryError']


def square(a, b):
    return [[a, a], [b, a], [b, b], [a, b], [a, a]]


def polygon(a, b, **properties):
    return {**properties, 'bbox': [a, a, b, b], 'rings': [square(a, b)]}


class SurveyTopologyTests(unittest.TestCase):
    def setUp(self):
        island = polygon(0, 2, kind='island')
        island['rings'].append(square(.5, 1.5))
        self.window = {'bbox': [0, 0, 2, 2], 'land': [island],
                       'water': [polygon(.5, 1.5, kind='inland')],
                       'owners': [polygon(0, 2, code='CA')]}

    def test_lake_hole_and_overlapping_administrative_candidates(self):
        self.window['owners'].append(polygon(0, 2, code='US'))
        counts = Counter()
        check(self.window, counts)
        self.assertEqual(counts['holes'], 1)
        self.assertEqual(counts['distinct-owner intersections'], 1)

    def test_filled_hole_is_a_land_water_contradiction(self):
        self.window['land'][0]['rings'].pop()
        with self.assertRaisesRegex(GeometryError, 'overlaps'):
            check(self.window, Counter())

    def test_open_crossed_nonfinite_and_stale_bounds(self):
        for key, value in [
            ('rings', [[[0, 0], [2, 0], [2, 2], [0, 2]]]),
            ('rings', [[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]]),
            ('rings', [[[0, 0], [2, 0], [float('nan'), 2], [0, 2], [0, 0]]]),
            ('bbox', [0, 0, 1, 2]),
        ]:
            with self.subTest(key=key, value=value):
                window = copy.deepcopy(self.window)
                window['land'][0][key] = value
                with self.assertRaises(GeometryError):
                    check(window, Counter())

    def test_reversed_duplicate_is_detected(self):
        clone = copy.deepcopy(self.window['water'][0])
        clone['rings'][0].reverse()
        self.window['water'].append(clone)
        with self.assertRaisesRegex(GeometryError, 'duplicate'):
            check(self.window, Counter())


if __name__ == '__main__':
    unittest.main()
