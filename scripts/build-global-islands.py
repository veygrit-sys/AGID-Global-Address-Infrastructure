#!/usr/bin/env python3
"""Extract island map-unit polygons from pinned Natural Earth data (Python 3 + GDAL/GEOS).

Usage: python3 scripts/build-global-islands.py ne_10m_admin_0_map_units.geojson ne_10m_land.geojson
Both original files are available at the URLs in the generated manifest.
"""
import argparse
import base64
import hashlib
import json
import re
import sqlite3
from collections import defaultdict
from pathlib import Path

from osgeo import ogr

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'src/data/global-islands'
SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/'
FILES = {
    'ne_10m_admin_0_map_units.geojson': '57da82be755f4afccd8f3b14251bb2752f5df1395f47d2d86f817470c4a48862',
    'ne_10m_land.geojson': '1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416',
}
# Contiguous Afro-Eurasia, the Americas, Australia, Antarctica and the piece of
# continental Siberia cut off by the antimeridian. No island area cutoff.
MAINLAND_SEEDS = [(10, 50), (-65, 8), (135, -25), (0, -80), (-177.43, 66.61)]
SCALE = 1_000_000  # source GeoJSON has six decimal places
SHARD_LIMIT = 350_000


def load(path, filename):
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != FILES[filename]:
        raise ValueError(f'Unexpected bytes for {filename}')
    return json.loads(raw)['features']


def polygons(feature):
    g = feature['geometry']
    if g['type'] not in ('MultiPolygon', 'Polygon'):
        raise ValueError(g['type'])
    return g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]


def geometry(rings):
    return ogr.CreateGeometryFromJson(json.dumps({'type': 'Polygon', 'coordinates': rings}))


def point(x, y):
    return ogr.CreateGeometryFromWkt(f'POINT ({x} {y})')


def alpha2(value):
    return value if isinstance(value, str) and re.fullmatch('[A-Z]{2}', value) else None


def unit_metadata(units):
    # ISO_A2_EH on a dependency identifies the territory. Follow a matching
    # sovereign's own ISO row to obtain its distinct source-view sovereign code.
    sovereigns = {}
    for f in units:
        p = f['properties']
        if p['ADMIN'] == p['SOVEREIGNT'] and p['ADM0_A3'] == p['ISO_A3_EH'] and alpha2(p['ISO_A2_EH']):
            sovereigns[p['SOVEREIGNT']] = p['ISO_A2_EH']
    out = {}
    for f in units:
        p = f['properties']
        code = 'UM' if p['ADM0_A3'] == 'UMI' else alpha2(p['ISO_A2_EH'])
        disputed = bool(p['BRK_DIFF'] or p['TYPE'] in ('Disputed', 'Indeterminate', 'Lease')
                        or (p['NOTE_BRK'] and 'claim' in p['NOTE_BRK'].lower()))
        sovereign = sovereigns.get(p['SOVEREIGNT'])
        # Treaty status/indeterminate territory is not a source of sovereign title.
        if p['TYPE'] == 'Indeterminate':
            sovereign = None
        out[p['GU_A3']] = {'id': p['GU_A3'], 'name': p['GEOUNIT'], 'code': code,
                            'sovereignCode': sovereign, 'disputed': disputed}
    return out


def join_seams(parts):
    joined = []
    seams = ogr.Geometry(ogr.wkbMultiPolygon)
    for rings in parts:
        if not any(abs(x) == 180 for x, _ in rings[0]):
            joined.append(rings)
            continue
        shifted = [[[x + 360 if x < 0 else x, y] for x, y in r] for r in rings]
        seams.AddGeometry(geometry(shifted))
    if seams.GetGeometryCount():
        merged = json.loads(seams.UnionCascaded().ExportToJson(options=['COORDINATE_PRECISION=6']))
        joined.extend(merged['coordinates'] if merged['type'] == 'MultiPolygon' else [merged['coordinates']])
    return joined


def varint(value, output):
    unsigned = abs(value) * 2 - (value < 0)
    while unsigned >= 128:
        output.append((unsigned & 127) | 128)
        unsigned >>= 7
    output.append(unsigned)


def pack(rings, unit_index, scale=SCALE):
    encoded = []
    bbox = None
    for ring in rings:
        coords = [(round(x * scale), round(y * scale)) for x, y in ring]
        if coords[-1] != coords[0] or len(set(coords)) < 3:
            raise ValueError('Degenerate ring')
        if bbox is None:
            xs, ys = zip(*coords)
            bbox = [min(xs), min(ys), max(xs), max(ys)]
        # Rotate to a deterministic vertex without changing winding or dropping detail.
        coords.pop()
        start = coords.index(min(coords))
        stream, previous = bytearray(), (0, 0)
        for pair in coords[start:] + coords[:start]:
            for value, old in zip(pair, previous):
                varint(value - old, stream)
            previous = pair
        encoded.append(base64.b64encode(stream).decode('ascii'))
    return [unit_index, *bbox, encoded[0], *sorted(encoded[1:])]


