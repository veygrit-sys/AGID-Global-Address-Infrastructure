#!/usr/bin/env python3
"""Rebuild the bounded territorial atlas. Inputs: pinned AGID high-resolution SQLite,
Natural Earth v5.1.2 map units GeoJSON, Netherlands Kadaster 2026 Baarle GeoJSON.
See docs/territorial-exclave-sources.md. Requires Python 3, GDAL/OGR and GEOS."""

import argparse
import base64
import hashlib
import json
import sqlite3
import zlib
from pathlib import Path
from osgeo import ogr

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/data/territorial-exclaves"
FIELDMAPS = "fieldmaps-usgs-lsib"
PDOK = "kadaster-brk-bestuurlijke-gebieden"
SWISS = "swisstopo-swissboundaries3d-buesingen"
NE = "natural-earth-map-units"
GSHHG = "gshhg-full"
FM_LINK = "https://fieldmaps.io/data/adm0/"
SCALE = 10000000
# Component IDs belong to the pinned FieldMaps source and row order in island-evidence-pack.py.
# Review anchors and source checks must continue to agree on every rebuild.
SITES = [
    ("llivia", "Llívia", "リビア（スペイン領）", "ES", "enclave", ["FR"], 145289, 1.973739, 42.4708),
    (
        "campione",
        "Campione d’Italia",
        "カンピョーネ・ディターリア",
        "IT",
        "enclave",
        ["CH"],
        204888,
        8.9721,
        45.9692,
    ),
    ("madha", "Madha", "マダ", "OM", "enclave", ["AE"], 255652, 56.3141, 25.2869),
    ("nahwa", "Nahwa", "ナハワ", "AE", "counter-enclave", ["OM"], 5487, 56.28086, 25.27582),
    (
        "musandam",
        "Musandam Peninsula",
        "ムサンダム半島",
        "OM",
        "coastal-exclave",
        ["AE"],
        255655,
        56.302664,
        25.995335,
    ),
    ("cabinda", "Cabinda", "カビンダ", "AO", "coastal-exclave", ["CD", "CG"], 34, 12.254928, -5.081129),
    (
        "kaliningrad",
        "Kaliningrad",
        "カリーニングラード",
        "RU",
        "coastal-exclave",
        ["LT", "PL"],
        269512,
        21.41706,
        54.806329,
    ),
    (
        "nakhchivan",
        "Nakhchivan",
        "ナヒチェヴァン",
        "AZ",
        "exclave",
        ["AM", "IR", "TR"],
        16174,
        45.518797,
        39.319766,
    ),
    (
        "point-roberts",
        "Point Roberts",
        "ポイント・ロバーツ",
        "US",
        "coastal-exclave",
        ["CA"],
        331696,
        -123.056,
        48.9868,
    ),
    ("temburong", "Temburong", "テンブロン", "BN", "coastal-exclave", ["MY"], 25920, 115.1754, 4.5844),
    ("oecusse", "Oé-Cusse Ambeno", "オエクシ", "TL", "coastal-exclave", ["ID"], 315918, 124.36, -9.24),
    ("likoma", "Likoma Island", "リコマ島", "MW", "enclave", ["MZ"], 224026, 34.730556, -12.066111),
    (
        "chizumulu",
        "Chizumulu Island",
        "チズムル島",
        "MW",
        "enclave",
        ["MZ"],
        224027,
        34.623611,
        -12.019722,
    ),
    ("san-marino", "San Marino", "サンマリノ", "SM", "enclaved-state", ["IT"], 298609, 12.46, 43.94),
    (
        "vatican",
        "Vatican City",
        "バチカン市国",
        "VA",
        "enclaved-state",
        ["IT"],
        347790,
        12.453185,
        41.903939,
    ),
    ("sokh", "Soʻx (Sokh)", "ソフ", "UZ", "enclave", ["KG"], 347786, 71.07716, 40.03413),
    (
        "shohimardon",
        "Shohimardon",
        "ショヒマルドン",
        "UZ",
        "enclave",
        ["KG"],
        347785,
        71.81018,
        39.97778,
    ),
    ("vorukh", "Vorukh", "ヴォルフ", "TJ", "enclave", ["KG"], 315834, 70.61891, 39.83061),
    ("lolazor", "Lolazor", "ロラゾル", "TJ", "enclave", ["KG"], 315835, 69.54598, 40.06743),
    ("sarvan", "Sarvan", "サルヴァン", "TJ", "enclave", ["UZ"], 315836, 70.62357, 40.95972),
    ("lesotho", "Lesotho", "レソト", "LS", "enclaved-state", ["ZA"], 215014, 28.17487, -29.62406),
]
SMALL_HOSTS = {
    "llivia",
    "campione",
    "madha",
    "nahwa",
    "san-marino",
    "vatican",
    "point-roberts",
    "sokh",
    "shohimardon",
    "vorukh",
    "lolazor",
    "sarvan",
}
SHARED_ISLANDS = {"temburong": "9", "oecusse": "51"}
LAKE_ISLANDS = {"likoma": "187546", "chizumulu": "188043"}
PCGN = "https://assets.publishing.service.gov.uk/media/68aee2f02f1856648215588f/Malawi_Toponymic_Factfile.pdf"
KYRGYZ = "https://assets.publishing.service.gov.uk/media/68dfa392c487360cc70ca0ba/Kyrgyzstan_Toponymic_Factfile.pdf"
TAJIK = "https://assets.publishing.service.gov.uk/media/691c7a7f5a253e2c40d706d8/Tajikistan_Toponymic_Factfile.pdf"
PROOFS = {
    "oecusse": ["https://timor-leste.gov.tl/?lang=en&p=91"],
    "sokh": [KYRGYZ],
    "shohimardon": [KYRGYZ, "https://uzbekistan.travel/ru/o/shahimardan/"],
    "vorukh": [TAJIK],
    "lolazor": [TAJIK],
    "sarvan": [TAJIK],
    "nakhchivan": ["https://nakhchivan.preslib.az/en_a3-0.html"],
    "llivia": ["https://www.catalunya.com/en/continguts/territori/llivia-2-1-170947"],
    "kaliningrad": [
        "https://www.europarl.europa.eu/document/activities/cont/201306/20130627ATT68722/20130627ATT68722EN.pdf"
    ],
    "cabinda": [
        "https://www.un.org/geospatial/sites/default/files/files/documents/2020/Apr/angola_3727_r4_apr08_hr.pdf"
    ],
    "point-roberts": [
        "https://www.whatcomcounty.us/DocumentCenter/View/113857/41-Point-Roberts-Subarea-Plan-2017-adopted"
    ],
    "likoma": [PCGN],
    "chizumulu": [PCGN],
    "temburong": [
        "https://www.bruneitourism.com/wp-content/uploads/2025/03/Brunei-Tourism-Temburong-Brochure-3.pdf"
    ],
    "madha": ["https://www.mdpi.com/2071-1050/18/5/2664"],
    "nahwa": ["https://www.mdpi.com/2071-1050/18/5/2664"],
    "musandam": ["https://www.mdpi.com/2071-1050/18/5/2664"],
    "campione": [
        "https://www.comune.campione-d-italia.co.it/files/download/amministrazione-trasparente/01-disposizioni-generali/01-03-02-atti-amministrativi-generali/statuto-comunale.pdf"
    ],
}
SOURCES = {
    FIELDMAPS: [
        "2025-07-29",
        "FieldMaps international ADM0, USGS shoreline / LSIB; inland-water mask adapted from GSHHG 2.3.7.",
        [FM_LINK, "https://www.soest.hawaii.edu/pwessel/gshhg/"],
    ],
    PDOK: [
        "2026",
        "Adapted from Kadaster, BRK Bestuurlijke Gebieden 2026, CC BY 4.0.",
        [
            "https://www.kadaster.nl/zakelijk/producten/percelen-en-grenzen/bestuurlijke-gebieden",
            "https://www.baarle-nassau.nl/fileadmin/Bestanden_BaarleNassau/Projecten/Masterplan_Centrum_Baarle.pdf",
        ],
    ],
    SWISS: [
        "swissBOUNDARIES3D 2026-01",
        "Federal Office of Topography swisstopo",
        ["https://www.swisstopo.admin.ch/en/landscape-model-swissboundaries3d"],
    ],
    NE: [
        "5.1.2",
        "Made with Natural Earth; inland-water mask adapted from GSHHG 2.3.7.",
        [
            "https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-details/",
            "https://www.soest.hawaii.edu/pwessel/gshhg/",
        ],
    ],
}
features = []
rows = []
hosts = []
borders = []


