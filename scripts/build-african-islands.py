#!/usr/bin/env python3
"""Compile African island/shore windows from pinned GSHHG full resolution and FieldMaps USGS."""
import argparse
from collections import defaultdict
from hashlib import sha256
from math import ceil, floor
import numpy as np
from importlib import import_module
import json
from pathlib import Path

from osgeo import gdal, ogr
import shapely
from shapely.geometry import Point, box
from shapely.ops import unary_union

base = import_module('build-northern-central-america-review')
atlas = import_module('build-global-islands')
ROOT = Path(__file__).resolve().parents[1]
SCALE = 1_000_000
# Insets leave a gap on both sides of mismatching shores. No nearest-island operation is used.
TOLERANCE = .00007
MARGIN = .00016
WINDOWS = [
    ('cabo-verde','Cabo Verde',[-25.40,14.76,-22.58,17.25],'NATL'),
    ('sao-tome','São Tomé and Rolas',[6.42,-.035,6.80,.45],None),
    ('principe','Príncipe',[7.31,1.48,7.51,1.75],'NATL'),
    ('bioko','Bioko',[8.38,3.17,8.97,3.82],'NATL'),
    ('annobon','Annobón',[5.58,-1.49,5.68,-1.37],'SATL'),
    ('canaries','Canary Islands',[-18.25,27.60,-13.30,29.46],'NATL'),
    ('madeira','Madeira and Porto Santo',[-17.30,32.32,-16.24,33.13],'NATL'),
    ('st-helena','Saint Helena',[-5.82,-16.05,-5.60,-15.89],'SATL'),
    ('ascension','Ascension',[-14.44,-8.01,-14.28,-7.87],'SATL'),
    ('tristan','Tristan da Cunha',[-12.37,-37.18,-12.20,-37.04],'SATL'),
    ('comoros','Grande Comore, Mohéli and Anjouan',[43.18,-12.45,44.56,-11.32],'SIND'),
    ('mayotte','Mayotte and Petite-Terre',[45.00,-13.02,45.32,-12.62],'SIND'),
    ('seychelles','Mahé, Praslin and La Digue',[55.18,-4.84,55.88,-4.24],'SIND'),
    ('mauritius','Mauritius',[57.23,-20.56,57.86,-19.95],'SIND'),
    ('rodrigues','Rodrigues',[63.31,-19.82,63.54,-19.64],'SIND'),
    ('reunion','Réunion',[55.19,-21.42,55.87,-20.85],'SIND'),
    ('nosy-be','Nosy Be and the facing Madagascar coast',[48.12,-13.57,48.56,-13.17],'SIND'),
    ('sainte-marie','Sainte-Marie and the Madagascar channel',[49.64,-17.17,50.10,-16.66],'SIND'),
    ('unguja','Unguja and Zanzibar Channel',[39.00,-6.49,39.61,-5.70],'SIND'),
    ('pemba','Pemba and Pemba Channel',[39.59,-5.53,39.91,-4.84],'SIND'),
    ('likoma','Likoma, Chizumulu and Lake Malawi',[34.58,-12.13,34.82,-11.98],None),
]
HINTS = {'ascension':'AC','tristan':'TA','madeira':'PT_MAD','canaries':'ES_CAN'}
SOVEREIGNS = {'RE':'FR','YT':'FR','SH':'GB'}
MALAWI = 'https://www.energy.gov.mw/docs/uploads/MAREP-FLYER.pdf'


def pack(geom, **attrs):
    rows = []
    for p in base.polygons(shapely.set_precision(geom, 1/SCALE)):
        p = shapely.normalize(p)
        _, *payload = atlas.pack([r.coords for r in [p.exterior,*p.interiors]], 0, SCALE)
        rows.append(dict(**attrs,bbox=[v/SCALE for v in payload[:4]],packedRings=payload[4:]))
    return sorted(rows,key=lambda r:(r['bbox'],r['packedRings']))


