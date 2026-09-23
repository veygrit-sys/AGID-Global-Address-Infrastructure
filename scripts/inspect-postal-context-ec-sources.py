#!/usr/bin/env python3
"""Fail-closed inspection of fixed Ecuador postal-source bodies.

Only aggregate counts and exact-body receipts are emitted. Source rows,
coordinates and geometry never leave the temporary source directory.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from pathlib import Path
from typing import Any

import pdfplumber


EXPECTED: dict[str, dict[str, Any]] = {
    "codigo-postal-ec.html": {
        "bytes": 42912,
        "sha256": "eceba3af7cc032c812c0309c7d10a4138465830886cadaa8c22b9540d6069646",
        "kind": "text",
        "markers": ["Fuentes Cartográficas", "referencial", "proyectos de precisión"],
    },
    "html__que_es_codigopostal.html": {
        "bytes": 3384,
        "sha256": "e4b0470b16ae2b8b85c1fb2d88b6063ceae888bb2d409f0d9c53d766890fc46a",
        "kind": "text",
        "markers": ["seis (6) dígitos", "180204"],
    },
    "js__global.js": {
        "bytes": 932,
        "sha256": "6482af035471510d13d5a69e7f314ce9855d18a5474e54a5e73ca6c7e5e52284",
        "kind": "text",
        "markers": ["geoserver", "arcp_cp", "zona_postal"],
    },
    "js__ec__gob__anp__visor__controlador.componentes.js": {
        "bytes": 31815,
        "sha256": "6161f6cd21adc43a50abaf9b6c577040eae6676a5c9d4d7cae20a8c67375d82f",
        "kind": "text",
        "markers": ["getZonaPostal", "dibujarPoligono", "GeometriasJson.php"],
    },
    "js__ec__gob__anp__visor__servicios__mapa__serviciosMapa.js": {
        "bytes": 9583,
        "sha256": "42c5df0f805471bdc7189d58ec360a4f4d1dceac508b14c3ad8dcb5a6cbe702b",
        "kind": "text",
        "markers": ["getZonaPostal", "soloCodigo=1", "dibujarPoligono"],
    },
    "js__openlayersExcoUtil.js": {
        "bytes": 15273,
        "sha256": "355d1468e7751f72058aa9aa33fb89ac5733ba08ce0831f058f815f200530b51",
        "kind": "text",
        "markers": ["dibujarPoligono", "zoomToExtent"],
    },
    "lookup-180204.json": {
        "bytes": 8721,
        "sha256": "16f36c589619c9b428099a0b53469d722ca24da34204833d8572d928e6f26255",
        "kind": "lookup",
    },
    "norma-tecnica-codigo-postal-ec.pdf": {
        "bytes": 30817,
        "sha256": "dae82ebefccd3a5d2051eadc0fb13305592a9e793be52567bb9e2fcba9bffb05",
        "kind": "pdf",
        "pages": 11,
        "page_markers": {
            0: ["Resolución de la Agencia Nacional Postal 21", "15-jun.-2015", "Estado: Vigente"],
            3: ["seis (6) dígitos", "Zona Postal (zz)"],
            4: ["Asignación del código postal a una zona postal", "Zona Rural", "Zona Urbana"],
            10: ["podrá modificar los códigos postales", "asignar códigos postales únicos"],
        },
    },
    "resolucion-arcp-2020-26.pdf": {
        "bytes": 523762,
        "sha256": "d920b3286d6234b401c5e1d75b54184df7ddcf28e235b9b1fbaed09fcbd9ab12",
        "kind": "pdf",
        "pages": 5,
        "page_markers": {
            3: ["previo la firma de un acuerdo de uso", "medidas de protección"],
            4: ["archivo vectorial de polígonos", "aceptarán el Acuerdo de Uso", "seguridades previo a la descarga"],
        },
    },
}

ALLOWED_SUFFIXES = {".html", ".js", ".json", ".pdf"}
LOOKUP_FIELDS = {"codigo_postal", "provincia", "geometria", "lon", "lat"}
PAIR = re.compile(r"(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)")


def _normalized_text(raw: bytes) -> str:
    return re.sub(r"\s+", " ", raw.decode("utf-8", errors="replace"))


def _finite(value: float) -> bool:
    return math.isfinite(value)


def _inspect_lookup(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or set(payload) != {"data"}:
        raise ValueError("lookup envelope schema drift")
    rows = payload["data"]
    if not isinstance(rows, list) or len(rows) != 1 or not isinstance(rows[0], dict):
        raise ValueError("lookup must contain exactly one result")
    row = rows[0]
    if set(row) != LOOKUP_FIELDS:
        raise ValueError("lookup row schema drift")
    if row["codigo_postal"] != "180204" or row["provincia"] != "TUNGURAHUA":
        raise ValueError("lookup identity drift")
    wkt = row["geometria"]
    if not isinstance(wkt, str) or not wkt.startswith("MULTIPOLYGON(((") or not wkt.endswith(")))"):
        raise ValueError("lookup must expose MultiPolygon WKT")
    positions = [(float(x), float(y)) for x, y in PAIR.findall(wkt)]
    if len(positions) != 227:
        raise ValueError("lookup coordinate-pair count drift")
    if positions[0] != positions[-1]:
        raise ValueError("lookup ring is unclosed")
    if any(not (_finite(x) and _finite(y) and -81.5 <= x <= -75.0 and -5.5 <= y <= 2.0) for x, y in positions):
        raise ValueError("lookup has non-finite or out-of-scope position")
    bbox = [min(x for x, _ in positions), min(y for _, y in positions), max(x for x, _ in positions), max(y for _, y in positions)]
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    if not (0.005 < width < 0.02 and 0.01 < height < 0.03):
        raise ValueError("lookup bounding box span drift")
    try:
        centroid = (float(row["lon"]), float(row["lat"]))
    except (TypeError, ValueError) as exc:
        raise ValueError("lookup centroid schema drift") from exc
    if not all(_finite(value) for value in centroid):
        raise ValueError("lookup centroid is non-finite")
    return {
        "lookupRows": 1,
        "lookupPostcode": "180204",
        "lookupProvince": "TUNGURAHUA",
        "lookupGeometryType": "MultiPolygon",
        "lookupCoordinatePairs": len(positions),
        "lookupClosedRings": 1,
        "lookupInvalidPositions": 0,
        "lookupBoundingBoxFiniteAndInCountry": True,
    }


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
    lookup: dict[str, Any] = {}
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
        elif spec["kind"] == "lookup":
            lookup = _inspect_lookup(path)
        elif spec["kind"] == "pdf":
            _inspect_pdf(path, spec)

    return {
        "schemaVersion": "postal-context-ec-source-inspection/v1",
        "countryCode": "EC",
        "exactBodiesByteAndSha256Bound": len(EXPECTED),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in receipts),
        "receipts": receipts,
        **lookup,
        "officialClientFetchesSameOriginLookup": True,
        "officialClientFitsAndDrawsPolygon": True,
        "officialVectorProductDeclaredPublic": True,
        "vectorDownloadRequiresUseAgreementAcceptanceAndSafeguards": True,
        "useAgreementBodyReviewedOrAccepted": False,
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
