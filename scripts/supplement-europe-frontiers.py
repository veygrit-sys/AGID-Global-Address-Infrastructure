#!/usr/bin/env python3
"""Add individually sourced surveys, reference lines, enclave faces and joint administrative areas."""
import argparse
import base64
from collections import defaultdict
import hashlib
import json
from pathlib import Path
import runpy
import xml.etree.ElementTree as ET
import zipfile

import shapefile
from pyproj import Geod, Transformer
import shapely
from shapely.ops import transform

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src/data"
BASE = runpy.run_path(str(ROOT/"scripts/fetch-europe-frontier-sources.py"))
ED = set(BASE["SCOPE"]["territories"] + BASE["SCOPE"]["countries"])
SCALE = 10_000_000
NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/"
SOURCES = {
    "nrw.zip": ("https://www.opengeodata.nrw.de/produkte/geobasis/vkg/dvg/dvg1/dvg1_EPSG25832_Shape.zip","9754ff0089f757a6a631ac4e715c2c793efa6d239aed1253a0db9afa04aca93e"),
    "lux.zip": ("https://download.data.public.lu/resources/inspire-annex-i-theme-administrative-units-condominium-2/20261109-230636/au.condominium.zip","1e3fc4536c63e1e764ba751ab3fec74bcd0e951ee9b28cf8dfdd1475142b296e"),
    "claims.json": (NE+"ne_10m_admin_0_boundary_lines_disputed_areas.geojson","69f19da764e6982b43aebae4b1a356ffe74c33f2a3cdb462637c0ba8e969c30b"),
    "areas.json": (NE+"ne_10m_admin_0_disputed_areas.geojson","9cafef8b7dfb6b164dc58f218f981f4ace9f716f6c03795d4c62d1ac9f3d50f5"),
}
SEARCH = {"Former USSR oblast in 1991":["AM","AZ"],"Ceasefire Line 2020":["AM","AZ"],"DMZ":["IL","SY"],"Donbass claim":["RU","UA"],"Donetsk claim":["RU","UA"],"Luhansk claim":["RU","UA"],"Georgian claim":["GE"],"Lebanese claim":["IL","LB"],"Moldovan claim":["MD"],"Palestinian claim":["IL","PS"],"Portuguese claim":["ES","PT"],"Slovenian claim":["HR","SI"],"Syrian claim":["IL","SY"],"Western Saharan claim":["EH","MA"],1746705831:["HR","RS"],1746705837:["HR","RS"],1746705881:["IL","PS"],1746705891:["IL","PS"]}


def read(path):
    return json.loads(path.read_text())


def packed(points):
    last = [0,0]
    stream = bytearray()
    for point in points:
        for axis,value in enumerate(point[:2]):
            number = round(value*SCALE)
            diff = number-last[axis]
            n = 2*diff if diff >= 0 else -2*diff-1
            while n >= 128:
                stream.append(128+n%128)
                n //= 128
            stream.append(n)
            last[axis] = number
    return base64.b64encode(stream).decode()


def unpack(data, close=False):
    points = []
    position = [0,0]
    axis = value = shift = 0
    for byte in base64.b64decode(data):
        value |= (byte & 127) << shift
        if byte & 128:
            shift += 7
            continue
        position[axis] += (value >> 1) ^ -(value & 1)
        if axis:
            points.append([v/SCALE for v in position])
        axis ^= 1
        value = shift = 0
    if close:
        points.append(points[0])
    return points


def add(rows, key, source, kind, codes, name, classification, paths, **extra):
    rows.append(dict(id=key,source=source,kind=kind,codes=sorted(codes),name=name,classification=classification,paths=paths,**extra))


def area(areas, name, codes, source, poly, **extra):
    rings = [packed(list(r.coords)[:-1]) for r in (poly.exterior,*poly.interiors)]
    areas.append(dict(name=name,codes=codes,source=source,bbox=list(poly.bounds),rings=rings,**extra))


def local_data(rows):
    folder = DATA/"territorial-exclaves"
    features = read(folder/"manifest.json")["features"]
    lines = defaultdict(list)
    for group in ("europe","asia","arctic"):
        part = read(folder/(group+".json"))
        for index,other,_,encoded in part["borders"]:
            if features[index]["code"] in ED or other in ED:
                lines[index,other].append(unpack(encoded))
        for index,_,rings in part["polygons"]:
            f = features[index]
            if f["source"] == "kadaster-brk-bestuurlijke-gebieden":
                lines[index,f["neighboringCodes"][0]].extend(unpack(r,True) for r in rings)
    for (index,other),paths in sorted(lines.items()):
        f = features[index]
        source = "kadaster" if f["source"]=="kadaster-brk-bestuurlijke-gebieden" else "fieldmaps"
        add(rows,"local-"+f["id"]+"-"+other,source,"survey",[f["code"],other],f["name"],f["kind"],paths,evidenceUrls=f["extraUrls"])
    add(rows,"buesingen-swissboundaries3d","swiss","survey",["CH","DE"],"Büsingen","Municipal survey perimeter",[read(DATA/"buesingenBoundary.json")["ring"]])
    survey = DATA/"europe-border-surveys"
    def surveyed(key,edition,name,codes,rings):
        add(rows,key+"-"+edition+"-"+name,edition,"survey",codes,name,"Independent administrative survey",[unpack(r,True) for r in rings])
    for r in read(survey/"vennbahn-nrw.json"):
        if r.get("site"):
            surveyed("vennbahn","nrw",r["site"],["BE","DE"],r["rings"])
    surveyed("vennbahn","cadgis","Vennbahn enclaves",["BE","DE"],read(survey/"vennbahn-cadgis.json")[0]["rings"][1:])
    surveyed("jungholz","bev","Jungholz",["AT","DE"],next(r["rings"] for r in read(survey/"jungholz-bev.json") if r.get("site")=="jungholz"))
    surveyed("jungholz","bavaria","Jungholz",["AT","DE"],read(survey/"jungholz-bavaria.json")[0]["rings"][1:])
    for edition in ("bih","srb"):
        surveyed("medjurecje",edition,"Međurečje",["BA","RS"],read(survey/("medjurecje-"+edition+".json"))[0]["rings"])


