#!/usr/bin/env python3
"""Build WGS84 physical and administrative layers for the checked US/CA windows.

Requires Python 3.11+, GDAL 3, NumPy and Shapely 2. See the sources and build
command in docs/us-canada-shorelines.md. Whole input files are SHA-256 pinned.
The coverage windows select source geometry; they convey no territorial status.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import tempfile
import zipfile

import numpy as np
from osgeo import ogr, osr
import shapely

ROOT = Path(__file__).resolve().parents[1]
WINDOWS = ROOT / 'scripts/data/us-canada-windows.json'
OUTPUT = ROOT / 'src/data/us-canada-shorelines'
SCALE = 1_000_000
PADDING = 0.02  # Keep artificial clip edges outside the area in which pins are assessed.
PAGE_BYTES = 185_000
GSHHG_SHA = '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41'
FIELDMAPS_SHA = '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'
STATCAN_SHA = 'd28bbb15d7b49e3d1828755a5f1b4ebcee699ad70efe8b0f1b902d29ebffd20b'
CONTINENTS = {0, 1, 2, 3, 5, 6}  # GSHHG 2.3.7, as in island-evidence-pack.py


def check(path, expected):
    with path.open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != expected:
            raise ValueError(f'Unexpected source edition: {path.name}')


def polygons(geom):
    if geom.is_empty:
        return
    if geom.geom_type == 'Polygon':
        yield geom
    elif geom.geom_type in ('MultiPolygon', 'GeometryCollection'):
        for piece in geom.geoms:
            yield from polygons(piece)


def put_signed(buf, n):
    n = 2 * n if n >= 0 else -2 * n - 1
    while n >= 128:
        buf.append(128 | (n & 127))
        n >>= 7
    buf.append(n)


def encode_ring(coords):
    buf = bytearray()
    x = y = 0
    for u, v in coords[:-1]:
        put_signed(buf, int(u) - x)
        put_signed(buf, int(v) - y)
        x, y = int(u), int(v)
    return base64.b64encode(buf).decode('ascii')


def packed(poly):
    # All rings and their holes survive the same fixed-precision quantization.
    # GEOS drops only features that collapse below that precision.
    snapped = shapely.set_precision(poly, 1 / SCALE)
    for piece in polygons(snapped):
        yield {'bbox': [round(v, 6) for v in piece.bounds], 'rings': [
            encode_ring(np.rint(np.asarray(r.coords) * SCALE).astype(np.int64))
            for r in [piece.exterior, *piece.interiors]]}


def padded(bbox):
    west, south, east, north = bbox
    return (west-PADDING, south-PADDING, east+PADDING, north+PADDING)


def meets(a, b):
    return a[0] <= b[2] and b[0] <= a[2] and a[1] <= b[3] and b[1] <= a[3]


def clip(geom, bbox):
    piece = shapely.clip_by_rect(geom, *bbox)
    if not piece.is_valid:
        piece = shapely.make_valid(piece)
    return piece


def ogr_parts(src):
    if src.GetGeometryName() == 'POLYGON':
        yield src
    else:
        yield from src


def add_source(src, windows, field, attrs, bbox_transform=None, to_wgs=None):
    extents = [(win, padded(win['bbox'])) for win in windows]
    boxes = [(win, extent, bbox_transform.TransformBounds(*extent, 21) if bbox_transform else extent)
             for win, extent in extents]
    for poly in ogr_parts(src):
        w, e, s, n = poly.GetEnvelope()
        candidates = []
        for window, extent, source_box in boxes:
            if meets((w, s, e, n), source_box):
                candidates.append((window, extent))
        if not candidates:
            continue
        # Only transform whole source components whose envelope is near a window.
        if to_wgs:
            poly = poly.Clone()
            if poly.Transform(to_wgs) != 0:
                raise ValueError('Invalid coordinate transformation')
        geom = shapely.from_wkb(bytes(poly.ExportToWkb()))
        for window, extent in candidates:
            for intersecting in polygons(clip(geom, extent)):
                if field == 'owners' and attrs['source'] == 'statcan' and window['id'] in LAKES:
                    window['canadian'].append(intersecting)
                for shape in packed(intersecting):
                    if meets(shape['bbox'], window['bbox']):
                        window[field].append({**attrs, **shape})


def read_physical(archive, windows):
    check(archive, GSHHG_SHA)
    for level in range(1, 5):
        stem = f'GSHHS_shp/f/GSHHS_f_L{level}'
        ds = ogr.Open(f'/vsizip/{archive.resolve()}/{stem}.shp')
        for feature in ds.GetLayer():
            gid = int(feature['id'].split('-')[0])
            kind = 'inland-water' if level in (2, 4) else 'island'
            if level == 1 and gid in CONTINENTS:
                kind = 'mainland'
            add_source(feature.geometry(), windows, 'physical', {'level': level, 'id': gid, 'kind': kind})
        ds = None


def read_fieldmaps(path, windows):
    check(path, FIELDMAPS_SHA)
    ds = ogr.Open(str(path))
    layer = ds.GetLayerByName('adm0_polygons')
    # These particular windows are away from all third states and the unsettled
    # Machias Seal Island / North Rock group. Fail if any additional ADM0 feature
    # overlaps, so changing a window cannot quietly drop another jurisdiction.
    for f in layer:
        w, e, s, n = f.geometry().GetEnvelope()
        if not any(meets((w, s, e, n), padded(win['bbox'])) for win in windows):
            continue
        code = f['iso_2']
        attrs = {'code': code, 'source': 'fieldmaps'}
        before = sum(len(win['owners']) for win in windows)
        add_source(f.geometry(), windows, 'owners', attrs)
        after = sum(len(win['owners']) for win in windows)
        if after != before and (code not in ('CA', 'US') or f['status_nm'] != 'State'):
            raise ValueError(f'Unsupported ADM0 feature {f["adm0_name"]}')
    ds = None


def read_statcan(archive, windows):
    check(archive, STATCAN_SHA)
    stem = 'lpr_000b21a_e'
    ds = ogr.Open(f'/vsizip/{archive.resolve()}/{stem}.shp')
    layer = ds.GetLayer()
    source = layer.GetSpatialRef().Clone()
    wgs = osr.SpatialReference()
    wgs.ImportFromEPSG(4326)
    for crs in (source, wgs):
        crs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    reverse = osr.CoordinateTransformation(wgs, source)
    forward = osr.CoordinateTransformation(source, wgs)
    for feature in layer:
        add_source(feature.geometry(), windows, 'owners', {'code': 'CA', 'source': 'statcan'}, reverse, forward)
    ds = None


LAKES = ('lake-erie', 'isle-royale', 'thousand-islands')
ONTARIO_SHA = 'aac446c8ac78ff6d9d7d899b16f05d31fe4dfe811c2b8df95b0cd5e120e0e155'
CENSUS = {
    '26083': ('isle-royale', '63548949e4892c7caa30f9ee16adf7eeef91a1a1edf057ca7d208689ae8de692'),
    '36045': ('thousand-islands', '10ec24be983fbee169642f91dfb15136309f71ca9ec34772bf71d00a318ce515'),
    '39043': ('lake-erie', '3e1da4dee2ffcfd14be49d92aafb015fc9c93d1d9cc98503cf0df2223f8a1a01'),
    '39123': ('lake-erie', 'ec0e8ce3303a9e0540a02deb7993dba0c945760998841f50679a956c6e90d357'),
}


def wgs_transform(layer):
    source = layer.GetSpatialRef().Clone()
    target = osr.SpatialReference()
    target.ImportFromEPSG(4326)
    for crs in (source, target):
        crs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    return osr.CoordinateTransformation(source, target)


def to_wgs(geometry, transform):
    geom = geometry.Clone()
    if geom.Transform(transform) != 0:
        raise ValueError('Invalid coordinate transformation')
    return shapely.from_wkb(bytes(geom.ExportToWkb()))


def append_physical(window, shape, level, gid, kind, source):
    for p in polygons(shape):
        for row in packed(p):
            if meets(row['bbox'], window['bbox']):
                window['physical'].append({'level': level, 'id': gid, 'kind': kind, 'source': source, **row})


def read_lake_sources(directory, ontario, windows):
    lakes = {win['id']: win for win in windows if win['id'] in LAKES}
    water = {wid: [] for wid in lakes}
    holes = {wid: [] for wid in lakes}
    named = []
    for county, (wid, digest) in CENSUS.items():
        archive = directory / f'tl_2025_{county}_areawater.zip'
        check(archive, digest)
        ds = ogr.Open(f'/vsizip/{archive.resolve()}')
        layer = ds.GetLayer()
        transform = wgs_transform(layer)
        extent = padded(lakes[wid]['bbox'])
        for f in layer:
            if f['MTFCC'] not in ('H2030', 'H2051', 'H3010'):
                continue  # Only mapped lake/pond, bay and river surface.
            shape = to_wgs(f.geometry(), transform)
            if not meets(shape.bounds, extent):
                continue
            boundary = clip(shape, extent)
            if not boundary.is_empty:
                water[wid].append(boundary)
            # A hole entirely encircled by this water feature can corroborate a
            # catalogued island. Do not treat absences along a county edge as land.
            for p in polygons(shape):
                for j, ring in enumerate(p.interiors, start=1):
                    island = shapely.Polygon(ring)
                    if meets(island.bounds, extent):
                        holes[wid].append(clip(island, extent))
                        if f['HYDROID'] == '11033746731269' and j in (6, 30):
                            # Pinned complete Lake Superior polygon: the two rings
                            # enclose Isle Royale and Mott Island respectively.
                            named.append((j, clip(island, extent)))
        ds = None
    if {i for i, _ in named} != {6, 30}:
        raise ValueError('Lake Superior named island rings changed')
    for wid, win in lakes.items():
        wet = shapely.union_all(water[wid], grid_size=1 / SCALE)
        win['lakeWater'] = wet
        win['usHoles'] = shapely.union_all(holes[wid], grid_size=1 / SCALE)
        win['caFootprint'] = shapely.union_all(win['canadian'], grid_size=1 / SCALE)
        for i, poly in enumerate(polygons(wet)):
            append_physical(win, poly, 4, -1_000_000-i, 'inland-water', 'census-hydro')
    for j, area in named:
        win = lakes['isle-royale']
        append_physical(win, area.difference(win['lakeWater']), 3, -2_000_000-j, 'island', 'census-hydro')

    check(ontario, ONTARIO_SHA)
    with tempfile.TemporaryDirectory() as tmp:
        source = 'GreatLakes_islands/Great_Lakes_Islands_April2010.zip'
        with zipfile.ZipFile(ontario) as outer:
            inner_path = Path(outer.extract(source, tmp))
        ds = ogr.Open(f'/vsizip/{inner_path}')
        layer = ds.GetLayer()
        transform = wgs_transform(layer)
        for f in layer:
            if f['ISL_TYPE'] not in ('Island', 'Natural') or f['COUNTRY'] not in ('CAN', 'US'):
                continue  # Catalog also includes reefs, shoals, exposed rocks, causeways and uncertain features.
            for win in lakes.values():
                extent = padded(win['bbox'])
                w, e, s, n = f.geometry().GetEnvelope()
                if not meets((w, s, e, n), extent):
                    continue
                source = clip(to_wgs(f.geometry(), transform), extent)
                support = win['caFootprint'] if f['COUNTRY'] == 'CAN' else win['usHoles']
                land = source.intersection(support, grid_size=1 / SCALE).difference(win['lakeWater'])
                append_physical(win, land, 3, -1-f.GetFID(), 'island', 'ontario-islands')


# GeoJSON (WGS84), queried with the three stable feature IDs and ordered by OGF_ID.
# The exact public request URL is in docs/us-canada-shorelines.md.
OHN_RIVER_SHA = '66ff9dc8744c7d3b0dfed348746393175e1952b65038c0375bf533e84fa15193'


def read_ontario_river(path, windows):
    check(path, OHN_RIVER_SHA)
    data = json.loads(path.read_bytes())
    win = next(w for w in windows if w['id'] == 'thousand-islands')
    areas = []
    for feature in data['features']:
        attrs = feature['properties']
        if attrs['PERMANENCY'] != 'Permanent' or attrs['OFFICIAL_NAME_LABEL'] != 'St. Lawrence River':
            raise ValueError('Unexpected Ontario Hydro Network feature')
        areas.append(clip(shapely.geometry.shape(feature['geometry']), padded(win['bbox'])))
    # Source sections have internal survey edges. Dissolve them so a pin on a
    # section join stays in the river. The exterior and all island holes remain.
    water = shapely.union_all(areas, grid_size=1 / SCALE)
    append_physical(win, water, 4, -3_000_000, 'inland-water', 'ontario-hydro')


def json_text(obj):
    return json.dumps(obj, separators=(',', ':'), ensure_ascii=True)


def write(windows, out):
    out.mkdir(exist_ok=True, parents=True)
    imports = []
    entries = []
    files = {}
    for wi, win in enumerate(windows):
        fields = [f'id: {json_text(win["id"])}', f'bbox: {json_text(win["bbox"])}']
        for field in ('physical', 'owners'):
            pages, page, size = [], [], 2
            large_shapes = []
            for feature in win[field]:
                row = json_text(feature)
                if len(row) > PAGE_BYTES:
                    # Store the rings of one large polygon in bounded source files,
                    # preserving the original polygon without introducing cut edges.
                    ring_pages, rings, ring_size = [], [], 2
                    for ring in feature['rings']:
                        if len(ring) + 6 > PAGE_BYTES:
                            raise ValueError(f'Oversize source ring: {win["id"]} {len(ring)}')
                        if ring_size + len(ring) + 3 > PAGE_BYTES and rings:
                            ring_pages.append(rings)
                            rings, ring_size = [], 2
                        rings.append(ring)
                        ring_size += len(ring) + 3
                    ring_pages.append(rings)
                    names = []
                    for ri, group in enumerate(ring_pages):
                        stem = f'{win["id"]}-{field}-rings-{len(large_shapes)}-{ri}'
                        binding = f'{field}{wi}rings{len(large_shapes)}_{ri}'
                        imports.append(f"import {binding} from './{stem}.json';")
                        files[f'{stem}.json'] = json_text(group) + '\n'
                        names.append('...' + binding)
                    metadata = {k: v for k, v in feature.items() if k != 'rings'}
                    large_shapes.append('{ ...' + json_text(metadata) + ', rings: [' + ', '.join(names) + '] }')
                    continue
                if size + len(row) + 2 > PAGE_BYTES and page:
                    pages.append(page)
                    page, size = [], 2
                page.append(row)
                size += len(row) + 2
            if page:
                pages.append(page)
            names = []
            for i, page in enumerate(pages):
                stem = f'{win["id"]}-{field}-{i}'
                binding = f'{field}{wi}_{i}'
                imports.append(f"import {binding} from './{stem}.json';")
                names.append('...' + binding)
                files[f'{stem}.json'] = '[\n' + ',\n'.join(page) + '\n]\n'
            fields.append(f'{field}: [{", ".join(names + large_shapes)}]')
        entries.append('  { ' + ', '.join(fields) + ' }')
        print(win['id'], len(win['physical']), len(win['owners']), flush=True)
    files['index.ts'] = '// Generated by scripts/build-us-canada-shorelines.py.\n' + '\n'.join(imports) \
        + f'\n\nexport const scale = {SCALE};\nexport const windows = [\n' + ',\n'.join(entries) + '\n];\n'
    for filename, content in files.items():
        (out / filename).write_text(content)
    for old in out.glob('*.json'):
        if old.name not in files:
            old.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--gshhg-archive', required=True, type=Path)
    parser.add_argument('--fieldmaps-gpkg', required=True, type=Path)
    parser.add_argument('--statcan-archive', required=True, type=Path)
    parser.add_argument('--ontario-archive', required=True, type=Path)
    parser.add_argument('--census-directory', required=True, type=Path)
    parser.add_argument('--ontario-river', required=True, type=Path)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    ogr.UseExceptions()
    windows = [{**win, 'physical': [], 'owners': [], 'canadian': []} for win in json.loads(WINDOWS.read_text())]
    read_physical(args.gshhg_archive, windows)
    print('Physical shorelines read', flush=True)
    read_fieldmaps(args.fieldmaps_gpkg, windows)
    print('FieldMaps read', flush=True)
    read_statcan(args.statcan_archive, windows)
    print('Statistics Canada read', flush=True)
    read_lake_sources(args.census_directory, args.ontario_archive, windows)
    read_ontario_river(args.ontario_river, windows)
    write(windows, args.output)


if __name__ == '__main__':
    main()
