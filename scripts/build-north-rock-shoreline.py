#!/usr/bin/env python3
"""Build the North Rock survey extract with GDAL/GEOS.

Usage: python3 scripts/build-north-rock-shoreline.py NB_Land.zip NB_Hydro.zip world.sqlite
The first two archives are NRCan's canvec_50K_NB_{Land,Hydro}_shp.zip;
world.sqlite is built by scripts/island-evidence-pack.py.
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
LAND, HYDRO, WORLD = map(Path, sys.argv[1:])
WGS84 = osr.SpatialReference()
WGS84.ImportFromEPSG(4326)
WGS84.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)

for path, checksum in [
    (LAND, 'f35355c1a8acfc58a08f51efc6510b7ccc31ea930692564e995fe40357956494'),
    (HYDRO, '03ff0eee2697aa98c84065138a60a29b95caf5274a3a209faaf292892c149610'),
]:
    with path.open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != checksum:
            raise ValueError(f'Unexpected CanVec source edition: {path}')


def survey(path, theme, layer, identifier, attributes):
    ds = ogr.Open(f'/vsizip/{path.resolve()}/canvec_50K_NB_{theme}/{layer}.shp')
    features = ds.GetLayer()
    features.SetAttributeFilter(f"feature_id='{identifier}'")
    feature, = features
    for field, expected in attributes.items():
        if feature[field] != expected:
            raise ValueError(f'Unexpected {field} on {identifier}')
    geom = feature.GetGeometryRef().Clone()
    source = features.GetSpatialRef().Clone()
    source.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    geom.Transform(osr.CoordinateTransformation(source, WGS84))
    return geom


# Canada is one of the claimants. Use only the physical feature classifications.
dry = survey(LAND, 'Land', 'island_2', 'ed73fa0f0c644045bbdbe836f78135a3', {'iscoast_en': 'True'})
reef = survey(HYDRO, 'Hydro', 'waterbody_2', '295d9319fe4e44dfb50f11dee491ab07', {'perm_en': 'Intermittent'})
ocean = survey(HYDRO, 'Hydro', 'waterbody_2', '05e84d67ee21466a8921a786dc97c18a',
               {'perm_en': 'Permanent', 'definit_en': 'Ocean'})

with sqlite3.connect(f'{WORLD.resolve().as_uri()}?mode=ro', uri=True) as db:
    manifest = json.loads(db.execute("SELECT value FROM metadata WHERE key='manifest'").fetchone()[0])
    if manifest['gshhgArchive']['sha256'] != '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41':
        raise ValueError('Expected GSHHG 2.3.7 full resolution')
    (wkb,), = db.execute("SELECT wkb FROM coast WHERE level=1 AND physical_id='95667'")
coarse = ogr.CreateGeometryFromWkb(zlib.decompress(wkb))

# A closed chart window contains the reef and the whole conflicting global
# shoreline. The window itself cannot prove land or water.
bounds = [-67.090, 44.534, -67.083, 44.540]
w, s, e, n = bounds
window = ogr.CreateGeometryFromWkt(f'POLYGON (({w} {s},{e} {s},{e} {n},{w} {n},{w} {s}))')
if (not all(window.Contains(g) for g in (dry, reef, coarse))
        or not ocean.Contains(window.Boundary()) or not coarse.Contains(dry)):
    raise ValueError('Unexpected shoreline relationship')
# Map only undisputed surface evidence: intermittent reef and disagreement
# between the surveyed water and the older land surface stay unclassified.
water = ocean.Intersection(window).Difference(coarse.Union(reef).Union(dry))


def pack(g):
    if g.GetGeometryName() != 'POLYGON' or not g.IsValid():
        raise ValueError('Expected one valid polygon')
    rings = []
    for ring in g:
        points = [[round(x, 8), round(y, 8)] for x, y, *_ in ring.GetPoints()][:-1]
        k = points.index(min(points))
        ring = points[k:] + points[:k]
        ring = min(ring, [ring[0], *reversed(ring[1:])])
        rings.append([*ring, ring[0]])
    xs, ys = zip(*rings[0])
    return {'bbox': [min(xs), min(ys), max(xs), max(ys)], 'rings': [rings[0], *sorted(rings[1:])]}


out = {'window': bounds, 'dry': pack(dry), 'water': pack(water)}
(ROOT / 'src/data/northRockShoreline.json').write_text(json.dumps(out, separators=(',', ':')) + '\n')
