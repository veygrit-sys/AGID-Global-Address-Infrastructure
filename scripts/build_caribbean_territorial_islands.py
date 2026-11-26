#!/usr/bin/env python3
"""Build the Puerto Rico and Virgin Islands shoreline extracts with GDAL, NumPy and Shapely 2.

Pass the FieldMaps 2025-07-29 USGS/LSIB adm0_polygons.gpkg with --fieldmaps-gpkg.
WorldCover reads only the pinned subsets of two release COGs via HTTPS range requests.
"""
import argparse
from importlib import import_module
import json
from math import floor
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
from shapely import from_wkb, make_valid
from shapely.geometry import Point, box
from shapely.ops import unary_union

geo = import_module('build-northern-central-america-review')
read_raster = import_module('build-south-america-andes').read_raster
ROOT = Path(__file__).resolve().parents[1]
PILOT = 'https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp5/CPB5_C14_WEB.pdf'
IHO = 'https://iho.int/uploads/user/pubs/standards/s-23/S-23_Ed3_1953_EN.pdf'
COUNTRIES = {'PR': ('USA', 'US'), 'VI': ('USA', 'US'), 'VG': ('GBR', 'GB')}
# Each island's control joins its name to a full cartographic polygon. The
# controls select no land, jurisdiction or shoreline in their own right.
SITES = [
    ('culebrita', 'Culebra and Culebrita', [-65.251,18.308,-65.22,18.327],
     [('Culebra','PR',-65.295,18.31), ('Culebrita','PR',-65.230105,18.317148)],
     (-65.242,18.317),
     'https://www.fws.gov/sites/default/files/documents/2024-11/culebra-national-wildlife-refuge-comprehensive-conservation-plan.pdf'),
    ('muertos', 'Caja de Muertos and Morrillito', [-66.536,17.879,-66.511,17.899],
     [('Caja de Muertos','PR',-66.520839,17.892934), ('Morrillito','PR',-66.532689,17.882313)],
     (-66.53093,17.88335),
     'https://repository.library.noaa.gov/view/noaa/47326/noaa_47326_DS1.pdf'),
    ('buck', 'Buck Island Reef, St. Croix', [-64.631,17.78,-64.607,17.793],
     [('Buck Island','VI',-64.619836,17.786859)], (-64.615,17.791),
     'https://www.nps.gov/buis/index.htm'),
    ('narrows', 'The Narrows between St. John and Great Thatch', [-64.761,18.364,-64.71,18.392],
     [('St. John','VI',-64.735,18.345), ('Whistling Cay','VI',-64.756718,18.370092),
      ('Great Thatch','VG',-64.740391,18.386288), ('Little Thatch','VG',-64.715080,18.381671),
      ('Tortola','VG',-64.63,18.43)], (-64.741,18.378), PILOT),
    ('fallen-jerusalem', 'Fallen Jerusalem and Virgin Gorda', [-64.456,18.411,-64.438,18.431],
     [('Fallen Jerusalem','VG',-64.451254,18.417567), ('Virgin Gorda','VG',-64.440946,18.430178)],
     (-64.447,18.4238), 'https://www.bvinpt.org/fallen-jerusalem-national-park-info'),
]
DIGESTS = {
    'culebrita': ('63db7ed183f5d0d8606289a7cefb745acc4d5aada4d81ea2f09a5fc717521c1e',
                 '2d5913c68c39484f0e76b494d56d1c5fe71866f1a411a71f4e43e2a12b0b25a2'),
    'muertos': ('182bb2afc4617c6e5550768ed42320a439216a84e6eaad8fa4a75bf7f114cea5',
                 '14cbfc438b48edfee5693df84d93ac1f1647c21e5061ffbf594256425fc2b218'),
    'buck': ('7844373c8ab561f12750ab83bd043b49fb1db414cc447585bad9e6c8e6450a85',
                 '2a0479675f4818a8587fa4a4a4a83b9857b6afc225054d13f4d50af99c0edc82'),
    'narrows': ('03be2132385b1e23497c9ce420f5c0353482ba479ddae368e7a9624ca7a72459',
                 '914dbb1ab45521bfd86cc9781aeff2e7bf9a7a5e0baafe69178383c42334f998'),
    'fallen-jerusalem': ('58035b039de6a102555d2f2105f160858d1d505b0a3abfa6ce479a9dec0e9bfe',
                 'e65e89c881a46264b299647ce46b2292abb07193e2782f5da227ab161940d90f'),
}


