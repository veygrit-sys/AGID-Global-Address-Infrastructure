#!/usr/bin/env python3
"""Compare checked-in Oceania surveys to the deployed TypeScript matcher. Needs Shapely 2 and npm ci."""
from itertools import product
import json
from pathlib import Path
import runpy
import subprocess

from shapely import STRtree
from shapely.geometry import Point, Polygon, box


SCRIPTS = Path(__file__).resolve().parent
topology = runpy.run_path(str(SCRIPTS / 'verify-americas-survey-polygons.py'))


def seam_fixture(shift, south):
    """A single island and an interior pond both cross the seam without a split edge."""
    def rect(w, s, e, n, **tags):
        geom = box(w + shift, s + south, e + shift, n + south)
        return {**tags, 'bbox': list(geom.bounds), 'rings': [list(geom.exterior.coords)]}

    island = rect(179.94, .01, 180.06, .075, kind='island')
    pond = rect(179.99, .03, 180.01, .055, kind='inland')
    island['rings'].extend(pond['rings'])
    admin = {**island, 'code': 'FJ'}
    del admin['kind']
    return dict(id=f'seam-fixture-{south}', name='seam fixture', source='test', attribution='test',
                version='test', evidenceUrls=[], bbox=[179.9 + shift, south, 180.1 + shift, south + .08],
                land=[island], owners=[admin], water=[pond, rect(180.07, 0, 180.1, .08, kind='ocean')])


def samples(window):
    w, s, e, n = window['bbox']
    scope = box(w, s, e, n)
    records = []
    points = set()

    def add_interior(geom):
        if geom.area > 0:
            points.add(geom.representative_point().coords[0])

    for group in ('land', 'water', 'owners'):
        for row in window[group]:
            shell, *holes = row['rings']
            p = Polygon(shell, holes)
            records.append((group, row, p))
            add_interior(p.intersection(scope))
            for hole in holes:
                add_interior(Polygon(hole).intersection(scope))
    for i, j in product(range(7), repeat=2):
        points.add((w + (e-w)*(i+.5)/7, s + (n-s)*(j+.5)/7))

    # Neighbouring longitudes and the exact seam must agree with planar PIP on
    # the window's own continuous branch. Include bounding boxes centred on and
    # across the seam, as used by the GPS-disk broad phase.
    query_centres = [(w, s), ((w+e)/2, (s+n)/2), (e, n), (e + (e-w)/3, (s+n)/2)]
    for seam in (-180, 180):
        if w < seam < e:
            for j in range(15):
                y = s + (j+.5)*(n-s)/15
                points.update((seam+delta, y) for delta in (-1e-7, 0, 1e-7))
            query_centres.extend((seam, s + f*(n-s)) for f in (.2, .5, .8))

    index = STRtree([p for _, _, p in records])
    result = []
    for x, y in sorted(points):
        pin = Point(x, y)
        # The TS edge test has a 1e-12 degree tolerance. Compare strictly
        # interior/exterior samples; the fixture probes both sides of the seam.
        near = [records[i] for i in index.query(pin, predicate='dwithin', distance=1e-10)]
        if any(p.boundary.distance(pin) < 1e-10 for _, _, p in near):
            continue
        hits = [(g, row) for g, row, p in near if p.contains(pin)]
        land = [r for g, r in hits if g == 'land']
        water = [r for g, r in hits if g == 'water']
        expected = dict(surface='unknown', kind=None, codes=[], ocean=None, island=None, sovereigns=[], review=True)
        if land:
            kind = land[0]['kind']
            owners = [r for g, r in hits if g == 'owners']
            codes = sorted({r['code'] for r in owners})
            expected.update(surface='land', kind=kind, codes=codes, review=len(codes) != 1)
            if kind == 'island':
                names = {r['name'] for r in land if r.get('name')}
                expected['island'] = next(iter(names)) if len(names) == 1 else None
                if len(codes) == 1:
                    expected['sovereigns'] = sorted({r.get('sovereignCode', r['code']) for r in owners})
        elif water:
            kind = water[0]['kind']
            expected.update(surface='water', kind=kind, review=False,
                            ocean=window.get('oceanRegion') if kind == 'ocean' else None)
        result.append(dict(id=window['id'], lat=y, lon=x, expected=expected))
    queries = []
    for x, y in query_centres:
        dx, dy = (e-w)/12, (n-s)/12
        bounds = box(x-dx, y-dy, x+dx, y+dy)
        shapes = []
        if bounds.intersects(scope):
            for group, row, polygon in records:
                if polygon.envelope.intersects(bounds):
                    shapes.append(['admin', row['bbox'], row['code']] if group == 'owners'
                                  else ['physical', row['bbox']])
        queries.append(dict(id=window['id'], bbox=bounds.bounds, expected=shapes))
    return result, queries


def batch(windows, fixture=False):
    data = {'points': [], 'queries': []}
    for window in windows:
        points, queries = samples(window)
        data['points'].extend(points)
        data['queries'].extend(queries)
    if fixture:
        data['fixture'] = windows
    return data


if __name__ == '__main__':
    data = topology['DATA']
    windows = [w for filename in topology['OCEANIA']
               for w in json.loads((data / filename).read_text(encoding='utf-8'))['windows']]
    if not any(w['bbox'][0] < seam < w['bbox'][2] for w in windows for seam in [-180, 180]):
        raise ValueError('Expected an Oceania survey spanning the antimeridian')
    live = batch(windows)
    fixture = batch([seam_fixture(0, .1), seam_fixture(-360, .3)], fixture=True)
    subprocess.run(['node', '--import', 'tsx', 'scripts/check-oceania-survey-runtime.ts'],
                   input=json.dumps([live, fixture]), text=True, check=True, cwd=SCRIPTS.parent)
    for label, cases in [('Published surveys', live), ('Antimeridian fixtures', fixture)]:
        print(f"{label}: {len(cases['points'])} point and {len(cases['queries'])} bounding-box samples, "
              "each in three longitude representations")
