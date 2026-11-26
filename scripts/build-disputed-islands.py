#!/usr/bin/env python3
"""Rebuild the island-policy overlay with Python 3 and GDAL/GEOS.

Usage: python3 scripts/build-disputed-islands.py DISPUTES.geojson LAND.geojson MINOR_ISLANDS.geojson FIELD_MAPS.gpkg
Use the Natural Earth v5.1.2 GeoJSONs named below. No spatial tolerances, distance
buffers or rectangular territories are used when creating the published geometry.
"""
import hashlib
import json
from pathlib import Path
import sys

from osgeo import ogr

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    'ne_10m_admin_0_disputed_areas': '9cafef8b7dfb6b164dc58f218f981f4ace9f716f6c03795d4c62d1ac9f3d50f5',
    'ne_10m_land': '1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416',
    'ne_10m_minor_islands': '8c933ca7a4760256bdc46408355706e39764b0fa01c160c28888b90b4faec29f',
}
URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/'
SOURCE = 'island-dispute-overlay'
FIELD_SHA = '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'
FIELD_URL = 'https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip'
# Named or otherwise uniquely located FieldMaps features. Where a country
# geometry has many parts, require the indicated point to be on the island itself.
FIELD_FEATURES = {
    'B21': ('XHI', []), 'B85': ('XIB', []), 'B87': ('XDI', []),
    'B46': ('XSI', []), 'B47': ('XPI', []), 'B70': ('XSR', []),
    'B23': ('ATF_7', []), 'B24': ('ATF_6', []), 'B25': ('ATF_8', []),
    'B26': ('ATF_5', []), 'B27': ('ATF_4', []), 'B59': ('UMI_8', []),
    'B34': ('UMI_9', []), 'MACHIAS': ('XMA', []), 'IMIA': ('XIK', []),
    'B68': ('SAU', [(34.55, 27.956), (34.70, 27.944)]),
    'B52': ('GAB', [(9.378858, 0.809111)]), 'B73': ('IRN', [(55.03, 25.87)]),
    'TUNB-G': ('IRN', [(55.305, 26.266)]), 'TUNB-L': ('IRN', [(55.14722, 26.24194)]),
}
# Topology artefacts smaller than the square of one input coordinate step.
MIN_AREA = 1e-12


def verified_features(path, checksum):
    data = Path(path).read_bytes()
    if hashlib.sha256(data).hexdigest() != checksum:
        raise ValueError(f'Unexpected source checksum: {path}')
    return json.loads(data)['features']


def polygons(geometry):
    if not geometry or geometry.IsEmpty():
        return
    if geometry.GetGeometryName() == 'POLYGON':
        yield geometry
    elif geometry.GetGeometryName() in ('MULTIPOLYGON', 'GEOMETRYCOLLECTION'):
        for part in geometry:
            yield from polygons(part)


def overlaps(a, b):
    return a[0] <= b[1] and b[0] <= a[1] and a[2] <= b[3] and b[2] <= a[3]


def pack_ring(ring):
    coords = []
    for x, y, *_ in ring.GetPoints():
        p = [round(x, 7), round(y, 7)]
        if not coords or p != coords[-1]:
            coords.append(p)
    if len(set(map(tuple, coords))) < 3:
        return None
    # Stable start point and winding independent of input feature order.
    coords = coords[:-1] if coords[-1] == coords[0] else coords
    start = coords.index(min(coords))
    forward = coords[start:] + coords[:start]
    reverse = [forward[0], *forward[:0:-1]]
    ring = min(forward, reverse)
    return [*ring, ring[0]]


def pack_polygon(poly):
    if poly.Area() <= MIN_AREA:
        return None
    exterior = pack_ring(poly.GetGeometryRef(0))
    if exterior is None:
        return None
    holes = [pack_ring(poly.GetGeometryRef(i)) for i in range(1, poly.GetGeometryCount())]
    xs, ys = zip(*exterior)
    return {'bbox': [min(xs), min(ys), max(xs), max(ys)],
            'rings': [exterior, *sorted(h for h in holes if h)]}


