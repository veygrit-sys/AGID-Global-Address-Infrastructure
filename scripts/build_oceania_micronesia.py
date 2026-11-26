#!/usr/bin/env python3
"""Build the Majuro, Lelu and Eil Malk shore extracts from pinned local surveys.

Python 3.11+, GDAL, NumPy and Shapely 2. Supply a cache directory and
--download for first use. Subsequent offline builds check every source again.
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

geo = import_module('build-northern-central-america-review')
sat = import_module('build_canada_pacific_reviewed')
census = import_module('build-us-canada-shorelines')
core = import_module('build_caribbean_territorial_islands').core
andes = import_module('build-south-america-andes')
ROOT = Path(__file__).resolve().parents[1]
PAC = 'https://geo.pacioos.hawaii.edu/geoserver/PACIOOS/'
META = 'https://www.pacioos.hawaii.edu/metadata/'
NOAA = 'https://cdn.coastalscience.noaa.gov/datasets/e102/data/'
JRC = 'https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/occurrence_130E_10Nv1_4_2021.tif'
JRC_SHA = 'c7317c48f02197b63892140ac3cde6d7dde80f27ed8b7ac61a035e5b1cc3c79c'
SITES = {
    'ejit': ('Ejit and neighbouring islets, Majuro Atoll', 'MH', [171.344,7.118,171.357,7.132],
             'e1f04082d38b0f4510e1e7f7e49d98d2b974eadd2625f30276964b8f7ad2cf29',
             '07d841db758c1586ec9edda037640f3eab47410a5f2c08f8747e8bbc6211e879'),
    'lelu': ('Lelu Island and Lelu Harbour, Kosrae', 'FM', [163.025,5.327,163.04,5.343],
             '487e861e6fa654a6de0257a5778368e78885d3877ec66105cf89c98ba3db7397',
             '89020d9aa9f9acdb2fcfd6f998dcbe5bce27b04751cb3b912b13e396970c1516'),
    'jellyfish': ('Jellyfish Lake and Eil Malk, Palau', 'PW', [134.37,7.155,134.383,7.169],
                  '72ad24abadf5fa9cdc5229cf1071df4ca4fae49611bbfcbcc3f1847a7665e081',
                  '30d7fcd215a87a780cc998e02076ade43432e96a2940697b877425ab7ebab3b4'),
}
WFSETS = {
    'majuro-target': ('mh_mgd_all_conservtarg_reefs', [18,156,640,641,642,643,644,645,1476,1572],
                      '9261f77cde65144278938a3e9e8d0f6f48dcf68b92c9b07e7917a7cab78b72c0'),
    'lelu-shore': ('fm_spcusgs_all_shoreline', [3],
                   'cc573b7870b5eecb0d48abe963a355f2b837e94c4783ca26f3bda26676cffc0c'),
    'lelu-marine': ('fm_ej_all_conservtarg_reefveg', [292,293,296,297,298,299],
                    '876bde1ff83ffe11be30b59f2cb10c8d3be145c012d868cc38c7c63117f8005e'),
}
SHAPES = {
    'Palau_Shoreline.zip': 'cc40cee8a4d2ef2e24916fad109df3d6d85d3ce3a284008af7a28bc1ef94443c',
    'Palau_BenthicHabitat_Map.zip': 'edb8912c57aaea9ba5e2462e49e4186ca536536a4b19bff70f38c37996ab34cc',
}


def cache_source(path, url, digest, download, wfs=False):
    if not path.exists():
        if not download:
            raise FileNotFoundError(f'{path} missing; use --download')
        with urlopen(url, timeout=120) as response:
            data = response.read()
        if wfs:
            # Exclude the per-request WFS timestamp. Pin complete feature
            # identities, attributes, vertices and ring order.
            features = sorted(json.loads(data)['features'], key=lambda r: r['id'])
            data = json.dumps(features, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()
        if sha256(data).hexdigest() != digest:
            raise ValueError(f'Source edition changed: {url}')
        with NamedTemporaryFile(dir=path.parent, delete=False) as f:
            f.write(data)
            temp = Path(f.name)
        temp.replace(path)
    geo.check(path, digest)


def features(key, frame, directory, download):
    layer, ids, digest = WFSETS[key]
    query = urlencode(dict(service='WFS', version='1.0.0', request='GetFeature', typeName='PACIOOS:'+layer,
                           outputFormat='application/json', srsName='EPSG:4326',
                           featureID=','.join(f'{layer}.{n}' for n in ids)))
    url = PAC + layer + '/ows?' + query
    path = directory / (key+'.geojson')
    cache_source(path, url, digest, download, wfs=True)
    return [(r['properties'], make_valid(shape(r['geometry'])).intersection(frame)) for r in json.loads(path.read_bytes())]


def palau_rows(filename, frame, directory, download):
    path = directory / filename
    cache_source(path, NOAA+filename, SHAPES[filename], download)
    ds = ogr.Open('/vsizip/'+str(path.resolve()))
    layer = ds.GetLayer()
    transform = census.wgs_transform(layer)
    layer.SetSpatialFilterRect(*transform.GetInverse().TransformBounds(*frame.bounds, 21))
    for f in layer:
        yield f.items(), make_valid(census.to_wgs(f.geometry(), transform))


def palau_lake(frame, coast, wet, directory, download):
    # The old shoreline fills this marine lake. SPREP's survey places it
    # inside Eil Malk. Retain only its fully enclosed permanent-water component.
    site = Point(134 + 22.570/60, 7 + 9.657/60)
    old = directory / 'jellyfish-jrc.npz'
    if old.exists():
        with np.load(old, allow_pickle=False) as cached:
            arr, grid = cached['pixels'], tuple(cached['grid'])
    else:
        if not download:
            raise FileNotFoundError(f'{old} missing; use --download')
        arr, grid = andes.read_raster(JRC, frame.bounds, JRC_SHA, None)
    if sha256(np.array(grid, dtype='<f8').tobytes()+arr.tobytes()).hexdigest() != '018c7a3423e1f90c82e1eb8ec88f0651aae22ff6ff2f2a8e88cdb7f39aca8284':
        raise ValueError('Jellyfish Lake occurrence grid or native pixels changed')
    if not old.exists():
        with NamedTemporaryFile(dir=directory, delete=False) as f:
            np.savez_compressed(f, grid=grid, pixels=arr)
            temp = Path(f.name)
        temp.replace(old)
    persistent = geo.raster_mask((arr >= 90) & (arr <= 100), grid)
    lake, = [p for p in geo.polygons(wet.intersection(persistent)) if p.contains(site)]
    if not coast.contains(lake) or not frame.contains(lake):
        raise ValueError('Lake connected to unreviewed water or the sea')
    return lake


def window(key, directory, download):
    name, code, bounds, *pins = SITES[key]
    frame = box(*geo.padded(bounds))
    images, urls = [], []
    for (year, edition), digest in zip([(2020,'v100'), (2021,'v200')], pins, strict=True):
        if not download and not (directory/f'{key}-{year}.npy').exists():
            raise FileNotFoundError(f'{key}/{year} missing; use --download')
        arr, gt, url = sat.pixels(key, frame, year, edition, digest, directory)
        if images and gt != grid:
            raise ValueError(f'{key}: WorldCover grids differ')
        images.append(arr)
        urls.append(url)
        grid = gt
    a, b = images
    dry_classes = (10,20,30,40,50,60)
    dry = geo.raster_mask(np.isin(a,dry_classes) & np.isin(b,dry_classes), grid)
    wet = geo.raster_mask((a == 80) & (b == 80), grid)
    lake, coast, water = None, [], []
    credit = geo.WC_CREDIT
    if key == 'ejit':
        layer = WFSETS['majuro-target'][0]
        urls.append(META+layer+'.html')
        rows = features('majuro-target', frame, directory, download)
        coast = [(r['BryanName'],p) for r,p in rows if r['target']=='Land']
        reef = union_all([p for r,p in rows if r['target']=='Reefflat'])
        water = [p.difference(reef) for r,p in rows if r['target'] in ('Lagoon','InnerSlope','Forereef')]
        version = 'PacIOOS Marshall Islands reef conservation targets 2017'
        credit += ' USAID, Conservation Targets (Reefs) - Marshall Islands, distributed by PacIOOS.'
    elif key == 'lelu':
        (_, shore), = features('lelu-shore', frame, directory, download)
        land = dry.intersection(shore)
        # The causeway connects Lelu to Kosrae in the vector survey. Attach
        # the name only to the local dry component containing the island anchor.
        anchor = Point(163.0287,5.3333)
        coast = [('Lelu' if p.contains(anchor) else None, p) for p in geo.polygons(land)]
        if sum(label is not None for label,_ in coast) != 1:
            raise ValueError('Lelu anchor does not select exactly one dry component')
        rows = features('lelu-marine', frame, directory, download)
        reef = union_all([p for r,p in rows if 'reef flat' in r['class']])
        water = [p.difference(shore).difference(reef) for r,p in rows if r['class'] in
                 ('Island lagoon - deep lagoon','Ocean exposed fringing - forereef','Ocean exposed fringing - pass','Shelf')]
        version = 'PacIOOS FSM shoreline and Reef Conservation Target Areas, 2016'
        credit += (' SPC GEM and USGS, FSM shoreline; Conservation Society of Pohnpei, Reef Conservation '
                   'Target Areas. Both distributed by PacIOOS.')
        urls.extend([META+WFSETS[k][0]+'.html' for k in ['lelu-shore','lelu-marine']])
        urls.append('https://pubs.usgs.gov/of/1985/0418/report.pdf')
    else:
        rows = list(palau_rows('Palau_Shoreline.zip',frame,directory,download))
        main, = [p for r,p in rows if r['POLYGONID']==2893]
        coast = [('Eil Malk' if r['POLYGONID']==2893 else None,p.intersection(frame)) for r,p in rows]
        lake = palau_lake(frame, main, wet, directory, download)
        habitats = palau_rows('Palau_BenthicHabitat_Map.zip',frame,directory,download)
        water = [p.intersection(frame) for r,p in habitats if r['ZONE']=='Lagoon' and r['D_STRUCT']=='Sand']
        version = 'NOAA NCCOS Palau shoreline and benthic habitats 2007; EC JRC Global Surface Water v1.4'
        credit = andes.RASTER_CREDIT + ' NOAA National Centers for Coastal Ocean Science, Palau shallow-water habitat maps.'
        urls.extend([NOAA+f for f in SHAPES] + [
            JRC, 'https://www.sprep.org/attachments/Publications/BEM/Directory_Wetlands_Palau_2014.pdf',
            'https://www.marineregions.org/gazetteer.php?p=details&id=1908',
        ])
    land, owners = [], []
    for label,p in coast:
        g = core(p.intersection(dry).intersection(frame))
        land.extend(geo.pack(g, kind='island', **({'name':label} if label else {})))
        owners.extend(geo.pack(g, code=code))
    sea = core(union_all(water).intersection(wet).difference(union_all([p for _,p in coast])))
    waters = geo.pack(sea, kind='ocean')
    if lake is not None:
        waters.extend(geo.pack(core(lake), kind='inland'))
    if not land or sea.is_empty:
        raise ValueError(f'{key}: missing confirmed land or sea')
    return dict(id='micronesia-'+key, name=name, bbox=bounds, source='micronesia-survey+'+key,
                version=version+'; ESA WorldCover 2020 v100 and 2021 v200', attribution=credit,
                evidenceUrls=urls, oceanRegion='NPAC', land=land, owners=owners, water=waters)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--output', type=Path, default=ROOT/'src/data/oceaniaMicronesiaPolygonDetail.json')
    args = parser.parse_args()
    args.source_directory.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN','EMPTY_DIR')
    gdal.SetConfigOption('GDAL_HTTP_MAX_RETRY','3')
    result = {'windows': [window(k, args.source_directory, args.download) for k in SITES]}
    with NamedTemporaryFile('w', dir=args.output.parent, delete=False, encoding='utf-8') as out:
        json.dump(result, out, ensure_ascii=False, separators=(',', ':'))
        out.write('\n')
        tmp = Path(out.name)
    tmp.replace(args.output)


if __name__ == '__main__':
    main()
