#!/usr/bin/env python3
"""Build five Atlantic, Gulf and Great Lakes island extracts. Python 3.11+, GDAL, NumPy, Shapely 2.

--download obtains checksum-pinned TIGER/Line 2025 county archives. WorldCover
2020/21 is read in small HTTP ranges, with only the checked local pixels cached.
"""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
from osgeo import gdal, ogr
from shapely import make_valid, union_all
from shapely.geometry import Point, box, shape

regional = import_module('build-northern-central-america-review')
census = import_module('build-us-canada-shorelines')
raster = import_module('build_canada_pacific_reviewed')
ROOT = Path(__file__).resolve().parents[1]
TIGER = 'https://www2.census.gov/geo/tiger/TIGER2025/'
SOURCES = {
    '12087': '7f87a97c741de5452efddc279c2759b7d996ccc0d0f7177a8e5bcdb175842442',
    '25021': '1b6234bd6b2bffb588507342d980996d575e712cde56fcf4ba011aa89598d0c4',
    '25023': '315fcf16119929efaaf16e1f36019b22e76f2d6a54c230f583d307db857d7d99',
    '25025': 'c154cf13b4ce2d19753ba06d4ce4bb3bd87f26daee3ce416e3af712702ad5604',
    '34017': '58e3a89b8be16f3c2598f1839774e5661bb4ac405cb2595663ba597e917982ce',
    '36061': '84f6cc65a48aac2363b8a5a971bf06044dc866a84a89ce94f09ae466eca12cd8',
    '37031': '1cc79a3778b7adde7056e697b4be243365ee3db0df3b1c0e2b7b1c9951bf674c',
    '55003': 'a644578a9f35bfb98eb7bb33e28e37ee1ce54e74c347a85470d0262d946bc830',
    '55007': '1cfebaf229a12e6dd7b36df4e54f453c033e9d5ca688ee0efdb0dcb096cd19f3',
}
BRIDGE_LAYER = 'https://gis.charttools.noaa.gov/arcgis/rest/services/encdirect/enc_harbour/MapServer/141'
BRIDGE_SHA = '2a48ade633f5582a5fbe287bbb33813fb040a6adeaa4f64b46ec88e8b1dd2cac'
NPS = 'https://www.nps.gov/'
# The anchors identify labelled landmasses inside the surveyed TIGER shoreline.
# Coordinates are longitude/latitude. They assign neither land nor water.
SITES = {
    'tortugas': ('Dry Tortugas', [-82.928,24.619,-82.854,24.646], ('12087',), 'GMXC',
        {'Loggerhead Key':(-82.922585,24.631089), 'Garden Key':(-82.87316,24.62758),
         'Bush Key':(-82.868604,24.628259)},
        ['drto/planyourvisit/upload/Map-and-Guide.pdf','places/garden-key.htm','places/loggerhead-key.htm']),
    'brewster': ('Boston Harbor Islands', [-70.934,42.315,-70.882,42.344], ('25025','25021','25023'), 'NATL',
        {'Little Brewster Island':(-70.890083,42.328090), 'Georges Island':(-70.92720,42.3201),
         'Lovells Island':(-70.928982,42.329935)},
        ['boha/planyourvisit/maps.htm','boha/learn/historyculture/facts-libr.htm']),
    'apostle': ('Devils Island, Lake Superior', [-90.738,47.06,-90.713,47.084], ('55003','55007'), None,
        {'Devils Island':(-90.72800654,47.06332841)}, ['apis/planyourvisit/campsite-gps.htm']),
    'lookout': ('Barden Inlet and Cape Lookout', [-76.558,34.613,-76.518,34.645], ('37031',), 'NATL',
        {'South Core Banks':(-76.5244,34.6229), 'Shackleford Banks':(-76.536699,34.636877)},
        ['places/shackleford-banks.htm','places/south-core-banks.htm']),
    'liberty': ('Liberty and Ellis islands, Upper New York Bay', [-74.052,40.685,-74.035,40.705], ('36061','34017'), 'NATL',
        {'Liberty Island':(-74.04454,40.68925), 'Ellis Island':(-74.03965,40.69945)},
        ['stli/planyourvisit/maps.htm','elis/planyourvisit/basicinfo.htm']),
}
PIXELS = {
    'tortugas': ('c5b8a7ce285330a6d8fa681e63870b86445780cf1f458d5d6032a03234736619',
                '3785a85861d741b08ac75e338ad7fbf10c334471bb73d0f9c42f07a37784e303'),
    'brewster': ('bbe1c4bd8f02d7f8fcef5932f5c2ece31cddc9566663a2775c219b606a0b8ff4',
                '4f5d894f1ad64a11e881dd1ce8567fc1f2c237cbaa922d10ec837f0187e06369'),
    'apostle': ('885689e646138b4897678518ffd5539c0565daaea64e85e49ed626a68e96df72',
                '28540a5a709588c672fce930382a5c746afd621737b8f952cbc33dd3bfc12fcf'),
    'lookout': ('dd210fc78578bd235768ed1af5ffcd3e413ef8014371b4e54519aff378a5888e',
                'aa6b67c3a42f8ba68302787a33b85c40c1c698589cdf00e6774601a173c9f0cc'),
    'liberty': ('228969673b2399ebac64087c14628d212723c41d1de6ea0a28e3e320887ab47a',
                '9cfc288037b29e8523a1cf3951c697b864116c369e9eb414e17d41468a2a76ea'),
}


