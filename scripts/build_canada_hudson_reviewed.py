#!/usr/bin/env python3
"""Build three Nunavut small-island windows. Requires GDAL, NumPy and Shapely 2.

Run with INPUT_DIR --download for the small CanVec tiles and CGNDB features.
ESA WorldCover windows are read by HTTP range; --raster-directory uses local COGs.
"""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import floor
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile

import numpy as np
from osgeo import gdal, ogr, osr
import shapely
from shapely.geometry import Point, box, shape
from shapely.ops import unary_union

common = import_module('build-northern-central-america-review')
read_raster = import_module('build-south-america-andes').read_raster
ROOT = Path(__file__).resolve().parents[1]
CANVEC = 'https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/canvec/archive/canvec_archive_20130515/50k_shp'
CGNDB = 'https://geogratis.gc.ca/services/geoname/en/geonames'
ESA = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com'
CATALOGUE = 'https://open.canada.ca/data/en/dataset/be0165a8-ad5d-4adb-a27a-2d4117c3967c'
HUDSON = ('https://www.canada.ca/en/environment-climate-change/services/migratory-bird-sanctuaries/'
          'locations/akimiski-island.html')
ATTRIBUTION = ('Contains information licensed under the Open Government Licence – Canada, adapted from '
               'Natural Resources Canada CanVec and the Canadian Geographical Names Database. ' + common.WC_CREDIT)
# id, official island name and identifier, original map sheet, lookup bounds,
# dry control, and SHA256 of CanVec, CGNDB, WorldCover 2020 and 2021 respectively.
SITES = [
    ('wolf-islet', 'Wolf Islet', 'OASBE', '033d03', [-79.246,52.098,-79.231,52.111], (-79.24281,52.107074),
     ('4202d38b05d485c7a497a32f0262285fb2929be35147bfb18a60c4f686edba49',
      '665f63c8fbe843f575e4f5e1d68539d67625059541573bbdbd19eeea206827ba',
      '3d3ff298c1548024e94c1ef74003f110739acb00a7dee88209c1a21d0488b889',
      '989451241d39b13d6b4cda34455e21bb43663018f0cb3a7e021549d9ff8b260e')),
    ('twin-cairns', 'Twin Cairns Island', 'OARBP', '034d10', [-78.812,56.511,-78.780,56.529], (-78.796,56.519),
     ('1c91ffafe72546f7a60c9a1b3fb3e2af17529ca9f80f3dbc9a21f7737f7e9708',
      '4d97ca1bb70eeacce6886d8776189c81d836b72d0348662622553dc112c46cdb',
      'a51bb29a116d33309433fbc1c755c5cf750400f6c0f706f779735ec110a77adc',
      'ca5678bc694b02547ff523ed3b1a5fcc64cb7b8af3dd8a3011dc7a92b0bff96e')),
    ('gasket-island', 'Gasket Island', 'OAGDZ', '043a08', [-80.265,52.406,-80.240,52.428], (-80.253,52.417),
     ('fd9fd24d65165dbaaba3944c7a6253ba81b9b020adc68b55f6fdbc392dc39f68',
      '6499888909882308336d482b9403f40428cfc72fdb68a2fda78d2e756114e007',
      'ce1588dc38f6afa88034a90f43aa9281f11e1a24dbc009d5f0651179c488e647',
      'f54ad68a31739b3d9943c815d413f4fb082b5b363eebb37111af39fd99cbae0c')),
]


def cached(url, path, digest, download):
    if download and not path.exists():
        with urlopen(url, timeout=90) as response:
            content = response.read()
        if sha256(content).hexdigest() != digest:
            raise ValueError(f'Source changed: {url}')
        path.write_bytes(content)
    common.check(path, digest)
    return path


