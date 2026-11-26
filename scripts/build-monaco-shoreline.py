#!/usr/bin/env python3
"""Build the separately distributed ODbL land and harbour extract in Monaco."""
import argparse
import hashlib
import json
from pathlib import Path
import runpy

import osmium
import shapely
from shapely.ops import polygonize

ROOT = Path(__file__).resolve().parents[1]
WINDOW = [7.407,43.7245,7.442,43.752]
BASE = runpy.run_path(str(ROOT/"scripts/fetch-europe-frontier-sources.py"))
PACK = runpy.run_path(str(ROOT/"scripts/supplement-europe-frontiers.py"))["packed"]


def build(path,out):
    if not path.exists():
        path.write_bytes(BASE["download"]("https://download.geofabrik.de/europe/monaco-261124.osm.pbf"))
    BASE["pinned"](path,"db33764338e38ba012313cb135981df1c6fca1a4c8882ea1029543263d0a7fbc")
    frame=shapely.box(WINDOW[0]-.001,WINDOW[1]-.001,WINDOW[2]+.001,WINDOW[3]+.001)
    coast=[]
    countries=[]
    factory=osmium.geom.WKBFactory()
    class Reader(osmium.SimpleHandler):
        def way(self,w):
            if w.tags.get("natural")=="coastline":
                line=shapely.from_wkb(bytes.fromhex(factory.create_linestring(w)))
                geom=line.intersection(frame)
                coast.extend(part for part in shapely.get_parts(geom) if part.geom_type=="LineString" and part.length)
        def area(self,a):
            if not a.from_way() and a.orig_id()==1124039:
                countries.append(shapely.from_wkb(bytes.fromhex(factory.create_multipolygon(a))))
    Reader().apply_file(str(path),locations=True)
    faces=list(polygonize(shapely.union_all([frame.boundary,*coast])))
    left=[]
    right=[]
    for line in coast:
        points=list(line.coords)
        for (x,y),(u,v) in zip(points,points[1:]):
            dx,dy=u-x,v-y
            length=(dx*dx+dy*dy)**.5
            if length<1e-8:
                continue
            offset=min(2e-7,length/8)
            mx,my=(x+u)/2,(y+v)/2
            left.append(shapely.Point(mx-dy/length*offset,my+dx/length*offset))
            right.append(shapely.Point(mx+dy/length*offset,my-dx/length*offset))
    dry=[]
    for face in faces:
        onleft=any(face.contains(p) for p in left)
        onright=any(face.contains(p) for p in right)
        if onleft==onright:
            raise ValueError("Ambiguous coastline face")
        if onleft:
            dry.append(face)
    land=shapely.union_all(dry)
    if len(countries)!=1:
        raise ValueError("Missing Monaco administrative relation")
    for x,y,expected in [(7.4226,43.7319,True),(7.4316667,43.7405556,True),(7.437,43.737,False),(7.4309,43.74065,False)]:
        if land.covers(shapely.Point(x,y))!=expected:
            raise ValueError("Failed land/water control")
    def packed(poly):
        return dict(bbox=list(poly.bounds),rings=[PACK(r.coords[:-1]) for r in (poly.exterior,*poly.interiors)])
    owners=[]
    for code,shape in (("MC",land.intersection(countries[0])),("FR",land.difference(countries[0]))):
        for poly in shapely.get_parts(shape):
            if poly.geom_type=="Polygon" and poly.area>1e-12:
                owners.append(dict(**packed(poly),code=code,sovereign=code,source="osm-monaco"))
    output=dict(id="monaco-2026",bbox=WINDOW,european=True,physical=[dict(**packed(p),id=i,level=1,kind="mainland")
        for i,p in enumerate(shapely.get_parts(land)) if p.geom_type=="Polygon"],owners=owners)
    out.write_text(json.dumps(output,separators=(",",":"))+"\n")


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pbf",type=Path)
    parser.add_argument("--output",type=Path,default=ROOT/"src/data/monaco-osm-shoreline.json")
    args=parser.parse_args()
    build(args.pbf,args.output)
