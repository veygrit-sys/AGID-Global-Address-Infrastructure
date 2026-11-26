#!/usr/bin/env python3
"""Rebuild the eight bounded US–Mexico assessments (Python 3.11+, GDAL, NumPy, Shapely 2)."""
import argparse
from hashlib import sha256
import json
import math
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
from osgeo import gdal, ogr
from shapely import from_wkb, normalize, set_precision
from shapely.geometry import Point, Polygon, box, shape
from shapely.ops import polygonize, unary_union

gdal.UseExceptions()
ogr.UseExceptions()
ROOT = Path(__file__).resolve().parents[1]
IBC = 'https://gisserver.ibwc.gov/agsserver/rest/services/USIBWCPublic/US_MexicoIB/FeatureServer/0'
IBC_QUERY = IBC + '/query?where=1%3D1&outFields=OBJECTID,Name&outSR=4326&returnGeometry=true&orderByFields=OBJECTID&f=geojson'
NHD = 'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer'
WORLDCOVER = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/'
# The independent control coordinates select the correct side even on river meanders.
# Each point is ordered longitude, latitude; checked against FieldMaps USGS/LSIB (July 2025).
REGIONS = [
    ('pacific-terminus', 'Pacific Ocean / Border Field State Park', [-117.13, 32.531, -117.12, 32.538], [-117.1215, 32.535827], [-117.1215, 32.532741]),
    ('san-ysidro', 'San Ysidro / Tijuana', [-117.036, 32.54, -117.024, 32.547], [-117.03, 32.545232], [-117.03, 32.540676]),
    ('nogales', 'Nogales, Arizona / Nogales, Sonora', [-110.95, 31.33, -110.939, 31.339], [-110.9445, 31.336134], [-110.9445, 31.331109]),
    ('el-paso', 'El Paso / Ciudad Juárez', [-106.455, 31.757, -106.446, 31.766], [-106.447662, 31.763873], [-106.4505, 31.758866]),
    ('laredo', 'Laredo / Nuevo Laredo', [-99.511, 27.492, -99.499, 27.504], [-99.505, 27.502381], [-99.505, 27.495099]),
    ('brownsville', 'Brownsville / Matamoros', [-97.505, 25.877, -97.491, 25.885], [-97.494138, 25.882681], [-97.501521, 25.880949]),
    ('eagle-pass', 'Eagle Pass / Piedras Negras', [-100.513, 28.7, -100.501, 28.71], [-100.506181, 28.705393], [-100.512681, 28.705393]),
    ('calexico', 'Calexico / Mexicali', [-115.504, 32.661, -115.494, 32.67], [-115.499, 32.667805], [-115.499, 32.662401]),
]
DIGESTS = {
    'brownsville-12.geojson': '1f44f6b271b35c0bc644466621d7dae4ccbbe0248b1c6aaf8224df0e5c67222b',
    'brownsville-9.geojson': '43de5ea61c040e8cc53182018e3120fd46a19193d1b742612b611afc6e838c44',
    'brownsville.bin': '15961ae7668a3cc264fa80f08ead3492e49a9b65cd058910431f9ed66b0e4da6',
    'calexico-12.geojson': 'ea65cbf65fecaf9f79a75c74ab65d8590c92f83a86923269d3b60769fbdfde2c',
    'calexico-9.geojson': 'ed778c73ea51338d6576fb5992b189f2b94d9f3d5e199f46c1af520d6b0b3e6c',
    'calexico.bin': 'ee368f1bd9a8d52d1aa8e272f63dcc2547d28e72396b849dabe5feb82f545d89',
    'eagle-pass-12.geojson': 'ed778c73ea51338d6576fb5992b189f2b94d9f3d5e199f46c1af520d6b0b3e6c',
    'eagle-pass-9.geojson': '641638e7b207cbca9c6612a0cdc81b891c7ca5356117d57780462256aee6770b',
    'eagle-pass.bin': '8feab508fb39c4f293d8082c126888db21acba14eae54c93101f95c062a9c878',
    'el-paso-12.geojson': 'ed778c73ea51338d6576fb5992b189f2b94d9f3d5e199f46c1af520d6b0b3e6c',
    'el-paso-9.geojson': '2114a8296b55ed05e845a2761e28e1370e0d0030bb3dded19fbb66f516f4359e',
    'el-paso.bin': 'ffaa9849f56c6c3c7b7d4ed6eac6bffab60c152cb03c1cd277352b2b21886d80',
    'ibwc-official.geojson': 'ebaeb143ab9b2ac11eeb2ad5a6860f21e9302fa800fd5fcd21197ce3da1513db',
    'laredo-12.geojson': 'ed778c73ea51338d6576fb5992b189f2b94d9f3d5e199f46c1af520d6b0b3e6c',
    'laredo-9.geojson': '641638e7b207cbca9c6612a0cdc81b891c7ca5356117d57780462256aee6770b',
    'laredo.bin': '6d4c2dcd04db1b657f2be8f5909a66a002616b54602821794fcd715b55f0e742',
    'nogales-12.geojson': 'ed778c73ea51338d6576fb5992b189f2b94d9f3d5e199f46c1af520d6b0b3e6c',
    'nogales-9.geojson': 'ed778c73ea51338d6576fb5992b189f2b94d9f3d5e199f46c1af520d6b0b3e6c',
    'nogales.bin': '08229790b701468fcde5aa107ec95029bf9a951a9bd5a439e2d7bfe66acc9d52',
    'pacific-terminus-12.geojson': '2cf14c637efc819263083eaeabdcf43db61bcf8335c635749e701afe03c101ca',
    'pacific-terminus-9.geojson': 'c8b5272ad76ec726dfbc2825f674e404ca38165bf18beebdbac33a19e8ef9e11',
    'pacific-terminus.bin': '48a0d30be4a4de6518404d96cb5fc0dde2c89ea779a226fe171b329f70336fea',
    'san-ysidro-12.geojson': 'ed778c73ea51338d6576fb5992b189f2b94d9f3d5e199f46c1af520d6b0b3e6c',
    'san-ysidro-9.geojson': 'ed778c73ea51338d6576fb5992b189f2b94d9f3d5e199f46c1af520d6b0b3e6c',
    'san-ysidro.bin': '9025e985782cda916f94dd6a8ab51fe3708bdbdc0bce60e19ab2aa5f45ac3386',
}
CREDIT = ('International Boundary and Water Commission, United States and Mexico; National Institute of Geography '
          'and Statistics, Mexico; United States Geological Survey (boundary: public domain, mapping use only); '
          'U.S. Geological Survey, National Hydrography Dataset (U.S. public domain); '
          '© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) '
          'processed by ESA WorldCover consortium (CC BY 4.0). Land cover and hydrography intersected by AGID.')


