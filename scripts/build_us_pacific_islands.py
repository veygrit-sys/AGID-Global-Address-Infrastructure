#!/usr/bin/env python3
"""Rebuild five US Pacific island surveys. Requires Python 3.11, GDAL, NumPy and Shapely 2.

The input directory holds checksummed Census and Natural Earth ZIPs. With
--download these are fetched if missing. WorldCover is read by HTTP range, or
from full source tiles provided through --raster-directory.
"""
import argparse
from importlib import import_module
import json
from math import floor
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
from shapely import make_valid
from shapely.geometry import Point, Polygon, box
from shapely.ops import unary_union

geo = import_module('build-northern-central-america-review')
shore = import_module('build-us-canada-shorelines')
read_raster = import_module('build-south-america-andes').read_raster
obtain = import_module('build_canada_freshwater_reviewed').obtain
ROOT = Path(__file__).resolve().parents[1]
CENSUS = 'https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/'
NE_URL = 'https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_0_map_units.zip'
NE_SHA = '45bebe2aaf8bf42b9daf4428594925bcb11eabd32fe9dc6e0acf681438053eb5'
COUNTY_SHA = {
    '15003': 'f0fb48f5509010dfed84c3243a94b51035937fc1c47172c49a14b25ca8757625',
    '15009': '8c1bbfc2d4f9f3f9b51c21a2dd62d756767e7d20a82af3381720773173fa1e91',
    '06111': '8c61ae35a59d1d6528ade9bbcc769667b7bf4634a0061af9bd18e5255f349f5e',
    '02220': 'c8040b2d20f08f2e1e4749659a7ba9026ef4725fcff96465d7f70560d2bf4fc2',
    '02180': '1fe51bc6cfdfc5ec115157e3227eabd00ff7302f02e45617a2741faa35667ad1',
}
# A name anchor identifies the surveyed polygon containing that point only.
# Unnamed subsidiary rocks retain their landform and country evidence.
SITES = [
    ('mokulua', 'Mokulua Islands', '15003', [-157.7035, 21.3845, -157.693, 21.395],
     'NEPC', (-157.6982, 21.3896),
     {'Moku Nui': (-157.698889, 21.391667), 'Moku Iki': (-157.697778, 21.387778)},
     'https://www.govinfo.gov/content/pkg/FR-2015-08-21/pdf/2015-20617.pdf'),
    ('molokini', 'Molokini and the water inside the crater', '15009', [-156.502, 20.6275, -156.491, 20.636],
     'NEPC', (-156.4958, 20.6323), {'Molokini': (-156.49384, 20.63193)},
     'https://dlnr.hawaii.gov/dar/marine-managed-areas/hawaii-marine-life-conservation-districts/maui-molokini-shoal/'),
    ('anacapa', 'East and Middle Anacapa Island', '06111', [-119.393, 34.0065, -119.354, 34.020],
     'NEPC', (-119.376, 34.017), {'East Anacapa Island': (-119.3659975, 34.01462),
                                  'Middle Anacapa Island': (-119.3832057, 34.008869)},
     'https://www.nps.gov/chis/planyourvisit/upload/Anacapa-Island-Trail-Guide-2020.pdf'),
    ('lazaria', 'Saint Lazaria Islands, Sitka Sound', '02220', [-135.714, 56.981, -135.695, 56.992],
     'ALSK', (-135.7055, 56.9899), {},
     'https://www.fws.gov/r7/nwr/Realty/data/LegalDocuments/EO/EO-1040.pdf'),
    ('diomede', 'Little and Big Diomede, Bering Strait', '02180', [-169.045, 65.746, -168.923, 65.775],
     'BERI', (-168.976, 65.761), {'Little Diomede Island': (-168.933, 65.755)},
     'https://www.jpl.nasa.gov/images/pia10631-diomede-islands-bering-straight/'),
]
PIXELS = {'anacapa': ['a2d0df5683ccfca74c2fb0a65098f5cab81860ce1b2886889f1ee666d679c357',
             'b37af3ca7fc0f10dfccfad7b7d20f5740be473dac4df30c6251a47bb2b3b837d'],
 'diomede': ['f53ac214e74dc08a80c7bfb0ab4c781820ed0d36364734f2d5bae988fe3a2e25',
             'b94c71b3034c700db9b7e1532f9911702e8b0b5d49e404e35475c31df2a2934b'],
 'lazaria': ['4272f24686c6f621b71db1a3ec6a25b697d18314117ca957fece2465798f2b56',
             '7afc707214bb14c7076f4fd6486bd7a6b2777e81d90516837ee753760d802af1'],
 'mokulua': ['96bcfa5c56a675a599e1f3bbce981d154cb400f87042432e500107e2a3da7685',
             'a7dc0fd907a3223630dd56debedd3b0aeb1195fe0232515320d6133cae65bbde'],
 'molokini': ['a6adbde72ddf99cf6a376857222d6bb9aaa091c7fd04bee0616850d6e5199f0d',
              '833d48699b16041ab7a34c72f23b46f6c7128f6bbcd8149acf4ee06772be255f']}


