#!/usr/bin/env python3
"""Build reviewed reaches of three international rivers. Requires GDAL, NumPy and Shapely 2."""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import ceil, floor
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
import shapely
from shapely.geometry import Point, box
from shapely.ops import unary_union

base = import_module('build-northern-central-america-review')
ROOT = Path(__file__).resolve().parents[1]
SPECS = {
    # Downstream of the road bridge, clear of its deck. North/south banks can span different countries.
    'kazungula': ('Zambezi at Kazungula', [25.265, -17.813, 25.283, -17.780],
                  [(25.276,-17.783),(25.268375,-17.808417)], 'https://www.afdb.org/en/projects-and-operations/selected-projects/kazungula-bridge-bridging-the-regional-divide-98'),
    'rosso': ('Senegal River at Rosso', [-15.825,16.498,-15.800,16.521],
              [(-15.815,16.518),(-15.815,16.502)], 'https://www.afdb.org/en/projects-and-operations/p-z1-d00-020'),
    'pool-malebo': ('Congo River between Brazzaville and Kinshasa', [15.263,-4.318,15.286,-4.285],
                    [(15.267,-4.288),(15.282,-4.315)], 'https://www.britannica.com/place/Malebo-Pool'),
}
HASHES = {
    "kazungula": [
        "81b643cca37b4eec7317a6082d2dd64c907fb4e2c2564dcdd295051b617b333c",
        "9c9f2b40315a19dc1900791cff8437b57e8507ee2e51fd4efa590c8f54e4aec8"
    ],
    "rosso": [
        "a2b824cc5c20616527677b1f8f93401edb63b2b326e35f0af6d041e99bf27a8b",
        "d6532737b2fe49cabf4882fb014ea2b8e681a72d4c01cffbb9f620e54d8c3073"
    ],
    "pool-malebo": [
        "2a59bbdd0c9e6d4fb6a5dc4ceedcf2698219aa9f9fa633f206fd888cd01d71c5",
        "65b6f2f70d45b5f91031e90e762d9a28f927a0ded4b237bb23cf2735813e2c7f"
    ]
}
def window(key, spec, dataset, cache):
    name, bounds, anchors, source_url = spec
    w, s, e, n = base.padded(bounds)
    west, south = 3*floor(w/3), 3*floor(s/3)
    tile = f'{"N" if south >= 0 else "S"}{abs(south):02}{"E" if west >= 0 else "W"}{abs(west):03}'
    x, y = floor((w-west)*12000), floor((south+3-n)*12000)
    width, height = ceil((e-west)*12000)-x, ceil((south+3-s)*12000)-y
    transform = (west+x/12000,1/12000,0,south+3-y/12000,0,-1/12000)
    arrays, urls = [], []
    for year, version in [(2020,'v100'),(2021,'v200')]:
        url = f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{version}/{year}/map/ESA_WorldCover_10m_{year}_{version}_{tile}_Map.tif'
        path = cache / f'{key}-{year}.bin'
        if path.exists():
            a = np.fromfile(path, dtype=np.uint8).reshape(height,width)
        else:
            ds = gdal.Open('/vsicurl/' + url)
            if ds.GetSpatialRef().GetAuthorityCode(None) != '4326' or not np.allclose(
                    ds.GetGeoTransform(), (west,1/12000,0,south+3,0,-1/12000), rtol=0,atol=1e-15):
                raise ValueError('Unexpected WorldCover grid')
            a = ds.ReadAsArray(x,y,width,height)
            a.tofile(path)
        digest = sha256(a.tobytes()).hexdigest()
        if digest != HASHES[key][year-2020]:
            raise ValueError('Unexpected pixel edition')
        arrays.append(a)
        urls.append(url)
    dry_mask = np.isin(arrays[0], [10,20,30,40,50,60]) & np.isin(arrays[1], [10,20,30,40,50,60])
    dry = base.raster_mask(dry_mask, transform)
    # A land component must connect to one of the dry, mainland bank reference points.
    banks = [p for p in base.polygons(dry) if any(p.covers(Point(pin)) for pin in anchors)]
    if len(banks) < 2:
        raise ValueError(f'Bank references must reach separate continuous banks at {name}')
    dry = unary_union(banks)
    water = base.raster_mask((arrays[0] == 80) & (arrays[1] == 80), transform)
    water = unary_union([p for p in base.polygons(water) if p.area > .00001])
    if dry.intersection(water).area > 1e-13 or not water.area:
        raise ValueError('Invalid river dataset')
    layer = dataset.GetLayerByName('adm0_polygons')
    layer.SetSpatialFilterRect(w,s,e,n)
    frame = box(w,s,e,n)
    owners = []
    for f in layer:
        if f['status_nm'] != 'State' or not f['iso_2']:
            continue
        g = shapely.make_valid(shapely.from_wkb(bytes(f.geometry().ExportToWkb()))).intersection(frame)
        owners.extend(base.pack(dry.intersection(g), code=f['iso_2']))
    return dict(id=key, name=name, bbox=bounds, source='africa-river+'+key,
                version='ESA WorldCover 2020 v100 and 2021 v200; FieldMaps USGS 2025-07-29',
                attribution=base.WC_CREDIT+' FieldMaps USGS/LSIB (public domain).',
                evidenceUrls=[source_url,base.FM_URL,*urls], land=base.pack(dry,kind='mainland'),
                water=base.pack(water,kind='inland'),owners=owners)

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('fieldmaps',type=Path)
    parser.add_argument('cache',type=Path)
    parser.add_argument('--output',type=Path,default=ROOT/'src/data/africanBorderRiversReviewed.json')
    args=parser.parse_args()
    args.cache.mkdir(parents=True,exist_ok=True)
    base.check(args.fieldmaps,base.FM_SHA)
    gdal.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN','EMPTY_DIR')
    ds=ogr.Open(str(args.fieldmaps))
    windows=[window(k,v,ds,args.cache) for k,v in SPECS.items()]
    args.output.write_text(json.dumps(dict(windows=windows), separators=(',',':'),ensure_ascii=False)+'\n')