def cleaned(g):
    return g if g.IsValid() else g.MakeValid()


def parts(g, target="POLYGON"):
    if g.GetGeometryName() == target:
        yield g
    elif g.GetGeometryName() in ("MULTIPOLYGON", "GEOMETRYCOLLECTION", "MULTILINESTRING"):
        for part in g:
            yield from parts(part, target)


def pt(x, y):
    p = ogr.Geometry(ogr.wkbPoint)
    p.AddPoint_2D(x, y)
    return p


def ringpoly(line):
    p = ogr.Geometry(ogr.wkbPolygon)
    p.AddGeometry(line)
    return p


def bboxpoly(w, s, e, n):
    return ogr.CreateGeometryFromWkt(f"POLYGON(({w} {s},{e} {s},{e} {n},{w} {n},{w} {s}))")


def bbox(g):
    w, e, s, n = g.GetEnvelope()
    return [w, s, e, n]


def unpack(blob):
    return ogr.CreateGeometryFromWkb(zlib.decompress(blob))


def nearby(db, t, b, cond, params=()):
    w, s, e, n = b
    return db.execute(
        f"SELECT g.*,r.west,r.east,r.south,r.north FROM {t} g JOIN {t}_box r ON r.id=g.id WHERE r.west<=? AND r.east>=? AND r.south<=? AND r.north>=? AND "
        + cond,
        (e, w, n, s, *params),
    )


