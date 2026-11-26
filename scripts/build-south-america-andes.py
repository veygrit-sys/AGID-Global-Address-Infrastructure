#!/usr/bin/env python3
"""Build seven Andean survey windows from pinned vector and raster sources.
Python 3.11+, GDAL, NumPy, Shapely 2. Raster access uses HTTP range requests;
--raster-directory selects local unmodified COGs with the published filenames.
"""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import floor, ceil
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
import shapely
from shapely.geometry import Point, box
from shapely.ops import unary_union

# The existing builder supplies the same edition checks and GeoJSON serialization.
base = import_module('build-northern-central-america-review')
ROOT = Path(__file__).resolve().parents[1]
JRC = 'https://global-surface-water.appspot.com/'
RASTER_CREDIT = (base.WC_CREDIT + ' EC JRC Global Surface Water v1.4, 1984–2021 '
                 '(Pekel et al., Nature 2016); modified occurrence data.')

# Sampling extends beyond each public review extent. San Miguel and Desaguadero
# include portions of river away from the international bridges. Public coverage
# never includes the artificial cut edges of a physical or political polygon.
WINDOWS = [
    dict(id='san-miguel-river', name='Río San Miguel', key='san-miguel',
         bounds=[-76.872, .240, -76.865, .255], sample=[-76.880,.239,-76.865,.255],
         anchors={'EC': (-76.870,.244), 'CO': (-76.869,.253)},
         url='https://valledelguamuez-putumayo.gov.co/MiMunicipio/Paginas/Vias-de-Comunicacion.aspx'),
    dict(id='macara-la-tina', name='Macará / La Tina', key='macara',
         bounds=[-79.970,-4.397,-79.958,-4.389], sample=[-79.971,-4.398,-79.957,-4.388],
         anchors={'EC': (-79.9605,-4.3905), 'PE': (-79.9685,-4.3955)},
         url='https://www.obraspublicas.gob.ec/wp-content/uploads/downloads/2017/01/LOTAIP_1_175200000.0000.377304-TDRS-PUENTE-MACARA.pdf'),
    dict(id='desaguadero-river', name='Río Desaguadero', key='desaguadero',
         bounds=[-69.043,-16.584,-69.030,-16.582], sample=[-69.043,-16.584,-69.030,-16.575],
         anchors={'PE': (-69.0417,-16.5835), 'BO': (-69.031,-16.5835)},
         url='https://escritorio.abc.gob.bo/certificacion/docs/2015/09/08/GNT-SCV-1-177/JUSTIFICACION%20PTE%20DESAGUADERO%20PARA%20CERTIFICACION.pdf'),
    dict(id='taquile', name='Isla Taquile / Lago Titicaca', key='taquile',
         bounds=[-69.712,-15.775,-69.685,-15.759], codes=['PE'],
         islands=[(187923, 'Taquile', (-69.6885,-15.767))],
         url='https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=959'),
    dict(id='isla-del-sol', name='Isla del Sol / Lago Titicaca', key='isla-sol',
         bounds=[-69.161,-16.044,-69.139,-16.026], codes=['BO'],
         islands=[(187553, 'Isla del Sol', (-69.153,-16.032))],
         url='https://www.turismo.produccion.gob.bo/?p=11455'),
    dict(id='zapaleri', name='Cerro Zapaleri', key='zapaleri',
         bounds=[-67.191,-22.823,-67.170,-22.803],
         anchors={'AR': (-67.174,-22.813), 'BO': (-67.185,-22.807), 'CL': (-67.185,-22.820)},
         tripoint=(-67.1807,-22.813797),
         url='https://www.argentina.gob.ar/normativa/nacional/norma-202355/texto'),
    dict(id='itabaca', name='Canal de Itabaca / Galápagos', key='itabaca',
         bounds=[-90.294,-.496,-90.273,-.475], codes=['EC'], oceanRegion='SEPC',
         islands=[(318,'Santa Cruz',(-90.284,-.494)),(3210,'Baltra',(-90.274,-.476))],
         url='https://galapagos.gob.ec/informacion-de-interes-para-la-llegada-a-las-islas/',
         extra=['https://www.galapagos.gob.ec/wp-content/uploads/downloads/2019/11/000081.pdf']),
]
DIGESTS = {
    'san-miguel': (
        'f5b77ed7f10642b7bf66d03cd9deca1ae3e39497d95524de9f2055ee3ce0ec86',
        '09873669f46d6dcd8f9137696afcb73662daa01e0f74dbb03ca256428b09dbcd',
        'fff31efa4a8022ad75385d6633b7a1c2fbdca7e4a0065b202fcaeb69c29d6aaa',
    ),
    'macara': (
        '8fb2891e49a4ea8067eb9811b00809940cea6fa28f7fdb1db93713d9c59c9d2c',
        '8339c53a37ae320e095cfd208b4111fbff7d05d582245cee7911b2d71518cd0b',
        '1d7f1cedd289f5f06344ab4812b1ab03a9688b562d66684adb97ef101f116372',
    ),
    'desaguadero': (
        '9c3c08421e41026053baa10fc54d96d6c112d53a88a274ddf2891af21acf08b8',
        'd51f55f99aea433fdab218d96b85cdf4468bad9af0ec59aab725694b067d35c9',
        '527f86db16956aa986952949f72bc3166d95c846097a34c27552de9f5dbb508c',
    ),
    'taquile': (
        '7f5231d0f086a2e9d302df7a025494f82b565c7f62432da5bd97250989c7ce82',
        'd3053206e88ac281e620ee7448847bde6c258c9575d70b8b7f99b5c84f85ec26',
        '2e4170a68f7574ca04797960816ef425489c4b32d69990a31269dbf1f3f90998',
    ),
    'isla-sol': (
        '5a7ac6ed55fed589a42d40fd71adb0562555398657c25da6610c48196f0afbd9',
        'f55f5f03cf28b88628ca6fbca3da4f7513c55eab058d910f93a00d934b8851b9',
        'cf8717c713da53b847ca91e500b533dc09851b9951b364e001814e8ae34c830a',
    ),
    'zapaleri': (
        '74372ba5da781e7c331f07add3c598ae53d5ed87910c6e1958efa635d90f7544',
        '6645b8a5c92d80dbe9ad30c7b539aa544dd7695a56de962ddd806a1f702ebf06',
        '48aa7ebd32118b32ffd13b64cb520960d5a0ff6020562f4f9c3ccbbf833beef4',
    ),
    'itabaca': (
        '8c8cb73518b28dd5f224b24dce580f92524f4e8045ed0df4d013d7a56a0f2702',
        '0b056af67c057399aebf702ce99643e1f58dcb617d7d90ac563905154dafb50a',
        '8c213889ddbba2972c6fe7fc3dc0029d75c4b85409c288e6ce4edeff6192da6e',
    ),
}