def mask_surfaces(key, extent, directory):
    w, s, e, n = extent
    x, y = 3 * floor(w / 3), 3 * floor(s / 3)
    if e >= x + 3 or n >= y + 3:
        raise ValueError(f'{key} crosses a WorldCover tile boundary')
    tile = f'N{y:02}W{abs(x):03}'
    urls, arrays, grid = [], [], None
    for (year, edition), digest in zip([(2020, 'v100'), (2021, 'v200')], DIGESTS[key], strict=True):
        url = (f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{edition}/{year}/map/'
               f'ESA_WorldCover_10m_{year}_{edition}_{tile}_Map.tif')
        pixels, transform = read_raster(url, extent, digest, directory)
        if grid and transform != grid:
            raise ValueError('Annual survey grids differ')
        arrays.append(pixels)
        urls.append(url)
        grid = transform
    a, b = arrays
    dry_classes = [10, 20, 30, 40, 50, 60]
    dry = geo.raster_mask(np.isin(a, dry_classes) & np.isin(b, dry_classes), grid)
    wet = geo.raster_mask((a == 80) & (b == 80), grid)
    return dry, wet, urls


def outlines(layer, frame, names):
    layer.SetSpatialFilterRect(*frame.bounds)
    seen = set()
    for feature in layer:
        code = feature['iso_2']
        if code not in COUNTRIES or feature['iso_3_grp'] != COUNTRIES[code][0]:
            raise ValueError(f'Unexpected territory/sovereign record: {code}')
        for part in geo.polygons(make_valid(from_wkb(bytes(feature.geometry().ExportToWkb())))):
            if not part.intersects(frame):
                continue
            matches = [name for name, region, x, y in names if code == region and part.contains(Point(x, y))]
            if len(matches) > 1 or seen.intersection(matches):
                raise ValueError(f'Island name does not uniquely identify a polygon: {matches}')
            seen.update(matches)
            yield code, matches[0] if matches else None, part.intersection(frame)
    if seen != {entry[0] for entry in names}:
        raise ValueError(f'Unmatched island controls: {seen} for {names}')


def core(geom):
    # One native-pixel margin withholds mixed coasts and tidally exposed pixels.
    interior = geom.buffer(-1/12000, join_style='mitre')
    return interior.simplify(0.45/12000).intersection(interior)


def make_window(site, layer, directory):
    key, title, bounds, names, sea_pin, reference = site
    extent = geo.padded(bounds)
    dry, wet, rasters = mask_surfaces(key, extent, directory)
    land, owners, mapped = [], [], []
    for code, name, shore in outlines(layer, box(*extent), names):
        mapped.append(shore)
        positive = core(dry.intersection(shore))
        land.extend(geo.pack(positive, kind='island', **({'name': name} if name else {})))
        owners.extend(geo.pack(positive, code=code, sovereignCode=COUNTRIES[code][1]))
    if not land:
        raise ValueError(f'No confirmed dry land in {key}')
    # Keep only water connected to the reviewed sea. Salt pans and enclosed
    # pools on the islands cannot become an ocean or a territory via this path.
    marine, = [p for p in geo.polygons(wet.difference(unary_union(mapped))) if p.contains(Point(sea_pin))]
    return dict(id='caribbean-territories-'+key, name=title, bbox=bounds, oceanRegion='CARB',
                source='caribbean-territorial-islands+'+key,
                version='FieldMaps USGS/LSIB 2025-07-29; ESA WorldCover 2020 v100 and 2021 v200',
                attribution=geo.FM_CREDIT+' Public domain. '+geo.WC_CREDIT,
                evidenceUrls=[reference, IHO, geo.FM_URL, *rasters],
                land=land, owners=owners, water=geo.pack(core(marine), kind='ocean'))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--fieldmaps-gpkg', type=Path, required=True)
    p.add_argument('--raster-directory', type=Path)
    p.add_argument('--output', type=Path, default=ROOT / 'src/data/caribbeanTerritorialIslandsReviewed.json')
    args = p.parse_args()
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    geo.check(args.fieldmaps_gpkg, geo.FM_SHA)
    dataset = ogr.Open(str(args.fieldmaps_gpkg))
    layer = dataset.GetLayerByName('adm0_polygons')
    data = {'windows': [make_window(site, layer, args.raster_directory) for site in SITES]}
    args.output.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
