#!/usr/bin/env python3
"""Rebuild five Lesser Antilles excerpts (Python 3.11+, GDAL, NumPy, Shapely 2).

--fieldmaps-gpkg takes the public USGS/LSIB 2025-07-29 ADM0 GeoPackage.
--source-directory caches small IGN responses. WorldCover uses HTTP range
requests, or --worldcover-directory can point to the original GeoTIFF tiles.
"""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import floor
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
from osgeo import gdal, ogr
from shapely import from_wkb
from shapely.geometry import Point, box, shape
from shapely.ops import unary_union

common = import_module('build-northern-central-america-review')
read_raster = import_module('build-south-america-andes').read_raster
ROOT = Path(__file__).resolve().parents[1]
IHO = 'https://iho.int/uploads/user/pubs/standards/s-23/S-23_Ed3_1953_EN.pdf'
IGN_LICENCE = 'https://geoservices.ign.fr/cgu-licences'
# Sea controls select the connected sea-water component; ponds on an island
# stay out of the marine geometry even when their pixel classes equal the sea.
SITES = {
    'pinel': ('Îlet Pinel / Petite Clef', [-63.0207, 18.102, -63.0105, 18.109],
              (-63.0179, 18.1047), 'https://www.reservenaturelle-saint-martin.com/fr/general/sites-fragiles-decouvrir'),
    'fourchue': ('Île Fourchue / la Petite Islette / Îlet au Vent', [-62.912, 17.949, -62.895, 17.962],
                 (-62.905, 17.952), 'https://www.agencedelenvironnement.fr/en/page/satellite-islands'),
    'petite-terre': ('Îles de la Petite Terre', [-61.121, 16.168, -61.102, 16.182],
                     (-61.109, 16.175), 'https://www.guadeloupe.developpement-durable.gouv.fr/la-reserve-naturelle-nationale-des-iles-de-la-a4868.html'),
    'robert': ('Îlets du Robert', [-60.9005, 14.6828, -60.8755, 14.698],
               (-60.884, 14.6845), 'https://www.martinique.developpement-durable.gouv.fr/commune-du-robert-a610.html'),
    'petit-saint-vincent': ('Petit Saint Vincent / Petite Martinique', [-61.391, 12.517, -61.375, 12.5415],
                            (-61.3837, 12.53), 'https://www.gov.vc/index.php/visitors/about-svg'),
}
# Static 2025 administrative geometry and sorted (name, point) pairs from BD TOPO.
IGN = {
    'pinel': ('MF', '978', 'collectivite_territoriale', '6126bd325c935a5e8c5d7b2d757ddfd3282fed272e0079ad26a45a6829db6cf4',
              '391707bf906dcb6ffbe7f35164a554dcce5624ff8ce75a8b534d931ba743ccf1'),
    'fourchue': ('BL', '977', 'collectivite_territoriale', '3600405f02262f9ee487dbdc1127061be47d9126e7e1d4a268cde20ef9154330',
                 'c9a90a5acb246ff486a830b52f07e36d9cd1704834fee79de81327e87d3b6aa7'),
    'petite-terre': ('GP', '97110', 'commune', '56948698c4363727ff192a202a37035568b00ffa6356303cfaf8e612152e3146',
                     '3bb544bf1c2798a2244e40702b195fa44694725ba6daadb1ea354fdc1751c774'),
    'robert': ('MQ', '97222', 'commune', 'e6e9ba0611ecb24a98621e4ae41cf544d5d16bfada660284738fcd50e74b53ba',
               'f4240d1ffd283447d6430bead5bf87a6c6f205764b6f757641c8a4e84a7e15cb'),
}
GRENADINES = {'VC': ('Petit Saint Vincent', (-61.384171, 12.536509)),
              'GD': ('Petite Martinique', (-61.386690, 12.519035))}
