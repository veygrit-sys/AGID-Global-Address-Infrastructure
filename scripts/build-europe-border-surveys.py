#!/usr/bin/env python3
"""Compile two independent descriptions per inland border, plus a separate physical shoreline."""

import argparse
import gzip
import hashlib
import json
import runpy
from pathlib import Path

import numpy as np
import shapely
from osgeo import gdal, ogr, osr
from scipy.ndimage import binary_erosion
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "scripts/data/europe-complex-borders"
WINDOWS = json.loads((DATA / "windows.json").read_text())
SHORE = runpy.run_path(str(ROOT / "scripts/build-us-canada-shorelines.py"))
PIXELS = runpy.run_path(str(ROOT / "scripts/fetch-europe-border-snapshots.py"))["PIXELS"]
SCALE = 10_000_000
INPUTS = {
    "nrw": "9754ff0089f757a6a631ac4e715c2c793efa6d239aed1253a0db9afa04aca93e",
    "bavaria": "0eac6eb995002a47f35098c8b5644ee1d9ccc28dfa1207ecaabb664bc530c996",
    "tirol": "2f954288bb4b0f15267a8efa6fa51c2cbbc139952bc64dc19bff47a562c955e9",
    "at_grid": "c5862ce7ad4c16b1c234838d3dd4945bc641057d4238b02cb71a2077811ad30f",
    "bosnia": "03bab1ddc6c11d77cab370c3e970fee2de106212acaa52318435728196cc418e",
    "serbia": "8786fb697e13e061cf58e3e6adc26a1ec114bf90be7785e4f95700500975d99e",
    "gshhg": SHORE["GSHHG_SHA"],
}
VENN = {
    "muensterbildchen": (6.18364, 50.65647),
    "roetgener-wald": (6.22291, 50.63651),
    "rueckschlag": (6.247405, 50.597546),
    "muetzenich": (6.20781, 50.56351),
    "ruitzhof": (6.19564, 50.52588),
}
BOSNIAN_PIN = shapely.Point(19.41585, 43.55404)


def frame(window):
    # The extraction frame is outside the operational window on all four sides.
    w, s, e, n = WINDOWS[window]
    return shapely.box(w - 0.001, s - 0.001, e + 0.001, n + 0.001)


def parts(geom):
    yield from SHORE["polygons"](geom)


def collect(geom, **attributes):
    result = []
    for poly in parts(shapely.set_precision(geom, 1 / SCALE)):
        bbox = [round(x, 7) for x in poly.bounds]
        rings = [
            SHORE["encode_ring"](np.rint(np.asarray(r.coords)[:, :2] * SCALE).astype(np.int64))
            for r in [poly.exterior, *poly.interiors]
        ]
        result.append({**attributes, "bbox": bbox, "rings": rings})
    return result


def write(out, name, rows):
    (out / (name + ".json")).write_text(json.dumps(rows, separators=(",", ":")) + "\n")


def source_geometries(archive, layer_path, where, transform_grid=None):
    dataset = ogr.Open(f"/vsizip/{archive.resolve()}/{layer_path}")
    layer = dataset.GetLayer()
    layer.SetAttributeFilter(where)
    src = layer.GetSpatialRef()
    src.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    target = osr.SpatialReference()
    target.SetFromUserInput("OGC:CRS84")
    if transform_grid:
        # Use the federal GIS-Grid 2021 explicitly. Falling back to a Helmert
        # approximation moves the point where the two Austrian components touch.
        src = osr.SpatialReference()
        lcc = "+proj=lcc +lat_0=47.5 +lon_0=13.333333333333333 +lat_1=49 +lat_2=46 +x_0=400000 +y_0=400000 +ellps=bessel"
        src.SetFromUserInput(lcc + " +units=m +type=crs")
        opts = osr.CoordinateTransformationOptions()
        opts.SetOperation(
            f"+proj=pipeline +step +inv {lcc} +step +proj=hgridshift +grids={transform_grid.resolve()} "
            "+step +proj=unitconvert +xy_in=rad +xy_out=deg"
        )
        transform = osr.CreateCoordinateTransformation(src, target, opts)
    else:
        transform = osr.CreateCoordinateTransformation(src, target)
    for feature in layer:
        geometry = feature.geometry().Clone()
        geometry.Transform(transform)
        yield feature.items(), shapely.force_2d(shapely.from_wkb(bytes(geometry.ExportToWkb())))


