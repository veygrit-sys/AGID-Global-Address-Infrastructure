#!/usr/bin/env python3
"""Build four Australian and New Zealand island surveys (GDAL, NumPy and Shapely 2).
python3 scripts/build_oceania_australasia.py CACHE --download
Only small source windows are downloaded. A populated cache supports offline builds.
"""
import argparse
from hashlib import sha256
from importlib import import_module
from math import ceil, floor
import json
from pathlib import Path
from urllib.parse import urlencode

import numpy as np
from osgeo import gdal
from shapely import make_valid, union_all
from shapely.geometry import Polygon, box, shape

from build_canada_freshwater_reviewed import obtain, reviewed_interior
from build_canada_pacific_reviewed import pixels

geo = import_module('build-northern-central-america-review')
OUT = Path(__file__).resolve().parents[1] / 'src/data/oceaniaAustralasiaPolygonDetail.json'
GA = 'https://services.ga.gov.au/gis/rest/services/'
HIGH_TIDE = ('https://public-services.slip.wa.gov.au/public/rest/services/'
             'SLIP_Public_Services/Environment/MapServer/')
TIDE_CREDIT = 'Contains modified DPIRD-094 high-resolution high-tide coastlines, Western Australian Department of Primary Industries and Regional Development and Landgate, CC BY 4.0.'
OCCURRENCE = 'https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/occurrence_110E_30Sv1_4_2021.tif'
AU_COAST = GA + 'Topographic_Base_Map/MapServer/509'
AU_LAKES = GA + 'Surface_Hydrology/MapServer/5'
NZ_COAST = ('https://seasketch.doc.govt.nz/arcgis/rest/services/National/'
            'Seafloor_Community_Classification/MapServer/1')
LINZ = 'https://data.linz.govt.nz/layer/51153-nz-coastlines-and-islands-polygons-topo-150k/'
AU_CREDIT = '© Commonwealth of Australia (Geoscience Australia) 2016. Adapted under CC BY 4.0.'
NZ_CREDIT = 'Source: LINZ Data Service, licensed for reuse under CC BY 4.0. Adapted Topo50 data hosted by the New Zealand Department of Conservation.'
SITES = {
    'au-rottnest-lakes': ('Salt lakes of Wadjemup / Rottnest Island', [115.510, -32.0069, 115.536, -31.9955], None,
                          'https://www.rottnestisland.com/see-do/wildlife-nature/lakes-salt-lakes'),
    'au-rottnest-islets': ('Dyer Island and Wallace Island off Wadjemup', [115.548, -32.0224, 115.558, -32.011], 'SIND',
                           'https://www.ria.wa.gov.au/docs/default-source/boating/marine-and-boating-guide-reserve-map-2014.pdf'),
    'nz-ulva-tamihau': ('Ulva Island / Te Wharawhara and Tāmihau Island', [168.102, -46.937, 168.118, -46.929], 'SPAC',
                        'https://www.doc.govt.nz/globalassets/documents/conservation/marine-and-coastal/marine-protected-areas/marine-reserve-maps/ulva-island-te-wharawhara-marine-reserve.pdf'),
    'nz-chatham-rangatira': ('Rangatira (South East Island), Chatham Islands', [-176.193, -44.349, -176.162, -44.329], 'SEPC',
                            'https://www.doc.govt.nz/nature/habitats/offshore-islands/chatham-islands/mangere-and-rangatira-islands'),
}
NAMES = {'ROTTNEST ISLAND': 'Wadjemup / Rottnest Island', 'DYER ISLAND': 'Dyer Island',
         'WALLACE ISLAND': 'Wallace Island', 'Ulva Island': 'Ulva Island / Te Wharawhara',
         'Tamihau Island': 'Tāmihau Island', 'Rangitira (South East Island)': 'Rangatira (South East Island)'}
