#!/usr/bin/env python3
"""Fail-closed inspection of exact Chile Postal Context M2 evidence."""

import argparse
from hashlib import sha256
import html
import json
from pathlib import Path
import re

from pypdf import PdfReader


EXPECTED = [
    {
        "file": "chileatiende-postal.html",
        "url": "https://www.chileatiende.gob.cl/fichas/892-codigo-postal",
        "kind": "html",
        "bytes": 185369,
        "sha256": "703576ba909b13a4993d4a7241e8f81bdd12b9514e5fd32ec6166988e30f8c48",
        "markers": ["Última actualización", "comuna, calle y número", "determinada propiedad"],
    },
    {
        "file": "chileatiende-postal.pdf",
        "url": "https://www.chileatiende.gob.cl/fichas/892/1/pdf",
        "kind": "pdf",
        "bytes": 7827,
        "sha256": "46b42cad2ac21eaca3f05fe8c9bc0c5ca9487a089306a23223ae2acba6de271b",
        "pages": 2,
        "edition": "last updated 2026-01-27",
        "page_markers": {0: ["27 enero, 2026", "siete dígitos", "comuna, calle y número", "determinada propiedad"]},
    },
    {
        "file": "correos-postcode.html",
        "url": "https://www.correos.cl/codigo-postal",
        "kind": "html",
        "bytes": 190082,
        "sha256": "d7d90b9902ce5a384447c7707fa7f47b300c6ec2fac599cbfd2320c085601554",
        "markers": ["Código postal Chile", "Comuna*:", "Calles*:", "N&uacute;mero"],
    },
    {
        "file": "upu-chile.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/chlEn.pdf",
        "kind": "pdf",
        "bytes": 255480,
        "sha256": "61ce236665e11c3b72165cbd191571e490fd533ddf788c7ed5066a1bd48c05f1",
        "pages": 2,
        "edition": "03/2017",
        "page_markers": {
            0: ["7 digits", "block face", "Post Office Box", "commune postal code"],
            1: ["postcode (of the post office)", "postcode (of commune)", "03/2017"],
        },
        "forbidden_markers": ["polygon", "multipolygon", "coordinate reference system"],
    },
    {
        "file": "geoportal-csw-capabilities.xml",
        "url": "https://geoportal.cl/csw?service=CSW&version=2.0.2&request=GetCapabilities",
        "kind": "xml",
        "bytes": 12397,
        "sha256": "2ff9230a6853516d32465f18aae9d9cf923b1cfe021516e1f07d6336112dd347",
        "markers": ["GetRecords", "CQL_TEXT", "MaxRecordDefault", "AccessConstraints"],
    },
    {
        "file": "geoportal-csw-codigo-postal.json",
        "url": "https://geoportal.cl/csw?service=CSW&version=2.0.2&request=GetRecords&typenames=csw%3ARecord&resulttype=results&elementsetname=summary&outputformat=application%2Fjson&constraintlanguage=CQL_TEXT&constraint=csw%3AAnyText%20like%20%27%25codigo%20postal%25%27&maxrecords=100",
        "kind": "csw-json",
        "bytes": 751,
        "sha256": "f4c41dcb06f78c2f89a286acc27eb8110aab5126e2a288865c36094008fdb409",
        "records_matched": 0,
        "records_returned": 0,
    },
    {
        "file": "geoportal-csw-postal-search.json",
        "url": "https://geoportal.cl/csw?service=CSW&version=2.0.2&request=GetRecords&typenames=csw%3ARecord&resulttype=results&elementsetname=summary&outputformat=application%2Fjson&constraintlanguage=CQL_TEXT&constraint=csw%3AAnyText%20like%20%27%25postal%25%27&maxrecords=100",
        "kind": "csw-json",
        "bytes": 3892,
        "sha256": "3e1091aa37f0b83c5cf5eafd7d7b71605ea0e2fbd5e0cbc499692edf273ca90b",
        "records_matched": 2,
        "records_returned": 2,
        "allowed_titles": ["Controles Fronterizos 2018", "Controles Fronterizos 2019"],
    },
    {
        "file": "geoportal-dpa-2023.html",
        "url": "https://geoportal.cl/geoportal/catalog/36391/Divisi%C3%B3n-Pol%C3%ADtica-Administrativa-2023",
        "kind": "html",
        "bytes": 37160,
        "sha256": "50a7af60f6a01b590e7931d389df1b6918c0e9f4bf0c1347b9cf15a578f14ff1",
        "markers": ["División Política Administrativa 2023", "Shapefile", "Polígono", "DIFROL"],
    },
]


def digest(body):
    return sha256(body).hexdigest()


def normalized(value):
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def csw_results(document):
    root = document["csw:GetRecordsResponse"]["csw:SearchResults"]
    records = root.get("csw:SummaryRecord", [])
    if isinstance(records, dict):
        records = [records]
    return int(root["@numberOfRecordsMatched"]), int(root["@numberOfRecordsReturned"]), records


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {
        path.name
        for path in source_dir.iterdir()
        if path.is_file() and path.suffix.lower() in {".pdf", ".html", ".json", ".xml"}
        and not path.name.startswith("render-")
    }
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")

    exact_bodies = []
    catalog_counts = {}
    for item in expected:
        path = source_dir / item["file"]
        body = path.read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError(f"source-changed-review-required:{item['file']}")
        pages = None
        if item["kind"] in {"html", "xml"}:
            text = normalized(body.decode("utf-8", errors="strict"))
            for marker in item["markers"]:
                if normalized(marker).lower() not in text.lower():
                    raise ValueError(f"missing-text-marker:{item['file']}:{marker}")
        elif item["kind"] == "csw-json":
            document = json.loads(body)
            matched, returned, records = csw_results(document)
            if matched != item["records_matched"] or returned != item["records_returned"]:
                raise ValueError(f"csw-count-changed-review-required:{item['file']}")
            titles = sorted(record.get("dc:title") for record in records)
            if "allowed_titles" in item and titles != sorted(item["allowed_titles"]):
                raise ValueError(f"csw-title-changed-review-required:{item['file']}")
            catalog_counts[item["file"]] = matched
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
                    if normalized(marker).lower() not in text.lower():
                        raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
            full_text = normalized(" ".join((page.extract_text() or "") for page in pdf.pages)).lower()
            for marker in item.get("forbidden_markers", []):
                if marker.lower() in full_text:
                    raise ValueError(f"unexpected-geometry-marker:{item['file']}:{marker}")
        else:
            raise ValueError(f"unsupported-kind:{item['kind']}")
        receipt = {"file": item["file"], "url": item["url"], "bytes": len(body), "sha256": item["sha256"]}
        if pages is not None:
            receipt.update(pages=pages, edition=item["edition"])
        exact_bodies.append(receipt)

    return {
        "schemaVersion": "postal-context-cl-source-inspection/v1",
        "countryCode": "CL",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "NNNNNNN",
        "currentCompleteSevenDigitAssignmentAcquired": False,
        "completeAssignmentDenominatorEstablished": False,
        "catalogMatchedCodigoPostalRecords": catalog_counts.get("geoportal-csw-codigo-postal.json"),
        "broadPostalCatalogResults": catalog_counts.get("geoportal-csw-postal-search.json"),
        "broadPostalResultsArePostcodeLayers": False,
        "officialSevenDigitPostalPolygonRecords": 0,
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
