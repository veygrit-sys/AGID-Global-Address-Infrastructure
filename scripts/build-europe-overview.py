#!/usr/bin/env python3
"""Compile continental map units and independently corroborated offshore cells."""

import argparse
import base64
import json
import runpy
from pathlib import Path

import numpy as np
import shapely
from osgeo import gdal, ogr, osr
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parents[1]
WINDOWS = json.loads((ROOT / "scripts/data/europe-overview-windows.json").read_text())
TARGET = ROOT / "src/data/europe-overview"
shared = runpy.run_path(str(ROOT / "scripts/build-global-islands.py"))
shore = runpy.run_path(str(ROOT / "scripts/build-us-canada-shorelines.py"))
LAKES = "2d036f53dedec578001c5c30c2959ee7d4eebc1306900fa4367c49929ec8f2d9"
GRID = 16
OCEAN = "f9696a1337c746a0f6c8c13bc60d0f230d2ef8d105198d5657726c8f8e763fc2"
DISPUTES = "9cafef8b7dfb6b164dc58f218f981f4ace9f716f6c03795d4c62d1ac9f3d50f5"
MINOR = "8c933ca7a4760256bdc46408355706e39764b0fa01c160c28888b90b4faec29f"


def water_grid(args):
    raster = gdal.GetDriverByName("MEM").Create("", 360 * GRID, 180 * GRID, 1, gdal.GDT_Byte)
    crs = osr.SpatialReference()
    crs.ImportFromEPSG(4326)
    raster.SetProjection(crs.ExportToWkt())
    raster.SetGeoTransform((-180, 1 / GRID, 0, 90, 0, -1 / GRID))
    # Admit only ocean cells whose center belongs to the ocean product and whose
    # entire box is clear of every land feature in all four shoreline products.
    for path, value, touched in [
        (args.ocean, 1, False),
        (args.land, 0, True),
        (args.minor, 0, True),
        (f"/vsizip/{args.gshhg_archive.resolve()}/GSHHS_shp/f/GSHHS_f_L1.shp", 0, True),
        (args.fieldmaps_gpkg, 0, True),
    ]:
        ds = ogr.Open(str(path))
        gdal.RasterizeLayer(
            raster,
            [1],
            ds.GetLayer(),
            burn_values=[value],
            options=["ALL_TOUCHED=" + ("TRUE" if touched else "FALSE")],
        )
    grid = raster.ReadAsArray()
    rows = []
    for window in WINDOWS:
        w, s, e, n = window["bbox"]
        area = grid[(90 - n) * GRID : (90 - s) * GRID, (w + 180) * GRID : (e + 180) * GRID]
        bits = np.packbits(area.ravel(), bitorder="little")
        rows.append(base64.b64encode(bits).decode("ascii"))
    return rows