def vennbahn(args, out):
    window = frame("vennbahn")
    raw = gzip.decompress((DATA / "belgian-cadgis.json.gz").read_bytes())
    if (
        hashlib.sha256(raw).hexdigest()
        != "4297c87cab808ef38dfc80e3810d5563d7f3eb50d77520a264b0d7ca06c8b35d"
    ):
        raise ValueError("Unexpected Belgian CadGIS snapshot")
    belgium = shapely.union_all([shape(f["geometry"]) for f in json.loads(raw)]).intersection(window)
    ((state, german),) = source_geometries(args.nrw, "dvg1bld_nw.shp", "KN='05000000'")
    if state["STAND"] != "2025/11/12":
        raise ValueError("Unexpected NRW edition")
    de = list(parts(german.intersection(window)))
    belgian_holes = [shapely.Polygon(r) for p in parts(belgium) for r in p.interiors]
    rows = []
    for site, (x, y) in VENN.items():
        pin = shapely.Point(x, y)
        (enclave,) = [g for g in de if g.contains(pin)]
        (hole,) = [h for h in belgian_holes if h.contains(pin)]
        if enclave.intersection(hole).area / enclave.union(hole).area < 0.96 or not window.contains(
            enclave
        ):
            raise ValueError(f"Uncorroborated enclave {site}")
        de.remove(enclave)
        rows.extend(collect(enclave, site=site))
    if len(belgian_holes) != 5 or not de or any(not g.intersects(window.boundary) for g in de):
        raise ValueError("Expected exactly five detached components within the frame")
    for mainland in de:
        rows.extend(collect(mainland))
    write(out, "vennbahn-nrw", rows)
    write(out, "vennbahn-cadgis", collect(belgium))


def jungholz(args, out):
    window = frame("jungholz")
    core = []
    others = []
    for feature, geom in source_geometries(args.tirol, "VGD_Tirol.shp", "ST_KZ='1'", args.at_grid):
        if not geom.intersects(window):
            continue
        if feature["GKZ"] == "70818":
            core.append(geom)
        else:
            others.append(geom.intersection(window))
    (outer,) = core
    mainland = shapely.union_all(others)
    contact = outer.intersection(mainland)
    if (
        contact.geom_type != "Point"
        or not window.contains(outer)
        or not outer.contains(shapely.Point(10.45, 47.57))
    ):
        raise ValueError(f"Expected the single Sorgschrofen contact, found {contact.wkt[:90]}")
    ((_, bavaria),) = source_geometries(
        args.bavaria, "ALKIS-Vereinfacht/VerwaltungsEinheit.shp", "art='Bundesland' AND ags='09'"
    )
    germany = bavaria.intersection(window)
    austrian = outer.union(mainland)
    if germany.symmetric_difference(window.difference(austrian)).area > window.area * 0.02:
        raise ValueError("Bavarian and Austrian editions do not corroborate the frame")
    write(out, "jungholz-bev", collect(outer, site="jungholz") + collect(mainland))
    write(out, "jungholz-bavaria", collect(germany))
    print("Sorgschrofen shared BEV vertex:", tuple(round(x, 7) for x in contact.coords[0]))


def medjurecje(args, out):
    window = frame("medjurecje")

    def geometry(path):
        (feature,) = json.loads(path.read_text())["features"]
        return shape(feature["geometry"])

    # Preserve the openly licensed national editions in separate files. No
    # coordinates from either edition are merged into the other one's outline.
    bosnia = geometry(args.bosnia).intersection(window)
    (enclave,) = list(parts(bosnia))
    serbian_parts = list(parts(geometry(args.serbia)))
    (hole,) = [
        shapely.Polygon(ring)
        for p in serbian_parts
        for ring in p.interiors
        if shapely.Polygon(ring).contains(BOSNIAN_PIN)
    ]
    if not window.contains(hole) or not window.contains(enclave) or not enclave.contains(BOSNIAN_PIN):
        raise ValueError("Expected a complete detached component and an enclosing Serbian ring")
    if not shapely.union_all(serbian_parts).intersection(window).equals(window.difference(hole)):
        raise ValueError("Other national components intersect the Serbian frame")
    write(out, "medjurecje-bih", collect(enclave, site="medjurecje"))
    write(out, "medjurecje-srb", collect(hole, site="medjurecje"))