VECTOR_SHA = {
    'au-rottnest-high-86': 'f149ab63f65cba2ea2dbb026135464363b45ccd56b82c6a476bb0c4e34a74b36',
    'au-rottnest-high-91': 'eacee9ef41a0125f562f6f410c396cad478dcad60567e65bc1a8ed5317607d69',
    'au-rottnest-islets': '6713cd8d7cf04cf8bba66cf2f962864d27a2dae6f3387ee5e559d196167314d8',
    'au-rottnest-lakes': 'faf3030d0c09be664b1bd1ed1d81cb77d894fdb41f9ac53c9e25795f651b3344',
    'au-rottnest-lakes-hydro': '9b86434e9b940d73f11413e7c1c2876e8d33ff78ea76901c1ddcc6258c5daee6',
    'nz-chatham-rangatira': 'f10d281a682a2bb5762a275a94699d5410e972b3fa286ef9c06d2027156abf6d',
    'nz-ulva-tamihau': '17b4c67ff4147a9ab9a49dbcc86c7e1446ddf5f762d0c0ca4bf07e761476e9b7',
}
PIXEL_SHA = {
    'au-rottnest-islets': ('4c50082a5fea5dc69aa2f73ce85ec452c7e3494919713d80fc2ce0cd2ce99fe4',
        '9ff5f86a2854aeee94c3d6ee2673b941209ec32e2eb140501f30508c551d28fb'),
    'au-rottnest-lakes': ('ea65b09a165228f57c615f1dec0cb9f6946807399a736dce2213f0eb03df0039',
        'e29f7fab8ef2920bf76631d3a8c9d2857bffbc030871841fe5cf4fb280bc2a2a'),
    'nz-chatham-rangatira': ('5ee4cbc4cfceda84009430bd5cb37839be7bc6582ef31d641b28fb5c29b91054',
        'e4446296fa522f0867b1ed37d5422aa0307bd094a945d6ed7fd6c8b736a87f47'),
    'nz-ulva-tamihau': ('311fd190b1c3886995c149f608061fefb592718ddfcfddc27332858e30cfc265',
        '42faf8d43f43324dd91e056ec5c988b93fd476a92e2246a80d925059dde0d15a'),
}


def extract(key, layer, fields, frame, cache, download):
    # Retrieve intersecting full closed polygons, including unnamed islets. A
    # frame only limits where the resulting survey can override the basemap.
    args = dict(where='1=1', geometry=','.join(f'{v:.7f}' for v in frame.bounds),
                geometryType='esriGeometryEnvelope', inSR=4326, spatialRel='esriSpatialRelIntersects',
                outFields=fields, orderByFields=fields.split(',')[0], outSR=4326, geometryPrecision=7, f='geojson')
    url = layer + '/query?' + urlencode(args)
    raw = obtain(cache / (key + '.geojson'), url, VECTOR_SHA[key], download)
    fc = json.loads(raw.read_bytes())
    if fc.get('type') != 'FeatureCollection' or not fc['features'] or fc.get('exceededTransferLimit') or fc.get('properties', {}).get('exceededTransferLimit'):
        raise ValueError(f'Missing or partial survey features for {key}')
    return [(f['properties'], make_valid(shape(f['geometry']))) for f in fc['features']], url


def observed(key, frame, cache, download):
    images, urls = [], []
    grid = None
    for (year, version), digest in zip([(2020, 'v100'), (2021, 'v200')], PIXEL_SHA[key], strict=True):
        if not download and not (cache / f'{key}-{year}.npy').exists():
            raise FileNotFoundError(f'Missing cached WorldCover extract for {key} {year}')
        data, affine, url = pixels(key, frame, year, version, digest, cache)
        if grid is not None and grid != affine:
            raise ValueError('WorldCover grids differ between years')
        grid = affine
        images.append(data)
        urls.append(url)
    first, second = images
    # Bare bright salt crusts in the Rottnest lake district are not dry island
    # evidence. Require vegetation or built surface for the dry side there.
    classes = (10, 20, 30, 40, 50) if key == 'au-rottnest-lakes' else (10, 20, 30, 40, 50, 60, 100)
    return (geo.raster_mask(np.isin(first, classes) & np.isin(second, classes), grid),
            geo.raster_mask((first == 80) & (second == 80), grid), urls)


