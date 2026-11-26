#!/usr/bin/env python3
"""Build three surveyed island/coast extracts. Requires GDAL, NumPy, Shapely 2, Python 3.11+.

Use --fieldmaps-gpkg and --gshhg-archive for the pinned map releases. Raster
subsets are read by HTTP range (or from --raster-directory) and hash checked.
"""
import argparse
from hashlib import file_digest, sha256
import json
from math import ceil, floor
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
import shapely
from shapely.geometry import Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
WC = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com'
FM = 'https://fieldmaps.io/data/adm0/'
BR_SOURCES = [
    'https://aisweb.decea.mil.br/?codigo=SBFN&i=aerodromos',
    'https://geoftp.ibge.gov.br/cartas_e_mapas/mapas_municipais/colecao_de_mapas_municipais/2022/PE/fernando_de_noronha/A0_2605459_MM.pdf',
    'https://www.soest.hawaii.edu/pwessel/gshhg/',
]
DEM = ('https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_S04_00_W033_00_DEM/'
       'Copernicus_DSM_COG_10_S04_00_W033_00_DEM.tif')
GSW = 'https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/occurrence_40W_0Nv1_4_2021.tif'
FIELD_EDITION = 'FieldMaps USGS/LSIB 2025-07-29'
BR_CREDIT = ('GSHHG © Paul Wessel and Walter H. F. Smith, LGPL-3.0-or-later. '
             'European Commission JRC Global Surface Water. '
             'produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH '
             '2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved')
WC_CREDIT = ('Contains modified Copernicus Sentinel data (2020, 2021) processed by ESA WorldCover consortium. '
             'ESA WorldCover 2020 v100 and 2021 v200, CC BY 4.0.')
# Coordinates here are longitude, latitude. Anchors identify connected components.
ISLANDS = [
    ('fernando-de-noronha', 'Fernando de Noronha', 'BR', 'SATL', [-32.437, -3.857, -32.419, -3.836],
     (-32.428333333, -3.854722222), (-32.432, -3.839), BR_SOURCES),
    ('robinson-crusoe', 'Robinson Crusoe', 'CL', 'SEPC', [-78.946, -33.680, -78.920, -33.655],
     (-78.929166667, -33.665833333), (-78.944, -33.657), ['https://aipchile.dgac.gob.cl/designador/SCIR']),
    ('gran-roque', 'Gran Roque', 'VE', 'CARB', [-66.687, 11.939, -66.661, 11.956],
     (-66.678, 11.948), (-66.665, 11.9415), ['https://rsis.ramsar.org/RISapp/files/RISrep/VE856RIS.pdf']),
]
HASHES = {
    'noronha-dem': '47c6d725085a523d8b6b9e99f6de094cbfb9a33b95947779877ecfebcc869e71',
    'noronha-water': '48bdbe56b81fc74e535d0584ea8c88060829d1d43704ccb566db2cf62bc2b52d',
    'robinson-crusoe-2020': 'f6622a3a548784f50fc361cbf718c46445419ded1465dd1c083e73614e2a5437',
    'robinson-crusoe-2021': '657ac3f7fced91963c4e4aebcdbb0a5e6b08080997f1e2dcbd18e52c2f815fa7',
    'gran-roque-2020': '604b17e5b3504cc22c9e9edce762bf8a701aa1660ee03f41783adbcaefc9773e',
    'gran-roque-2021': '805141b8b53f6e248938fc761f32c085b8fd57227a4acdb6e5d8c0075ba86ef8',
}


def check_file(path, expected):
    with path.open('rb') as f:
        if file_digest(f, 'sha256').hexdigest() != expected:
            raise ValueError(f'Unexpected input version: {path}')


def polygons(g):
    if g.is_empty:
        return []
    if g.geom_type == 'Polygon':
        return [g]
    if g.geom_type in ('MultiPolygon', 'GeometryCollection'):
        return [poly for part in g.geoms for poly in polygons(part)]
    return []


def pack(g, **tags):
    result = []
    for p in sorted(polygons(shapely.set_precision(g, 1e-7)), key=lambda p: p.bounds):
        p = shapely.normalize(p)
        rings = [[[round(x, 7), round(y, 7)] for x, y in r.coords] for r in [p.exterior, *p.interiors]]
        result.append(dict(**tags, bbox=[round(v, 7) for v in p.bounds], rings=rings))
    return result


def mask_geometry(mask, grid):
    ds = gdal.GetDriverByName('MEM').Create('', mask.shape[1], mask.shape[0], 1, gdal.GDT_Byte)
    ds.SetGeoTransform(grid)
    band = ds.GetRasterBand(1)
    band.WriteArray(mask.astype('uint8'))
    out = ogr.GetDriverByName('Memory').CreateDataSource('')
    layer = out.CreateLayer('mask', geom_type=ogr.wkbPolygon)
    gdal.Polygonize(band, band, layer, -1, [])
    return unary_union([shapely.make_valid(shapely.from_wkb(bytes(f.geometry().ExportToWkb()))) for f in layer])


