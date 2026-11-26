#!/usr/bin/env python3
"""Build five B.C. small-island windows from provincial polygons and ESA WorldCover.

Python 3.11+, GDAL 3 with HTTPS range support, NumPy and Shapely 2.
Optional --cache-dir retains only the small source subsets; no global downloads.
"""
import argparse
from hashlib import sha256
import json
from math import ceil, floor
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
from osgeo import gdal, ogr
import shapely
from shapely.geometry import box, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
FWA = 'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_basemapping/MapServer/46'
CATALOG = 'https://open.canada.ca/data/dataset/4483aeea-df26-4b83-a565-934c769e74de'
WC = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com'
PARK = 'https://parks.canada.ca/pn-np/bc/'
GULF = 'https://parks.canada.ca/-/media/pn-np/bc/gulf/wet4/visit/pdf/gi-visitorguide2025-midyr--en-vweb.pdf'
BROKEN = PARK + 'pacificrim/activ/broken-group'
GWAII = PARK + 'gwaiihaanas/culture/cultural-sites-culturels/cultural-sites-culturels-'
# Public names, extent, local reference, digests of FWA geometry and two ESA pixel arrays.
REGIONS = {
    'gulf-pellow-islets': ('Pellow Islets / Portland Island', [-123.367, 48.7215, -123.354, 48.728], GULF,
        '7f24adf2163c4faf3ea9968ea7d141fd6c8dd3472d1426a46574b9b1422a41b6',
        '20f019ba96caf1c9585636b47f276a10ea837462af62992348892b08f34d9f0e',
        '606551520fc892caa339705b8653e856f2785e0b9e928915c247585e5524d513'),
    'gulf-cabbage-island': ('Cabbage Island / Reef Harbour', [-123.094, 48.7925, -123.081, 48.802], GULF,
        'e728f50654e5e98a6b6e3d844857735f23e2649ca202f843fe5900d8967557a0',
        '0155bffa2a4c80acf1e3d17d956840268f4a7fb3484728f6c215e092a494d90d',
        'ece4622ba4e379f46499391c6df3c3f9911d827ecbcd6332645067f2bbdfc7d8'),
    'barkley-benson-island': ('Benson Island / Broken Group', [-125.39, 48.878, -125.374, 48.889], BROKEN,
        '442426818f770d4ede8b57017723eeab9eeff2cd63c6ec0f8ac436daabc7399e',
        '0c31e6508a4448308730dd355f937281565af1f648a56fc9d30073235a3272eb',
        '107b5f8910853119708baa2b9e55875ea98d8cfc0e8a7a634cd048e6f935bfeb'),
    'haida-hotspring-island': ('G̱andll K’in Gwaay.yaay', [-131.451, 52.572, -131.432, 52.583], GWAII+'4',
        'a99d6705d4725b0d6ae5f3d155b90e835a7b4e32fa6acef702f3a7f08717528e',
        '5a7ef1912984c2acbde43bc6d59187cd221a9d472d747a990eb26055f61c1d08',
        '5d7ea8532f27ea7b32971c064ec4a12c08bcd8d07ef41a700878e033aecfcb32'),
    'haida-sgang-gwaay': ('SG̱ang Gwaay', [-131.236, 52.083, -131.207, 52.106], GWAII+'5',
        '96f0668cfdba9c5cfeeca02379d79488b0b312403aff9c270e18f5276f18f4a7',
        '4bd3423b60c7f27ac93f330314e46d5739b2a6bab9c776d7a0709ad1452f0d48',
        'd621125e605b500b3eacb7b0cd81ac556b17b12d49b39c6bf39ead7f8afa4d3c'),
}


def check(data, expected, label):
    if sha256(data).hexdigest() != expected:
        raise ValueError(f'{label}: source geometry or pixel edition changed')


