#!/usr/bin/env python3
"""Build the Atlantic Canadian and Saint-Pierre small-island survey.

Requires Python 3.11+, GDAL, NumPy and Shapely 2. Official WGS84 vectors are
fetched and cached in --source-directory. --worldcover-directory optionally
supplies local copies of the same checksum-pinned WorldCover and DEM images.
Pass the 2021 provincial cartographic boundary ZIP to --statcan-archive.
"""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import floor
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
from osgeo import gdal, ogr
from shapely.geometry import Point, box, shape
from shapely.ops import unary_union

base = import_module('build-northern-central-america-review')
canada = import_module('build-us-canada-shorelines')
read_raster = import_module('build-south-america-andes').read_raster
ROOT = Path(__file__).resolve().parents[1]
NRCAN = 'https://geogratis.gc.ca/services/geoname/en/features/'
IGN = 'https://data.geopf.fr/wfs/ows?' + urlencode(dict(
    SERVICE='WFS', VERSION='2.0.0', REQUEST='GetFeature', TYPENAMES='ADMINEXPRESS-COG.LATEST:commune',
    OUTPUTFORMAT='application/json', srsName='urn:ogc:def:crs:OGC:1.3:CRS84',
    bbox='-56.165,46.774,-56.125,46.805,urn:ogc:def:crs:OGC:1.3:CRS84', count=5))
VECTORS = {
    'Ciboux Island': '7b5fb3cfaf5511d892e2080020a0f4c9',
    'Hertford Island': 'c3966958af6d11d892e2080020a0f4c9',
    'Île aux Perroquets': '05b96865be4411d892e2080020a0f4c9',
    'Île de la Maison': '280e9526bf0711d892e2080020a0f4c9',
    "Allan's Island": '0cacd9bc849c20c382d30dd8efc35db1',
}
# Coordinates are longitude, latitude. A point selects the connected ocean
# from the satellite water mask, excluding lakes and ponds within the islands.
SITES = [
    ('bird-islands', 'Bird Islands', [-60.402, 46.361, -60.368, 46.390],
     ['Ciboux Island', 'Hertford Island'], (-60.386, 46.374), 'STLA',
     'https://www.dfo-mpo.gc.ca/oceans/networks-reseaux/scotian-shelf-plateau-neo-ecossais-bay-baie-fundy/bird-islands-iles-eng.html'),
    ('mingan-perroquets', 'Mingan Archipelago', [-64.210, 50.215, -64.197, 50.223],
     ['Île aux Perroquets', 'Île de la Maison'], (-64.2025, 50.2198), 'STLA',
     'https://parks.canada.ca/pn-np/qc/mingan/activ/chaises-rouges-red-chairs'),
    ('allans-island', "Allan's Island, Lamaline", [-55.810, 46.841, -55.792, 46.857],
     ["Allan's Island"], (-55.795, 46.851), 'NATL',
     'https://publications.gc.ca/collections/collection_2025/mpo-dfo/Fs151-6-1-2025-06-eng.pdf'),
    ('ile-aux-marins', 'Île aux Marins / Île aux Vainqueurs', [-56.1568, 46.779, -56.125, 46.794],
     [], (-56.136, 46.789), 'STLA',
     'https://pop.culture.gouv.fr/notice/merimee/PA97500009'),
    ('battle-harbour', 'Battle Harbour', [-55.595, 52.269, -55.579, 52.280],
     [], (-55.587259, 52.274213), 'LABR',
     'https://www.pc.gc.ca/apps/dfhd/page_nhs_eng.aspx?id=1787'),
]
# SHA-256 of canonical GeoJSON geometries, omitting request timestamps, then
# SHA-256 of the unmodified pixel arrays in the two padded raster windows.
VECTOR_SHA = {'7b5fb3cfaf5511d892e2080020a0f4c9': 'f21f447a4f618fe349f4f3d4b0c438633f88dc58c20db752fc2831d3f1e6599a',
 'c3966958af6d11d892e2080020a0f4c9': '4ab4e04e326d865f2f9224cfe88ccf6d7cdf1040c9c876400285109dbcc24acd',
 '05b96865be4411d892e2080020a0f4c9': '6ba4737930cb6843bb8e55d89552a7f43c3c2465bcf5f6a45476ac22309addaf',
 '280e9526bf0711d892e2080020a0f4c9': '6c4778d72efb90aea899b2280c91c2ebd6203a9b9466bb672387a2e3659c74dc',
 '0cacd9bc849c20c382d30dd8efc35db1': '1b35fccbc0b8e66a5e4af4feff1765c85d21ee67cff2dcf4a46c695d53f7ad89',
 'saint-pierre': '377b86585e16325c7d4da6d158e3a2675fb340cd21e27c3803b426dd346f5c7a'}
