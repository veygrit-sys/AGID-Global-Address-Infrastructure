"""Offline, digest-bound AG official-source inspector.

Reads exact bodies from a caller-provided temporary directory and emits only
aggregate evidence. It performs no network request, transformation, licence
inference, geometry creation, source-row output or M2 promotion.
"""

import argparse
import hashlib
import json
from pathlib import Path

import pdfplumber


EXPECTED = [
    {
        "file": "ag-post-office-act-cap-335.pdf",
        "url": "https://laws.gov.ag/wp-content/uploads/2018/08/cap-335.pdf",
        "bytes": 194353,
        "sha256": "78c3831ee0194cddb56607077bd049e8af1a7385c211c6ebf353b4dba1d7059b",
        "kind": "pdf",
        "pages": 17,
        "page_markers": {
            3: [
                "The postal administration of Antigua and Barbuda",
                "vested in the Cabinet",
                "general post offices, branch",
                "post offices and sub-post offices",
            ]
        },
    },
    {
        "file": "upu-atg-addressing-sheet-2002.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/atgEn.pdf",
        "bytes": 81905,
        "sha256": "e679b94873d2100dae90c1d0e088fc4b43412ce3708766de14cfa98597313952",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {
            0: ["Antigua and Barbuda", "Contact Postmaster General", "General Post Office", "ST. JOHN'S", "07/2002"]
        },
    },
    {
        "file": "upu-copyright.html",
        "url": "https://www.upu.int/en/Copyright",
        "bytes": 93721,
        "sha256": "692f50ab4c8e96df852a6192f7f1d6d241f885a88217b71904f074ac6d02de75",
        "kind": "html",
        "markers": ["All rights reserved", "permission in writing", "not to duplicate the document or parts thereof"],
    },
    {
        "file": "upu-entities-2026-02-05-en.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/statusOfPostalEntities/20260205dPRMListOfEntities_EN.pdf",
        "bytes": 274456,
        "sha256": "0991d6a63ed32a507242c8f0bf3583cdb199751e5603a96af98c21c4608c7e0a",
        "kind": "pdf",
        "pages": 21,
        "page_markers": {
            0: [
                "Position at 05 February 2026",
                "Antigua and",
                "Barbuda",
                "Ministry of Finance and Corporate",
                "Antigua and Barbuda Postal",
                "Service",
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
                "List of countries which do not require postal codes:",
                "Antigua and Barbuda",
            ]
        },
    },
    {
        "file": "upu-mdsa-signatories-2026-06-11.pdf",
        "url": "https://www.upu.int/getmedia/0c6e3d13-a660-47dd-ab2c-7d1a184eda82/upuMdsaSignatories.pdf",
        "bytes": 248993,
        "sha256": "55966cc21ed19b53ee13001ed1b2427d018c968f6f643e25bc65b8637bcb1aa5",
        "kind": "pdf",
        "pages": 3,
        "page_markers": {
            1: ["Information as at 11 June 2026", "AG Antigua and", "Barbuda", "General Post Office", "AGA"]
        },
    },
    {
        "file": "upu-member-ag.html",
        "url": "https://www.upu.int/en/Universal-Postal-Union/About-UPU/Member-Countries?cid=6&csid=-1",
        "bytes": 150295,
        "sha256": "0255ade2c70826218deb544b308cd45266356edf6d541f1c2cd0058c9772e358",
        "kind": "html",
        "markers": ["<h3>Antigua and Barbuda</h3>", "ISO Code 3166/Alpha-2", ">AG<", "20.01.1994"],
    },
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


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
        if item["kind"] == "html":
            text = body.decode("utf-8", errors="strict")
            for marker in item["markers"]:
                if marker not in text:
                    raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
            pages = None
        elif item["kind"] == "pdf":
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            with pdfplumber.open(path) as pdf:
                pages = len(pdf.pages)
                if pages != item["pages"]:
                    raise ValueError(f"pdf-page-count:{item['file']}")
                for page_index, markers in item["page_markers"].items():
                    text = pdf.pages[page_index].extract_text() or ""
                    for marker in markers:
                        if marker not in text:
                            raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
        else:
            raise ValueError(f"unsupported-kind:{item['kind']}")
        exact_bodies.append(
            {
                "file": item["file"],
                "url": item["url"],
                "bytes": len(body),
                "sha256": item["sha256"],
                "pages": pages,
            }
        )

    return {
        "schemaVersion": "postal-context-ag-source-inspection/v1",
        "countryCode": "AG",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "upuGeneralAddressingEdition": "August 2026 publication / September 2025 no-required-postcode table",
        "postcodeRequired": False,
        "designatedOperator": "Antigua and Barbuda Postal Service",
        "governmentEntity": "Ministry of Finance and Corporate Governance",
        "mdsaOrganization": "General Post Office",
        "mdsaOrganizationCode": "AGA",
        "addressingSheetEdition": "07/2002",
        "currentPostalIdentifierRowsValidated": 0,
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
