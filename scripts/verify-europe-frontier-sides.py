#!/usr/bin/env python3
"""Compare points 20 m on either side of the original line to original and published polygons."""
import argparse
from collections import defaultdict
import json
import math
from pathlib import Path
import runpy
import sqlite3

import numpy as np
import shapely

ROOT=Path(__file__).resolve().parents[1]
TOOLS=runpy.run_path(str(ROOT/"scripts/build-europe-frontier-sides.py"))
SOURCE=runpy.run_path(str(ROOT/"scripts/fetch-europe-frontier-sources.py"))
UNPACK=TOOLS["COMMON"]["unpack"]


def verify(cache,folder):
    samples=[]
    for feature in SOURCE["land_source"](cache/"lsib.gpkg"):
        if feature["kind"]!="international":
            continue
        for path in feature["paths"]:
            for fraction in (0.25,0.75):
                j=int((len(path)-2)*fraction)
                (x,y),(u,v)=path[j:j+2]
                coslat=math.cos(math.radians((y+v)/2))
                dx,dy=(u-x)*coslat,v-y
                length=math.hypot(dx,dy)
                if not length or abs(u-x)>180:
                    continue
                for distance in (-20/111195,20/111195):
                    samples.append(((x+u)/2-dy/length*distance/coslat,(y+v)/2+dx/length*distance))
    x,y=np.asarray(samples).T
    expected=[set() for _ in samples]
    db=sqlite3.connect((cache/"adm0_polygons.gpkg").resolve().as_uri()+"?mode=ro&immutable=1",uri=True)
    for fid,iso,unit in db.execute("select fid,iso_2,adm0_id from adm0_polygons"):
        code={"XUK_1":"SBA","XUK_2":"SBA","XKX":"XK","XKS":"XK"}.get(unit.split("-")[0],iso)
        if not code:
            continue
        for (w,s,e,n),wkb in TOOLS["original_polygons"](db,fid):
            use=np.flatnonzero((x>=w)&(x<=e)&(y>=s)&(y<=n))
            if not use.size:
                continue
            region=("XU" if (w+e)/2<33.4 else "XD") if code=="SBA" else code
            geom=shapely.from_wkb(b"".join(wkb))
            for k in use[shapely.intersects_xy(geom,x[use],y[use])]:
                expected[k].add(region)
    db.close()
    wanted=defaultdict(list)
    for k,(lon,lat) in enumerate(samples):
        wanted[(math.floor(lat*8)+720)*2880+(math.floor(lon*8)+1440)%2880].append(k)
    observed=[set() for _ in samples]
    for page in folder.glob("sides-*.json"):
        for tile,shapes in json.loads(page.read_text()):
            if tile not in wanted:
                continue
            for code,_,rings in shapes:
                if code=="*":
                    continue
                geom=shapely.Polygon(UNPACK(rings[0],True),[UNPACK(r,True) for r in rings[1:]])
                for k in wanted[tile]:
                    if geom.covers(shapely.Point(*samples[k])):
                        observed[k].add(code)
    for k,actual in enumerate(observed):
        assert actual==expected[k],(samples[k],sorted(actual),sorted(expected[k]))
    print(len(samples),"offsets matched original polygons,",sum(map(bool,expected)),"with administrative coverage")


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache",type=Path,required=True)
    parser.add_argument("--sides",type=Path,default=ROOT/"src/data/europe-frontier-sides")
    args=parser.parse_args()
    verify(args.cache,args.sides)
