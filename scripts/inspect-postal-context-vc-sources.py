#!/usr/bin/env python3
"""Validate exact Saint Vincent and the Grenadines Postal Context source bodies."""

from __future__ import annotations

import hashlib
import html
import json
import os
import re
import sys
from pathlib import Path

import pdfplumber


EXPECTED = {
    "svg-stats-maps.html": (263152, "a1a4be6bf7288ab89e006f09cb7035f88460e287975c7dc8dfe4828072b27c23"),
    "svg-stats-open-licence.html": (250051, "1f20a418dab4e7cda8a2dc100d979eb657a357dae5eb4ac084e10cc74db8bdab"),
    "svgpost-about-us.html": (26530, "8c163887f5c46911d566d303204b90885b601de4e93de533409a046e0bd5d576"),
    "svgpost-post-codes.html": (34714, "02b3e69dfb6892aa42839b6518d39d77b961490a9efd354a8da4ae0105cc97bd"),
    "upu-vc-addressing.pdf": (241551, "c82f0791f9ee6587ce004f5edfd59019b2e8d473c0437678f17cdf564f7d865b"),
}


def fail(message: str) -> None:
    raise ValueError(message)


def normalized_html(path: Path) -> str:
    source = path.read_text(encoding="utf-8", errors="strict")
    source = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", source, flags=re.I | re.S)
    source = re.sub(r"<[^>]+>", " ", source)
    return re.sub(r"\s+", " ", html.unescape(source)).strip()


def require_markers(name: str, text: str, markers: list[str]) -> None:
    missing = [marker for marker in markers if marker not in text]
    if missing:
        fail(f"{name}: required content drifted: {missing}")


def inspect(source_dir: Path) -> dict:
    actual = {path.name for path in source_dir.iterdir() if path.is_file()}
    expected = set(EXPECTED)
    if actual != expected:
        fail(f"source set mismatch: missing={sorted(expected - actual)} extra={sorted(actual - expected)}")

    receipts = []
    for name, (expected_bytes, expected_sha256) in EXPECTED.items():
        body = (source_dir / name).read_bytes()
        digest = hashlib.sha256(body).hexdigest()
        if len(body) != expected_bytes or digest != expected_sha256:
            fail(f"{name}: exact body mismatch bytes={len(body)} sha256={digest}")
        receipts.append({"filename": name, "bytes": len(body), "sha256": digest})

    codes_text = normalized_html(source_dir / "svgpost-post-codes.html")
    require_markers("svgpost-post-codes.html", codes_text, [
        "Find out the different post codes for:",
        "All Post Boxes in Kingstown",
        "Kingstown (General Delivery)",
        "VC0100",
        "VC0472",
    ])
    codes = sorted(set(re.findall(r"\bVC\d{4}\b", codes_text)))
    if len(codes) != 58:
        fail(f"expected 58 distinct postcode labels, got {len(codes)}")
    if re.search(r"\b(GeoJSON|shapefile|\.shp|\.kml|postal polygon|postal boundary|postal area)\b", codes_text, re.I):
        fail("SVG Post code page unexpectedly contains a geometry-release marker")

    about_text = normalized_html(source_dir / "svgpost-about-us.html")
    require_markers("svgpost-about-us.html", about_text, [
        "designated official postal administration of the State",
        "network of twenty two (22) post offices",
    ])

    maps_text = normalized_html(source_dir / "svg-stats-maps.html")
    require_markers("svg-stats-maps.html", maps_text, [
        "Map of Saint Vincent and the Grenadines by Census Division",
        "for the purpose of the census administration",
        "Division 1: Kingstown",
        "Division 13: Southern Grenadines",
    ])

    licence_text = normalized_html(source_dir / "svg-stats-open-licence.html")
    require_markers("svg-stats-open-licence.html", licence_text, [
        "worldwide, royalty-free non-exclusive licence",
        "copy, modify, translate, publish, adapt",
        "limited solely to the Statistical Office",
        "shall not extend to any third party data",
    ])

    with pdfplumber.open(source_dir / "upu-vc-addressing.pdf") as pdf:
        if len(pdf.pages) != 2:
            fail(f"UPU PDF page count changed: {len(pdf.pages)}")
        pdf_text = re.sub(r"\s+", " ", " ".join((page.extract_text() or "") for page in pdf.pages))
    require_markers("upu-vc-addressing.pdf", pdf_text, [
        "6 digits starting with VC on a separate line below locality",
        "Mail delivery is done through P.O boxes and post offices",
        "Home delivery is very limited in the country",
        "P.O Box delivery",
        "VC0120",
        "VC0400",
        "05/2021",
    ])

    return {
        "schema": "postal-context-vc-source-inspection/v1",
        "countryCode": "VC",
        "exactBodies": receipts,
        "exactBodyCount": len(receipts),
        "totalBytes": sum(item[0] for item in EXPECTED.values()),
        "postcodeFormat": "VCNNNN",
        "distinctOfficialReferenceCodes": len(codes),
        "firstCode": codes[0],
        "lastCode": codes[-1],
        "mixedPostalObjectSemantics": True,
        "statisticalOfficeOpenLicenceValidated": True,
        "statisticalOfficeLicenceExtendsToSvgPostOrUpu": False,
        "censusDivisionGeometryIsPostalGeometry": False,
        "currentCompleteTypedVersionedAssignmentsValidated": 0,
        "officialPostalGeometryRecords": 0,
        "productionEligibleRecords": 0,
        "rawSourceRowsEmitted": 0,
    }


def main() -> int:
    source_dir = Path(os.environ.get("AGID_VC_SOURCE_DIR", ".m2-sources-vc"))
    try:
        result = inspect(source_dir)
    except (OSError, ValueError) as error:
        print(f"VC source inspection failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
