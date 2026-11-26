#!/usr/bin/env python3
"""Retrieve the live CadGIS/NRW extracts and pinned WorldCover windows used by AGID."""

import argparse
import gzip
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

import numpy as np
from osgeo import gdal, osr

ROOT = Path(__file__).resolve().parents[1]
BOXES = json.loads((ROOT / "scripts/data/europe-complex-borders/windows.json").read_text())
HYDRO = "https://www.wfs.nrw.de/geobasis/wfs_nw_inspire-gewaesser-physisch_atkis-basis-dlm"
CADGIS = "https://ccff02.minfin.fgov.be/geoservices/arcgis/rest/services/WMS/Cadastral_LayersWFS/MapServer/4/query"
# Source COG tile, column, row, width and height. All are on the native 1/12000 degree grid.
PIXELS = {
    "vennbahn": ("N48E006", 1726, 3922, 1732, 1936),
    "jungholz": ("N45E009", 17062, 4894, 820, 532),
    "medjurecje": ("N42E018", 16690, 17163, 556, 407),
}


def fetch(url, params):
    with urlopen(
        Request(url + "?" + urlencode(params), headers={"User-Agent": "AGID source snapshot"}), timeout=75
    ) as response:
        return response.read()


def store(path, value):
    content = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    path.write_bytes(gzip.compress(content, mtime=0))


def belgian_snapshot(raw, out):
    records = json.loads(raw)
    if records.get("exceededTransferLimit"):
        raise ValueError("Incomplete CadGIS response")
    features = [
        {
            "key": f["properties"]["AdMuKey"],
            "revision": f["properties"]["LastUpdDTS"],
            "geometry": f["geometry"],
        }
        for f in records["features"]
    ]
    if {f["key"] for f in features} != {"63004", "63012", "63013", "63023", "63061", "63080"}:
        raise ValueError("Expected all six intersecting cadastral municipalities")
    store(out / "belgian-cadgis.json.gz", sorted(features, key=lambda r: r["key"]))


def hydro_snapshot(responses, out):
    rows = []
    for raw in responses:
        root = ET.fromstring(raw)
        features = root.findall("{*}member")
        if (
            root.tag.split("}")[-1] != "FeatureCollection"
            or root.get("next")
            or len(features) != int(root.get("numberReturned", "-1"))
        ):
            raise ValueError("Incomplete NRW Hydro response")
        for member in features:
            f = member[0]
            for polygon in f.findall("./{*}geometry//{*}Polygon"):
                if not polygon.get("srsName", "").endswith("/25832"):
                    raise ValueError("Unexpected hydro CRS")
                rings = []
                for boundary in list(polygon):
                    values = boundary.findtext(".//{*}posList")
                    if not values or polygon.get("srsDimension", "2") != "2":
                        raise ValueError("Expected a two-dimensional ring")
                    xy = np.fromstring(values, sep=" ").reshape(-1, 2)
                    rings.append(xy.tolist())
                rows.append(
                    {
                        "id": next(value for key, value in f.attrib.items() if key.endswith("}id")),
                        "revision": f.findtext(".//{*}beginLifespanVersion"),
                        "rings": rings,
                    }
                )
    if not rows:
        raise ValueError("No positive water surfaces found")
    store(out / "nrw-hydro.json.gz", sorted(rows, key=lambda x: x["id"]))


def hydro_params():
    west, south, east, north = BOXES["vennbahn"]
    src, dst = osr.SpatialReference(), osr.SpatialReference()
    src.SetFromUserInput("OGC:CRS84")
    dst.ImportFromEPSG(25832)
    dst.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    tr = osr.CoordinateTransformation(src, dst)
    points = [
        tr.TransformPoint(x, y)
        for x in (west - 0.002, east + 0.002)
        for y in (south - 0.002, north + 0.002)
    ]
    box = [
        min(p[0] for p in points),
        min(p[1] for p in points),
        max(p[0] for p in points),
        max(p[1] for p in points),
    ]
    return {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "srsName": "EPSG:25832",
        "count": 3000,
        "bbox": ",".join(str(round(n)) for n in box) + ",EPSG:25832",
    }


def store_water_mask(out, id, raw):
    width, height = PIXELS[id][-2:]
    pixels = np.frombuffer(raw, dtype=np.uint8)
    if len(pixels) != width * height:
        raise ValueError(f"Wrong {id} window size")
    bits = np.packbits(pixels == 80, bitorder="little").tobytes()
    (out / (id + ".water-bits.gz")).write_bytes(gzip.compress(bits, mtime=0))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    out = args.output
    out.mkdir(parents=True, exist_ok=True)
    belgian_snapshot(
        fetch(
            CADGIS,
            {
                "geometry": "6.12,50.49,6.31,50.68",
                "geometryType": "esriGeometryEnvelope",
                "inSR": "4326",
                "spatialRel": "esriSpatialRelIntersects",
                "outFields": "AdMuKey,LastUpdDTS",
                "outSR": "4326",
                "returnGeometry": "true",
                "f": "geojson",
            },
        ),
        out,
    )
    hydro_snapshot(
        [
            fetch(HYDRO, {**hydro_params(), "typeNames": "hy-p:" + layer})
            for layer in ("StandingWater", "Watercourse")
        ],
        out,
    )
    gdal.UseExceptions()
    gdal.SetConfigOption("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")
    for id, (tile, x, y, width, height) in PIXELS.items():
        path = f"https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_{tile}_Map.tif"
        ds = gdal.Open("/vsicurl/" + path)
        store_water_mask(out, id, ds.ReadAsArray(x, y, width, height).tobytes())


if __name__ == "__main__":
    main()