def land_units(args):
    units = shared["load"](args.units, "ne_10m_admin_0_map_units.geojson")
    physical = shared["load"](args.land, "ne_10m_land.geojson")
    # Islands already use the worldwide island atlas. Restrict these positive
    # polygons to the Eurasian/African and the South American physical continents.
    seeds = [shapely.Point(10, 50), shapely.Point(-65, 8), shapely.Point(20, 17)]
    continents = []
    for f in physical:
        for rings in shared["polygons"](f):
            geometry = shapely.Polygon(rings[0], rings[1:])
            if any(geometry.covers(p) for p in seeds):
                continents.append(geometry)
    if not all(any(g.covers(p) for g in continents) for p in seeds):
        raise ValueError("Unexpected physical continents")
    del physical
    exclusions = [
        shape(f["geometry"])
        for path in (args.disputes, args.lakes)
        for f in json.loads(path.read_text())["features"]
    ]
    tree = shapely.STRtree(exclusions)
    result = []
    for i, window in enumerate(WINDOWS):
        if not window.get("land"):
            continue
        # Clip beyond the operational window. The artificial outer edges
        # cannot supply an administrative boundary inside the reviewed extent.
        bounds = shore["padded"](window["bbox"])
        halo = shapely.box(*bounds)
        dry = shapely.union_all([shore["clip"](g, bounds) for g in continents if g.intersects(halo)])
        blocked = [shore["clip"](exclusions[j], bounds) for j in tree.query(halo, predicate="intersects")]
        dry = dry.difference(shapely.union_all(blocked))
        shapely.prepare(dry)
        print(window["id"], "continental mask ready", flush=True)
        # Identify potentially relevant address regions from the pinned map units.
        # LSIB then supplies the actual political division on their common physical continent.
        codes = {
            shared["alpha2"](f["properties"]["ISO_A2_EH"])
            for f in units
            if f["properties"]["TYPE"] not in ("Disputed", "Lease", "Indeterminate")
            and any(shore["meets"](shapely.Polygon(r[0]).bounds, bounds) for r in shared["polygons"](f))
        }
        print(window["id"], "administrative regions selected", flush=True)
        ds = ogr.Open(str(args.fieldmaps_gpkg))
        layer = ds.GetLayerByName("adm0_polygons")
        layer.SetSpatialFilterRect(*bounds)
        by_code = {}
        for f in layer:
            code = f["iso_2"]
            if not code or code not in codes or f["status_cd"] in (2, 8, 99):
                continue
            for component in shore["ogr_parts"](f.geometry()):
                w, e, s, n = component.GetEnvelope()
                if not shore["meets"]((w, s, e, n), bounds):
                    continue
                geometry = shapely.from_wkb(bytes(component.ExportToWkb()))
                geographic = shore["clip"](geometry, bounds)
                if geographic.is_empty or not dry.covers(geographic.representative_point()):
                    continue
                # Break up very long coastlines before constructive overlay to keep GEOS memory bounded.
                if shapely.get_num_coordinates(geographic) > 30_000:
                    pieces = [
                        shore["clip"](geographic, (x, y, x + 5, y + 5))
                        for x in range(
                            5 * int(np.floor(geographic.bounds[0] / 5)),
                            int(np.ceil(geographic.bounds[2])),
                            5,
                        )
                        for y in range(
                            5 * int(np.floor(geographic.bounds[1] / 5)),
                            int(np.ceil(geographic.bounds[3])),
                            5,
                        )
                    ]
                else:
                    pieces = [geographic]
                for piece in pieces:
                    if not piece.is_empty:
                        mask = shore["clip"](
                            dry,
                            (
                                piece.bounds[0] - 0.001,
                                piece.bounds[1] - 0.001,
                                piece.bounds[2] + 0.001,
                                piece.bounds[3] + 0.001,
                            ),
                        )
                        by_code.setdefault(code, []).extend(shore["polygons"](piece.intersection(mask)))
        ordered = sorted(by_code)
        geometries = [shapely.union_all(by_code[code], grid_size=1e-6) for code in ordered]
        print(
            window["id"],
            len(ordered),
            "regions,",
            sum(shapely.get_num_coordinates(geometries)),
            "vertices before shared-edge simplification",
            flush=True,
        )
        # Simplify the coverage together: a border is represented by the same
        # vertices on both sides, including tripoints and holes. In local survey
        # windows the issuer uses the more detailed unsimplified polygons.
        generalized = shapely.coverage_simplify(geometries, tolerance=0.00065)
        for code, geometry in zip(ordered, generalized):
            for part in shore["polygons"](geometry):
                for packed in shore["packed"](part):
                    result.append([i, code, packed])
    return result


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    for name in ("units", "land", "disputes", "ocean", "minor", "lakes", "gshhg-archive", "fieldmaps-gpkg"):
        p.add_argument("--" + name, required=True, type=Path)
    p.add_argument("--output", type=Path, default=TARGET)
    args = p.parse_args()
    ogr.UseExceptions()
    gdal.UseExceptions()
    for path, digest in [
        (args.lakes, LAKES),
        (args.ocean, OCEAN),
        (args.disputes, DISPUTES),
        (args.minor, MINOR),
        (args.gshhg_archive, shore["GSHHG_SHA"]),
        (args.fieldmaps_gpkg, shore["FIELDMAPS_SHA"]),
    ]:
        shore["check"](path, digest)
    rows = land_units(args)
    out = args.output
    out.mkdir(parents=True, exist_ok=True)
    pages = []
    batch, used = [], 0

    # A ring that spans multiple files is reassembled before decoding. Storage
    # segments are never seen by the polygon or border tests.
    def records():
        for index, (window, code, polygon) in enumerate(rows):
            yield [index, window, code, polygon["bbox"]]
            for ri, ring in enumerate(polygon["rings"]):
                for offset in range(0, len(ring), 120_000):
                    yield [index, ri, ring[offset : offset + 120_000]]

    for row in records():
        record = shared["compact"](row)
        if batch and used + len(record) > 320_000:
            pages.append(batch)
            batch, used = [], 0
        batch.append(record)
        used += len(record) + 2
    if batch:
        pages.append(batch)
    for i, page in enumerate(pages):
        (out / f"land-{i}.json").write_text("[\n" + ",\n".join(page) + "\n]\n")
    names = {f"land-{i}.json" for i in range(len(pages))}
    for old in out.glob("land-*.json"):
        if old.name not in names:
            old.unlink()
    (out / "index.ts").write_text(
        "// Generated by scripts/build-europe-overview.py.\n"
        + "".join(f"import part{i} from './land-{i}.json';\n" for i in range(len(pages)))
        + "export const landParts = ["
        + ", ".join(f"part{i}" for i in range(len(pages)))
        + "];\n"
    )
    print(f"{len(rows)} continental polygons, {len({r[1] for r in rows})} regional codes", flush=True)
    (out / "ocean.json").write_text(
        shared["compact"]({"cellsPerDegree": GRID, "bits": water_grid(args)}) + "\n"
    )