def rottnest_tides(records, frame, cache, download):
    # Identify each repeated high-tide survey feature by ID against the RIA
    # boating map. These official island names locate the rings, independently
    # of the generalized positions in the national 1:250,000 map.
    tides = []
    urls = []
    for layer, names in [(91, {442924: 'DYER ISLAND', 448360: 'WALLACE ISLAND', 452946: 'ROTTNEST ISLAND'}),
                         (86, {272381: 'DYER ISLAND', 272330: 'WALLACE ISLAND', 295129: 'ROTTNEST ISLAND'})]:
        rows, url = extract(f'au-rottnest-high-{layer}', HIGH_TIDE + str(layer),
                            'objectid,confidence,coast_type,date_label', frame, cache, download)
        urls.append(url)
        epoch = {}
        for attrs, coast in rows:
            name = names[attrs['objectid']]
            if attrs['coast_type'] != 'Island' or attrs['confidence'] != 'High':
                raise ValueError('Expected DPIRD high-confidence island high-water shoreline')
            if coast.geom_type == 'LineString' and coast.is_ring:
                epoch[name] = Polygon(coast.coords).intersection(frame)
            elif name != 'ROTTNEST ISLAND' or layer != 86:
                raise ValueError(f'Open high-tide shoreline on {name}')
        tides.append(epoch)
    early, late = tides
    atlas = {attrs['name']: geom for attrs, geom in records}
    if set(early) != set(atlas) or set(late) != {'DYER ISLAND', 'WALLACE ISLAND'}:
        raise ValueError('Unexpected Rottnest high-tide island set')
    # The 2022 line is open on the main island. Require the 2019 measured
    # high tide and the GA mainland-island outline there without closing a gap.
    late['ROTTNEST ISLAND'] = atlas['ROTTNEST ISLAND'].intersection(frame)
    stable = [({'name': name}, a.intersection(late[name])) for name, a in early.items()]
    return stable, list(early.values()) + list(late.values()), urls


def lake_history(frame, cache, download):
    # Landsat occurrence (1984–2021) excludes intermittently inundated salt
    # flats from land and requires recurrent open water for a perennial lake.
    path = cache / 'rottnest-occurrence.npz'
    if path.exists():
        with np.load(path, allow_pickle=False) as data:
            grid, values = tuple(data['grid']), data['pixels']
    else:
        if not download:
            raise FileNotFoundError(f'Missing {path}; pass --download')
        ds = gdal.Open('/vsicurl/' + OCCURRENCE)
        x0, dx, rx, y0, ry, dy = ds.GetGeoTransform()
        if rx or ry or ds.GetSpatialRef().GetAuthorityCode(None) != '4326':
            raise ValueError('Unexpected JRC grid')
        w, s, e, n = frame.bounds
        ix, iy = floor((w-x0)/dx), floor((n-y0)/dy)
        values = ds.ReadAsArray(ix, iy, ceil((e-x0)/dx)-ix, ceil((s-y0)/dy)-iy)
        grid = (x0+ix*dx, dx, 0., y0+iy*dy, 0., dy)
    if sha256(np.asarray(grid, dtype='<f8').tobytes() + values.tobytes()).hexdigest() != (
            '1918511b8d32a04ff0f74d85d75df4ebf379c6665d79d88e56deb222eb405737'):
        raise ValueError('Unexpected JRC Rottnest occurrence grid or pixels')
    if not path.exists():
        np.savez_compressed(path, pixels=values, grid=grid)
    return (geo.raster_mask((values > 0) & (values <= 100), grid),
            geo.raster_mask((values >= 75) & (values <= 100), grid))


