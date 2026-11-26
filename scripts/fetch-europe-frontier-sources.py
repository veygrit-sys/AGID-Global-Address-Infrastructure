#!/usr/bin/env python3
"""Read original LSIB v11.4 multiparts and the Marine Regions v12 two-sided line layer."""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import sqlite3
import struct
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "scripts/data/europe-frontiers"
SCOPE = json.loads((DATA / "scope.json").read_text())
EUROPE = set(SCOPE["countries"] + SCOPE["territories"])
MED = set(SCOPE["mediterraneanNeighbours"])
LSIB_URL = "https://raw.githubusercontent.com/fieldmaps/international/ead689152f06d2baf823c667c7d803ea25c4f4ce/inputs/archive/11.4/DoS_LSIB_v11_4_24Feb2025.gpkg"
LSIB_SHA = "1e2723fc1e699531353706e5c8f584d93547b6564417a6f59d2e990142ee1c12"
MARINE_SHA = "f5a7c146c1b8c7d63583eb27ebf0f1c97bcc8dfb6944778d5cb8ecdf1a922660"
WFS = "https://geo.vliz.be/geoserver/MarineRegions/wfs"
NAMES = {"Gaza Strip":["PS"], "West Bank":["PS"], "Akrotiri (U.K.)":["XU"], "Dhekelia (U.K.)":["XD"],
         "Germany-Luxembourg Condominium":["DE","LU"], "Mont Blanc Summit":["FR","IT"]}
COASTAL = set("Albania|Azerbaijan|Belgium|Bosnia and Herzegovina|Bulgaria|Croatia|Cyprus|Denmark|Estonia|Finland|France|Georgia|Germany|Greece|Iceland|Ireland|Italy|Kazakhstan|Latvia|Lithuania|Malta|Monaco|Montenegro|Netherlands|Norway|Poland|Portugal|Romania|Russia|Slovenia|Spain|Sweden|Turkey|Ukraine|United Kingdom".split("|"))
SOUTH = set("Morocco|Algeria|Tunisia|Libya|Egypt|Israel|Palestine|Lebanon|Syria".split("|"))


def download(url):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent":"AGID-Europe-source-build/1"})
            with urllib.request.urlopen(req, timeout=120) as response:
                return response.read()
        except OSError:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def pinned(path, checksum):
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != checksum:
        raise ValueError(f"Unreviewed {path.name} edition {digest}")


def original_parts(blob):
    # GeoPackage header and envelope, followed by 2-D MultiLineString WKB.
    if blob[:2] != b"GP":
        raise ValueError("Invalid GPKG header")
    position = 8 + (0,32,48,48,64)[(blob[3] >> 1) & 7]

    def header():
        nonlocal position
        order = "<" if blob[position] == 1 else ">"
        kind, count = struct.unpack_from(order + "II", blob, position + 1)
        position += 9
        return order,kind,count

    _, kind, count = header()
    if kind != 5:
        raise ValueError(f"Not a 2-D multiline: {kind}")
    paths = []
    for _ in range(count):
        order, kind, vertices = header()
        if kind != 2 or vertices < 2:
            raise ValueError("Malformed linestring")
        end = position + 16 * vertices
        paths.append(list(struct.iter_unpack(order + "dd", memoryview(blob)[position:end])))
        position = end
    if position != len(blob):
        raise ValueError("Unexpected trailing coordinates")
    return paths


