#!/usr/bin/env python3
"""Generate 4x4-pixel dry-land certificates from WorldCover, GSHHG and Natural Earth.

Usage: /usr/bin/python3 scripts/build-regional-landforms.py ne_10m_land.geojson ne_10m_rivers_lake_centerlines.geojson gshhg-shp-2.3.7.zip
Optional --cache-dir reads/writes the checksum-pinned WorldCover pixel rectangles.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import runpy

import numpy as np
from osgeo import gdal, ogr
from scipy.ndimage import label

ROOT = Path(__file__).resolve().parents[1]
common = runpy.run_path(str(ROOT/'scripts/build-global-landforms.py'))
DRY_CLASSES = [10,20,30,40,50,60,100]
SCALE = 3000

def fetch(window, cache):
    i,j,width,height = window['pixelWindow']
    path = cache / (window['name'] + '.bin') if cache else None
    if path and path.exists():
        raw = path.read_bytes()
    else:
        ds = gdal.Open('/vsicurl/' + window['url'])
        raw = ds.ReadAsArray(i,j,width,height).tobytes()
    if hashlib.sha256(raw).hexdigest() != window['sha256']:
        raise ValueError('Unexpected WorldCover pixels: ' + window['name'])
    if path and not path.exists():
        path.parent.mkdir(exist_ok=True,parents=True)
        path.write_bytes(raw)
    return np.frombuffer(raw,dtype=np.uint8).reshape(height,width)


def build(args):
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN','EMPTY_DIR')
    gdal.SetConfigOption('GDAL_HTTP_MULTIRANGE','SERIAL')
    polygons = common['shared']['load'](args.land, 'ne_10m_land.geojson')
    for path, expect in [(args.rivers,common['RIVERS_SHA']), (args.shore_archive,common['GSHHG_SHA'])]:
        with path.open('rb') as f:
            if hashlib.file_digest(f, 'sha256').hexdigest() != expect:
                raise ValueError(f'Unexpected source bytes {path}')
    datasource = ogr.GetDriverByName('Memory').CreateDataSource('')
    land = datasource.CreateLayer('continental',common['SRS'],ogr.wkbUnknown)
    edges = datasource.CreateLayer('continental-edges',common['SRS'],ogr.wkbUnknown)
    land.CreateField(ogr.FieldDefn('component',ogr.OFTInteger))
    seeds = [common['shared']['point'](*p) for p in common['shared']['MAINLAND_SEEDS']]
    index = 0
    for f in polygons:
        for rings in common['shared']['polygons'](f):
            poly = common['geo_polygon'](rings)
            if any(poly.Contains(p) for p in seeds):
                row = ogr.Feature(land.GetLayerDefn())
                row.SetField('component', (4 if index==26 else index)+2)
                row.SetGeometry(poly); land.CreateFeature(row)
                row = ogr.Feature(edges.GetLayerDefn()); row.SetGeometry(poly.Boundary()); edges.CreateFeature(row)
            index += 1
    def source(level):
        return ogr.Open(f'/vsizip/{args.shore_archive.resolve()}/GSHHS_shp/f/GSHHS_f_L{level}.shp')
    gshhg = source(1)
    shore = datasource.CreateLayer('gshhg-land', common['SRS'], ogr.wkbUnknown)
    boundary = datasource.CreateLayer('gshhg-boundary', common['SRS'], ogr.wkbUnknown)
    for f in gshhg.GetLayer():
        if str(f['id']).split('-')[0] not in ('0','1','2','3','5','6'):
            # Continents are not required to precede all the islands in this source.
            continue
        poly = f.geometry()
        row = ogr.Feature(shore.GetLayerDefn()); row.SetGeometry(poly); shore.CreateFeature(row)
        row = ogr.Feature(boundary.GetLayerDefn()); row.SetGeometry(poly.Boundary()); boundary.CreateFeature(row)
    rivers = ogr.Open(str(args.rivers))
    lakes = [source(level) for level in (2,4)]
    defs = json.loads((ROOT/'scripts/data/landform-worldcover-windows.json').read_text())
    results = []
    for window in defs:
        w,s,e,n = window['bounds']
        a = np.isin(fetch(window,args.cache_dir),DRY_CLASSES)
        # Retain only the four-neighbour dry component connected to the verified
        # continental reference. Reservoir islets enclosed by water then abstain.
        labels, _ = label(a)
        lat, lon = window['mainlandSeedLatLon']
        ref = labels[int((n-lat)*12000)+1, int((lon-w)*12000)+1]
        if not ref or not any(np.any(side == ref) for side in (labels[0],labels[-1],labels[:,0],labels[:,-1])):
            raise ValueError('Continental reference is not on continuous dry land')
        a = labels == ref
        # Reject the whole block if water, wetland or unknown occurs in the block
        # or in its one-source-pixel halo. This avoids extrapolating across a shore.
        h, width = round((n-s)*SCALE), round((e-w)*SCALE)
        ok = np.ones((h,width),dtype=bool)
        for dy in range(6):
            for dx in range(6):
                ok &= a[dy:dy+4*h:4, dx:dx+4*width:4]
        raster = gdal.GetDriverByName('MEM').Create('',width,h,1,gdal.GDT_Byte)
        raster.SetGeoTransform((w,1/SCALE,0,n,0,-1/SCALE)); raster.SetProjection(common['SRS'].ExportToWkt())
        b = raster.GetRasterBand(1)
        gdal.RasterizeLayer(raster,[1],land,options=['ATTRIBUTE=component'])
        gdal.RasterizeLayer(raster,[1],edges,burn_values=[0],options=['ALL_TOUCHED=TRUE'])
        indexed = raster.ReadAsArray()
        ids = set(np.unique(indexed)) - {0}
        if len(ids) != 1:
            raise ValueError(f'Expected one independent physical component in {window["name"]}: {ids}')
        ok &= indexed > 0
        b.Fill(0)
        gdal.RasterizeLayer(raster,[1],shore,burn_values=[1])
        for layer in [boundary, *(ds.GetLayer() for ds in lakes), rivers.GetLayer()]:
            layer.SetSpatialFilterRect(w,s,e,n)
            gdal.RasterizeLayer(raster,[1],layer,burn_values=[0],options=['ALL_TOUCHED=TRUE'])
            layer.SetSpatialFilter(None)
        ok &= raster.ReadAsArray() == 1
        raw = np.packbits(ok.flatten(),bitorder='little').tobytes()
        results.append(dict(name=window['name'],origin=[round(w*SCALE),round(n*SCALE)],dim=[width,h],
                            component=int(next(iter(ids)))-2,bits=base64.b64encode(raw).decode('ascii')))
        print(window['name'], f'{ok.sum()}/{ok.size}',flush=True)
    out = dict(scale=SCALE,version='WorldCover 2021 v200 + NE 5.1.2 + GSHHG 2.3.7',
               attribution='© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium. GSHHG: Paul Wessel and Walter H. F. Smith. Natural Earth.',
               windows=results)
    (ROOT/'src/data/global-islands/landform-regions.json').write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False)+'\n')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for arg in ('land','rivers','shore_archive'):
        parser.add_argument(arg,type=Path)
    parser.add_argument('--cache-dir',type=Path)
    build(parser.parse_args())