def landcover_water(id):
    digest = {
        "vennbahn": "366e0f313b2b78ed65c9aa0b7278b345a1ffedbcbd52a8ccecefa1d662051cbc",
        "jungholz": "2c417205eb39df6a34ccd48d5d655d43b9a5116b5a0f8aaa0e6d905f773ea67a",
        "medjurecje": "32d1b447e666d3e145b46399e0d588f27a8bda7c29fe60f1442e983d19f3ac74",
    }
    bits = gzip.decompress((DATA / (id + ".water-bits.gz")).read_bytes())
    if hashlib.sha256(bits).hexdigest() != digest[id]:
        raise ValueError(f"Wrong WorldCover water mask for {id}")
    tile, col, row, width, height = PIXELS[id]
    pixels = np.unpackbits(
        np.frombuffer(bits, dtype=np.uint8), bitorder="little", count=width * height
    ).reshape(height, width)
    output = []
    geotransform = (
        int(tile[4:]) + col / 12000,
        1 / 12000,
        0,
        int(tile[1:3]) + 3 - row / 12000,
        0,
        -1 / 12000,
    )
    for mask, level, kind in [
        (pixels, 5, "water-margin"),
        (binary_erosion(pixels, np.ones((3, 3), dtype=bool)), 6, "inland-water"),
    ]:
        if not mask.any():
            continue
        ds = gdal.GetDriverByName("MEM").Create("", width, height, 1, gdal.GDT_Byte)
        ds.SetGeoTransform(geotransform)
        band = ds.GetRasterBand(1)
        band.WriteArray(mask.astype(np.uint8))
        vectors = ogr.GetDriverByName("Memory").CreateDataSource("")
        layer = vectors.CreateLayer("mask", geom_type=ogr.wkbPolygon)
        gdal.Polygonize(band, band, layer, -1, [])
        for feature in layer:
            geom = shapely.from_wkb(bytes(feature.geometry().ExportToWkb()))
            if not geom.is_valid:
                geom = shapely.make_valid(geom)
            output.extend(collect(geom, kind=kind, level=level, source="worldcover"))
    return output


def nrw_water():
    raw = gzip.decompress((DATA / "nrw-hydro.json.gz").read_bytes())
    if (
        hashlib.sha256(raw).hexdigest()
        != "9b54cdf5e8b77491d347daa8e7db01fde666a17c4d6fa081c717e09ee1f07d04"
    ):
        raise ValueError("Unexpected NRW Hydro water polygons")
    src, dst = osr.SpatialReference(), osr.SpatialReference()
    src.ImportFromEPSG(25832)
    src.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    dst.SetFromUserInput("OGC:CRS84")
    transform = osr.CoordinateTransformation(src, dst)
    polygons = []
    for feature in json.loads(raw):
        rings = [[(x, y) for x, y, _z in transform.TransformPoints(ring)] for ring in feature["rings"]]
        polygons.append(shapely.Polygon(rings[0], rings[1:]))
    # Only source polygons are included. A stream mapped as a line supplies no water width.
    return collect(
        shapely.union_all(polygons).intersection(frame("vennbahn")),
        kind="inland-water",
        level=7,
        source="nrw-hydro",
    )


def physical(args, out):
    # Test the administrative surfaces separately against GSHHG level 1 and
    # all nested water/island layers. A boundary across water is still water.
    physical = {id: [] for id in WINDOWS}
    boxes = {id: frame(id) for id in WINDOWS}
    for level in range(1, 5):
        ds = ogr.Open(f"/vsizip/{args.gshhg.resolve()}/GSHHS_shp/f/GSHHS_f_L{level}.shp")
        layer = ds.GetLayer()
        for id, box in boxes.items():
            layer.SetSpatialFilterRect(*box.bounds)
            for feature in layer:
                fid = int(feature["id"].split("-")[0])
                kind = (
                    "inland-water"
                    if level in (2, 4)
                    else "mainland"
                    if fid in SHORE["CONTINENTS"] and level == 1
                    else "island"
                )
                geom = shapely.from_wkb(bytes(feature.geometry().ExportToWkb()))
                q = SHORE["clip"](geom, box.bounds)
                physical[id].extend(collect(q, kind=kind, level=level))
    for id, rows in physical.items():
        if not any(r["kind"] == "mainland" for r in rows):
            raise ValueError(f"Missing physical continent in {id}")
    for id in WINDOWS:
        physical[id].extend(landcover_water(id))
    physical["vennbahn"].extend(nrw_water())
    write(out, "physical", physical)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in INPUTS:
        parser.add_argument("--" + name.replace("_", "-"), type=Path, required=True)
    parser.add_argument("--output", type=Path, default=ROOT / "src/data/europe-border-surveys")
    args = parser.parse_args()
    ogr.UseExceptions()
    for field, expected in INPUTS.items():
        SHORE["check"](getattr(args, field), expected)
    args.output.mkdir(exist_ok=True, parents=True)
    vennbahn(args, args.output)
    jungholz(args, args.output)
    medjurecje(args, args.output)
    physical(args, args.output)


if __name__ == "__main__":
    main()
