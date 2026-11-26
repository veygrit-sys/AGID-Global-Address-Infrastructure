#!/usr/bin/env python3
"""Build five local Costa Rica, Nicaragua and Panama evidence windows.

Requires Python 3.11+, NumPy, GDAL 3 and Shapely 2. Supply the FieldMaps
USGS/LSIB 2025-07-29 GeoPackage and full-resolution GSHHG 2.3.7 ZIP.
The input directory contains the five raster tiles and the cri_admin0.*
shapefile extracted from OCHA's Costa Rica COD-AB; see source URLs below.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from osgeo import gdal, ogr
import shapely
from shapely.geometry import box

gdal.UseExceptions()
ogr.UseExceptions()
ROOT = Path(__file__).resolve().parents[1]
ESA_URL = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/'
JRC_URL = 'https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/'
COD_URL = 'https://data.humdata.org/dataset/cod-ab-cri'
FIELDMAPS_URL = 'https://fieldmaps.io/data/adm0/'
GSHHG_URL = 'https://www.soest.hawaii.edu/pwessel/gshhg/'
WC = 'ESA_WorldCover_10m_2021_v200_{}_Map.tif'
OCC = 'occurrence_90W_{}Nv1_4_2021.tif'
DIGESTS = {
    WC.format('N06W084'): '9aa2bb62f2939af444ee641414d61452a32ed5960c24f04e6d23c8122f618150',
    WC.format('N09W084'): 'db9ad89166fd62e84f90a6d81f61e6fa083bab6ee508ba547cce57ceb76a9ec3',
    WC.format('N09W087'): '3974a6ef5996be3e63b1327e46e2df9bce6f3007676dda0e2d2605f2ecb74376',
    OCC.format(10): 'b0b28cddc47ec29110cf6b9c1023980c2dd01c66a06d511c478a369fb49b1894',
    OCC.format(20): '647db9cbc52d55c6cad5199a66a715499a4f4b869482144cf3f44a2770f13869',
    'cri_admin0.shp': '1a2a8be8067a96ca487fa02c407afe9e4ec9551db4816cf2f6a5efc17eaa8ee3',
    'cri_admin0.shx': '92e34f4c29df7ef5932fd507d8312f613af317959fde9aca8f2851d5e4fe06ff',
    'cri_admin0.dbf': '7b19a5eda7c15a5810509a98d854e0cf1431711a2dd544618e1675314f5ba017',
    'cri_admin0.prj': 'a02a27b1d1982c8516d83398e85a3c8b1aef1713c13ef4d84d7bde17430c07c4',
}
# Only these particular physical island IDs are named. Bounds index evidence;
# all surface and administrative assertions require an actual source polygon.
WINDOWS = (
    ('paso-canoas', 'Paso Canoas', [-82.847, 8.527, -82.834, 8.541], ('CR', 'PA'), {}),
    ('sixaola-guabito', 'Sixaola–Guabito', [-82.6215, 9.492, -82.606, 9.508], ('CR', 'PA'), {}),
    ('penas-blancas', 'Peñas Blancas', [-85.620, 11.207, -85.603, 11.222], ('CR', 'NI'), {}),
    ('moyogalpa', 'Moyogalpa, Ometepe', [-85.707, 11.530, -85.690, 11.548], ('NI',), {187188: 'Ometepe'}),
    ('bocas-del-toro', 'Bocas del Toro', [-82.254, 9.331, -82.231, 9.346],
     ('PA',), {1914: 'Isla Colón', 18759: 'Isla Carenero'}),
)


def verify(path, digest):
    with path.open('rb') as source:
        if hashlib.file_digest(source, 'sha256').hexdigest() != digest:
            raise ValueError(f'Unexpected source edition: {path.name}')


def polygons(geometry):
    if geometry.is_empty:
        return
    if geometry.geom_type == 'Polygon':
        yield geometry
    elif geometry.geom_type in ('MultiPolygon', 'GeometryCollection'):
        for part in geometry.geoms:
            yield from polygons(part)


def records(geometry, **attributes):
    # All overlay classes use the same ~1 cm precision. Keep interior holes.
    result = []
    for part in sorted(polygons(shapely.normalize(shapely.set_precision(geometry, 1e-7))),
                       key=lambda p: p.bounds):
        rings = [part.exterior, *part.interiors]
        result.append(dict(**attributes, bbox=[round(v, 7) for v in part.bounds],
                           rings=[[[round(x, 7), round(y, 7)] for x, y in r.coords] for r in rings]))
    return result


def read_raster(path, bounds):
    ds = gdal.Open(str(path))
    if ds.GetSpatialRef().GetAuthorityCode(None) != '4326':
        raise ValueError('Expected WGS84 raster')
    x, dx, _, y, _, dy = ds.GetGeoTransform()
    west, south, east, north = bounds
    col, row = math.floor((west-x)/dx), math.floor((north-y)/dy)
    end_col, end_row = math.ceil((east-x)/dx), math.ceil((south-y)/dy)
    return (ds.ReadAsArray(col, row, end_col-col, end_row-row),
            (x + dx*col, dx, 0, y + dy*row, 0, dy))


def mask_shape(mask, transform):
    height, width = mask.shape
    ds = gdal.GetDriverByName('MEM').Create('', width, height, 1, gdal.GDT_Byte)
    ds.SetGeoTransform(transform)
    band = ds.GetRasterBand(1)
    band.WriteArray(mask.astype(np.uint8))
    vectors = ogr.GetDriverByName('Memory').CreateDataSource('')
    layer = vectors.CreateLayer('mask')
    gdal.Polygonize(band, band, layer, -1, [])
    parts = [part for f in layer
             for part in polygons(shapely.make_valid(shapely.from_wkb(bytes(f.geometry().ExportToWkb()))))]
    return shapely.union_all(parts, grid_size=1e-7).buffer(0)


def clipped_parts(geometry, bounds):
    if geometry.GetGeometryName() == 'MULTIPOLYGON':
        for part in geometry:
            yield from clipped_parts(part, bounds)
        return
    w, e, s, n = geometry.GetEnvelope()
    west, south, east, north = bounds
    if w <= east and west <= e and s <= north and south <= n:
        local = shapely.clip_by_rect(shapely.from_wkb(bytes(geometry.ExportToWkb())), *bounds)
        yield shapely.make_valid(local)


def read_parts(path, bounds, where=None, layer_name=None):
    ds = ogr.Open(str(path))
    layer = ds.GetLayerByName(layer_name) if layer_name else ds.GetLayer()
    if where:
        layer.SetAttributeFilter(where)
    layer.SetSpatialFilterRect(*bounds)
    return shapely.union_all([part for f in layer for part in clipped_parts(f.geometry(), bounds)])


def island_footprints(archive, bounds, identifiers):
    found = {}
    for level in (1, 3):
        ds = ogr.Open(f'/vsizip/{archive.resolve()}/GSHHS_shp/f/GSHHS_f_L{level}.shp')
        layer = ds.GetLayer()
        layer.SetSpatialFilterRect(*bounds)
        for f in layer:
            gid = int(f['id'].split('-')[0])
            if gid in identifiers:
                found[gid] = shapely.union_all(list(clipped_parts(f.geometry(), bounds)))
    if found.keys() != identifiers.keys():
        raise ValueError('Expected physical island is missing')
    return found


def build_window(inputs, fieldmaps, shores, spec):
    key, name, bbox, codes, islands = spec
    west, south, east, north = bbox
    bounds = [west-.001, south-.001, east+.001, north+.001]
    frame = box(*bounds)
    wc_file = WC.format(f'N{3*math.floor(south/3):02}W{abs(3*math.floor(west/3)):03}')
    occ_file = OCC.format(10*math.ceil(north/10))
    wc, wgt = read_raster(inputs / wc_file, bounds)
    occ, ogt = read_raster(inputs / occ_file, bounds)
    # Retain surveyed permanent water that recurred in the Landsat archive.
    # Wetlands, mangrove, unclassified shore, and shifting channels can stay
    # unresolved. A water observation never grants an administrative country.
    dry = mask_shape(np.isin(wc, [10, 20, 30, 40, 50, 60]), wgt)
    dry = dry.difference(mask_shape((occ > 10) & (occ <= 100), ogt)).intersection(frame)
    permanent = mask_shape(wc == 80, wgt).intersection(frame).buffer(0)
    water = permanent.intersection(mask_shape((occ >= 50) & (occ <= 100), ogt))
    land, water_kind = [], 'inland'
    urls = [ESA_URL + wc_file, JRC_URL + occ_file, FIELDMAPS_URL]
    version = 'ESA WorldCover 2021 v200; JRC Global Surface Water v1.4 1984–2021; FieldMaps USGS/LSIB 2025-07-29'
    credit = ('© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by '
              'ESA WorldCover consortium (CC BY 4.0). Source: EC JRC/Google. Pekel et al., Nature 2016, '
              'doi:10.1038/nature20584. FieldMaps USGS/LSIB (public domain).')
    if islands:
        mapped = island_footprints(shores, bounds, islands)
        accepted = []
        if key == 'moyogalpa':
            # This window is entirely within Lake Nicaragua, on the west side
            # of its island Ometepe. The old GSHHG shore cuts through the town.
            # Identify the island from the connected modern dry component that
            # overlaps its mapped interior. Require observed low water
            # occurrence too; JRC no-data is insufficient for this extension.
            lake_path = f'/vsizip/{shores.resolve()}/GSHHS_shp/f/GSHHS_f_L2.shp'
            lake = read_parts(lake_path, bounds, "id='180524'")
            if frame.difference(lake).area > 1e-12:
                raise ValueError('Moyogalpa window must fall wholly within the mapped lake')
            dry = dry.intersection(mask_shape(occ <= 10, ogt))
            candidates = [p for p in polygons(dry) if p.intersection(mapped[187188]).area > 0]
            if len(candidates) != 1:
                raise ValueError('Ambiguous physical identity at Moyogalpa')
            dry = candidates[0]
        for gid, polygon in mapped.items():
            agreed = dry if key == 'moyogalpa' else dry.intersection(polygon)
            land.extend(records(agreed, kind='island', name=islands[gid]))
            accepted.append(agreed)
        dry = shapely.union_all(accepted)
        # Coastal ocean cells are commonly excluded from the inland JRC
        # product. Here WorldCover water must also be seaward of BOTH the
        # GSHHG island polygons and all FieldMaps land in this coastal window.
        if key == 'bocas-del-toro':
            admin = read_parts(fieldmaps, bounds, layer_name='adm0_polygons')
            water = permanent.difference(admin)
            water_kind = 'ocean'
            water = water.difference(shapely.union_all(list(mapped.values())))
        version += '; GSHHG full 2.3.7'
        credit += ' GSHHG © Paul Wessel and Walter H. F. Smith, LGPL-3.0-or-later.'
        urls.append(GSHHG_URL)
    else:
        # Ignore detached raster speckles on the river. A mainland component
        # has to reach outside the local frame.
        dry = shapely.union_all([p for p in polygons(dry) if p.intersects(frame.boundary)])
        land = records(dry, kind='mainland')
    owners = []
    cr = None
    if 'CR' in codes:
        cr = read_parts(inputs / 'cri_admin0.shp', bounds, "iso2='CR'")
        if cr.is_empty:
            raise ValueError('Missing Costa Rica national boundary')
        version += '; Costa Rica COD-AB v01 (2022 geometry, 2024 review)'
        credit += ' Costa Rica National Statistics Office and OCHA FIS/HDX, CC BY 3.0 IGO; modified.'
        urls.append(COD_URL)
    for code in codes:
        admin = read_parts(fieldmaps, bounds, f"iso_2='{code}' AND status_nm='State'", 'adm0_polygons')
        if cr is not None:
            admin = admin.intersection(cr) if code == 'CR' else admin.difference(cr)
        owners.extend(records(admin.intersection(dry), code=code))
    if not land or set(codes) != {p['code'] for p in owners} or water.intersection(dry).area > 1e-14:
        raise ValueError(f'Incomplete or overlapping evidence in {key}')
    return dict(id=key, name=name, bbox=bbox, source='us-mx-ca-review+'+key,
                version=version, attribution=credit, evidenceUrls=urls,
                land=land, water=records(water, kind=water_kind), owners=owners,
                **({'oceanRegion': 'CARB'} if water_kind == 'ocean' else {}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('inputs', type=Path)
    parser.add_argument('--fieldmaps-gpkg', required=True, type=Path)
    parser.add_argument('--gshhg-archive', required=True, type=Path)
    parser.add_argument('--output', type=Path, default=ROOT/'src/data/southernCentralAmericaReviewed.json')
    args = parser.parse_args()
    verify(args.fieldmaps_gpkg, '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9')
    verify(args.gshhg_archive, '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41')
    for filename, digest in DIGESTS.items():
        verify(args.inputs/filename, digest)
    windows = [build_window(args.inputs, args.fieldmaps_gpkg, args.gshhg_archive, spec) for spec in WINDOWS]
    args.output.write_text(json.dumps({'windows': windows}, ensure_ascii=False, separators=(',', ':')) + '\n')
