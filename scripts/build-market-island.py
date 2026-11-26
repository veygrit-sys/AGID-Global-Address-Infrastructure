#!/usr/bin/env python3
"""Build surveyed Märket island sides from the bilateral border, FieldMaps and ESA WorldCover.

Usage: python3 scripts/build-market-island.py world.sqlite border.pdf [worldcover-window.bin]
The optional file contains the exact 157-by-80 bytes read from the checksum-pinned COG window.
Dependencies: GDAL with GEOS, numpy, scipy and pdftotext.
"""
import hashlib
import json
import re
import sqlite3
import subprocess
import sys
import zlib
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
from scipy.ndimage import binary_erosion, label

ROOT = Path(__file__).resolve().parents[1]
PDF_SHA = '9fae13687019a1e3e7698271533039ea94051e97e56259a748d16fb9d9677352'
FIELDMAPS_SHA = '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'
WORLD_COVER = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N60E018_Map.tif'
PIXELS_SHA = '94b47d9b5d75872b6e8b23adda44d4a2d3e0694357dad347d0deeb96cf1beba9'
WINDOW = 13500, 32351, 157, 80
MARKERS = [11, 2, 3, 4, 5, 1, 6, 7, 8, 9, 12]


def point(coordinates):
    p = ogr.Geometry(ogr.wkbPoint)
    p.AddPoint_2D(*coordinates)
    return p


def polygon(coords):
    ring = ogr.Geometry(ogr.wkbLinearRing)
    for x, y in [*coords, coords[0]]:
        ring.AddPoint_2D(x, y)
    shape = ogr.Geometry(ogr.wkbPolygon)
    shape.AddGeometry(ring)
    return shape


def border_markers(pdf):
    if hashlib.sha256(pdf.read_bytes()).hexdigest() != PDF_SHA:
        raise ValueError('Unexpected Finland/Sweden demarcation edition')
    text = subprocess.check_output(['pdftotext', '-layout', pdf, '-'], text=True)
    def degrees(s):
        return int(s[:2]) + int(s[2:4]) / 60 + float(s[4:].replace(',', '.')) / 3600
    matches = re.findall(r'^\s*M\s*(\d+)\s+M\s*\d+\s+[^\n]*?\s+(60\d{4},\d{4})\s+(19\d{4},\d{4})\s+49\b', text, flags=re.M)
    if [int(k) for k, _, _ in matches] != MARKERS:
        raise ValueError('Unexpected survey markers or order')
    return [(degrees(lon), degrees(lat)) for _, lat, lon in matches]


def mapped_outline(pack):
    db = sqlite3.connect(f'{pack.resolve().as_uri()}?mode=ro', uri=True)
    manifest = json.loads(db.execute("select value from metadata where key='manifest'").fetchone()[0])
    if manifest['fieldmapsArchive']['gpkgSha256'] != FIELDMAPS_SHA:
        raise ValueError('Unexpected FieldMaps edition')
    pieces = []
    for key, code in [(209, 'AX'), (311848, 'SE')]:
        blob, territory = db.execute('select a.wkb, r.code from administrative a join region r on a.region_id=r.id where a.id=?', (key,)).fetchone()
        if code != territory:
            raise ValueError('Unexpected Märket map component')
        pieces.append(ogr.CreateGeometryFromWkb(zlib.decompress(blob)))
    return pieces[0].Union(pieces[1])


def dry_interior(cache, anchor):
    x, y, width, height = WINDOW
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    raw = cache.read_bytes() if cache else gdal.Open('/vsicurl/' + WORLD_COVER).ReadAsArray(*WINDOW).tobytes()
    if hashlib.sha256(raw).hexdigest() != PIXELS_SHA:
        raise ValueError('Unexpected WorldCover pixels')
    data = np.frombuffer(raw, np.uint8).reshape(height, width)
    dry = np.isin(data, [10, 20, 30, 40, 50, 60, 100])
    # Match the connected dry component at the surveyed central brass marker.
    # A full one-pixel shore margin excludes ambiguous rock/water contacts.
    groups, _ = label(dry)
    col, row = int((anchor[0]-18)*12000)-x, int((63-anchor[1])*12000)-y
    if not groups[row, col]:
        raise ValueError('The central border marker must be on mapped land')
    interior = binary_erosion(groups == groups[row, col], np.ones((3, 3), dtype=bool))
    raster = gdal.GetDriverByName('MEM').Create('', width, height, 1, gdal.GDT_Byte)
    raster.SetGeoTransform((18+x/12000, 1/12000, 0, 63-y/12000, 0, -1/12000))
    band = raster.GetRasterBand(1)
    band.WriteArray(interior.astype(np.uint8))
    vector = ogr.GetDriverByName('Memory').CreateDataSource('')
    layer = vector.CreateLayer('dry', geom_type=ogr.wkbPolygon)
    gdal.Polygonize(band, band, layer, -1, [])
    shapes = ogr.Geometry(ogr.wkbMultiPolygon)
    for f in layer:
        shapes.AddGeometry(f.geometry())
    return shapes.UnionCascaded()


def packed(shape):
    parts = [shape] if shape.GetGeometryName() == 'POLYGON' else list(shape)
    result = []
    for part in parts:
        if part.GetGeometryName() != 'POLYGON' or part.IsEmpty():
            continue
        rings = [[[round(x, 12), round(y, 12)] for x, y, *_ in ring.GetPoints()] for ring in part]
        w, e, s, n = part.GetEnvelope()
        result.append(dict(bbox=[round(v, 12) for v in [w, s, e, n]], rings=rings))
    return result


def main():
    ogr.UseExceptions()
    gdal.UseExceptions()
    pack, pdf, *cached = map(Path, sys.argv[1:])
    bends = border_markers(pdf)
    outline = mapped_outline(pack)
    land = dry_interior(cached[0] if cached else None, bends[5]).Intersection(outline)
    # Continue 11-2 to the north; to the south the legal line continues from
    # marker 1 through 9 and 12. Frame points below are outside all island land.
    def extend(a, b):
        return [a[i] + 100 * (a[i] - b[i]) for i in range(2)]
    north, south = extend(bends[0], bends[1]), extend(bends[-1], bends[5])
    west = polygon([north, *bends, south, [19.05, south[1]], [19.05, north[1]]])
    east_side, west_side = land.Difference(west), land.Intersection(west)
    if min(west_side.Area(), east_side.Area()) <= 0 or abs(east_side.Area() + west_side.Area() - land.Area()) > 1e-12:
        raise ValueError('The surveyed line must partition the dry surface')
    data = dict(se=packed(west_side), ax=packed(east_side), dry=packed(land), review=packed(outline))
    out = ROOT/'src/data/regional-islands/market-border.json'
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(data, separators=(',', ':'))+'\n')


if __name__ == '__main__':
    main()
