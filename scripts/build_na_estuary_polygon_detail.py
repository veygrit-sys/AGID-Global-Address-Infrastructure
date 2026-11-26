#!/usr/bin/env python3
"""Build surveyed US tidal-coast windows. Requires GDAL 3, NumPy and Shapely 2.

The cache holds six county archives, six checksum-verified WorldCover pixel
subsets and three local USFWS intertidal extracts. Source downloads other
than raster tiles are enabled with --download. As elsewhere in the
repository, GDAL reads uncached raster tiles by HTTP range requests.
"""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
from osgeo import gdal, ogr
from shapely import make_valid, union_all
from shapely.geometry import Point, box, shape

import build_us_atlantic_islands as tiger

regional = import_module('build-northern-central-america-review')
raster = import_module('build_canada_pacific_reviewed')
ROOT = Path(__file__).resolve().parents[1]
# County FIPS, positive mainland/island anchor, marine basin, independent context.
SITES = {
    'alcatraz': ('Alcatraz Island, San Francisco Bay', [-122.428,37.821,-122.416,37.832],
                 '06075', (-122.423,37.8267), 'Alcatraz Island', 'NEPC',
                 'https://www.nps.gov/alca/planyourvisit/basicinfo.htm'),
    'elkhorn': ('Elkhorn Slough and Moss Landing Harbor', [-121.792,36.799,-121.778,36.813],
                '06053', (-121.72,36.81), None, 'NEPC',
                'https://elkhornslough.org/files/archive/tidalwetland/downloads/SEI_Report_ES.pdf'),
    'tangier': ('Tangier Island and Mailboat Harbor', [-75.996,37.824,-75.982,37.835],
                '51001', (-75.9925,37.826), 'Tangier Island', 'NATL',
                'https://www.dhr.virginia.gov/wp-content/uploads/2018/04/309-0001_TangierIslandHD_2014_NRHP_FINAL.pdf'),
}
# SHA-256 of the complete TIGER/Line 2025 AREAWATER and ROADS ZIP archives.
COUNTIES = {
    '06075': ('792fea61ada9e5f67493278b4fec005dd443656e1a573280b20bbabff6031601',
              '216d1d7e37755b003389f7da6998143a4f4145db0cede470b7f40a0db3f6d1f0'),
    '06053': ('024102e8fa0b782ad5644d42ded8f79f748ad2f37d3fa5aaed5881d2e96291ac',
              '25fbe22b9be6345e3cbd1607b652425162f34d5b5547c339c35c97204dca3dcd'),
    '51001': ('9d971fcad5e2cebbaf823f31551aa73594fea8b2f53dc21344dd4c61748bc791',
              '3d94aec980008cdcb0066947e3dce77e29a09e3f80226d2c408fa75025a9a015'),
}
# SHA-256 of the WorldCover 2020 v100 and 2021 v200 uncompressed 10 m pixels,
# in row-major order, for the verified raster window and grid in raster.pixels.
PIXELS = {
    'alcatraz': ('12c6649bfe21e721be81e5d6597bb07cfa795c12181ea8cdc40342d7b4da558b',
                 'e649b4c28af7a99b86424662725a203427a2f7d054c1397463fb5d89c5f437a5'),
    'elkhorn': ('c86f887bb81902c8b8b9bbea54b9fde755deb183d4612af00f246a4fd78bce3a',
                '27a0042632ff75854171bc77d394df4f2df4b24f5d530c0e21a0dc8ae1e0998e'),
    'tangier': ('605f674479ac5d13149d30dac17e39c968b39eaa9d6ab7d02df989fbd2bc7d9c',
                '1c064998a9f5877453a556ae2596bdd8754e6357adb28fcc81a183cfedccde67'),
}
NWI = 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0'
NWI_SHA = {
    'alcatraz': '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    'elkhorn': '0852afa96bf4fd3647e20cdfb7d91805334315a13f54d88b2b8960d6d8ebb9d5',
    'tangier': '87ad84a444ccd285b5cad52bd2282b9e8e036bc513feed7e7b6432a94f3e7e6c',
}


def intertidal(key, bounds, cache, download):
    # M2 and E2 are the marine and estuarine intertidal subsystems of the
    # Cowardin classification. Preserve both emergent marsh and tidal flats.
    path = cache / f'nwi-intertidal-{key}.json'
    query = dict(f='geojson', where='1=1', outFields='*', geometry=','.join(map(str,bounds)),
                 geometryType='esriGeometryEnvelope', inSR=4326, outSR=4326,
                 spatialRel='esriSpatialRelIntersects', maxAllowableOffset=.00002, geometryPrecision=6)
    url = NWI + '/query?' + urlencode(query)
    if path.exists():
        data = path.read_bytes()
    elif download:
        with urlopen(url, timeout=90) as response:
            result = json.load(response)
        if (not result['features'] or result.get('exceededTransferLimit')
                or result.get('properties',{}).get('exceededTransferLimit')):
            raise ValueError(f'{key}: incomplete National Wetlands Inventory')
        records = sorted((f['properties']['GlobalID'], f['properties']['ATTRIBUTE'], f['geometry'])
                         for f in result['features'] if f['properties']['ATTRIBUTE'].startswith(('E2','M2')))
        data = json.dumps(records, sort_keys=True, separators=(',',':')).encode()
    else:
        raise FileNotFoundError(path)
    if sha256(data).hexdigest() != NWI_SHA[key]:
        raise ValueError(f'{key}: unexpected National Wetlands Inventory edition')
    if not path.exists():
        path.write_bytes(data)
    return union_all([make_valid(shape(geo)) for _, _, geo in json.loads(data)]), url


