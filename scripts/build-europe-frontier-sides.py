#!/usr/bin/env python3
"""Clip all countries, holes and disputed-area masks to the tiles intersected by frontier lines."""
import argparse
from collections import defaultdict
import hashlib
import json
import math
from pathlib import Path
import runpy
import shutil
import sqlite3
import struct
import urllib.request
import zipfile

import numpy as np
import shapely
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT/"src/data"
COMMON = runpy.run_path(str(ROOT/"scripts/supplement-europe-frontiers.py"))
SCALE = COMMON["SCALE"]
TILES = 8
SHA = "516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9"


def tiles_of(bounds):
    w,s,e,n = bounds
    for y in range(math.floor(s*TILES),math.floor(n*TILES)+1):
        for x in range(math.floor(w*TILES),math.floor(e*TILES)+1):
            yield x,y


def target_tiles(folder):
    features=json.loads((folder/"catalog.json").read_text())
    tiles=set()
    for p in folder.glob("lines-*.json"):
        for fid,bounds,*_ in json.loads(p.read_text()):
            if features[fid]["source"] not in ("lsib","saint-martin-2023","market-2006","tartupaluk-2022","condominium"):
                continue
            w,s,e,n = [v/SCALE for v in bounds]
            tiles.update(tiles_of([w-.001,s-.001,e+.001,n+.001]))
    return tiles


def original_polygons(db,fid):
    # Read individual polygons from a large country without materializing the entire MultiPolygon.
    with db.blobopen("adm0_polygons","geom",fid,readonly=True) as stream:
        header=stream.read(8)
        assert header[:2]==b"GP"
        stream.read([0,32,48,48,64][(header[3]>>1)&7])
        endian,kind,count=struct.unpack("<BII",stream.read(9))
        assert endian==1 and kind==6
        for _ in range(count):
            header=stream.read(9)
            endian,kind,nrings=struct.unpack("<BII",header)
            assert endian==1 and kind==3
            parts=[header]
            bbox=None
            for i in range(nrings):
                n=stream.read(4)
                raw=stream.read(struct.unpack("<I",n)[0]*16)
                parts.extend((n,raw))
                if i==0:
                    xy=np.frombuffer(raw,dtype="<f8").reshape((-1,2))
                    bbox=(xy[:,0].min(),xy[:,1].min(),xy[:,0].max(),xy[:,1].max())
            if bbox is not None:
                yield bbox,parts


def polygons(geometry):
    if geometry.geom_type=="Polygon" and not geometry.is_empty:
        yield geometry
    elif geometry.geom_type in ("MultiPolygon","GeometryCollection"):
        for part in geometry.geoms:
            yield from polygons(part)


def build(path,atlas,out,disputes):
    with path.open("rb") as stream:
        if hashlib.file_digest(stream,"sha256").hexdigest()!=SHA:
            raise ValueError("Unreviewed FieldMaps International edition")
    tiles=target_tiles(atlas)
    levels={size:{(x//size*size,y//size*size) for x,y in tiles} for size in (1,2,4,8,16,32)}
    groups=sorted(levels[32])
    rows=defaultdict(list)
    def visit(geometry,x,y,size,code):
        if (x,y) not in levels[size]:
            return
        clipped=shapely.clip_by_rect(geometry,x/TILES,y/TILES,(x+size)/TILES,(y+size)/TILES)
        if clipped.is_empty:
            return
        if size==1:
            for p in polygons(clipped if clipped.is_valid else shapely.make_valid(clipped)):
                rings=[COMMON["packed"](r.coords[:-1]) for r in (p.exterior,*p.interiors)]
                rows[x,y].append([code,[round(v*SCALE) for v in p.bounds],rings])
        else:
            part=size//2
            for a in (x,x+part):
                for b in (y,y+part):
                    visit(clipped,a,b,part,code)
    def relevant(bounds):
        w,s,e,n=bounds
        return [(x,y) for x,y in groups if x/TILES<=e and (x+32)/TILES>=w and y/TILES<=n and (y+32)/TILES>=s]
    db=sqlite3.connect(path.resolve().as_uri()+"?mode=ro&immutable=1",uri=True)
    for fid,iso,unit in db.execute("select fid,iso_2,adm0_id from adm0_polygons order by fid"):
        code={"XUK_1":"SBA","XUK_2":"SBA","XKX":"XK","XKS":"XK"}.get(unit.split("-")[0],iso)
        if not code:
            continue
        for bounds,parts in original_polygons(db,fid):
            targets=relevant(bounds)
            if not targets:
                continue
            geom=shapely.from_wkb(b"".join(parts))
            region=("XU" if (bounds[0]+bounds[2])/2<33.4 else "XD") if code=="SBA" else code
            for x,y in targets:
                visit(geom,x,y,32,region)
    db.close()
    for f in json.loads(disputes.read_text())["features"]:
        for p in polygons(shape(f["geometry"])):
            for x,y in relevant(p.bounds):
                visit(p,x,y,32,"*")
    index = {}
    batch = []
    used = page = 0
    out.mkdir(parents=True,exist_ok=True)
    def write():
        (out/("sides-"+str(page)+".json")).write_text("["+ ",\n".join(batch) +"]\n")
    for (x,y),shapes in sorted(rows.items(),key=lambda q:(q[0][1],q[0][0])):
        key=(y+90*TILES)*360*TILES+(x+180*TILES)%(360*TILES)
        item=json.dumps([key,shapes],separators=(",",":"))
        if batch and used+len(item)>200000:
            write()
            page+=1
            batch=[]
            used=0
        index[key]=page
        batch.append(item)
        used+=len(item)+2
    if batch:
        write()
    for p in out.glob("sides-*.json"):
        if int(p.stem.split("-")[1])>page:
            p.unlink()
    (out/"index.json").write_text(json.dumps(index,separators=(",",":"))+"\n")
    print(len(rows),"tiles",sum(map(len,rows.values())),"clipped original polygons and masks",page+1,"pages")


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache",type=Path,required=True)
    parser.add_argument("--atlas",type=Path,default=DATA/"europe-frontiers")
    parser.add_argument("--output",type=Path,default=DATA/"europe-frontier-sides")
    args=parser.parse_args()
    path=args.cache/"adm0_polygons.gpkg"
    if not path.exists():
        archive=args.cache/"adm0_polygons.zip"
        with urllib.request.urlopen("https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip",timeout=120) as response, archive.open("wb") as stream:
            shutil.copyfileobj(response,stream)
        with zipfile.ZipFile(archive) as z:
            name=next(n for n in z.namelist() if n.endswith("adm0_polygons.gpkg"))
            with z.open(name) as input_file, path.open("wb") as stream:
                shutil.copyfileobj(input_file,stream)
        archive.unlink()
    build(path,args.atlas,args.output,args.cache/"areas.json")
