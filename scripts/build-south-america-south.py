#!/usr/bin/env python3
"""Build five Southern Cone border and island windows. Python 3.11+, GDAL, NumPy and Shapely 2."""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import ceil, floor
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
from osgeo import gdal, ogr
from shapely import from_wkb, union_all
from shapely.geometry import Point, Polygon, box, shape
from shapely.ops import split

common = import_module('build-northern-central-america-review')
ROOT = Path(__file__).resolve().parents[1]
FRAME = {
    'iguazu-parana': ('Iguazú / Paraná', [-54.6015, -25.601, -54.584, -25.5845]),
    'martin-timoteo': ('Martín García–Timoteo Domínguez', [-58.261, -34.192, -58.240, -34.167]),
    'tierra-del-fuego': ('Paso San Sebastián, Isla Grande de Tierra del Fuego', [-68.617, -53.325, -68.596, -53.313]),
    'rivera-livramento': ('Rivera / Santana do Livramento', [-55.542, -30.9005, -55.529, -30.891]),
    'florianopolis-channel': ('Florianópolis, Ilha de Santa Catarina', [-48.584, -27.598, -48.561, -27.586]),
}
PIXELS = {
    'martin-timoteo': ('e5798335adce65668022dda3718f3191b419b302f3d00581d13e11697560010d', '1f0987df3390e46694a3641fe5bfed57d7e82b8fb25f67b37960abf13a657316'),
    'tierra-del-fuego': ('aa5a6e2116251734cb5259fc7bc5be3983a80eab2b1483e346d4eed5af0aa8a8', '6fb420a8f7be0e33bad9e7281bb83aafb4912445d835d02f917426abc2f5d040'),
    'iguazu-parana': ('8caaf30ff640a07303e6e846129c8e4e0a7fea4ce2cd54f9391e339c0b172800', '95d20fff3a2fab5c30629977b82c706c06e239e43fe06e498c343c2044debb2f'),
    'rivera-livramento': ('e15ee44623ffc7a257af0571526c74cc538011a0b9c8b3730e003cc6fdb46f98', '82db11316fc8d19ab95c9a618622d71dcf990e347ba29098c4ce048dc6323e81'),
    'florianopolis-channel': ('8d23a1452087004649b8c589a7ef414c706f3e9a84180d816ae2baf185137cbc', '17b1439234df36dc1adfd96e84d18aefc542192b27ff0f38930396b1ae45190e'),
}
IGN_SHA = {'40604': 'cb9313b9a15f889887c1f483f58b006fea25409efcc44d64330b0cbd70039891',
           '40669': '90273f88d34e808e1c475340743ec6ea2b6c8838ee4466e3565bff3bffe8055e'}
IGN_META = 'https://www.ign.gob.ar/capas-sig/metadata/linea_de_limite_FA004.pdf'
IBGE_URL = 'https://servicodados.ibge.gov.br/api/v3/malhas/municipios/4317103?formato=application/vnd.geo+json&qualidade=maxima'
IBGE_SHA = '79dc816ac6409fd6a9342dcc56152f1da787dfe6d011524fe550113b51f666e7'
TREATY = 'https://www.un.org/Depts/los/LEGISLATIONANDTREATIES/PDFFILES/TREATIES/ARG-URY1988RP.PDF'
IGUAZU = 'https://senatur.gov.py/wp-content/uploads/2022/08/pedts_alto_parana.pdf'
FUEGO = 'https://pasosfronterizos.gob.cl/complejos-fronterizos/magallanes/paso-san-sebastian/'
RIVERA = 'https://www.rivera.gub.uy/social/plaza-internacional/'
FLORIPA = 'https://www.sie.sc.gov.br/webdocs/sie/doc-tecnicos/aquaviario/Projeto%20Aquaviario%20SC.pdf'


def read_checked(path, digest, fetch):
    data = path.read_bytes() if path.exists() else fetch()
    if sha256(data).hexdigest() != digest:
        raise ValueError(f'Unexpected source edition for {path.name}')
    if not path.exists():
        path.write_bytes(data)
    return data


