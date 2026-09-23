#!/usr/bin/env python3
"""Fail-closed inspection of fixed Guatemala postal M2 review bodies."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from pathlib import Path
from typing import Any

import pdfplumber


STATIC: dict[str, tuple[int, str, str]] = {
    "correos-postcode-page.html": (155848, "b86820b388fca0683be37b5f8be5d41492a86f6c760aa81102f0576f34e87599", "https://correos.gob.gt/codigo-postal-2/"),
    "correos-postcode-page-api.json": (6382, "aed6ec8fa551c82f66eb74c25d10da70601f2911dac06103649b3538fcb38eeb", "https://correos.gob.gt/wp-json/wp/v2/pages/40"),
    "upu-gtm-2025.pdf": (211363, "9d1b7fabcd13429e5a1037a063fd0a120df5f0f4b4913ae085002e0476b5e8b4", "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/gtmEn.pdf"),
    "correos-normativa.pdf": (1134333, "5e6ef7ea6ef3fa9d99b0643b3b1498c0209e22c37beb3b71be8b62e254774c36", "https://correos.gob.gt/ART10/inciso_1/Normativa.pdf"),
    "segeplan-sinit.html": (165959, "ae4eacf39ff343e2b163ebb35f7c10f2bb7e5a7543172678079c83e12739ef30", "https://portal.segeplan.gob.gt/segeplan/?page_id=6743"),
    "ine-lugares-poblados.html": (104301, "ffd4374e99318735250d2647903aaf797f3a091168e7cc21338fbc36953312f2", "https://datos.ine.gob.gt/dataset/censo-2018-lugares-poblados"),
    "upu-copyright.html": (110799, "e98d3fd0a4f0fded4f3d112513f8708cffd37cc097646b47c445aa6082103176", "https://www.upu.int/en/Copyright"),
}

DEPARTMENTS: dict[str, tuple[str, int, str, int, int]] = {
    "AltaVerapaz": ("16", 59557, "0cde3598557e23bc9ee2f99562d0b126a0e7b8b69491e342950a99bccba5f858", 1, 23),
    "BajaVerapaz": ("15", 60184, "e7e263a994888bf84193fcaf81a22e7f9af418392cac15c1fc8264aa9913998d", 1, 13),
    "Chimaltenango": ("04", 62638, "d0aad91232914f13a073a860de6352baa4318eea5e69e48482427bfe39924cfc", 1, 17),
    "Chiquimula": ("20", 57887, "4180153933555f547d550251e2fceeb6339bace0fff59d9c6ec15489e89ebe3b", 1, 21),
    "ElProgreso": ("02", 57416, "f61ef8905a396d0f388cab8ce1afd33f37ef23de370e5d2f389c1aa797b3464d", 1, 15),
    "Escuintla": ("05", 173801, "2cacccbc2535e5cac1ad16a8c1adb3a802191aac65f940c003f82b99dc21606a", 1, 21),
    "Guatemala": ("01", 68525, "bc34d6ac031c50e4ab9b9381cf71f747b58572130c94ccabd7259858e86bea15", 3, 44),
    "Huehuetenango": ("13", 63042, "7427edbfd4e86ceb9d9e57e865afe7be0f7d711329a791809c5909176fee94ff", 2, 42),
    "Izabal": ("18", 220207, "9b90016128b8dafc6626181c0a57cb31cc213a01c30428d4b94a4bf0b45c720a", 2, 24),
    "Jalapa": ("21", 53895, "3012c37bb663a09232fe4839163b4eac1c7d67964314c3614a3b66e543563076", 1, 9),
    "Jutiapa": ("22", 60920, "a8d0a44ef74ad282551291c876883a9d5c37ef10567607bf7718308f9f4e433c", 2, 28),
    "Peten": ("17", 61285, "7c83fbc9fbbcc330e8d56d907fa68de65a7c448730fe7c3805c64c50961eb86a", 2, 30),
    "Quetzaltenango": ("09", 61746, "930ef7e3c115ef1187ac3c26bd9e16794362e967ca2b9344b220d211b688318f", 2, 35),
    "Quiche": ("14", 59750, "3333ea77ae0b1d2d9014c27f93a744e4c4c4c13f6baba9a359728dc6a9665c39", 2, 26),
    "Retalhuleu": ("11", 55118, "6afd1c0157e3669902aa769f15c68bd75f4cc2e729014aaeea882ad5242ea90b", 1, 15),
    "Sacatepequez": ("03", 56228, "73710e258ea812ed75d804bb0a31646accc400f93a142c3779ab39ae4bd02a52", 1, 18),
    "SanMarcos": ("12", 70120, "919301246ca56cef1e9bf15194a301c62e507bef548cc44dd06bb6bc6e817478", 3, 51),
    "SantaRosa": ("06", 260911, "fb635a0dd3d85450ccbd167d0cb2d322be7795624f02750a8a79826fa23b78c8", 2, 28),
    "Solola": ("07", 60457, "c5e769b64253c555bc90f109610677246d49c313d6cec4ddc1bc9600e079644f", 2, 25),
    "Suchitepuequez": ("10", 61837, "6db2d3b49617ad09f9c5ee999020cb76f2ed50f80f8a46cad9f35bb350dedf32", 2, 31),
    "Totonicapan": ("08", 53806, "74a07339677b79ad0c72d9ede1aa500c9e4fb00fcd43440fe3d142c0fd6e653d", 1, 9),
    "Zacapa": ("19", 55550, "3aa46d2203802d77406df298ec327ec9ecfa53cbf13519a90a2be7b8c3155062", 1, 19),
}


def digest(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def clean_html(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def codes(value: str) -> set[str]:
    return set(re.findall(r"(?<!\d)\d{5}(?!\d)", value))


def inspect_source_dir(source_dir: str | Path) -> dict[str, Any]:
    root = Path(source_dir)
    expected = set(STATIC) | {f"department-{name}.pdf" for name in DEPARTMENTS}
    observed = {p.name for p in root.iterdir() if p.is_file() and p.suffix.lower() in {".pdf", ".html", ".json"}}
    if observed != expected:
        raise ValueError(f"source-set-mismatch expected={sorted(expected)} observed={sorted(observed)}")

    receipts: list[dict[str, Any]] = []
    all_codes: set[str] = set()
    department_pages = 0
    for filename, (size, sha, url) in STATIC.items():
        body = (root / filename).read_bytes()
        if len(body) != size or digest(body) != sha:
            raise ValueError(f"source-changed-review-required:{filename}")
        receipt: dict[str, Any] = {"file": filename, "url": url, "bytes": size, "sha256": sha}
        if filename.endswith(".pdf"):
            with pdfplumber.open(root / filename) as pdf:
                receipt["pages"] = len(pdf.pages)
                text = " ".join((page.extract_text() or "") for page in pdf.pages)
            required = ["5 digits", "distribution route", "delivery office", "11/2025"] if filename == "upu-gtm-2025.pdf" else ["CODIGO POSTAL", "GUATEMALA"]
            if not all(marker.lower() in text.lower() for marker in required):
                raise ValueError(f"missing-pdf-marker:{filename}")
        elif filename.endswith(".json"):
            page = json.loads(body)
            if page.get("status") != "publish" or page.get("modified") != "2025-07-21T21:57:49":
                raise ValueError("postcode-page-api-metadata-changed")
        else:
            text = clean_html(body.decode("utf-8"))
            required = {
                "correos-postcode-page.html": ["Código Postal", "AltaVerapaz.pdf", "Zacapa.pdf"],
                "segeplan-sinit.html": ["acceso libre", "información geográfica"],
                "ine-lugares-poblados.html": ["Creative Commons Attribution", "Centroides de Lugares poblados"],
                "upu-copyright.html": ["Copyright"],
            }[filename]
            if not all(marker.lower() in text.lower() for marker in required):
                raise ValueError(f"missing-html-marker:{filename}")
        receipts.append(receipt)

    prefixes: set[str] = set()
    for name, (prefix, size, sha, pages, unique_count) in DEPARTMENTS.items():
        filename = f"department-{name}.pdf"
        body = (root / filename).read_bytes()
        if len(body) != size or digest(body) != sha:
            raise ValueError(f"source-changed-review-required:{filename}")
        with pdfplumber.open(root / filename) as pdf:
            if len(pdf.pages) != pages:
                raise ValueError(f"pdf-page-count:{filename}")
            found = codes(" ".join((page.extract_text() or "") for page in pdf.pages))
        if len(found) != unique_count:
            raise ValueError(f"postcode-denominator-changed:{filename}")
        all_codes.update(found)
        prefixes.update(code[:2] for code in found)
        receipts.append({"file": filename, "url": f"https://correos.gob.gt/wp-content/uploads/2025/06/{name}.pdf", "bytes": size, "sha256": sha, "pages": pages, "uniqueCodes": unique_count})

    if len(all_codes) != 544 or prefixes != {f"{i:02d}" for i in range(1, 23)}:
        raise ValueError("national-postcode-denominator-changed")
    department_pages = sum(item[3] for item in DEPARTMENTS.values())
    return {
        "schemaVersion": "postal-context-gt-source-inspection/v1",
        "countryCode": "GT",
        "exactBodies": receipts,
        "exactBodiesByteAndSha256Bound": len(receipts),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in receipts),
        "departmentPdfs": 22,
        "departmentPdfPages": department_pages,
        "currentUniquePostalCodes": 544,
        "departmentPrefixes": sorted(prefixes),
        "mixedPostalObjectTypesObserved": True,
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
