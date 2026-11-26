#!/usr/bin/env python3
"""Rebuild the Nunavut islet survey from NRCan vectors and pinned raster windows.

Requires GDAL, NumPy and Shapely 2. --raster-directory can supply local COGs
with their original filenames. Downloads use range requests by default.
"""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import floor
from pathlib import Path
from urllib.request import urlopen

import numpy as np
from osgeo import gdal
from shapely.geometry import Point, Polygon, shape
from shapely.ops import unary_union

geo = import_module('build-northern-central-america-review')
andes = import_module('build-south-america-andes')
ROOT = Path(__file__).resolve().parents[1]
NAMES = 'https://geogratis.gc.ca/services/geoname/en/geonames/'
ECCC = 'https://www.canada.ca/en/environment-climate-change/services/'
CHS = 'https://waves-vagues.dfo-mpo.gc.ca/library-bibliotheque/chs-shc-ARC402-eng-202604-41326076.pdf'
PGC = 'https://pgc-opendata-dems.s3.us-west-2.amazonaws.com/arcticdem/mosaics/v4.1/2m/'
TILES = {'cheyne': '31_29_2_1', 'princess-charlotte': '28_32_1_1'}
PGC_CREDIT = (' Porter et al. (2023), ArcticDEM – Mosaics, Version 4.1, Harvard Dataverse V1, '
              'doi:10.7910/DVN/3VDC4W (accessed 2026-11-26). DEMs provided by the Polar Geospatial '
              'Center under NSF-OPP awards 1043681, 1559691, 1542736, 1810976 and 2129685.')
# Each sampled sea-level reference is local: PGC heights are ellipsoidal.
SITES = [
    ('cheyne', 'Cheyne Islands, Penny Strait', [-97.536, 76.282, -97.504, 76.339],
     ['OALUP', 'OAKTU', 'OAPKH'], (-97.522, 76.320),
     'https://publications.gc.ca/collections/collection_2018/eccc/CW69-1-114-eng.pdf'),
    ('seymour', 'Seymour Island, Naujavaat', [-101.309, 76.797, -101.22, 76.822],
     ['OAOTI'], (-101.275, 76.820), ECCC+'migratory-bird-sanctuaries/locations/naujavaat.html'),
    ('princess-charlotte', 'Princess Charlotte Monument, Nirjutiqarvik',
     [-78.852, 75.831, -78.812, 75.847], ['OANEU', 'OADPE'], (-78.847, 75.844),
     ECCC+'national-wildlife-areas/locations/nirjutiqavvik.html'),
    ('orne', 'Orne Island, Smith Sound', [-76.371, 77.872, -76.297, 77.890],
     ['OAMGI'], (-76.353, 77.888), CHS),
]
VECTOR_SHA = {'OALUP': '18d4fbfbfb9d24bab6af917478f31273fa8c00a3e299423acff38976598c5dc1',
 'OAKTU': 'bc4b5d2544accccb78e15230e0d85411d0848a9c2c557f68c2093b8e31e52f0c',
 'OAPKH': '3d4c2adf2ed6e9c61593d1d0037ac3b0c3d7c25142fd72c923276e941fdae8e5',
 'OAOTI': 'b02409249e108f1568b60b9dd3beed77f52d2e89df22c90ca83cb32b84e7f486',
 'OANEU': '27fdb3ed90cc0d68b33efae894937f16c8a91c4e2bceb0214f9dac370e411487',
 'OADPE': '80ee1e8de79b17355a995a46282e7dd99cf7772cbb8ed53655a71f11c8ef9e37',
 'OAMGI': '89311d2ced95a95ddcd69000c0d8724fd65e4ae7c8d8d3c49da547fa995b7d84'}