PIXEL_SHA = {'bird-islands': ['6b02e221a7f4ba293bcd8997f908fd0dffc6bb3411682d0b9136fdc18b857690',
                  '02a8c7acbf346e0e7ece0ac9d2f596acae785d8cb0e05ec2d45241307bcb50f8'],
 'mingan-perroquets': ['5d18c86f808323c037740172b9e96633191a71ec0cc201caa5554a551bd868d9',
                       '07b996f0e53ec06643ae73a73dba3c7de8d7bf0b72e279daf4426f21bbd80d42'],
 'allans-island': ['f551ff864531ea64e181ad75c5e5d2f6830bdecbe5cfb9826591108f92f69028',
                   '6cc622099a2400ffd8a042c4326979a77d0d85d767d3a72d47e843faad9cbc4b'],
 'ile-aux-marins': ['4d77bc07a60ec72d28c20249c513ef6cf1e80cab435e26957f09c317dae75a06',
                    '6add81222cd81dc0af552b448cea75886a87e7478d9e6bc6aa2b1646d88765c8'],
 'battle-harbour': ['25199b96a124562507b6e9e2554dd4739439a07870fcb05c1a6dafdcabc0005a',
                    '0031a8ab3555247165cf1a2287316ecd2d8666265595bedfdab7874f025f1a6c']}


def official_outline(key, url, directory):
    path = directory / (key + '.json')
    raw = path.read_bytes() if path.exists() else urlopen(url, timeout=45).read()
    feature = json.loads(raw)
    if key == 'saint-pierre':
        (feature,) = feature['features']
        if feature['properties']['code_insee'] != '97502':
            raise ValueError('Expected commune of Saint-Pierre')
    elif feature['properties']['id'] != key or feature['properties']['type_en'] != 'ISL-Island':
        raise ValueError(f'Unexpected gazetteer feature for {key}')
    geom = feature['geometry']
    if geom['type'] not in ('Polygon', 'MultiPolygon'):
        raise ValueError(f'Expected a surveyed outline for {key}')
    digest = sha256(json.dumps(geom, separators=(',', ':')).encode()).hexdigest()
    if digest != VECTOR_SHA[key]:
        raise ValueError(f'Unexpected official geometry edition for {key}: {digest}')
    outline = shape(geom)
    if outline.is_empty or not outline.is_valid:
        raise ValueError(f'Invalid official island outline for {key}')
    if not path.exists():
        path.write_bytes(raw)
    return outline


def surface_masks(key, bounds, directory):
    west, south, east, north = bounds
    tx, ty = 3 * floor(west / 3), 3 * floor(south / 3)
    if east >= tx + 3 or north >= ty + 3:
        raise ValueError(f'{key} crosses a raster tile edge')
    tile = f'N{ty:02}W{abs(tx):03}'
    arrays, urls, transform = [], [], None
    for index, (year, edition) in enumerate([(2020, 'v100'), (2021, 'v200')]):
        url = (f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{edition}/{year}/map/'
               f'ESA_WorldCover_10m_{year}_{edition}_{tile}_Map.tif')
        values, grid = read_raster(url, bounds, PIXEL_SHA[key][index], directory)
        if transform and grid != transform:
            raise ValueError(f'Land-cover grids do not align for {key}')
        transform = grid
        arrays.append(values)
        urls.append(url)
    dry = np.isin(arrays[0], [10, 20, 30, 40, 50, 60]) & np.isin(arrays[1], [10, 20, 30, 40, 50, 60])
    wet = (arrays[0] == 80) & (arrays[1] == 80)
    return base.raster_mask(dry, transform), base.raster_mask(wet, transform), urls


def compact_core(geometry):
    # Withhold a pixel around mixed shore, tidal rocks and piers. Simplify the
    # inward geometry, then intersect it with the original to keep it a subset.
    core = geometry.buffer(-1 / 12_000, join_style='mitre').simplify(0.45 / 12_000)
    return core.intersection(geometry)


MINGAN_DEM = 'https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N50_00_W065_00_DEM/Copernicus_DSM_COG_10_N50_00_W065_00_DEM.tif'
MINGAN_SHA = '9eaaff760940f6494ad7ef56c17310dfaf287cbb77384ae5568592234744c5a8'
STATCAN_URL = ('https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/'
               'files-fichiers/lpr_000b21a_e.zip')
BATTLE_PINS = {'Battle Island': (-55.5842099, 52.2762824), 'Great Caribou Island': (-55.6203081, 52.2654053),
               'Gunning Island': (-55.5902304, 52.2789251)}


def battle_outlines(archive, frame):
    # The gazetteer provides only a name point for Battle Island. Recover each
    # physical component from the national land-clipped province cartography.
    # Check name pins on whole polygons before clipping Great Caribou Island.
    base.check(archive, canada.STATCAN_SHA)
    dataset = ogr.Open(f'/vsizip/{archive.resolve()}/lpr_000b21a_e.shp')
    layer = dataset.GetLayer()
    layer.SetAttributeFilter("PRUID = '10'")
    feature = layer.GetNextFeature()
    to_geo = canada.wgs_transform(layer)
    extent = to_geo.GetInverse().TransformBounds(*frame.bounds, 21)
    outlines, seen = [], set()
    for raw in canada.ogr_parts(feature.geometry()):
        west, east, south, north = raw.GetEnvelope()
        if not canada.meets((west, south, east, north), extent):
            continue
        complete = canada.to_wgs(raw, to_geo)
        if not complete.intersects(frame):
            continue
        matches = [name for name, pin in BATTLE_PINS.items() if complete.contains(Point(pin))]
        if len(matches) > 1 or seen.intersection(matches):
            raise ValueError('Distinct gazetteer islands mapped to one cartographic component')
        seen.update(matches)
        outlines.append((matches[0] if matches else None, complete.intersection(frame)))
    if seen != set(BATTLE_PINS):
        raise ValueError('Battle Harbour island name missing on the provincial geometry')
    return outlines