LAKE_PIXELS = {
    2020: '478a3c1fd8f74e82e0071b5e8baa86a4d1e3dc686eae45c51b9f25366e3ded7f',
    2021: 'be785c1cfc7baf674acd214fb4706047d9bc2718f768a225d6b2efef0f84b1ce',
}


def lake_observations(frame, cache):
    # The window straddles the 12°S WorldCover tile seam. Mosaic on its unshifted native grid.
    w,s,e,n = frame.bounds
    west,south,east,north = floor(w*12000),floor(s*12000),ceil(e*12000),ceil(n*12000)
    gt = (west/12000,1/12000,0,north/12000,0,-1/12000)
    arrays, urls = [], []
    for year,version in [(2020,'v100'),(2021,'v200')]:
        image = np.zeros((north-south,east-west),dtype=np.uint8)
        for ty in range(3*floor(s/3),3*floor(n/3)+1,3):
            tx = 3*floor(w/3)
            assert east <= (tx+3)*12000
            tile = f'S{abs(ty):02}E{tx:03}'
            filename = f'ESA_WorldCover_10m_{year}_{version}_{tile}_Map.tif'
            url = f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{version}/{year}/map/{filename}'
            urls.append(url)
            top,bottom = min(north,(ty+3)*12000),max(south,ty*12000)
            path = cache / f'likoma-{tile}-{year}.bin'
            if path.exists():
                part = np.fromfile(path,dtype=np.uint8).reshape(top-bottom,east-west)
            else:
                ds = gdal.Open('/vsicurl/'+url)
                if ds.GetSpatialRef().GetAuthorityCode(None) != '4326' or not np.allclose(
                    ds.GetGeoTransform(),(tx,1/12000,0,ty+3,0,-1/12000),rtol=0,atol=1e-15):
                    raise ValueError('Unexpected lake image grid')
                part = ds.ReadAsArray(west-tx*12000,(ty+3)*12000-top,east-west,top-bottom)
                part.tofile(path)
            image[north-top:north-bottom,:] = part
        digest = sha256(image.tobytes()).hexdigest()
        if digest != LAKE_PIXELS[year]:
            raise ValueError('Unexpected lake imagery')
        arrays.append(image)
    dry_classes = [10,20,30,40,50,60]
    dry = base.raster_mask(np.isin(arrays[0],dry_classes) & np.isin(arrays[1],dry_classes),gt)
    wet = base.raster_mask((arrays[0] == 80) & (arrays[1] == 80),gt)
    return dry, wet, urls