def coords(line):
    return [(round(x * SCALE), round(y * SCALE)) for x, y, *_ in line.GetPoints()]


def string(points):
    b = bytearray()
    px = py = 0
    for x, y in points:
        for d in (x - px, y - py):
            n = 2 * d if d >= 0 else -2 * d - 1
            while n >= 128:
                b.append(128 + (n & 127))
                n >>= 7
            b.append(n)
        px, py = x, y
    return base64.b64encode(b).decode()


def compact_poly(g):
    if g.IsEmpty() or g.GetArea() < 1e-14:
        return
    rr = []
    for line in g:
        c = coords(line)[:-1]
        if len(set(c)) < 3:
            continue
        rr.append(string(c))
    if rr:
        return [list(map(lambda a: round(a, 7), bbox(g))), rr]


def append_polys(target, key, g):
    for q in parts(g):
        row = compact_poly(q)
        if row:
            target.append([key, *row])


def add_meta(id, name, ja, code, kind, neighbors, src, physical=None):
    entry = dict(
        id=id,
        name=name,
        nameJa=ja,
        code=code,
        kind=kind,
        neighboringCodes=neighbors,
        source=src,
        extraUrls=PROOFS.get(id, []),
    )
    if id in SHARED_ISLANDS:
        entry["sharedPhysicalId"] = SHARED_ISLANDS[id]
    if physical:
        entry["physicalIslandId"] = physical
    features.append(entry)
    return len(features) - 1


def water_mask(db, g):
    out = cleaned(g)
    for _, level, gid, blob, *_ in nearby(db, "coast", bbox(g), "g.level IN (2,4)"):
        water = unpack(blob)
        if out.Intersects(water):
            out = out.Difference(cleaned(water))
    return out


def exclude_other_islands(db, land, allowed=None):
    # Independent physical coastline prevents a coarse mainland map from
    # swallowing a different offshore island. Pad slightly before quantization.
    prepared = land.CreatePreparedGeometry()
    exclusions = ogr.Geometry(ogr.wkbMultiPolygon)
    for _, _, pid, blob, *_ in nearby(db, "coast", bbox(land), "g.level IN (1,3,6)"):
        if pid == allowed:
            continue
        other = unpack(blob)
        if not prepared.Intersects(other):
            continue
        overlap = land.Intersection(cleaned(other))
        for poly in parts(overlap):
            if poly.GetArea() > 0:
                for piece in parts(poly.Buffer(0.00000025, 2)):
                    exclusions.AddGeometry(piece)
    if exclusions.GetGeometryCount():
        land = land.Difference(exclusions.UnionCascaded())
    return land


def adms(db, box, codes):
    for code in codes:
        for _, _, blob, *_ in nearby(
            db,
            "administrative",
            box,
            "g.region_id IN (SELECT id FROM region WHERE code=? AND disputed=0)",
            (code,),
        ):
            yield code, unpack(blob)


def edgekey(a, b):
    return (a, b) if a <= b else (b, a)


