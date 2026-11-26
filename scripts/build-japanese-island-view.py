#!/usr/bin/env python3
"""Extract Japan's three island groups from the official MLIT 2026-01-01 N03 release.

Run with Python 3 and GDAL/OGR+GEOS:
  python3 scripts/build-japanese-island-view.py /path/to/zip-directory
The directory must contain 01.zip (Hokkaido), 32.zip (Shimane) and
47.zip (Okinawa), or the original N03-20260101_XX_GML.zip filenames.
Use --remote with 13.zip (Tokyo) to build the separate ordinary Japanese islands extract.
"""
import argparse
import hashlib
import json
from pathlib import Path
from osgeo import ogr, osr

RELEASE = "20260101"
SOURCE = "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html"
ARCHIVE = "https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2026/N03-20260101_{}_GML.zip"
HASHES = {
    "01": "075eaa5ddd53689a4d2efb647fb85a8aed44d9a364d574402cb9208470254dc9",
    "32": "f0db98d24183cde1a9ed452e39e702c63981caecdcf52bddbab52fcaac749701",
    "47": "7970c476e0222b5f8cb0943b067193d4456604718991151bb418c0096451e885",
}
SOURCE_NAME = "国土数値情報（行政区域データ・2026年）（国土交通省）を加工して作成"


TOKYO_HASHES = {"13": "94f10b26256566db970dd74b09d614f059c1e8a432f9244ac9c4add76c32ff16"}
TOKYO_GROUPS = ("okinotorishima", "minamitorishima", "nishinoshima")


def group_for(code, envelope):
    west, east, south, north = envelope
    # Separate entire features only; never clip to a rectangle or label its water.
    # Nemuro includes both the mainland and Habomai. The westernmost Habomai
    # islets begin near 145°51'E across the Goyomai Channel. 145.84 falls in
    # the channel with a verified gap between source components on either side.
    if code == "01223" and west >= 145.84:
        return "habomai"
    if code in ("01696", "01697"):
        return "kunashiri"
    if code in ("01698", "01699", "01700"):
        return "etorofu"
    if code == "01695":
        return "shikotan"
    if code == "32528" and 131.84 < west <= east < 131.90 and 37.20 < south <= north < 37.28:
        return "takeshima"
    if code == "47207" and 123.40 < west <= east < 124.65 and 25.65 < south <= north < 26.00:
        return "senkaku"
    if code == "13421":
        if 153.96 < west <= east < 154 and 24.27 < south <= north < 24.31:
            return "minamitorishima"
        if 140.83 < west <= east < 140.92 and 27.20 < south <= north < 27.28:
            return "nishinoshima"
        # N03 contains two small central features, large concrete shoulder features
        # and detached infrastructure. Select only the two central mapped cores.
        if (136.06972 < west <= east < 136.06981 and 20.42520 < south <= north < 20.42529
                or 136.08109 < west <= east < 136.08119 and 20.42555 < south <= north < 20.42565):
            return "okinotorishima"
    return None


def parts(geom):
    if geom.GetGeometryName() == "POLYGON":
        yield geom
    elif geom.GetGeometryName() in ("MULTIPOLYGON", "GEOMETRYCOLLECTION"):
        for child in geom:
            yield from parts(child)


def encode_ring(ring, scale):
    pts = []
    for x, y, *_ in ring.GetPoints():
        p = (round(x*scale), round(y*scale))
        if not pts or pts[-1] != p:
            pts.append(p)
    if pts[0] != pts[-1] or len(set(pts)) < 3:
        raise ValueError("Ring collapsed at chosen precision")
    pts.pop()
    offset = pts.index(min(pts))
    pts = pts[offset:] + pts[:offset]
    previous = (0, 0)
    encoded = []
    for point in pts:
        for value, old in zip(point, previous):
            diff = value - old
            zigzag = 2*diff if diff >= 0 else -2*diff-1
            while zigzag >= 32:
                encoded.append(chr(95 + zigzag % 32))
                zigzag //= 32
            encoded.append(chr(63 + zigzag))
        previous = point
    return "".join(encoded)