def read_raster(url, bounds, digest, directory):
    ds = gdal.Open(str(directory / url.rsplit('/', 1)[1]) if directory else '/vsicurl/' + url)
    x0, step, dx, y0, dy, neg = ds.GetGeoTransform()
    if ds.GetSpatialRef().GetAuthorityCode(None) != '4326' or dx or dy or step <= 0 or neg >= 0:
        raise ValueError(f'Unexpected raster grid {url}')
    w, s, e, n = bounds
    ix, iy = floor((w-x0)/step), floor((n-y0)/neg)
    width, height = ceil((e-x0)/step)-ix, ceil((s-y0)/neg)-iy
    values = ds.GetRasterBand(1).ReadAsArray(ix, iy, width, height)
    if sha256(values.tobytes()).hexdigest() != digest:
        raise ValueError(f'Unexpected raster bytes {url}')
    return values, (x0+ix*step,step,0,y0+iy*neg,0,neg)


def surfaces(w, directory):
    bounds = base.padded(w.get('sample', w['bounds']))
    west, south, east, north = bounds
    x, y = 3 * floor(west/3), 3 * floor(south/3)
    if east >= x + 3 or north >= y + 3:
        raise ValueError('Survey would span more than one WorldCover tile')
    tile = ('S' if y < 0 else 'N') + f'{abs(y):02}W{abs(x):03}'
    sx, ny = 10*floor(west/10), 10*ceil(north/10)
    occurrence = f'occurrence_{abs(sx)}W_{abs(ny)}' + ('S' if ny<0 else 'N') + 'v1_4_2021.tif'
    urls = [f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{v}/{year}/map/ESA_WorldCover_10m_{year}_{v}_{tile}_Map.tif'
            for v, year in [('v100', 2020), ('v200', 2021)]]
    urls.append('https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/' + occurrence)
    (a, gt), (b, gt2), (occ, jgt) = [
        read_raster(url, bounds, digest, directory)
        for url, digest in zip(urls, DIGESTS[w['key']], strict=True)]
    if gt != gt2 or a.shape != b.shape:
        raise ValueError('Annual land-cover grids differ')
    dry = base.raster_mask(np.isin(a, [10,20,30,40,50,60]) & np.isin(b, [10,20,30,40,50,60]), gt)
    dry = dry.difference(base.raster_mask((occ > 0) & (occ <= 100), jgt))
    water = base.raster_mask((a == 80) & (b == 80), gt)
    # JRC's occurrence layer covers inland waters; the ocean is confirmed
    # separately by both cartographic coastlines rather than a missing JRC pixel.
    if not w.get('oceanRegion'):
        water = water.intersection(base.raster_mask((occ >= 75) & (occ <= 100), jgt))
    return dry, water, urls, gt[1]