def shared(feature, owner, neighbors):
    # Encode only exactly shared source edges, without connecting across seas, holes or independent frontiers.
    lines = []
    keys = {}
    for polygon in parts(owner):
        for ring in polygon:
            pts = coords(ring)
            labels = [None] * (len(pts) - 1)
            lines.append((pts, labels))
            for i, (a, b) in enumerate(zip(pts, pts[1:])):
                keys[edgekey(a, b)] = (labels, i)
    w, s, e, n = bbox(owner)
    for code, g in neighbors:
        for part in parts(g):
            for ring in part:
                prev = None
                for x, y, *_ in ring.GetPoints():
                    if x < w - 0.000001 or x > e + 0.000001 or y < s - 0.000001 or y > n + 0.000001:
                        prev = None
                        continue
                    p = (round(x * SCALE), round(y * SCALE))
                    if prev is not None:
                        found = keys.get(edgekey(prev, p))
                        if found:
                            found[0][found[1]] = code
                    prev = p
    for pts, labels in lines:
        start = 0
        for i in range(1, len(labels) + 1):
            if i == len(labels) or labels[i] != labels[start]:
                if labels[start]:
                    seq = pts[start : i + 1]
                    xx, yy = zip(*seq)
                    borders.append(
                        [
                            feature,
                            labels[start],
                            [min(xx) / SCALE, min(yy) / SCALE, max(xx) / SCALE, max(yy) / SCALE],
                            string(seq),
                        ]
                    )
                start = i


def national(db):
    for id, name, ja, code, kind, neigh, oid, x, y in SITES:
        owner, actual, disputed = db.execute(
            "SELECT a.wkb,r.code,r.disputed FROM administrative a JOIN region r ON r.id=a.region_id WHERE a.id=?",
            (oid,),
        ).fetchone()
        g = unpack(owner)
        if actual != code or disputed or not g.Contains(pt(x, y)):
            raise ValueError(f"{id} changed source component")
        feat = add_meta(id, name, ja, code, kind, neigh, FIELDMAPS, LAKE_ISLANDS.get(id))
        if id in LAKE_ISLANDS:
            # Administrative jurisdiction of these islands includes lake water. Only the separately
            # mapped GSHHG lake-island and actual administrative overlap can carry our label.
            pid = LAKE_ISLANDS[id]
            (blob,) = db.execute(
                "SELECT wkb FROM coast WHERE level=3 AND physical_id=?", (pid,)
            ).fetchone()
            land = g.Intersection(unpack(blob))
            for _, _, _, b, *_ in nearby(db, "coast", bbox(g), "g.level=4"):
                land = land.Difference(cleaned(unpack(b)))
        else:
            land = water_mask(db, g)
            component = SHARED_ISLANDS.get(id)
            if component:
                # Bridges and national boundaries do not partition a physical island.
                # Its positive shoreline independently bounds the terrestrial district.
                (blob,) = db.execute(
                    "SELECT wkb FROM coast WHERE level=1 AND physical_id=?", (component,)
                ).fetchone()
                land = land.Intersection(cleaned(unpack(blob)))
            land = exclude_other_islands(db, land, component)
        append_polys(rows, feat, land)
        if id not in LAKE_ISLANDS:
            shared(feat, g, adms(db, bbox(g), neigh))
        if id in SMALL_HOSTS:
            w, s, e, n = bbox(g)
            window = [w - 0.008, s - 0.008, e + 0.008, n + 0.008]
            frame = bboxpoly(*window)
            for other, geom in adms(db, window, neigh):
                q = cleaned(geom).Intersection(frame)
                if not q.IsEmpty():
                    append_polys(hosts, [other, FIELDMAPS, window], water_mask(db, q))
        print(id, flush=True)


