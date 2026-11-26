#!/usr/bin/env python3
"""Build the packaged Pearl River Delta extract with Python >=3.11 and GDAL/OGR.

Unzip adm0_polygons.gpkg from the FieldMaps USGS International archive. Invoke
  python3 scripts/build-pearl-river-delta.py adm0_polygons.gpkg ne_10m_ocean.geojson
Sources and exact hashes are in the generated manifest. Only these small windows
are shipped. Longitude and latitude have seven decimal places; rings omit no
vertices other than consecutive duplicates after quantization.
"""
import argparse
import hashlib
import json
from pathlib import Path

from osgeo import ogr

LAND_URL = 'https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip'
LAND_SHA = '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'
OCEAN_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_ocean.geojson'
OCEAN_SHA = 'f9696a1337c746a0f6c8c13bc60d0f230d2ef8d105198d5657726c8f8e763fc2'
SCALE = 10_000_000
# Core uses these reviewed windows only. Clip geometry 0.02° *outside* the
# windows to exclude the manufactured clipping edges from point assessment.
WINDOWS = [
    ('Macao and Zhuhai', [113.48, 22.08, 113.65, 22.27]),
    ('Hong Kong and Shenzhen', [113.79, 22.09, 114.51, 22.67]),
]


def check(path, expected):
    with path.open('rb') as source:
        if hashlib.file_digest(source, 'sha256').hexdigest() != expected:
            raise ValueError(f'Unexpected SHA-256 for {path}')


def delta_string(points):
    out = []
    previous = (0, 0)
    for point in points:
        for value, old in zip(point, previous):
            delta = value - old
            grouped = delta * 2 if delta >= 0 else -delta * 2 - 1
            while grouped >= 32:
                out.append(chr(63 + (grouped % 32) + 32))
                grouped //= 32
            out.append(chr(63 + grouped))
        previous = point
    return ''.join(out)


def pack_polygon(geom):
    rings = []
    for ring in geom:
        points = []
        for x, y, *_ in ring.GetPoints():
            point = (round(x * SCALE), round(y * SCALE))
            if not points or points[-1] != point:
                points.append(point)
        # OGR provides closed exterior and interior rings.
        if points[0] != points[-1] or len(set(points)) < 3:
            raise ValueError('Quantization lost a ring')
        points.pop()
        start = points.index(min(points))
        points = points[start:] + points[:start]
        points.append(points[0])
        if not rings:
            xs, ys = zip(*points)
            bounds = [min(xs) / SCALE, min(ys) / SCALE, max(xs) / SCALE, max(ys) / SCALE]
        rings.append(delta_string(points))
    return {'bbox': bounds, 'rings': [rings[0], *sorted(rings[1:])]}


def polygons(geom):
    if geom is None or geom.IsEmpty():
        return
    if geom.GetGeometryName() == 'POLYGON':
        yield pack_polygon(geom)
    elif geom.GetGeometryName() in ['MULTIPOLYGON', 'GEOMETRYCOLLECTION']:
        for child in geom:
            yield from polygons(child)


def subset(layer, window, is_land):
    w, s, e, n = window
    w, s, e, n = w - .02, s - .02, e + .02, n + .02
    clip = ogr.CreateGeometryFromWkt(f'POLYGON (({w} {s}, {e} {s}, {e} {n}, {w} {n}, {w} {s}))')
    layer.SetSpatialFilter(clip)
    result = {}
    for feature in layer:
        code = feature.GetField('iso_2') if is_land else 'water'
        if is_land and code not in {'CN', 'MO', 'HK'}:
            raise ValueError(f'Unreviewed region {code}')
        geometry = feature.GetGeometryRef().Intersection(clip)
        result.setdefault(code, []).extend(polygons(geometry))
    return {key: sorted(parts, key=lambda p: (p['bbox'], p['rings'])) for key, parts in sorted(result.items())}


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('land', type=Path)
    args.add_argument('ocean', type=Path)
    inputs = args.parse_args()
    check(inputs.land, LAND_SHA)
    check(inputs.ocean, OCEAN_SHA)
    ogr.UseExceptions()
    land, ocean = ogr.Open(str(inputs.land)), ogr.Open(str(inputs.ocean))
    regions = []
    for name, bounds in WINDOWS:
        parts = subset(land.GetLayerByName('adm0_polygons'), bounds, True)
        parts.update(subset(ocean.GetLayer(), bounds, False))
        regions.append({'name': name, 'bbox': bounds, 'surfaces': parts})
    manifest = {
        'source_id': 'fieldmaps-usgs-lsib', 'source_name': 'FieldMaps International ADM0, USGS coastlines',
        'source_version': '2025-07-29', 'source_url': LAND_URL, 'gpkg_sha256': LAND_SHA,
        'archive_sha256': 'c7648c4ae781f87fdc316bae3d3a271c44d51f4ffd2379fba97207ea9bf2b360',
        'provider': 'FieldMaps, U.S. Department of State, U.S. Geological Survey',
        'license_or_terms': 'Public domain, https://fieldmaps.io/data/adm0/#us-geological-survey-public-domain',
        'ocean': {'source_id':'natural-earth-10m-ocean', 'source_version':'natural-earth-vector v5.1.2',
                  'source_url': OCEAN_URL, 'sha256': OCEAN_SHA, 'provider':'Natural Earth',
                  'license_or_terms': 'Public domain, https://www.naturalearthdata.com/about/terms-of-use/'},
        'coverage_region': [name for name, _ in WINDOWS], 'redistribution_status': 'Public domain',
        'allowed_use': 'Redistributable cartographic hints, including commercial use.',
        'transformed_fields': 'ADM0 land geometries and ocean polygons clipped to buffered windows in WGS84; longitude/latitude ring deltas at 1e-7 degrees.',
        'freshness': 'Both source inputs are checksum-pinned. Review reclamation and land-border fixtures before updating.',
        'confidence_notes': 'Coastal land representation can include inland rivers and reservoirs. Positive ocean overlap required to classify a land miss as water. Remaining gaps are unknown. Shorelines and reclaimed land depend on the survey vintage. No water jurisdiction asserted.',
    }
    result = {'manifest': manifest, 'scale': SCALE, 'windows': regions}
    output = Path(__file__).resolve().parents[1] / 'src/data/pearlRiverDelta.json'
    output.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
