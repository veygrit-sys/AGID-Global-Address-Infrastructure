#!/usr/bin/env python3
"""Check tiled paths against the source GeoPackage and original Marine Regions GeoJSON."""
import argparse
import base64
from collections import Counter, defaultdict
import hashlib
import json
import math
from pathlib import Path
import sqlite3
import struct

ROOT = Path(__file__).resolve().parents[1]
SCALE = 10_000_000


def unpack(encoded):
    xy = [0, 0]
    axis = value = shift = 0
    for byte in base64.b64decode(encoded, validate=True):
        value |= (byte & 127) << shift
        if byte & 128:
            shift += 7
            continue
        xy[axis] += (value >> 1) ^ -(value & 1)
        if axis:
            yield tuple(xy)
        axis ^= 1
        value = shift = 0
    assert axis == value == shift == 0


def digest(points):
    return hashlib.sha256(b"".join(struct.pack("<qq",*p) for p in points)).digest()


def audit_neighbours(path):
    scope = json.loads((ROOT/"scripts/data/europe-frontiers/scope.json").read_text())
    assert hashlib.sha256(path.read_bytes()).hexdigest() == scope["neighbourInputSha256"]
    europe = set(scope["countries"] + scope["territories"])
    mediterranean = set(scope["mediterraneanNeighbours"])
    pairs = set()
    for row in path.read_text().splitlines():
        if not row or row.startswith("#"):
            continue
        fields = row.split("\t")
        for other in fields[17].split(","):
            codes = {fields[0],other}
            if other and not codes.intersection({"CS","AN"}) and (codes.intersection(europe) or codes <= mediterranean):
                pairs.add("-".join(sorted(codes)))
    pairs.remove("AL-RS")  # Duplicate physical frontier in the Kosovo representation.
    pairs.update(("AX-SE","CA-GL","CY-XD","CY-XU"))
    assert pairs == set(scope["expectedLandPairs"])
    print(len(pairs), "bilateral pairs independently reproduced")


def audit(args):
    if args.geonames:
        audit_neighbours(args.geonames)
    import shapely
    catalog = json.loads((args.atlas/"catalog.json").read_text())
    index = json.loads((args.atlas/"index.json").read_text())
    blocks = defaultdict(dict)
    totals = Counter()
    for page in args.atlas.glob("lines-*.json"):
        page_id = int(page.stem.split("-")[1])
        for fid,box,encoded,k,start in json.loads(page.read_text()):
            pts = list(unpack(encoded))
            xs,ys = zip(*pts)
            assert box == [min(xs), min(ys), max(xs), max(ys)]
            w,s,e,n = (v // (2*SCALE) for v in box)
            for y in range(s,n+1):
                for x in range(w,e+1):
                    assert page_id in index[str((y+45)*180+(x+90)%180)]
            pieces = blocks[catalog[fid]["id"],k]
            assert start not in pieces
            pieces[start] = (len(pts),digest(pts),pts[0],pts[-1])
            totals[fid] += len(pts)-int(start!=0)
    for fid,f in enumerate(catalog):
        assert totals[fid]==f["vertices"]
        for k in range(f["parts"]):
            last=None
            cursor=0
            for start,(size,_,a,b) in sorted(blocks[f["id"],k].items()):
                assert start==cursor and (last is None or last==a)
                last=b
                cursor+=size-1
    ids = {f["id"]:f for f in catalog}
    verified = set()
    total = 0
    def check(fid,lines):
        nonlocal total
        verified.add(fid)
        assert len(lines)==ids[fid]["parts"]
        for k,path in enumerate(lines):
            coords=[]
            for x,y,*_ in path:
                if coords:
                    x+=360*math.floor((coords[-1][0]/SCALE-x)/360+0.5)
                coords.append((math.floor(x*SCALE+0.5),math.floor(y*SCALE+0.5)))
            for start,(size,wanted,*_) in blocks[fid,k].items():
                assert digest(coords[start:start+size])==wanted, (fid,k,start)
            assert len(coords)==sum(p[0]-int(start!=0) for start,p in blocks[fid,k].items())
            total+=len(coords)
    db=sqlite3.connect(args.lsib.resolve().as_uri()+"?mode=ro",uri=True)
    table,column=db.execute("select table_name,column_name from gpkg_geometry_columns where geometry_type_name='MULTILINESTRING'").fetchone()
    table,column=[s.replace('"','""') for s in (table,column)]
    for fid,blob in db.execute(f'SELECT ID,"{column}" FROM "{table}"'):
        fid="lsib-"+fid
        if fid in ids:
            offset=8+(0,32,48,48,64)[(blob[3]>>1)&7]
            geom=shapely.from_wkb(blob[offset:])
            check(fid,[list(part.coords) for part in geom.geoms])
    db.close()
    for f in json.loads(args.marine.read_text()):
        fid="vliz-"+str(f["properties"]["line_id"])
        geom=f["geometry"]
        check(fid,geom["coordinates"] if geom["type"]=="MultiLineString" else [geom["coordinates"]])
    assert verified=={f["id"] for f in catalog if f["source"] in {"lsib","vliz"}}
    print(f"{len(catalog)} indexed records; {len(verified)} original LSIB/VLIZ features, {total:,} original vertices matched in source order")


if __name__=="__main__":
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--geonames",type=Path)
    ap.add_argument("--lsib",type=Path,required=True)
    ap.add_argument("--marine",type=Path,required=True)
    ap.add_argument("--atlas",type=Path,default=ROOT/"src/data/europe-frontiers")
    audit(ap.parse_args())