def archive(cache, fips, series, digest, download):
    filename = f'tl_2025_{fips}_{series}.zip'
    url = TIGER + series.upper() + '/' + filename
    path = cache / filename
    if not path.exists() and download:
        with urlopen(url, timeout=90) as response:
            data = response.read()
        if sha256(data).hexdigest() != digest:
            raise ValueError('Source edition changed: ' + url)
        with NamedTemporaryFile(dir=cache, delete=False) as stream:
            stream.write(data)
            temporary = Path(stream.name)
        temporary.replace(path)
    regional.check(path, digest)
    return path, url


def survey_features(path, frame):
    dataset = ogr.Open('/vsizip/' + str(path.resolve()))
    layer = dataset.GetLayer()
    transform = census.wgs_transform(layer)
    layer.SetSpatialFilterRect(*transform.GetInverse().TransformBounds(*frame.bounds, 21))
    for item in layer:
        geometry = make_valid(census.to_wgs(item.geometry(), transform)).intersection(frame)
        if not geometry.is_empty:
            yield item['MTFCC'], item['FULLNAME'], geometry


def ellis_bridge(cache, download):
    params = dict(where='1=1', geometry='-74.05,40.695,-74.037,40.704',
                  geometryType='esriGeometryEnvelope', spatialRel='esriSpatialRelIntersects',
                  inSR=4326, outSR=4326, outFields='*', returnGeometry='true', f='geojson')
    url = BRIDGE_LAYER+'/query?'+urlencode(params)
    path = cache/'ellis-bridge.geojson'
    if path.exists():
        content = path.read_bytes()
    elif download:
        with urlopen(url, timeout=90) as response:
            content = response.read()
    else:
        raise FileNotFoundError(path)
    record, = json.loads(content)['features']
    fields = record['properties']
    geometry = record['geometry']
    digest = sha256(json.dumps(geometry, separators=(',', ':')).encode()).hexdigest()
    if fields['DSNM'] != 'US5NYCDF.000' or fields['CATBRG'] != 'fixed bridge' or digest != BRIDGE_SHA:
        raise ValueError('Unexpected NOAA ENC edition of Ellis Island Bridge')
    if not path.exists():
        path.write_bytes(content)
    return shape(geometry), url


def interior(geometry):
    # Keep mixed shoreline pixels and artificial contact points under review.
    core = geometry.buffer(-.000025, join_style='mitre')
    return core.simplify(.000025).intersection(core)


