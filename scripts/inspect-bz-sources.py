#!/usr/bin/env python3
"""Fail-closed inspection of exact Belize Postal Context evidence."""

import argparse
from hashlib import sha256
import html
import json
from pathlib import Path
import re

from pypdf import PdfReader


EXPECTED = [
    {
        "file": "belize-postal-home.html",
        "url": "https://www.belizepostalservice.gov.bz/",
        "kind": "html",
        "bytes": 25679,
        "sha256": "5f376c7f987b42b50cdba771c9ec026896a5107bf1ec7a66be67d3d3a83fe125",
        "markers": [
            "To provide quality, fast, and innovative postal solutions to our Belizean Citizen.",
            "120 N Front St, Belize City",
        ],
        "forbidden_markers": ["postal code", "postcode"],
    },
    {
        "file": "belize-postal-regular-mail.html",
        "url": "https://www.belizepostalservice.gov.bz/regular-mail",
        "kind": "html",
        "bytes": 15030,
        "sha256": "518c735873145cfa89235269c14c1cde8000dea7d47572fd0c85c3fd6da8a457",
        "markers": [
            "Ensure that the destination address is clearly printed on the front of the mailing envelope.",
            "You can drop off the mailing envelope at any Belize Postal Office.",
        ],
        "forbidden_markers": ["postal code", "postcode"],
    },
    {
        "file": "belize-postal-po-box.html",
        "url": "https://www.belizepostalservice.gov.bz/p-o-box",
        "kind": "html",
        "bytes": 18068,
        "sha256": "f9d9c7ba2f3ae744a939701e111c76b721f01fe9fa29ce549fc22faf1c55fb57",
        "markers": [
            "A P.O. Box, or Post Office Box, is a convenient and secure way to receive mail and packages",
            "Your P.O. Box number will be part of the address",
        ],
        "forbidden_markers": ["postal code", "postcode"],
    },
    {
        "file": "upu-copyright.html",
        "url": "https://www.upu.int/en/Copyright",
        "kind": "html",
        "bytes": 93713,
        "sha256": "a0f0c116a208fb97322679c25a2e72c7d7d3c8eb5766ae90a29c309d720f82a3",
        "markers": [
            "None of the materials provided on this website may be used, reproduced or transmitted",
            "not to duplicate the document or parts thereof for distribution or sale external to the user's organization",
        ],
    },
    {
        "file": "upu-disclaimer.html",
        "url": "https://www.upu.int/en/disclaimer",
        "kind": "html",
        "bytes": 94321,
        "sha256": "07033a828c1d6ccb7f4073ec913cb0f3f20af7ba50d6f24c3de45865f9496036",
        "markers": [
            "Anyone may use or reproduce any information presented on this website",
            "provided that the use of such information is accompanied by an acknowledgement that the UPU is the source",
        ],
    },
    {
        "file": "upu-blz-addressing.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/blzEn.pdf",
        "kind": "pdf",
        "bytes": 177858,
        "sha256": "a6f77003af704e7b46e30d50a2f5cfaf06f25793153968af773993a21a0cf61e",
        "pages": 1,
        "edition": "05/2021",
        "page_markers": {
            0: [
                "Address Format",
                "KINGS PARK, BELIZE CITY",
                "BELIZE C.A.",
                "05/2021",
            ],
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
            3: ["Universal DataBase (Sep. 2025)", "List of countries which do not require postal codes", "Belize"],
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
            lower_text = text.lower()
            for marker in item.get("forbidden_markers", []):
                if marker.lower() in lower_text:
                    raise ValueError(f"current-postcode-marker-review-required:{item['file']}:{marker}")
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
        "schemaVersion": "postal-context-bz-source-inspection/v1",
        "countryCode": "BZ",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "none",
        "upuBelizeSheetEdition": "05/2021",
        "upuNoPostcodeListEdition": "Sep. 2025",
        "upuListsBelizeAsNotRequiringPostalCodes": True,
        "belizePostalServiceCurrentPagesContainPostcodeRequirement": False,
        "upuAddressExampleContainsPostcode": False,
        "poBoxNumberTreatedAsPostcode": False,
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
