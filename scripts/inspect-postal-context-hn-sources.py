#!/usr/bin/env python3
"""Fail-closed inspection of the fixed Honduras Postal Context review bodies."""

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
    "honducor-home.html": (113851, "d73a11e1e6f2a73d7ef4296c08d3d7a513553e152f8c4957d2d49a15f67d104c", "https://honducor.gob.hn/"),
    "honducor-manual-comercial-2024.pdf": (6631049, "c0c2ae20801afade02a79b988544b46fdcba1e829af278541bb142f34eaef823", "https://honducor.gob.hn/wp-content/uploads/2024/02/Manual-Comercial-2024.pdf"),
    "honducor-maps.html": (91736, "4fe45085ca3182dc01a895c6b992b5c8bc9526f8291601bd7f638684bea21883", "https://honducor.gob.hn/index.php/maps/"),
    "honducor-post-2858.json": (6916, "4aa6d87cc041c5b2fc20214825184728ef1973bd2865a859d23871d2a0e82cab", "https://honducor.gob.hn/index.php/wp-json/wp/v2/posts/2858"),
    "honducor-post-3028.json": (5251, "287baf983ab65ae3a263a79653e910d34ab5d121fb5fc2b598b7617c7f4a785e", "https://honducor.gob.hn/index.php/wp-json/wp/v2/posts/3028"),
    "honducor-search-codigo-postal.json": (5819, "3d29762f1ca04757ab11b585521b087d51d448d3edb2a4745ec54f7dbccd88de", "https://honducor.gob.hn/index.php/wp-json/wp/v2/search?search=codigo%20postal&per_page=100"),
    "honducor-search-licencia.json": (1027, "3a54da04bf1ceda37fdce3409adba66a3d0125b09f45ebf46a2d695739194a15", "https://honducor.gob.hn/index.php/wp-json/wp/v2/search?search=licencia&per_page=100"),
    "honducor-search-privacidad.json": (2, "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "https://honducor.gob.hn/index.php/wp-json/wp/v2/search?search=privacidad&per_page=100"),
    "honducor-search-terminos.json": (2, "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "https://honducor.gob.hn/index.php/wp-json/wp/v2/search?search=terminos&per_page=100"),
    "sinit-home.html": (225348, "ee04a816580c378c6e0491a452d9e277188848e95c601e21df15b7f94249fe11", "https://sinit.hn/"),
    "sinit-catalogo-capas.html": (114591, "f9f76f9d76d1d333ecad5a5252bba764cfb78c5339c5f5a79e05cf30ee95972b", "https://sinit.hn/catalogo-capas/"),
    "sinit-layer-catalog.html": (7058, "fb1fbca5fc23acab37064e189b6be377dfc2562cedb621dd4e71550b6ed0cc33", "https://sinit.hn/catalogocapas/index.php"),
    "sinit-catalog-crud.js": (3540, "b8c20b654aa461567813e1eea985d41b72a56200f11a890ad91e182165c7a99b", "https://sinit.hn/catalogocapas/js/crud.js"),
    "sinit-layer-catalog.json": (380056, "9705b70ad76a830425ea66ed2335a5d8a3f8284a4f87a4cc9ee6021256d01dfd", "https://sinit.hn/catalogocapas/backend/formulario/SelectFormRegistro.php"),
    "sinit-geoservicios.html": (144227, "1bca6cd03f2b3608f44bc3794cc1f1412e0d7be1115830122076fcfddd544e7a", "https://sinit.hn/geoservicios/"),
    "sinit-search-licencia.json": (992, "5b7d3a78b6bcc5ad8e241b3643d1ad7014f847f6ffae20a1488dc5bd4fc5c5a3", "https://sinit.hn/wp-json/wp/v2/search?search=licencia&per_page=100"),
    "sinit-search-terminos.json": (392, "b8cb9546fc3c8b185001cf7f9935c07ca618dfa6610b9a3ea1e7c9ee50eba84d", "https://sinit.hn/wp-json/wp/v2/search?search=terminos&per_page=100"),
    "sinit-search-datos-abiertos.json": (2, "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "https://sinit.hn/wp-json/wp/v2/search?search=datos%20abiertos&per_page=100"),
    "sinit-search-postal.json": (2, "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "https://sinit.hn/wp-json/wp/v2/search?search=postal&per_page=100"),
    "upu-addressing-honduras.html": (200034, "b8ebad68cafc8930708cf95bd86af670f846be46a929699a4a08bef15ddea35c", "https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions?cid=144&csid=20"),
    "upu-general-addressing-issues.pdf": (631050, "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d", "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf"),
    "upu-hnd-en.pdf": (102844, "b8ac985c31c7331810dd8b9637e7b527cdb5ced0a2cdc5fa6e9435de8dc48b6c", "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/hndEn.pdf"),
    "upu-licence-documents-2026.1.zip": (2251948, "c4027eebe4c9c0fa97b3222d05bc8c2cfa6b43b4de5a3c3be2b8c78c93f9904d", "https://www.upu.int/UPU/media/upu/documents/PostCode/LicenceDocumentsPostCodeEn.zip"),
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
    if "Universal DataBase (Aug. 2026)" not in required_text or "Honduras" not in required_text:
        raise ValueError("upu-current-required-country-marker-changed")
    if not re.search(r"Honduras\s+5\b", length_text):
        raise ValueError("upu-current-length-marker-changed")
    if not re.search(r"Honduras\s+99999\s+N\b", format_text):
        raise ValueError("upu-current-format-marker-changed")

    with pdfplumber.open(root / "upu-hnd-en.pdf") as pdf:
        if len(pdf.pages) != 1:
            raise ValueError("upu-legacy-page-count-changed")
        legacy_text = pdf.pages[0].extract_text() or ""
    if not all(marker in legacy_text for marker in ["6 alphanumeric characters", "CM1102", "05/2004"]):
        raise ValueError("upu-legacy-marker-changed")

    with pdfplumber.open(root / "honducor-manual-comercial-2024.pdf") as pdf:
        if len(pdf.pages) != 58:
            raise ValueError("honducor-manual-page-count-changed")
        manual_text = " ".join((pdf.pages[i].extract_text() or "") for i in (0, 1))
    if not all(marker in manual_text for marker in ["HONDUCOR", "GM-DGJC-010", "Febrero 2024", "1.1"]):
        raise ValueError("honducor-manual-version-marker-changed")

    upu_country = clean_html((root / "upu-addressing-honduras.html").read_text(encoding="utf-8"))
    if not all(marker.lower() in upu_country.lower() for marker in ["Honduras", "HN", "Honducor", "2026.1"]):
        raise ValueError("upu-country-page-marker-changed")

    ems = json.loads((root / "honducor-post-2858.json").read_bytes())
    ems_text = clean_html(ems.get("content", {}).get("rendered", ""))
    if ems.get("status") != "publish" or ems.get("modified_gmt") != "2025-01-30T15:48:55" or "código postal" not in ems_text.lower():
        raise ValueError("honducor-current-ems-marker-changed")
    faq = json.loads((root / "honducor-post-3028.json").read_bytes())
    if faq.get("status") != "publish" or faq.get("modified_gmt") != "2025-06-09T16:46:05":
        raise ValueError("honducor-current-faq-marker-changed")
    search = json.loads((root / "honducor-search-codigo-postal.json").read_bytes())
    if len(search) != 11 or {item.get("id") for item in search}.isdisjoint({2858, 602}):
        raise ValueError("honducor-postcode-search-changed")
    if len(json.loads((root / "honducor-search-licencia.json").read_bytes())) != 2:
        raise ValueError("honducor-licence-search-changed")
    for filename in ("honducor-search-privacidad.json", "honducor-search-terminos.json"):
        if json.loads((root / filename).read_bytes()) != []:
            raise ValueError(f"honducor-legal-search-changed:{filename}")

    catalogue_wrapper = json.loads((root / "sinit-layer-catalog.json").read_bytes())
    layers = catalogue_wrapper.get("data", [])
    required_layer_fields = {
        "id", "id_institucion", "nombre_objeto_geografico", "codigo_unico",
        "estado", "fecha_creacion", "enlace", "grupo_tematico", "tema",
    }
    if catalogue_wrapper.get("status") != 200 or len(layers) != 1034:
        raise ValueError("sinit-layer-count-changed")
    if any(set(layer) != required_layer_fields for layer in layers):
        raise ValueError("sinit-layer-schema-changed")
    postal_fields = ("id_institucion", "nombre_objeto_geografico", "grupo_tematico", "tema")
    postal_matches = [
        layer for layer in layers
        if re.search(r"\b(postal|correo|honducor)\b", " ".join(str(layer.get(field, "")) for field in postal_fields), re.IGNORECASE)
    ]
    if postal_matches:
        raise ValueError("sinit-postal-layer-result-changed")
    catalog_js = (root / "sinit-catalog-crud.js").read_text(encoding="utf-8")
    if "SelectFormRegistro.php" not in catalog_js or "contacto_personalizado.php" not in catalog_js:
        raise ValueError("sinit-catalog-endpoint-changed")
    if json.loads((root / "sinit-search-postal.json").read_bytes()) != []:
        raise ValueError("sinit-wordpress-postal-search-changed")
    if json.loads((root / "sinit-search-datos-abiertos.json").read_bytes()) != []:
        raise ValueError("sinit-open-data-search-changed")

    with zipfile.ZipFile(root / "upu-licence-documents-2026.1.zip") as archive:
        zip_files = [name for name in archive.namelist() if not name.endswith("/")]
    if len(zip_files) != 9:
        raise ValueError("upu-licence-bundle-changed")
    zip_names = " ".join(zip_files)
    if not all(marker in zip_names for marker in ["BASIC CONTRACT", "NDA", "DECLARATION USE", "Rates", "General Conditions"]):
        raise ValueError("upu-licence-document-classes-changed")

    return {
        "schemaVersion": "postal-context-hn-source-inspection/v1",
        "countryCode": "HN",
        "exactBodies": receipts,
        "exactBodiesByteAndSha256Bound": len(receipts),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in receipts),
        "currentUpuGeneralTablesEdition": "Aug. 2026",
        "currentPostcodeRequired": True,
        "currentPostcodeLength": 5,
        "currentPostcodeFormat": "99999",
        "currentPostcodeType": "numeric",
        "legacyUpuHondurasSheetEdition": "05/2004",
        "legacyPostcodeFormat": "AANNNN",
        "honducorCommercialManualVersion": "1.1",
        "honducorCommercialManualPages": 58,
        "honducorPostcodeSearchResults": len(search),
        "sinitCatalogueLayers": len(layers),
        "sinitPostalLayerMatches": len(postal_matches),
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
