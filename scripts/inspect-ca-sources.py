#!/usr/bin/env python3
"""Fail-closed inspection of exact Canada Postal Context M2 evidence."""

import argparse
from hashlib import sha256
import html
import json
from pathlib import Path
import re

from pypdf import PdfReader


EXPECTED = [
    {
        "file": "canada-post-postal-codes.html",
        "url": "https://www.canadapost-postescanada.ca/cpc/en/support/articles/addressing-guidelines/postal-codes.page",
        "kind": "html",
        "bytes": 229929,
        "sha256": "3e6ff94ad2b0202a86c599d4c4417c796e49bf531549eaee54c4461929754829",
        "markers": ["Forward Sortation Area", "Local Delivery Unit", "Single building"],
    },
    {
        "file": "canada-post-license-data.html",
        "url": "https://www.canadapost-postescanada.ca/cpc/en/commercial/data-solutions/license-data.page",
        "kind": "html",
        "bytes": 222260,
        "sha256": "0b3d76ef38bbc4d9b378453f3204c9390a55be7b5e7b87dfcc749c7eba26f250",
        "markers": ["complete list", "Postal Code Address Data", "monthly"],
    },
    {
        "file": "canada-post-2026-schedule.pdf",
        "url": "https://www.canadapost-postescanada.ca/cpc/doc/en/marketing/2026-data-production-schedule.pdf",
        "kind": "pdf",
        "bytes": 58057,
        "sha256": "7010ba1bbc99ce56ac5ec5cf7ac2aacf0c24f58c4227ee366a5faa53856a8b1d",
        "pages": 2,
        "edition": "2026 schedule / current release at review 260807ad.zip",
        "page_markers": {1: ["POSTAL CODE", "ADDRESS DATA FILE", "AUG 7, 2026", "260807ad.zip", "SEPT 11, 2026"]},
    },
    {
        "file": "canada-post-techspec.pdf",
        "url": "https://www.canadapost-postescanada.ca/cpc/doc/en/business/postalcodetechspecs.pdf",
        "kind": "pdf",
        "bytes": 273003,
        "sha256": "399f48fb6e655a35dc27c27c718e1e490549ff3121394fe1bacc4dce71641fbd",
        "pages": 28,
        "edition": "Rev. 2019-10-09 / October 2019",
        "page_markers": {
            1: ["all the valid mailing addresses in the country", "Address Change File"],
            3: ["Street Address", "Postal Code"],
            5: ["Lock Box Address", "Route Service Address"],
            9: ["Building Name", "unique Postal Code"],
        },
        "forbidden_markers": ["polygon", "multipolygon", "geometry type", "coordinate reference system"],
    },
    {
        "file": "canada-post-request-form.pdf",
        "url": "https://www.canadapost-postescanada.ca/cpc/doc/en/business/request-for-LDP-form-en.pdf",
        "kind": "pdf",
        "bytes": 629735,
        "sha256": "75d21a5a2de8a2f6d4b0122b0827e60836d06c74ef8d77613f87277e6dd7d524",
        "pages": 6,
        "edition": "current licensed-data-products request form fixed 2026-08-31",
        "page_markers": {4: ["Address validation for third parties", "Geospatial products and services", "bulk downloads", "service scraping"], 5: ["pricing details", "applicable license agreement"]},
    },
    {
        "file": "canada-post-addresscomplete-api.html",
        "url": "https://www.canadapost-postescanada.ca/ac/support/api/",
        "kind": "html",
        "bytes": 113398,
        "sha256": "e183bf99f6ad33015a6881df4420a3b56c2ffd2fd5ad17d11f4ddc18565e1451",
        "markers": ["Find", "Retrieve", "Key"],
    },
    {
        "file": "canada-post-addresscomplete-terms.html",
        "url": "https://www.canadapost-postescanada.ca/cpc/en/support/kb/company-policies/terms-conditions/addresscomplete-terms-and-conditions.page",
        "kind": "html",
        "bytes": 297305,
        "sha256": "771acdd63bbe3415551b708cc6518788c4d79c8f1a82b3e782828e0a69fc16c8",
        "markers": ["Canada Post Data", "Internal Business Purposes", "confidential", "destroy"],
    },
    {
        "file": "statcan-cfsa-guide.html",
        "url": "https://www150.statcan.gc.ca/n1/pub/92-179-g/92-179-g2021001-eng.htm",
        "kind": "html",
        "bytes": 51392,
        "sha256": "eea798e08014701c7162f3fe2154a07fc1ad98200d065ffd9dd44948ea94aa9a",
        "markers": ["1,643", "respondents", "not necessarily"],
    },
    {
        "file": "statcan-cfsa-guide.pdf",
        "url": "https://www150.statcan.gc.ca/n1/pub/92-179-g/92-179-g2021001-eng.pdf",
        "kind": "pdf",
        "bytes": 488120,
        "sha256": "e34f29a58677d340f22527ccfefd5221b67503f3e10fe4cc6195a8a78f9bb873",
        "pages": 13,
        "edition": "Census year 2021 / release 2022-09-21",
        "page_markers": {
            4: ["reported by census respondents", "rather than the postal code", "1,643 CFSAs"],
            5: ["2021 Census questionnaires", "single CFSA was assigned to each dissemination area"],
            12: ["The product contains boundaries for 1,643 CFSAs"],
        },
    },
    {
        "file": "statcan-cfsa-layer.json",
        "url": "https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/14?f=pjson",
        "kind": "json",
        "bytes": 5868,
        "sha256": "a9fd26ab03b75f460046fb4a68c7ec4b3f563b4f3da6afd5098d12083df0c4c2",
        "markers": ["1,643 census forward sortation areas", "first three characters", "esriGeometryPolygon"],
    },
    {
        "file": "statcan-open-licence.html",
        "url": "https://www.statcan.gc.ca/en/reference/licence",
        "kind": "html",
        "bytes": 26879,
        "sha256": "7ff2184e31a07f9e2e1270460945666eff5a64919527a43491a21d6fd6642091",
        "markers": ["Statistics Canada Open Licence", "Information", "reproduce"],
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
        if path.is_file() and path.suffix.lower() in {".pdf", ".html", ".json"} and not path.name.startswith("render-")
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
        if item["kind"] in {"html", "json"}:
            text = normalized(body.decode("utf-8", errors="strict"))
            for marker in item["markers"]:
                if normalized(marker).lower() not in text.lower():
                    raise ValueError(f"missing-text-marker:{item['file']}:{marker}")
            if item["kind"] == "json":
                json.loads(body)
        elif item["kind"] == "pdf":
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            pdf = PdfReader(str(path))
            pages = len(pdf.pages)
            if pages != item["pages"]:
                raise ValueError(f"pdf-page-count:{item['file']}")
            all_text = []
            for page_index, markers in item["page_markers"].items():
                text = normalized(pdf.pages[page_index].extract_text() or "")
                all_text.append(text)
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
        "schemaVersion": "postal-context-ca-source-inspection/v1",
        "countryCode": "CA",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "ANA NAN",
        "currentLicensedAssignmentReleaseIdentified": "260807ad.zip",
        "currentCompleteLicensedAssignmentAcquired": False,
        "licensedProductContainsPolygonGeometrySchema": False,
        "cfsaReferenceYear": 2021,
        "cfsaRecordsDeclared": 1643,
        "cfsaKeyLength": 3,
        "cfsaIsCurrentCanadaPostFullCodeGeometry": False,
        "fullSixCharacterPostalPolygonRecords": 0,
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
