#!/usr/bin/env python3
"""Compile African continental frontiers from pinned, public-domain map editions."""
import argparse
import hashlib
import json
from collections import defaultdict
from importlib import import_module
from itertools import pairwise
from math import floor
from pathlib import Path

import shapely
from osgeo import ogr
from shapely.geometry import Point, box, shape
from shapely.ops import unary_union

atlas = import_module('build-global-islands')
ROOT = Path(__file__).resolve().parents[1]
SCALE = 1_000_000
TILE = .25
HASHES = {
    'units': '57da82be755f4afccd8f3b14251bb2752f5df1395f47d2d86f817470c4a48862',
    'land': '1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416',
    'disputes': '9cafef8b7dfb6b164dc58f218f981f4ace9f716f6c03795d4c62d1ac9f3d50f5',
    'fieldmaps': '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9',
}


def polygons(geom):
    if not geom.is_empty:
        if geom.geom_type == 'Polygon':
            yield geom
        elif hasattr(geom, 'geoms'):
            for item in geom.geoms:
                yield from polygons(item)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in HASHES:
        parser.add_argument(name, type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'src/data/african-frontiers')
    args = parser.parse_args()
    ogr.UseExceptions()
    for key, digest in HASHES.items():
        with getattr(args, key).open('rb') as src:
            if hashlib.file_digest(src, 'sha256').hexdigest() != digest:
                raise ValueError(f'Unexpected {key} edition')
    policy = json.loads((ROOT / 'scripts/data/africa/mainland-policies.json').read_text())
    zones = defaultdict(list)
    published = defaultdict(lambda: defaultdict(list))
    continental = next(p for f in json.loads(args.land.read_text())['features']
                       for p in polygons(shape(f['geometry'])) if p.contains(Point(15, 1)))
    shapely.prepare(continental)
    edges = defaultdict(set)
    # Wrap no islands into a mainland state's outline, including Bioko, Zanzibar and Spanish islets.
    def mainland_part(p):
        pt = p.representative_point()
        return -18 < pt.x < 52 and -36 < pt.y < 38 and continental.covers(pt)
    for f in json.loads(args.units.read_text())['features']:
        p = f['properties']
        if p['CONTINENT'] != 'Africa' and p['GU_A3'] != 'ESP':
            continue
        code = {'SOL': 'SO', 'BRT': 'BT_T'}.get(p['GU_A3'], p['ISO_A2_EH'])
        for part in polygons(shape(f['geometry'])):
            if not mainland_part(part):
                continue
            if p['GU_A3'] == 'ESP' and part.bounds[3] > 36:
                continue
            published['natural-earth'][code].append(part)
            for ring in [part.exterior, *part.interiors]:
                for a, b in pairwise(ring.coords):
                    if a != b:
                        edges[tuple(sorted((a, b)))].add(code)

    policy_ne = {fid: key for key, spec in policy.items() for fid in spec['naturalEarth']}
    policy_fm = {fid: key for key, spec in policy.items() for fid in spec['fieldMaps']}
    for f in json.loads(args.disputes.read_text())['features']:
        code = f['properties']['BRK_A3']
        if code in policy_ne:
            zones[policy_ne[code]].extend(p for p in polygons(shape(f['geometry'])) if mainland_part(p))
    ds = ogr.Open(str(args.fieldmaps))
    layer = ds.GetLayerByName('adm0_polygons')
    layer.SetAttributeFilter("region1_nm='Africa' OR adm0_id LIKE 'ESP_3-%'")
    # Shared FieldMaps arcs are simplified together so triple points and narrow frontiers survive.
    fm_parts = []
    for f in layer:
        key = f['adm0_id'].split('-')[0]
        code = f['iso_2']
        geom = shapely.from_wkb(bytes(f.geometry().ExportToWkb()))
        if key in policy_fm:
            zones[policy_fm[key]].extend(polygons(geom))
        if code not in published['natural-earth']:
            continue
        for p in polygons(geom):
            if not mainland_part(p) or (p.area < 1 and not any(
                    p.covers(ne.representative_point()) for ne in published['natural-earth'][code])):
                continue
            fm_parts.append((code, p))
    # The source is an administrative coverage. Dissolve subunits using the same region code.
    # Simplification only affects this cross-check, never the original Natural Earth shared vertices.
    fm_parts = [(code, p) for code in sorted(set(c for c, _ in fm_parts))
                for p in polygons(unary_union([p for c, p in fm_parts if c == code]))]
    simplified = shapely.coverage_simplify([p for _, p in fm_parts], .00065)
    for (code, _), p in zip(fm_parts, simplified):
        published['fieldmaps'][code].extend(polygons(p))

    tiles, pairs = set(), set()
    def mark(g, padding=0):
        w, s, e, n = g.bounds
        for y in range(floor((s-padding)/TILE), floor((n+padding)/TILE)+1):
            for x in range(floor((w-padding)/TILE), floor((e+padding)/TILE)+1):
                if g.intersects(box(x*TILE-padding, y*TILE-padding, (x+1)*TILE+padding, (y+1)*TILE+padding)):
                    tiles.add((x, y))
    for (a, b), codes in edges.items():
        if len(codes) > 1:
            mark(shapely.LineString([a, b]), .05)
            pairs.add(tuple(sorted(codes)))
    for key in policy:
        if not zones[key]:
            raise ValueError(f'Missing reviewed feature {key}')
        for part in polygons(shapely.make_valid(unary_union(zones[key]))):
            mark(part)
            published['policies'][key].append(part)

    args.output.mkdir(parents=True, exist_ok=True)
    def write(name, value):
        (args.output / f'{name}.json').write_text(atlas.compact(value) + '\n')
    # Keep artificial extract edges beyond every published lookup tile.
    halo = shapely.unary_union([box(x*TILE, y*TILE, (x+1)*TILE, (y+1)*TILE) for x, y in tiles]).buffer(.12, join_style='mitre')
    for source, codes in published.items():
        result = []
        for code, parts in sorted(codes.items()):
            geom = unary_union(parts)
            if source == 'fieldmaps':
                geom = geom.intersection(halo)
            for p in polygons(shapely.set_precision(geom, 1/SCALE)):
                row = atlas.pack([r.coords for r in [p.exterior, *p.interiors]], code, SCALE)
                result.append(row)
        if source == 'fieldmaps':
            # Keep the browser's synchronous offline chunks independently cacheable.
            groups = [[], [], [], [], [], [], [], []]
            sizes = [0] * len(groups)
            for row in sorted(result, key=lambda r: (-len(atlas.compact(r)), r[:5])):
                i = sizes.index(min(sizes))
                groups[i].append(row)
                sizes[i] += len(atlas.compact(row))
            for i, group in enumerate(groups):
                write(f'fieldmaps-{i+1}', sorted(group))
        else:
            write(source, sorted(result))
    write('coverage', dict(scale=SCALE, tileDegrees=TILE, tiles=sorted(tiles), sharedPairs=sorted(pairs)))
    print({k: len(v) for k, v in published.items()}, len(pairs), 'mapped pairs;', len(tiles), 'tiles')


if __name__ == '__main__':
    main()
