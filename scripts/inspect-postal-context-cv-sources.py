"""Offline, digest-bound Cabo Verde Postal Context source inspector."""
import argparse
import hashlib
import html
import json
import re
from pathlib import Path

import pdfplumber

EXPECTED = [
    {"file": "correios-faq.html", "url": "https://www.correios.cv/faq", "bytes": 78459, "sha256": "983f0a02d4fc613b18e9e6af2fa04694f60172b0237bf941964dacaee4223403", "kind": "html", "markers": ["O Código Postal é um código formado por 4 dígitos", "7600 – Plateau", "7601 – Fazenda", "7602 – Achada Santo Antonio", "Todos os Direitos Reservados"]},
    {"file": "correios-contactos.html", "url": "https://www.correios.cv/contactos", "bytes": 78392, "sha256": "298940b9370c89b70d5f809e1233278cb76eaff5d11e5fef4fad88d04e9cc1c3", "kind": "html", "markers": ["7937-049", "9117-001", "Última atualização em 10 de Dezembro de 2019", "2026 Correios de Cabo Verde", "Todos os Direitos Reservados"]},
    {"file": "correios-cip.html", "url": "https://www.correios.cv/cip", "bytes": 1785, "sha256": "34e1548831b225c7c82a7f80590ac0464d37b9702bc9e0cc22158a228b13f040", "kind": "html", "markers": ["Portal do Utilizador | Correios de Cabo Verde", "You need to enable JavaScript"]},
    {"file": "correios-cip-app.js", "url": "https://www.correios.cv/user/assets/index-D1nzdUvD.js", "bytes": 321574, "sha256": "968407840be14955565f0c068973518432a9ce7249c7dfe65c3f6d5f43593140", "kind": "text", "markers": ["CIP_POSTAL", "CIP_ADDRPHISICAL", "OpenLocationCode.encode", "Termos e Condições - Portal CIP", "Todos os conteúdos, marcas e logótipos"]},
    {"file": "upu-cpv-en.pdf", "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/CPVEn.pdf", "bytes": 219543, "sha256": "c6f27544ebfd0695fd79efda3aa006ba061ec8626498814c72ff61adb1335ca6", "kind": "pdf", "pages": 1, "markers": ["Cabo Verde", "4 digits to the left of the locality name", "7600 PRAIA", "district of commune", "04/2014"]},
    {"file": "upu-general.pdf", "url": "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf", "bytes": 631050, "sha256": "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d", "kind": "pdf", "pages": 12, "markers": ["Universal DataBase (Aug. 2026)", "Cabo Verde 4", "Cabo Verde 9999 N"]},
    {"file": "upu-copyright.html", "url": "https://www.upu.int/en/Copyright", "bytes": 93711, "sha256": "dd9bfa6d019b66574c7c0518823a79a7520eafe91fac71329c50f6ce7a597eb7", "kind": "html", "markers": ["All rights reserved", "without permission in writing from the UPU", "not to duplicate the document or parts thereof for distribution or sale"]},
    {"file": "ingt-admin-service.json", "url": "https://ingtgeo.gov.cv/arcgisingt/rest/services/SDI/Divisao_Administrativa_CaboVerde/MapServer?f=pjson", "bytes": 5062, "sha256": "62658413d3b5116c92e0a1702aaaa2e8c9c1ad7d5b2caecb67238a535f95e80f", "kind": "json", "markers": ["Estraído da Cartografia 2010, escala 1:5000", "INGT", "bairro_cidade", "esriGeometryPolygon"]},
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(value):
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def visible_html(value):
    value = re.sub(r"<script\b.*?</script>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<style\b.*?</style>", " ", value, flags=re.I | re.S)
    return normalized(re.sub(r"<[^>]+>", " ", value))


def inspect_source_dir(source_dir, expected=EXPECTED):
    root = Path(source_dir)
    missing = [item["file"] for item in expected if not (root / item["file"]).is_file()]
    if missing:
        raise ValueError(f"source-set-mismatch missing={missing}")
    receipts = []
    for item in expected:
        path = root / item["file"]
        body = path.read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError(f"source-changed-review-required:{item['file']}")
        pages = None
        if item["kind"] == "pdf":
            with pdfplumber.open(path) as pdf:
                pages = len(pdf.pages)
                text = normalized("\n".join((page.extract_text() or "") for page in pdf.pages))
            if pages != item["pages"]:
                raise ValueError(f"pdf-page-count:{item['file']}")
        elif item["kind"] == "html":
            text = visible_html(body.decode("utf-8"))
        else:
            text = normalized(body.decode("utf-8"))
        for marker in item.get("markers", []):
            if normalized(marker) not in text:
                raise ValueError(f"missing-content-marker:{item['file']}:{marker}")
        receipts.append({"file": item["file"], "url": item["url"], "bytes": len(body), "sha256": item["sha256"], "pages": pages, "class": "official-reference"})
    if expected is not EXPECTED:
        return {"exactBodiesByteAndSha256Bound": len(receipts), "productionEligibleRecords": 0}
    return {
        "schemaVersion": "postal-context-cv-source-inspection/v1",
        "countryCode": "CV",
        "receipts": receipts,
        "officialReferenceBodies": len(receipts),
        "exactBodiesByteAndSha256Bound": len(receipts),
        "officialReferenceBytes": sum(receipt["bytes"] for receipt in receipts),
        "currentPostalCodeFormat": "9999",
        "operatorReferenceExamples": ["7600", "7601", "7602"],
        "contactExtendedValueOccurrences": 35,
        "contactExtendedUniqueValues": 32,
        "completeCurrentAssignmentDenominatorAvailable": False,
        "officialPostalGeometryRecords": 0,
        "productionEligibleRecords": 0,
        "cipRowsAccessed": 0,
        "modelOrOssCandidatesIngested": False,
        "rawSourceRowsEmitted": 0,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))