def baarle(path, db):
    f = json.loads(path.read_text())
    f = next(f for f in f.get("features", [f]) if f["properties"]["naam"] == "Baarle-Nassau")
    g = f["geometry"]
    h = hashlib.sha256(json.dumps(g, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    if h != BAARLE_HASH:
        raise ValueError(f"Unexpected cadastral geometry: {h}")
    geo = ogr.CreateGeometryFromJson(json.dumps(g))
    polys = sorted(geo, key=lambda p: p.GetArea(), reverse=True)
    main = polys[0]
    if len(polys) != 9 or main.GetGeometryCount() != 23:
        raise ValueError("Changed Baarle parcels")
    belg = add_meta(
        "baarle-hertog",
        "Baarle-Hertog enclaves",
        "バールレ・ヘルトフの飛び地",
        "BE",
        "enclave",
        ["NL"],
        PDOK,
    )
    nl = add_meta(
        "baarle-counter",
        "Baarle-Nassau counter-enclaves",
        "バールレ・ナッサウの二重飛び地",
        "NL",
        "counter-enclave",
        ["BE"],
        PDOK,
    )
    n8 = add_meta(
        "baarle-n8",
        "Baarle-Nassau N8 enclave",
        "バールレ・ナッサウの飛び地 N8",
        "NL",
        "enclave",
        ["BE"],
        PDOK,
    )
    nested = set()
    for i in range(1, main.GetGeometryCount()):
        hole = ringpoly(main.GetGeometryRef(i))
        for j, p in enumerate(polys[1:]):
            if hole.Contains(p):
                nested.add(j)
                hole = hole.Difference(p)
        append_polys(rows, belg, hole)
    if len(nested) != 7:
        raise ValueError("Changed Dutch counter-enclave geometry")
    for j, p in enumerate(polys[1:]):
        append_polys(rows, nl if j in nested else n8, p)
    append_polys(hosts, ["NL", PDOK, None], main)
    separate = next(p for j, p in enumerate(polys[1:]) if j not in nested)
    w, s, e, n = bbox(separate)
    window = [w - 0.008, s - 0.008, e + 0.008, n + 0.008]
    for code, g in adms(db, window, ["BE"]):
        q = cleaned(g).Intersection(bboxpoly(*window))
        if not q.IsEmpty():
            append_polys(hosts, [code, FIELDMAPS, window], water_mask(db, q))
    # All enclave/counter-enclave boundaries in these 30 cadastral parcels separate NL and BE.


def alaska(db, path):
    if (
        hashlib.sha256(path.read_bytes()).hexdigest()
        != "57da82be755f4afccd8f3b14251bb2752f5df1395f47d2d86f817470c4a48862"
    ):
        raise ValueError("Unexpected Natural Earth edition")
    ds = ogr.Open(str(path))
    layer = ds.GetLayer()
    can = []
    ak = None
    for f in layer:
        c = f["GU_A3"]
        if c not in ("CAN", "USA"):
            continue
        for g in parts(f.geometry()):
            if c == "CAN":
                can.append(("CA", g.Clone()))
            elif g.Contains(pt(-149.9, 61.2)):
                ak = g.Clone()
    if ak is None or not can:
        raise ValueError("Alaska and Canada source features required")
    feat = add_meta(
        "alaska-mainland", "Mainland Alaska", "アラスカ本土", "US", "coastal-exclave", ["CA"], NE
    )
    append_polys(rows, feat, exclude_other_islands(db, water_mask(db, ak)))
    shared(feat, ak, can)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pack", type=Path)
    parser.add_argument("natural_earth", type=Path)
    parser.add_argument("baarle", type=Path)
    args = parser.parse_args()
    db = sqlite3.connect(f"{args.pack.resolve().as_uri()}?mode=ro", uri=True)
    m = json.loads(db.execute("select value from metadata where key='manifest'").fetchone()[0])
    if (
        m["fieldmapsArchive"]["gpkgSha256"]
        != "516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9"
        or m["gshhgArchive"]["sha256"]
        != "8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41"
    ):
        raise ValueError("Unrecognized source editions")
    national(db)
    baarle(args.baarle, db)
    swiss = json.loads((ROOT / "src/data/buesingenBoundary.json").read_text())
    idx = add_meta(
        "buesingen", "Büsingen am Hochrhein", "ビュージンゲン", "DE", "enclave", ["CH"], SWISS
    )
    g = ogr.CreateGeometryFromJson(json.dumps(dict(type="Polygon", coordinates=[swiss["ring"]])))
    append_polys(rows, idx, g)
    alaska(db, args.natural_earth)
    OUT.mkdir(exist_ok=True)
    key_groups = {
        "arctic": {"alaska-mainland"},
        "asia": {
            "oecusse",
            "temburong",
            "musandam",
            "madha",
            "nahwa",
            "nakhchivan",
            "sokh",
            "shohimardon",
            "vorukh",
            "lolazor",
            "sarvan",
        },
        "africa": {"lesotho", "cabinda", "chizumulu", "likoma"},
    }

    def write(n, value):
        (OUT / (n + ".json")).write_text(
            json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"
        )

    write("manifest", dict(scale=SCALE, sources=SOURCES, features=features))
    for name, ids in [
        *key_groups.items(),
        ("europe", set(f["id"] for f in features) - set.union(*key_groups.values())),
    ]:
        selected = {i for i, f in enumerate(features) if f["id"] in ids}
        write(
            name,
            dict(
                polygons=[r for r in rows if r[0] in selected],
                borders=[r for r in borders if r[0] in selected],
            ),
        )
    write("hosts", hosts)
    db.close()


BAARLE_HASH = "55fe889525db9079480e2e3c4b350bdf9e9712527d9bc85ce7f98f8f7f852aac"
if __name__ == "__main__":
    ogr.UseExceptions()
    main()
