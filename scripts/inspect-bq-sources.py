#!/usr/bin/env python3
"""Fail-closed inspection of exact Caribbean Netherlands Postal Context evidence."""

import argparse
from hashlib import sha256
import html
import json
from pathlib import Path
import re

from pypdf import PdfReader


EXPECTED = [
    {
        "file": "rcn-post.html",
        "url": "https://www.rijksdienstcn.com/economie-klimaat/post",
        "kind": "html",
        "bytes": 203177,
        "sha256": "381014b05b44304b67298f80c337d7b9979e2ea109fa278640b49a0694efb4a7",
        "markers": [
            "NB In Caribisch Nederland bestaan geen postcodes.",
            "EILANDSNAAM (te weten Bonaire, Saba of Sint Eustatius)",
            "CC0 1.0 Universal",
        ],
    },
    {
        "file": "rcn-copyright.html",
        "url": "https://www.rijksdienstcn.com/service/copyright",
        "kind": "html",
        "bytes": 201137,
        "sha256": "d31a5f993abb428e6d481321dd3a547d512b307f95e29bf56cbabd8cc6746558",
        "markers": ["Creative Commons zero-verklaring (CC0 1.0)"],
    },
    {
        "file": "rcn-postcode-consultation-news.html",
        "url": "https://www.rijksdienstcn.com/actueel/nieuws/2024/juli/17/consultatie-postcodes-voor-caribisch-nederland-van-start",
        "kind": "html",
        "bytes": 210035,
        "sha256": "35644c0282b11b0952dce5f55bde81c8221b96bfac9817922539eada8e48a2ed",
        "markers": [
            "Op dit moment is er geen postcodesysteem in Bonaire, Saba en Sint Eustatius.",
            "ligt er het voorstel om postcodes vast te stellen in de reeks van 0000AA-0999ZZ",
            "CC0 1.0 Universal",
        ],
    },
    {
        "file": "acm-caribbean-post.html",
        "url": "https://www.acm.nl/nl/caribisch-nederland/toezicht-op-de-post-en-telecommarkt-caribisch-nederland",
        "kind": "html",
        "bytes": 71288,
        "sha256": "c948be68cbf6f41967f861fd7b6549f3abd1730a244825dea65342208f307c66",
        "markers": [
            "Flamingo Express Dutch Caribbean (FXDC) verzorgt de post in Caribisch Nederland.",
            "Dit bedrijf heeft de postconcessie gekregen.",
        ],
    },
    {
        "file": "consultation.html",
        "url": "https://www.internetconsultatie.nl/postcodereeks_cn/b1",
        "kind": "html",
        "bytes": 37916,
        "sha256": "fe8132ba2e94ef50c3cb64e0285c608024c7abf767e9a71d0c3dc9bcfad2e5a3",
        "markers": [
            "ligt er een voorstel om postcodes in Caribisch Nederland vast te stellen binnen de reeks van 0000AA tot en met 0999ZZ.",
            "Resultaat gepubliceerd",
        ],
    },
    {
        "file": "consultation-report.pdf",
        "url": "https://www.internetconsultatie.nl/postcodereeks_cn/document/14043",
        "kind": "pdf",
        "bytes": 205461,
        "sha256": "4333a016366cace07ff27292b6590e0050d3ef3153c228fd9c15cd23f8375c7f",
        "pages": 7,
        "edition": "17 December 2024 final v1.0",
        "page_markers": {
            0: ["CONSULTATIEVERSLAG VOORSTEL", "Datum 17 december 2024", "Status DEFINITIEF", "Versienummer 1.0"],
            5: ["0000BQ", "eerste combinatie die mogelijk gebruikt zal worden is 0100AA", "Basisregistratie Adressen en Gebouwen Caribisch Nederland"],
        },
    },
    {
        "file": "upu-bes.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/besEn.pdf",
        "kind": "pdf",
        "bytes": 191237,
        "sha256": "238fc2cbff9dab774af91be31f3f85b7d6981a492fd522f6dd34c505b934effd",
        "pages": 1,
        "edition": "05/2014",
        "page_markers": {
            0: [
                "Bonaire, Saba and Saint Eustatius",
                "“BES” for Bonaire, Saint Eustatius and Saba",
                "Flamingo Express Dutch Caribbean N.V.",
                "05/2014",
            ]
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
            3: ["Universal DataBase (Sep. 2025)", "List of countries which do not require postal codes", "Bonaire, Saint Eustatius", "and Saba"],
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
        "schemaVersion": "postal-context-bq-source-inspection/v1",
        "countryCode": "BQ",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "none",
        "rcnCurrentlySaysNoPostcodes": True,
        "upuListsBonaireSaintEustatiusAndSabaAsNotRequiringPostalCodes": True,
        "proposalRange": "0000AA-0999ZZ",
        "proposalRangeTreatedAsCurrentAssignment": False,
        "workaround0000BQTreatedAsCurrentAssignment": False,
        "possible0100AATreatedAsCurrentAssignment": False,
        "currentOperator": "Flamingo Express Dutch Caribbean (FXDC)",
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
