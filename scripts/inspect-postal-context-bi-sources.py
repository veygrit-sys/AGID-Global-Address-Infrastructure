"""Offline, digest-bound Burundi Postal Context source inspector."""

import argparse
import hashlib
import html
import json
import re
from pathlib import Path

import pdfplumber


EXPECTED = [
    {"file":"burundi-rnp-decree.html","url":"https://presidence.gov.bi/2025/04/21/decret-no-100-047-du-21-avril-2025-portant-nomination-du-directeur-general-de-la-regie-nationale-des-postes/","bytes":73671,"sha256":"652710979719cdf39e6b01f22ea84435eef1391818595eb06b9b27fdfd8070dc","kind":"html","encoding":"utf-8","markers":["DECRET NO 100/047 DU 21 AVRIL 2025","REGIE NATIONALE DES POSTES"]},
    {"file":"rnp-home.html","url":"https://posteburundi.bi/","bytes":87004,"sha256":"e39b57a42e9c6c01cfd7d52639bf569fe0f54d50dce66bda51116c9e100f74dd","kind":"html","encoding":"iso-8859-1","markers":["REGIE NATIONALE DES POSTES DU BURUNDI","Boite Postale","livraison du courrier"]},
    {"file":"upu-bdi-en.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bdiEn.pdf","bytes":175298,"sha256":"07960bf5d11b37e8578267372257e8c807d6dba02fd716dbdb1bfdd1e16e580c","kind":"pdf","pages":1,"page_markers":{"0":["Burundi","BP 1915","MUKAZA commune","BUJUMBURA province","Régie nationale des postes","11/2025"]}},
    {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93711,"sha256":"3451cd69a4ed19b4728eeeaa596aee5501b9628ca368bbea72f763bfdc30d913","kind":"html","encoding":"utf-8","markers":["without permission in writing from the UPU","Access to databases of the UPU"]},
    {"file":"upu-general-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"page_markers":{"3":["Universal DataBase (Sep. 2025)","List of countries which do not require postal codes","Burundi"]}}
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
        "schemaVersion":"postal-context-bi-source-inspection/v1",
        "countryCode":"BI",
        "exactBodies":receipts,
        "exactBodiesByteAndSha256Bound":len(receipts),
        "exactOfficialBodiesBytes":sum(item["bytes"] for item in receipts),
        "currentPostalCodeFormat":"none",
        "upuListsBurundiAsNotRequiringPostalCodes":True,
        "currentUpuAddressSheetUsesBpCommuneProvinceWithoutPostcode":True,
        "postalBoxIsNonPostcodeObject":True,
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
