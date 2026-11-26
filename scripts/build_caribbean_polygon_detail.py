#!/usr/bin/env python3
"""Rebuild four Puerto Rican and U.S. Virgin Islands coastal pond extracts.

Run with Python 3.11+, GDAL, NumPy and Shapely 2. The optional cache retains
three checksum-pinned county archives and eight small WorldCover pixel windows.
All archives and the native pixel bytes of both editions are SHA-256 pinned.
"""
import argparse
from importlib import import_module
import json
from pathlib import Path
from tempfile import NamedTemporaryFile

import numpy as np
from osgeo import gdal, ogr
from shapely import make_valid, union_all
from shapely.geometry import Point, Polygon, box

regional = import_module('build-northern-central-america-review')
census = import_module('build-us-canada-shorelines')
atlantic = import_module('build_us_atlantic_islands')
raster = import_module('build_canada_pacific_reviewed')
territories = import_module('build_caribbean_territorial_islands')
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'src/data/caribbeanPolygonDetail.json'
ARCHIVES = {
    '72049': '5ad506fe730b0b7bd850f74e6c510065a472c9dd77b941e968e190061f0ac2b7',
    '78010': 'cf35520600546e3567eddd08a540ac0cd07688180044bb1613a9b864804a9469',
    '78020': 'bdfba6fdf735187fe4571f563aeeffa4ac40347b6cadb9a68c29a496015c7490',
}
FWS = 'https://www.fws.gov/sites/default/files/documents/2024-11/culebra-national-wildlife-refuge-comprehensive-conservation-plan.pdf'
SITES = [
    # A point associates a name with a closed TIGER island shell. The HYDROID
    # identifies a surveyed waterbody. Neither supplies a geometry or radius.
    ('culebrita-molino', 'Laguna de Molino', 'Culebrita', 'PR', '72049', '11099359419',
     (-65.230183, 18.317174), [-65.240, 18.316, -65.230, 18.325], FWS),
    ('culebra-flamenco', 'Laguna del Flamenco', 'Culebra', 'PR', '72049', '11099359436',
     (-65.288649, 18.319724), [-65.322, 18.319, -65.309, 18.332], FWS),
    ('saint-john-salt-pond', 'Salt Pond', 'St. John', 'VI', '78020', '110268814658',
     (-64.754998, 18.335603), [-64.709, 18.303, -64.699, 18.312],
     'https://www.nps.gov/places/salt-pond-bay.htm'),
    ('saint-croix-great-pond', 'Great Pond', 'St. Croix', 'VI', '78010', '110242221051',
     (-64.759154, 17.728868), [-64.664, 17.717, -64.649, 17.731],
     'https://www.coris.noaa.gov/activities/habitat_assessment/usvi.pdf'),
]
PIXELS = {
    'culebrita-molino': (
        '31c97c9504d83b71a5dece45d1fdeb61504f1d8dc9478e6baf9237c69856e317',
        'c4dcac441b1fa832f8e789335e03e297439997f87eb4245479cc8c49687b3906'),
    'culebra-flamenco': (
        'c9efb058e6c38475553181773f1d649bbe40d6352fac866b802f23211f8f4506',
        '24044dafd0e833f02963c777c502d6b34c68921bac781fb0374e418d7e9bd2c7'),
    'saint-john-salt-pond': (
        '7ccf23555716c804b46b0104d830c28b0f76a6854514d19e2e8002bae90d8129',
        '6d63c61ea0cf15807d639d10bca11ee278c83f0295254572e4512952e853bdd6'),
    'saint-croix-great-pond': (
        '3e27fc683f6082a63b1e4d2dd2955722ed48ff8c4663bf9b9c5a157d3a07381e',
        '52d5ad24611b4536b8a58c479214968ec91bf3af3e1848922df02dd36c8198a6'),
}
OCEAN = {'H2051', 'H2053'}


