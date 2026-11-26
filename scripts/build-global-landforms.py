#!/usr/bin/env python3
"""Build source-edition island component IDs, shoreline corrections and conservative inland certificates.

Usage: /usr/bin/python3 scripts/build-global-landforms.py LAND.geojson RIVERS.geojson gshhg-shp-2.3.7.zip
Requires Python 3, NumPy and GDAL/GEOS. Run build-global-islands.py first.
"""
import argparse
import base64
from collections import defaultdict
import hashlib
import json
from pathlib import Path
import runpy

import numpy as np
from osgeo import gdal, ogr, osr

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/data'
TARGET = DATA / 'global-islands'
shared = runpy.run_path(str(ROOT / 'scripts/build-global-islands.py'))
VERSION = 'ne-5.1.2+gshhg-2.3.7'
RIVERS_SHA = 'bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a'
GSHHG_SHA = '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41'
GRID = 16  # cells per degree
SRS = osr.SpatialReference()
SRS.ImportFromEPSG(4326)
SRS.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)


def geo_polygon(rings):
    return shared['geometry'](rings)


def coords(shape):
    return json.loads(shape.ExportToJson(options=['COORDINATE_PRECISION=12']))['coordinates']


def seam_intervals(rings, meridian):
    return [(min(a[1], b[1]), max(a[1], b[1])) for a, b in zip(rings[0], rings[0][1:])
            if a[0] == b[0] == meridian and a[1] != b[1]]


