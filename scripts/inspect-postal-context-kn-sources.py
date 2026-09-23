#!/usr/bin/env python3
"""Fail-closed inspection of fixed Saint Kitts and Nevis Postal Context evidence."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from pathlib import Path
from typing import Any

import pdfplumber


EXPECTED_CODES = [
    "KN0101", "KN0102", "KN0103", "KN0104", "KN0105", "KN0106", "KN0107", "KN0108",
    "KN0109", "KN0110", "KN0111", "KN0201", "KN0202", "KN0301", "KN0302", "KN0401",
    "KN0402", "KN0403", "KN0501", "KN0601", "KN0602", "KN0801", "KN0802", "KN0901",
    "KN0902", "KN1001", "KN1002", "KN1101", "KN1102", "KN1201", "KN1202", "KN7000",
]

EXPECTED_SOURCES = [
    {
        "file": "gov-kn-ministry-posts.html",
        "url": "https://www.gov.kn/ministry-of-public-infrastructure-energy-and-utilities-domestic-transport-information-communication-and-technology-and-posts/",
        "bytes": 298701,
        "sha256": "b70ce48646b2026aa025c8b2f22d156005063634efb9a609d3aa18f9088340cf",
        "kind": "html",
        "markers": ["Ministry of Posts", "reliable, efficient, and accessible postal", "All Rights Reserved 2026"],
    },
    {
        "file": "sknis-postal-code-assignments.html",
        "url": "https://sknis.gov.kn/2016/09/05/st-kitts-nevis-postal-code-system/",
        "bytes": 168239,
        "sha256": "6c7c13a22dfbe2fded0c0bc33990b1442bb58a5a247b8946338cb68cf498338a",
        "kind": "html",
        "markers": ["St Kitts Postal Zones and Delivery Districts", "Post Code KN0101", "NEVIS POSTAL ZONES", "Post Code KN1202", "Post Code KN7000"],
        "exact_codes": EXPECTED_CODES,
        "forbid_dataset_links": True,
    },
    {
        "file": "sknis-postal-code-overview.html",
        "url": "https://www.sknis.gov.kn/2016/09/05/st-kitts-nevis-postal-code-system-skn-pcs/",
        "bytes": 162099,
        "sha256": "25da8a5a9dd51fcf82f3fb60723201f07c8fad2e51859962e4685f7f9c396026",
        "kind": "html",
        "markers": ["POSTAL CODE: KN0101", "POSTAL CODE: KN0802", "Postal Zone", "Delivery District", "official launch"],
    },
    {
        "file": "sknis-postal-launch-2017.html",
        "url": "https://sknis.gov.kn/2017/10/09/speech-by-the-hon-ian-patches-liburd-minister-responisible-for-post/",
        "bytes": 165028,
        "sha256": "95b32fba6224c82e61c0fccb64c17a75d8849f8ca782974e84031b39c314fe7c",
        "kind": "html",
        "markers": ["officially launched the Postal Code System", "October 9, 2016"],
    },
    {
        "file": "sknis-postal-modernization-2023.html",
        "url": "https://www.sknis.gov.kn/2023/10/09/minister-maynard-outlines-plans-to-modernize-the-postal-service-as-st-kitts-and-nevis-observes-world-post-day-2023/",
        "bytes": 165537,
        "sha256": "35f8a1a84cce960cf057ffbecb894c97164dc95a5a7d73300004366f7df031a5",
        "kind": "html",
        "markers": ["National Addressing System", "postal code for each of the parishes", "October 9, 2023"],
    },
    {
        "file": "upu-copyright.html",
        "url": "https://www.upu.int/en/Copyright",
        "bytes": 93723,
        "sha256": "d68f46270a47e8e91a9326d99d0c9e88aa1121b158c1db731f464f488f5e5777",
        "kind": "html",
        "markers": ["All rights reserved", "may be used, reproduced or transmitted", "Access to databases of the UPU"],
    },
    {
        "file": "upu-kna-addressing-2017-12.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/knaEn.pdf",
        "bytes": 122871,
        "sha256": "37d1733ce1694b98efd39a7a89f0345ff2f6f63d8d8b5915180faab1abd2b305",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {0: ["St. Kitts and Nevis", "KN + 4 digits", "KN0602", "KN0101", "KN0902", "12/2017"]},
    },
]


def digest(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def clean_html(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def inspect_source_dir(source_dir: str | Path, expected: list[dict[str, Any]] = EXPECTED_SOURCES) -> dict[str, Any]:
    root = Path(source_dir)
    observed = {path.name for path in root.iterdir() if path.is_file()}
    expected_names = {item["file"] for item in expected}
    if observed != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed)}")

    receipts = []
    codes: list[str] = []
    for item in expected:
        body = (root / item["file"]).read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError(f"source-changed-review-required:{item['file']}")
        receipt = {key: item[key] for key in ["file", "url", "bytes", "sha256"]}
        if item["kind"] == "pdf":
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            with pdfplumber.open(root / item["file"]) as pdf:
                if len(pdf.pages) != item["pages"]:
                    raise ValueError(f"pdf-page-count-changed:{item['file']}")
                for page_number, markers in item["page_markers"].items():
                    page_text = pdf.pages[int(page_number)].extract_text() or ""
                    for marker in markers:
                        if marker not in page_text:
                            raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
            receipt["pages"] = item["pages"]
        else:
            text = body.decode("utf-8")
            cleaned = clean_html(text)
            for marker in item.get("markers", []):
                if marker.casefold() not in cleaned.casefold():
                    raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
            if "exact_codes" in item:
                codes = sorted(set(re.findall(r"KN\d{4}", cleaned)))
                if codes != item["exact_codes"]:
                    raise ValueError("official-article-code-set-changed")
            if item.get("forbid_dataset_links"):
                links = re.findall(r'''href=["']([^"']+)["']''', text, flags=re.IGNORECASE)
                dataset_links = [link for link in links if re.search(r"(?:geojson|shp|gpkg|kml|wfs|featureserver|mapserver)(?:\b|[/?#._-])", link, re.IGNORECASE)]
                if dataset_links:
                    raise ValueError(f"official-article-dataset-link-review-required:{dataset_links}")
        receipts.append(receipt)

    if not codes and expected is EXPECTED_SOURCES:
        raise ValueError("official-article-code-set-not-inspected")
    code_bytes = (("\n".join(codes) + "\n") if codes else "").encode()
    return {
        "schemaVersion": "postal-context-kn-source-inspection/v1",
        "countryCode": "KN",
        "exactBodies": receipts,
        "exactBodiesByteAndSha256Bound": len(receipts),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in receipts),
        "currentPostcodeFormat": "KN9999",
        "integralCountryPrefix": "KN",
        "upuAddressingSheetEdition": "12/2017",
        "officialLaunchDate": "2016-10-09",
        "assignmentArticleLastModified": "2017-04-26",
        "observedArticlePostcodes": len(codes),
        "observedArticlePostcodeSetSha256": digest(code_bytes),
        "observedIrregularSpecialCode": "KN7000" if "KN7000" in codes else None,
        "currentCompleteAssignmentAliasValidityExceptionAndExplicitNonAreaDenominatorEstablished": False,
        "officialPostalGeometryRecords": 0,
        "derivedOrVirtualPostalGeometryRecords": 0,
        "compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished": False,
        "productionEligibleRecords": 0,
        "rawSourceRowsEmitted": 0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
