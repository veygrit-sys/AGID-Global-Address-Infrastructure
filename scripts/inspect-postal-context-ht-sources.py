#!/usr/bin/env python3
"""Fail-closed inspection of the fixed Haiti Postal Context review bodies."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import zipfile
from pathlib import Path
from typing import Any

import pdfplumber


SOURCES: dict[str, tuple[int, str, str]] = {
    "cnigs-haitidata.html": (12048, "79a16124b2c0c682719456647c17a592e3b422c68cba1f14fb45cb54b2291f6e", "https://cnigs.ht/haitidata/"),
    "cnigs-home.html": (15680, "0f25d4cfbede000a81bca0093328914e90f2a9a6f5a7c40f552725670af51a62", "https://cnigs.ht/"),
    "haitidata-index.html": (1237, "d1275af2050cfed4a3067a85b0f842cab5a9716af4009f60b4c03c1e5c50b3b7", "https://haitidata.org/"),
    "haitidata-main.js": (232789, "1e94397bdd298d98d35d79216a19bc0cbc41bda446a682924a1b620be174cf97", "https://haitidata.org/static/js/main.41981620.js"),
    "ihsi-admin-2024.pdf": (30582008, "a45e5ca6caace66faa45964ed5b0dfe3a795c62f91b7de6d17d1a6a4f29303cc", "https://ihsi.gouv.ht/public/storage/document-views/March2025/Oan4m17p5LEKtsGEnHgt.pdf"),
    "ihsi-territorial-codes.html": (73322, "bd40101211b36c08cc52c13b8b60291f278b5ee661bae365290271e3d1a00364", "https://ihsi.gouv.ht/statistiques/statistiques_demographiques_et_sociales/etablissements_humains_et_logement/caracteristiques_des_maisons"),
    "office-codes-404.html": (98572, "d929512ed1444fe727ca49049c55f4e9c3ddddefdb7d01e8f9cce0166157e82f", "https://laposte.gouv.ht/codes.php"),
    "office-gpost-post-392.json": (10718, "c345f12f15a00a42c471a9df9babcd8f9c2717f5e6857c15e8eb92c33352e597", "https://laposte.gouv.ht/wp-json/wp/v2/posts/392"),
    "office-home.html": (168249, "e5fdc4557dfd8be89506d8cb4e4b13643b6061ea80aa5b306e6efa26cebf2a40", "https://laposte.gouv.ht/"),
    "office-pages.json": (723074, "efe45d696a8c7879a77f47b9771571f58d130e855effa80f65c8aad35a2c63ff", "https://laposte.gouv.ht/wp-json/wp/v2/pages?per_page=100"),
    "office-posts.json": (36925, "c9caf7776ed4e6516dc227bd1902b054226b8fc07aa226a5ba4a7b052792570b", "https://laposte.gouv.ht/wp-json/wp/v2/posts?per_page=100"),
    "office-search-code-postal.json": (2, "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "https://laposte.gouv.ht/wp-json/wp/v2/search?search=code%20postal&per_page=100"),
    "office-search-confidentialite.json": (2, "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "https://laposte.gouv.ht/wp-json/wp/v2/search?search=confidentialite&per_page=100"),
    "office-search-donnees-ouvertes.json": (2, "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "https://laposte.gouv.ht/wp-json/wp/v2/search?search=donnees%20ouvertes&per_page=100"),
    "office-search-licence.json": (2, "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "https://laposte.gouv.ht/wp-json/wp/v2/search?search=licence&per_page=100"),
    "office-search-privacy.json": (2, "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "https://laposte.gouv.ht/wp-json/wp/v2/search?search=privacy&per_page=100"),
    "upu-addressing-haiti.html": (196794, "e47f560896f5f2d0729e9902fb0c48478e4b55c597a3ada13df62c468f63cbf6", "https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions?cid=144&csid=22"),
    "upu-ead-country-requirements-2026.pdf": (335983, "cdc798e46148841833bafba827f66d414cb8791a878de5661e85b21a0f04feb0", "https://www.upu.int/UPU/media/upu/files/postalSolutions/programmesServices/postalSupplyChain/customs/listOfEadCountryRequirementsEn.pdf"),
    "upu-general-addressing-issues.pdf": (631050, "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d", "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf"),
    "upu-hti-en.pdf": (117184, "a4a406e751ed2bd169db92547c1c398b63188f2ba58849018703561c319661a6", "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/htiEn.pdf"),
    "upu-licence-documents-2026.1.zip": (2251948, "c4027eebe4c9c0fa97b3222d05bc8c2cfa6b43b4de5a3c3be2b8c78c93f9904d", "https://www.upu.int/UPU/media/upu/documents/PostCode/LicenceDocumentsPostCodeEn.zip"),
    "upu-puasp-haiti.html": (145483, "0969b893cd56003b4b06897a771ab64b7fa9292b2627304e1d148701d4995cfa", "https://www.upu.int/en/Universal-Postal-Union/About-UPU/Restricted-Unions/PUASP"),
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

    with pdfplumber.open(root / "upu-general-addressing-issues.pdf") as pdf:
        if len(pdf.pages) != 12:
            raise ValueError("upu-general-page-count-changed")
        required_text = pdf.pages[2].extract_text() or ""
        length_text = pdf.pages[5].extract_text() or ""
        format_text = pdf.pages[10].extract_text() or ""
    if "Universal DataBase (Aug. 2026)" not in required_text or "Haiti" not in required_text:
        raise ValueError("upu-current-required-country-marker-changed")
    if not re.search(r"Haiti\s+6\b", length_text):
        raise ValueError("upu-current-length-marker-changed")
    if not re.search(r"Haiti\s+HT9999\s+A/N\b", format_text):
        raise ValueError("upu-current-format-marker-changed")

    with pdfplumber.open(root / "upu-hti-en.pdf") as pdf:
        if len(pdf.pages) != 1:
            raise ValueError("upu-haiti-page-count-changed")
        haiti_text = pdf.pages[0].extract_text() or ""
    haiti_markers = ["HT6120", "HT6110 PORT-AU-PRINCE", "integral part of the postcode", "09/2017"]
    if not all(marker in haiti_text for marker in haiti_markers):
        raise ValueError("upu-haiti-marker-changed")

    with pdfplumber.open(root / "upu-ead-country-requirements-2026.pdf") as pdf:
        if len(pdf.pages) != 3:
            raise ValueError("upu-ead-page-count-changed")
        ead_text = " ".join((page.extract_text() or "") for page in pdf.pages)
    if "27 May 2026" not in ead_text or not re.search(r"HT\s+Haiti\s+Office des Postes d'Haiti", ead_text):
        raise ValueError("upu-ead-haiti-marker-changed")

    with pdfplumber.open(root / "ihsi-admin-2024.pdf") as pdf:
        if len(pdf.pages) != 509:
            raise ValueError("ihsi-admin-page-count-changed")

    upu_country = clean_html((root / "upu-addressing-haiti.html").read_text(encoding="utf-8"))
    if not all(marker.lower() in upu_country.lower() for marker in ["Haiti", "HT", "2026.1"]):
        raise ValueError("upu-country-page-marker-changed")
    puasp = (root / "upu-puasp-haiti.html").read_text(encoding="utf-8")
    if "postehaiti.gouv.ht" not in puasp or "www.laposte.gouv.ht" not in puasp:
        raise ValueError("upu-operator-links-changed")

    office_404 = clean_html((root / "office-codes-404.html").read_text(encoding="utf-8"))
    if "Page not found" not in office_404 or "Office des Postes d'Haiti" not in office_404:
        raise ValueError("operator-postcode-route-marker-changed")
    office_home = clean_html((root / "office-home.html").read_text(encoding="utf-8"))
    if "Office des Postes d'Haiti" not in office_home:
        raise ValueError("operator-home-marker-changed")
    pages = json.loads((root / "office-pages.json").read_bytes())
    posts = json.loads((root / "office-posts.json").read_bytes())
    if len(pages) != 14 or len(posts) != 3:
        raise ValueError("operator-wordpress-count-changed")
    gpost = json.loads((root / "office-gpost-post-392.json").read_bytes())
    if gpost.get("status") != "publish" or gpost.get("modified_gmt") != "2022-04-21T15:10:47":
        raise ValueError("operator-gpost-post-changed")
    search_files = [
        "office-search-code-postal.json", "office-search-confidentialite.json",
        "office-search-donnees-ouvertes.json", "office-search-licence.json",
        "office-search-privacy.json",
    ]
    for filename in search_files:
        if json.loads((root / filename).read_bytes()) != []:
            raise ValueError(f"operator-search-changed:{filename}")

    cnigs_home = clean_html((root / "cnigs-home.html").read_text(encoding="utf-8"))
    if "Mission Fondamentale" not in cnigs_home or "toponymie" not in cnigs_home.lower():
        raise ValueError("cnigs-mission-marker-changed")
    cnigs_haitidata = clean_html((root / "cnigs-haitidata.html").read_text(encoding="utf-8"))
    if "HaitiData" not in cnigs_haitidata or "GeoNode" not in cnigs_haitidata:
        raise ValueError("cnigs-haitidata-marker-changed")
    haitidata_js = (root / "haitidata-main.js").read_text(encoding="utf-8")
    maintenance = "Notre plateforme d'open data est en cours d'am\\xe9lioration et sera bient\\xf4t de nouveau en ligne"
    if "Open-data" not in haitidata_js or "GeoNode" not in haitidata_js or maintenance not in haitidata_js:
        raise ValueError("haitidata-maintenance-marker-changed")

    ihsi = clean_html((root / "ihsi-territorial-codes.html").read_text(encoding="utf-8"))
    if "six chiffres" not in ihsi or "Manuel de codification des nouvelles divisions territoriales" not in ihsi:
        raise ValueError("ihsi-territorial-code-marker-changed")

    with zipfile.ZipFile(root / "upu-licence-documents-2026.1.zip") as archive:
        zip_files = [name for name in archive.namelist() if not name.endswith("/")]
    if len(zip_files) != 9:
        raise ValueError("upu-licence-bundle-changed")
    zip_names = " ".join(zip_files)
    if not all(marker in zip_names for marker in ["BASIC CONTRACT", "NDA", "DECLARATION USE", "Rates", "General Conditions"]):
        raise ValueError("upu-licence-document-classes-changed")

    return {
        "schemaVersion": "postal-context-ht-source-inspection/v1",
        "countryCode": "HT",
        "exactBodies": receipts,
        "exactBodiesByteAndSha256Bound": len(receipts),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in receipts),
        "currentUpuGeneralTablesEdition": "Aug. 2026",
        "currentPostcodeRequired": True,
        "currentPostcodeLength": 6,
        "currentPostcodeFormat": "HT9999",
        "currentPostcodeType": "alphanumeric",
        "upuHaitiSheetEdition": "09/2017",
        "integralCountryPrefix": "HT",
        "upuEadInformationDate": "27 May 2026",
        "designatedOperator": "Office des Postes d'Haiti",
        "operatorPages": len(pages),
        "operatorPosts": len(posts),
        "operatorPostcodeAndLegalSearchResults": 0,
        "operatorPostcodeRouteHttpStatus": 404,
        "haitidataOpenDataOperational": False,
        "ihsiAdministrativePublicationPages": 509,
        "upuLicenceBundleFiles": len(zip_files),
        "completeCurrentAssignmentDenominatorEstablished": False,
        "officialPostalGeometryRecords": 0,
        "derivedOrVirtualPostalGeometryRecords": 0,
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
