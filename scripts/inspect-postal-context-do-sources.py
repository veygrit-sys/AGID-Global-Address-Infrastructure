#!/usr/bin/env python3
"""Fail-closed inspection of fixed Dominican Republic postal-source bodies.

Only aggregate counts and exact-body receipts are emitted. Source rows,
coordinates and geometry never leave the temporary source directory.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from collections import Counter
from pathlib import Path
from typing import Any

import pdfplumber


EXPECTED: dict[str, dict[str, Any]] = {
    "inposdom-search.html": {
        "bytes": 7768,
        "sha256": "81ab3b1a965de54f83798759943d1c8a5b2f24fdf931e6de4355ece86c14c613",
        "kind": "text",
        "markers": ["postal-app.js", "Codigos postales - Inposdom"],
    },
    "inposdom-config.js": {
        "bytes": 50,
        "sha256": "f8c063ea706b3b672cd6b31b61a4e7ddb496e2b85da32f41a6d610c9885cbad6",
        "kind": "text",
        "markers": ['window.APP_CONFIG = {"basePath":"/codigo-postal"};'],
    },
    "inposdom-postal-app.js": {
        "bytes": 18417,
        "sha256": "ff38170f4cc440367d2298e883b1a70c647191dd2c530480b7c768d58e49931b",
        "kind": "text",
        "markers": ["json/data.json", "polygon.php?zipcode=", "fitBounds", "fillOpacity: 0.18"],
    },
    "inposdom-data.json": {
        "bytes": 155272,
        "sha256": "da7d2d9a714cfc0ef642cbd7cf9c1f2f49016a48a67513bbe449a5dc78832592",
        "kind": "index",
    },
    "inposdom-polygon-10100.geojson": {
        "bytes": 1162053,
        "sha256": "107d55ca3e25a18d0c4199024d54a1b8c7a088f30f8d256b41fb9c86e449b78a",
        "kind": "geojson",
        "postcode": "10100",
        "features": 1,
        "rings": 1,
        "vertices": 11278,
    },
    "inposdom-polygon-10101.geojson": {
        "bytes": 1892,
        "sha256": "527d9446f4eb7929dc0a15c7b788a44d06156aa2c876ec94bae40e5cb2145f02",
        "kind": "geojson",
        "postcode": "10101",
        "features": 1,
        "rings": 1,
        "vertices": 17,
    },
    "inposdom-polygon-11903.geojson": {
        "bytes": 17941,
        "sha256": "24d47fc553398eafaa6626d6af5d72f35937f85ec2aca150de4ff50fdb19df75",
        "kind": "geojson",
        "postcode": "11903",
        "features": 4,
        "rings": 4,
        "vertices": 170,
    },
    "inposdom-terms.html": {
        "bytes": 161376,
        "sha256": "8e64ed0f16a7fcc283c631fd08fae4dc884fae3ecd16c7bbf69f03ba28ba45e7",
        "kind": "text",
        "markers": ["Términos de Uso", "propiedad intelectual", "INPOSDOM"],
    },
    "upu-dom-addressing-2005.pdf": {
        "bytes": 137292,
        "sha256": "3d312d2079279f81cc55e2c9754e92e0ca652b5d196e226d919e1ab83ac48020",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {0: ["5 digits", "11903", "10101", "03/2005"]},
    },
    "upu-general-addressing-issues.pdf": {
        "bytes": 631050,
        "sha256": "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d",
        "kind": "pdf",
        "pages": 12,
        "page_markers": {
            1: ["Universal DataBase", "Aug. 2026", "Dominican Republic"],
            6: ["Dominican Republic", "5"],
            9: ["Dominican Republic", "99999"],
        },
    },
    "upu-addressing-solutions.html": {
        "bytes": 200637,
        "sha256": "ae10d9e5953b2a67ec6fd51181cb5168b34692a2e5483056314d8b0253372b28",
        "kind": "text",
        "markers": ["Dominican Republic", "INPOSDOM", "2026.1", "Non-disclosure agreement", "Rates"],
    },
    "datos-inposdom.html": {
        "bytes": 30304,
        "sha256": "d391edccbbcf0b96b8aae78b3533cc0a8c83b76954db3cd7e65f5ca70934fa10",
        "kind": "text",
        "markers": ["Instituto Postal Dominicano", "Conjuntos de datos", "4"],
    },
}

ALLOWED_SUFFIXES = {".html", ".js", ".json", ".geojson", ".pdf"}
INDEX_FIELDS = {"zipcode", "place", "coor_z", "coor_y", "lng", "lat"}


def _normalized_text(raw: bytes) -> str:
    return re.sub(r"\s+", " ", raw.decode("utf-8", errors="replace"))


def _finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _inspect_index(path: Path) -> dict[str, int]:
    rows = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(rows, list) or len(rows) != 1403:
        raise ValueError("postcode index must contain exactly 1403 rows")
    if any(not isinstance(row, dict) or set(row) != INDEX_FIELDS for row in rows):
        raise ValueError("postcode index schema drift")

    valid = []
    invalid_values = []
    missing_coordinates = 0
    duplicates = Counter()
    for row in rows:
        code = str(row["zipcode"]).strip()
        if re.fullmatch(r"\d{5}", code):
            valid.append(code)
        else:
            invalid_values.append(code)
        coords = (row["lng"], row["lat"])
        if not all(_finite_number(value) for value in coords):
            missing_coordinates += 1
        else:
            lng, lat = coords
            if not (-72.5 <= lng <= -68.0 and 17.0 <= lat <= 20.5):
                raise ValueError("coordinate outside conservative Dominican Republic bounds")
        duplicates[json.dumps(row, sort_keys=True, ensure_ascii=False)] += 1

    if len(valid) != 1401 or len(set(valid)) != 528:
        raise ValueError("postcode index aggregate drift")
    if sorted(invalid_values) != ["", "Sin titulo"]:
        raise ValueError("postcode index invalid-value drift")
    duplicate_groups = sum(1 for count in duplicates.values() if count > 1)
    if missing_coordinates != 0 or duplicate_groups != 29:
        raise ValueError("postcode index coordinate/duplicate drift")
    return {
        "searchIndexRows": len(rows),
        "validFiveDigitRows": len(valid),
        "validUniquePostcodes": len(set(valid)),
        "invalidPostcodeRows": len(invalid_values),
        "missingCoordinateRows": missing_coordinates,
        "exactDuplicateGroups": duplicate_groups,
    }


def _inspect_geojson(path: Path, spec: dict[str, Any]) -> dict[str, int]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("type") != "FeatureCollection" or not isinstance(payload.get("features"), list):
        raise ValueError(f"{path.name}: expected FeatureCollection")
    features = payload["features"]
    if len(features) != spec["features"]:
        raise ValueError(f"{path.name}: feature count drift")
    rings = 0
    vertices = 0
    for feature in features:
        if set(feature.get("properties", {})) != {"zipcode"}:
            raise ValueError(f"{path.name}: property schema drift")
        if str(feature["properties"]["zipcode"]) != spec["postcode"]:
            raise ValueError(f"{path.name}: postcode mismatch")
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict) or geometry.get("type") != "Polygon":
            raise ValueError(f"{path.name}: only Polygon probes are accepted")
        coordinates = geometry.get("coordinates")
        if not isinstance(coordinates, list) or not coordinates:
            raise ValueError(f"{path.name}: missing rings")
        for ring in coordinates:
            if not isinstance(ring, list) or len(ring) < 4 or ring[0] != ring[-1]:
                raise ValueError(f"{path.name}: invalid or unclosed ring")
            for position in ring:
                if not isinstance(position, list) or len(position) < 2:
                    raise ValueError(f"{path.name}: invalid position")
                lng, lat = position[:2]
                if not (_finite_number(lng) and _finite_number(lat) and -180 <= lng <= 180 and -90 <= lat <= 90):
                    raise ValueError(f"{path.name}: non-finite/out-of-range position")
            rings += 1
            vertices += len(ring)
    if rings != spec["rings"] or vertices != spec["vertices"]:
        raise ValueError(f"{path.name}: ring/vertex count drift")
    return {"features": len(features), "rings": rings, "vertices": vertices}


def _inspect_pdf(path: Path, spec: dict[str, Any]) -> None:
    if not path.read_bytes().startswith(b"%PDF-"):
        raise ValueError(f"{path.name}: invalid PDF signature")
    with pdfplumber.open(path) as pdf:
        if len(pdf.pages) != spec["pages"]:
            raise ValueError(f"{path.name}: page count drift")
        for page_index, markers in spec["page_markers"].items():
            text = re.sub(r"\s+", " ", pdf.pages[page_index].extract_text() or "")
            for marker in markers:
                if marker not in text:
                    raise ValueError(f"{path.name}: missing PDF marker {marker!r} on page {page_index + 1}")


def inspect(source_dir: Path) -> dict[str, Any]:
    actual = {path.name for path in source_dir.iterdir() if path.is_file() and path.suffix.lower() in ALLOWED_SUFFIXES}
    if actual != set(EXPECTED):
        missing = sorted(set(EXPECTED) - actual)
        extra = sorted(actual - set(EXPECTED))
        raise ValueError(f"exact source set mismatch: missing={missing}, extra={extra}")

    receipts = []
    aggregate: dict[str, int] = {}
    polygon_features = polygon_rings = polygon_vertices = 0
    for name, spec in EXPECTED.items():
        path = source_dir / name
        raw = path.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if len(raw) != spec["bytes"] or digest != spec["sha256"]:
            raise ValueError(f"{name}: exact bytes/SHA-256 mismatch")
        receipts.append({"file": name, "bytes": len(raw), "sha256": digest})
        if spec["kind"] == "text":
            text = _normalized_text(raw)
            for marker in spec["markers"]:
                if marker not in text:
                    raise ValueError(f"{name}: missing marker {marker!r}")
        elif spec["kind"] == "index":
            aggregate.update(_inspect_index(path))
        elif spec["kind"] == "geojson":
            counts = _inspect_geojson(path, spec)
            polygon_features += counts["features"]
            polygon_rings += counts["rings"]
            polygon_vertices += counts["vertices"]
        elif spec["kind"] == "pdf":
            _inspect_pdf(path, spec)

    return {
        "schemaVersion": "postal-context-do-source-inspection/v1",
        "countryCode": "DO",
        "exactBodiesByteAndSha256Bound": len(EXPECTED),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in receipts),
        "receipts": receipts,
        **aggregate,
        "polygonProbes": 3,
        "polygonFeatures": polygon_features,
        "polygonRings": polygon_rings,
        "polygonVertices": polygon_vertices,
        "invalidPolygonRings": 0,
        "invalidPolygonPositions": 0,
        "interactiveSearchUsesSameOriginPolygonEndpoint": True,
        "currentCompleteAssignmentAliasValidityExceptionAndExplicitNonAreaDenominatorEstablished": False,
        "compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished": False,
        "approvedImmutableAgidArtifactEstablished": False,
        "productionEligibleRecords": 0,
        "rawSourceRowsEmitted": 0,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(inspect(args.source_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