def load(cache, name, remote):
    path = cache / name
    if not path.exists():
        if remote is None:
            raise FileNotFoundError(f'{path} missing; use --download')
        data = remote()
        if sha256(data).hexdigest() != DIGESTS[name]:
            raise ValueError(f'Changed public data: {name}')
        path.write_bytes(data)
    data = path.read_bytes()
    if sha256(data).hexdigest() != DIGESTS[name]:
        raise ValueError(f'Unexpected source SHA-256 for {name}')
    return data


def get(url):
    with urlopen(url, timeout=100) as response:
        return response.read()


def grid(bounds):
    w, s, e, n = bounds
    west = 3 * math.floor(w / 3)
    north = 3 * math.ceil(n / 3)
    step = 1 / 12000
    col = math.floor((w - west) / step) - 12
    row = math.floor((north - n) / step) - 12
    width = math.ceil((e - west) / step) + 12 - col
    height = math.ceil((north - s) / step) + 12 - row
    tile = f'N{north - 3:02}W{-west:03}'
    url = WORLDCOVER + f'ESA_WorldCover_10m_2021_v200_{tile}_Map.tif'
    transform = (west + col * step, step, 0, north - row * step, 0, -step)

    def download():
        source = gdal.Open('/vsicurl/' + url)
        if (source.GetGeoTransform() != (west, step, 0, north, 0, -step)
                or source.GetSpatialRef().GetAuthorityCode(None) != '4326'):
            raise ValueError(f'Unexpected WorldCover grid: {tile}')
        return source.ReadAsArray(col, row, width, height).tobytes()

    return width, height, transform, url, download


def positive_cells(mask, transform):
    # The complete 3x3 neighbourhood must agree. Shore pixels, seasonal wetlands
    # and bridges with conflicting river evidence stay open for confirmation.
    interior = np.lib.stride_tricks.sliding_window_view(np.pad(mask, 1), (3, 3)).all(axis=(-1, -2))
    height, width = mask.shape
    image = gdal.GetDriverByName('MEM').Create('', width, height, 1, gdal.GDT_Byte)
    image.SetGeoTransform(transform)
    band = image.GetRasterBand(1)
    band.WriteArray(interior.astype('uint8'))
    vector = ogr.GetDriverByName('Memory').CreateDataSource('')
    layer = vector.CreateLayer('cells', geom_type=ogr.wkbPolygon)
    gdal.Polygonize(band, band, layer, -1, [])
    return unary_union([from_wkb(bytes(f.geometry().ExportToWkb())).buffer(0) for f in layer])


