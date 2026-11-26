#!/usr/bin/env python3
"""Rebuild three Melanesian shoreline surveys from pinned native-grid raster windows.

Requires GDAL, NumPy and Shapely 2. By default GDAL fetches only the needed
source blocks. Use --raster-directory with original GeoTIFFs for offline builds.
"""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import ceil, floor
from pathlib import Path

import numpy as np
from osgeo import gdal
from shapely import set_precision, union_all
from shapely.geometry import Point, box

geo = import_module('build-northern-central-america-review')
ROOT = Path(__file__).resolve().parents[1]
HANSEN = 'https://storage.googleapis.com/earthenginepartners-hansen/GFC-2024-v1.12'
WC = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com'
DEM = 'https://copernicus-dem-30m.s3.amazonaws.com'
DEM_CREDIT = import_module('build_us_pacific_islands').DEM_CREDIT
H_CREDIT = ' Source: Hansen/UMD/Google/USGS/NASA, GFC v1.12 (CC BY 4.0). Native land/water cells intersected with WorldCover.'
WINDOWS = [
    dict(id='fj-taveuni-somosomo', name='Taveuni and Somosomo Strait at the 180th meridian',
         bbox=[179.988, -16.810, 180.012, -16.765], code='FJ', sea='SPAC',
         islands=[('Taveuni', 180.0, -16.805)], water=(180.0, -16.7905),
         evidence=['https://efl.com.fj/wp-content/uploads/2017/08/MR-207-2017-Specs.pdf',
                   'https://pafpnet.spc.int/attachments/article/120/TRTCenter.pdf']),
    dict(id='vu-port-vila-harbour', name='Port Vila Harbour, Ifira, Iririki and Efate',
         bbox=[168.282, -17.757, 168.316, -17.737], code='VU', sea='SPAC',
         islands=[('Ifira', 168.29543, -17.74805), ('Iririki', 168.30956, -17.74468),
                  ('Efate', 168.315, -17.747)], water=(168.304, -17.745),
         evidence=['https://iho.int/uploads/user/Inter-Regional%20Coordination/RHC/SWPHC/SWPHC21-2024/SWPHC21-08L_2024_EN_Presentation_National_Report_Vanuatu.pdf',
                   'https://vpmu.gov.vu/images/pdf/lapetasi/Star_Terminal_Construction_Project_Final_Report.pdf']),
    dict(id='vu-gaua-lake-letas', name='Lake Letas and the Mount Garet peninsula, Gaua',
         bbox=[167.506, -14.267, 167.535, -14.242], code='VU',
         islands=[('Gaua', 167.521, -14.248)], water=(167.521, -14.264),
         evidence=['https://whc.unesco.org/en/tentativelists/1974/',
                   'https://www.vmgd.gov.vu/geohazards/volcanoes']),
]
DIGESTS = {
    "fj-taveuni-somosomo": [
        "0b2b37eaef3f8542fa8c6ebcf336eb55708bc93fd0a39986421fb2d2b092548f",
        "4287501b3bfa6c957fdd765454ca17e8f3c24580a76e6010a96d0569174f0827",
        "1dec0515e7006f52c620c1c8310e6b81953d071568e2bdb8c45e138cb29d7884",
        "a86a7d164990810b538cbb707cbc72124839922982e2c57538f00a8991eccba3",
        "4498176fbd4ad05098824bf55a8509f00f80b04ad6bccc37828c15595609d64d",
        "21b2fc860d8d42596af1653d1c91acc42d11139f9c3c27feeff7a526d90914d9",
        "1d1f96c67d70d3001fcb5843271d841ff2c733a1f980d45066b2f923e183effe",
        "e969e689e5f260aa71f6692c81514da809d7a9ef4b654b04ab880d43197456f1",
        "5739f6e9a1a7b4a930a3521e147046e41ecdf1728e585372c0f41e72a470a5e8",
        "b6d752b54602758699ebc6416b89a4b1d5f7ec5dfec5f7f83c1a26f97d746015"
    ],
    "vu-port-vila-harbour": [
        "4308c6bc408cbab2f3081f2f8aa30cc0155e68461dd339b2fbe4d7b297e5b207",
        "116d0dcd1f29f0d01d9bb81b082ba0ab6300736af1f7de298d182d1dfa298d5c",
        "5e7ad7110a59a855d56631cb3f30b36b59b6720bc043c0174cb7a14d3bf09d08"
    ],
    "vu-gaua-lake-letas": [
        "c4c83eebc9fafc9c408494022b4f1a7bf8ffea415254ba12d1db780da4865b50",
        "a604e03e5e629f1b83303066c51a892ffba1699172dea383f045c9562cbd4c74",
        "593158c3489af3c8ba8099ba60f9bc729d4d593dc1e385223b193611c98d24fd"
    ]
}