def load_county(cache, fips, download):
    path, url = atlantic.archive(cache, fips, 'areawater', ARCHIVES[fips], download)
    dataset = ogr.Open('/vsizip/' + str(path.resolve()))
    layer = dataset.GetLayer()
    transform = census.wgs_transform(layer)
    rows = [(str(f['HYDROID']), f['MTFCC'], make_valid(census.to_wgs(f.geometry(), transform)))
            for f in layer]
    # Use the entire county. Clipping the water first opens genuine island
    # rings and permits a rectangular map edge to masquerade as a coastline.
    sea = union_all([g for _, kind, g in rows if kind in OCEAN])
    shells = [Polygon(ring) for part in regional.polygons(sea) for ring in part.interiors]
    return rows, sea, shells, url


def build_window(site, county, cache, download):
    key, pond, island, code, _, hydroid, anchor, bounds, evidence = site
    extent = regional.padded(bounds)
    frame = box(*extent)
    raster_key = 'pond-' + key
    rows, sea, shells, url = county
    shell, = [p for p in shells if p.contains(Point(anchor))]
    lake, = [g for identifier, kind, g in rows if identifier == hydroid and kind == 'H2030']
    if not frame.covers(lake) or not lake.intersects(shell):
        raise ValueError(f'{key}: surveyed pond outside its island or window')
    # Exclude every mapped stream, pond, channel and wet polygon from dry
    # island. Only the named pond and positively surveyed marine polygons can
    # supply water records. The class "inland" here describes a coastal pond,
    # not the salinity of its water.
    hydro = union_all([g.intersection(frame) for _, _, g in rows if g.intersects(frame)])
    images, urls = [], [evidence, url]
    grid = None
    for (year, edition), digest in zip([(2020, 'v100'), (2021, 'v200')], PIXELS[key], strict=True):
        if not download and not (cache / f'{raster_key}-{year}.npy').exists():
            raise FileNotFoundError(f'{raster_key}-{year}.npy missing; use --download')
        arr, transform, tile_url = raster.pixels(raster_key, frame, year, edition, digest, cache)
        if grid is not None and transform != grid:
            raise ValueError(f'{key}: annual survey grids differ')
        grid = transform
        images.append(arr)
        urls.append(tile_url)
    first, last = images
    dry_classes = (10, 20, 30, 40, 50, 60)
    dry = raster.mask_geometry(np.isin(first, dry_classes) & np.isin(last, dry_classes), grid)
    wet = raster.mask_geometry((first == 80) & (last == 80), grid)
    land = territories.core(shell.intersection(frame).difference(hydro).intersection(dry))
    inland = territories.core(lake.intersection(wet).difference(sea))
    marine = territories.core(sea.intersection(frame).intersection(wet).difference(lake))
    pairs = [(land, inland), (land, marine), (marine, inland)]
    if land.is_empty or inland.is_empty or marine.is_empty or any(a.intersection(b).area for a, b in pairs):
        raise ValueError(f'{key}: invalid island or overlapping physical classes')
    waters = regional.pack(inland, kind='inland') + regional.pack(marine, kind='ocean')
    return dict(id='caribbean-polygon-detail-' + key, name=f'{pond}, {island}', bbox=bounds,
                source='caribbean-polygon-detail+' + key, oceanRegion='CARB',
                version='TIGER/Line 2025 Area Hydrography; ESA WorldCover 2020 v100 and 2021 v200',
                attribution='U.S. Census Bureau, 2025 TIGER/Line. ' + regional.WC_CREDIT,
                evidenceUrls=urls, land=regional.pack(land, kind='island', name=island),
                owners=regional.pack(land, code=code, sovereignCode='US'), water=waters)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    args.source_directory.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    gdal.SetConfigOption('GDAL_HTTP_MAX_RETRY', '3')
    counties = {k: load_county(args.source_directory, k, args.download) for k in ARCHIVES}
    windows = [build_window(site, counties[site[4]], args.source_directory, args.download) for site in SITES]
    result = {'windows': windows}
    with NamedTemporaryFile('w', dir=args.output.parent, delete=False, encoding='utf-8') as out:
        json.dump(result, out, ensure_ascii=False, separators=(',', ':'))
        out.write('\n')
        partial = Path(out.name)
    partial.replace(args.output)


if __name__ == '__main__':
    main()
