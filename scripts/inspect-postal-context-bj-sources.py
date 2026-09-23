"""Offline, digest-bound Benin Postal Context source inspector."""

import argparse
import hashlib
import html
import json
import re
from pathlib import Path

import pdfplumber


EXPECTED = [
    {"file":"laposte-agencies.html","url":"https://laposte.bj/nos-agences/","bytes":112888,"sha256":"112029097ecd4b8a42541613f35a973f9b7fec7317b77c9a6e1c60cf9f1a462c","kind":"html","encoding":"utf-8","markers":["Cotonou RP","BUREAUX DE POSTE","78 Agences interconnectées au 30 Juin 2019","All Rights Reserved"]},
    {"file":"laposte-distribution.html","url":"https://laposte.bj/service-distribution/","bytes":218791,"sha256":"b8d6a2353d282028c4b606471c2bd2f784054b3967c1588c02126b648553f8da","kind":"html","encoding":"utf-8","markers":["Boîtes postales","Poste restante","N° Carré, maison, quartier, arrondissement, et la ville","All Rights Reserved"]},
    {"file":"laposte-legal.html","url":"https://laposte.bj/mentions-legales/","bytes":73229,"sha256":"73d3d862ba71e2e23c74dfdaa49145da400573b440fbbbb669e83460d2ea4431","kind":"html","encoding":"utf-8","markers":["Site édité par La Poste du Bénin Sa","01BP 8080 Cotonou","All Rights Reserved"]},
    {"file":"upu-ben-en.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/benEn.pdf","bytes":174608,"sha256":"089a4f4dfbe94dd4adf397c19745e80f10f3cbf2b7765e207f22309f095b52b7","kind":"pdf","pages":1,"page_markers":{"0":["Benin","10 BP 648","delivery post office is identified by two digits","P.O. box number","LA POSTE DU BENIN S.A.","11/2025"]}},
    {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93715,"sha256":"c52e4108bcd38d836c829e15ae733072c11d774a1625bdf274e43f4ea4bd5cbe","kind":"html","encoding":"utf-8","markers":["without permission in writing from the UPU","Access to databases of the UPU","All rights reserved"]},
    {"file":"upu-general-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"page_markers":{"3":["Universal DataBase (Sep. 2025)","List of countries which do not require postal codes","Benin"]}}
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(value):
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {path.name for path in source_dir.iterdir() if path.is_file() and path.suffix.lower() in {".pdf", ".html"}}
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")
    receipts = []
    for item in expected:
        path = source_dir / item["file"]
        body = path.read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError(f"source-changed-review-required:{item['file']}")
        pages = None
        if item["kind"] == "html":
            text = normalized(body.decode(item["encoding"], errors="strict"))
            for marker in item["markers"]:
                if normalized(marker) not in text:
                    raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
        else:
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            with pdfplumber.open(path) as pdf:
                pages = len(pdf.pages)
                if pages != item["pages"]:
                    raise ValueError(f"pdf-page-count:{item['file']}")
                for page_index, markers in item["page_markers"].items():
                    text = normalized(pdf.pages[int(page_index)].extract_text() or "")
                    for marker in markers:
                        if normalized(marker) not in text:
                            raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
        receipts.append({"file":item["file"],"url":item["url"],"bytes":len(body),"sha256":item["sha256"],"pages":pages})
    return {
        "schemaVersion":"postal-context-bj-source-inspection/v1",
        "countryCode":"BJ",
        "exactBodies":receipts,
        "exactBodiesByteAndSha256Bound":len(receipts),
        "exactOfficialBodiesBytes":sum(item["bytes"] for item in receipts),
        "currentPostalCodeFormat":"none",
        "upuListsBeninAsNotRequiringPostalCodes":True,
        "currentUpuAddressSheetUsesDeliveryOfficeIdentifierAndPoBoxWithoutPostcode":True,
        "deliveryOfficeIdentifierAndPostalBoxAreNonPostcodeObjects":True,
        "currentCompletePostalCodeAssignmentsValidated":0,
        "officialPostalGeometryRecords":0,
        "productionEligibleRecords":0,
        "rawSourceRowsEmitted":0
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
