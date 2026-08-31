"""Offline, digest-bound Dominica Postal Context M2 source inspector.

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
        "file": "dominica-government-directory.html",
        "url": "https://www.dominica.gov.dm/government-directory",
        "bytes": 506199,
        "sha256": "50824b6fc1f70e934aaea4fa2b22358a3b7d47e03463b6437a1d4cd34de0561b",
        "kind": "html",
        "markers": ["General Post Office", "Marigot Post Office", "Parcel Post", "Portsmouth Post Office"],
    },
    {
        "file": "dominica-government-copyright.html",
        "url": "https://www.dominica.gov.dm/privacy-copyright-notices",
        "bytes": 30976,
        "sha256": "e4df60aa93be096b5973146dee0f69c2d2a0d02ed0881f725ed0f12a4cbdfe41",
        "kind": "html",
        "markers": [
            "solely for your personal and non-commercial use",
            "must not transmit or distribute any part of this web site without prior written permission",
        ],
    },
    {
        "file": "upu-dma-addressing-sheet.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/dmaEn.pdf",
        "bytes": 82566,
        "sha256": "4f1935283438c3f95d7074d45369279f0204dfd2018c5d7b99d1b44aef0c920f",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {0: ["Dominica", "Mr. Alvin Thomas", "ROSEAU", "General Post Office", "07/2002"]},
    },
    {
        "file": "upu-general-addressing-issues.pdf",
        "url": "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf",
        "bytes": 631050,
        "sha256": "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d",
        "kind": "pdf",
        "pages": 12,
        "page_markers": {3: ["Universal DataBase (Sep. 2025)", "List of countries which do not require postal codes", "Dominica"]},
    },
    {
        "file": "upu-sids-postal-leaders-forum-2025.html",
        "url": "https://www.upu.int/en/events/sids-postal-leaders-forum-2025",
        "bytes": 111184,
        "sha256": "575549a25bef5ed6e36cb559f97f6e865b854f7b8cdc2f155f11e38f395e895c",
        "kind": "html",
        "markers": ["Angela Johnson", "Postmaster General", "Dominica Postal Service"],
    },
    {
        "file": "upu-copyright.html",
        "url": "https://www.upu.int/en/Copyright",
        "bytes": 93715,
        "sha256": "5dee82c5e5f9cf7493d133c0291a115abb78983e7e790c834b84d2039ad102a1",
        "kind": "html",
        "markers": [
            "None of the materials provided on this website may be used, reproduced or transmitted",
            "without permission in writing from the UPU or the publisher concerned",
            "Access to databases of the UPU",
        ],
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
        "schemaVersion": "postal-context-dm-source-inspection/v1",
        "countryCode": "DM",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "none",
        "upuListsDominicaAsNotRequiringPostalCodes": True,
        "currentDominicaPostalServiceAndGovernmentDirectoryReviewed": True,
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