def compact(value):
    return json.dumps(value, separators=(',', ':'), ensure_ascii=True, allow_nan=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('map_units', type=Path)
    parser.add_argument('land', type=Path)
    args = parser.parse_args()
    ogr.UseExceptions()
    units = load(args.map_units, 'ne_10m_admin_0_map_units.geojson')
    land = load(args.land, 'ne_10m_land.geojson')
    metadata = unit_metadata(units)
    seeds = [point(*xy) for xy in MAINLAND_SEEDS]
    # RTree is build-time only. Classify each political piece by an interior point
    # on a physical component, which preserves international borders on shared islands.
    db = sqlite3.connect(':memory:')
    db.execute('CREATE VIRTUAL TABLE boxes USING rtree(id,west,east,south,north)')
    surfaces = []
    for f in land:
        for rings in polygons(f):
            surface = geometry(rings)
            mainland = any(surface.Contains(seed) for seed in seeds)
            idx = len(surfaces)
            db.execute('INSERT INTO boxes VALUES(?,?,?,?,?)', (idx, *surface.GetEnvelope()))
            surfaces.append((surface, surface.CreatePreparedGeometry(), mainland))
    if sum(mainland for _, _, mainland in surfaces) != len(seeds):
        raise ValueError('Continental reference topology changed')

    island_parts = defaultdict(list)
    physical_ids = set()
    mainland_count = 0
    for f in units:
        name = f['properties']['GU_A3']
        for rings in polygons(f):
            location = geometry(rings).PointOnSurface()
            x, y, _ = location.GetPoint()
            ids = db.execute('SELECT id FROM boxes WHERE west<=? AND east>=? AND south<=? AND north>=?', (x,x,y,y))
            hits = [i for i, in ids if surfaces[i][1].Intersects(location)]
            if not hits:
                raise ValueError(f'Map unit {name} has no physical-land component at {(x,y)}')
            if any(surfaces[i][2] for i in hits):
                mainland_count += 1
            else:
                physical_ids.update(hits)
                island_parts[name].append(rings)

    unit_ids = sorted(metadata)
    rows = []
    for name, parts in sorted(island_parts.items()):
        rows.extend(pack(poly, unit_ids.index(name)) for poly in join_seams(parts))
    rows.sort(key=lambda r: (r[1],r[2],r[0],r[3:]))
    shards = [[]]
    size = 2
    for r in rows:
        line = compact(r)
        if size + len(line) > SHARD_LIMIT and shards[-1]:
            shards.append([])
            size = 2
        shards[-1].append(line)
        size += len(line) + 2
    TARGET.mkdir(exist_ok=True, parents=True)
    shard_names = [f'part-{i:02d}' for i in range(len(shards))]
    for old in TARGET.glob('part-*.json'):
        if old.stem not in shard_names:
            old.unlink()
    for name, lines in zip(shard_names, shards):
        (TARGET/(name+'.json')).write_text('[\n' + ',\n'.join(lines) + '\n]\n')
    raw_parts = sum(len(v) for v in island_parts.values())
    counts = {'sourceMapUnitPolygons': mainland_count + raw_parts, 'mainlandPolygons': mainland_count,
              'islandMapUnitPolygons': raw_parts, 'physicalLandPartsWithMapUnits': len(physical_ids),
              'storedPolygonsAfterSeamUnion': len(rows), 'mapUnitsRepresented': len(island_parts),
              'distinctTerritoryCodes': len({metadata[k]['code'] for k in island_parts if metadata[k]['code']})}
    manifest = {'source': 'natural-earth-global-island-map-units', 'version': 'natural-earth-vector v5.1.2',
                'sources': [{'url': SOURCE+n, 'sha256': h} for n,h in FILES.items()],
                'terms': 'https://www.naturalearthdata.com/about/terms-of-use/',
                'counts': counts, 'coordinateScale': SCALE, 'mainlandSeedsLonLat': MAINLAND_SEEDS,
                'scope': 'Island pieces represented by this cartographic land and political dataset. '
                         'Country codes and sovereign codes reflect the source edition. '
                         'Separate point-specific policy may supersede them. No nearest-country assignment.',
                'units': [metadata[i] for i in unit_ids]}
    (TARGET/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=True, indent=2)+'\n')
    imports = [f"import p{i} from '../data/global-islands/{name}.json';" for i,name in enumerate(shard_names)]
    (ROOT/'src/lib/globalIslandParts.ts').write_text('// Generated by scripts/build-global-islands.py.\n' +
        '\n'.join(imports) + '\n\nexport const globalIslandParts = [' + ', '.join(f'p{i}' for i in range(len(shards))) + '];\n')
    print(compact(counts), f'{len(shards)} data files')


if __name__ == '__main__':
    main()
