import copy
from collections import Counter
import json
from pathlib import Path
import runpy
from tempfile import TemporaryDirectory
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

    def test_continuous_longitudes_across_the_antimeridian(self):
        for shift in (179, -181):
            window = copy.deepcopy(self.window)
            window['bbox'][0] += shift
            window['bbox'][2] += shift
            for group in ('land', 'water', 'owners'):
                for row in window[group]:
                    row['bbox'][0] += shift
                    row['bbox'][2] += shift
                    for ring in row['rings']:
                        for p in ring:
                            p[0] += shift
            check(window, Counter(), unwrapped=True)
            with self.assertRaises(GeometryError):
                check(window, Counter())
            # Switching longitude branches between adjacent vertices draws
            # a spurious edge around almost the entire planet.
            window['land'][0]['rings'][0][1][0] += -360 if shift > 0 else 360
            with self.assertRaisesRegex(GeometryError, 'antimeridian edge'):
                check(window, Counter(), unwrapped=True)

    def test_overlapping_windows_on_different_longitude_branches(self):
        with TemporaryDirectory() as tmp:
            directory = Path(tmp)
            for i, filename in enumerate(audit['OCEANIA']):
                # First two extents overlap physically, one on each branch.
                west = (179, -180)[i] if i < 2 else i * 5
                bounds = [west, 0, west + 2, 2]
                ring = [[west, 0], [west+2, 0], [west+2, 2], [west, 2], [west, 0]]
                land = {'bbox': bounds, 'rings': [ring], 'kind': 'island'}
                w = {'id': filename, 'bbox': bounds, 'land': [land], 'water': [], 'owners': []}
                (directory / filename).write_text(json.dumps({'windows': [w]}))
            with self.assertRaisesRegex(GeometryError, 'overlapping lookup windows'):
                audit['audit'](directory, 'oceania')


if __name__ == '__main__':
    unittest.main()
