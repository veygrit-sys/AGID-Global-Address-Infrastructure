#!/usr/bin/env python3
"""Regenerate Cayo Chelem's point-policy polygons with GDAL/GEOS.

Usage: python3 scripts/build-island-border-review.py world.sqlite ne_10m_admin_0_map_units.geojson 889463039839_s.zip
The SQLite input is produced by scripts/island-evidence-pack.py.
"""
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
import zlib

from osgeo import ogr, osr

ogr.UseExceptions()
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'src/data/islandBorderReview.json'
PACK, NE, INEGI = map(Path, sys.argv[1:])
for path, digest in [(NE, '57da82be755f4afccd8f3b14251bb2752f5df1395f47d2d86f817470c4a48862'),
                     (INEGI, 'fa6c47b32396b79d6d7aae3c20514ca7ccd14031223c6dfc8316b4b242ea4521')]:
    if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
        raise ValueError(f'Unexpected source edition: {path}')

db = sqlite3.connect(f'{PACK.resolve().as_uri()}?mode=ro', uri=True)
manifest = json.loads(db.execute("SELECT value FROM metadata WHERE key='manifest'").fetchone()[0])
if (manifest['gshhgArchive']['sha256'] != '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41'
        or manifest['fieldmapsArchive']['gpkgSha256'] != '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'):
    raise ValueError('Unexpected world pack source edition')


def polygons(g):
    if g.IsEmpty():
        return
    if g.GetGeometryName() == 'POLYGON':
        yield g
    elif g.GetGeometryName() in ('MULTIPOLYGON', 'GEOMETRYCOLLECTION'):
        for part in g:
            yield from polygons(part)


def pack(g):
    output = []
    for p in polygons(g):
        w, e, s, n = p.GetEnvelope()
        output.append({'bbox': [w, s, e, n], 'rings': [[[x, y] for x, y, *_ in r.GetPoints()] for r in p]})
    return sorted(output, key=lambda p: p['bbox'])


(wkb,), = db.execute("SELECT wkb FROM coast WHERE physical_id='6815' AND level=1")
shore = ogr.CreateGeometryFromWkb(zlib.decompress(wkb))
w, e, s, n = shore.GetEnvelope()
admin = ogr.Geometry(ogr.wkbMultiPolygon)
for (wkb,) in db.execute("""SELECT a.wkb FROM administrative a JOIN administrative_box b ON b.id=a.id
        JOIN region r ON r.id=a.region_id WHERE r.code='MX' AND r.disputed=0 AND
        b.west<=? AND b.east>=? AND b.south<=? AND b.north>=? ORDER BY a.id""", (e, w, n, s)):
    g = ogr.CreateGeometryFromWkb(zlib.decompress(wkb))
    for part in polygons(g.Intersection(shore)):
        admin.AddGeometry(part)
ne_ds = ogr.Open(str(NE))
layer = ne_ds.GetLayer()
layer.SetAttributeFilter("GU_A3 = 'BLZ'")
feature = layer.GetNextFeature()
# The reviewed Natural Earth land component is used solely to identify its
# generalized edges during a footprint query. Neighbouring Belize islands keep theirs.
official_pin = ogr.CreateGeometryFromWkt('POINT(-87.8863597222222 18.1929944444444)')
component, = [p for p in polygons(feature.GetGeometryRef()) if p.Contains(official_pin)]
w, e, s, n = component.GetEnvelope()
reviewed_ne_bbox = [w, s, e, n]
ne_overlap = component.Intersection(admin.UnionCascaded())

# Select the survey's actual named soil/cay, with all of its original shore holes.
stem = 'conjunto_de_datos/elementos_insulares_cdtim_v2_1_2018.shp'
ds = ogr.Open(f'/vsizip/{INEGI.resolve()}/{stem}')
layer = ds.GetLayer()
layer.SetAttributeFilter("ID_NUM=848 AND TERM_NOM='CAYO CHELEM' AND ENTIDAD='QROO' AND TIP_INSULA='CAYO'")
if layer.GetFeatureCount() != 1:
    raise ValueError('Cayo Chelem survey element 848 not found')
feature = layer.GetNextFeature()
survey = feature.GetGeometryRef().Clone()
src = layer.GetSpatialRef().Clone()
dst = osr.SpatialReference()
dst.ImportFromEPSG(4326)
for crs in (src, dst):
    crs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
survey.Transform(osr.CoordinateTransformation(src, dst))
if not survey.IsValid() or not shore.IsValid():
    raise ValueError('Invalid physical shoreline')
certified = survey.Intersection(shore)
# Keep the two classes disjoint so their boundaries also describe uncertainty footprints.
data = {'naturalEarthComponentBbox': reviewed_ne_bbox,
        'mapped': pack(certified), 'review': pack(ne_overlap.Difference(certified))}
DEST.write_text(json.dumps(data, separators=(',', ':')) + '\n')
