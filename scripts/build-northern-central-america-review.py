#!/usr/bin/env python3
"""Extract northern Central American island, shoreline, riverbank and tripoint geometry.

Requires Python 3.11+, GDAL, NumPy and Shapely 2. Uses pinned FieldMaps and
GSHHG releases plus checksum-verified pixel windows from the public WorldCover
COGs. Pass --worldcover-directory to use already downloaded COGs offline.
"""
import argparse
from hashlib import file_digest, sha256
import json
from math import ceil, floor
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
import shapely
from shapely.geometry import Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
FM_SHA = '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'
GSHHG_SHA = '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41'
FM_URL = 'https://fieldmaps.io/data/adm0/'
GSHHG_URL = 'https://www.soest.hawaii.edu/pwessel/gshhg/'
WC_URL = 'https://esa-worldcover.org/en/data-access'
ICJ = 'https://api.icj-cij.org/sites/default/files/case-related/75/6673.pdf'
FM_CREDIT = 'FieldMaps international ADM0, USGS/LSIB (2025-07-29).'
WC_CREDIT = ('Contains modified Copernicus Sentinel data (2020, 2021) processed by the ESA WorldCover consortium. '
             'ESA WorldCover 2020 v100 and 2021 v200, CC BY 4.0; adapted to retain surface agreement.')
WORLDCOVER = {
    'st-georges-caye': ("St George’s Caye", [-88.0750, 17.5520, -88.0690, 17.5580], 'island', 'ocean',
        [('BZ', -88.07182279, 17.55545726)],
        ['https://www.nationalassembly.gov.bz/wp-content/uploads/2023/09/Constitution-of-Belize-as-of-7-Nov.-2022.pdf',
         'https://belizereferendum.gov.bz/files/March%2030%202001%20Guatemala%27s%20presentation.pdf',
         'https://services.arcgis.com/dVL5xxth19juhrDY/ArcGIS/rest/services/STGC_Vector/FeatureServer']),
    'flores': ('Isla de Flores / Lago Petén Itzá', [-89.898, 16.9287, -89.8865, 16.934], 'island', 'inland',
        [('GT', -89.8913, 16.93)], ['https://muniflorespeten.gob.gt/wp-content/uploads/2025/01/ML24-MFP.pdf']),
    'suchiate': ('Río Suchiate / Ciudad Hidalgo–Tecún Umán', [-92.1505, 14.6782, -92.142, 14.685], 'mainland', 'inland',
        [('MX', -92.1495, 14.681), ('GT', -92.1435, 14.681)],
        ['https://www.gob.mx/sre/acciones-y-programas/cruces-fronterizos-entre-mexico-y-guatemala']),
    'trifinio': ('El Trifinio / Montecristo', [-89.367, 14.409, -89.3445, 14.43], 'mainland', 'inland',
        [('GT', -89.364, 14.427), ('SV', -89.36, 14.411), ('HN', -89.348, 14.424)],
        [ICJ, 'https://www.plantrifinio.int/donde-estamos/']),
}
# Digests of the unmodified source pixel bytes at each padded grid extent.
PIXEL_SHA = {
    'st-georges-caye': (
        'c5757c93da2f359349240fae7416aa1b57a84abfa167ea86ea9b95c4a82cffc8',
        '93739b5eac5b1a1c9f04a488f49612691a38a1e1337799a5ff443c473a175885'),
    'flores': (
        '267297b42f84711e0aced253f2a1d9733fdd03e34165fb754953d9dc57383729',
        '4a90c18ba44edf81da4d5375af43916a5342559f687b98a503990a5672f919a5'),
    'suchiate': (
        'ccf4733e44be858c0c7afe2730b245fba7b220dea1e008a2f5235b5e1e702f8a',
        '2df7a75a6cba7741ab8ec91160adfcff3fdb0a3c4b84f6a0f94bbb7e26c9e3c1'),
    'trifinio': (
        'ee1af0a42d6cedddfdf02821ca4d2a42b6ffb354437d2cff06cf062834f98def',
        'ae8dae1a49e0a248b03d14be1db5ede7ac2ccd7f5f1f39925dc3bfd18efaa205'),
}
GULF = [-87.732, 13.155, -87.608, 13.301]
GULF_ISLANDS = {
    3375: ('El Tigre', 'HN', (-87.633, 13.274)),
    4101: ('Meanguera', 'SV', (-87.704, 13.1836)),
    31541: ('Meanguerita', 'SV', (-87.685348, 13.172639)),
}


def check(path, digest):
    with path.open('rb') as f:
        if file_digest(f, 'sha256').hexdigest() != digest:
            raise ValueError(f'Unexpected edition: {path}')


