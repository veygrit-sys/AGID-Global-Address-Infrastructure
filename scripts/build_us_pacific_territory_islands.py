#!/usr/bin/env python3
"""Build surveyed US Pacific territory islands. Requires GDAL, NumPy and Shapely 2."""
import argparse
from importlib import import_module
from math import floor
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.request import urlopen
import json

import numpy as np
from osgeo import gdal, ogr
from shapely import from_wkb, make_valid, union_all
from shapely.geometry import Point, Polygon, box

geo = import_module('build-northern-central-america-review')
shore = import_module('build-us-canada-shorelines')
read_raster = import_module('build-south-america-andes').read_raster
ROOT = Path(__file__).resolve().parents[1]
CENSUS = 'https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/'
ESA = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com'
SHORE_SHA = '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41'
# Each surveyed census window lies entirely within one offshore territory and WorldCover tile.
# The control selects a closed island from the water topology, irrespective of the county extent.
SITES = [
    ('cocos', 'Cocos Island (Dåno′)', 'GU', 'NPAC', '66010', [144.640,13.230,144.663,13.246],
     (144.651734,13.238083), 'https://dpr.guam.gov/park-listing/',
     '63a28e9a800a6f2b5083f562185fd4bb9282e705c699653df915ddc07b17a9a8',
     '3125a04efc98cad45e7afbd3aa9806d1f6ac2bcf0985757dd98f49bd9cea9514',
     '1dec7c86dbf798cdd490f0a3e86ee9daa98d901e539d61e52aa2b866fd6c4e35'),
    ('managaha', 'Mañagaha Island', 'MP', 'PHLS', '69110', [145.706,15.236,145.719,15.247],
     (145.712561,15.241543), 'https://dlnr.cnmi.gov/marine-protected-areas-gis-map-layers.html',
     '79ffc8fd998d1b7c3b06901962003c41503c605182edc9b78efb616b0dbebdaa',
     'caf63877517358129e2ca89b21e9fde9f795356632b0699cdc87a3bb222f972c',
     'ed7497bb9a302d408f962e1924c62cc19214bc897548d20ca6173bda84476213'),
    ('aunuu', 'Aunuʻu Island', 'AS', 'SEPC', '60010', [-170.565,-14.293,-170.544,-14.275],
     (-170.553323,-14.283748), 'https://www.nps.gov/subjects/nnlandmarks/nnl-site-designations.htm',
     '6719d2322b7ac7438b3e141cd83f0b9d706f2dbadf4b5c2115510299e19efb7c',
     '6bddf024fcac2ff05ce755082d0b4c0ce4ec1f8447e6ab547eee9b46805b94fd',
     '5e3046f8d39c70a99fffbc0021d60a5f8411b3d7b9f9fe9d9e02674a79fa7d8a'),
]
DEM = ('https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N28_00_W178_00_DEM/'
       'Copernicus_DSM_COG_10_N28_00_W178_00_DEM.tif')
OCC = 'https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/occurrence_180W_30Nv1_4_2021.tif'


def census_archive(code, digest, directory, download):
    path = directory / f'tl_2025_{code}_areawater.zip'
    url = CENSUS + path.name
    if download and not path.exists():
        with NamedTemporaryFile(dir=directory, delete=False) as tmp:
            temporary = Path(tmp.name)
        try:
            with urlopen(url, timeout=60) as response:
                temporary.write_bytes(response.read())
            geo.check(temporary, digest)
            temporary.replace(path)
        finally:
            temporary.unlink(missing_ok=True)
    geo.check(path, digest)
    return path, url


def core(geom, margin):
    # Retain the interior of the positive evidence when simplifying pixel stair-steps.
    inside = geom.buffer(-margin, join_style='mitre')
    return inside.simplify(margin / 2).intersection(inside)