def census_coast(archive, frame, names):
    dataset = ogr.Open('/vsizip/' + str(archive.resolve()))
    layer = dataset.GetLayer()
    layer.SetSpatialFilterRect(*frame.bounds)
    layer.SetAttributeFilter("MTFCC IN ('H2051','H2053')")
    transform = shore.wgs_transform(layer)
    water, islands = [], []
    identified = set()
    for feature in layer:
        geometry = make_valid(shore.to_wgs(feature.geometry(), transform))
        # A hole fully enclosed in the source ocean or sound outlines an island.
        # Retrieve holes before clipping so a county or viewport edge never becomes a shore.
        for polygon in geo.polygons(geometry):
            if not frame.intersects(polygon):
                continue
            water.append(polygon.intersection(frame))
            for ring in polygon.interiors:
                if not box(*ring.bounds).intersects(frame):
                    continue
                island = Polygon(ring)
                labels = [name for name, anchor in names.items() if island.contains(Point(anchor))]
                if len(labels) > 1:
                    raise ValueError(f'Several island names on one polygon: {labels}')
                identified.update(labels)
                islands.append((island.intersection(frame), labels[0] if labels else None, 'US'))
    if identified != set(names) or not water or not islands:
        raise ValueError(f'Missing or unverified Census features: {set(names) - identified}')
    return unary_union(water), islands


def country_outlines(archive, frame):
    dataset = ogr.Open('/vsizip/' + str(archive.resolve()))
    layer = dataset.GetLayer()
    layer.SetSpatialFilterRect(*frame.bounds)
    layer.SetAttributeFilter("GU_A3 IN ('USA','RUS')")
    transform = shore.wgs_transform(layer)
    outlines = {f['GU_A3']: make_valid(shore.to_wgs(f.geometry(), transform)).intersection(frame) for f in layer}
    if set(outlines) != {'RUS', 'USA'} or not outlines['RUS'].contains(Point(-169.041, 65.767873)):
        raise ValueError('Missing the two independently identified Diomede map units')
    return outlines


# The two Diomede subsets stop at their source tile edges. The intervening
# slice is open strait and has its own positive water evidence.
RELIEF = {
    'lazaria': [('N56_00_W136_00', (-135.7145, 56.9805, -135.6945, 56.9925),
                 '8f7e4639b35261b999456b5b19c268b11d432a8b70a5f0dbe45312a3c5a72f89')],
    'diomede': [('N65_00_W170_00', (-169.0455, 65.7455, -169.0005, 65.7755),
                 '7eb7f7dc826f22b726f0d14c9ae776aa0a724d5fb26679e8672b6cbeced97c46'),
                ('N65_00_W169_00', (-168.999, 65.7455, -168.9225, 65.7755),
                 '43fa3cc133b0b8729a2d6065af6a99c33b7c14ebe2f3acc67ed76ae30fbaaaed')],
}
DEM_CREDIT = (' Produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH '
              '2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.')