def marine_islands(key, frame, digest, cache):
    params = {'where': "ISLAND_TYPE='Marine'", 'geometryType': 'esriGeometryEnvelope',
              'spatialRel': 'esriSpatialRelIntersects', 'geometry': ','.join(f'{v:.6f}' for v in frame.bounds),
              'inSR': 4326, 'outSR': 4326, 'outFields': 'ISLAND_ID,GNIS_NAME_1',
              'returnGeometry': 'true', 'f': 'geojson'}
    path = cache / (key+'.geojson') if cache else None
    if path and path.exists():
        data = path.read_bytes()
    else:
        with urlopen(FWA+'/query?'+urlencode(params), timeout=90) as response:
            data = response.read()
    obj = json.loads(data)
    if obj.get('exceededTransferLimit') or obj.get('properties', {}).get('exceededTransferLimit'):
        raise ValueError(f'{key}: partial island extract')
    features = sorted(obj['features'], key=lambda f: f['properties']['ISLAND_ID'])
    records = [(f['properties']['ISLAND_ID'], f['properties']['GNIS_NAME_1'], f['geometry']) for f in features]
    check(json.dumps(records, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode(), digest, key)
    if path and not path.exists():
        path.write_bytes(data)
    return [(name, shapely.make_valid(shape(g)).intersection(frame)) for _, name, g in records]


def pixels(key, frame, year, edition, digest, cache):
    west, south, east, north = frame.bounds
    tx, ty = 3*floor(west/3), 3*floor(south/3)
    if not (-180 <= west < east <= 180 and -90 <= south < north <= 90
            and east <= tx + 3 and north <= ty + 3):
        raise ValueError(f'{key}: raster window must fit one WorldCover tile')
    tile = f'{"N" if ty >= 0 else "S"}{abs(ty):02}{"E" if tx >= 0 else "W"}{abs(tx):03}'
    url = f'{WC}/{edition}/{year}/map/ESA_WorldCover_10m_{year}_{edition}_{tile}_Map.tif'
    step = 1/12000
    left, right = floor((west-tx)/step), ceil((east-tx)/step)
    top, bottom = floor((ty+3-north)/step), ceil((ty+3-south)/step)
    grid = (tx+left*step, step, 0, ty+3-top*step, 0, -step)
    path = cache / f'{key}-{year}.npy' if cache else None
    if path and path.exists():
        arr = np.load(path, allow_pickle=False)
    else:
        ds = gdal.Open('/vsicurl/'+url)
        if not np.allclose(ds.GetGeoTransform(), (tx, step, 0, ty+3, 0, -step), rtol=0, atol=1e-12):
            raise ValueError(f'{key}: unexpected WorldCover grid')
        arr = ds.ReadAsArray(left, top, right-left, bottom-top)
    if arr.shape != (bottom-top, right-left) or arr.dtype != np.uint8:
        raise ValueError('Unexpected raster dimensions or data type')
    check(arr.tobytes(), digest, f'{key}/{year}')
    if path and not path.exists():
        np.save(path, arr)
    return arr, grid, url


def polygons(geometry):
    if geometry.is_empty:
        return
    if geometry.geom_type == 'Polygon':
        yield geometry
    elif geometry.geom_type in ('MultiPolygon', 'GeometryCollection'):
        for part in geometry.geoms:
            yield from polygons(part)


def mask_geometry(mask, grid):
    ds = gdal.GetDriverByName('MEM').Create('', mask.shape[1], mask.shape[0], 1, gdal.GDT_Byte)
    ds.SetGeoTransform(grid)
    band = ds.GetRasterBand(1)
    band.WriteArray(mask.astype(np.uint8))
    vector = ogr.GetDriverByName('Memory').CreateDataSource('')
    layer = vector.CreateLayer('mask', geom_type=ogr.wkbPolygon)
    gdal.Polygonize(band, band, layer, -1, [])
    return unary_union([shapely.make_valid(shapely.from_wkb(bytes(f.geometry().ExportToWkb()))) for f in layer])


def pack(geometry, **tags):
    result = []
    for piece in sorted(polygons(shapely.set_precision(geometry, 1e-6)), key=lambda p: p.bounds):
        p = shapely.normalize(piece)
        rings = [[[round(x, 6), round(y, 6)] for x, y in ring.coords] for ring in [p.exterior, *p.interiors]]
        result.append({**tags, 'bbox': [round(v, 6) for v in p.bounds], 'rings': rings})
    return result


def build(key, region, cache):
    label, bbox, reference, atlas_hash, v100_hash, v200_hash = region
    frame = box(*bbox).buffer(.0006, join_style='mitre')
    islands = marine_islands(key, frame, atlas_hash, cache)
    earlier, grid, u20 = pixels(key, frame, 2020, 'v100', v100_hash, cache)
    later, _, u21 = pixels(key, frame, 2021, 'v200', v200_hash, cache)
    # Exclude seasonal shore, marsh, and lake surfaces from positive marine land.
    dry_classes = [10, 20, 30, 40, 50, 60]
    dry = mask_geometry(np.isin(earlier, dry_classes) & np.isin(later, dry_classes), grid)
    atlas = unary_union([g for _, g in islands])
    # The ocean requires positive permanent water in both editions and location
    # outside every mapped island. Interior ponds cannot become coastal water.
    water = mask_geometry((earlier == 80) & (later == 80), grid).intersection(frame).difference(atlas)
    land, owners = [], []
    for name, g in islands:
        if name in ('Haida Gwaii', 'Broken Group', 'Gulf Islands'):
            name = None  # Generic archipelago only; no individual toponym in this record.
        if name == 'Anthony Island':
            name = 'SG̱ang Gwaay (Anthony Island)'
        if name == 'Hotspring Island':
            name = 'G̱andll K’in Gwaay.yaay (Hotspring Island)'
        footprint = g.intersection(dry)
        land.extend(pack(footprint, kind='island', **({'name': name} if name else {})))
        owners.extend(pack(footprint, code='CA'))
    if not land or water.is_empty:
        raise ValueError(f'{key}: missing dry or marine evidence')
    return dict(id=key, name=label, bbox=bbox, source='canada-islands-review+'+key,
                version='GeoBC FWA marine islands (2026-11-26 extract); ESA WorldCover 2020 v100 / 2021 v200',
                attribution='Contains information licensed under the Open Government Licence – British Columbia. '
                'Contains modified Copernicus Sentinel data (2020, 2021), processed by the ESA WorldCover '
                'consortium, CC BY 4.0.', evidenceUrls=[CATALOG, FWA, reference, u20, u21],
                oceanRegion='NEPC', land=land, owners=owners, water=pack(water, kind='ocean'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT/'src/data/canadaPacificReviewed.json')
    args = parser.parse_args()
    if args.cache_dir:
        args.cache_dir.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    result = {'windows': [build(k, v, args.cache_dir) for k, v in REGIONS.items()]}
    args.output.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')


if __name__ == '__main__':
    main()
