#!/usr/bin/env python3
"""Rebuild three North American island and interior-lake shoreline windows.

Python 3.11+, GDAL/OGR with NumPy, Shapely 2.
python3 scripts/build_na_lakes_polygon_detail.py CACHE --download
Each vector archive, the Ontario OHN response and each pixel grid are
checksum-verified. Once populated, CACHE also supports an offline rebuild.
"""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import ceil, floor
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
from shapely import make_valid, union_all
from shapely.geometry import Point, Polygon, box, shape

import build_canada_freshwater_reviewed as freshwater

common = import_module('build-northern-central-america-review')
shore = import_module('build-us-canada-shorelines')
OUTPUT = Path(__file__).resolve().parents[1] / 'src/data/naLakesPolygonDetail.json'
TIGER_BASE = 'https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/'
RYAN = (-88.7709104, 48.0098831)  # USGS GNIS 636435, Todd Harbor quadrangle
HEART = (-75.922575, 44.344525)  # Thousand Islands Bridge Authority, Boldt Castle
SITES = {
    'us-siskiwit-ryan': ('Ryan Island and the eastern islets of Siskiwit Lake',
                         [-88.779, 48.002, -88.761, 48.0135], 'US'),
    'us-heart-island': ('Heart Island and the St. Lawrence River at Boldt Castle',
                       [-75.9248, 44.3429, -75.9203, 44.3463], 'US'),
    'ca-pelee-lake-henry': ('Lake Henry and Lighthouse Point, Pelee Island',
                            [-82.655, 41.819, -82.626, 41.836], 'CA'),
}


OHN_SHA256 = '502440f66133152fd50620e5467ac243f52675a5135ffe41de9f62fd5182ed3a'
PIXEL_SHA256 = {
    'ca-pelee-lake-henry-2020': 'd8cf55a2e0389022d34c63cdfcc4bd376d3c1da33b79c9b0efb471a1c087e7c1',
    'ca-pelee-lake-henry-2021': 'eabd58ef631f31aa23d5de6c9e71af9dd0dfd68afa115c48a0db2339f2c7efd9',
    'us-heart-island-2020': 'c6ab6e808a7de5076bc43bdc89291206b75cce213375bcc90d4646607f97fda7',
    'us-heart-island-2021': '4e626794bb0cb717f085f882dc90bfbf9100b39ec44b65145210eeb81ddd9e82',
    'us-siskiwit-ryan-2020': 'f9bff2d30790d08a3c0ecce40a4cd86b4a6273566662de2190f0a63910040217',
    'us-siskiwit-ryan-2021': '29d820a306b6d580159ba329fb292372703c4f6e5dcb58f229046fa8ec6f0768',
}


def sat_surface(site, bounds, cache, download):
    west, south, east, north = bounds
    x, y = 3 * floor(west / 3), 3 * floor(south / 3)
    if east >= x + 3 or north >= y + 3:
        raise ValueError(f'WorldCover extract crosses a tile edge: {site}')
    tile = f'N{y:02}W{abs(x):03}'
    arrays, urls = [], []
    previous_grid = None
    for year, edition in [(2020, 'v100'), (2021, 'v200')]:
        name = f'ESA_WorldCover_10m_{year}_{edition}_{tile}_Map.tif'
        url = f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{edition}/{year}/map/{name}'
        urls.append(url)
        key = f'{site}-{year}'
        saved = cache / (key + '.npz')
        if saved.exists():
            with np.load(saved, allow_pickle=False) as local:
                grid, values = tuple(local['grid'].tolist()), local['pixels']
        else:
            local = cache / name
            if not local.exists() and not download:
                raise FileNotFoundError(f'Missing {saved} or {local}; pass --download')
            dataset = gdal.Open(str(local) if local.exists() else '/vsicurl/' + url)
            x0, step, dx, y0, dy, neg = dataset.GetGeoTransform()
            if dataset.GetSpatialRef().GetAuthorityCode(None) != '4326' or dx or dy or step <= 0 or neg >= 0:
                raise ValueError(f'Unexpected WorldCover grid for {url}')
            ix, iy = floor((west - x0) / step), floor((north - y0) / neg)
            width, height = ceil((east - x0) / step) - ix, ceil((south - y0) / neg) - iy
            values = dataset.GetRasterBand(1).ReadAsArray(ix, iy, width, height)
            grid = (x0 + ix * step, step, 0., y0 + iy * neg, 0., neg)
            dataset = None
        digest = sha256(np.asarray(grid, dtype='<f8').tobytes() + values.tobytes()).hexdigest()
        if digest != PIXEL_SHA256[key]:
            raise ValueError(f'Unexpected WorldCover grid or source pixels for {key}')
        if not saved.exists():
            tmp = cache / (key + '.tmp.npz')
            np.savez_compressed(tmp, grid=grid, pixels=values)
            tmp.replace(saved)
        if previous_grid is not None and (grid != previous_grid or arrays[0].shape != values.shape):
            raise ValueError(f'WorldCover yearly grids differ for {site}')
        previous_grid = grid
        arrays.append(values)
    a, b = arrays
    dry_classes = (10, 20, 30, 40, 50, 60)
    return (common.raster_mask(np.isin(a, dry_classes) & np.isin(b, dry_classes), previous_grid),
            common.raster_mask((a == 80) & (b == 80), previous_grid), urls)