def lakes_and_rivers(cache, identifier, bounds, download):
    ext = box(*bounds).buffer(.001, join_style='mitre').bounds
    oceans, fresh, possible = [], [], []
    for number in [9, 12]:
        query = dict(geometry=','.join(f'{c:.6f}' for c in ext), geometryType='esriGeometryEnvelope',
                     inSR=4326, spatialRel='esriSpatialRelIntersects', outSR=4326,
                     outFields='PERMANENT_IDENTIFIER,FDATE,GNIS_NAME,FTYPE,FCODE', f='geojson', returnGeometry='true')
        url = f'{NHD}/{number}/query?' + urlencode(query)
        document = json.loads(load(cache, f'{identifier}-{number}.geojson',
                                   (lambda: get(url)) if download else None))
        if document.get('exceededTransferLimit') or document['type'] != 'FeatureCollection':
            raise ValueError(f'Incomplete USGS hydrography response: {identifier}')
        for feature in document['features']:
            geom = shape(feature['geometry']).intersection(box(*ext))
            ftype = feature['properties']['FTYPE']
            if ftype == 445:
                oceans.append(geom)
            elif ftype in (390, 436, 460):
                fresh.append(geom)
            else:
                # Foreshore, marsh etc. do not certify an addressable land surface.
                possible.append(geom)
    return unary_union(oceans), unary_union(fresh), unary_union(possible)


def polygons(geometry):
    if geometry.is_empty:
        return []
    if geometry.geom_type == 'Polygon':
        return [geometry]
    if geometry.geom_type in ('GeometryCollection', 'MultiPolygon'):
        return [p for part in geometry.geoms for p in polygons(part)]
    return []


def physical(geometry):
    # Round physical data to ~0.1 mm before clipping owners; retain original
    # unrounded coordinates on the international line for exact boundary tests.
    return set_precision(set_precision(geometry, 1e-9), 0).simplify(1e-12)


def records(geometry, **tags):
    result = []
    for part in sorted(polygons(geometry), key=lambda p: p.bounds):
        p = normalize(part)
        if not p.is_valid:
            raise ValueError('Invalid output polygon')
        result.append(dict(**tags, bbox=list(p.bounds),
                           rings=[list(r.coords) for r in (p.exterior, *p.interiors)]))
    return result


def window(cache, region, border, download):
    key, name, bounds, us, mx = region
    frame = box(*bounds).buffer(.0005, join_style='mitre')
    width, height, affine, tile, download_tile = grid(bounds)
    array = np.frombuffer(load(cache, key + '.bin', download_tile if download else None),
                          dtype='uint8').reshape(height, width)
    land = positive_cells(np.isin(array, [10, 20, 30, 40, 50, 60]), affine)
    water = positive_cells(array == 80, affine).intersection(frame)
    ocean, inland, other = lakes_and_rivers(cache, key, bounds, download)
    land = physical(land.intersection(frame).difference(unary_union([ocean, inland, other])))
    # Only mark continental land connected to the surrounding local mainland.
    # Isolated patches in a river or enclosed by uncertain shore data stay open.
    land = unary_union([p for p in polygons(land) if p.distance(frame.boundary) < 2e-9])
    ocean = physical(ocean.intersection(water)) if not ocean.is_empty and not water.is_empty else Polygon()
    inland = physical(inland.intersection(water)) if not inland.is_empty and not water.is_empty else Polygon()
    cuts = [line.intersection(frame) for line in border if line.intersects(frame)]
    areas = list(polygonize(unary_union([frame.boundary, *cuts])))
    owners = []
    if len(areas) != 2:
        raise ValueError(f'{key}: expected a complete crossing through the window')
    assigned = set()
    for code, anchor in [('US', us), ('MX', mx)]:
        choices = [i for i, area in enumerate(areas) if area.contains(Point(anchor))]
        if len(choices) != 1 or choices[0] in assigned or not land.contains(Point(anchor)):
            raise ValueError(f'{key}: independent {code} control failed')
        assigned.add(choices[0])
        owners += records(areas[choices[0]].intersection(land), code=code)
    if any(p.intersection(q).area > 1e-16 for p, q in ((land, ocean), (land, inland), (inland, ocean))):
        raise ValueError(f'{key}: contradictory physical evidence')
    return dict(id=key, name=name, bbox=bounds, source='us-mx-ca-review+' + key,
                version='USIBWC US_MexicoIB; USGS NHD high resolution (retired 2023); ESA WorldCover v200 (2021)',
                attribution=CREDIT, evidenceUrls=[IBC, IBC + '/metadata', f'{NHD}/9', f'{NHD}/12', tile,
                'https://doi.org/10.5281/zenodo.7254221', 'https://creativecommons.org/licenses/by/4.0/'],
                **({'oceanRegion': 'NEPC'} if key == 'pacific-terminus' else {}),
                land=records(land, kind='mainland'),
                water=records(ocean, kind='ocean') + records(inland, kind='inland'), owners=owners)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--output', type=Path, default=ROOT / 'src/data/usMexicoReviewed.json')
    args = parser.parse_args()
    args.input_directory.mkdir(parents=True, exist_ok=True)
    data = load(args.input_directory, 'ibwc-official.geojson',
                (lambda: get(IBC_QUERY)) if args.download else None)
    border = [shape(feature['geometry']) for feature in json.loads(data)['features']]
    windows = [window(args.input_directory, region, border, args.download) for region in REGIONS]
    args.output.write_text(json.dumps({'windows': windows}, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
