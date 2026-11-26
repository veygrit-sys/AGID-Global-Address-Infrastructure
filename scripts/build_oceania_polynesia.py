#!/usr/bin/env python3
"""Rebuild three central-Pacific atoll windows (Python 3.11+, GDAL, Shapely 2, NumPy).

Each cached raster subset is pinned together with its WGS84 affine transform.
--download reads native raster windows by HTTP range, including a two-cell halo
around the 15 arc-second bathymetry. PNG maps and gazetteer radii are not used.
"""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import ceil, floor
from pathlib import Path
from tempfile import NamedTemporaryFile

import numpy as np
from osgeo import gdal, ogr
from shapely import union_all
from shapely.geometry import Point, box

regional = import_module('build-northern-central-america-review')
core = import_module('build_us_pacific_territory_islands').core
OUTPUT = Path(__file__).resolve().parents[1] / 'src/data/oceaniaPolynesiaPolygonDetail.json'
SITES = {
    'funafala': ('Funafala, Funafuti', 'TV', 'SPAC', [179.089,-8.651,179.122,-8.617],
                 {'Funafala': [(179.10186,-8.62834), (179.099458,-8.63304)]}, (179.118,-8.647),
                 'https://openjicareport.jica.go.jp/pdf/12020657_02.pdf'),
    'kiritimati': ('Ronton (London), Kiritimati', 'KI', 'NEPC', [-157.503,1.973,-157.465,1.99],
                   {'Kiritimati': [(-157.476375,1.983625)]}, (-157.498,1.983),
                   'https://library.sprep.org/sites/default/files/92.pdf?fileId=159'),
    'tapuaetai': ('Tapuaetai, Aitutaki', 'CK', 'SEPC', [-159.745,-18.958,-159.689,-18.929],
                  {'Tapuaetai (One Foot Island)': [(-159.7346,-18.9376)],
                   'Tekopua': [(-159.728333,-18.932292)], 'Motukitiu': [(-159.732458,-18.948208)]}, (-159.695,-18.944),
                  'https://cookislands-data.sprep.org/system/files/CITP%20Annual%20Report%202013_combined.pdf'),
}
LAYERS = ('2020','2021','dem','etopo','gsw')
DIGESTS = {
    'funafala': (
        '97fb11a848be0c207ac6eabf0502d6627698f6d55a3983ef4c457f00fd409cf8',
        '7037569d74f2705948d8d7d916f6123994ee6e37d44ce3aa8d8c222c7c6741ae',
        'a462d885610261419ad1019e63c5684f9620a0276d2df68072cf2ff72c2fa35a',
        '7ea8608ca6454f55e504a74d409e60f48b6b3ae87dd848679522142ec722e292',
        '0986dbb37aa75674708adf384d6dcf573be9d85c48f0a59b518c92781e51f338'),
    'kiritimati': (
        '8269c97a745ca036bf377ce51ebc2690105ddaea904692cf8e8d7ec91d03868c',
        '51764f61c26be2a16a7000b2d9d22a7cbc643500542062ec41e2d1549d01e8cd',
        'a2175f9802f611218bca77e193878083ab6ca0a2559b41f2ba4384deacf0ac31',
        '6302a717db97a10f7bc7d3fbd3e0f31338a6dce6f2e595dab0b7cf8c5e929952',
        '68ddaeedae15a8e50f497129bc25ddba0fb53fc9595dc8da211a2d4daa92e513'),
    'tapuaetai': (
        '9807faf7109300cb78ac99241e5e49fca75cf819d038ecf81f1098a4247bc726',
        'bd3a0080b8b2f414581a78f74d322070a928ab42ffe90fc73e8f0872126a1e15',
        'af666388d95e5e02fe8cfb8f6fe7cf3bf135424eee20f1e7b69bba46550bc2a4',
        '289aa4928786bcd6454f2285a1f9a42e016fdc2af02c821fe3bf0e32e5d39159',
        '5c3025affc3dbd1a451a776287d3bde75bcd87dcadd46eb228b5751d2da7f11b'),
}
ETOPO = 'https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/15s/15s_surface_elev_gtif/'
GSW = 'https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/'
COPERNICUS = 'https://copernicus-dem-30m.s3.amazonaws.com/'


def tile(latitude, longitude):
    return f'{"S" if latitude<0 else "N"}{abs(latitude):02}{"E" if longitude>=0 else "W"}{abs(longitude):03}'


def sources(bounds):
    west, south, _, north = bounds
    wc = tile(3*floor(south/3),3*floor(west/3))
    urls = [f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{ed}/{y}/map/ESA_WorldCover_10m_{y}_{ed}_{wc}_Map.tif'
            for y, ed in ((2020,'v100'),(2021,'v200'))]
    loc = tile(floor(south),floor(west))
    dem = f'Copernicus_DSM_COG_10_{loc[:3]}_00_{loc[3:]}_00_DEM'
    topo = tile(15*ceil(north/15),15*floor(west/15))
    x, y = 10*floor(west/10), 10*ceil(north/10)
    gsw = f'{abs(x)}{"E" if x>=0 else "W"}_{abs(y)}{"N" if y>=0 else "S"}'
    return [*urls, COPERNICUS+dem+'/'+dem+'.tif', ETOPO+f'ETOPO_2022_v1_15s_{topo}_surface.tif',
            GSW+f'occurrence_{gsw}v1_4_2021.tif']