PIXELS = {
    'pinel': ('2d22dee647264bec6cff3b25615c75cd8c0a64210f81cb411719e51712e7b43e', 'b84caf58ad3ef0289d340e3d6fc96acb6abaacbe237784eef8e22a7a27f635df'),
    'fourchue': ('724964854ea79fdc20de67cceda82d4ab84010093c269b29a4b5e26a826afe04', 'c0a23f2da900a364a67962d14c92c4f7d78ef4ca7b3ee00e754a62660d30df0b'),
    'petite-terre': ('b2325a49b165fca9839b0c6e69a3211cc0852a842314d21ea3bda84f9c45c64f', '4573953fd9fdffa9c5ba8535ebd4d310d46163e229292e59f1389fde43ddf242'),
    'robert': ('33f01730f5d77965076dbf06eb9ab6b73bbfe40202239b0e33025c00ce8a114b', 'dfbea7648782c9b7754354d8ea6c9409b6c04ac0e16f72fe30ba8ff5bf3b20cc'),
    'petit-saint-vincent': ('c502a12bed7af6092ebc83d384b72daae6395b09bc9132b5d68bf9bc2c28deb1', 'b53e65a53afb816a454e8f7f19ae948007a4153c35cfc9c514e324d5ce70acbc'),
}


def check_json(data, digest):
    canonical = json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode()
    if sha256(canonical).hexdigest() != digest:
        raise ValueError('Input geometry or island label changed')


def ign_extract(layer, path, extent):
    params = dict(SERVICE='WFS', VERSION='2.0.0', REQUEST='GetFeature', TYPENAMES=layer,
                  OUTPUTFORMAT='application/json', srsName='urn:ogc:def:crs:OGC:1.3:CRS84',
                  bbox=','.join(f'{v:.5f}' for v in extent) + ',urn:ogc:def:crs:OGC:1.3:CRS84', count=100)
    url = 'https://data.geopf.fr/wfs/ows?' + urlencode(params)
    data = path.read_bytes() if path.exists() else urlopen(url, timeout=60).read()
    obj = json.loads(data)
    if obj['numberMatched'] != len(obj['features']):
        raise ValueError(f'Partial IGN result for {layer}')
    if not path.exists():
        path.write_bytes(data)
    return obj['features'], url


def french_islands(key, extent, directory):
    code, insee, layer, outline_sha, name_sha = IGN[key]
    rows, coast_url = ign_extract('ADMINEXPRESS-COG.2025:'+layer, directory/(key+'-official.json'), extent)
    feature, = [f for f in rows if f['properties']['code_insee'] == insee]
    check_json(feature['geometry'], outline_sha)
    admin = shape(feature['geometry'])
    labels, name_url = ign_extract('BDTOPO_V3:detail_orographique', directory/(key+'-toponyms.json'), extent)
    points = sorted((f['properties']['toponyme'], f['geometry']['coordinates']) for f in labels
                    if f['properties']['nature'] == 'Ile')
    check_json(points, name_sha)
    frame = box(*extent)
    parts = [p for p in common.polygons(admin) if p.intersects(frame)]
    named = []
    for name, coord in points:
        if name == 'Îles de la Petite Terre':
            continue  # The name refers to the archipelago; its label is in the channel.
        p, = [p for p in parts if p.contains(Point(coord))]
        named.append((name, code, 'FR', p.intersection(frame)))
    return named, admin.intersection(frame), [coast_url, name_url, IGN_LICENCE]


def grenadine_islands(ds, extent):
    layer = ds.GetLayerByName('adm0_polygons')
    layer.SetSpatialFilterRect(*extent)
    frame = box(*extent)
    named, all_coasts = [], []
    for feature in layer:
        code = feature['iso_2']
        name, control = GRENADINES[code]
        parts = common.polygons(from_wkb(bytes(feature.geometry().ExportToWkb())))
        island, = [p for p in parts if p.contains(Point(control))]
        named.append((name, code, code, island.intersection(frame)))
        all_coasts.extend(p.intersection(frame) for p in parts if p.intersects(frame))
    if {row[1] for row in named} != GRENADINES.keys():
        raise ValueError('Missing international island outline')
    return named, unary_union(all_coasts), [common.FM_URL, 'https://www.gov.vc/images/InvitationtoSubmitComments/CARCIP_Final_ESIA_R6_20190404.pdf']


