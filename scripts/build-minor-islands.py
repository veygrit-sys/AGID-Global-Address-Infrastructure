#!/usr/bin/env python3
"""Build the global Natural Earth minor island supplement with Python 3.12 and Shapely 2.1.2.

Inputs: positional ne_10m_minor_islands.geojson, ne_10m_land.geojson and
adm0_polygons.gpkg (unpacked from FieldMaps USGS/International). The output
keeps the physical source polygon and only assigns a region where the pinned
administrative land geometry overlaps. All calculations use WGS84 lon/lat.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sqlite3

from shapely import STRtree, clip_by_rect, from_wkb, get_parts, make_valid, prepare, union_all
from shapely.geometry import Point, Polygon, shape

SCALE = 1_000_000
ROOT = Path(__file__).resolve().parents[1]
MINOR_SHA = '8c933ca7a4760256bdc46408355706e39764b0fa01c160c28888b90b4faec29f'
LAND_SHA = '1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416'
GPKG_SHA = '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'
NE_BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/'
# The general physical map contains these detached shapes in addition to the minor layer.
ADDITIONAL_LAND = [(7, 1, 178.8518845423157, 71.211249), (7, 2771, 43.14667796374225, 12.714444),
                   (7, 2772, -89.95531402117044, 0.325804)]


def ensure_hash(path, expected):
    with path.open('rb') as data:
        if hashlib.file_digest(data, 'sha256').hexdigest() != expected:
            raise ValueError(f'Unexpected SHA-256 for {path}')


def polygons(g):
    if g.geom_type == 'Polygon' and not g.is_empty:
        yield g
    elif g.geom_type in ('GeometryCollection', 'MultiPolygon'):
        for child in get_parts(g):
            yield from polygons(child)


def decode_geopackage(blob):
    # GeoPackageBinary header, then an optional envelope preceding OGC WKB.
    if blob[:2] != b'GP':
        raise ValueError('Invalid GeoPackage binary header')
    envelope_bytes = [0, 32, 48, 48, 64][(blob[3] >> 1) & 7]
    return from_wkb(blob[8 + envelope_bytes:])


def pack_ring(coords):
    points = []
    for lon, lat, *_ in coords:
        p = (round(lon * SCALE), round(lat * SCALE))
        if not points or points[-1] != p:
            points.append(p)
    if len(set(points)) < 3:
        return None
    # Rotate for repeatability independent of GEOS start vertex.
    points.pop()
    start = points.index(min(points))
    points = points[start:] + points[:start]
    points.append(points[0])
    out = []
    previous = (0, 0)
    for point in points:
        for curr, prev in zip(point, previous):
            delta = curr - prev
            value = delta * 2 if delta >= 0 else -delta * 2 - 1
            while value >= 32:
                out.append(chr((value % 32) + 95))
                value //= 32
            out.append(chr(value + 63))
        previous = point
    return ''.join(out)


def pack_geometry(poly):
    exterior = pack_ring(poly.exterior.coords)
    if exterior is None:
        return None
    holes = [pack_ring(r.coords) for r in poly.interiors]
    # Do not fill a hole that is too small to preserve in the encoding.
    if None in holes:
        return None
    return [exterior, *sorted(holes)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('minor', type=Path)
    parser.add_argument('land', type=Path)
    parser.add_argument('gpkg', type=Path)
    parser.add_argument('--out', type=Path, default=ROOT / 'src/data/minorIslands')
    args = parser.parse_args()
    for path, sha in [(args.minor, MINOR_SHA), (args.land, LAND_SHA), (args.gpkg, GPKG_SHA)]:
        ensure_hash(path, sha)
    minor = [shape(f['geometry']) for f in json.loads(args.minor.read_text())['features']]
    land = json.loads(args.land.read_text())['features']
    for feature, part, lon, lat in ADDITIONAL_LAND:
        rings = land[feature]['geometry']['coordinates'][part]
        poly = Polygon(rings[0], rings[1:])
        if not poly.covers(Point(lon, lat)):
            raise ValueError('Physical island component failed source assertion')
        minor.append(poly)
    if any(p.covers(Point(0, 0)) for p in minor):
        raise ValueError('Unexpected fictional Null Island in the selected physical features')
    tree = STRtree(minor)
    intersections = [{} for _ in minor]
    db = sqlite3.connect(f'file:{args.gpkg}?mode=ro', uri=True)
    codes = dict(db.execute("select distinct iso_3, iso_2 from adm0_polygons where length(iso_2)=2"))
    territories = {}
    for iso, group, status, blob in db.execute('select iso_2, iso_3_grp, status_nm, geom from adm0_polygons order by fid'):
        # A politically unresolved source cannot establish an unambiguous country.
        settled = status in ('State', 'Special region or province', 'Non-self-governing territory', 'Territory/Self-governing territory')
        key = f'{iso}/{codes.get(group,"")}' if settled and iso and len(iso) == 2 else 'unresolved'
        if key != 'unresolved':
            territories[key] = [iso, codes.get(group)]
        for part in get_parts(decode_geopackage(blob)):
            hits = tree.query(part)
            if not len(hits):
                continue
            prepare(part)
            for idx in hits:
                island = minor[idx]
                if not part.intersects(island):
                    continue
                if part.covers(island):
                    piece = island
                else:
                    w, s, e, n = island.bounds
                    clipped = clip_by_rect(part, w - .00001, s - .00001, e + .00001, n + .00001)
                    if not clipped.is_valid:
                        clipped = make_valid(clipped)
                    piece = clipped.intersection(island)
                if piece.area > 0:
                    intersections[idx].setdefault(key, []).append(piece)
    db.close()
    args.out.mkdir(parents=True, exist_ok=True)
    counts = Counter()
    units = sorted({key for matches in intersections for key in matches if key != 'unresolved'})
    # Latitude bands cap the size of individual browser resources; exact bounding boxes
    # and the runtime's grid are applied before decoding a ring.
    rows = []
    for idx, (island, matches) in enumerate(zip(minor, intersections)):
        surface = pack_geometry(island)
        if surface is None:
            raise ValueError(f'Physical island {idx} would be lost at selected precision')
        extent = [round(x * SCALE) for x in island.bounds]
        areas = []
        unresolved_geometries = matches.pop('unresolved', [])
        unresolved = union_all(unresolved_geometries)
        for key, pieces in sorted(matches.items()):
            together = union_all(pieces).difference(unresolved) if unresolved_geometries else union_all(pieces)
            code = units.index(key)
            if together.equals(island):
                areas.append([code, None])
                continue
            # Preserve positive attribution after reducing high-resolution shoreline detail:
            # intersection with its original overlap prevents expansion into uncovered water.
            reduced = together.simplify(0.00005, preserve_topology=True).intersection(together)
            for poly in polygons(reduced):
                # Round to source precision; drop collapsed positive slivers instead of expanding them.
                packed = pack_geometry(poly)
                if packed:
                    areas.append([code, packed])
        rows.append([idx, extent, surface, areas])
        counts['full' if len(areas) == 1 and areas[0][1] is None else 'partial' if areas else 'unassigned'] += 1
    rows.sort(key=lambda row: (row[1][1], row[1][0], row[0]))
    encoded = [json.dumps(r, separators=(',', ':')) for r in rows]
    target = (sum(len(row) + 1 for row in encoded) + 7) // 8
    bands = [[] for _ in range(8)]
    offset = 0
    for row in encoded:
        bands[min(7, offset // target)].append(row)
        offset += len(row) + 1
    for i, band in enumerate(bands):
        (args.out / f'band{i}.json').write_text('[' + ','.join(band) + ']\n')
    manifest = {
        'source': 'natural-earth-10m-minor-islands', 'version': 'natural-earth-vector v5.1.2',
        'landSources': [NE_BASE + 'ne_10m_minor_islands.geojson', NE_BASE + 'ne_10m_land.geojson'],
        'landHashes': [MINOR_SHA, LAND_SHA], 'adminSource': 'fieldmaps-usgs-lsib', 'adminVersion': '2025-07-29',
        'adminUrl': 'https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip', 'adminGpkgSha256': GPKG_SHA,
        'terms': ['https://www.naturalearthdata.com/about/terms-of-use/', 'https://fieldmaps.io/data/adm0/#us-geological-survey-public-domain'],
        'scale': SCALE, 'adminCoastSimplificationDegrees': 0.00005,
        'usage': 'Physical land is preserved; simplified administrative overlaps are clipped back to their source geometry. No country is assigned to uncovered land.',
        'minorPhysicalFeatures': len(minor)-len(ADDITIONAL_LAND), 'additionalPhysicalFeatures': len(ADDITIONAL_LAND),
        'adminCoverageByPhysicalFeature': dict(sorted(counts.items())), 'units': [territories[k] for k in units]
    }
    (args.out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(counts)


if __name__ == '__main__':
    main()
