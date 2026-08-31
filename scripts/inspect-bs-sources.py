#!/usr/bin/env python3
"""Fail-closed inspection of exact Bahamas Postal Context evidence."""

import argparse
from hashlib import sha256
import html
import json
from pathlib import Path
import re

from pypdf import PdfReader


EXPECTED = [
    {
        "file": "bahamas-transport-home.html",
        "url": "https://www.transportbah.com/",
        "kind": "html",
        "bytes": 682366,
        "sha256": "302e6d2b51ac159d383d2946ebec4b02fdb5e86ea5f548de186484fd7c84e04c",
        "markers": [
            "Post Office Department, Port Department, Airport Authority, and Department of Meteorology",
            "Post Office Department has played a vital role in connecting people, businesses, and communities across our islands.",
        ],
    },
    {
        "file": "upu-copyright.html",
        "url": "https://www.upu.int/en/Copyright",
        "kind": "html",
        "bytes": 93705,
        "sha256": "440904a9d5e8ec8c51dfde9c783eca62188f0aa5b053c6a8102b9d5dc89c15e9",
        "markers": [
            "None of the materials provided on this website may be used, reproduced or transmitted",
            "not to duplicate the document or parts thereof for distribution or sale external to the user's organization",
        ],
    },
    {
        "file": "upu-disclaimer.html",
        "url": "https://www.upu.int/en/disclaimer",
        "kind": "html",
        "bytes": 94341,
        "sha256": "94f2940ff79617e53a879a64a22d73f70f9632dd76ee0fdd9336c62be25eacee",
        "markers": [
            "Anyone may use or reproduce any information presented on this website",
            "provided that the use of such information is accompanied by an acknowledgement that the UPU is the source",
        ],
    },
    {
        "file": "upu-bhs-addressing.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bhsEn.pdf",
        "kind": "pdf",
        "bytes": 210984,
        "sha256": "499818cf3672d401f7fc563e9a1a085af79b2de64e04ec5325c1063b27601831",
        "pages": 2,
        "edition": "10/2025",
        "page_markers": {
            0: [
                "The Bahamas do not apply a postcode system or home delivery system.",
                "Mail is dispatched via Post Office Boxes.",
                "Poste Restante service is available",
                "P.O. Box GT 2001",
            ],
            1: ["bahamaspostoffice@bahamas.gov.bs", "10/2025"],
        },
    },
    {
        "file": "upu-general-addressing.pdf",
        "url": "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf",
        "kind": "pdf",
        "bytes": 631050,
        "sha256": "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d",
        "pages": 12,
        "edition": "Aug. 2026 publication / Sep. 2025 no-postcode table",
        "page_markers": {
            1: ["Universal DataBase (Aug. 2026)", "List of countries which require postal codes"],
            3: ["Universal DataBase (Sep. 2025)", "List of countries which do not require postal codes", "Bahamas"],
        },
    },
    {
        "file": "bahamas-postal-rate-book.pdf",
        "url": "https://cdn.bahamas.gov.bs/tenant/tenantpostalservice/documents/All%20Documents/PostalRateBook-3-20240426071002.pdf",
        "kind": "pdf",
        "bytes": 1198185,
        "sha256": "6046cc1e5ff8e44def24d0fb8a114dbaf21a55da32f44eebbc7b3794811620a4",
        "pages": 22,
        "edition": "historical scanned rate book / government-hosted copy fixed 2026-08-31",
        "page_markers": {
            7: [
                "HIGH-SPEED MAIL SERVICE (BAHAMAS)",
                "between Nassau and Freeport",
                "delivery is via the post office box system rather than by hand",
            ]
        },
    },
]


def digest(body):
    return sha256(body).hexdigest()


def normalized(value):
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {
        path.name
        for path in source_dir.iterdir()
        if path.is_file() and path.suffix.lower() in {".pdf", ".html"}
    }
    if observed_names != expected_names:
        raise ValueError(
            f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}"
        )

    exact_bodies = []
    for item in expected:
        path = source_dir / item["file"]
        body = path.read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError(f"source-changed-review-required:{item['file']}")
        pages = None
        if item["kind"] == "html":
            text = normalized(body.decode("utf-8", errors="strict"))
            for marker in item["markers"]:
                if normalized(marker) not in text:
                    raise ValueError(f"missing-text-marker:{item['file']}:{marker}")
        elif item["kind"] == "pdf":
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            pdf = PdfReader(str(path))
            pages = len(pdf.pages)
            if pages != item["pages"]:
                raise ValueError(f"pdf-page-count:{item['file']}")
            for page_index, markers in item["page_markers"].items():
                text = normalized(pdf.pages[page_index].extract_text() or "")
                for marker in markers:
                    if normalized(marker) not in text:
                        raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
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
            receipt["edition"] = item["edition"]
        exact_bodies.append(receipt)

    return {
        "schemaVersion": "postal-context-bs-source-inspection/v1",
        "countryCode": "BS",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "none",
        "upuBahamasSheetEdition": "10/2025",
        "upuBahamasSaysNoPostcodesOrHomeDelivery": True,
        "upuListsBahamasAsNotRequiringPostalCodes": True,
        "poBoxOrPostOfficeAbbreviationTreatedAsPostcode": False,
        "currentCompletePostalCodeAssignmentsValidated": 0,
        "officialPostalGeometryRecords": 0,
        "featureOrAddressRowsQueried": 0,
        "productionEligibleRecords": 0,
        "rawSourceRowsEmitted": 0,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