def build(directory, remote=False):
    ogr.UseExceptions()
    target = osr.SpatialReference()
    target.ImportFromEPSG(4326)
    target.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    grouped = {}
    inputs = TOKYO_HASHES if remote else HASHES
    for prefecture, digest in inputs.items():
        archive = directory / (prefecture + ".zip")
        if not archive.exists():
            archive = directory / f"N03-{RELEASE}_{prefecture}_GML.zip"
        if hashlib.sha256(archive.read_bytes()).hexdigest() != digest:
            raise ValueError(f"Source SHA-256 mismatch: {archive}")
        ds = ogr.Open(f"/vsizip/{archive.resolve()}/N03-{RELEASE}_{prefecture}.shp")
        layer = ds.GetLayer()
        crs = layer.GetSpatialRef().Clone()
        crs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
        transform = osr.CoordinateTransformation(crs, target)
        for feature in layer:
            geom = feature.GetGeometryRef()
            code = feature.GetFieldAsString("N03_007")
            if code == "01223":
                w,e,_,_ = geom.GetEnvelope()
                if w <= 145.84 <= e and geom.GetGeometryName() == "POLYGON":
                    raise ValueError("Geometry spans the Habomai selection meridian")
            name = group_for(code, geom.GetEnvelope())
            if name:
                for polygon in parts(geom):
                    piece = polygon.Clone()
                    piece.Transform(transform)
                    grouped.setdefault(name, ogr.Geometry(ogr.wkbMultiPolygon)).AddGeometry(piece)
    groups = []
    names = TOKYO_GROUPS if remote else ("etorofu", "kunashiri", "shikotan", "habomai", "takeshima", "senkaku")
    for name in names:
        # Merge internal municipal lines, which are not shorelines. GEOS repairs
        # invalid source components before union, if any, preserving polygon parts.
        valid = ogr.Geometry(ogr.wkbMultiPolygon)
        for p in grouped[name]:
            fixed = p if p.IsValid() else p.MakeValid()
            for q in parts(fixed):
                valid.AddGeometry(q)
        merged = valid.UnionCascaded()
        precision = 8 if remote or name in ("senkaku", "takeshima") else 6
        scale = 10**precision
        rows = []
        for polygon in parts(merged):
            # Simplify the long rings only; leave even metre-scale islets in the atlas.
            if not remote and name not in ("senkaku", "takeshima") and polygon.GetGeometryRef(0).GetPointCount() > 512:
                polygon = polygon.SimplifyPreserveTopology(0.000016)
            w,e,s,n = polygon.GetEnvelope()
            bounds = [round(v, precision) for v in (w, s, e, n)]
            rings = [encode_ring(r, scale) for r in polygon]
            rows.append([bounds, rings[0], *sorted(rings[1:])])
        rows.sort()
        bounds = [min(row[0][0] for row in rows), min(row[0][1] for row in rows),
                  max(row[0][2] for row in rows), max(row[0][3] for row in rows)]
        groups.append({"name": name, "bbox": bounds, "scale": scale, "polygons": rows})
    manifest = {
        "source": "mlit-n03-japan-islands", "version": "N03-20260101", "attribution": SOURCE_NAME,
        "sourceUrl": SOURCE, "license": "CC BY 4.0", "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
        "originalSurveyCredit": "測量法に基づく国土地理院長承認（複製）R 7JHf 351",
        "archives": [{"url": ARCHIVE.format(p), "sha256": h} for p,h in inputs.items()],
        "viewpoint": {
            "northern-territories":"https://www.mofa.go.jp/mofaj/area/hoppo/hoppo.html",
            "takeshima":"https://www.mofa.go.jp/mofaj/area/takeshima/",
            "senkaku":"https://www.mofa.go.jp/mofaj/area/senkaku/",
        },
        "habomaiSource":"https://www.pref.hokkaido.lg.jp/sm/hrt/habomaigunntou.html",
        "notes":"Municipal boundaries dissolved by island group. Long northern rings simplified at 0.000016 degrees. Takeshima and Senkaku retain all source vertices. WGS84 coordinates stored with six decimal places in northern groups and eight in Takeshima/Senkaku. The source includes mapped offshore rocks; polygon parts are not a count of named islands or a maritime boundary.",
    }
    if remote:
        if len(next(g for g in groups if g["name"] == "okinotorishima")["polygons"]) != 2:
            raise ValueError("Expected both protected Okinotorishima core features")
        del manifest["viewpoint"], manifest["habomaiSource"]
        manifest["source"] = "mlit-n03-tokyo-remote-islands"
        manifest["notes"] = "Ordinary Japanese island geography. Source WGS84 polygons retained to eight decimal places. At Okinotorishima only the two central mapped features within the shore protection works are used. The atoll, surrounding water and detached works are excluded. N03 does not survey tide-dependent rock exposure. Nishinoshima coastline is edition-specific."
        manifest["okinotorishimaSource"] = "https://www.ktr.mlit.go.jp/keihin/keihin_index130.html"
    return {"manifest":manifest,"groups":groups}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--remote", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if not args.output:
        file = "japaneseRemoteIslands.json" if args.remote else "japaneseIslandView.json"
        args.output = Path(__file__).resolve().parents[1]/"src/data"/file
    result = build(args.directory, args.remote)
    args.output.write_text(json.dumps(result, ensure_ascii=False, separators=(",",":"))+"\n",encoding="utf-8")
    print({g["name"]:len(g["polygons"]) for g in result["groups"]}, args.output.stat().st_size)