def mainland(w, dry, country, pixel):
    # A river reach may have seasonal bars or a bridge joining two apparent
    # banks in a coarse classification. Retain interior pixels only when the
    # two independently located bank controls occupy disjoint dry components.
    anchors = w['anchors']
    riverside = 'tripoint' not in w
    for margin in range(1, 12):
        pieces = base.polygons(dry.buffer(-margin*pixel, join_style='mitre'))
        selected = {c: next((p for p in pieces if p.contains(Point(pin))), None)
                    for c, pin in anchors.items()}
        if any(piece is None for piece in selected.values()):
            break
        if not riverside or len(set(selected.values())) == len(selected):
            for code, pin in anchors.items():
                if not country[code].contains(Point(pin)):
                    raise ValueError(f'Country control outside {code}: {w["id"]}')
            land = unary_union(list(selected.values()))
            owners = {c: country[c].intersection(p) for c,p in selected.items()}
            if w.get('tripoint') and not all(p.covers(Point(w['tripoint'])) for p in owners.values()):
                raise ValueError('Country polygons do not meet on the reviewed dry tripoint')
            return [(land, {'kind':'mainland'})], owners
    raise ValueError(f'Could not independently verify mainland components {w["id"]}')


def lake_or_coast(w, dry, wet, country, frame, archive, pixel):
    level = 1 if w.get('oceanRegion') else 3
    dataset = ogr.Open(f'/vsizip/{archive.resolve()}/GSHHS_shp/f/GSHHS_f_L{level}.shp')
    layer = dataset.GetLayer()
    layer.SetSpatialFilterRect(*frame.bounds)
    full = {}
    for feature in layer:
        feature_id = int(feature['id'].split('-')[0])
        geometry = shapely.from_wkb(bytes(feature.geometry().ExportToWkb()))
        full[feature_id] = geometry.intersection(frame)
    code, = w['codes']
    accepted = []
    for gid, name, seed in w['islands']:
        shape = full[gid].intersection(dry.buffer(-pixel,join_style='mitre')).intersection(country[code])
        inside, = [p for p in base.polygons(shape) if p.contains(Point(seed))]
        accepted.append((inside, {'kind':'island','name':name}))
    water = wet.difference(unary_union(list(full.values())))
    if level == 1:
        water = water.difference(country[code])
    else:
        dataset = ogr.Open(f'/vsizip/{archive.resolve()}/GSHHS_shp/f/GSHHS_f_L2.shp')
        layer = dataset.GetLayer()
        layer.SetSpatialFilterRect(*frame.bounds)
        lake, = [shapely.from_wkb(bytes(f.geometry().ExportToWkb())) for f in layer if f['id']=='180526']
        water = water.intersection(lake)
    return accepted, {code: unary_union([p for p,_ in accepted])}, water


def build(w, fieldmaps, archive, directory):
    frame = box(*base.padded(w['bounds']))
    countries = base.owners_in_window(fieldmaps, frame.bounds)
    if countries.keys() != set(w.get('codes') or w['anchors']):
        raise ValueError(f'Unexpected country list: {w["id"]}')
    dry, water, urls, pixel = surfaces(w, directory)
    version = 'ESA WorldCover 2020 v100 + 2021 v200; JRC GSW v1.4; FieldMaps USGS/LSIB 2025-07-29'
    credit = RASTER_CREDIT + ' ' + base.FM_CREDIT
    if w.get('islands'):
        land, owners, water = lake_or_coast(w, dry, water, countries, frame, archive, pixel)
        urls.append(base.GSHHG_URL)
        version += '; GSHHG 2.3.7'
        credit += ' GSHHG © Paul Wessel and Walter H. F. Smith, LGPL-3.0-or-later.'
    else:
        land, owners = mainland(w, dry, countries, pixel)
    land = [(p.intersection(frame), tags) for p,tags in land]
    wet = water.intersection(frame)
    if any(p.intersection(wet).area > 1e-14 for p,_ in land):
        raise ValueError('Physical land overlaps water')
    return dict(id=w['id'], name=w['name'], bbox=w['bounds'], source='south-america-review+'+w['id'],
                attribution=credit, version=version, evidenceUrls=[base.WC_URL,JRC,base.FM_URL,w['url'],*w.get('extra',[]),*urls],
                **({'oceanRegion':w['oceanRegion']} if w.get('oceanRegion') else {}),
                land=[r for p, tags in land for r in base.pack(p,**tags)],
                water=base.pack(wet,kind='ocean' if w.get('oceanRegion') else 'inland'),
                owners=[r for c,p in sorted(owners.items()) for r in base.pack(p.intersection(frame),code=c)])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fieldmaps-gpkg', type=Path, required=True)
    parser.add_argument('--gshhg-archive', type=Path, required=True)
    parser.add_argument('--raster-directory', type=Path)
    parser.add_argument('--output',type=Path,default=ROOT/'src/data/southAmericaAndesReviewed.json')
    args = parser.parse_args()
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    base.check(args.fieldmaps_gpkg, base.FM_SHA)
    base.check(args.gshhg_archive, base.GSHHG_SHA)
    dataset = ogr.Open(str(args.fieldmaps_gpkg))
    windows = [build(w, dataset, args.gshhg_archive, args.raster_directory) for w in WINDOWS]
    args.output.write_text(json.dumps({'windows': windows}, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__=='__main__':
    main()