def masks(key, extent, directory):
    west, south, east, north = extent
    tx, ty = 3*floor(west/3), 3*floor(south/3)
    if east >= tx+3 or north >= ty+3:
        raise ValueError('Input window crosses a WorldCover tile')
    tile = f'N{ty:02}W{abs(tx):03}'
    arrays, urls = [], []
    for (year, edition), digest in zip([(2020,'v100'),(2021,'v200')], PIXELS[key]):
        url = (f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{edition}/{year}/map/'
               f'ESA_WorldCover_10m_{year}_{edition}_{tile}_Map.tif')
        arr, grid = read_raster(url, extent, digest, directory)
        arrays.append(arr)
        urls.append(url)
    dry = np.isin(arrays[0], [10,20,30,40,50,60]) & np.isin(arrays[1], [10,20,30,40,50,60])
    wet = (arrays[0] == 80) & (arrays[1] == 80)
    return common.raster_mask(dry, grid), common.raster_mask(wet, grid), urls


def interior(g):
    # Leave a pixel of clearance at mixed edges and keep the simplified core
    # inside the original consensus footprint.
    return g.buffer(-1/12000, join_style='mitre').simplify(0.45/12000).intersection(g)


def build(key, ds, directory, raster_directory):
    title, bounds, sea_control, official = SITES[key]
    extent = common.padded(bounds)
    if key in IGN:
        named, coasts, urls = french_islands(key, extent, directory)
        edition = 'IGN ADMIN EXPRESS COG 2025 / BD TOPO V3 names (2026-11-26 extract)'
        credit = '© IGN France, modified ADMIN EXPRESS COG and BD TOPO®, Licence Ouverte 2.0.'
    else:
        named, coasts, urls = grenadine_islands(ds, extent)
        edition, credit = 'FieldMaps USGS/LSIB 2025-07-29', common.FM_CREDIT
    dry, wet, rasters = masks(key, extent, raster_directory)
    land, owners = [], []
    for name, code, sovereign, polygon in sorted(named, key=lambda row: row[0]):
        mapped = interior(polygon.intersection(dry))
        land.extend(common.pack(mapped, kind='island', name=name))
        owners.extend(common.pack(mapped, code=code, sovereignCode=sovereign))
    ocean, = [p for p in common.polygons(wet.difference(coasts)) if p.contains(Point(sea_control))]
    return dict(id='lesser-antilles-'+key, name=title, bbox=bounds, source='lesser-antilles-review+'+key,
                version=edition+' / ESA WorldCover 2020 v100 and 2021 v200', attribution=credit+' '+common.WC_CREDIT,
                evidenceUrls=[official, *urls, *rasters, IHO], oceanRegion='CARB', land=land, owners=owners,
                water=common.pack(interior(ocean).intersection(box(*extent)), kind='ocean'))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source-directory', type=Path, required=True)
    p.add_argument('--fieldmaps-gpkg', type=Path, required=True)
    p.add_argument('--worldcover-directory', type=Path)
    p.add_argument('--output', type=Path, default=ROOT/'src/data/lesserAntillesIslandsReviewed.json')
    args = p.parse_args()
    args.source_directory.mkdir(parents=True, exist_ok=True)
    common.check(args.fieldmaps_gpkg, common.FM_SHA)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    ds = ogr.Open(str(args.fieldmaps_gpkg))
    data = {'windows': [build(k, ds, args.source_directory, args.worldcover_directory) for k in SITES]}
    args.output.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n')


if __name__ == '__main__':
    main()
