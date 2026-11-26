#!/usr/bin/env python3
"""Rebuild six Greater Antilles and Lucayan island extracts using GDAL, NumPy and Shapely 2.

Supply the FieldMaps International USGS/LSIB ADM0 GeoPackage (2025-07-29).
Only the clipped WorldCover/DEM pixels are downloaded using HTTP range requests.
--raster-directory can instead point at complete local copies of the same GeoTIFFs.
"""
import argparse
from importlib import import_module
import json
from math import floor
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
import shapely
from shapely.geometry import Point, box
from shapely.ops import unary_union

common = import_module('build-northern-central-america-review')
read_raster = import_module('build-south-america-andes').read_raster
ROOT = Path(__file__).resolve().parents[1]
FM_SHA = '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'
WC = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com'
DEM = 'https://copernicus-dem-30m.s3.amazonaws.com'
DEM_CREDIT = (' Produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH '
              '2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.')
# Bounds restrict lookup, while the anchors select real source polygons and connected marine water.
SITES = [
    ('lime', 'Lime Cay', 'JM', 'JM', 'CARB', [-76.825,17.914,-76.815,17.9235],
     (-76.81965,17.91845), (-76.82238,17.91660), 'https://www.visitjamaica.com/listing/lime-cay/453/'),
    ('owen', 'Little Cayman', 'KY', 'GB', 'CARB', [-80.081,19.651,-80.055,19.674],
     (-80.07832,19.66818), (-80.067,19.65775), 'https://doe.ky/wp-content/uploads/2021/04/Little_Cayman_Boundary_Maps.pdf'),
    ('ward', 'Warderick Wells Cay', 'BS', 'BS', 'NATL', [-76.624,24.384,-76.616,24.395],
     (-76.62241,24.38809), (-76.61912,24.39184), 'https://bnt.bs/explore/exuma/exuma-cays-land-sea-park/'),
    ('salt', 'Salt Cay', 'TC', 'GB', 'NATL', [-71.211,21.318,-71.195,21.345],
     (-71.20017,21.32939), (-71.20723,21.34247), 'https://tciairports.com/airports/henry-leon-wilson-airport-salt-cay'),
    ('catalina', 'Isla Catalina', 'DO', 'DO', 'CARB', [-69.026,18.362,-69.007,18.382],
     (-69.01204,18.36686), (-69.02207,18.37807), 'https://ambiente.gob.do/app/uploads/2016/10/Monumento-Natural-Isla-Catalina.pdf'),
    ('largo', 'Cayo Largo del Sur', 'CU', 'CU', 'CARB', [-81.553,21.601,-81.537,21.627],
     (-81.545556,21.616111), (-81.54511,21.62580), 'https://www.cuba.travel/destinos/isla-de-la-juventud/como-llegar'),
]
# Digests cover the raw unmodified pixel subsets in the padded footprint.
HASHES = {
    'lime': ('4832d6718a7857c378b24ad51e6571d9347be9b005ad95a0c6d017fffeaa9587',
             'f7dee7a2e004a48f976ef2930ab7e9033ce981361744f9f7547c930e2e3f2981',
             'c2346d2245b31ec9cec9b51224fae05e9223068a740120756707bd41dd3c4c66'),
    'owen': ('6a68ab7c2062511e99ba9ff68a165c0fbc8147cb729f35f6985c9d10040f8f68',
             'cb5617564be7aafac1b4b7f2da26957f11afd24b03fb5b20cf63be2c54539d63',
             '264b37d2b959955f8971a827506795103b27c9dbc4174d665fa779d398c4e5f3'),
    'ward': ('1a435c354d4aa4263d10930a114571cf7b41c8f27aaf727e029040a37c50b119',
             '311598b8429b4961785948ad6d43e56f25a0184876c563702888b4154348e83b'),
    'salt': ('c2ab0e856b4f71ab66681605f906211a7932d30a20de88b572b1705164de57a8',
             '3a2ab16ccdee3ecd4c3b64beee2c2889cb27bfab7574f770ee4e520c4616a698'),
    'catalina': ('ba7619e73fba3bdb4bca9d36deaae1df3340db1d2c45e55d691c0cdf3640f5f6',
                 'fe180eb05da6203e2a1097e8196bc7dcfc5224e5e861e542d19652724691fe48'),
    'largo': ('766514e9ba7267b06aacf792b457462b553baba3a322272f0956f6027ae05d57',
              '1aa548243e61e0d50f8f63d4a96fba8514fd94d440bf2329f3b1993dd12fc336'),
}


def source_footprint(layer, frame, country, sovereign, pin):
    layer.SetAttributeFilter(f"iso_2='{country}'")
    layer.SetSpatialFilterRect(*frame.bounds)
    feature, = layer
    group = {'GB': 'GBR','JM': 'JAM','CU': 'CUB','BS': 'BHS','DO': 'DOM'}[sovereign]
    if feature['iso_3_grp'] != group:
        raise ValueError(f'{country}: unexpected sovereign in pinned source')
    full = shapely.make_valid(shapely.from_wkb(bytes(feature.geometry().ExportToWkb())))
    named, = [p for p in common.polygons(full) if p.contains(Point(pin))]
    return full.intersection(frame), named.intersection(frame)


