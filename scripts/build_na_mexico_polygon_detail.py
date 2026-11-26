#!/usr/bin/env python3
"""Rebuild Mexican coast and island polygons (GDAL, NumPy and Shapely 2).

Use --input-directory for cached INEGI responses and --worldcover-directory
for local COGs. Otherwise only the required raster blocks are fetched.
"""
import argparse
from hashlib import sha256
import json
from math import ceil, floor
from pathlib import Path
from types import SimpleNamespace
from urllib.request import urlopen
import runpy

import numpy as np
from osgeo import gdal
from shapely.geometry import Point, box, shape
from shapely.ops import unary_union

HERE = Path(__file__).resolve().parent
geo = SimpleNamespace(**runpy.run_path(str(HERE / 'build-northern-central-america-review.py')))
INEGI = 'https://gaia.inegi.org.mx/wscatgeo/v2/geo/'
CATALOG = 'https://snieg.inegi.org.mx/Documentos/IIN/Acuerdo_14_III_2022/catal_insular_terri_mexicano.pdf'
PARK = 'https://conanp.gob.mx/conanp/dominios/islasgc/archivos/LIBROESPIRITU.pdf'
ESTUARY = 'https://conanp.gob.mx/conanp/dominios/ramsar/docs/sitios/lineamientos_instrumentos/ESTERO_PUNTA_BANDA.pdf'
LAGOONS = 'https://dsiappsdev.semarnat.gob.mx/inai/F69/2024/143/3T/23MP00740824_MIA.pdf'
SOURCES = {
    'baja': ('mgem/03/003', '03003', 'af35299bd45bf17dd97e590460fecd3fddc20f6aa0638b450bb25597addd550a'),
    'bc': ('mgee/02', '02', 'e4e160e58d6c5faf499d725ae60994348655df40245f3222a02cbfe0b5c17c36'),
    'qroo': ('mgee/23', '23', '04a3ef7268c15574363d1331b4a8b6fffacdf17d12075af0f5179f2ceb7c2473'),
}
WINDOWS = [
    dict(id='mx-isla-ballena', name='Isla Ballena, western Espíritu Santo archipelago',
         bbox=[-110.412, 24.477, -110.392, 24.49], area='baja', sea='CALI',
         islands=[('Isla Ballena', -110.40348, 24.48328)],
         evidence=[CATALOG, PARK]),
    dict(id='mx-gallo-gallina', name='Islas Gallo and Gallina',
         bbox=[-110.391, 24.454, -110.378, 24.47], area='baja', sea='CALI',
         islands=[('Isla Gallo', -110.38536, 24.46616), ('Isla Gallina', -110.38396, 24.45724)], evidence=[CATALOG, PARK]),
    dict(id='mx-punta-banda', name='Estero de Punta Banda mouth and barrier spit',
         bbox=[-116.633, 31.762, -116.605, 31.781], area='bc', sea='NEPC',
         mainland=(-116.61, 31.78), evidence=[ESTUARY]),
    dict(id='mx-isla-mujeres-lagoons', name='Isla Mujeres, Laguna Makax and Salina Grande',
         bbox=[-86.744, 21.221, -86.722, 21.24], area='qroo', sea='CARB',
         islands=[('Isla Mujeres', -86.73283, 21.23332)],
         lagoons=[('ocean', -86.7357, 21.2304), ('inland', -86.72972, 21.22866)],
         evidence=[CATALOG, LAGOONS, 'https://www.geonames.org/12486332/',
                   'https://www.geonames.org/12486331/']),
]
PIXEL_SHA = {
    "mx-isla-ballena": [
        "b859f4abc32b13fde2a581001035b5f0b10c53df4ffba1df5a6b1f4d6f2c6eea",
        "d5db2d7a7ba15b24aa15fab3f9ad1dcb99e6e5d46eb01cbf64f22440ba564e48"
    ],
    "mx-gallo-gallina": [
        "db75ab2667d90c187b58526ded799fc426c094a142d5159160713d8a2fe5a269",
        "345e62a240a2c6f48231d4519d37a419f4e3aa56c121fc96b01d09ade4f59f2c"
    ],
    "mx-punta-banda": [
        "b2ea494e3d25c7963bacc0dc5167cde57e79742332ad08cbd019ba670932d209",
        "e02d5489864ada9670501cbd3289bff61ba43ee34ecf76fec90d17250c21b0db"
    ],
    "mx-isla-mujeres-lagoons": [
        "59dd87585a55d5484bc557db06ec4415c19e5da1d766be2e24e91d606aec9bba",
        "70f3dc6cb68e86f9e2895e731298b43955d42e44668dae10d170735f25e901bf"
    ]
}


def official(area, directory):
    path, code, digest = SOURCES[area]
    cache = directory / area if directory else None
    if cache and cache.exists():
        data = cache.read_bytes()
    else:
        with urlopen(INEGI + path, timeout=120) as response:
            data = response.read()
    doc = json.loads(data)
    feature, = doc['features']
    if feature['properties']['cvegeo'] != code:
        raise ValueError(f'Unexpected administrative unit: {code}')
    geom = feature['geometry']
    raw = json.dumps(geom, sort_keys=True, separators=(',', ':')).encode()
    if sha256(raw).hexdigest() != digest:
        raise ValueError(f'Unexpected INEGI vector edition for {code}')
    if cache and not cache.exists():
        cache.write_bytes(data)
    return shape(geom)