def island_holes(surface, frame):
    return [island for p in common.polygons(make_valid(surface)) for ring in p.interiors
            if box(*ring.bounds).intersects(frame) and (island := Polygon(ring)).intersects(frame)]


def us_surfaces(key, frame, cache, download):
    ryan = key == 'us-siskiwit-ryan'
    county = '26083' if ryan else '36045'
    name = f'tl_2025_{county}_areawater.zip'
    url = TIGER_BASE + name
    archive = freshwater.obtain(cache / name, url, shore.CENSUS[county][1], download)
    dataset = ogr.Open('/vsizip/' + str(archive.resolve()))
    layer = dataset.GetLayer()
    transform = shore.wgs_transform(layer)
    layer.SetSpatialFilterRect(*frame.bounds)
    all_water, islands = [], []
    parent = None
    named = Point(*(RYAN if ryan else HEART))
    for feature in layer:
        if feature['MTFCC'] not in ('H2030', 'H2041', 'H2051', 'H3010'):
            continue
        source = make_valid(shore.to_wgs(feature.geometry(), transform))
        all_water.append(source.intersection(frame))
        if ryan and feature['HYDROID'] != '1104702448935':
            continue
        if not ryan and feature['MTFCC'] != 'H3010':
            continue
        for hole in island_holes(source, frame):
            label = ('Ryan Island' if ryan else 'Heart Island') if hole.contains(named) else None
            islands.append((label, hole.intersection(frame)))
    if ryan:
        # Isle Royale encloses the full lake. Its shore reaches some search
        # frames. Keep this parent distinct from each island nested in the lake.
        layer.SetSpatialFilter(None)
        layer.SetAttributeFilter("HYDROID='11033746731269'")
        lake_superior, = layer
        original = shore.to_wgs(lake_superior.geometry(), transform)
        parent, = [h for h in island_holes(original, frame) if h.contains(named)]
    if len([i for label, i in islands if label]) != 1:
        raise ValueError(f'Expected a unique named Census waterbody hole at {named} in {key}')
    water = union_all(all_water)
    if parent is not None:
        # Subtract all enclosed holes in Siskiwit before assigning the parent name.
        islands.append(('Isle Royale', parent.intersection(frame).difference(
            water.union(union_all([p for _, p in islands])))))
    ref = ('https://prd-tnm.s3.amazonaws.com/StagedProducts/Maps/USTopo/PDF/MI/MI_Todd_Harbor_20140812_TM_geo.pdf'
           if ryan else 'https://www.boldtcastle.com/visitorinfo/downloads')
    return islands, water, [url, ref], 'U.S. Census Bureau TIGER/Line 2025 area hydrography.'


