#!/usr/bin/env python3
"""Build the bundled Mediterranean, European and overseas shoreline windows."""

import argparse
import json
import runpy
import sqlite3
from collections import defaultdict
from pathlib import Path

import shapely
from osgeo import ogr
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parents[1]
# Share the pinned shoreline format, quantization and padded clipping rules with North America.
shore = runpy.run_path(str(ROOT / "scripts/build-us-canada-shorelines.py"))
DATA = ROOT / "scripts/data"
TARGET = ROOT / "src/data/europe-shorelines"


def extract(archive, gpkg, windows):
    shore["check"](archive, shore["GSHHG_SHA"])
    shore["check"](gpkg, shore["FIELDMAPS_SHA"])
    boxes = [shapely.box(*shore["padded"](w["bbox"])) for w in windows]
    tree = shapely.STRtree(boxes)

    def append(src, field, attrs):
        for part in shore["ogr_parts"](src):
            west, east, south, north = part.GetEnvelope()
            hits = tree.query(shapely.box(west, south, east, north))
            if not len(hits):
                continue
            full = shapely.from_wkb(bytes(part.ExportToWkb()))
            for index in sorted(hits):
                window = windows[index]
                cut = shore["clip"](full, boxes[index].bounds)
                for poly in shore["polygons"](cut):
                    for packed in shore["packed"](poly):
                        if shore["meets"](packed["bbox"], window["bbox"]):
                            window[field].append({**attrs, **packed})

    for level in range(1, 5):
        dataset = ogr.Open(f"/vsizip/{archive.resolve()}/GSHHS_shp/f/GSHHS_f_L{level}.shp")
        for feature in dataset.GetLayer():
            gid = int(feature["id"].split("-")[0])
            kind = "inland-water" if level in (2, 4) else "island"
            if level == 1 and gid in shore["CONTINENTS"]:
                kind = "mainland"
            append(feature.geometry(), "physical", {"id": gid, "level": level, "kind": kind})
    print("Physical layers complete", flush=True)

    with sqlite3.connect(gpkg.resolve().as_uri() + "?mode=ro", uri=True) as db:
        alpha2 = dict(db.execute("SELECT iso_3, iso_2 FROM adm0_polygons WHERE iso_2 IS NOT NULL"))
    dataset = ogr.Open(str(gpkg))
    for feature in dataset.GetLayerByName("adm0_polygons"):
        code = feature["iso_2"]
        attrs = {"code": code or "", "source": "fieldmaps"}
        # This field describes an address region. A group's code alone cannot settle a dispute.
        note = (feature["wld_notes"] or "").lower()
        contested = feature["status_cd"] in (2, 8, 99) or any(
            term in note for term in ("dispute", "sovereignty")
        )
        if contested or not code:
            attrs["review"] = True
        elif feature["iso_3_grp"] in alpha2:
            attrs["sovereign"] = alpha2[feature["iso_3_grp"]]
        append(feature.geometry(), "owners", attrs)


def add_bidasoa(window):
    data = DATA / "bidasoa"
    water = json.loads((data / "surface_hydrographique.geojson").read_text())["features"]
    names = json.loads((data / "detail_orographique.geojson").read_text())["features"]
    assert len(names) == 1 and names[0]["properties"]["cleabs"] == "PAIOROGR0000000025029774"
    seed = shape(names[0]["geometry"])
    rivers = defaultdict(list)
    islands = []
    for f in water:
        geom = shapely.force_2d(shape(f["geometry"]))
        rivers[f["properties"]["persistance"]].append(geom)
        for part in shore["polygons"](geom):
            for ring in part.interiors:
                island = shapely.Polygon(ring)
                if island.contains(seed):
                    islands.append(island)
    if len(islands) != 1:
        raise ValueError("Expected exactly one IGN river hole enclosing the named island")
    extent = shore["padded"](window["bbox"])
    for key, level, kind in [("Intermittent", 5, "intertidal"), ("Permanent", 6, "inland-water")]:
        area = shore["clip"](shapely.union_all(rivers[key]), extent)
        shore["append_physical"](window, area, level, -level, kind, "ign-bidasoa")
    shore["append_physical"](window, islands[0], 7, -7, "island", "ign-bidasoa")


def add_iles_du_salut(window):
    folder = DATA / "iles-du-salut"

    def features(layer):
        return json.loads((folder / f"{layer}.geojson").read_text())["features"]

    (commune,) = features("commune")
    if commune["properties"]["code_insee"] != "97302":
        raise ValueError("Expected the Cayenne administrative geometry")
    admin = shape(commune["geometry"])
    lines = [
        (f["properties"]["niveau"], shapely.Polygon(shape(f["geometry"])))
        for f in features("limite_terre_mer")
    ]
    names = features("detail_orographique")
    if len(lines) != 6 or len(names) != 3:
        raise ValueError("Expected two tide lines for each of the three islands")
    for i, f in enumerate(names):
        point = shape(f["geometry"])
        (high,) = [g for level, g in lines if level == "Plus hautes eaux" and g.covers(point)]
        (low,) = [g for level, g in lines if level == "Plus basses eaux" and g.covers(point)]
        dry = high.intersection(low)
        # Treat tidal margins and differences between the two surveyed outlines as uncertain.
        shore["append_physical"](window, high.union(low), 5, -10 - i, "intertidal", "ign-salut")
        shore["append_physical"](window, dry, 6, -20 - i, "island", "ign-salut")
        for part in shore["polygons"](dry.intersection(admin)):
            for row in shore["packed"](part):
                window["owners"].append({"code": "GF", "sovereign": "FR", "source": "ign-cayenne", **row})


def write(windows, out):
    out.mkdir(parents=True, exist_ok=True)
    pages, current, size = [], [], 2
    for i, window in enumerate(windows):
        for field in ("physical", "owners"):
            for polygon in window[field]:
                line = shore["json_text"]([i, field, polygon])
                if len(line) > 330_000:
                    raise ValueError(f"Unshardable ring in {window['id']}, {len(line)} bytes")
                if current and size + len(line) > 330_000:
                    pages.append(current)
                    current, size = [], 2
                current.append(line)
                size += len(line) + 2
    if current:
        pages.append(current)
    names = []
    for i, rows in enumerate(pages):
        name = f"part-{i:02d}.json"
        (out / name).write_text("[\n" + ",\n".join(rows) + "\n]\n")
        names.append(name)
    for old in out.glob("part-*.json"):
        if old.name not in names:
            old.unlink()
    imports = [f"import part{i} from './{name}';" for i, name in enumerate(names)]
    (out / "index.ts").write_text(
        "// Generated by scripts/build-europe-shorelines.py.\n"
        + "\n".join(imports)
        + "\nexport const parts = ["
        + ", ".join(f"part{i}" for i in range(len(names)))
        + "];\n"
    )
    print(f"{len(windows)} windows, {sum(len(p) for p in pages)} polygons, {len(pages)} shards")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gshhg-archive", type=Path, required=True)
    parser.add_argument("--fieldmaps-gpkg", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=TARGET)
    args = parser.parse_args()
    ogr.UseExceptions()
    windows = [
        {**w, "physical": [], "owners": []}
        for w in json.loads((DATA / "europe-shoreline-windows.json").read_text())
    ]
    extract(args.gshhg_archive, args.fieldmaps_gpkg, windows)
    add_bidasoa(next(w for w in windows if w["id"] == "bidasoa"))
    add_iles_du_salut(next(w for w in windows if w["id"] == "guyane-salut"))
    write(windows, args.output)