def raster(url, extent, local, digest_key):
    ds = gdal.Open(str(local / url.rsplit('/', 1)[-1]) if local else '/vsicurl/' + url)
    x, dx, rx, y, ry, dy = ds.GetGeoTransform()
    if ds.GetSpatialRef().GetAuthorityCode(None) != '4326' or rx or ry or dy >= 0 or dx <= 0:
        raise ValueError('Expected north-up WGS84 source image')
    w, s, e, n = extent
    left, right = floor((w-x)/dx), ceil((e-x)/dx)
    top, bottom = floor((n-y)/dy), ceil((s-y)/dy)
    band = ds.GetRasterBand(1)
    a = band.ReadAsArray(left, top, right-left, bottom-top)
    digest = sha256(a.astype(a.dtype.newbyteorder('<'), copy=False).tobytes()).hexdigest()
    if digest != HASHES[digest_key]:
        raise ValueError(f'Unexpected source pixels for {digest_key}')
    return a, (x+left*dx, dx, 0, y+top*dy, 0, dy), band.GetNoDataValue()


def local_polygons(layer, frame):
    layer.SetSpatialFilterRect(*frame.bounds)
    return [shapely.make_valid(shapely.from_wkb(bytes(f.geometry().ExportToWkb()))).intersection(frame) for f in layer]


def connected(geom, pin):
    piece, = (p for p in polygons(geom) if p.contains(Point(pin)))
    return piece


def window(item, fm, gshhg, local):
    key, name, code, ocean, bounds, dry_pin, sea_pin, references = item
    w, s, e, n = bounds
    frame = box(w-.001, s-.001, e+.001, n+.001)
    fm.SetAttributeFilter(f"iso_2='{code}' AND status_nm='State'")
    admin = unary_union(local_polygons(fm, frame))
    if not admin.contains(Point(dry_pin)):
        raise ValueError(f'Country map missing {name} control')
    if code == 'BR':
        # Both WorldCover releases omit this airfield. Use surveyed physical
        # shore, elevation and an inland-water veto for this window instead.
        heights, grid, empty = raster(DEM, frame.bounds, local, 'noronha-dem')
        valid = np.isfinite(heights) & (heights != empty)
        inland, hg, _ = raster(GSW, frame.bounds, local, 'noronha-water')
        shore = unary_union(local_polygons(gshhg, frame))
        island = connected(shore, dry_pin)
        dry = mask_geometry(valid & (heights >= 5), grid).intersection(island)
        dry = dry.difference(mask_geometry((inland > 0) & (inland <= 100), hg))
        wet = mask_geometry(valid & (heights == 0), grid).difference(shore)
        urls = [DEM, GSW]
        version = 'GSHHG full 2.3.7; Copernicus GLO-30; JRC GSW v1.4'
        credit = BR_CREDIT
    else:
        tx, ty = 3*floor(w/3), 3*floor(s/3)
        tile = f'{"N" if ty>=0 else "S"}{abs(ty):02}W{abs(tx):03}'
        arrays, urls = [], []
        for year, edition in [(2020, 'v100'), (2021, 'v200')]:
            url = f'{WC}/{edition}/{year}/map/ESA_WorldCover_10m_{year}_{edition}_{tile}_Map.tif'
            a, grid, _ = raster(url, frame.bounds, local, f'{key}-{year}')
            arrays.append(a)
            urls.append(url)
        dry_classes = [10, 20, 30, 40, 50, 60]
        # An inward native-pixel margin withholds mixed shore, piers and thin spits.
        dry = mask_geometry(np.isin(arrays[0], dry_classes) & np.isin(arrays[1], dry_classes), grid)
        dry = dry.buffer(-grid[1], join_style='mitre')
        wet = mask_geometry((arrays[0] == 80) & (arrays[1] == 80), grid)
        version = 'ESA WorldCover 2020 v100 and 2021 v200'
        credit = WC_CREDIT
    # On Gran Roque the lagoons and one-pixel shore margin split the dry
    # town from the northern hills. Both controls lie on the named island.
    pins = [dry_pin, (-66.67706, 11.95080)] if key == 'gran-roque' else [dry_pin]
    if not all(admin.contains(Point(p)) for p in pins):
        raise ValueError('Positive island control outside local country outline')
    dry = unary_union([connected(dry, p) for p in pins]).intersection(frame)
    wet = connected(wet.difference(admin), sea_pin).intersection(frame)
    owner = dry.intersection(admin)
    if not owner.contains(Point(dry_pin)) or wet.intersection(dry).area:
        raise ValueError(f'Contradictory island or sea control: {name}')
    return dict(id=key, name=name, bbox=bounds, oceanRegion=ocean, source='south-america-review+'+key,
                version=version+'; '+FIELD_EDITION, attribution=credit+' '+FIELD_EDITION+' (public domain).',
                evidenceUrls=[*references, FM, *urls], land=pack(dry, kind='island', name=name),
                owners=pack(owner, code=code), water=pack(wet, kind='ocean'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fieldmaps-gpkg', type=Path, required=True)
    parser.add_argument('--gshhg-archive', type=Path, required=True)
    parser.add_argument('--raster-directory', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'src/data/southAmericaOffshoreReviewed.json')
    args = parser.parse_args()
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    check_file(args.fieldmaps_gpkg, '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9')
    check_file(args.gshhg_archive, '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41')
    fm = ogr.Open(str(args.fieldmaps_gpkg))
    gshhg = ogr.Open(f'/vsizip/{args.gshhg_archive.resolve()}/GSHHS_shp/f/GSHHS_f_L1.shp')
    data = {'windows': [window(item, fm.GetLayerByName('adm0_polygons'), gshhg.GetLayer(), args.raster_directory)
                        for item in ISLANDS]}
    args.output.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n')


if __name__ == '__main__':
    main()