PIXEL_SHA = {'cheyne': ['41a024615f061aa6afcfcf7b3b0684976de0ea5b11c9b475204344de2a403810',
            '6bd23fb696d3640aecd868876d1748b56dcf9f3dbb0a6762d077c7ad29bd6af1'],
 'seymour': ['ea409d17652737b0b0ec07d2e84dca0e09b575f414ae7c492273e8e9c854f6c1',
             'e21624ee05f18bbe685c9565fe2e4b8d107320eabce9023df9dbfc98d962fb64'],
 'princess-charlotte': ['356789ba9131f30de89934a1c3457acbee5ac940b214c1329f06293ad69012f2',
                        'ed33900233d1c9d6a4d44c089f4027c093b22ebfb66af05f3b98e1c3140c616f'],
 'orne': ['1858d865d8960f2197784c3837456b62aaaa0e24c86d95c6320cf01d92d59a38',
          'bb36139cf2c8b538f1b848c48fcfdec6de13dc35fa4c687ba6c1ebbd5b19f3a9']}
HEIGHT_SHA = {'cheyne': '1dad5268736ffa7ff007fc759c1255cd473fe355991925e1c20511e62c8ea489',
 'princess-charlotte': 'fc7953354cf620baa49f2e34ac09b27d3a96452eff5cf40beee5afcbb14d9043'}


def checked(data, expected, key):
    actual = sha256(data).hexdigest()
    if actual != expected:
        raise ValueError(f'Unexpected source for {key}: {actual}')


def outline(key, cache):
    url = NAMES + key + '.geojson?expand=feature'
    path = cache / (key+'.json')
    raw = path.read_bytes() if path.exists() else urlopen(url, timeout=45).read()
    f = json.loads(raw)
    props = f['properties']
    if (props['cgndbid'], props['status'], props['concise'], props['province']) != (key, 'official', 'ISL', '62'):
        raise ValueError('Expected official Nunavut island record: '+key)
    checked(json.dumps(f['geometry'], separators=(',', ':')).encode(), VECTOR_SHA[key], key)
    if not path.exists():
        path.write_bytes(raw)
    return props['name'], shape(f['geometry']), url


def covers(key, bounds, directory):
    west, south, east, north = bounds
    tx, ty = 3*floor(west/3), 3*floor(south/3)
    if east >= tx+3 or north >= ty+3:
        raise ValueError('Window crosses source tile')
    urls, arrays = [], []
    for i, (year, v) in enumerate([(2020, 'v100'), (2021, 'v200')]):
        name = f'ESA_WorldCover_10m_{year}_{v}_N{ty:02}W{-tx:03}_Map.tif'
        url = f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{v}/{year}/map/{name}'
        a, grid = andes.read_raster(url, bounds, PIXEL_SHA[key][i], directory)
        if arrays and grid != previous_grid:
            raise ValueError('WorldCover grid mismatch')
        previous_grid = grid
        urls.append(url)
        arrays.append(a)
    return arrays, grid, urls


def relative_heights(key, grid, size, sea_pin, directory):
    tile = TILES[key]
    url = f'{PGC}{tile[:5]}/{tile}_2m_v4.1_dem.tif'
    src = str(directory / url.rsplit('/', 1)[-1]) if directory else '/vsicurl/'+url
    h, w = size
    x, dx, _, y, _, dy = grid
    image = gdal.Warp('', src, format='MEM', dstSRS='EPSG:4326', errorThreshold=0,
                      outputBounds=(x, y+h*dy, x+w*dx, y), width=w, height=h,
                      resampleAlg='near', dstNodata=-9999)
    heights = image.ReadAsArray()
    checked(heights.astype('<f4').tobytes(), HEIGHT_SHA[key], key+' ArcticDEM')
    sea = heights[floor((sea_pin[1]-y)/dy), floor((sea_pin[0]-x)/dx)]
    if sea <= -9999 or not np.isfinite(sea):
        raise ValueError('Missing local ArcticDEM sea reference')
    return heights - sea, url


def compact(g, inset):
    if g.is_empty:
        return g
    # Simplified boundaries must remain within the original evidence polygon.
    return g.buffer(-inset, join_style='mitre').simplify(inset*0.9).intersection(g)