def compact(geometry, margin=0.000035):
    # Keep simplification inside its confirmed source footprint. Leave a small unassigned shore margin.
    edges = geometry.buffer(-margin, join_style='mitre')
    return edges.simplify(0.000027).intersection(geometry)


def annual_masks(key, bounds, directory):
    w,s,e,n = bounds
    tx,ty = 3*floor(w/3),3*floor(s/3)
    if e>=tx+3 or n>=ty+3:
        raise ValueError('WorldCover tile boundary in survey')
    tile = f'N{ty:02}W{abs(tx):03}'
    urls = [f'{WC}/{v}/{y}/map/ESA_WorldCover_10m_{y}_{v}_{tile}_Map.tif'
            for y,v in [(2020,'v100'),(2021,'v200')]]
    (a, ga), (b, gb) = [read_raster(url,bounds,digest,directory) for url,digest in zip(urls,HASHES[key][:2],strict=True)]
    if ga != gb or a.shape != b.shape:
        raise ValueError('Annual raster grids differ')
    eligible = [10,20,30,40,50,60]  # vegetation, crops, built or bare solid ground
    da, db = np.isin(a,eligible), np.isin(b,eligible)
    return da,db,common.raster_mask((a==80)&(b==80),ga),ga,urls


def window(site, layer, directory):
    key,name,code,sovereign,basin,bounds,anchor,sea_pin,reference = site
    extent = common.padded(bounds)
    frame = box(*extent)
    outline,named = source_footprint(layer,frame,code,sovereign,anchor)
    da,db,wet,grid,urls = annual_masks(key,extent,directory)
    dry = common.raster_mask(da&db,grid)
    outlines = [(name,named)]
    version = 'ESA WorldCover 2020 v100 and 2021 v200; FieldMaps USGS/LSIB 2025-07-29'
    credit = common.WC_CREDIT+' '+common.FM_CREDIT
    if len(HASHES[key])==3:
        tile = f'Copernicus_DSM_COG_10_N{floor(extent[1]):02}_00_W{abs(floor(extent[0])):03}_00_DEM'
        url = f'{DEM}/{tile}/{tile}.tif'
        heights,hg = read_raster(url,extent,HASHES[key][2],directory)
        raised = common.raster_mask(np.isfinite(heights)&(heights>=2),hg)
        exposed = common.raster_mask(np.isfinite(heights)&(heights>=1),hg)
        wet = wet.difference(exposed)
        urls.append(url)
        version += '; Copernicus DEM GLO-30'
        credit += DEM_CREDIT
        if key=='lime':
            # The two 10 m products disagree on this low cay. A dry observation,
            # independent raised ground and the named outline together corroborate its interior.
            dry = dry.union(common.raster_mask(da|db,grid).intersection(raised))
        else:
            # The USGS edition omits Owen Island. On the government map in South Hole
            # Sound, the named islet is a separate raised component. Certify its dry core
            # only where both optical editions and GLO-30 agree; keep its low tidal apron open.
            owen, = [p for p in common.polygons(exposed) if p.contains(Point(-80.062907,19.664094))]
            if owen.intersects(outline) or owen.intersects(frame.boundary):
                raise ValueError('Owen Island not isolated from Little Cayman')
            outlines.append(('Owen Island',owen.intersection(raised)))
            # Four native DEM pixels cover the low shoreline in the Cayman Lands & Survey coast check.
            wet = wet.difference(owen.buffer(4*hg[1]))
            urls.append('https://adapter1.caymanlandinfo.ky/wahost/rest/services/Navigation_FreeViewer/MapServer/17')
    land,owners = [],[]
    for label, geometry in outlines:
        # Along Little Cayman the older generalized shore and the independent local
        # chart differ within roughly one further WorldCover pixel.
        margin = 0.00014 if key == 'owen' and label == 'Little Cayman' else 0.000035
        inside = compact(dry.intersection(geometry).intersection(frame), margin)
        if inside.is_empty:
            raise ValueError(f'No confirmed land for {label}')
        land.extend(common.pack(inside,kind='island',name=label))
        owners.extend(common.pack(inside,code=code,sovereignCode=sovereign))
    # The open-sea witness selects the connected ocean, excluding inland salt pans and ponds.
    marine, = [p for p in common.polygons(wet.difference(outline)) if p.contains(Point(sea_pin))]
    water = common.pack(compact(marine.intersection(frame)),kind='ocean')
    return dict(id='antilles-'+key,name='Little Cayman / Owen Island' if key=='owen' else name,
                bbox=bounds,source='antilles-island-review+'+key,version=version,attribution=credit,
                evidenceUrls=[reference,common.FM_URL,common.WC_URL,*urls],oceanRegion=basin,
                land=land,water=water,owners=owners)


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('--fieldmaps-gpkg',type=Path,required=True)
    args.add_argument('--raster-directory',type=Path)
    args.add_argument('--output',type=Path,default=ROOT/'src/data/greaterAntillesIslandsReviewed.json')
    p = args.parse_args()
    ogr.UseExceptions()
    gdal.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN','EMPTY_DIR')
    common.check(p.fieldmaps_gpkg,FM_SHA)
    ds = ogr.Open(str(p.fieldmaps_gpkg))
    windows = [window(site,ds.GetLayerByName('adm0_polygons'),p.raster_directory) for site in SITES]
    p.output.write_text(json.dumps({'windows':windows},ensure_ascii=False,separators=(',',':'))+'\n')


if __name__=='__main__':
    main()