def extra_features(cache,rows):
    for name,(url,checksum) in SOURCES.items():
        path = cache/name
        if not path.exists():
            path.write_bytes(BASE["download"](url))
        BASE["pinned"](path,checksum)
    areas = []
    for feature in rows:
        if feature["source"]=="lsib" and feature["codes"]==["CY","XD"]:
            for i,path in enumerate(feature["paths"]):
                if path[0]==path[-1]:
                    area(areas,"Cypriot enclave in Dhekelia "+str(i),["CY"],"lsib",shapely.Polygon(path),borderCodes=["CY","XD"])
    with zipfile.ZipFile(cache/"lux.zip") as archive:
        root = ET.fromstring(archive.read(archive.namelist()[0]))
    tx = Transformer.from_crs(3035,4326,always_xy=True)
    for i,poly in enumerate(root.findall(".//{*}Polygon") or root.findall(".//{*}PolygonPatch")):
        rings = []
        for lst in poly.findall(".//{*}posList"):
            coords = list(map(float,lst.text.split()))
            rings.append([tx.transform(e,n) for n,e in zip(coords[::2],coords[1::2])])
        area(areas,"DE-LU condominium "+str(i),["DE","LU"],"condominium",shapely.Polygon(rings[0],rings[1:]))
        add(rows,f"de-lu-act-{i}","condominium","joint-limit",["DE","LU"],"Moselle / Sûre / Our","Official joint administrative area, perimeter",rings)
    if not any(a["source"]=="condominium" for a in areas):
        raise ValueError("Missing condominium")
    with zipfile.ZipFile(cache/"nrw.zip") as archive:
        name = next(f[:-4] for f in archive.namelist() if f.lower().endswith("dvg1bld_nw.shp"))
        import io
        with shapefile.Reader(**{ext:io.BytesIO(archive.read(name+"."+ext)) for ext in ("shp","shx","dbf")},encoding="latin1") as dataset:
            state = next(shapely.geometry.shape(sr.shape.__geo_interface__) for sr in dataset.iterShapeRecords() if sr.record.as_dict()["KN"]=="05000000")
    state = transform(Transformer.from_crs(25832,4326,always_xy=True).transform,state)
    window = [6.0804,50.8622,6.0817,50.8630]
    frame = shapely.box(6.0801,50.8620,6.0820,50.8632)
    for code,shape in (("DE",state.intersection(frame)),("NL",frame.difference(state))):
        for p in shapely.get_parts(shape):
            if p.geom_type=="Polygon":
                area(areas,"Eurode Business Center",[code],"nrw",p,coverage=window,borderCodes=["DE","NL"])
    segments=shapely.get_parts(state.boundary.intersection(shapely.box(*window)))
    add(rows,"eurode-nrw-dvg1","nrw","survey",["DE","NL"],"Eurode Business Center","NRW DVG1 state boundary",[list(p.coords) for p in segments if p.geom_type=="LineString"])
    for f in read(cache/"claims.json")["features"]:
        p,g=f["properties"],f["geometry"]
        paths=g["coordinates"] if g["type"]=="MultiLineString" else [g["coordinates"]]
        if any(-32<=x<=62 and 27<=y<=73 for path in paths for x,y in path):
            add(rows,"ne-"+str(p["ne_id"]),"natural-earth","reference",[],p["NAME"] or p["COMMENT"] or p["FEATURECLA"],p["FEATURECLA"],paths,searchCodes=SEARCH[p["NAME"] or p["ne_id"]])
    for f in read(cache/"areas.json")["features"]:
        if f["properties"]["BRK_NAME"]=="Cyprus U.N. Buffer Zone":
            g=f["geometry"]
            polys=g["coordinates"] if g["type"]=="MultiPolygon" else [g["coordinates"]]
            add(rows,"cyprus-buffer-perimeter","natural-earth","reference",[],"Cyprus U.N. Buffer Zone","Cartographic reference perimeter",[r for poly in polys for r in poly],searchCodes=["CY"])
    local_data(rows)
    return areas


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source",type=Path)
    parser.add_argument("--cache",required=True,type=Path)
    parser.add_argument("--areas",required=True,type=Path)
    args=parser.parse_args()
    rows=read(args.source)
    areas=extra_features(args.cache,rows)
    treaty_file=ROOT/"scripts/data/europe-frontiers/treaty-coordinates.json"
    treaty=read(treaty_file)
    stations=treaty["tartupaluk"]
    geod=Geod(ellps="GRS80")
    trace=[stations[0]]
    for a,b in zip(stations,stations[1:]):
        trace.extend(geod.npts(*a,*b,100))
        trace.append(b)
    treaty["tartupalukGeodesic"]=trace
    treaty_file.write_text(json.dumps(treaty,ensure_ascii=False,separators=(",",":"))+"\n")
    args.source.write_text(json.dumps(rows,ensure_ascii=False,separators=(",",":"))+"\n")
    args.areas.parent.mkdir(exist_ok=True,parents=True)
    args.areas.write_text(json.dumps(areas,ensure_ascii=False,separators=(",",":"))+"\n")
    print(len(areas),"individual administrative polygons")