def decode_ring(packed):
    values, n, shift = [], 0, 0
    for byte in base64.b64decode(packed):
        n |= (byte & 127) << shift
        if byte & 128:
            shift += 7
        else:
            values.append(-(n//2)-1 if n & 1 else n//2)
            n, shift = 0, 0
    xy = [0, 0]
    out = []
    for x, y in zip(values[::2], values[1::2]):
        xy = [xy[0] + x, xy[1] + y]
        out.append([v / 1_000_000 for v in xy])
    return out + [out[0]]


def row_rle(row):
    ends = np.append(np.nonzero(row[:-1] != row[1:])[0] + 1, len(row))
    data, start = bytearray(), 0
    for end in ends:
        for value in (int(end) - start, int(row[start])):
            while value >= 128:
                data.append((value & 127) | 128)
                value >>= 7
            data.append(value)
        start = int(end)
    return base64.b64encode(data).decode('ascii')


def build(args):
    raw = shared['load'](args.land, 'ne_10m_land.geojson')
    for source, expected in [(args.rivers, RIVERS_SHA), (args.shore_archive, GSHHG_SHA)]:
        with source.open('rb') as f:
            if hashlib.file_digest(f, 'sha256').hexdigest() != expected:
                raise ValueError(f'Unexpected source bytes: {source}')
    manifest = json.loads((TARGET / 'manifest.json').read_text())
    surfaces, mainland, seam = [], set(), defaultdict(list)
    seeds = [shared['point'](*p) for p in shared['MAINLAND_SEEDS']]
    for feat in raw:
        for rings in shared['polygons'](feat):
            shape = geo_polygon(rings)
            idx = len(surfaces)
            if any(shape.Contains(p) for p in seeds):
                mainland.add(idx)
            for side in (-180, 180):
                seam[side].extend((idx, a, b) for a, b in seam_intervals(rings, side))
            surfaces.append(shape)

    # Match along a real shared seam segment. Touching endpoints do not prove a connection.
    parents = list(range(len(surfaces)))
    def component(idx):
        while parents[idx] != idx:
            idx = parents[idx]
        return idx
    for left, lo, hi in seam[-180]:
        for right, low, high in seam[180]:
            if max(lo, low) < min(hi, high):
                a, b = component(left), component(right)
                parents[max(a,b)] = min(a,b)
    ids = [component(i) for i in range(len(surfaces))]
    mainland = sorted({ids[i] for i in mainland})
    # Re-assemble only cut islands in a continuous longitude chart for political/physical joins.
    members = defaultdict(list)
    for i, key in enumerate(ids):
        members[key].append(i)
    combined = {}
    for key, parts in members.items():
        if key in mainland:
            continue
        if len(parts) == 1:
            combined[key] = surfaces[key]
            continue
        shapes = ogr.Geometry(ogr.wkbMultiPolygon)
        for index in parts:
            rings = coords(surfaces[index])
            shapes.AddGeometry(geo_polygon([[[x + 360 if x < 0 else x, y] for x, y in r] for r in rings]))
        combined[key] = shapes.UnionCascaded()

    import sqlite3
    db = sqlite3.connect(':memory:')
    db.execute('CREATE VIRTUAL TABLE bbox USING rtree(id,w,e,s,n)')
    db.executemany('INSERT INTO bbox VALUES(?,?,?,?,?)', ((i,*s.GetEnvelope()) for i,s in enumerate(surfaces)))
    prepared = {i:s.CreatePreparedGeometry() for i,s in combined.items()}
    shared_codes, questionable = defaultdict(set), set()
    anchors = defaultdict(list)
    physical_by_row, corrected = [], {}
    for path in sorted(TARGET.glob('part-*.json')):
        for row in json.loads(path.read_text()):
            number = len(physical_by_row)
            unit = manifest['units'][row[0]]
            rings = [decode_ring(r) for r in row[5:]]
            shape = geo_polygon(rings)
            pin = shape.PointOnSurface()
            x, y = pin.GetX(), pin.GetY()
            cx = x - 360 if x > 180 else x
            probe = shared['point'](cx,y)
            keys = {ids[i] for i, in db.execute('SELECT id FROM bbox WHERE w<=? AND e>=? AND s<=? AND n>=?',
                                                (cx,cx,y,y)) if surfaces[i].Intersects(probe)}
            if len(keys) != 1 or next(iter(keys)) in mainland:
                raise ValueError(f'Unexpected physical component for row {number}: {keys}')
            key, = keys
            physical_by_row.append(key)
            if unit['code']:
                shared_codes[key].add(unit['code'])
                anchors[(key, unit['code'])].append((cx,y))
            if unit['disputed'] or not unit['code']:
                questionable.add(key)
            world = combined[key]
            # Some non-crossing map units of a joined island may be stored west of 180.
            shift = round((world.GetEnvelope()[0] - shape.GetEnvelope()[0])/360)*360
            if shift:
                shape = geo_polygon([[[x + shift, y] for x,y in r] for r in rings])
            if not prepared[key].Contains(shape):
                fixed = shape.Intersection(world)
                if fixed.GetGeometryName() != 'POLYGON' or fixed.IsEmpty():
                    raise ValueError(f'Unexpected intersection for row {number}')
                if shape.Difference(world).GetArea() > 0:
                    rings = [[[x - shift, y] for x,y in r] for r in coords(fixed)]
                    corrected[number] = shared['pack'](rings, row[0], 1_000_000_000)

    # Show only source regions with a separately checked point on the shared island.
    # A review window may cover part of Borneo while all three countries still
    # have undisputed land elsewhere on the island. No claimant list is inferred.
    review = json.loads((DATA / 'disputedIslandGeometry.json').read_text())['groups']
    zones = [(p['bbox'], geo_polygon(p['rings'])) for group in review for p in group['polygons']]
    japan = [g['bbox'] for g in json.loads((DATA / 'japaneseIslandView.json').read_text())['groups']]
    def clear(point):
        x,y = point
        if any(w <= x <= e and s <= y <= n for w,s,e,n in japan):
            return False
        return not any(w <= x <= e and s <= y <= n and z.Intersects(shared['point'](x,y))
                       for (w,s,e,n),z in zones)
    multi = {key:sorted(codes) for key,codes in shared_codes.items()
             if len(codes)>1 and key not in questionable
             and all(any(clear(p) for p in anchors[(key,code)]) for code in codes)}
    metadata = dict(version=VERSION,scale=GRID,rowPhysicalIds=physical_by_row,mainland=mainland,
                    sharedCountries=multi,correctedRows=corrected,
                    shoreArchiveSha256=GSHHG_SHA,riversSha256=RIVERS_SHA)
    (TARGET/'landform-components.json').write_text(shared['compact'](metadata)+'\n')

    raster = gdal.GetDriverByName('MEM').Create('', 360*GRID, 180*GRID, 1, gdal.GDT_UInt16)
    raster.SetGeoTransform((-180,1/GRID,0,90,0,-1/GRID)); raster.SetProjection(SRS.ExportToWkt())
    mem = ogr.GetDriverByName('Memory').CreateDataSource('')
    land = mem.CreateLayer('land',SRS,ogr.wkbPolygon)
    land.CreateField(ogr.FieldDefn('num',ogr.OFTInteger))
    edges = mem.CreateLayer('shore',SRS,ogr.wkbUnknown)
    for i,g in enumerate(surfaces):
        f = ogr.Feature(land.GetLayerDefn()); f.SetField('num',ids[i]+2); f.SetGeometry(g); land.CreateFeature(f)
        edge = ogr.Feature(edges.GetLayerDefn()); edge.SetGeometry(g.Boundary()); edges.CreateFeature(edge)
    # A polygon center hit alone does not prove its entire cell is land.
    gdal.RasterizeLayer(raster,[1],land,options=['ATTRIBUTE=num'])
    gdal.RasterizeLayer(raster,[1],edges,burn_values=[0],options=['ALL_TOUCHED=TRUE'])
    # Conservatively exclude all cells contacted by mapped inland water. Do not
    # carve lake islands back into this coarse layer; local positive layers handle them.
    for level in (2,4):
        ds = ogr.Open(f'/vsizip/{args.shore_archive.resolve()}/GSHHS_shp/f/GSHHS_f_L{level}.shp')
        gdal.RasterizeLayer(raster,[1],ds.GetLayer(),burn_values=[1],options=['ALL_TOUCHED=TRUE'])
    rivers = ogr.Open(str(args.rivers))
    gdal.RasterizeLayer(raster,[1],rivers.GetLayer(),burn_values=[1],options=['ALL_TOUCHED=TRUE'])
    # Prove inland water only when every cell corner and interior are water.
    # Level 3 lake islands override level 2, and level 4 island ponds override level 3.
    water = gdal.GetDriverByName('MEM').Create('', 360*GRID, 180*GRID, 1, gdal.GDT_Byte)
    water.SetGeoTransform(raster.GetGeoTransform()); water.SetProjection(SRS.ExportToWkt())
    for level in (2,3,4):
        ds = ogr.Open(f'/vsizip/{args.shore_archive.resolve()}/GSHHS_shp/f/GSHHS_f_L{level}.shp')
        layer = ds.GetLayer()
        # A center test can identify water candidates; every touched water/land
        # boundary is then removed. A tiny mapped lake island cannot be swallowed.
        gdal.RasterizeLayer(water,[1],layer,burn_values=[int(level!=3)],options=['ALL_TOUCHED=TRUE'] if level==3 else [])
        boundaries = mem.CreateLayer(f'inland-boundary-{level}',SRS,ogr.wkbUnknown)
        for feature in layer:
            f = ogr.Feature(boundaries.GetLayerDefn()); f.SetGeometry(feature.geometry().Boundary()); boundaries.CreateFeature(f)
        gdal.RasterizeLayer(water,[1],boundaries,burn_values=[0],options=['ALL_TOUCHED=TRUE'])
    arr = raster.ReadAsArray()
    # Accept a mainland certificate only if the complete cell also lies on the
    # corresponding GSHHG continental part. Its detached islands are never mainland.
    source_areas = mem.CreateLayer('gshhg-mainland',SRS,ogr.wkbUnknown)
    source_areas.CreateField(ogr.FieldDefn('component',ogr.OFTInteger))
    source_edges = mem.CreateLayer('gshhg-continental-edges',SRS,ogr.wkbUnknown)
    primary = {0:4,1:4,2:1,3:1,5:0,6:3}
    shared_gshhg_to_ne = {8:7,9:11,26:22,29:33,35:76,51:3933,564:3740,1592:3232}
    shared_proofs = {}
    checked = gdal.GetDriverByName('MEM').Create('',360*GRID,180*GRID,1,gdal.GDT_UInt16)
    checked.SetGeoTransform(raster.GetGeoTransform()); checked.SetProjection(SRS.ExportToWkt())
    for level in (1,6):
        ds = ogr.Open(f'/vsizip/{args.shore_archive.resolve()}/GSHHS_shp/f/GSHHS_f_L{level}.shp')
        layer = ds.GetLayer()
        for f in layer:
            idx = int(str(f['id']).split('-')[0])
            if idx not in primary and idx not in shared_gshhg_to_ne:
                continue
            original = f.geometry()
            if idx in primary:
                poly = ogr.Feature(source_areas.GetLayerDefn()); poly.SetGeometry(original)
                poly.SetField('component',primary[idx]+2); source_areas.CreateFeature(poly)
                edge = ogr.Feature(source_edges.GetLayerDefn()); edge.SetGeometry(original.Boundary()); source_edges.CreateFeature(edge)
            else:
                ne = shared_gshhg_to_ne[idx]
                # Store a strict interior only, independently verified after quantization.
                inset = 0.001 if idx in (564,1592) else 0.006
                safe = original.Buffer(-inset).SimplifyPreserveTopology(inset/2)
                parts = [safe] if safe.GetGeometryName() == 'POLYGON' else list(safe)
                for piece in parts:
                    if piece.GetGeometryName() != 'POLYGON' or piece.IsEmpty():
                        continue
                    rings = [[[round(x,6),round(y,6)] for x,y in r] for r in coords(piece)]
                    rounded = geo_polygon(rings)
                    if rounded.IsValid() and original.Contains(rounded) and not original.Boundary().Intersects(rounded):
                        shared_proofs.setdefault(ne,[]).append(shared['pack'](rings,idx))
    if set(shared_proofs) != set(multi):
        raise ValueError('Expected independent mainland and shared island witnesses for this edition')
    (TARGET/'landform-shared-interiors.json').write_text(shared['compact'](shared_proofs)+'\n')
    gdal.RasterizeLayer(checked,[1],source_areas,options=['ATTRIBUTE=component'])
    gdal.RasterizeLayer(checked,[1],source_edges,burn_values=[0],options=['ALL_TOUCHED=TRUE'])
    for level in (1,6):
        ds = ogr.Open(f'/vsizip/{args.shore_archive.resolve()}/GSHHS_shp/f/GSHHS_f_L{level}.shp')
        layer = ds.GetLayer()
        layer.SetAttributeFilter("id NOT IN ('0','0-E','0-W','1','2','3','5','5-E','5-W','6')")
        gdal.RasterizeLayer(checked,[1],layer,burn_values=[0],options=['ALL_TOUCHED=TRUE'])
    continental_candidates = np.isin(arr, np.asarray(mainland)+2)
    arr[continental_candidates & (checked.ReadAsArray()!=arr)] = 0
    arr[water.ReadAsArray()!=0] = 65535
    print(f'{len(physical_by_row)} rows, {len(corrected)} clipped, {len(multi)} shared, {len(mainland)} continental components')
    print({i:int(np.count_nonzero(arr==i+2)) for i in mainland},'hydro',int(np.count_nonzero(arr==1)))
    rows = [row_rle(r) for r in arr]
    for k in range(2):
        (TARGET/f'landform-grid-{k}.json').write_text(shared['compact'](rows[k*90*GRID:(k+1)*90*GRID])+'\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('land','rivers','shore_archive'):
        parser.add_argument(name,type=Path)
    ogr.UseExceptions(); gdal.UseExceptions()
    build(parser.parse_args())
