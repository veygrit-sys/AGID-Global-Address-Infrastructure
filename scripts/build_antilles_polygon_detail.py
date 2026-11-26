#!/usr/bin/env python3
"""Rebuild the saline lagoons on Terre de Bas, Guadeloupe.

Python 3.11+, GDAL, NumPy, Shapely 2. Supply --download to populate an empty
cache with IGN GeoJSON and two small ESA WorldCover pixel windows.
"""
import argparse
from importlib import import_module
import json
from pathlib import Path

import numpy as np
from osgeo import gdal
from shapely import force_2d, union_all
from shapely.geometry import Point, box, shape

antilles = import_module('build_lesser_antilles_islands')
raster = import_module('build_canada_pacific_reviewed')
common = antilles.common
SITE = 'petite-terre'
BOUNDS = [-61.1208, 16.1698, -61.1132, 16.1735]
PLAN = ('https://reservesdesiradepetiteterre.com/wp-content/uploads/2020/10/'
        'Plan_de_gestion_RNNPT_2020-2029-Partie-A-Diagnostic-de-la-RNN-vfinale-Annexes.pdf')
HYDRO_DIGEST = '3a375f7c4e52f1561c9ab17259d6523a5f98972ef6c0bc3629ed66672caaea0a'
OUTPUT = antilles.ROOT / 'src/data/caribbeanAntillesPolygonDetail.json'


def build(cache, download):
    # Reuse the broader pinned island and raster extracts that also support the
    # regional shoreline. Select the connected sea there, before clipping.
    _, original_bounds, sea_control, site_reference = antilles.SITES[SITE]
    extent = common.padded(original_bounds)
    scope = box(*common.padded(BOUNDS))
    files = ('petite-terre-official.json', 'petite-terre-toponyms.json',
             'petite-terre-water.json', 'petite-terre-2020.npy', 'petite-terre-2021.npy')
    if not download:
        for name in files:
            if not (cache / name).is_file():
                raise FileNotFoundError(f'{name} missing in cache; use --download')
    islands, coast, urls = antilles.french_islands(SITE, extent, cache)
    (name, code, sovereign, island), = [entry for entry in islands if entry[0] == 'Terre de Bas']
    rows, hydro_url = antilles.ign_extract('BDTOPO_V3:surface_hydrographique',
                                          cache / 'petite-terre-water.json', extent)
    hydro = sorted((f['properties']['cleabs'], f['properties']['nature'],
                    f['properties']['persistance'], f['geometry']) for f in rows)
    antilles.check_json(hydro, HYDRO_DIGEST)
    polygons = [(persistence, force_2d(shape(geom))) for _, _, persistence, geom in hydro]
    all_water = union_all([geom for _, geom in polygons])
    permanent = [geom for persistence, geom in polygons if persistence == 'Permanent']

    arrays = []
    frame = box(*extent)
    for (year, edition), digest in zip([(2020, 'v100'), (2021, 'v200')], antilles.PIXELS[SITE], strict=True):
        arr, grid, tile = raster.pixels(SITE, frame, year, edition, digest, cache)
        arrays.append(arr)
        urls.append(tile)
    earlier, later = arrays
    dry_classes = [10, 20, 30, 40, 50, 60]
    dry = raster.mask_geometry(np.isin(earlier, dry_classes) & np.isin(later, dry_classes), grid)
    wet = raster.mask_geometry((earlier == 80) & (later == 80), grid)
    # Water must be in a persistent mapped basin on this island. All mapped
    # hydrographic polygons, including seasonal ones, are excluded from land.
    basins = [antilles.interior(p.intersection(island).intersection(wet)).intersection(scope) for p in permanent]
    if len(basins) != 2 or any(p.is_empty for p in basins):
        raise ValueError('Expected confirmed permanent water in two surveyed basins')
    land = antilles.interior(island.intersection(dry).difference(all_water)).intersection(scope)
    sea, = [p for p in common.polygons(wet.difference(coast)) if p.contains(Point(sea_control))]
    water = common.pack(union_all(basins), kind='inland')
    water.extend(common.pack(antilles.interior(sea).intersection(scope), kind='ocean'))
    return dict(id='antilles-polygon-detail-petite-terre', name='Salines de Terre de Bas, Guadeloupe',
                bbox=BOUNDS, source='antilles-polygon-detail+petite-terre', oceanRegion='CARB',
                version='IGN ADMIN EXPRESS COG 2025 / BD TOPO V3; ESA WorldCover 2020 v100 and 2021 v200',
                attribution='© IGN France, modified ADMIN EXPRESS COG and BD TOPO®, Licence Ouverte 2.0. '
                            + common.WC_CREDIT,
                evidenceUrls=[PLAN, site_reference, hydro_url, *urls],
                land=common.pack(land, kind='island', name=name),
                owners=common.pack(land, code=code, sovereignCode=sovereign), water=water)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    args.source_directory.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    window = build(args.source_directory, args.download)
    args.output.write_text(json.dumps({'windows': [window]}, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
