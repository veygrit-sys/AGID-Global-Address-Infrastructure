#!/usr/bin/env python3
"""Fail-closed inspection of exact Brazil Postal Context source evidence."""

import argparse
from hashlib import sha256
import html
import json
from pathlib import Path
import re

from pypdf import PdfReader


EXPECTED = [
    {
        "file": "correios-dne.html",
        "url": "https://www.correios.com.br/enviar/marketing-direto",
        "kind": "html",
        "bytes": 139182,
        "sha256": "d6c5a8305a5029f4a499fd69f4a59f47a7df8c0544755361ad21a781e0e629d5",
        "markers": [
            "mais de 1,3 milhão de CEPs",
            "Produto licenciado, com restrições de uso e proteção por direitos autorais",
            "V.26082",
            "31/08/2026",
        ],
    },
    {
        "file": "correios-api-busca-cep.html",
        "url": "https://www.correios.com.br/atendimento/developers/manuais/manual-api-busca-cep",
        "kind": "html",
        "bytes": 151929,
        "sha256": "c6b0c5803dc5facdb08074730b8067798d035ff855f8dec8696df877d9d04007",
        "markers": [
            "clientes detentores de contratos comerciais",
            "Bearer Token",
            "API BUSCA CEP",
            "86738",
            "DNE Diretório Nacional de Endereços – base completa de CEPs de todo o Brasil",
            "01/10/2025",
        ],
    },
    {
        "file": "correios-busca-cep.html",
        "url": "https://buscacepinter.correios.com.br/app/faixa_cep_uf_localidade/index.php",
        "kind": "html",
        "bytes": 63519,
        "sha256": "3a9b8d7ec171c52311f5477e8ff2564bacb8c8acd3e379139b305b2f8ed51be7",
        "markers": [
            "Busca CEP 1.5.8",
            "Digite o texto contido na imagem",
            "Resultado da Busca por Faixa de CEP ou UF/Localidade",
        ],
    },
    {
        "file": "upu-brazil.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/braEn.pdf",
        "kind": "pdf",
        "bytes": 157861,
        "sha256": "db74529856993bc48d5eb44c3b430330b18bcfcb8fc53df2ff0c8bd7e2fd5c1c",
        "pages": 2,
        "edition": "03/2012 sheet; PDF produced 2023-06-30",
        "page_markers": {
            0: [
                "8 digits under the name of the locality",
                "delivery area",
                "P.O box",
            ],
            1: [
                "Big mailer with special postcode",
                "Empresa Brasileira de Correios e Telégrafos",
                "03/2012",
            ],
        },
    },
]


def digest(body):
    return sha256(body).hexdigest()


def normalized(value):
    value = re.sub(r"<script\b[^>]*>.*?</script>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<style\b[^>]*>.*?</style>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<[^>]+>", " ", value)
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
        "schemaVersion": "postal-context-br-source-inspection/v1",
        "countryCode": "BR",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "postcodeDisplayFormat": "NNNNN-NNN",
        "postcodeNormalizedFormat": "NNNNNNNN",
        "latestAdvertisedDneEdition": "V.26082",
        "latestAdvertisedDnePublicationDate": "2026-08-31",
        "dneCompleteDatasetAcquired": False,
        "apiCredentialsOrContractUsed": False,
        "apiFeatureOrAddressRowsQueried": 0,
        "officialPostalGeometryRecords": 0,
        "derivedOrVirtualPostalGeometryRecords": 0,
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
