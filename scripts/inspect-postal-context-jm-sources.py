"""Offline, digest-bound Jamaica Postal Context source inspector.

Reads seven exact official bodies from a caller-provided temporary directory
and emits aggregate receipts only. It performs no network request, address
lookup, source-row output, geometry creation, licence inference or promotion.
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
        "file": "jamaica-post-about.html", "url": "https://jamaicapost.gov.jm/about-us/",
        "bytes": 42624, "sha256": "cbab48e933ea4a872257e91ca0a3173eb89554cd4c1bbe8e5767e98e901a5ede",
        "kind": "html", "markers": ["Jamaica Post", "237 Post Offices", "164 Postal Agencies"],
    },
    {
        "file": "jamaica-post-contact.html", "url": "https://jamaicapost.gov.jm/contact-us/",
        "bytes": 39055, "sha256": "896e8289b2dd0b9454fa896b0d6b165b894344c3a096fd9b25424fbe25294149",
        "kind": "html", "markers": ["Central Sorting Office", "South Camp Road", "Kingston"],
    },
    {
        "file": "jamaica-post-kingston.html", "url": "https://jamaicapost.gov.jm/kingston-post-offices/",
        "bytes": 39409, "sha256": "51e74ea25b153d30b7551abdf95cc90342b150a36cf606f97ec9fbf7c97c0d63",
        "kind": "html", "markers": ["KINGSTON | Jamaica Post", "Kingston 2", "Kingston 4", "Kingston 14"],
    },
    {
        "file": "jamaica-post-privacy.html", "url": "https://jamaicapost.gov.jm/privacy-data/",
        "bytes": 39750, "sha256": "e8924d85e0d43402256a6dc2978c2a900be3de572dae4b3e2f7cd9801435bcd7",
        "kind": "html", "markers": ["Privacy", "All Rights Reserved"],
    },
    {
        "file": "upu-copyright.html", "url": "https://www.upu.int/en/Copyright",
        "bytes": 93719, "sha256": "375f44bb8971a8856b96f4288c33a2aca8efc23efb4fe0c6b49b276e3195ed22",
        "kind": "html", "markers": [
            "None of the materials provided on this website may be used, reproduced or transmitted",
            "without permission in writing from the UPU or the publisher concerned",
            "Access to databases of the UPU",
        ],
    },
    {
        "file": "upu-general-addressing-issues-2026-08.pdf",
        "url": "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf",
        "bytes": 631050, "sha256": "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d",
        "kind": "pdf", "pages": 12,
        "page_markers": {3: ["Universal DataBase (Sep. 2025)", "List of countries which do not require postal codes", "Jamaica"]},
    },
    {
        "file": "upu-jamaica-addressing-2021-05.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/jamEn.pdf",
        "bytes": 190553, "sha256": "eb15ce550915abdad06ff50e46d6b33fa878ff169cd9de87d8f0f5b5e3fe62cf",
        "kind": "pdf", "pages": 1,
        "page_markers": {0: ["Jamaica has no postcode system", "Kingston", "sector codes", "05/2021"]},
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
        exact_bodies.append({
            "file": item["file"], "url": item["url"], "bytes": len(body),
            "sha256": item["sha256"], "pages": pages,
        })

    return {
        "schemaVersion": "postal-context-jm-source-inspection/v1",
        "countryCode": "JM",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "none",
        "upuListsJamaicaAsNotRequiringPostalCodes": True,
        "upuJamaicaSheetStatesNoPostcodeSystem": True,
        "kingstonSectorCodesAreNotPostcodes": True,
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