def canada_surfaces(frame, cache, download):
    name = freshwater.INVENTORY
    archive = freshwater.obtain(cache / name, freshwater.INVENTORY_URL, shore.ONTARIO_SHA, download)
    inner = '/vsizip/' + str(archive.resolve()) + '/GreatLakes_islands/Great_Lakes_Islands_April2010.zip'
    dataset = ogr.Open('/vsizip/{' + inner + '}/Great_Lakes_Islands_April2010.shp')
    layer = dataset.GetLayer()
    layer.SetSpatialFilterRect(*frame.bounds)
    # This named provincial inventory complex consists of three split features.
    # Small pieces may be detached by open water; never fill the gaps between them.
    island_names = {'Pelee Island - Main', 'Pelee Island - North', 'Pelee Island'}
    transform = shore.wgs_transform(layer)
    pieces = {f['CMPLX_NAME']: make_valid(shore.to_wgs(f.geometry(), transform)).intersection(frame)
              for f in layer if f['COUNTRY'] == 'CAN' and f['ISL_TYPE'] == 'Island'}
    if set(pieces) != island_names:
        raise ValueError('Unexpected Pelee Island inventory components in the review frame')
    outline = union_all(list(pieces.values()))
    erie_id, henry_id = 129677731, 129676135
    # Complete permanent-waterbody query for the padded survey frame, including
    # six smaller unnamed features. Pin each OGF_ID and the actual source bytes.
    hydro_ids = [129676133, 129676134, henry_id, erie_id, 129677732, 129677733, 129677734, 129677736]
    url = freshwater.hydro_request(hydro_ids)
    raw = freshwater.obtain(cache / 'pelee-lighthouse-ohn.geojson', url, OHN_SHA256, download)
    rows = {int(f['properties']['OGF_ID']): f for f in json.loads(raw.read_bytes())['features']}
    if rows.keys() != set(hydro_ids) or any(f['properties']['PERMANENCY'] != 'Permanent'
                                                for f in rows.values()):
        raise ValueError('Expected the eight permanent OHN waterbody records at Lighthouse Point')
    areas = {i: make_valid(shape(r['geometry'])).intersection(frame) for i, r in rows.items()}
    erie = areas.pop(erie_id)
    if erie.is_empty or areas[henry_id].is_empty:
        raise ValueError('Expected both lakes inside the Lighthouse Point review frame')
    # Lake Henry is separately mapped open water within the footprint of Pelee.
    # Only explicit Lake Erie water outside the island inventory is eligible.
    inland = union_all(list(areas.values()))
    shore_land = outline.difference(erie.union(inland))
    water = inland.union(erie.difference(outline))
    return [('Pelee Island', shore_land)], water, [
        freshwater.INVENTORY_URL, url, 'https://www.ontario.ca/page/open-government-licence-ontario',
        'https://files.ontario.ca/environment-and-energy/parks-and-protected-areas/mnr_bpp0338.pdf'
    ], freshwater.ONTARIO_CREDIT


def build(key, site, cache, download):
    label, bounds, code = site
    frame = box(*common.padded(bounds))
    lands, hydro, urls, credit = (canada_surfaces(frame, cache, download) if code == 'CA'
                                  else us_surfaces(key, frame, cache, download))
    dry, wet, raster_urls = sat_surface(key, frame.bounds, cache, download)
    land, owners = [], []
    for name, outline in lands:
        # Never classify a waterbody hole as dry from topology alone. The
        # agreement margin also protects neighboring contradictory source edges.
        interior = freshwater.reviewed_interior(outline.intersection(dry).difference(hydro))
        parts = common.pack(interior, kind='island', **({'name': name} if name else {}))
        land.extend(parts)
        owners.extend(dict(code=code, bbox=p['bbox'], rings=p['rings']) for p in parts)
    water = common.pack(freshwater.reviewed_interior(hydro.intersection(wet)), kind='inland')
    if not land or not water:
        raise ValueError(f'Missing corroborated dry or wet geometry in {key}')
    print(key, len(land), 'land polygons;', len(water), 'water polygons')
    vector = ('Ontario Great Lakes Islands (April 2010) and OHN permanent waterbodies'
              if code == 'CA' else 'TIGER/Line 2025 area hydrography')
    return dict(id=key, name=label, bbox=bounds, source='na-lakes-detail+' + key,
                version=vector + '; ESA WorldCover 2020 v100 and 2021 v200',
                evidenceUrls=urls + raster_urls, attribution=credit + ' ' + common.WC_CREDIT,
                land=land, water=water, owners=owners)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('cache', type=Path)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--download', action='store_true')
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    payload = {'windows': [build(key, site, args.cache, args.download) for key, site in SITES.items()]}
    args.output.write_text(json.dumps(payload, separators=(',', ':'), ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