def build(key, site, cache, download):
    label, bounds, basin, reference = site
    frame = box(*geo.padded(bounds))
    au = key.startswith('au-')
    country = 'AU' if au else 'NZ'
    layer = AU_COAST if au else NZ_COAST
    fields = 'objectid,name,ufi' if au else 'OBJECTID,name'
    records, coast_url = extract(key, layer, fields, frame, cache, download)
    dry, wet, urls = observed(key, frame, cache, download)
    urls += [coast_url, reference, 'https://creativecommons.org/licenses/by/4.0/']
    if not au:
        urls.append(LINZ)
    tide_exclusions = []
    credit = AU_CREDIT if au else NZ_CREDIT
    version = 'Geoscience Australia Topographic Base Map' if au else 'LINZ Topo50 mean-high-water island outlines'
    if key == 'au-rottnest-islets':
        records, tide_exclusions, tide_urls = rottnest_tides(records, frame, cache, download)
        urls.extend(tide_urls)
        urls.append('https://catalogue.data.wa.gov.au/dataset/high-resolution-national-high-tide-coastline-history-dpird-094')
        credit += ' ' + TIDE_CREDIT
        version += '; DPIRD-094 high tide, 2019 H2 and 2022 H1'
    waterbodies = union_all([])
    water = []
    if key == 'au-rottnest-lakes':
        lakes, lake_url = extract(key + '-hydro', AU_LAKES, 'objectid,name,perenniality,featuretype,type',
                                  frame, cache, download)
        urls.extend([lake_url, OCCURRENCE, 'https://global-surface-water.appspot.com/'])
        credit += ' EC JRC Global Surface Water v1.4, 1984–2021 (Pekel et al., Nature 2016); modified occurrence data.'
        version += '; Geoscience Australia Surface Hydrology; JRC Global Surface Water v1.4'
        observed_water, recurrent = lake_history(frame, cache, download)
        dry = dry.difference(observed_water)
        wet = wet.intersection(recurrent)
        waterbodies = union_all([p.intersection(frame) for _, p in lakes])
        perennial = union_all([p.intersection(frame) for attrs, p in lakes
                               if attrs['perenniality'] == 'Perennial' and attrs['featuretype'] == 'Lake'])
        water = geo.pack(reviewed_interior(perennial.intersection(wet)), kind='inland')
    land, owners, shells = [], [], tide_exclusions
    for attrs, geometry in records:
        for polygon in geo.polygons(geometry):
            # Filling a shell is solely an exclusion from the sea mask. An
            # inland hole can never become ocean simply by being outside land.
            if not box(*polygon.bounds).intersects(frame):
                continue
            shells.append(Polygon(polygon.exterior).intersection(frame))
            core = reviewed_interior(polygon.intersection(frame).difference(waterbodies).intersection(dry))
            label_on_map = attrs['name']
            name = NAMES.get(label_on_map, label_on_map)
            parts = geo.pack(core, kind='island', **({'name': name} if name else {}))
            land.extend(parts)
            owners.extend(dict(code=country, bbox=p['bbox'], rings=p['rings']) for p in parts)
    if basin:
        # Only stable open water on the seaward side of the mapped high-water
        # coastline is eligible. Exclude pockets with no connection to the sea.
        exterior = frame.difference(union_all(shells))
        ocean = union_all([p for p in geo.polygons(exterior) if p.intersects(frame.boundary)])
        water.extend(geo.pack(reviewed_interior(ocean.intersection(wet)), kind='ocean'))
    if not land or not water:
        raise ValueError(f'{key} lacks a corroborated physical class')
    return dict(id=key, name=label, bbox=bounds, source='oceania-australasia+' + key,
                version=version + '; ESA WorldCover 2020 v100 and 2021 v200',
                attribution=credit + ' ' + geo.WC_CREDIT,
                evidenceUrls=urls, **({'oceanRegion': basin} if basin else {}), land=land, water=water, owners=owners)


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('cache', type=Path)
    cli.add_argument('--download', action='store_true')
    cli.add_argument('--output', type=Path, default=OUT)
    args = cli.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    windows = [build(k, site, args.cache, args.download) for k, site in SITES.items()]
    args.output.write_text(json.dumps({'windows': windows}, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