def native_tiles(bounds, product, directory, digests, urls):
    """Keep each source on its native grid, in one continuous longitude domain."""
    west, south, east, north = bounds
    span = {'2020': 3, '2021': 3, 'dem': 1, 'canopy': 10, 'mask': 10}[product]
    first_y = span * floor(south / span)
    if north > first_y + span:
        raise ValueError('Survey spans more than one tile row')
    parts = []
    for column in range(span * floor(west / span), span * ceil(east / span), span):
        longitude = (column + 180) % 360 - 180
        shift = column - longitude
        lon = ('E' if longitude >= 0 else 'W') + f'{abs(longitude):03}'
        if product in ('2020', '2021'):
            version = {'2020': 'v100', '2021': 'v200'}[product]
            name = f'ESA_WorldCover_10m_{product}_{version}_S{abs(first_y):02}{lon}_Map.tif'
            url = f'{WC}/{version}/{product}/map/{name}'
            step = 1 / 12000
        elif product == 'dem':
            stem = f'Copernicus_DSM_COG_10_S{abs(first_y):02}_00_{lon}_00_DEM'
            url = f'{DEM}/{stem}/{stem}.tif'
            step = 1 / 3600
        else:
            layer = 'datamask' if product == 'mask' else 'treecover2000'
            tile = f'{abs(first_y+span):02}S_{abs(longitude):03}{lon[0]}'
            url = f'{HANSEN}/Hansen_GFC-2024-v1.12_{layer}_{tile}.tif'
            step = 1 / 4000
        ds = gdal.Open(str(directory / url.rsplit('/', 1)[-1]) if directory else '/vsicurl/' + url)
        x, dx, skew_x, y, skew_y, dy = ds.GetGeoTransform()
        offset = step / 2 if product == 'dem' else 0
        if ds.GetSpatialRef().GetAuthorityCode(None) != '4326' or skew_x or skew_y or not np.allclose(
            (x, dx, y, dy), (longitude-offset, step, first_y+span+offset, -step), rtol=0, atol=1e-10
        ):
            raise ValueError(f'Unexpected native grid: {url}')
        x += shift
        x0, x1 = max(0, floor((west-x)/dx)), min(ds.RasterXSize, ceil((east-x)/dx))
        y0, y1 = floor((north-y)/dy), ceil((south-y)/dy)
        data = ds.GetRasterBand(1).ReadAsArray(x0, y0, x1-x0, y1-y0)
        digests.append(sha256(data.tobytes()).hexdigest())
        urls.append(url)
        parts.append((data, (x+x0*dx, dx, 0, y+y0*dy, 0, dy)))
    return parts


def surface(tiles, predicate):
    # Snapping submillimetre floating arithmetic joins the two native tile
    # edges before classification. Neither the land nor the sea ends at ±180.
    return union_all([set_precision(geo.raster_mask(predicate(a), grid), 1e-9)
                      for a, grid in tiles], grid_size=1e-9)


def select(parts, x, y):
    matches = [part for part in parts if part.contains(Point(x, y))]
    if len(matches) != 1:
        raise ValueError(f'No unique positive component at ({x}, {y})')
    return matches[0]