def survey(site, directory, worldcover, statcan):
    key, title, bounds, names, sea_pin, basin, reference = site
    extent = base.padded(bounds)
    frame = box(*extent)
    dry, wet, rasters = surface_masks(key, extent, worldcover)
    outlines, urls = [], [reference]
    if key == 'battle-harbour':
        code, sovereign = 'CA', 'CA'
        cartographic = 'Statistics Canada 2021 provincial cartographic boundary and CGNDB'
        credit = 'Statistics Canada, 2021 Census. Contains information licensed under the Statistics Canada Open Licence and Open Government Licence – Canada.'
        outlines = battle_outlines(statcan, frame)
        urls.append(STATCAN_URL)
        urls.extend('https://geonames.nrcan.gc.ca/search-place-names/unique?id=' + key
                    for key in ['AAAXU', 'ABDVG', 'AAJGQ', 'AAAXT'])
    elif names:
        code, sovereign = 'CA', 'CA'
        cartographic = 'NRCan Canadian Geographical Names Database'
        credit = 'Contains information licensed under the Open Government Licence – Canada.'
        for name in names:
            identifier = VECTORS[name]
            url = NRCAN + identifier + '.geojson'
            outline = official_outline(identifier, url, directory)
            outlines.append((name, outline.intersection(frame)))
            urls.append(url)
    else:
        code, sovereign = 'PM', 'FR'
        cartographic = 'IGN ADMIN EXPRESS COG, commune 97502'
        credit = '© IGN, ADMIN EXPRESS COG; Licence Ouverte / Open Licence Etalab 2.0.'
        urls.extend([IGN, 'https://publications.gc.ca/collections/collection_2025/mpo-dfo/Fs74-45-2025-6-eng.pdf'])
        official = official_outline('saint-pierre', IGN, directory)
        for part in base.polygons(official):
            if not part.intersects(frame):
                continue
            name = next((name for name, pin in [
                ('Île aux Marins', (-56.149444, 46.784444)), ('Île aux Vainqueurs', (-56.128175, 46.79057)),
                ('Saint-Pierre', (-56.183, 46.78))] if part.contains(Point(pin))), None)
            outlines.append((name, part.intersection(frame)))
    if basin == 'STLA':
        urls.append('https://iho.int/uploads/user/pubs/standards/s-23/S-23_Ed3_1953_EN.pdf')
    # These tiny Mingan platforms have dry upland pixels within one native
    # pixel of other cover classes. Use independent observed relief (DSM)
    # only deep inside the gazetteer shoreline, still requiring both dry maps.
    raised_interior = None
    if key == 'mingan-perroquets':
        heights, grid = read_raster(MINGAN_DEM, extent, MINGAN_SHA, worldcover)
        raised_interior = base.raster_mask(np.isfinite(heights) & (heights >= 2), grid)
        urls.append(MINGAN_DEM)
        cartographic += ' / Copernicus DEM GLO-30'
        credit += (' Produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH '
                   '2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.')
    land, owners = [], []
    for name, outline in outlines:
        geometry = compact_core(dry.intersection(outline))
        if raised_interior is not None:
            interior = outline.buffer(-2 / 12_000, join_style='mitre')
            geometry = geometry.union(dry.intersection(interior).intersection(raised_interior))
        label = {'name': name} if name else {}
        land.extend(base.pack(geometry, kind='island', **label))
        owners.extend(base.pack(geometry, code=code, sovereignCode=sovereign))
    wet = wet.difference(unary_union([g for _, g in outlines]))
    (sea,) = [component for component in base.polygons(wet) if component.contains(Point(sea_pin))]
    water = base.pack(compact_core(sea), kind='ocean')
    return dict(id='canada-atlantic-'+key, name=title, bbox=bounds, source='canada-atlantic-review+'+key,
                version=cartographic+' / ESA WorldCover 2020 v100 & 2021 v200',
                attribution=credit+' '+base.WC_CREDIT, evidenceUrls=urls+rasters,
                oceanRegion=basin, land=land, owners=owners, water=water)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source-directory', type=Path, required=True)
    p.add_argument('--worldcover-directory', type=Path)
    p.add_argument('--statcan-archive', type=Path, required=True, help=STATCAN_URL)
    p.add_argument('--output', type=Path, default=ROOT/'src/data/canadaAtlanticReviewed.json')
    args = p.parse_args()
    args.source_directory.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    result = {'windows': [survey(s, args.source_directory, args.worldcover_directory, args.statcan_archive) for s in SITES]}
    args.output.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')


if __name__ == '__main__':
    main()