def boundary_feature(cache, gid):
    feature_id = 'linea_de_limite_FA004.' + gid
    url = 'https://wms.ign.gob.ar/geoserver/ign/ows?' + urlencode(dict(service='WFS', version='1.0.0', request='GetFeature',
        typeName='ign:linea_de_limite_FA004', featureID=feature_id, srsName='EPSG:4326', outputFormat='application/json'))

    def fetch():
        with urlopen(url, timeout=60) as response:
            record, = json.load(response)['features']
        if record['id'] != feature_id or record['properties']['objeto'] != 'Límite internacional':
            raise ValueError('Expected the national land-boundary record from IGN')
        # WFS includes a changing timestamp outside the geographic feature.
        return json.dumps(record, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()

    data = read_checked(cache / f'ign-{gid}.json', IGN_SHA[gid], fetch)
    return shape(json.loads(data)['geometry']), url


def surfaces(key, bounds, cache):
    west, south, east, north = bounds
    tx, ty = 3 * floor(west / 3), 3 * floor(south / 3)
    if east >= tx + 3 or north >= ty + 3:
        raise ValueError(f'Window spans two source tiles: {key}')
    x0, x1 = floor((west-tx)*12000), ceil((east-tx)*12000)
    y0, y1 = floor((ty+3-north)*12000), ceil((ty+3-south)*12000)
    tile = f'S{abs(ty):02}W{abs(tx):03}'
    arrays, urls = [], []
    for i, (year, version) in enumerate([(2020, 'v100'), (2021, 'v200')]):
        name = f'ESA_WorldCover_10m_{year}_{version}_{tile}_Map.tif'
        url = f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{version}/{year}/map/{name}'
        urls.append(url)

        def pixels():
            ds = gdal.Open('/vsicurl/' + url)
            if ds.GetSpatialRef().GetAuthorityCode(None) != '4326' or not np.allclose(
                    ds.GetGeoTransform(), (tx, 1/12000, 0, ty+3, 0, -1/12000), rtol=0, atol=1e-15):
                raise ValueError('Unexpected WorldCover pixel grid')
            return ds.GetRasterBand(1).ReadAsArray(x0, y0, x1-x0, y1-y0).tobytes()

        raw = read_checked(cache / f'{key}-{year}.bin', PIXELS[key][i], pixels)
        arrays.append(np.frombuffer(raw, dtype='uint8').reshape((y1-y0, x1-x0)))
    gt = (tx+x0/12000, 1/12000, 0, ty+3-y0/12000, 0, -1/12000)
    dry_classes = [10, 20, 30, 40, 50, 60]
    dry = common.raster_mask(np.isin(arrays[0], dry_classes) & np.isin(arrays[1], dry_classes), gt)
    wet = common.raster_mask((arrays[0] == 80) & (arrays[1] == 80), gt)
    return dry, wet, urls


def component(geometry, lon, lat):
    single, = (p for p in common.polygons(geometry) if p.contains(Point(lon, lat)))
    return single


def interior(geom):
    # Retain an interior after simplifying the pixel staircase. The final
    # intersection prevents simplification from certifying mixed shoreline cells.
    return geom.buffer(-1/24000, join_style='mitre').simplify(1/24000).intersection(geom)


def physical_shape(layer, frame, gid):
    layer.SetSpatialFilterRect(*frame.bounds)
    return union_all([from_wkb(bytes(f.geometry().ExportToWkb())).intersection(frame)
                      for f in layer if int(f['id'].split('-')[0]) == gid])


def window(key, fieldmaps, shores, cache):
    name, bbox = FRAME[key]
    frame = box(*common.padded(bbox))
    admin = common.owners_in_window(fieldmaps, frame.bounds)
    source_dry, source_water, urls = surfaces(key, frame.bounds, cache)
    urls += [common.FM_URL, common.WC_URL]
    versions = ['ESA WorldCover 2020 v100 and 2021 v200', 'FieldMaps USGS/LSIB 2025-07-29']
    credits = [common.WC_CREDIT, common.FM_CREDIT]
    land, owners = [], []
    wet = source_water.intersection(frame)
    ocean = key == 'florianopolis-channel'

    def add_land(footprint, kind, **values):
        land.extend(common.pack(footprint, kind=kind, **values))

    def add_owner(code, footprint, pin):
        if not footprint.contains(Point(*pin)):
            raise ValueError(f'Missing interior country control {key} {code} {pin}')
        owners.extend(common.pack(footprint, code=code))

    if key in ('tierra-del-fuego', 'florianopolis-channel'):
        versions.append('GSHHG 2.3.7 full resolution')
        credits.append('GSHHG © Paul Wessel and Walter H. F. Smith, LGPL-3.0-or-later.')
        urls.append(common.GSHHG_URL)
    if key in ('tierra-del-fuego', 'martin-timoteo'):
        gid = '40604' if key == 'tierra-del-fuego' else '40669'
        line, ign_url = boundary_feature(cache, gid)
        versions.append(f'IGN Argentina FA004 {gid}')
        credits.append('Adapted from Instituto Geográfico Nacional de la República Argentina, Límite internacional.')
        urls += [ign_url, IGN_META]

    if key == 'iguazu-parana':
        for code, pin in [('AR', (-54.59076389, -25.59476944)), ('BR', (-54.59023333, -25.59019444)),
                          ('PY', (-54.596611, -25.59225))]:
            bank = interior(component(source_dry, *pin)).intersection(frame)
            add_land(bank, 'mainland')
            add_owner(code, bank.intersection(admin[code]), pin)
        wet = component(wet, -54.5943, -25.5917)
        urls += [IGUAZU, 'https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG']
    elif key == 'martin-timoteo':
        ar_pin = (-58.24694, -34.18222)
        uy_pin = (-58.2557995, -34.1796294)
        body = component(source_dry, *ar_pin)
        if not body.contains(Point(*uy_pin)) or len(line.geoms) != 1 or not line.geoms[0].is_ring:
            raise ValueError('Expected one joined dry body and the IGN closed Martín García boundary')
        dry = interior(body).intersection(frame)
        historic_outline = Polygon(line.geoms[0])
        add_land(dry, 'island', name='Martín García–Timoteo Domínguez', sharedIslandCountryCodes=['AR', 'UY'])
        # Treaty Article 46 refers to cartographic Martin Garcia, not the
        # contemporary vegetated shoreline or the division of the river bed.
        add_owner('AR', dry.intersection(historic_outline).intersection(admin['AR']), ar_pin)
        add_owner('UY', dry.difference(historic_outline).intersection(admin['UY']), uy_pin)
        wet = component(wet, -58.24175, -34.1794167)
        urls.append(TREATY)
    elif key == 'tierra-del-fuego':
        cl_pin, ar_pin = (-68.6085, -53.32), (-68.604, -53.32)
        dry = interior(component(source_dry, *cl_pin)).intersection(physical_shape(shores, frame, 35))
        add_land(dry, 'island', name='Isla Grande de Tierra del Fuego', sharedIslandCountryCodes=['AR', 'CL'])
        # The national IGN cartographic line is from CONALI sheets. Keep its
        # shared edge across the land; check both independent FieldMaps anchors.
        sides = split(frame, line.geoms[0])
        if len(sides.geoms) != 2:
            raise ValueError('Expected an island-wide cartographic boundary through this window')
        for code, pin in [('CL', cl_pin), ('AR', ar_pin)]:
            if not admin[code].contains(Point(*pin)):
                raise ValueError('Country control contradicts FieldMaps')
            add_owner(code, dry.intersection(component(sides, *pin)), pin)
        urls.append(FUEGO)
    elif key == 'rivera-livramento':
        br_pin, uy_pin = (-55.533, -30.894), (-55.538, -30.898)
        dry = interior(component(source_dry, *br_pin)).intersection(frame)
        def fetch_ibge():
            with urlopen(IBGE_URL, timeout=60) as response:
                return response.read()
        ibge = json.loads(read_checked(cache / 'ibge-4317103.json', IBGE_SHA, fetch_ibge))
        feature, = ibge['features']
        if feature['properties']['codarea'] != '4317103':
            raise ValueError('Unexpected Brazilian municipality')
        brazil = shape(feature['geometry'])
        add_land(dry, 'mainland')
        add_owner('BR', dry.intersection(admin['BR']).intersection(brazil), br_pin)
        add_owner('UY', dry.intersection(admin['UY']).difference(brazil), uy_pin)
        versions.append('IBGE municipal mesh 4317103, maximum-detail API')
        credits.append('Adapted from Instituto Brasileiro de Geografia e Estatística (IBGE), malha municipal.')
        urls.extend([IBGE_URL, RIVERA])
    else:
        for kind, gid, pin in [('mainland', 3, (-48.579, -27.590)), ('island', 577, (-48.563, -27.592))]:
            dry = interior(component(source_dry, *pin)).intersection(physical_shape(shores, frame, gid))
            add_land(dry, kind, **({'name': 'Ilha de Santa Catarina'} if kind == 'island' else {}))
            add_owner('BR', dry.intersection(admin['BR']), pin)
        # Inland ponds are not part of the Atlantic. Two bay lobes are
        # separated by the bridge decks in some WorldCover observations.
        bays = union_all([component(wet, -48.570, -27.590), component(wet, -48.56429, -27.59604)])
        wet = bays.difference(physical_shape(shores, frame, 3)).difference(physical_shape(shores, frame, 577))
        urls.append(FLORIPA)
    return dict(id=key, name=name, bbox=bbox, source='south-america-review+' + key,
                version='; '.join(versions), attribution=' '.join(credits), evidenceUrls=urls,
                land=land, owners=owners, water=common.pack(interior(wet), kind='ocean' if ocean else 'inland'),
                **({'oceanRegion': 'SATL'} if ocean else {}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input_directory', type=Path, help='Checksum-verified source windows cached here on first use')
    parser.add_argument('--fieldmaps-gpkg', type=Path, required=True)
    parser.add_argument('--gshhg-archive', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=ROOT / 'src/data/southAmericaSouthReviewed.json')
    args = parser.parse_args()
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    gdal.SetConfigOption('GDAL_HTTP_MAX_RETRY', '3')
    gdal.SetConfigOption('GDAL_HTTP_RETRY_DELAY', '2')
    args.input_directory.mkdir(exist_ok=True, parents=True)
    common.check(args.fieldmaps_gpkg, common.FM_SHA)
    common.check(args.gshhg_archive, common.GSHHG_SHA)
    fieldmaps = ogr.Open(str(args.fieldmaps_gpkg))
    gshhg = ogr.Open(f'/vsizip/{args.gshhg_archive.resolve()}/GSHHS_shp/f/GSHHS_f_L1.shp')
    windows = [window(key, fieldmaps, gshhg.GetLayer(), args.input_directory) for key in FRAME]
    args.output.write_text(json.dumps({'windows': windows}, separators=(',', ':'), ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
