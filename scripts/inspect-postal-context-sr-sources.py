"""Offline, digest-bound Suriname Postal Context source inspector.

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
        "file": "upu-general-addressing-issues.pdf",
        "url": "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf",
        "bytes": 631050,
        "sha256": "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d",
        "kind": "pdf",
        "pages": 12,
        "page_markers": {3: ["Universal DataBase (Sep. 2025)", "List of countries which do not require postal codes", "Suriname"]},
    },
    {
        "file": "upu-suriname-addressing.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/surEn.pdf",
        "bytes": 65498,
        "sha256": "65a2a969de23d5567bfdcdc417a52ca086d5fccdb41268a5566f81d6bf1cdb42",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {0: ["Suriname", "Example", "PARAMARIBO", "SURINAME", "Suriname Postal Corporation (SURPOST)", "03/2005"]},
    },
    {
        "file": "surpost-home.html",
        "url": "https://surpost.com/",
        "bytes": 23673,
        "sha256": "8d14a48461e50f8d0a5f7707c30b54c8b9cc5865c4a9c99611b8be2aab7c36b0",
        "kind": "html",
        "markers": ["Surpost", "Kerkplein 1", "Alle rechten voorbehouden"],
    },
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(text):
    return re.sub(r"\s+", " ", html.unescape(text).replace("’", "'")).strip()


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {path.name for path in source_dir.iterdir() if path.is_file() and path.suffix.lower() in {".pdf", ".html"}}
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
        exact_bodies.append({"file": item["file"], "url": item["url"], "bytes": len(body), "sha256": item["sha256"], "pages": pages})
    return {
        "schemaVersion": "postal-context-sr-source-inspection/v1",
        "countryCode": "SR",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "none",
        "upuListsSurinameAsNotRequiringPostalCodes": True,
        "upuAddressExampleContainsPostcode": False,
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