def window(key, site, cache, download):
    title, bounds, counties, basin, anchors, refs = site
    frame = box(*bounds).buffer(.0008, join_style='mitre')
    # Enclose whole barrier islands before looking for dry holes in hydrography.
    # A county seam or cropped map boundary must never make a mainland an island.
    context = box(-76.77,34.5,-76.12,35.06) if key == 'lookout' else box(*bounds).buffer(.045, join_style='mitre')
    water_rows, urls = [], [NPS+ref for ref in refs]
    for fips in counties:
        path, url = archive(cache, fips, 'areawater', SOURCES[fips], download)
        water_rows.extend(survey_features(path, context))
        urls.append(url)
    surface = union_all([geometry for _, _, geometry in water_rows])
    islands = [p for p in regional.polygons(context.difference(surface))
               if not p.intersects(context.boundary) and p.intersects(frame)]
    polygons, urls_wc = [], []
    for (year, edition), digest in zip([(2020,'v100'), (2021,'v200')], PIXELS[key], strict=True):
        pixels, grid, url = raster.pixels(key, frame, year, edition, digest, cache)
        polygons.append(pixels)
        urls_wc.append(url)
    earlier, later = polygons
    dry_classes = (10,20,30,40,50,60)
    dry = raster.mask_geometry(np.isin(earlier,dry_classes) & np.isin(later,dry_classes), grid)
    wet = raster.mask_geometry((earlier == 80) & (later == 80), grid).intersection(frame)
    if key == 'liberty':
        # NOAA charts the deck across the water between Ellis Island and New
        # Jersey. In 2D both the bridge user and the water below occupy this
        # footprint. Leave that part of the estuary unresolved.
        bridge, bridge_url = ellis_bridge(cache, download)
        wet = wet.difference(bridge.buffer(.000045))
        urls.append(bridge_url)
    land, owners, seen = [], [], set()
    for island in islands:
        labels = [name for name,pin in anchors.items() if island.contains(Point(*pin))]
        if len(labels)>1 or seen.intersection(labels):
            raise ValueError(f'{key}: duplicate or joined named islands {labels}')
        seen.update(labels)
        area = interior(island.intersection(dry).intersection(frame))
        label = {'name': labels[0]} if labels else {}
        land.extend(raster.pack(area, kind='island', **label))
        owners.extend(raster.pack(area, code='US'))
    if seen != set(anchors):
        raise ValueError(f'{key}: named islands absent: {set(anchors) - seen}')
    marine = [g for kind,name,g in water_rows if kind in ('H2051','H2053') or (key == 'liberty' and name == 'Hudson Riv')]
    freshwater = [g for kind,name,g in water_rows if kind == 'H2030']
    water = []
    for kind, records in [('ocean',marine), ('inland',freshwater)]:
        if records:
            water.extend(raster.pack(interior(wet.intersection(union_all(records))), kind=kind))
    return dict(id='us-islands-'+key, name=title, bbox=bounds, source='us-islands-tiger-review+'+key,
                version='TIGER/Line 2025 Area Hydrography'+('; NOAA ENC US5NYCDF, fixed bridge survey 2006-11-07' if key=='liberty' else '')+
                        '; ESA WorldCover 2020 v100 / 2021 v200',
                attribution='U.S. Census Bureau, 2025 TIGER/Line. '+
                            ('NOAA Office of Coast Survey, ENC Direct to GIS. ' if key=='liberty' else '')+regional.WC_CREDIT,
                evidenceUrls=urls+urls_wc, **({'oceanRegion':basin} if basin else {}),
                land=land, owners=owners, water=water)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--output', type=Path, default=ROOT/'src/data/usAtlanticIslandsReviewed.json')
    args = parser.parse_args()
    args.source_directory.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN','EMPTY_DIR')
    windows = [window(key, s, args.source_directory, args.download) for key,s in SITES.items()]
    args.output.write_text(json.dumps({'windows':windows}, ensure_ascii=False, separators=(',',':'))+'\n')


if __name__ == '__main__':
    main()