def polygons(geom):
    if geom.is_empty:
        return []
    if geom.geom_type == 'Polygon':
        return [geom]
    if geom.geom_type in ('MultiPolygon', 'GeometryCollection'):
        return [p for part in geom.geoms for p in polygons(part)]
    return []


def pack(geom, **attributes):
    geom = shapely.set_precision(geom, 1e-7)
    records = []
    for p in sorted(polygons(geom), key=lambda p: p.bounds):
        p = shapely.normalize(p)
        rings = [[[round(x, 7), round(y, 7)] for x, y in ring.coords]
                 for ring in (p.exterior, *p.interiors)]
        records.append(dict(**attributes, bbox=[round(x, 7) for x in p.bounds], rings=rings))
    return records


def padded(bounds):
    w, s, e, n = bounds
    return (w-.0005, s-.0005, e+.0005, n+.0005)


def owners_in_window(ds, extent):
    layer = ds.GetLayerByName('adm0_polygons')
    layer.SetSpatialFilterRect(*extent)
    frame = box(*extent)
    countries = {}
    for f in layer:
        polygon = shapely.from_wkb(bytes(f.geometry().ExportToWkb())).intersection(frame)
        if not polygon.area:
            continue
        if f['status_nm'] != 'State' or f['iso_2'] in countries:
            raise ValueError(f'Unexpected political feature: {f["adm0_name"]}')
        countries[f['iso_2']] = polygon
    return countries


def raster_mask(mask, geotransform):
    ds = gdal.GetDriverByName('MEM').Create('', mask.shape[1], mask.shape[0], 1, gdal.GDT_Byte)
    ds.SetGeoTransform(geotransform)
    band = ds.GetRasterBand(1)
    band.WriteArray(mask.astype('uint8'))
    shapes = ogr.GetDriverByName('Memory').CreateDataSource('')
    layer = shapes.CreateLayer('mask', geom_type=ogr.wkbPolygon)
    gdal.Polygonize(band, band, layer, -1, [])
    return unary_union([shapely.make_valid(shapely.from_wkb(bytes(f.geometry().ExportToWkb()))) for f in layer])


def raster_surfaces(key, bounds, local_dir):
    west, south, east, north = padded(bounds)
    tile_x, tile_y = 3 * floor(west / 3), 3 * floor(south / 3)
    tile = f'N{tile_y:02}W{abs(tile_x):03}'
    x0, x1 = floor((west-tile_x)*12000), ceil((east-tile_x)*12000)
    y0, y1 = floor((tile_y+3-north)*12000), ceil((tile_y+3-south)*12000)
    data, urls = [], []
    for year, version in [(2020, 'v100'), (2021, 'v200')]:
        name = f'ESA_WorldCover_10m_{year}_{version}_{tile}_Map.tif'
        url = f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{version}/{year}/map/{name}'
        urls.append(url)
        ds = gdal.Open(str(local_dir / name) if local_dir else '/vsicurl/' + url)
        transform = ds.GetGeoTransform()
        if ds.GetSpatialRef().GetAuthorityCode(None) != '4326' or not np.allclose(
                transform, (tile_x, 1/12000, 0, tile_y+3, 0, -1/12000), rtol=0, atol=1e-15):
            raise ValueError(f'Unexpected WorldCover pixel grid: {name}')
        a = ds.GetRasterBand(1).ReadAsArray(x0, y0, x1-x0, y1-y0)
        digest = sha256(a.tobytes()).hexdigest()
        if digest != PIXEL_SHA[key][year-2020]:
            raise ValueError(f'Unexpected WorldCover source bytes: {name} / {key}')
        data.append(a)
    gt = (tile_x + x0/12000, 1/12000, 0, tile_y+3-y0/12000, 0, -1/12000)
    # Mangroves and herbaceous wetlands are not evidence of dry land. Open land
    # and permanent water have to agree in both annual classifications.
    dry_classes = [10, 20, 30, 40, 50, 60]
    dry = np.isin(data[0], dry_classes) & np.isin(data[1], dry_classes)
    wet = (data[0] == 80) & (data[1] == 80)
    return raster_mask(dry, gt), raster_mask(wet, gt), urls


