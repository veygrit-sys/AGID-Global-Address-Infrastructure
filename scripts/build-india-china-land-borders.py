#!/usr/bin/env python3
"""Build the bundled India/China border survey with GDAL and Python 3.11+."""
import argparse
import hashlib
import json
from collections import defaultdict
from math import floor
from pathlib import Path

from osgeo import ogr

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'scripts/data/india-china-borders'
MAP_UNITS = '57da82be755f4afccd8f3b14251bb2752f5df1395f47d2d86f817470c4a48862'
FIELDMAPS = '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'
DISPUTES = '9cafef8b7dfb6b164dc58f218f981f4ace9f716f6c03795d4c62d1ac9f3d50f5'
NEIGHBOURS = {'IN': set('BD BT CN MM NP PK'.split()), 'CN': set('AF BT IN KG KP KZ LA MM MN NP PK RU TJ VN'.split())}
# Preserve the slope of source edges cut by finer survey windows. Even the
# largest signed delta remains within JavaScript's exact integer range.
SCALE = 1_000_000_000_000


def verified(path, digest):
    with path.open('rb') as file:
        if hashlib.file_digest(file, 'sha256').hexdigest() != digest:
            raise ValueError(f'Unexpected source digest: {path}')


def rectangle(bounds):
    w, s, e, n = bounds
    return ogr.CreateGeometryFromWkt(f'POLYGON (({w} {s},{e} {s},{e} {n},{w} {n},{w} {s}))')


def polygons(geometry):
    if geometry is None or geometry.IsEmpty():
        return
    kind = geometry.GetGeometryName()
    if kind == 'POLYGON' and geometry.Area() > 0:
        yield geometry
    elif kind in ('MULTIPOLYGON', 'GEOMETRYCOLLECTION'):
        for child in geometry:
            yield from polygons(child)


def dissolve(items):
    group = ogr.Geometry(ogr.wkbMultiPolygon)
    for item in items:
        for poly in polygons(item):
            group.AddGeometry(poly)
    return group.UnionCascaded() if group.GetGeometryCount() else group


def country_features(features):
    for feature in features:
        p = feature['properties']
        code = p['ISO_A2']
        if not (isinstance(code, str) and len(code) == 2 and code.isalpha()) or p['BRK_DIFF']:
            continue
        geo = feature['geometry']
        ringsets = [geo['coordinates']] if geo['type'] == 'Polygon' else geo['coordinates']
        for rings in ringsets:
            xs, ys = zip(*rings[0])
            if max(xs) >= 59 and min(xs) <= 139 and max(ys) >= 17 and min(ys) <= 56:
                yield code, rings


def border_tiles(units):
    wanted = set.union(*NEIGHBOURS.values())
    edges = defaultdict(set)
    for code, rings in units:
        if code in wanted:
            for ring in rings:
                for a, b in zip(ring, ring[1:]):
                    if a != b:
                        edges[tuple(sorted((tuple(a), tuple(b))))].add(code)
    tiles, segments = set(), defaultdict(int)
    for ((x, y), (xx, yy)), pair in edges.items():
        if len(pair) != 2 or not any(c in pair and neighbours & pair for c, neighbours in NEIGHBOURS.items()):
            continue
        segments['-'.join(sorted(pair))] += 1
        # Include both sides of lines and tripoints lying exactly on a tile edge.
        for i in range(floor(min(x, xx) - .04), floor(max(x, xx) + .04) + 1):
            for j in range(floor(min(y, yy) - .04), floor(max(y, yy) + .04) + 1):
                tiles.add((i, j))
    return tiles, dict(sorted(segments.items()))


def packed_polygon(poly):
    rings = []
    for ring in poly:
        out = []
        old = (0, 0)
        for x, y, *_ in ring.GetPoints():
            vertex = (round(x * SCALE), round(y * SCALE))
            if vertex == old:
                continue
            for a, b in zip(vertex, old):
                delta = a - b
                n = 2 * delta if delta >= 0 else -2 * delta - 1
                while n >= 32:
                    out.append(chr(95 + n % 32))
                    n //= 32
                out.append(chr(63 + n))
            old = vertex
        rings.append(''.join(out))
    w, e, s, n = poly.GetEnvelope()
    return {'bbox': [round(v, 12) for v in [w, s, e, n]], 'rings': rings}


def packed(geom):
    return sorted(map(packed_polygon, polygons(geom)), key=lambda p: (p['bbox'], p['rings']))