def surfaces(w, directory):
    west, south, east, north = geo.padded(w['bbox'])
    x, y = 3 * floor(west / 3), 3 * floor(south / 3)
    if east >= x + 3 or north >= y + 3:
        raise ValueError('Review spans more than one tile')
    tile = f'N{y:02}W{abs(x):03}'
    x0, x1 = floor((west-x)*12000), ceil((east-x)*12000)
    y0, y1 = floor((y+3-north)*12000), ceil((y+3-south)*12000)
    data, urls, digests = [], [], []
    for version, year in [('v100', 2020), ('v200', 2021)]:
        filename = f'ESA_WorldCover_10m_{year}_{version}_{tile}_Map.tif'
        url = f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{version}/{year}/map/{filename}'
        urls.append(url)
        ds = gdal.Open(str(directory / filename) if directory else '/vsicurl/' + url)
        if ds is None or ds.GetSpatialRef().GetAuthorityCode(None) != '4326' or not np.allclose(
            ds.GetGeoTransform(), (x, 1/12000, 0, y+3, 0, -1/12000), rtol=0, atol=1e-15
        ):
            raise ValueError(f'Unexpected WorldCover grid {filename}')
        a = ds.GetRasterBand(1).ReadAsArray(x0, y0, x1-x0, y1-y0)
        data.append(a)
        digests.append(sha256(a.tobytes()).hexdigest())
    if digests != PIXEL_SHA[w['id']]:
        raise ValueError(f'Unexpected WorldCover pixels for {w["id"]}')
    gt = (x+x0/12000, 1/12000, 0, y+3-y0/12000, 0, -1/12000)
    # Require stable dry or permanent-water classes. Mangroves, intertidal
    # marsh, discordant years and nodata are deliberately left unassigned.
    a, b = data
    classes = [10, 20, 30, 40, 50, 60]
    return (geo.raster_mask(np.isin(a, classes) & np.isin(b, classes), gt),
            geo.raster_mask((a == 80) & (b == 80), gt), urls)


def component(parts, x, y):
    matches = [p for p in parts if p.contains(Point(x, y))]
    if len(matches) != 1:
        raise ValueError(f'Expected one positive component at {x}, {y}')
    return matches[0]


def window(w, unit, directory):
    dry, wet, urls = surfaces(w, directory)
    frame = box(*geo.padded(w['bbox']))
    parts = geo.polygons(unit)
    land, owners = [], []
    labels = [('mainland', '', *w['mainland'])] if 'mainland' in w else [
        ('island', name, x, y) for name, x, y in w['islands']]
    for kind, name, x, y in labels:
        coast = component(parts, x, y).intersection(frame)
        # Ignore subpixel slivers produced where two independent edges cross.
        certified = unary_union([p for p in geo.polygons(dry.intersection(coast))
                                 if p.area >= 1 / 12000**2])
        land.extend(geo.pack(certified, kind=kind, **({'name': name} if name else {})))
        owners.extend(geo.pack(certified, code='MX'))
    # A polygon's absence alone never establishes water. Agreement of both
    # satellite years with the official coast establishes the open sea.
    water = {'ocean': wet.intersection(frame).difference(unit)}
    for kind, x, y in w.get('lagoons', []):
        # The ministry distinguishes the tide-connected Makax from the
        # closed Salina Grande. Recover only their connected wet pixels.
        lagoon = component(geo.polygons(wet), x, y).intersection(frame)
        if kind == 'inland':
            water['ocean'] = water['ocean'].difference(lagoon)
        water[kind] = unary_union([water[kind], lagoon]) if kind in water else lagoon
    water = {kind: unary_union([p for p in geo.polygons(surface) if p.area >= 1 / 12000**2])
             for kind, surface in water.items()}
    return dict(id=w['id'], name=w['name'], bbox=w['bbox'], oceanRegion=w['sea'],
                source='north-america-polygon-detail+' + w['id'],
                version='INEGI Marco Geoestadístico, December 2025; ESA WorldCover 2020 v100 / 2021 v200',
                attribution='INEGI, Marco Geoestadístico, diciembre de 2025. ' + geo.WC_CREDIT +
                (' Lagoon locality positions from GeoNames, CC BY 4.0.' if w.get('lagoons') else ''),
                evidenceUrls=[INEGI + SOURCES[w['area']][0], 'https://www.inegi.org.mx/inegi/terminos.html',
                              geo.WC_URL, *urls, *w['evidence']],
                land=land, owners=owners, water=[r for kind, geom in water.items() for r in geo.pack(geom, kind=kind)])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-directory', type=Path)
    parser.add_argument('--worldcover-directory', type=Path)
    parser.add_argument('--output', type=Path, default=HERE.parent / 'src/data/naMexicoPolygonDetail.json')
    args = parser.parse_args()
    if args.input_directory:
        args.input_directory.mkdir(exist_ok=True, parents=True)
    gdal.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    gdal.SetConfigOption('GDAL_HTTP_MAX_RETRY', '4')
    gdal.SetConfigOption('GDAL_HTTP_RETRY_DELAY', '1')
    units = {area: official(area, args.input_directory) for area in SOURCES}
    windows = [window(w, units[w['area']], args.worldcover_directory) for w in WINDOWS]
    args.output.write_text(json.dumps({'windows': windows}, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