def satellite_window(key, ds, local_dir):
    name, bounds, kind, water_kind, controls, urls = WORLDCOVER[key]
    dry, wet, tiles = raster_surfaces(key, bounds, local_dir)
    extent = padded(bounds)
    if kind == 'island':
        # At occupied shores, a 10 m pixel may contain both land and a pier.
        # Require an extra pixel of dry interior. The St George's result was
        # checked against 76 digitized docks from the 2017 coastal survey.
        dry = dry.buffer(-1/12000, join_style='mitre')
    anchored = {code: next(p for p in polygons(dry) if p.contains(Point(x, y)))
                for code, x, y in controls}
    # The Flores window stops north of the Santa Elena access causeway.
    # Exclude dry components with no control, including disconnected sandbars.
    confirmed = unary_union(list(anchored.values())).intersection(box(*extent))
    countries = {c for c, _, _ in controls}
    attrs = {'kind': kind}
    if kind == 'island':
        attrs['name'] = name.split(' / ')[0]
        # The island name and its country are corroborated by the cited primary
        # records. A generalized administrative coast can omit an entire island.
        owner_shapes = {next(iter(countries)): confirmed}
        version, credit, extra = '', '', []
    else:
        source_polys = owners_in_window(ds, extent)
        if countries != source_polys.keys():
            raise ValueError(f'Unexpected adjoining countries: {key}')
        # On a mobile river a generalized country line may cut the other
        # bank. Intersect each country only with the bank containing its own
        # independent control. At Trifinio all controls occupy the same land.
        owner_shapes = {code: geom.intersection(confirmed).intersection(anchored[code])
                        for code, geom in source_polys.items()}
        for code, x, y in controls:
            if not owner_shapes[code].contains(Point(x, y)):
                raise ValueError(f'Independent {code} bank or tripoint-side control is not assigned to {code}')
        version, credit, extra = '; FieldMaps USGS/LSIB 2025-07-29', ' ' + FM_CREDIT, [FM_URL]
    return dict(id=key, name=name, bbox=bounds, source='us-mx-ca-review+'+key,
                version='ESA WorldCover 2020 v100 and 2021 v200'+version, attribution=WC_CREDIT+credit,
                **({'oceanRegion': 'CARB'} if key == 'st-georges-caye' else {}),
                evidenceUrls=[WC_URL, *tiles, *extra, *urls], land=pack(confirmed, **attrs),
                water=pack(wet.intersection(box(*extent)), kind=water_kind),
                owners=[r for code, geom in sorted(owner_shapes.items()) for r in pack(geom, code=code)])


def gulf_window(fieldmaps, archive):
    extent = padded(GULF)
    frame = box(*extent)
    coast = ogr.Open(f'/vsizip/{archive.resolve()}/GSHHS_shp/f/GSHHS_f_L1.shp')
    layer = coast.GetLayer()
    layer.SetSpatialFilterRect(*extent)
    country_shapes = owners_in_window(fieldmaps, extent)
    if set(country_shapes) != {'HN', 'SV'}:
        raise ValueError('Unexpected Gulf jurisdictions')
    all_land, identified, owners = [], [], []
    included = set()
    for f in layer:
        poly = shapely.from_wkb(bytes(f.geometry().ExportToWkb())).intersection(frame)
        if not poly.area:
            continue
        all_land.append(poly)
        record_id = int(f['id'].split('-')[0])
        if record_id not in GULF_ISLANDS:
            continue
        name, code, anchor = GULF_ISLANDS[record_id]
        if not poly.contains(Point(anchor)) or not country_shapes[code].contains(Point(anchor)):
            raise ValueError(f'Gulf island control failed: {name}')
        included.add(record_id)
        # The judgment identifies the country of the whole island. At the shore,
        # only the overlap of the physical shoreline and second survey is issued.
        confirmed = poly.intersection(country_shapes[code])
        identified.extend(pack(confirmed, kind='island', name=name))
        owners.extend(pack(confirmed, code=code))
    if included != GULF_ISLANDS.keys():
        raise ValueError('Missing a court-identified island')
    wet = frame.difference(unary_union([*all_land, *country_shapes.values()]))
    return dict(id='fonseca-islands', name='Golfo de Fonseca', bbox=GULF,
                source='us-mx-ca-review+fonseca-islands', version='GSHHG 2.3.7; FieldMaps USGS/LSIB 2025-07-29; ICJ judgment 1992-09-11',
                attribution='GSHHG © Paul Wessel and Walter H. F. Smith. '+FM_CREDIT,
                oceanRegion='NEPC', evidenceUrls=[GSHHG_URL, FM_URL, ICJ], land=identified, water=pack(wet, kind='ocean'), owners=owners)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fieldmaps-gpkg', type=Path, required=True)
    parser.add_argument('--gshhg-archive', type=Path, required=True)
    parser.add_argument('--worldcover-directory', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'src/data/northernCentralAmericaReviewed.json')
    args = parser.parse_args()
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    check(args.fieldmaps_gpkg, FM_SHA)
    check(args.gshhg_archive, GSHHG_SHA)
    ds = ogr.Open(str(args.fieldmaps_gpkg))
    windows = [satellite_window(key, ds, args.worldcover_directory) for key in WORLDCOVER]
    windows.append(gulf_window(ds, args.gshhg_archive))
    args.output.write_text(json.dumps({'windows': windows}, ensure_ascii=False, separators=(',', ':'))+'\n')


if __name__ == '__main__':
    main()