def land_cover(key, bounds, directory):
    west, south, east, north = bounds
    tx, ty = floor(west / 3) * 3, floor(south / 3) * 3
    if east >= tx + 3 or north >= ty + 3:
        raise ValueError(f'{key} crosses a source tile edge')
    tile = f'N{ty:02}W{abs(tx):03}'
    arrays, urls = [], []
    for (year, edition), digest in zip(((2020, 'v100'), (2021, 'v200')), PIXELS[key], strict=True):
        url = (f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{edition}/{year}/map/'
               f'ESA_WorldCover_10m_{year}_{edition}_{tile}_Map.tif')
        data, gt = read_raster(url, bounds, digest, directory)
        arrays.append(data)
        urls.append(url)
    # Class 100 is dry moss/lichen, an important cover on the Diomede uplands.
    dry_classes = [10, 20, 30, 40, 50, 60, 100]
    dry_a, dry_b = (np.isin(a, dry_classes) for a in arrays)
    dry = geo.raster_mask(dry_a & dry_b, gt)
    wet = geo.raster_mask((arrays[0] == 80) & (arrays[1] == 80), gt)
    if key in RELIEF:
        elevated = []
        for tile, extent, digest in RELIEF[key]:
            name = f'Copernicus_DSM_COG_10_{tile}_DEM'
            url = f'https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif'
            heights, grid = read_raster(url, extent, digest, directory)
            elevated.append(geo.raster_mask(np.isfinite(heights) & (heights >= 6), grid))
            urls.append(url)
        high = unary_union(elevated)
        # Confirm seasonal snow on elevated terrestrial pixels. An inland pond
        # or a floating ice patch does not become dry solely because of its height.
        seasonal = (dry_a & (arrays[1] == 70)) | (dry_b & (arrays[0] == 70))
        dry = dry.union(geo.raster_mask(seasonal, gt).intersection(high))
        wet = wet.difference(high)
    return dry, wet, urls


def interior(geometry):
    # Withhold one native pixel along mixed shores. Intersect again after
    # simplification to keep every published polygon within positive source evidence.
    return geometry.buffer(-1 / 12000, join_style='mitre').simplify(.45 / 12000).intersection(geometry)


def build(site, directory, download, raster_directory):
    key, title, county, bbox, basin, water_pin, names, reference = site
    frame = box(*geo.padded(bbox))
    filename = f'tl_2025_{county}_areawater.zip'
    archive = obtain(directory / filename, CENSUS + filename, COUNTY_SHA[county], download)
    sea, islands = census_coast(archive, frame, names)
    dry, wet, urls = land_cover(key, frame.bounds, raster_directory)
    urls.extend([CENSUS + filename, reference])
    version = 'TIGER/Line 2025 area hydrography; ESA WorldCover 2020 v100 / 2021 v200'
    credit = 'U.S. Census Bureau, TIGER/Line 2025 area hydrography (public domain). ' + geo.WC_CREDIT
    if key in RELIEF:
        credit += DEM_CREDIT
        version += '; Copernicus DEM GLO-30'
    if key == 'diomede':
        archive = obtain(directory / NE_URL.split('/')[-1], NE_URL, NE_SHA, download)
        outlines = country_outlines(archive, frame)
        islands.append((outlines['RUS'], 'Big Diomede Island', 'RU'))
        # Beyond Census coverage, map only the observed ocean component connected
        # to the named Bering Strait and outside both countries' outlines.
        sea = sea.union(frame.difference(unary_union(list(outlines.values()))))
        version += '; Natural Earth map units 5.1.1'
        credit += ' Made with Natural Earth (public domain).'
        urls.append(NE_URL)
    land, owners = [], []
    for outline, name, code in islands:
        core = interior(outline.intersection(dry))
        land.extend(geo.pack(core, kind='island', **({'name': name} if name else {})))
        owners.extend(geo.pack(core, code=code))
    wet = wet.intersection(sea).difference(unary_union([g for g, _, _ in islands]))
    ocean, = (p for p in geo.polygons(wet) if p.contains(Point(water_pin)))
    water = geo.pack(interior(ocean), kind='ocean')
    if not land or not water:
        raise ValueError(f'No corroborated land or ocean at {key}')
    return dict(id='us-pacific-' + key, name=title, bbox=bbox, oceanRegion=basin,
                source='us-pacific-islands+' + key, version=version, attribution=credit,
                evidenceUrls=urls, land=land, owners=owners, water=water)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--raster-directory', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'src/data/usPacificIslandsReviewed.json')
    args = parser.parse_args()
    args.input_directory.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    windows = [build(site, args.input_directory, args.download, args.raster_directory) for site in SITES]
    args.output.write_text(json.dumps({'windows': windows}, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