def waterbodies(archive, frame):
    with ZipFile(archive) as files:
        member, = (n for n in files.namelist() if n.endswith('_HD_1480009_2.shp'))
    ds = ogr.Open(f'/vsizip/{archive.resolve()}/{member}')
    layer = ds.GetLayer()
    native = layer.GetSpatialRef().Clone()
    native.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    wgs = osr.SpatialReference()
    wgs.ImportFromEPSG(4326)
    wgs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    to_wgs = osr.CoordinateTransformation(native, wgs)
    to_map = osr.CoordinateTransformation(wgs, native)
    layer.SetSpatialFilterRect(*to_map.TransformBounds(*frame.bounds, 21))
    wet, ocean = [], []
    for feature in layer:
        geometry = feature.geometry().Clone()
        geometry.Transform(to_wgs)
        polygon = shapely.make_valid(shapely.from_wkb(bytes(geometry.ExportToWkb()))).intersection(frame)
        wet.append(polygon)
        # CanVec feature 1481402 is permanent ocean. Inland and intermittent
        # water veto dry land, but do not serve as evidence of open sea.
        if feature['CODE'] == 1481402:
            ocean.append(polygon)
    return unary_union(wet), unary_union(ocean)


def window(site, directory, download, rasters):
    key, name, identifier, sheet, bounds, anchor, digests = site
    archive = f'canvec_{sheet}_shp.zip'
    chart_url = f'{CANVEC}/{sheet[:3]}/{sheet[3]}/{archive}'
    names_url = f'{CGNDB}/{identifier}.geojson?expand=feature'
    chart = cached(chart_url, directory / archive, digests[0], download)
    named = json.loads(cached(names_url, directory / f'{identifier}.geojson', digests[1], download).read_bytes())
    metadata = named['properties']
    if (metadata['name'], metadata['cgndbid'], metadata['status'], metadata['concise'], metadata['province']) != (
            name, identifier, 'official', 'ISL', '62'):
        raise ValueError(f'Expected official Nunavut island: {identifier}')
    outline = shape(named['geometry'])
    frame = box(*common.padded(bounds))
    wet_map, ocean = waterbodies(chart, frame)
    tile = f'N{3*floor(bounds[1]/3):02}W{abs(3*floor(bounds[0]/3)):03}'
    arrays, urls = [], [names_url, chart_url, CATALOGUE, HUDSON]
    for year, edition, digest in zip((2020, 2021), ('v100', 'v200'), digests[2:]):
        url = f'{ESA}/{edition}/{year}/map/ESA_WorldCover_10m_{year}_{edition}_{tile}_Map.tif'
        pixels, grid = read_raster(url, frame.bounds, digest, rasters)
        arrays.append(pixels)
        urls.append(url)
    dry_classes = [10, 20, 30, 40, 50, 60]  # exclude intermittent wetland, ice, and open water
    dry_pixels = np.isin(arrays[0], dry_classes) & np.isin(arrays[1], dry_classes)
    wet_pixels = (arrays[0] == 80) & (arrays[1] == 80)
    # Exclude one native pixel along mixed shorelines. The gazetteer's label
    # position is never used as a physical footprint (Wolf Islet's is offshore).
    dry = common.raster_mask(dry_pixels, grid).buffer(-grid[1], join_style='mitre')
    dry = dry.intersection(outline).difference(wet_map).intersection(frame)
    water = common.raster_mask(wet_pixels, grid).buffer(-grid[1], join_style='mitre')
    water = water.intersection(ocean).difference(outline)
    if not dry.contains(Point(anchor)) or water.is_empty or dry.intersection(water).area:
        raise ValueError(f'Island and open-water agreement failed: {name}')
    return dict(id=key, name=name, bbox=bounds, source='canada-island-review+' + key, oceanRegion='HUDB',
                version=f'NRCan CanVec 1:50,000 {sheet}; CGNDB {identifier}; ESA WorldCover 2020/2021',
                attribution=ATTRIBUTION, evidenceUrls=urls, land=common.pack(dry, kind='island', name=name),
                owners=common.pack(dry, code='CA'), water=common.pack(water, kind='ocean'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--raster-directory', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'src/data/canadaHudsonReviewed.json')
    args = parser.parse_args()
    args.input_directory.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    windows = [window(site, args.input_directory, args.download, args.raster_directory) for site in SITES]
    args.output.write_text(json.dumps({'windows': windows}, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