def subset(url, bounds, cache, digest, download):
    if cache.exists():
        with np.load(cache, allow_pickle=False) as local:
            values, grid = local['values'], tuple(local['grid'])
    else:
        if not download:
            raise FileNotFoundError(f'{cache} missing. Use --download to retrieve native pixels.')
        ds = gdal.Open('/vsicurl/'+url)
        x, dx, rx, y, ry, dy = ds.GetGeoTransform()
        if ds.GetSpatialRef().CloneGeogCS().GetAuthorityCode(None) != '4326' or rx or ry or dx<=0 or dy>=0:
            raise ValueError(f'Unexpected source georeferencing: {url}')
        west, south, east, north = bounds
        l, r = floor((west-x)/dx), ceil((east-x)/dx)
        t, b = floor((north-y)/dy), ceil((south-y)/dy)
        values = ds.GetRasterBand(1).ReadAsArray(l, t, r-l, b-t)
        grid = (x+l*dx,dx,0,y+t*dy,0,dy)
    stable = values.astype(values.dtype.newbyteorder('<'), copy=False)
    if sha256(stable.tobytes()+np.asarray(grid, dtype='<f8').tobytes()).hexdigest() != digest:
        raise ValueError(f'Unexpected pixel or grid edition: {url}')
    if not cache.exists():
        with NamedTemporaryFile(dir=cache.parent, delete=False) as stream:
            np.savez_compressed(stream, values=values, grid=grid)
            temporary = Path(stream.name)
        temporary.replace(cache)
    return values, grid


def build(key, cache, download):
    title, country, basin, bbox, labels, ocean_pin, study = SITES[key]
    bounds = regional.padded(bbox)
    frame = box(*bounds)
    urls = sources(bounds)
    data = []
    for layer, url, digest in zip(LAYERS, urls, DIGESTS[key], strict=True):
        w, s, e, n = bounds
        extent = (w-2/240,s-2/240,e+2/240,n+2/240) if layer == 'etopo' else bounds
        data.append(subset(url, extent, cache / f'{key}-{layer}.npz', digest, download))
    (early, grid), (late, later_grid), (dsm, d_grid), (z, bathy_grid), (gsw, h_grid) = data
    if grid != later_grid:
        raise ValueError(f'{title}: WorldCover grids differ')
    valid_dsm = np.isfinite(dsm) & (dsm > -300) & (dsm < 8500)
    # The low threshold locates connected relief for assigning names. Only
    # raised cores with two observations of vegetation/buildings can be owned.
    shells = regional.polygons(regional.raster_mask(valid_dsm & (dsm > .1), d_grid))
    raised = regional.raster_mask(valid_dsm & (dsm >= 2), d_grid)
    habitat = (10,20,30,40,50)
    landcover = regional.raster_mask(np.isin(early,habitat) & np.isin(late,habitat),grid)
    past_water = regional.raster_mask((gsw > 10) & (gsw <= 100),h_grid)
    land, owners = [], []
    dry = raised.intersection(landcover).difference(past_water).intersection(frame)
    for name, anchors in labels.items():
        unique = []
        for lon, lat in anchors:
            shell, = [p for p in shells if p.contains(Point(lon,lat))]
            if shell not in unique:
                unique.append(shell)
        island = core(dry.intersection(union_all(unique)),grid[1])
        if island.is_empty:
            raise ValueError(f'{title}: island name has no confirmed land')
        land.extend(regional.pack(island, kind='island', name=name))
        owners.extend(regional.pack(island, code=country))
    # The ETOPO grid spans hundreds of metres. Require the centre plus all
    # eight neighbours to be submerged by at least 200 m. Keep shallow lagoons,
    # exposed reefs and breaks unresolved without finer measured depths.
    deep = np.isfinite(z) & (z > -11000) & (z <= -200)
    agreed = np.all(np.lib.stride_tricks.sliding_window_view(deep,(3,3)),axis=(-1,-2))
    x, dx, _, y, _, dy = bathy_grid
    depth = regional.raster_mask(agreed,(x+dx,dx,0,y+dy,0,dy))
    stable_water = regional.raster_mask((early == 80) & (late == 80),grid)
    marine, = [p for p in regional.polygons(stable_water) if p.contains(Point(ocean_pin))]
    sea_level = regional.raster_mask(valid_dsm & (np.abs(dsm) <= .5),d_grid)
    water = core(frame.intersection(depth).intersection(marine).intersection(sea_level),grid[1])
    if water.is_empty or water.intersection(dry).area:
        raise ValueError(f'{title}: missing or overlapping marine evidence')
    return dict(id='oceania-polynesia-'+key, name=title, bbox=bbox, source='oceania-polynesia+'+key,
                version='ESA WorldCover 2020 v100 / 2021 v200; Copernicus DEM GLO-30 Public; '
                        'NOAA ETOPO 2022 15 arc-second v1; JRC Global Surface Water v1.4',
                attribution=regional.WC_CREDIT+' Produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and '
                            '© Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the '
                            'European Union and ESA; all rights reserved. NOAA NCEI ETOPO 2022. European Commission, '
                            'Joint Research Centre, Global Surface Water v1.4 (1984–2021).',
                evidenceUrls=[*urls,study], oceanRegion=basin, land=land, owners=owners,
                water=regional.pack(water, kind='ocean'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    args.source_directory.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    gdal.SetConfigOption('GDAL_HTTP_MAX_RETRY','3')
    windows = [build(k, args.source_directory, args.download) for k in SITES]
    with NamedTemporaryFile('w', dir=args.output.parent, delete=False, encoding='utf-8') as stream:
        json.dump({'windows':windows}, stream, ensure_ascii=False, separators=(',',':'))
        stream.write('\n')
        result = Path(stream.name)
    result.replace(args.output)


if __name__ == '__main__':
    main()
