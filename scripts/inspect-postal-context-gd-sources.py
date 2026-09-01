#!/usr/bin/env python3
"""Fail-closed inspection of fixed Grenada postal reference bodies.

Only exact-body receipts and aggregate absence findings are emitted. Source
bodies, addresses and any geometry remain in the temporary source directory.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from pathlib import Path
from typing import Any

import pdfplumber


EXPECTED: list[dict[str, Any]] = [
    {
        "file": "grenada-postal-home.html",
        "url": "https://grenadapostal.com/",
        "bytes": 162826,
        "sha256": "6da56b5f4b6c8b26a3dd8461b067f90e90b1a15430955c596c1dd91901b7a685",
        "kind": "html",
        "markers": [
            "2025 Statistics",
            "The Grenada Postal Corporation was granted exclusive rights to postal services",
            "Burns Point Grenada Postal Corporation St.George's Grenada W.I.",
            "Copyright © 2026 | Grenada Postal Corporation. All Rights Reserved.",
        ],
        "forbidden": [r"postal\s*code", r"postcode"],
    },
    {
        "file": "grenada-postal-locations.html",
        "url": "https://grenadapostal.com/post-office-locations/",
        "bytes": 137581,
        "sha256": "8fdab503aef62c96342cb80a9098ec08a424833e3b277ed7d80751d5ec8e8dfb",
        "kind": "html",
        "markers": [
            "Sub-Offices & District Post Offices",
            "Bruce Street",
            "Carriacou",
            "Petite Martinique",
            "Grand Anse",
            "Grenville",
            "Sauteurs",
            "Gouyave",
            "St. Davids",
            "Victoria",
            "Point Salines International Airport",
        ],
        "forbidden": [r"postal\s*code", r"postcode"],
    },
    {
        "file": "grenada-government-infrastructure.html",
        "url": "https://www.gov.gd/infrastructure",
        "bytes": 82221,
        "sha256": "3e702ca9b1c160a2097168f814dfc1fab113a521437bc5ed9995376c485feba7",
        "kind": "html",
        "markers": [
            "Grenada’s postal services are run by the Grenada Postal Corporation",
            "52 postal stations and 6 sub-offices",
            "© 2026 Government of Grenada",
        ],
        "forbidden": [r"postal\s*code", r"postcode"],
    },
    {
        "file": "upu-grd-addressing-sheet.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/grdEn.pdf",
        "bytes": 88574,
        "sha256": "84980875705db68e11315b0c9a4945cb655ce9a95ca81245fa7f24536d6d5ff5",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {
            0: [
                "Grenada Address format",
                'recommends adding the word "West Indies"',
                "This is not obligatory",
                "Woburn village",
                "P.O. BOX 1500",
                "ST. ANDREW'S municipality",
                "Grenada Postal Corporation",
                "05/2004",
            ],
        },
        "forbidden": [r"postal\s*code", r"postcode"],
    },
    {
        "file": "upu-general-addressing-issues.pdf",
        "url": "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf",
        "bytes": 631050,
        "sha256": "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d",
        "kind": "pdf",
        "pages": 12,
        "page_markers": {
            3: [
                "Universal DataBase (Sep. 2025)",
                "List of countries which do not require postal codes",
                "Burundi Grenada Solomon Islands",
            ],
        },
    },
    {
        "file": "upu-copyright.html",
        "url": "https://www.upu.int/en/Copyright",
        "bytes": 93707,
        "sha256": "a220767a495925d25e7d987f32efe42cb864471dcb67345bcff01ca46ff953f3",
        "kind": "html",
        "markers": [
            "©2020 Universal Postal Union - All rights reserved.",
            "None of the materials provided on this website may be used, reproduced or transmitted",
            "Access to databases of the UPU",
            "subject to the user's acceptance of UPU's provisions and conditions of copyright",
        ],
    },
]


def digest(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def normalized(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("’", "'")).strip()


def normalized_html(value: str) -> str:
    return normalized(html.unescape(re.sub(r"<[^>]+>", " ", value)))


def inspect_source_dir(source_dir: str | Path, expected: list[dict[str, Any]] = EXPECTED) -> dict[str, Any]:
    root = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {
        path.name for path in root.iterdir() if path.is_file() and path.suffix.lower() in {".pdf", ".html"}
    }
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")

    receipts: list[dict[str, Any]] = []
    for item in expected:
        path = root / item["file"]
        body = path.read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError(f"source-changed-review-required:{item['file']}")

        pages: int | None = None
        if item["kind"] == "html":
            text = normalized_html(body.decode("utf-8", errors="strict"))
            for marker in item["markers"]:
                if normalized(marker) not in text:
                    raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
            for pattern in item.get("forbidden", []):
                if re.search(pattern, text, re.IGNORECASE):
                    raise ValueError(f"unexpected-postcode-marker:{item['file']}:{pattern}")
        elif item["kind"] == "pdf":
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            all_text: list[str] = []
            with pdfplumber.open(path) as pdf:
                pages = len(pdf.pages)
                if pages != item["pages"]:
                    raise ValueError(f"pdf-page-count:{item['file']}")
                all_text = [normalized(page.extract_text() or "") for page in pdf.pages]
                for page_index, markers in item["page_markers"].items():
                    for marker in markers:
                        if normalized(marker) not in all_text[page_index]:
                            raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
            joined = " ".join(all_text)
            for pattern in item.get("forbidden", []):
                if re.search(pattern, joined, re.IGNORECASE):
                    raise ValueError(f"unexpected-postcode-marker:{item['file']}:{pattern}")
        else:
            raise ValueError(f"unsupported-kind:{item['kind']}")

        receipt = {
            "file": item["file"],
            "url": item["url"],
            "bytes": len(body),
            "sha256": item["sha256"],
        }
        if pages is not None:
            receipt["pages"] = pages
        receipts.append(receipt)

    return {
        "schemaVersion": "postal-context-gd-source-inspection/v1",
        "countryCode": "GD",
        "exactBodies": receipts,
        "exactBodiesByteAndSha256Bound": len(receipts),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in receipts),
        "designatedOperator": "Grenada Postal Corporation",
        "currentPostalCodeFormat": "none",
        "governmentInfrastructureNamesOperator": True,
        "governmentPostalStations": 52,
        "governmentSubOffices": 6,
        "currentGpcLocationsReviewedWithoutPostcode": 10,
        "upuAddressingSheetEdition": "05/2004",
        "upuAddressingExamplesWithoutPostcode": 3,
        "upuAddressingSheetWestIndiesOptional": True,
        "upuListsGrenadaAsNotRequiringPostalCodes": True,
        "currentCompletePostalCodeAssignmentsValidated": 0,
        "officialPostalGeometryRecords": 0,
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
