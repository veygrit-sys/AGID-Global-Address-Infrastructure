#!/usr/bin/env python3
"""Measure point-attribution coverage of every distinct full-resolution GSHHG island.

Output counts report source evidence at an interior sample. They do not assign
one country to a whole island. Run against a pack built by island-evidence-pack.py.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import sqlite3
import zlib
from osgeo import ogr


def shape(wkb):
    return ogr.CreateGeometryFromWkb(zlib.decompress(wkb))


def audit(path):
    db = sqlite3.connect(f'{path.resolve().as_uri()}?mode=ro', uri=True)
    db.execute('CREATE VIRTUAL TABLE temp.pins USING rtree(id, west, east, south, north)')
    # One interior sample per island ID, on its largest represented fragment.
    samples = {}
    for level, gid, blob in db.execute('SELECT level,physical_id,wkb FROM coast WHERE level IN (1,3,6)'):
        polygon = shape(blob)
        key, area = int(gid), polygon.GetArea()
        if key in samples and samples[key][0] >= area:
            continue
        point = polygon.PointOnSurface()
        samples[key] = (area, level, point.GetX(), point.GetY())
    db.executemany('INSERT INTO temp.pins VALUES (?,?,?,?,?)',
                   ((gid, x, x, y, y) for gid, (_, _, x, y) in samples.items()))
    regions, uncertain, water = {}, set(), set()

    def covering_samples(bbox, blob):
        west, east, south, north = bbox
        candidates = db.execute('SELECT id FROM temp.pins WHERE west<=? AND east>=? AND south<=? AND north>=?',
                                (east, west, north, south)).fetchall()
        if not candidates:
            return
        polygon = shape(blob)
        prepared = polygon.CreatePreparedGeometry()
        point = ogr.Geometry(ogr.wkbPoint)
        for (gid,) in candidates:
            _, _, x, y = samples[gid]
            point.SetPoint_2D(0, x, y)
            if prepared.Intersects(point):
                yield gid

    # A lake can contain a level-3 island, which is tested against level-4 ponds.
    for level, west, east, south, north, blob in db.execute(
            'SELECT c.level,b.west,b.east,b.south,b.north,c.wkb FROM coast c JOIN coast_box b ON b.id=c.id WHERE level IN (2,4)'):
        for key in covering_samples((west, east, south, north), blob):
            if level == 4 or samples[key][1] != 3:
                water.add(key)
    for code, disputed, west, east, south, north, blob in db.execute(
            'SELECT r.code,r.disputed,b.west,b.east,b.south,b.north,a.wkb FROM administrative a '
            'JOIN region r ON r.id=a.region_id JOIN administrative_box b ON b.id=a.id'):
        for key in covering_samples((west, east, south, north), blob):
            if code:
                regions.setdefault(key, set()).add(code)
            if disputed:
                uncertain.add(key)
    counts = Counter()
    for key in samples:
        if key in water:
            result = 'sampleInSourceWater'
        elif key in uncertain:
            result = 'disputedOrFlaggedSourceUnit'
        elif len(regions.get(key, ())) == 1:
            result = 'singleAdministrativeRegionAtSample'
        elif key in regions:
            result = 'multipleAdministrativeRegionsAtSample'
        else:
            result = 'noAdministrativeCodeAtSample'
        counts[result] += 1
    db.close()
    return {'totalDistinctIslandIds': len(samples), 'sampleClassification': dict(sorted(counts.items()))}


def independent_components(path):
    """Conservative lower bound for isolated small source components.

    Each complete expanded rectangular extent must be disjoint from every
    other source polygon. A positive result implies the less restrictive
    whole-polygon separation test used by the point-query fallback.
    """
    db = sqlite3.connect(f'{path.resolve().as_uri()}?mode=ro', uri=True)
    gap = 0.001
    items = db.execute(
        'SELECT b.id,b.west,b.east,b.south,b.north,r.code,r.disputed FROM administrative_box b '
        'JOIN administrative a ON a.id=b.id JOIN region r ON r.id=a.region_id '
        'WHERE b.east-b.west<2 AND b.north-b.south<2 AND b.west>-179.999 AND b.east<179.999').fetchall()
    candidates = {row[0]: row[1:] for row in items}
    db.execute('CREATE VIRTUAL TABLE temp.extent USING rtree(id, west, east, south, north)')
    db.executemany('INSERT INTO temp.extent VALUES(?,?,?,?,?)',
                   ((key, w-gap, e+gap, s-gap, n+gap) for key,w,e,s,n,_,_ in items))
    nearby_count = Counter()
    for key,w,e,s,n in db.execute('SELECT id,west,east,south,north FROM administrative_box'):
        neighbors = db.execute(
            'SELECT id FROM temp.extent WHERE west<=? AND east>=? AND south<=? AND north>=? AND id<>?',
            (e,w,n,s,key)).fetchall()
        # Defer geometry decode until at least one candidate still needs it.
        neighbors = [other for (other,) in neighbors if other in candidates]
        if not neighbors:
            continue
        polygon = shape(db.execute('SELECT wkb FROM administrative WHERE id=?', (key,)).fetchone()[0])
        prepared = polygon.CreatePreparedGeometry()
        for other in neighbors:
            nearby_count[other] += 1
            if nearby_count[other] > 64:
                del candidates[other]
                continue
            west,east,south,north,_,_ = candidates[other]
            west -= gap; east += gap; south -= gap; north += gap
            ring = ogr.Geometry(ogr.wkbLinearRing)
            for x,y in ((west,south),(west,north),(east,north),(east,south),(west,south)):
                ring.AddPoint_2D(x,y)
            box = ogr.Geometry(ogr.wkbPolygon)
            box.AddGeometry(ring)
            if prepared.Intersects(box):
                del candidates[other]
    flags = Counter('flagged' if row[-1] else 'coded' if row[-2] else 'noCode' for row in candidates.values())
    regions = {row[-2] for row in candidates.values() if row[-2] and not row[-1]}
    db.close()
    return {'eligibleSmallAdministrativeComponents':len(items),
            'isolatedWholeExtents':len(candidates), 'rawRegionalEvidence':dict(sorted(flags.items())),
            'distinctUnflaggedRegionalCodes':len(regions)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pack', type=Path)
    parser.add_argument('--fieldmaps-components', action='store_true')
    args = parser.parse_args()
    ogr.UseExceptions()
    print(json.dumps(independent_components(args.pack) if args.fieldmaps_components else audit(args.pack), indent=2))