def build(unit_file, gpkg, dispute_file):
    verified(unit_file, MAP_UNITS)
    verified(gpkg, FIELDMAPS)
    verified(dispute_file, DISPUTES)
    units = list(country_features(json.loads(unit_file.read_bytes())['features']))
    tiles, counts = border_tiles(units)
    extent = dissolve(rectangle([x, y, x + 1, y + 1]) for x, y in sorted(tiles))
    policy = json.loads((CONFIG / 'disputes.json').read_text())
    masks = {}
    records = []
    coverage = []
    for feature in json.loads(dispute_file.read_bytes())['features']:
        props = feature['properties']
        key = props['BRK_A3']
        if key not in policy['parties']:
            continue
        shape = ogr.CreateGeometryFromJson(json.dumps(feature['geometry']))
        codes = policy['parties'][key]
        masks[key] = shape
        records.append({'tier': 'dispute', 'id': key, 'name': props['BRK_NAME'], 'codes': codes,
                        'evidenceUrls': policy['sources']['-'.join(codes)], 'parts': packed(shape)})
        coverage.append(shape)
    if masks.keys() != policy['parties'].keys():
        raise ValueError('Missing reviewed dispute shape')
    disputed = dissolve(masks.values())

    # Remove a higher resolution source's entire reviewed footprint from the
    # lower tier, including source gaps. A missing shape must not be backfilled.
    windows = json.loads((CONFIG / 'crossings.json').read_text())
    fine_extent = dissolve(rectangle(w['bbox']) for w in windows)
    admin = ogr.Open(str(gpkg))
    layer = admin.GetLayerByName('adm0_polygons')
    fine = defaultdict(list)
    for window in windows:
        box = rectangle(window['bbox'])
        layer.SetSpatialFilter(box)
        sides = defaultdict(list)
        for feature in layer:
            code = feature['iso_2']
            for p in polygons(feature.geometry().Intersection(box)):
                if code not in window['codes'] or feature['status_nm'] != 'State' or feature['wld_notes']:
                    raise ValueError(f'Unreviewed unit {code} at {window["name"]}')
                sides[code].append(p.Clone())
        if set(sides) != set(window['codes']):
            raise ValueError(f'Incomplete source at {window["name"]}')
        left, right = (dissolve(sides[c]) for c in window['codes'])
        if left.Boundary().Intersection(right.Boundary()).Length() == 0:
            raise ValueError(f'No shared line at {window["name"]}')
        for code, ps in sides.items():
            fine[code].extend(ps)
    coarse_extent = extent.Difference(fine_extent).Difference(disputed)
    review = json.loads((CONFIG / 'review.json').read_text())
    review_extent = dissolve(rectangle(r['bbox']) for r in review)
    coarse = defaultdict(list)
    for code, rings in units:
        poly = ogr.CreateGeometryFromJson(json.dumps({'type': 'Polygon', 'coordinates': rings}))
        if poly.Intersects(coarse_extent):
            coarse[code].append(poly.Intersection(coarse_extent))
    for tier, by_country in [('crossing', fine), ('regional', coarse)]:
        for code, areas in sorted(by_country.items()):
            shape = dissolve(areas)
            if tier == 'crossing':
                shape = shape.Difference(disputed)
            else:
                shape = shape.Difference(review_extent)
            parts = packed(shape)
            if parts:
                records.append({'tier': tier, 'codes': [code], 'parts': parts})
                coverage.append(shape)
    for risk in review:
        # Data-quality masks withhold the coarse hint; they assert no claim.
        shape = rectangle(risk['bbox']).Intersection(coarse_extent)
        if not shape.IsEmpty():
            records.append({'tier': 'review', 'id': risk['id'], 'name': risk['name'],
                            'codes': [], 'evidenceUrls': risk['sources'], 'parts': packed(shape)})
            coverage.append(shape)
    return {'scale': SCALE, 'sharedSegments': counts, 'tileCount': len(tiles),
            'crossingCount': len(windows), 'records': records,
            'coverage': packed(dissolve(coverage))}


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__)
    for arg in ('map_units', 'fieldmaps_gpkg', 'disputed_areas'):
        ap.add_argument(arg, type=Path)
    ap.add_argument('--output', type=Path, default=ROOT / 'src/data/indiaChinaLandBorders.json')
    args = ap.parse_args()
    ogr.UseExceptions()
    data = build(args.map_units, args.fieldmaps_gpkg, args.disputed_areas)
    args.output.write_text(json.dumps(data, separators=(',', ':'), ensure_ascii=False) + '\n')
