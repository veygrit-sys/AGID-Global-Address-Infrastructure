#!/usr/bin/env python3
"""Fail-closed inspection of fixed Guyana postal M2 review bodies."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import zipfile
from collections import Counter
from pathlib import Path
from typing import Any

import pdfplumber


SOURCES: dict[str, tuple[int, str, str]] = {
    "understanding.html": (212803, "5267a2450e3f3780d975af8fdca057e499231761acc2c533f49148524838b0cd", "https://guypost.gy/understanding-postcodes-in-guyana/"),
    "finder.html": (221100, "2fb82152a2dd9180f9a4ce64620e3ea7e3f64245dc4289a7a8b243dfcf9dbebd", "https://guypost.gy/find-your-postcode/"),
    "finder_page.json": (2907, "6ba5d4a2e1365595eddf34519ada79e5ab16dbe8f3f6b5b050d0062c139bdcb3", "https://guypost.gy/wp-json/wp/v2/pages/3320"),
    "postcode-finder-table.json": (729653, "086ec0d1070a63d7030e084e99837de4bc707de8e58eb4e7497bf9bc972a3fe0", "https://guypost.gy/wp-admin/admin-ajax.php?action=wp_ajax_ninja_tables_public_action&table_id=3324&target_action=get-all-data"),
    "upu-guy-en.pdf": (203908, "e842f087516d58a27907b435c29020e58be0a45196715e1417f3382fffd64184", "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/guyEn.pdf"),
    "upu_addressing.html": (196790, "fe38ddbb031b7ee765e635ed8366ff9b8483d46591a050631d160aff5a4de635", "https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions"),
    "upu-licence-documents-2026.1.zip": (2251948, "c4027eebe4c9c0fa97b3222d05bc8c2cfa6b43b4de5a3c3be2b8c78c93f9904d", "https://www.upu.int/UPU/media/upu/documents/PostCode/LicenceDocumentsPostCodeEn.zip"),
    "bureau_licence.html": (112062, "ebc86456cbefad47f079a73636a212166ad5b4493c4f3277205f3d142795a4bb", "https://statisticsguyana.gov.gy/open-licence-agreement/"),
    "geoportal-0.json": (88, "ffcee480cff6132d2d107b67a600dade92022ed86181bcc28a74ddf85e874995", "https://geoportal.gov.gy/api/v2/datasets?q=postal&page_size=100"),
    "geoportal-resources-sample.json": (88, "b70daaf844a15ae45376c1cebd6f222c9f9ae82147550aca2cd913c127aa91b7", "https://geoportal.gov.gy/api/v2/resources?page_size=10"),
    "guypost-search-privacy.json": (2, "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "https://guypost.gy/wp-json/wp/v2/search?search=privacy"),
    "guypost-search-terms.json": (442, "b77c584ba0f60edcf7bf665487e2244ab4484efcd18eaae2681c2713996a6e1e", "https://guypost.gy/wp-json/wp/v2/search?search=terms"),
    "guypost-search-license.json": (1361, "37a718722a8d55cd993eb7490709298c5f132468d7270466a4f26544627b5cb4", "https://guypost.gy/wp-json/wp/v2/search?search=license"),
    "guypost-search-licence.json": (5617, "f2c548e4605cb085b000a4329d31689217128132da9dd7310d5054acc7a08ad2", "https://guypost.gy/wp-json/wp/v2/search?search=licence"),
}


def digest(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def clean_html(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def inspect_source_dir(source_dir: str | Path) -> dict[str, Any]:
    root = Path(source_dir)
    observed = {p.name for p in root.iterdir() if p.is_file() and p.name in SOURCES}
    if observed != set(SOURCES):
        raise ValueError(f"source-set-mismatch expected={sorted(SOURCES)} observed={sorted(observed)}")
    receipts = []
    for filename, (size, sha, url) in SOURCES.items():
        body = (root / filename).read_bytes()
        if len(body) != size or digest(body) != sha:
            raise ValueError(f"source-changed-review-required:{filename}")
        receipts.append({"file": filename, "url": url, "bytes": size, "sha256": sha})

    article = clean_html((root / "understanding.html").read_text(encoding="utf-8"))
    if not all(marker.lower() in article.lower() for marker in ["7-digit", "region", "locality", "post office", "2210201"]):
        raise ValueError("current-gpoc-article-markers-changed")
    page = json.loads((root / "finder_page.json").read_bytes())
    if page.get("status") != "publish" or page.get("modified_gmt") != "2025-08-20T18:44:53":
        raise ValueError("finder-page-metadata-changed")
    rows = json.loads((root / "postcode-finder-table.json").read_bytes())
    values = [row.get("value", {}) for row in rows]
    required_fields = {"regionnumber", "regionname", "subregionnumber", "locality", "districtnumber", "sublocality", "streetname", "office", "postcode", "___id___"}
    if len(values) != 2272 or any(set(value) != required_fields for value in values):
        raise ValueError("finder-table-schema-or-row-count-changed")
    codes = [str(value["postcode"]).strip() for value in values]
    valid = {code for code in codes if re.fullmatch(r"\d{7}", code)}
    anomalies = sorted({code for code in codes if not re.fullmatch(r"\d{7}", code)})
    row_keys = [tuple(str(value[field]).strip() for field in sorted(required_fields - {"___id___"})) for value in values]
    geometry_fields = {key for value in values for key in value if key.lower() in {"geometry", "geom", "latitude", "longitude", "lat", "lon", "lng"}}
    if len(valid) != 214 or anomalies != ["120101"] or geometry_fields:
        raise ValueError("finder-code-or-geometry-denominator-changed")

    with pdfplumber.open(root / "upu-guy-en.pdf") as pdf:
        if len(pdf.pages) != 2:
            raise ValueError("upu-page-count-changed")
        pdf_text = " ".join((p.extract_text() or "") for p in pdf.pages)
    if not all(marker in pdf_text for marker in ["08/2025", "7 digits", "4130106", "4212501", "413018"]):
        raise ValueError("upu-marker-changed")
    with zipfile.ZipFile(root / "upu-licence-documents-2026.1.zip") as archive:
        zip_files = [name for name in archive.namelist() if not name.endswith("/")]
    if len(zip_files) != 9:
        raise ValueError("upu-licence-bundle-changed")
    for filename in ["geoportal-0.json", "geoportal-resources-sample.json"]:
        if json.loads((root / filename).read_bytes()).get("total") != 0:
            raise ValueError("geoportal-result-changed")
    if json.loads((root / "guypost-search-privacy.json").read_bytes()) != []:
        raise ValueError("gpoc-privacy-search-changed")

    return {
        "schemaVersion": "postal-context-gy-source-inspection/v1",
        "countryCode": "GY",
        "exactBodies": receipts,
        "exactBodiesByteAndSha256Bound": len(receipts),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in receipts),
        "finderRows": len(values),
        "currentValidSevenDigitCodes": len(valid),
        "invalidCodeValues": anomalies,
        "regions": len({value["regionnumber"].strip() for value in values}),
        "localities": len({item for value in values if (item := value["locality"].strip())}),
        "sublocalities": len({item for value in values if (item := value["sublocality"].strip())}),
        "streets": len({item for value in values if (item := value["streetname"].strip())}),
        "postOffices": len({item for value in values if (item := value["office"].strip())}),
        "exactDuplicateRows": sum(count - 1 for count in Counter(row_keys).values() if count > 1),
        "finderGeometryFields": sorted(geometry_fields),
        "upuAddressingPages": 2,
        "upuAddressingEdition": "08/2025",
        "upuLicenceBundleFiles": len(zip_files),
        "officialPostalGeometryRecords": 0,
        "productionEligibleRecords": 0,
        "rawSourceRowsEmitted": 0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
