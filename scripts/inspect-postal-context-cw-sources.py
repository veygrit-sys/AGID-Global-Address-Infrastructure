"""Offline, digest-bound Curaçao Postal Context M2 source inspector.

Reads exact official bodies from a caller-provided temporary directory and
emits aggregate receipts only. It performs no network request, address lookup,
source-row output, geometry creation, licence inference or promotion.
"""

import argparse
import hashlib
import html
import json
import re
from pathlib import Path

import pdfplumber


EXPECTED = [
    {
        "file": "cpost-letters-and-documents.html",
        "url": "https://www.cpostinternational.com/sending/letters-and-documents/",
        "bytes": 56857,
        "sha256": "b3196cb39aaf653f2242ebd1f1f682679ea3a808a818a4ad929b28e8e2a0c695",
        "kind": "html",
        "markers": [
            "Destinations Local and international",
            "Mail letters to any address in Curaçao",
            "does not deliver a registered mail item to a physical address",
        ],
    },
    {
        "file": "cpost-additional-services.html",
        "url": "https://www.cpostinternational.com/receiving/additional-services/",
        "bytes": 50236,
        "sha256": "199b891b96b98ca8df17a785c6cf284f3d559a3f5cb79788ea096436ff15b515",
        "kind": "html",
        "markers": [
            "Postal Boxes",
            "any address in Curaçao",
            "Copyright 2026 Cpost International. All rights reserved.",
        ],
    },
    {
        "file": "upu-curacao-addressing-sheet.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/CUWEn.pdf",
        "bytes": 188574,
        "sha256": "5574314ec5aa43a86bc4c1303b29b8d059ece40e4bb6d12a04fef5d5b9b2ef5e",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {
            0: [
                "Curaçao",
                "“CUW” for Curaçao",
                "Cpost International N.V. is the designated postal operator",
                "05/2015",
            ]
        },
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
                "Curaçao",
            ]
        },
    },
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(text):
    no_tags = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", html.unescape(no_tags).replace("’", "'")).strip()


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {
        path.name
        for path in source_dir.iterdir()
        if path.is_file() and path.suffix.lower() in {".pdf", ".html"}
    }
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")

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
                    raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
        elif item["kind"] == "pdf":
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            with pdfplumber.open(path) as pdf:
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
        exact_bodies.append(
            {"file": item["file"], "url": item["url"], "bytes": len(body), "sha256": item["sha256"], "pages": pages}
        )

    return {
        "schemaVersion": "postal-context-cw-source-inspection/v1",
        "countryCode": "CW",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "none",
        "upuListsCuracaoAsNotRequiringPostalCodes": True,
        "cpostCurrentServicesReviewed": True,
        "currentCompletePostalCodeAssignmentsValidated": 0,
        "officialPostalGeometryRecords": 0,
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