def window(spec, layers, administration, cache):
    key, name, bbox, ocean = spec
    frame = box(bbox[0]-.004,bbox[1]-.004,bbox[2]+.004,bbox[3]+.004)
    level = defaultdict(list)
    for depth, layer in enumerate(layers, 1):
        layer.SetSpatialFilterRect(*frame.bounds)
        for f in layer:
            part = shapely.make_valid(shapely.from_wkb(bytes(f.geometry().ExportToWkb()))).intersection(frame)
            if part.area:
                level[depth].append((str(f['id']),part))
    fm = defaultdict(list)
    administration.SetSpatialFilterRect(*frame.bounds)
    for f in administration:
        g = shapely.make_valid(shapely.from_wkb(bytes(f.geometry().ExportToWkb()))).intersection(frame)
        if g.area:
            fm[f['iso_2'] or ''].append(g)
    owners = {k:unary_union(v) for k,v in fm.items()}
    mapped = unary_union(list(owners.values()))
    water_holes = unary_union([p for _,p in level[2]])
    lake_islands = unary_union([p for _,p in level[3]])
    ponds = unary_union([p for _,p in level[4]])
    land = []
    by_owner = defaultdict(list)
    # Protect a tiny island missing from either edition by excluding it from firm ocean.
    marine_land = unary_union([g for _,g in level[1]])
    salt = frame.difference(marine_land.union(mapped))
    fresh = water_holes.difference(lake_islands).union(ponds)
    def inward(g):
        return g.buffer(-MARGIN,quad_segs=1).simplify(TOLERANCE, preserve_topology=True)
    extra_urls = []
    if key == 'likoma':
        dry, wet, extra_urls = lake_observations(frame, cache)
        fresh = fresh.intersection(wet)
        # Malawi's district records identify the two islands. Follow each continuous satellite
        # land component from its own interior control, including beyond the older lake shoreline.
        for label, anchor in [('Likoma',(34.731,-12.065)),('Chizumulu',(34.62,-12.02))]:
            component, = (p for p in base.polygons(dry) if p.covers(Point(anchor)))
            if not frame.contains(component):
                raise ValueError('Expected an isolated lake island inside the observation frame')
            safe = inward(component)
            land.extend(pack(safe,kind='island',name=label))
            by_owner['MW'].append(safe)
    water = pack(inward(salt),kind='ocean') if ocean or key == 'sao-tome' else []
    water += pack(inward(fresh),kind='inland')
    for depth in [1,3]:
        for gid, whole in level[depth]:
            if key == 'likoma' and depth == 3:
                continue
            geom = whole.difference(water_holes if depth == 1 else ponds)
            # GSHHG full-resolution ID 1 is the African mainland.
            # Determine the mainland by a source-component ID, never by local clipped size.
            kind = 'mainland' if depth == 1 and gid == '1' else 'island'
            if key == 'likoma':
                geom = geom.intersection(dry)
            safe = inward(geom.intersection(mapped))
            if not safe.area:
                continue
            land.extend(pack(safe,kind=kind))
            for code, owner in owners.items():
                if code and owner.intersects(safe):
                    by_owner[code].append(safe.intersection(owner))
    if not land or not water:
        raise ValueError(f'No independently identified land or water in {name}')
    packed_owners = []
    for code, shapes in sorted(by_owner.items()):
        packed_owners.extend(pack(unary_union(shapes),code=code,sovereignCode=SOVEREIGNS.get(code,code)))
    return dict(id=key,name=name,bbox=bbox,source='africa-island+'+key,land=land,water=water,owners=packed_owners,
                **({'addressPrefix':HINTS[key]} if key in HINTS else {}),
                **({'islandPolicy':'B22'} if key == 'mayotte' else {}),
                **({'oceanRegion':ocean} if ocean else {}),
                version='GSHHG full 2.3.7 / FieldMaps USGS 2025-07-29' + (' / WorldCover v100 and v200' if extra_urls else ''),
                attribution='GSHHG © Paul Wessel and Walter H. F. Smith (LGPL-3.0-or-later); FieldMaps USGS/LSIB (public domain).' + (' '+base.WC_CREDIT if extra_urls else ''),
                evidenceUrls=[base.GSHHG_URL,base.FM_URL,*extra_urls]+([MALAWI] if key == 'likoma' else []))


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('gshhg',type=Path)
    parser.add_argument('fieldmaps',type=Path)
    parser.add_argument('cache',type=Path)
    parser.add_argument('--output',type=Path,default=ROOT/'src/data/african-islands')
    args=parser.parse_args()
    ogr.UseExceptions()
    gdal.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN','EMPTY_DIR')
    args.cache.mkdir(parents=True, exist_ok=True)
    base.check(args.gshhg,base.GSHHG_SHA)
    base.check(args.fieldmaps,base.FM_SHA)
    ds=[ogr.Open(f'/vsizip/{args.gshhg.resolve()}/GSHHS_shp/f/GSHHS_f_L{i}.shp') for i in [1,2,3,4]]
    fm=ogr.Open(str(args.fieldmaps))
    layers=[d.GetLayer() for d in ds]
    args.output.mkdir(parents=True,exist_ok=True)
    groups=[[],[],[],[]]
    sizes=[0]*len(groups)
    for spec in WINDOWS:
        result=window(spec,layers,fm.GetLayerByName('adm0_polygons'),args.cache)
        i=sizes.index(min(sizes))
        groups[i].append(result)
        size=len(atlas.compact(result))
        sizes[i]+=size
        print(spec[0],size,flush=True)
    for i, group in enumerate(groups,1):
        (args.output / f'islands-{i}.json').write_text(atlas.compact(dict(windows=group))+'\n')