def land_source(path):
    pinned(path, LSIB_SHA)
    db = sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)
    db.row_factory = sqlite3.Row
    table, column = db.execute("SELECT table_name,column_name FROM gpkg_geometry_columns WHERE geometry_type_name='MULTILINESTRING'").fetchone()
    table = table.replace('"', '""')
    result = []
    for r in db.execute(f'SELECT * FROM "{table}" ORDER BY fid'):
        names = [r["COUNTRY1"], r["COUNTRY2"]]
        codes = sorted(set(NAMES.get(names[0],[r["CC1"]]) + NAMES.get(names[1],[r["CC2"]])))
        if not EUROPE.intersection(codes) and not set(codes) <= MED:
            continue
        kind = "international" if str(r["RANK"]) == "1" else "reference"
        if "Germany-Luxembourg Condominium" in names:
            kind = "joint-limit"
        elif set(codes) == {"DK","SE"}:
            kind = "water-line"
        result.append(dict(id="lsib-"+r["ID"],source="lsib",codes=codes,kind=kind,
            name=" / ".join(names), classification=r["STATUS"], paths=original_parts(r[column]),
            note=" · ".join(x for x in (r["LABEL"],r["NOTES"]) if x)))
    db.close()
    if len(result) != 140:
        raise ValueError(f"Expected 140 scoped LSIB features, found {len(result)}")
    return result


def wfs(**parameters):
    p = dict(service="WFS", version="2.0.0", request="GetFeature",
             typeNames="MarineRegions:eez_boundaries", outputFormat="application/json", **parameters)
    return json.loads(download(WFS + "?" + urllib.parse.urlencode(p)))


def fetch_marine(path):
    world = wfs(propertyName="line_id,line_name,line_type,territory1,territory2,sovereign1,sovereign2,origin",count=20000,sortBy="line_id")
    if world["numberMatched"] != len(world["features"]):
        raise ValueError("Incomplete worldwide inventory")
    ids = []
    for f in world["features"]:
        p = f["properties"]
        parties = {p["sovereign1"],p["sovereign2"]}
        if (COASTAL & parties or parties <= SOUTH) and p["territory1"] and p["territory2"] and p["territory1"] != p["territory2"]:
            ids.append(p["line_id"])
    def batch(selected):
        features = wfs(CQL_FILTER="line_id IN ("+",".join(map(str,selected))+")",count=len(selected),sortBy="line_id",srsName="CRS:84")["features"]
        if sorted(r["properties"]["line_id"] for r in features) != sorted(selected):
            raise ValueError("Incomplete marine response")
        return features
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        rows = [f for group in pool.map(batch,[ids[i:i+25] for i in range(0,len(ids),25)]) for f in group]
    path.write_text(json.dumps(sorted(rows,key=lambda f:f["properties"]["line_id"]),ensure_ascii=False,sort_keys=True,separators=(",",":")) + "\n")


def marine_source(path):
    pinned(path,MARINE_SHA)
    lookup = json.loads((DATA/"region-name-codes.json").read_text())
    rows = []
    for item in json.loads(path.read_text()):
        p = item["properties"]
        props = [p[k] for k in ("territory1","territory2","sovereign1","sovereign2")]
        geom = item["geometry"]
        rows.append(dict(id="vliz-"+str(p["line_id"]), source="vliz", kind="marine", codes=[],
            name=p["line_name"], classification=p["line_type"], territories=props[:2], sovereigns=props[2:],
            territoryIds=[p["mrgid_ter1"],p["mrgid_ter2"]], searchCodes=sorted({code for term in props for code in lookup.get(term,[])}),
            documentDate=p.get("doc_date"),jointRegimeId=p.get("mrgid_jreg"),
            evidenceUrls=[p[k] for k in ("url1","url2","url3") if p.get(k)],
            paths=geom["coordinates"] if geom["type"]=="MultiLineString" else [geom["coordinates"]]))
    if len(rows) != 377 or any(not r["searchCodes"] for r in rows):
        raise ValueError("Incomplete marine coverage")
    return rows


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--land-only", action="store_true")
    args = parser.parse_args()
    args.cache.mkdir(exist_ok=True, parents=True)
    lsib = args.cache/"lsib.gpkg"
    if not lsib.exists():
        lsib.write_bytes(download(LSIB_URL))
    rows = land_source(lsib)
    if not args.land_only:
        marine = args.cache/"vliz.json"
        if not marine.exists():
            fetch_marine(marine)
        rows.extend(marine_source(marine))
    args.output.write_text(json.dumps(rows,ensure_ascii=False,separators=(",",":"))+"\n")
    print(len(rows), "source-complete boundary features")