def build(key, cache, download):
    name, bounds, fips, anchor, island_name, basin, reference = SITES[key]
    frame = box(*regional.padded(bounds))
    # Reconstruct closed island holes before clipping them to the runtime window.
    context = box(*bounds).buffer(.1, join_style='mitre')
    archives, urls = [], []
    for series, digest in zip(('areawater', 'roads'), COUNTIES[fips], strict=True):
        path, url = tiger.archive(cache, fips, series, digest, download)
        archives.append(path)
        urls.append(url)
    survey = list(tiger.survey_features(archives[0], context))
    surface = union_all([geom for _, _, geom in survey])
    surveyed_land, = [p for p in regional.polygons(context.difference(surface))
                      if p.contains(Point(*anchor))]
    if surveyed_land.intersects(context.boundary) == bool(island_name):
        raise ValueError(f'{key}: landmass control does not identify the expected island or mainland')
    marine = union_all([g for kind, label, g in survey
                        if kind in ('H2051', 'H2053') or (key == 'elkhorn' and label == 'Elkhorn Slough')])
    # US 1 and local crossings can share horizontal coordinates with a charted
    # channel. Reserve ~13–17 m on each side of the TIGER road centreline even
    # where a 10 m pixel is predominantly water. Never assign an owner there.
    crossings = union_all([g.intersection(marine) for k, _, g in tiger.survey_features(archives[1], frame)
                           if k.startswith('S1') and g.intersects(marine)]).buffer(.00015)
    pixels = []
    source_digests = dict(zip(urls, COUNTIES[fips], strict=True))
    for (year, edition), digest in zip(((2020,'v100'), (2021,'v200')), PIXELS[key], strict=True):
        arr, grid, url = raster.pixels(key, frame, year, edition, digest, cache)
        urls.append(url)
        source_digests[url] = dict(sha256=digest, shape=list(arr.shape), geotransform=list(grid))
        pixels.append(arr)
    early, late = pixels
    # Tidal mud, bare sand, marsh and flooded vegetation cannot establish a dry
    # shore here. Require vegetation or built ground in BOTH annual editions.
    dry_classes = (10, 20, 30, 40, 50)
    terrestrial = raster.mask_geometry(np.isin(early, dry_classes) & np.isin(late, dry_classes), grid)
    wet = raster.mask_geometry((early == 80) & (late == 80), grid)
    tides, nwi_url = intertidal(key, bounds, cache, download)
    urls.append(nwi_url)
    source_digests[nwi_url] = NWI_SHA[key]
    dry = tiger.interior(surveyed_land.intersection(frame).intersection(terrestrial).difference(tides))
    ocean = tiger.interior(marine.intersection(frame).intersection(wet).difference(crossings).difference(tides))
    if dry.is_empty or ocean.is_empty or dry.intersects(ocean):
        raise ValueError(f'{key}: missing or overlapping land and ocean evidence')
    tags = {'kind':'island', 'name':island_name} if island_name else {'kind':'mainland'}
    return dict(id='north-america-estuary-'+key, name=name, bbox=bounds,
                source='north-america-estuary-tiger-review+'+key,
                version='TIGER/Line 2025 area hydrography and roads; ESA WorldCover 2020 v100 / 2021 v200; '
                        'USFWS National Wetlands Inventory, 2026-11-26 extract',
                attribution='U.S. Census Bureau, 2025 TIGER/Line. U.S. Fish and Wildlife Service, '
                            'National Wetlands Inventory. '+regional.WC_CREDIT,
                evidenceUrls=urls+[reference], sourceDigests=source_digests, oceanRegion=basin,
                land=raster.pack(dry, **tags), owners=raster.pack(dry, code='US'),
                water=raster.pack(ocean, kind='ocean'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--output', type=Path, default=ROOT/'src/data/naEstuaryPolygonDetail.json')
    args = parser.parse_args()
    args.source_directory.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    gdal.SetConfigOption('GDAL_HTTP_MAX_RETRY', '3')
    windows = [build(key, args.source_directory, args.download) for key in SITES]
    args.output.write_text(json.dumps({'windows':windows}, ensure_ascii=False, separators=(',',':'))+'\n')


if __name__ == '__main__':
    main()
