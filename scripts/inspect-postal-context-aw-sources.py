"""Offline, digest-bound Aruba Postal Context M2 source inspector.

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
        "file": "post-aruba-help-support.html",
        "url": "https://postaruba.com/help-support/",
        "bytes": 64982,
        "sha256": "680d27dbe50f57156f8162946ce144f78e84a6f6ecc43685abec84dff8a503dd",
        "kind": "html",
        "markers": ["Is there a postal code for Aruba?", "No, Aruba doesn't have a postal code."],
    },
    {
        "file": "post-aruba-general-information.html",
        "url": "https://postaruba.com/general-information/",
        "bytes": 62551,
        "sha256": "076112b89177c68fc9e308d4fc88c360d83cb7047596aa9f271bbc61545cd320",
        "kind": "html",
        "markers": [
            "became an independent postal service",
            "Post Aruba N.V. was privatized",
            "Universal Postal Union (UPU)",
        ],
    },
    {
        "file": "post-aruba-home.html",
        "url": "https://postaruba.com/",
        "bytes": 80591,
        "sha256": "73e95026fa4b153d579462a9afb02fb4b7c0df17d410de30d8b3d3137e8dc230",
        "kind": "html",
        "markers": ["© 2026 Copyright Post Aruba"],
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
                "Aruba",
            ]
        },
    },
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(text):
    return re.sub(r"\s+", " ", html.unescape(text).replace("’", "'")).strip()


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
        "schemaVersion": "postal-context-aw-source-inspection/v1",
        "countryCode": "AW",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "none",
        "postArubaStatesNoPostalCode": True,
        "upuListsArubaAsNotRequiringPostalCodes": True,
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
