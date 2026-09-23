"""Offline, digest-bound El Salvador Postal Context source inspector.

Reads exact official public reference bodies from a caller-provided temporary
directory and emits aggregate receipts only. It performs no network request,
address lookup, source-row output, geometry creation, licence inference or
promotion.
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
        "page_markers": {
            1: ["Universal DataBase (Aug. 2026)", "List of countries which require postal codes", "El Salvador"],
            6: ["El Salvador 4"],
            9: ["El Salvador 9999 N"],
        },
    },
    {
        "file": "upu-el-salvador-addressing.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/slvEn.pdf",
        "bytes": 150529,
        "sha256": "97ab4a4a8d4aad14e352440b092ddeeeca1baf8437fba81396e92a4d8dc2bbc7",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {
            0: ["El Salvador", "4 digits to the left of the locality name", "locality or delivery area", "Dirección General de Correos", "05/2019"],
        },
    },
    {
        "file": "correos-home.html",
        "url": "https://www.correos.gob.sv/",
        "bytes": 113039,
        "sha256": "2f9761cdbb516e9f6cdc0923370dbdccc600ded8dff0da1be6fddc47859145dd",
        "kind": "html",
        "markers": ["Dirección General de Correos", "Oficinas Postales"],
    },
    {
        "file": "correos-offices.html",
        "url": "https://www.correos.gob.sv/oficinas-postales/",
        "bytes": 105819,
        "sha256": "4021704d6498ac5574117c9bae7798a13241871f2ff8ec4fed6b7f8f0e507a1a",
        "kind": "html",
        "markers": ["Oficinas Postales", "Dirección General de Correos"],
    },
    {
        "file": "correos-web-policy.html",
        "url": "https://www.correos.gob.sv/politica-web/",
        "bytes": 105805,
        "sha256": "8d36c2af8a2505a97644d229f3bb3321337388a65a88cc7215065701d3032efe",
        "kind": "html",
        "markers": ["Política Web", "Protección de Datos", "Dirección General de Correos"],
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
        "schemaVersion": "postal-context-sv-source-inspection/v1",
        "countryCode": "SV",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "NNNN",
        "upuCurrentDatabaseRequiresPostalCodes": True,
        "upuCurrentLength": 4,
        "datedAddressingSheetEdition": "05/2019",
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
