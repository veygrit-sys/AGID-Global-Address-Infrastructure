#!/usr/bin/env python3
"""Rebuild the inland survey windows on Nauru, Upolu and Uvea.

Use the July 2025 FieldMaps GeoPackage and Python 3.11+, GDAL, NumPy and
Shapely 2. Raster inputs use HTTP range reads unless --raster-directory is set.
"""
import argparse
from importlib import import_module
import json
from math import ceil, floor
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
from shapely import from_wkb, make_valid, union_all
from shapely.geometry import Point, Polygon, box

andes = import_module('build-south-america-andes')
common = andes.base
OUTPUT = Path(__file__).resolve().parents[1] / 'src/data/oceaniaIslandLakesPolygonDetail.json'
SITES = {
    'buada': ('Buada Lagoon', 'Nauru', 'NR', 'NR', [166.919, -.539, 166.926, -.531],
              (166.922625, -.53525), 'https://www.fao.org/4/AC282E/AC282E02.htm'),
    'lanotoo': ('Lake Lanotoʻo', 'Upolu', 'WS', 'WS', [-171.832, -13.914, -171.823, -13.906],
                (-171.827375, -13.91025), 'https://rsis.ramsar.org/ris/1412'),
    'lalolalo': ('Lac Lalolalo', 'Uvea', 'WF', 'FR', [-176.238, -13.305, -176.23, -13.296],
                 (-176.233, -13.30025), 'https://brb.sprep.org/sites/default/files/2025-11/wallis-futuna-wetlands-directory.pdf'),
}
# SHA-256 of the native pixel window in each published tile, in URL order.
DIGESTS = {'buada': ('773259bdcd456555a94f0a9d79295f81469c911aff5fb5c1faaf4ad05fd127d6',
           '646850d17612ddf25beb0987be2b473c2070d9e98fd416f09462d22a9d34e49d',
           '138351703a6ae1aac1256a8dadc91ba9ae56e7531c1c70e8449b00c63ab5c546'),
 'lanotoo': ('e4da462a586afe9224e5149ef9ce19ce612f60d97ea195b2927b537c904118dc',
             '7c4d4b3b014f1d5f4c50b5b5a6590c5ba1038ceb2c6a245a71928ebf5b334e7c',
             '46c5edc1966dd5c8471a498fc8bef0f55ecfba9b1988a0ef6e35ebe779e49849'),
 'lalolalo': ('ea92c6aff5d8754bd66ec4fc338708de8a18c3c42de1504958dfa0c8440a69da',
              '9f8f10fb63b47eac7ab938a3e63679feec6f0feb461f01c9e7ef730fab82ebef',
              '94b95341a0f65986834bd45a905cc37d64de774273c4f1da8566fb9b073bdaf7')}


def source_urls(bounds):
    w, _, _, n = bounds
    x, y = 3 * floor(w / 3), 3 * floor(bounds[1] / 3)
    tile = f'{"N" if y >= 0 else "S"}{abs(y):02}{"E" if x >= 0 else "W"}{abs(x):03}'
    urls = [f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{v}/{year}/map/'
            f'ESA_WorldCover_10m_{year}_{v}_{tile}_Map.tif' for year, v in [(2020, 'v100'), (2021, 'v200')]]
    x, y = 10 * floor(w / 10), 10 * ceil(n / 10)
    jrc = f'occurrence_{abs(x)}{"W" if x < 0 else "E"}_{abs(y)}{"S" if y < 0 else "N"}v1_4_2021.tif'
    return [*urls, 'https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/' + jrc]


def build(key, dataset, raster_directory):
    lake, island, code, sovereign, bounds, anchor, reference = SITES[key]
    extent = common.padded(bounds)
    frame = box(*extent)
    layer = dataset.GetLayerByName('adm0_polygons')
    layer.SetSpatialFilterRect(*extent)
    # Require the whole inland survey to fit the exterior of one identified
    # island. Native holes in its administrative polygon remain holes in land.
    parents = []
    for f in layer:
        geometry = make_valid(from_wkb(bytes(f.geometry().ExportToWkb())))
        parents.extend((f['iso_2'], p) for p in common.polygons(geometry) if Polygon(p.exterior).covers(frame))
    if len(parents) != 1 or parents[0][0] != code:
        raise ValueError(f'{key}: unexpected island or administrative unit')
    urls = source_urls(extent)
    (early, grid), (late, other_grid), (frequency, jrc_grid) = [
        andes.read_raster(url, extent, digest, raster_directory)
        for url, digest in zip(urls, DIGESTS[key], strict=True)]
    if grid != other_grid or early.shape != late.shape:
        raise ValueError(f'{key}: annual grids differ')
    # Identify the named waterbody by a point in its corroborated interior.
    # Annual dry votes establish ground independently. Positive historical water vetoes it.
    annual_water = common.raster_mask((early == 80) & (late == 80), grid)
    persistent = common.raster_mask((frequency >= 80) & (frequency <= 100), jrc_grid)
    basin, = [p for p in common.polygons(annual_water.intersection(persistent))
              if p.contains(Point(anchor))]
    if basin.intersects(frame.boundary):
        raise ValueError(f'{key}: the lake is clipped by the review window')
    dry_classes = [10, 20, 30, 40, 50, 60]
    dry = common.raster_mask(np.isin(early, dry_classes) & np.isin(late, dry_classes), grid)
    reported_water = common.raster_mask((frequency > 0) & (frequency <= 100), jrc_grid)
    dry = dry.intersection(parents[0][1]).intersection(frame).difference(reported_water)
    # Interior fragments isolated by water or by an evidence gap cannot acquire
    # the name of the enclosing island solely from their administrative code.
    upland = union_all([p for p in common.polygons(dry) if p.intersects(frame.boundary)])
    if upland.is_empty or upland.intersection(basin).area > 0:
        raise ValueError(f'{key}: missing or overlapping physical surfaces')
    land = common.pack(upland, kind='island', name=island)
    return dict(id='oceania-lake-' + key, name=f'{lake}, {island}', bbox=bounds,
                source='oceania-island-lakes+' + key,
                version='FieldMaps USGS/LSIB 2025-07-29; WorldCover 2020 v100 / 2021 v200; JRC GSW v1.4 1984–2021',
                attribution=common.FM_CREDIT + ' ' + andes.RASTER_CREDIT,
                evidenceUrls=[reference, common.FM_URL, common.WC_URL, andes.JRC, *urls], land=land,
                water=common.pack(basin, kind='inland'),
                owners=[dict(code=code, sovereignCode=sovereign, bbox=p['bbox'], rings=p['rings']) for p in land])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('fieldmaps_gpkg', type=Path)
    parser.add_argument('--raster-directory', type=Path)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    common.check(args.fieldmaps_gpkg, common.FM_SHA)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    gdal.SetConfigOption('GDAL_HTTP_MAX_RETRY', '3')
    gdal.SetConfigOption('GDAL_HTTP_RETRY_DELAY', '3')
    dataset = ogr.Open(str(args.fieldmaps_gpkg))
    windows = [build(key, dataset, args.raster_directory) for key in SITES]
    args.output.write_text(json.dumps({'windows': windows}, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