def window(site, cache, directory):
    key, title, bounds, ids, sea_pin, info = site
    outlines = [outline(i, cache) for i in ids]
    (a, b), grid, rasters = covers(key, geo.padded(bounds), directory)
    dry_classes = [10, 20, 30, 40, 50, 60, 100]
    dry = np.isin(a, dry_classes) & np.isin(b, dry_classes)
    wet = (a == 80) & (b == 80)
    urls = [info, *(u for _, _, u in outlines), *rasters]
    if key in TILES:
        relative, url = relative_heights(key, grid, a.shape, sea_pin, directory)
        urls.extend([url, 'https://doi.org/10.7910/DVN/3VDC4W'])
        if key == 'cheyne':
            # Canadian field surveys describe mossy ground around the mapped
            # ponds. Admit marsh pixels only on ground above the nearby strait.
            terrestrial = [*dry_classes, 90]
            dry |= np.isin(a, terrestrial) & np.isin(b, terrestrial) & (relative > 1.5)
        else:
            dry &= relative > 12
            wet &= (relative > -3) & (relative < 3)
            urls.append(CHS)
    dry_area = geo.raster_mask(dry, grid)
    wet_area = geo.raster_mask(wet, grid)
    # An inland pond and the ocean can have the same satellite class. Retain
    # every national interior ring and remove island exteriors from the sea.
    shells = unary_union([Polygon(p.exterior) for _, land, _ in outlines for p in geo.polygons(land)])
    land, owners = [], []
    for name, polygon, _ in outlines:
        if name == 'Princess Charlotte Monument':
            # The old gazetteer polygon is displaced. Two summer mosaics and
            # independent high-relief stereo DEM locate the pinnacle described
            # by CHS. Keep the old outline out of water claims as well.
            candidates = [p for p in geo.polygons(dry_area) if p.contains(Point(-78.827, 75.8412))]
            if len(candidates) != 1:
                raise ValueError('No unique elevated Princess Charlotte Monument component')
            physical = candidates[0]
        else:
            physical = dry_area.intersection(polygon)
        # Petite bare remnants on North Cheyne have only a few source pixels.
        # Preserve a small conservative margin; never manufacture a dry buffer.
        stable = compact(physical, grid[1]*(0.15 if key == 'cheyne' else 0.8))
        land.extend(geo.pack(stable, kind='island', name=name))
        owners.extend(geo.pack(stable, code='CA'))
    ocean_parts = [p for p in geo.polygons(wet_area.difference(shells))
                   if p.contains(Point(sea_pin))]
    if len(ocean_parts) != 1 or not land:
        raise ValueError('Missing checked sea or island in '+key)
    coast = compact(ocean_parts[0], grid[1])
    ponds = unary_union([Polygon(r) for _, land_shape, _ in outlines
                         for p in geo.polygons(land_shape) for r in p.interiors])
    water = geo.pack(coast, kind='ocean') + geo.pack(compact(wet_area.intersection(ponds), grid[1]), kind='inland')
    return dict(id='canada-arctic-'+key, name=title, bbox=bounds, source='canada-arctic-review+'+key,
                version='NRCan CGNDB; ESA WorldCover 2020 v100 and 2021 v200'+('; ArcticDEM v4.1' if key in TILES else ''),
                attribution='Contains information licensed under the Open Government Licence – Canada. '
                            +geo.WC_CREDIT+(PGC_CREDIT if key in TILES else ''),
                evidenceUrls=urls, oceanRegion='ARCT', land=land, owners=owners, water=water)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source-directory', type=Path, required=True)
    p.add_argument('--raster-directory', type=Path)
    p.add_argument('--output', type=Path, default=ROOT/'src/data/canadaArcticReviewed.json')
    args = p.parse_args()
    args.source_directory.mkdir(exist_ok=True, parents=True)
    gdal.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    data = {'windows': [window(s, args.source_directory, args.raster_directory) for s in SITES]}
    args.output.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n')


if __name__ == '__main__':
    main()