def census_window(site, args):
    key, name, code, basin, county, bounds, pin, local_source, checksum, first, second = site
    extent = geo.padded(bounds)
    frame = box(*extent)
    archive, url = census_archive(county, checksum, args.input_directory, args.download)
    data = ogr.Open('/vsizip/' + str(archive.resolve()))
    layer = data.GetLayer()
    transform = shore.wgs_transform(layer)
    layer.SetAttributeFilter("MTFCC IN ('H2053','H2051')")
    marine = union_all([make_valid(shore.to_wgs(f.geometry(), transform)) for f in layer])
    # County water features can divide lagoons into adjacent parts. Union them before finding holes.
    island, = [Polygon(r) for g in geo.polygons(marine) for r in g.interiors if Polygon(r).contains(Point(pin))]
    layer.SetAttributeFilter("MTFCC IN ('H2030','H2040')")
    lakes = union_all([make_valid(shore.to_wgs(f.geometry(), transform)).intersection(frame) for f in layer])
    x, y = 3 * floor(extent[0]/3), 3 * floor(extent[1]/3)
    tile = f'{"N" if y >= 0 else "S"}{abs(y):02}{"E" if x >= 0 else "W"}{abs(x):03}'
    urls, rasters = [], []
    for year, version, digest in [(2020,'v100',first), (2021,'v200',second)]:
        source = f'{ESA}/{version}/{year}/map/ESA_WorldCover_10m_{year}_{version}_{tile}_Map.tif'
        rasters.append(read_raster(source, extent, digest, args.raster_directory))
        urls.append(source)
    (a, grid), (b, grid_b) = rasters
    if grid != grid_b:
        raise ValueError(f'Incompatible WorldCover grids for {name}')
    dry_classes = [10,20,30,40,50,60]
    land = geo.raster_mask(np.isin(a,dry_classes) & np.isin(b,dry_classes), grid)
    water = geo.raster_mask((a == 80) & (b == 80), grid)
    dry = core(island.intersection(frame).intersection(land).difference(lakes), grid[1])
    ocean = core(marine.intersection(frame).intersection(water), grid[1])
    inland = core(lakes.intersection(island).intersection(water), grid[1])
    if dry.is_empty or ocean.is_empty or dry.intersection(ocean.union(inland)).area:
        raise ValueError(f'Invalid mutually corroborated land and water at {name}')
    return dict(id='us-territory-'+key, name=name, bbox=bounds, oceanRegion=basin,
                source='us-pacific-islands+tiger2025+'+key, version='TIGER/Line 2025; ESA WorldCover 2020 v100 and 2021 v200',
                attribution='U.S. Census Bureau, TIGER/Line 2025 Area Hydrography. '+geo.WC_CREDIT,
                evidenceUrls=[url, local_source, *urls], land=geo.pack(dry, kind='island', name=name),
                owners=geo.pack(dry, code=code, sovereignCode='US'),
                water=geo.pack(ocean, kind='ocean') + geo.pack(inland, kind='inland'))


def midway(args):
    bounds = [-177.390,28.190,-177.305,28.225]
    extent = geo.padded(bounds)
    frame = box(*extent)
    # WorldCover has no tile here. Independent elevation and water history resolve atoll interiors.
    height, grid = read_raster(DEM, extent, 'abaf9bba839c1f97110785179720a41cff2d806eace63c84ebf19cd1bb59727b', args.raster_directory)
    frequency, freq_grid = read_raster(OCC, extent, '4d552f98ab2afbda26ff61ffd60b2ccaf2e08775712c95e26848e1bbe0b0bbc6', args.raster_directory)
    raised = geo.raster_mask(np.isfinite(height) & (height >= 2), grid)
    low = geo.raster_mask(np.isfinite(height) & (np.abs(height) <= 0.5), grid)
    dry_history = geo.raster_mask(frequency <= 10, freq_grid)
    wet_history = geo.raster_mask((frequency >= 90) & (frequency <= 100), freq_grid)
    geo.check(args.gshhg_archive, SHORE_SHA)
    ds = ogr.Open('/vsizip/'+str(args.gshhg_archive.resolve())+'/GSHHS_shp/f/GSHHS_f_L1.shp')
    layer = ds.GetLayer()
    layer.SetSpatialFilterRect(*extent)
    outlines = {int(f['id']): make_valid(from_wkb(bytes(f.geometry().ExportToWkb()))).intersection(frame) for f in layer}
    land, owners = [], []
    for identifier, name in [(8654,'Sand Island'), (16862,'Eastern Island')]:
        dry = core(outlines[identifier].intersection(raised).intersection(dry_history), 0.00014)
        if dry.is_empty:
            raise ValueError(f'No substantiated interior for {name}')
        land.extend(geo.pack(dry, kind='island', name=name))
        owners.extend(geo.pack(dry, code='UM', sovereignCode='US'))
    water = core(low.intersection(wet_history).intersection(frame).difference(union_all(list(outlines.values()))), 0.00014)
    if water.is_empty:
        raise ValueError('No independently mapped lagoon water')
    return dict(id='us-territory-midway', name='Midway Atoll', bbox=bounds, oceanRegion='NEPC',
                source='us-pacific-islands+midway', version='GSHHG 2.3.7; JRC GSW occurrence v1.4; Copernicus GLO-30 Public',
                attribution=import_module('build-south-america-offshore').BR_CREDIT,
                evidenceUrls=['https://www.soest.hawaii.edu/pwessel/gshhg/', OCC, DEM,
                              'https://www.fws.gov/locations/midway-atoll-national-wildlife-refuge',
                              'https://service.unece.org/trade/locode/um.htm'],
                land=land, owners=owners, water=geo.pack(water, kind='ocean'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input_directory', type=Path)
    parser.add_argument('--download', action='store_true', help='Fetch checksum-pinned Census archives')
    parser.add_argument('--gshhg-archive', required=True, type=Path)
    parser.add_argument('--raster-directory', type=Path, help='Read local raster originals instead of HTTPS byte ranges')
    parser.add_argument('--output', type=Path, default=ROOT/'src/data/usPacificTerritoriesReviewed.json')
    args = parser.parse_args()
    args.input_directory.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    windows = [census_window(site, args) for site in SITES] + [midway(args)]
    args.output.write_text(json.dumps({'windows':windows}, ensure_ascii=False, separators=(',',':'))+'\n')


if __name__ == '__main__':
    main()
