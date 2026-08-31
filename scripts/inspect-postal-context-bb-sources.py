"""Offline, digest-bound Barbados Postal Context M2 source inspector.

Reads exact official publication and public metadata bodies from a caller-
provided temporary directory. It never queries feature rows, postal search
terms, addresses, people, parcels or buildings and emits aggregate receipts
only.
"""

import argparse
import hashlib
import html
import json
import re
from pathlib import Path

import pdfplumber


EXPECTED = [
    {
        "file": "bps-find.html", "url": "https://bps.gov.bb/find-a-postal-code/", "bytes": 39160,
        "sha256": "e0cd4fb9bb363b525ba19171f3800b4886b7aa8d05b6914aefad128950e4c3e0", "kind": "html",
        "markers": ["Enter neighbourhood or district name", "No results found for that area", "Something went wrong. Please try again."],
    },
    {
        "file": "bps-address.html", "url": "https://bps.gov.bb/how-to-address-a-letter/", "bytes": 40192,
        "sha256": "6df6f4e069325b8b8023a6b67bae8a9a1d8ad125618ea7fbdab6b573e09f0f1e", "kind": "html",
        "markers": ["How To Address A Letter", "Christ Church", "BB19040", "INCOMPLETE"],
    },
    {
        "file": "bps-terms.html", "url": "https://bps.gov.bb/terms-conditions/", "bytes": 46655,
        "sha256": "626a55de3e603fcc0c982327eadb9ce3f9f8c3eee4d2385253488dac83a1658c", "kind": "html",
        "markers": ["All website design, text, graphics", "making, transmitting or storing electronic copies of materials protected by copyright without the permission of the owner", "2026 Barbados Postal Service"],
    },
    {
        "file": "upu-brb.pdf", "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/brbEn.pdf", "bytes": 214072,
        "sha256": "71cfb3fc8c608e423132409bdd311131131279e21636ac9b8942a5403dd6a1d6", "kind": "pdf", "pages": 1,
        "page_markers": {0: ["5 digits after the locality name and preceded by", "St. Peter BB26028", "11/2014"]},
    },
    {
        "file": "arcgis-experience-item.json", "url": "https://www.arcgis.com/sharing/rest/content/items/2b41a13f4f5e49879925aa5a7ebee67d?f=pjson", "bytes": 3419,
        "sha256": "b4e51e4955acead5bf68daad4de7c5a50a9ef4e61c385f0e7d8d33618916bb85", "kind": "json",
        "checks": {"id": "2b41a13f4f5e49879925aa5a7ebee67d", "type": "Web Experience", "access": "public", "licenseInfo": None},
    },
    {
        "file": "arcgis-experience-data.json", "url": "https://www.arcgis.com/sharing/rest/content/items/2b41a13f4f5e49879925aa5a7ebee67d/data", "bytes": 1168251,
        "sha256": "8d6bfc6384b636c42fe45f21584ea5f16eab97bedc35f6a4780ff4ecd58dc5cb", "kind": "json",
        "checks": {"dataSources.dataSource_add_from_url_entry.itemId": "ada5eb767ba64cd8a4170d98c30ee1f0", "dataSources.dataSource_add_from_url_entry.type": "WEB_MAP", "dataSources.dataSource_add_from_url_entry.portalUrl": "https://Bds-LSDept.maps.arcgis.com"},
    },
    {
        "file": "arcgis-webmap-item.json", "url": "https://Bds-LSDept.maps.arcgis.com/sharing/rest/content/items/ada5eb767ba64cd8a4170d98c30ee1f0?f=pjson", "bytes": 1462,
        "sha256": "49386af5d97172e7a8f2e53225984fbab9682c552df7602d00e5c764f6f1dedf", "kind": "json",
        "checks": {"id": "ada5eb767ba64cd8a4170d98c30ee1f0", "type": "Web Map", "access": "public", "licenseInfo": "", "modified": 1787602757000},
    },
    {
        "file": "arcgis-webmap-data.json", "url": "https://Bds-LSDept.maps.arcgis.com/sharing/rest/content/items/ada5eb767ba64cd8a4170d98c30ee1f0/data", "bytes": 417954,
        "sha256": "bdecd7dcaeec3cb755d14107ac5251010cf502becbb6f7be3533f90ec1fb408b", "kind": "json",
        "checks": {"operationalLayers.0.title": "BBuildingID", "operationalLayers.0.itemId": "302e84d2eb6846b4a0009c3421ea0a94", "operationalLayers.0.url": "https://services7.arcgis.com/GaT8GzOa0Kqi9sL7/arcgis/rest/services/2019SimplifiedBuildings/FeatureServer/0"},
    },
    {
        "file": "arcgis-building-item.json", "url": "https://Bds-LSDept.maps.arcgis.com/sharing/rest/content/items/302e84d2eb6846b4a0009c3421ea0a94?f=pjson", "bytes": 1540,
        "sha256": "00357a411cb81d406ba52f0a89093c59a320ec86ac82f49f3b791fc0a1d7e362", "kind": "json",
        "checks": {"id": "302e84d2eb6846b4a0009c3421ea0a94", "type": "Feature Service", "access": "public", "licenseInfo": "", "modified": 1787664970000},
    },
    {
        "file": "arcgis-building-service.json", "url": "https://services7.arcgis.com/GaT8GzOa0Kqi9sL7/arcgis/rest/services/2019SimplifiedBuildings/FeatureServer?f=pjson", "bytes": 4325,
        "sha256": "5f0ec1892619dce8cea43e51c13b92cd07c19ab740904958cdf273595fca4059", "kind": "json",
        "checks": {"currentVersion": 12, "capabilities": "Query", "layers.0.id": 0, "layers.0.name": "Simplified Buildings 24082026", "layers.0.geometryType": "esriGeometryPolygon"},
    },
    {
        "file": "arcgis-building-layer.json", "url": "https://services7.arcgis.com/GaT8GzOa0Kqi9sL7/arcgis/rest/services/2019SimplifiedBuildings/FeatureServer/0?f=pjson", "bytes": 14300,
        "sha256": "bb86a944b25b73a4d69fb2c13d512978161616aea69febe2b64fb54a78649db3", "kind": "json",
        "checks": {"name": "Simplified Buildings 24082026", "geometryType": "esriGeometryPolygon", "capabilities": "Query", "editingInfo.dataLastEditDate": 1787664967985, "extent.spatialReference.wkid": 21292},
        "field_names": ["BuildingID", "ShortPosta", "LongPostal"],
    },
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(text):
    return re.sub(r"\s+", " ", html.unescape(text).replace("’", "'").replace("“", '"').replace("”", '"')).strip()


def at_path(value, path):
    for part in path.split("."):
        value = value[int(part)] if isinstance(value, list) else value[part]
    return value


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {path.name for path in source_dir.iterdir() if path.is_file()}
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")

    exact_bodies = []
    json_documents = 0
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
        elif item["kind"] == "json":
            value = json.loads(body)
            for key, expected_value in item.get("checks", {}).items():
                try:
                    actual = at_path(value, key)
                except (KeyError, IndexError, TypeError, ValueError) as error:
                    raise ValueError(f"missing-json-path:{item['file']}:{key}") from error
                if actual != expected_value:
                    raise ValueError(f"json-value-drift:{item['file']}:{key}")
            if item.get("field_names"):
                field_names = {field.get("name") for field in value.get("fields", [])}
                if not set(item["field_names"]).issubset(field_names):
                    raise ValueError(f"json-field-drift:{item['file']}")
            json_documents += 1
        else:
            raise ValueError(f"unsupported-kind:{item['kind']}")
        exact_bodies.append({"file": item["file"], "url": item["url"], "bytes": len(body), "sha256": item["sha256"], "pages": pages})

    return {
        "schemaVersion": "postal-context-bb-source-inspection/v1",
        "countryCode": "BB",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "jsonMetadataDocuments": json_documents,
        "currentPostalCodeFormats": ["BBNNNNN", "BBNNNNN-AAAAA"],
        "currentCompleteLegacyAndUpdatedAssignmentsValidated": 0,
        "publicBbidBuildingPolygonLayerMetadataValidated": 1,
        "rightsClearedPostalAreaOrBuildingLinkedArtifacts": 0,
        "officialPostalAreaPolygonRecords": 0,
        "featureRowsQueried": 0,
        "rawSourceRowsEmitted": 0,
        "productionEligibleRecords": 0,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