def main():
    if len(sys.argv) != 5:
        raise SystemExit(__doc__)
    policy = json.loads((ROOT / 'src/data/islandDisputePolicies.json').read_text())
    disputes, land, minor = [verified_features(p, h) for p, h in zip(sys.argv[1:], FILES.values())]
    coast = []
    for feature in land + minor:
        geometry = ogr.CreateGeometryFromJson(json.dumps(feature['geometry']))
        for p in polygons(geometry):
            coast.append((p.GetEnvelope(), p.Clone()))
    covered = {}
    # Preserve superseded map extents solely for conservative "needs review" lookups.
    # The old outline can never provide positive land evidence in upgraded regions.
    review_bounds = {}
    for feature in disputes:
        key = feature['properties']['BRK_A3']
        if key not in policy:
            continue
        shape = ogr.CreateGeometryFromJson(json.dumps(feature['geometry']))
        review_bounds[key] = []
        for poly in polygons(shape):
            w, e, s, n = poly.GetEnvelope()
            review_bounds[key].append([w, s, e, n])
        if key in FIELD_FEATURES:
            continue
        clipped = []
        for part in polygons(shape):
            bbox = part.GetEnvelope()
            hits = [land_poly for bounds, land_poly in coast if overlaps(bbox, bounds)]
            for land_poly in hits:
                if part.Intersects(land_poly):
                    land_geom = land_poly if land_poly.IsValid() else land_poly.MakeValid()
                    clipped.extend(piece.Clone() for piece in polygons(part.Intersection(land_geom)))
        if not clipped:
            covered[key] = []
            continue
        multi = ogr.Geometry(ogr.wkbMultiPolygon)
        for p in clipped:
            multi.AddGeometry(p)
        footprints = [pack_polygon(p) for p in polygons(multi.UnionCascaded())]
        covered[key] = sorted((p for p in footprints if p), key=lambda p: (p['bbox'], p['rings']))
    with Path(sys.argv[4]).open('rb') as source:
        if hashlib.file_digest(source, 'sha256').hexdigest() != FIELD_SHA:
            raise ValueError('Unexpected FieldMaps source checksum')
    field = ogr.Open(sys.argv[4])
    layer = field.GetLayerByName('adm0_polygons')
    for key, (fid, seeds) in FIELD_FEATURES.items():
        layer.SetAttributeFilter(f"adm0_id='{fid}-20250729'")
        feature = layer.GetNextFeature()
        if not feature:
            raise ValueError(f'Missing {fid}')
        pins = [ogr.CreateGeometryFromWkt(f'POINT ({x} {y})') for x, y in seeds]
        parts = []
        for poly in polygons(feature.GetGeometryRef()):
            if not pins or any(poly.Contains(pin) for pin in pins):
                parts.append(pack_polygon(poly))
        if not parts or any(p is None for p in parts) or (pins and len(parts) != len(pins)):
            raise ValueError(f'Could not resolve the requested {key} land components')
        covered[key] = sorted(parts, key=lambda p: (p['bbox'], p['rings']))
    if set(covered) != set(policy):
        raise ValueError('A reviewed source feature disappeared')
    output = {
        'manifest': {'source': SOURCE, 'version': 'Natural Earth v5.1.2 + FieldMaps USGS 2025-07-29 / policy 2026-11-26',
                     'license': 'Public domain; Natural Earth and FieldMaps USGS coastline edition',
                     'inputs': [{'url': URL + n + '.geojson', 'sha256': h} for n, h in FILES.items()] + [{'url': FIELD_URL, 'gpkgSha256': FIELD_SHA}],
                     'unmappedPolicies': sorted(k for k,v in covered.items() if not v)},
        'groups': [{'id': k, 'polygons': covered[k], 'previousBounds': review_bounds.get(k, []) if k in FIELD_FEATURES else []} for k in sorted(covered) if covered[k]],
    }
    path = ROOT / 'src/data/disputedIslandGeometry.json'
    path.write_text(json.dumps(output, separators=(',', ':'), ensure_ascii=True) + '\n')
    print(f'{len(output["groups"])} groups, {sum(len(v) for v in covered.values())} polygons, {path.stat().st_size} bytes')
    print('No corroborating land geometry:', output['manifest']['unmappedPolicies'])


if __name__ == '__main__':
    main()
