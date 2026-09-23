"""Offline, digest-bound Bolivia Postal Context M2 source inspector.

Reads exact official and public-metadata bodies from a caller-provided
temporary directory and emits aggregate evidence only. It performs no network
request, address or feature-row query, geometry creation, licence inference or
promotion.
"""

import argparse
import hashlib
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber


EXPECTED = [
    {
        "file": "agbc-home.html",
        "url": "https://www.correos.gob.bo/",
        "bytes": 294136,
        "sha256": "2ca7d01f389041c53593d01857334d54a9f95124d2dcce3f5f0d74ebbcd38c47",
        "kind": "html",
        "markers": ["window.__NUXT__", "trackingbo.correos.gob.bo", "postalCalculatorApiUrl"],
    },
    {
        "file": "agbc-contact.html",
        "url": "https://www.correos.gob.bo/contacto",
        "bytes": 318267,
        "sha256": "71d566be01fd1e0af2cc80d03aef16ef64b05f53b75b806daabceddfedf51b85",
        "kind": "html",
        "markers": ["Correos de Bolivia", "Contacto", "Todos los derechos reservados"],
    },
    {
        "file": "agbc-home-api.json",
        "url": "https://www.correos.gob.bo/frontapi/api/site/pages/home",
        "bytes": 48268,
        "sha256": "db1cbd03d34407a3a89305a63c469a97bd1b7540a8d8c8d44a4274c7d8f6eb3f",
        "kind": "agbc-json",
    },
    {
        "file": "agbc-index.js",
        "url": "https://www.correos.gob.bo/_nuxt/pages/index.js",
        "bytes": 66923,
        "sha256": "23d6a35fb69a00a010fdbda38b2cd288d8aff10e6b18a72ecda7c20adb68e72d",
        "kind": "text",
        "markers": ["/frontapi/api/site/pages/home"],
    },
    {
        "file": "upu-bol.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bolEn.pdf",
        "bytes": 44577,
        "sha256": "777e1fa760f16648ecd3d4a4f8e4272faef953d390dcaed82db363fdbc518281",
        "kind": "pdf",
        "pages": 1,
        "edition": "2/2026",
        "page_markers": {
            0: [
                "Bolivia",
                "Home delivery",
                "CALLE AZURDUY 158",
                "Casilla Postal 3515",
                "Rural delivery",
                "Agencia Boliviana de Correos",
                "2/2026",
            ]
        },
    },
    {
        "file": "upu-general-addressing.pdf",
        "url": "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf",
        "bytes": 631050,
        "sha256": "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d",
        "kind": "pdf",
        "pages": 12,
        "edition": "Sep. 2025 no-postcode list",
        "page_markers": {
            3: [
                "Universal DataBase (Sep. 2025)",
                "List of countries which do not require postal codes",
                "Bolivia",
            ]
        },
    },
    {
        "file": "arcgis-service.json",
        "url": "https://services7.arcgis.com/OsNfmcCXlLRPMVA8/arcgis/rest/services/CodigoPostal/FeatureServer?f=pjson",
        "bytes": 4325,
        "sha256": "4497fa43fbe03c74f7a30bc921872eced9de2a196076842034d5647bd1b4ffd7",
        "kind": "arcgis-service",
    },
    {
        "file": "arcgis-layer.json",
        "url": "https://services7.arcgis.com/OsNfmcCXlLRPMVA8/arcgis/rest/services/CodigoPostal/FeatureServer/0?f=pjson",
        "bytes": 12769,
        "sha256": "3d3b71dabb4a0f24b00a71df83762de15a26a4c64109332747ebd458851cefb4",
        "kind": "arcgis-layer",
    },
    {
        "file": "arcgis-item.json",
        "url": "https://www.arcgis.com/sharing/rest/content/items/f69b67a266cc420b86bb3a8d6546ea31?f=pjson",
        "bytes": 1600,
        "sha256": "073499c84e5d15e723b337c6d4e2224f41c2edc879af484b76ef0766363a67e0",
        "kind": "arcgis-item",
    },
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(text):
    return re.sub(r"\s+", " ", html.unescape(text).replace("’", "'")).strip()


def section(document, key):
    matches = [value for value in document.get("sections", []) if value.get("key") == key]
    if len(matches) != 1:
        raise ValueError(f"agbc-section:{key}")
    return matches[0]


def assert_equal(actual, expected, label):
    if actual != expected:
        raise ValueError(f"unexpected-{label}:{actual!r}")


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {
        path.name
        for path in source_dir.iterdir()
        if path.is_file() and path.suffix.lower() in {".pdf", ".html", ".json", ".js"}
    }
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")

    exact_bodies = []
    findings = {}
    for item in expected:
        path = source_dir / item["file"]
        body = path.read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError(f"source-changed-review-required:{item['file']}")
        pages = None
        kind = item["kind"]
        if kind in {"html", "text"}:
            text = normalized(body.decode("utf-8", errors="strict"))
            for marker in item["markers"]:
                if normalized(marker) not in text:
                    raise ValueError(f"missing-text-marker:{item['file']}:{marker}")
        elif kind == "pdf":
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
        elif kind == "agbc-json":
            document = json.loads(body)
            assert_equal(document.get("slug"), "home", "agbc-slug")
            assert_equal(document.get("meta_title"), "Correos de Bolivia", "agbc-title")
            hero = section(document, "hero").get("settings", {})
            assert_equal(hero.get("tracking_label"), "Codigo de seguimiento", "tracking-label")
            assert_equal(hero.get("tracking_placeholder"), "Ej: PE123456789", "tracking-placeholder")
            services = section(document, "services").get("items", [])
            assert_equal(any(value.get("name") == "Casillas" for value in services), True, "po-box-service")
            offices = [value for value in section(document, "tools").get("items", []) if value.get("type") == "office"]
            assert_equal(len(offices), 9, "office-count")
            footer = section(document, "footer")
            assert_equal(
                footer.get("settings", {}).get("copyright"),
                "© 2026 Correos de Bolivia. Todos los derechos reservados.",
                "copyright",
            )
            terms = [value for value in footer.get("items", []) if value.get("name") == "Terminos y Condiciones"]
            assert_equal(len(terms), 1, "terms-count")
            assert_equal(terms[0].get("data", {}).get("url"), "#", "terms-url")
            findings["agbcOfficeRecords"] = 9
        elif kind == "arcgis-service":
            document = json.loads(body)
            assert_equal(document.get("serviceDescription"), "Capa de Código Postal", "arcgis-service")
            assert_equal(len(document.get("layers", [])), 1, "arcgis-layer-count")
        elif kind == "arcgis-layer":
            document = json.loads(body)
            assert_equal(document.get("name"), "Código postal", "arcgis-layer-name")
            assert_equal(document.get("geometryType"), "esriGeometryPolygon", "arcgis-geometry-type")
            assert_equal(document.get("extent", {}).get("spatialReference", {}).get("wkid"), 3116, "arcgis-wkid")
            fields = [field.get("name") for field in document.get("fields", [])]
            assert_equal("CODIGO_POS" in fields, True, "arcgis-code-field")
            findings["arcgisLayerFields"] = fields
        elif kind == "arcgis-item":
            document = json.loads(body)
            assert_equal(document.get("id"), "f69b67a266cc420b86bb3a8d6546ea31", "arcgis-item-id")
            assert_equal(document.get("owner"), "lider.planeacion", "arcgis-owner")
            assert_equal(document.get("type"), "Feature Service", "arcgis-item-type")
            assert_equal(document.get("extent"), [[-75.63410222497822, 6.113132705468609], [-75.58854266098474, 6.163225889296734]], "arcgis-item-extent")
            assert_equal(document.get("licenseInfo"), None, "arcgis-license")
            assert_equal(document.get("accessInformation"), None, "arcgis-access-information")
            findings["arcgisItemCreatedAt"] = datetime.fromtimestamp(document["created"] / 1000, timezone.utc).isoformat().replace("+00:00", "Z")
            findings["arcgisItemModifiedAt"] = datetime.fromtimestamp(document["modified"] / 1000, timezone.utc).isoformat().replace("+00:00", "Z")
        else:
            raise ValueError(f"unsupported-kind:{kind}")
        receipt = {"file": item["file"], "url": item["url"], "bytes": len(body), "sha256": item["sha256"]}
        if pages is not None:
            receipt["pages"] = pages
            if item.get("edition"):
                receipt["edition"] = item["edition"]
        exact_bodies.append(receipt)

    return {
        "schemaVersion": "postal-context-bo-source-inspection/v1",
        "countryCode": "BO",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "none",
        "upuAddressingSheetEdition": "2/2026",
        "upuListsBoliviaAsNotRequiringPostalCodes": True,
        "agbcTrackingIdentifierExample": "PE123456789",
        "agbcTrackingIdentifierTreatedAsPostcode": False,
        "agbcOfficeRecordsInspectedAsAggregate": findings["agbcOfficeRecords"],
        "currentCompletePostalCodeAssignmentsValidated": 0,
        "officialPostalGeometryRecords": 0,
        "arcgisFalsePositiveWgs84Extent": [[-75.63410222497822, 6.113132705468609], [-75.58854266098474, 6.163225889296734]],
        "arcgisFalsePositiveIsBolivia": False,
        "arcgisFalsePositiveFeatureRowsQueried": 0,
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
