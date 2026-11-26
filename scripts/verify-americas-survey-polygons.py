#!/usr/bin/env python3
"""Verify the North American and Caribbean surveyRegion polygons. Requires Shapely 2."""
from collections import Counter, defaultdict
from itertools import combinations
import json
from math import isclose, isfinite
from pathlib import Path
import re
import sys

from shapely import STRtree
from shapely.geometry import Polygon, box
from shapely.validation import explain_validity


DATA = Path(__file__).resolve().parents[1] / 'src' / 'data'
# Windows of different priority may nest. Two windows of the same priority
# overlap only at their edges: otherwise match() would depend on array order.
FILES = {
    0: ['usMexicoReviewed', 'northernCentralAmericaReviewed', 'southernCentralAmericaReviewed'],
    1: ['canadaArcticReviewed', 'canadaAtlanticReviewed', 'canadaFreshwaterReviewed',
        'canadaHudsonReviewed', 'canadaPacificReviewed', 'caribbeanTerritorialIslandsReviewed',
        'greaterAntillesIslandsReviewed', 'lesserAntillesIslandsReviewed', 'usAtlanticIslandsReviewed',
        'usPacificIslandsReviewed', 'usPacificTerritoriesReviewed'],
}
# Positive interior overlap in square degrees, at most 0.013 m² at the equator.
# Line/point contacts carry zero area and are legal at any scale.
AREA_EPS = 1e-12


class GeometryError(ValueError):
    pass


def require(ok, message):
    if not ok:
        raise GeometryError(message)


def valid_point(point):
    return (isinstance(point, (list, tuple)) and len(point) == 2
            and all(type(n) in (int, float) and isfinite(n) for n in point)
            and -180 <= point[0] <= 180 and -90 <= point[1] <= 90)


def valid_box(bounds):
    return (isinstance(bounds, list) and len(bounds) == 4
            and valid_point(bounds[:2]) and valid_point(bounds[2:])
            and bounds[0] < bounds[2] and bounds[1] < bounds[3])


def read_polygon(record, label):
    rings = record.get('rings')
    require(isinstance(rings, list) and rings, f'{label}: missing rings')
    for i, ring in enumerate(rings):
        require(isinstance(ring, list) and len(ring) >= 4 and all(map(valid_point, ring)),
                f'{label} ring {i}: expected four or more finite WGS84 positions')
        require(ring[0] == ring[-1], f'{label} ring {i}: open ring')
        require(all(a != b for a, b in zip(ring, ring[1:])), f'{label} ring {i}: zero-length edge')
    shape = Polygon(rings[0], rings[1:])
    require(shape.is_valid and not shape.is_empty and shape.area > 0, f'{label}: {explain_validity(shape)}')
    bounds = record.get('bbox')
    require(valid_box(bounds) and all(isclose(a, b, abs_tol=1e-9, rel_tol=0)
                                      for a, b in zip(shape.bounds, bounds)), f'{label}: bbox differs from rings')
    return shape


def check_overlaps(entries, scope, counts):
    shapes = [shape for _, _, _, shape in entries]
    tree = STRtree(shapes)
    for i, (group, index, record, shape) in enumerate(entries):
        for j in tree.query(shape):
            if j <= i:
                continue
            other_group, other_index, other, candidate = entries[j]
            # Independent administrative polygons may include water or land
            # with no corroborated shoreline. Only the physical layers decide wet/dry.
            if (group == 'owners') != (other_group == 'owners'):
                continue
            overlap = shape.intersection(candidate).intersection(scope)
            if overlap.area <= AREA_EPS:
                continue
            if group == 'owners' and record['code'] != other['code']:
                counts['distinct-owner intersections'] += 1
                continue
            witness = overlap.representative_point()
            raise GeometryError(f'{group}[{index}] overlaps {other_group}[{other_index}] near '
                                f'({witness.x:.7f}, {witness.y:.7f})')


def check_window(window, counts):
    bounds = window.get('bbox')
    require(valid_box(bounds), 'invalid WGS84 window bbox')
    scope = box(*bounds)
    entries = []
    for group in ('land', 'water', 'owners'):
        rows = window.get(group)
        require(isinstance(rows, list), f'missing {group} array')
        seen = set()
        for i, row in enumerate(rows):
            label = f'{group}[{i}]'
            require(isinstance(row, dict), f'{label}: expected polygon record')
            if group == 'owners':
                require(isinstance(row.get('code'), str) and re.fullmatch(r'[A-Z]{2}', row['code']),
                        f'{label}: invalid region code')
            else:
                kinds = ('island', 'mainland') if group == 'land' else ('ocean', 'inland')
                require(row.get('kind') in kinds, f'{label}: invalid {group} kind')
            polygon = read_polygon(row, label)
            key = (row.get('code'), polygon.normalize().wkb)
            require(key not in seen, f'{label}: duplicate polygon')
            seen.add(key)
            entries.append((group, i, row, polygon))
            counts[group] += 1
            counts['holes'] += len(polygon.interiors)
    require(any(group != 'owners' and polygon.intersection(scope).area > 0
                for group, _, _, polygon in entries), 'no physical evidence inside lookup window')
    check_overlaps(entries, scope, counts)
    counts['windows'] += 1
    return scope


def audit(data):
    counts = Counter()
    scopes = defaultdict(list)
    ids = set()
    tiers = {tier: [data / (name + '.json') for name in names] for tier, names in FILES.items()}
    # Region loaders import these finer extracts when available. New North American or
    # Caribbean detail files are checked automatically, including before they are wired.
    tiers[2] = sorted([*data.glob('na*PolygonDetail.json'), *data.glob('caribbean*PolygonDetail.json')])
    for tier, paths in tiers.items():
        for path in paths:
            windows = json.loads(path.read_text(encoding='utf-8')).get('windows')
            require(isinstance(windows, list) and windows, f'{path.name}: empty survey')
            for window in windows:
                key = window.get('id')
                require(isinstance(key, str) and key and key not in ids, f'{path.name}: missing or repeated window id {key!r}')
                ids.add(key)
                try:
                    scopes[tier].append((key, check_window(window, counts)))
                except GeometryError as error:
                    raise GeometryError(f'{path.name} / {key}: {error}') from error
    for tier, windows in scopes.items():
        for (a, first), (b, second) in combinations(windows, 2):
            require(first.intersection(second).area <= AREA_EPS,
                    f'priority {tier}: overlapping lookup windows {a} and {b}')
    return counts


if __name__ == '__main__':
    try:
        totals = audit(DATA)
    except (GeometryError, OSError, json.JSONDecodeError) as exc:
        sys.exit(str(exc))
    print('Survey topology verified: ' + ', '.join(f'{totals[k]} {k}' for k in
          ('windows', 'land', 'water', 'owners', 'holes', 'distinct-owner intersections')))
