"""Offline, digest-bound Argentina Postal Context M2 source inspector.

Reads exact official bodies from a caller-provided temporary directory and
emits aggregate receipts only. It performs no network request, lookup, source
row output, geometry creation, licence inference, transformation or promotion.
"""

import argparse
import hashlib
import json
import re
from pathlib import Path

import pdfplumber


EXPECTED = [
    {
        "file": "correo-cpa.html",
        "url": "https://www.correoargentino.com.ar/encabezado/cpa",
        "bytes": 27704,
        "sha256": "04e1fa78978e02c575a5a509bc62acf2ea4bf3c66d108599a9ecc4c3358d73b8",
        "kind": "html",
        "markers": [
            "Tenemos la responsabilidad de mantener, actualizar e incorporar en la base de datos del Código Postal Argentino",
            "todas las localidades, calles y alturas existentes en el territorio de la República Argentina",
        ],
    },
    {
        "file": "correo-cpa-search.html",
        "url": "https://www.correoargentino.com.ar/formularios/cpa",
        "bytes": 36475,
        "sha256": "6e11d2f368907c73c04ca751e50b403597350c5d64247cc0a427bf20d0162094",
        "kind": "html",
        "markers": [
            "Acá podrás encontrar fácilmente el CPA de cualquier dirección de tu interés",
            "código alfanumérico de 8 caracteres",
            "un bloque de edificios, una zona rural o un apartado postal",
        ],
    },
    {
        "file": "correo-normalizacion.html",
        "url": "https://www.correoargentino.com.ar/4-normalizacion-de-domicilios",
        "bytes": 28695,
        "sha256": "3e0333e9bcdb63191dc4165ae4f444a5d706c4e8a53699518334d0b480ba3217",
        "kind": "html",
        "markers": [
            "Es un servicio que brinda Correo Argentino basado en CPA",
            "asignación de CPA mediante procesos batch o webservice",
            "servicio Batch se utiliza generalmente para normalizar bases históricas",
        ],
    },
    {
        "file": "aaip-ex-2023-59298590.pdf",
        "url": "https://www.argentina.gob.ar/sites/default/files/1334_-_4-7-2023_-_if-2023-76657116-apn-aaip.pdf",
        "bytes": 81929,
        "sha256": "abfd74ff92a8af4efd633dfdbd719d6a019a1ba89e7b7ed65b2afb2a6b66220c",
        "kind": "pdf",
        "pages": 3,
        "page_markers": {
            0: [
                "EX-2023-59298590",
                "listado de TODOS los códigos postales (CPA) correspondientes a la Provincia de Buenos Aires",
                "parte inescindible de un producto comercial",
                "procesos de batch (off-line y para grandes volúmenes)",
            ],
            1: [
                "la información individual es accesible y gratuita",
                "uso epistolar individual",
                "desarrollo y procesamiento parcial o total de la base de datos",
            ],
            2: [
                "solicitudes masivas de códigos de territorios",
                "convenios particulares y alcances definidos",
                "resguardo de nuestra Propiedad Intelectual",
            ],
        },
    },
    {
        "file": "georef-v2.html",
        "url": "https://www.argentina.gob.ar/georef/nueva-version-de-la-api-georef",
        "bytes": 33479,
        "sha256": "526b7812b447edb979b76b2839abcdfa8b554609e789292016528605120693ec",
        "kind": "html",
        "markers": [
            "servicio oficial de normalización de direcciones y unidades territoriales de Argentina",
            "herramienta gratuita y de código abierto",
            "Localidad incluida en respuestas de direcciones",
        ],
    },
    {
        "file": "georef-openapi.json",
        "url": "https://raw.githubusercontent.com/datosgobar/georef-ar-api/master/docs/open-api/spec/openapi.json",
        "bytes": 64559,
        "sha256": "a0c3d492ec8bbc111bf65f28a58b50619b7ec474ffa3b8f5b6c7aee977651c4b",
        "kind": "json",
        "markers": ["georef-ar-api", "0.5.X"],
    },
    {
        "file": "resolucion-118-2011.html",
        "url": "https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-118-2011-180387/texto",
        "bytes": 38040,
        "sha256": "84d3646a01e6ac68d4da94a9c6afa1e6870eaf2f7c9836502478d2418ad0fc7a",
        "kind": "html",
        "markers": [
            "Resolución Nº 118/2011",
            "la base denominada CPA —Código Postal Argentino— del CORREO ARGENTINO",
            "como patrón para la determinación y validación de los domicilios",
        ],
    },
    {
        "file": "upu-arg-addressing-2002.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/argEn.pdf",
        "bytes": 121681,
        "sha256": "3dcd01d52a878d44e2ac914ba04516c29076ad27140c1199da8c431a3a395489",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {
            0: [
                "8 alphanumeric characters (1 letter, 4 digits and 3 letters)",
                "block",
                "P.O. Box delivery",
                "07/2002",
            ]
        },
    },
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(text):
    return re.sub(r"\s+", " ", text).strip()


def recursive_keys(value):
    if isinstance(value, dict):
        for key, item in value.items():
            yield key
            yield from recursive_keys(item)
    elif isinstance(value, list):
        for item in value:
            yield from recursive_keys(item)


def validate_georef_openapi(document):
    expected_paths = {
        "/provincias",
        "/departamentos",
        "/municipios",
        "/localidades-censales",
        "/asentamientos",
        "/localidades",
        "/calles",
        "/direcciones",
        "/ubicacion",
        "/{filename}",
    }
    if document.get("openapi") != "3.0.1" or document.get("info", {}).get("version") != "0.5.X":
        raise ValueError("georef-openapi-version-review-required")
    observed_paths = set(document.get("paths", {}))
    if observed_paths != expected_paths:
        raise ValueError("georef-openapi-path-set-review-required")
    postal_keys = sorted(key for key in recursive_keys(document) if re.search(r"postal|cpa", key, re.IGNORECASE))
    if postal_keys:
        raise ValueError(f"georef-openapi-postal-key-review-required:{postal_keys}")
    direction = document.get("components", {}).get("schemas", {}).get("direccion")
    if not isinstance(direction, dict):
        raise ValueError("georef-openapi-direccion-schema-missing")


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {
        path.name
        for path in source_dir.iterdir()
        if path.is_file() and path.suffix.lower() in {".pdf", ".html", ".json"}
    }
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")

    exact_bodies = []
    georef_postal_keys = None
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
                    raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
        elif item["kind"] == "json":
            text = body.decode("utf-8", errors="strict")
            document = json.loads(text)
            for marker in item["markers"]:
                if marker not in text:
                    raise ValueError(f"missing-json-marker:{item['file']}:{marker}")
            validate_georef_openapi(document)
            georef_postal_keys = []
        elif item["kind"] == "pdf":
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            with pdfplumber.open(path) as pdf:
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
        exact_bodies.append(
            {
                "file": item["file"],
                "url": item["url"],
                "bytes": len(body),
                "sha256": item["sha256"],
                "pages": pages,
            }
        )

    return {
        "schemaVersion": "postal-context-ar-source-inspection/v1",
        "countryCode": "AR",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentCpaFormat": "ANNNNAAA",
        "correoMaintainsNationalCpaMaster": True,
        "individualEpistolaryLookupFree": True,
        "bulkOrPartialDatabaseProcessingCommercial": True,
        "bulkServicesRequireParticularAgreements": True,
        "correoAssertsIntellectualPropertyProtection": True,
        "georefOpenapiVersion": "0.5.X",
        "georefEndpointCount": 10,
        "georefPostalOrCpaKeys": georef_postal_keys,
        "currentCompleteCpaAssignmentRowsValidated": 0,
        "officialPostalGeometryRecords": 0,
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