def build(w, directory):
    extent = geo.padded(w['bbox'])
    frame = box(*extent)
    digests, urls = [], []
    def tiles(product):
        return native_tiles(extent, product, directory, digests, urls)
    a, b, mask = tiles('2020'), tiles('2021'), tiles('mask')
    if len(a) != len(b) or any(pa.shape != pb.shape or ga != gb for (pa, ga), (pb, gb) in zip(a, b)):
        raise ValueError('WorldCover grids differ')
    classes = [10, 20, 30, 40, 50, 60]
    dry = surface([(np.isin(pa, classes) & np.isin(pb, classes), g)
                   for (pa, g), (pb, _) in zip(a, b)], lambda x: x)
    wet = surface([((pa == 80) & (pb == 80), g) for (pa, g), (pb, _) in zip(a, b)], lambda x: x)
    version = 'ESA WorldCover 2020 v100 and 2021 v200; Hansen GFC 2024 v1.12'
    credit = geo.WC_CREDIT + H_CREDIT
    if w['id'] == 'fj-taveuni-somosomo':
        # At the Taveuni meridian both WorldCover editions label even the
        # elevated forest as herbaceous wetland. Only recover wooded upland
        # independently confirmed by Landsat and elevation. Low coastal
        # wetlands, mangroves, nodata and water stay out of this exception.
        possible = surface([(np.isin(pa, classes+[90]) & np.isin(pb, classes+[90]), g)
                            for (pa, g), (pb, _) in zip(a, b)], lambda x: x)
        forest = surface(tiles('canopy'), lambda p: (p >= 75) & (p <= 100))
        upland = surface(tiles('dem'), lambda p: np.isfinite(p) & (p >= 60) & (p < 1500))
        dry = dry.union(possible.intersection(forest).intersection(upland))
        version += '; Copernicus DEM GLO-30'
        credit += DEM_CREDIT
    if digests != DIGESTS[w['id']]:
        raise ValueError(f'Source windows differ for {w["id"]}')
    land = geo.polygons(set_precision(dry.intersection(surface(mask, lambda p: p == 1)).intersection(frame), 1e-7))
    water = geo.polygons(set_precision(wet.intersection(surface(mask, lambda p: p == 2)).intersection(frame), 1e-7))
    # Official nautical charts/local reports identify each component and its
    # jurisdiction. Unanchored mixed cells and isolated reef patches stay open.
    named = [(name, select(land, x, y)) for name, x, y in w['islands']]
    if len({p.wkb for _, p in named}) != len(named):
        raise ValueError('Two island labels select the same component')
    water = select(water, *w['water'])
    if any(p.intersection(water).area for _, p in named):
        raise ValueError('Conflicting physical polygons')
    return dict(id=w['id'], name=w['name'], bbox=w['bbox'], source='oceania-melanesia+'+w['id'],
                version=version, attribution=credit,
                evidenceUrls=[geo.WC_URL, HANSEN+'/download.html', 'https://creativecommons.org/licenses/by/4.0/',
                              *w['evidence'], *urls],
                **({'oceanRegion': w['sea']} if 'sea' in w else {}),
                land=[r for name, p in named for r in geo.pack(p, kind='island', name=name)],
                water=geo.pack(water, kind='ocean' if 'sea' in w else 'inland'),
                owners=[r for _, p in named for r in geo.pack(p, code=w['code'])])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--raster-directory', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT/'src/data/oceaniaMelanesiaPolygonDetail.json')
    args = parser.parse_args()
    gdal.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    gdal.SetConfigOption('GDAL_HTTP_MAX_RETRY', '4')
    gdal.SetConfigOption('GDAL_HTTP_RETRY_DELAY', '1')
    windows = [build(w, args.raster_directory) for w in WINDOWS]
    args.output.write_text(json.dumps({'windows': windows}, ensure_ascii=False, separators=(',', ':'))+'\n')


if __name__ == '__main__':
    main()
