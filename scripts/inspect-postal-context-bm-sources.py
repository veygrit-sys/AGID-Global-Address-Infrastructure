"""Offline, digest-bound Bermuda Postal Context M2 source inspector.

Reads exact official publication, workbook and public metadata bodies from a
caller-provided temporary directory. Raw workbook rows, addresses and geometry
are never emitted. The public workbook uses Excel's standard default
``VelvetSweatshop`` protection; no guessed or provider credential is used.
"""

import argparse
import hashlib
import html
import io
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


EXPECTED = [
    {
        "file": "gov-post-office-locations.html",
        "url": "https://www.gov.bm/post-office-locations",
        "bytes": 95738,
        "sha256": "9aed43bb6f3495eb58fa7885230761d5059068800b83fc464b88e42581262300",
        "kind": "html",
        "markers": [
            'datetime="2026-07-14"', "Hamilton HM 12", "Devonshire DV 06", "Smiths FL 04",
            "Hamilton Parish CR 01", "Sandy's MA 02", "Southampton SN 01",
            "St. George's GE 05", "Warwick WK 03", "Hamilton HM 11",
        ],
    },
    {
        "file": "gov-post-office-department.html",
        "url": "https://www.gov.bm/department/post-office",
        "bytes": 108655,
        "sha256": "f61ba50e77e2dbb3582b9315cafe63e11951c090f304eb28ed42741d00ba21c9",
        "kind": "html",
        "markers": [
            "The Bermuda Post Office consists of two divisions",
            "Bermuda Postal Codes and Parishes",
            "019f1ea9-646b-77ef-8027-38f3d27f1b6a",
        ],
    },
    {
        "file": "gov-copyright-protection.html",
        "url": "https://www.gov.bm/copyright-protection",
        "bytes": 126827,
        "sha256": "e67b7dce33da6760e774b12abdc9a4912252bbbacd8d62a842229e0d5b470eda",
        "kind": "html",
        "markers": [
            "software, web content and databases", "Copyright prevents people from",
            "distributing copies of it", "putting it on the internet",
        ],
    },
    {
        "file": "gov-online-terms.pdf",
        "url": "https://forms.gov.bm/Portals/4/docs/2020-4Jun-BdaGov-Website-Terms-of-Use.pdf",
        "bytes": 80860,
        "sha256": "7d1d28fa3e91b86da44e342a5e82bd5153044429cc6f201f0909be37f737bd7b",
        "kind": "pdf",
        "pages": 10,
        "page_markers": {
            0: ["GOVERNMENT OF BERMUDA ONLINE - TERMS OF USE", "BY USING THE SITE, YOU AGREE"],
            1: [
                "Using the Site will not give you a license to exercise any intellectual property rights",
                "Content on the Site is subject to Crown copyright protection",
                "It is forbidden to reproduce, distribute, modify or transmit the Site or its contents, without our written permission",
            ],
            9: ["Copyright © 2020 the Government of Bermuda. All rights reserved."],
        },
    },
    {
        "file": "gov-bermuda-postal-codes-parishes",
        "url": "https://www.gov.bm/media/019f1ea9-646b-77ef-8027-38f3d27f1b6a?download",
        "bytes": 262144,
        "sha256": "6dc5a5bdc691ec74c8e87c3505ac0c7cd875041ee9d5e0f14b2241a1625491fa",
        "kind": "xls",
        "workbook": {
            "decryptedBytes": 262144,
            "decryptedSha256": "d6ee6c55346b853f52df4c720bec16ea33a90263c12d4eed58d5aeaf4e453709",
            "sheetNames": ["Sheet1", "Sheet2", "Sheet3"],
            "physicalRows": 2094,
            "physicalColumns": 33,
            "nonEmptyRows": 2088,
            "embeddedHeaders": 1,
            "candidateAssignmentRows": 2087,
            "uniqueNormalizedRows": 2086,
            "exactDuplicateRows": 1,
            "uniqueNormalizedPostcodes": 102,
            "homeDeliveryNumericCodes": 80,
            "alphaPostcodes": 22,
            "numericAssignmentRows": 2063,
            "alphaAssignmentRows": 24,
            "alphaBoxRows": 22,
            "caseAnomalies": 1,
            "qualifierAnomalies": 1,
            "ambiguousAssignmentKeys": 30,
            "parishLabelVariants": 12,
            "geometryColumns": 0,
            "rawLogicalRowsSha256": "ebcd141478bb18d36f9dbabc30abcf15e30dfed784a3fc4fac2e6bfca9623a48",
            "workbookCreatedAt": "2007-02-28T14:07:33Z",
            "workbookLastSavedAt": "2019-03-28T19:32:44Z",
        },
    },
    {
        "file": "upu-bmu-addressing.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bmuEn.pdf",
        "bytes": 146241,
        "sha256": "1c0107c7af16d762a3d02a7926a9dcc553999c6e62cac601779b9bb4a8c1b5f2",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {
            0: [
                "4 alphanumeric characters", "AA NN", "AA AA", "postal route",
                "delivery office", "SMITH'S FL 07", "HAMILTON HM GX", "4/2026",
            ]
        },
    },
    {
        "file": "upu-addressing-solutions.html",
        "url": "https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions",
        "bytes": 196770,
        "sha256": "8f344f1e21f6cddfa092c205c0ee8e636b529e24c01e6325ed905113ffd171a3",
        "kind": "html",
        "markers": [
            "A world postcode database containing the postcodes of 192 member countries",
            "Update: 2026.1", "Contract", "Non-disclosure agreement", "Data use declaration", "Rates",
        ],
    },
    {
        "file": "arcgis-belco-item.json",
        "url": "https://www.arcgis.com/sharing/rest/content/items/133d41a78fc54d9c8aaedba697affc5a?f=pjson",
        "bytes": 1500,
        "sha256": "f1e2fe4f6ad0125e644fc3d443e1088e4078bd8b231784100982ad8c292d4030",
        "kind": "json",
        "checks": {
            "id": "133d41a78fc54d9c8aaedba697affc5a",
            "owner": "dtulloch@liberty.bm_BELCO_Ltd",
            "type": "Tile Package",
            "description": "BELCO Bermuda basemap with buildings footprint, roads and Postal Codes",
            "spatialReference": "Bermuda_2000_National_Grid",
            "access": "public",
            "listed": False,
            "accessInformation": "",
            "licenseInfo": "",
            "size": 47352226,
        },
    },
    {
        "file": "arcgis-item.json",
        "url": "https://www.arcgis.com/sharing/rest/content/items/28320d9e18c04cada00d3fa9621368a3?f=pjson",
        "bytes": 2187,
        "sha256": "5d974bc53f733184b133bb0391e976f852b3e87e9866965d12fd8b70eb56968d",
        "kind": "json",
        "checks": {
            "id": "28320d9e18c04cada00d3fa9621368a3",
            "owner": "Geotripz_worldmap",
            "title": "Gp_Postal Codes",
            "access": "public",
            "licenseInfo": None,
            "extent.0.0": 26.28742,
            "extent.0.1": -28.041670000000025,
            "extent.1.0": 30.041195,
            "extent.1.1": -24.677977000000006,
        },
    },
    {
        "file": "arcgis-owner.json",
        "url": "https://www.arcgis.com/sharing/rest/community/users/Geotripz_worldmap?f=pjson",
        "bytes": 232,
        "sha256": "4bad2157b76541a2d733057d81396363e07242fcf06af7f8af6a13f4c40a59e4",
        "kind": "json",
        "checks": {"username": "Geotripz_worldmap", "provider": "arcgis"},
    },
    {
        "file": "arcgis-service.json",
        "url": "https://services7.arcgis.com/iEMmryaM5E3wkdnU/arcgis/rest/services/Gp_Postal_Codes/FeatureServer?f=pjson",
        "bytes": 4314,
        "sha256": "9444e94d21fac113ef6890a9d7d49345f9f3e53e4ae16a49a647e80f970d7f80",
        "kind": "json",
        "checks": {
            "layers.0.name": "Gp_Postal_Codes_0",
            "layers.0.geometryType": "esriGeometryPolygon",
            "fullExtent.spatialReference.wkid": 102100,
        },
    },
    {
        "file": "arcgis-layer.json",
        "url": "https://services7.arcgis.com/iEMmryaM5E3wkdnU/arcgis/rest/services/Gp_Postal_Codes/FeatureServer/0?f=pjson",
        "bytes": 13774,
        "sha256": "c348f02d4b60d76a0a0d6958e68f2359e9fa51d84096d4577688c96e975541d9",
        "kind": "json",
        "checks": {
            "name": "Gp_Postal_Codes_0",
            "geometryType": "esriGeometryPolygon",
            "extent.xmin": 2926302.2086689156,
            "extent.ymin": -3254228.4398146686,
            "extent.xmax": 3344170.530221436,
            "extent.ymax": -2836242.887607743,
            "extent.spatialReference.wkid": 102100,
        },
        "field_names": ["ID", "AREA", "STRCODE", "CENTROIDX", "CENTROIDY"],
        "prohibited_field_names": ["PostalCode", "POSTCODE", "POSTAL_CODE"],
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


def read_pdf(body):
    import pdfplumber

    with pdfplumber.open(io.BytesIO(body)) as pdf:
        return [normalized(page.extract_text() or "") for page in pdf.pages]


def inspect_workbook(body):
    import msoffcrypto
    import olefile
    import xlrd

    decrypted = io.BytesIO()
    office_file = msoffcrypto.OfficeFile(io.BytesIO(body))
    if not office_file.is_encrypted():
        raise ValueError("workbook-protection-drift")
    office_file.load_key(password="VelvetSweatshop")
    office_file.decrypt(decrypted)
    decrypted_body = decrypted.getvalue()

    workbook = xlrd.open_workbook(file_contents=decrypted_body, formatting_info=True, on_demand=False)
    sheet = workbook.sheet_by_index(0)
    logical_rows = []
    for row_index in range(1, sheet.nrows):
        row = tuple(str(sheet.cell_value(row_index, column)).strip() for column in range(5))
        if any(row):
            logical_rows.append(row)

    raw_digest = digest("\n".join("\t".join(row) for row in logical_rows).encode("utf-8"))
    embedded_headers = sum(row[0] == "Sub Office" and row[3] == "Postal Code" for row in logical_rows)
    candidates = [row for row in logical_rows if not (row[0] == "Sub Office" and row[3] == "Postal Code")]
    normalized_rows = [(row[0], row[1], row[2], row[3].upper(), row[4]) for row in candidates]
    codes = {row[3] for row in normalized_rows}
    numeric_pattern = re.compile(r"[A-Z]{2} [0-9]{2}")
    alpha_pattern = re.compile(r"[A-Z]{2} [A-Z]{2}")
    assignment_keys = defaultdict(set)
    for row in normalized_rows:
        assignment_keys[(row[0].casefold(), row[1].casefold(), row[2].casefold())].add((row[3], row[4]))

    metadata = olefile.OleFileIO(io.BytesIO(decrypted_body)).get_metadata()
    created_at = metadata.create_time.strftime("%Y-%m-%dT%H:%M:%SZ")
    saved_at = metadata.last_saved_time.strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "decryptedBytes": len(decrypted_body),
        "decryptedSha256": digest(decrypted_body),
        "sheetNames": workbook.sheet_names(),
        "physicalRows": sheet.nrows,
        "physicalColumns": sheet.ncols,
        "nonEmptyRows": len(logical_rows),
        "embeddedHeaders": embedded_headers,
        "candidateAssignmentRows": len(normalized_rows),
        "uniqueNormalizedRows": len(set(normalized_rows)),
        "exactDuplicateRows": len(normalized_rows) - len(set(normalized_rows)),
        "uniqueNormalizedPostcodes": len(codes),
        "homeDeliveryNumericCodes": sum(bool(numeric_pattern.fullmatch(code)) for code in codes),
        "alphaPostcodes": sum(bool(alpha_pattern.fullmatch(code)) for code in codes),
        "numericAssignmentRows": sum(bool(numeric_pattern.fullmatch(row[3])) for row in normalized_rows),
        "alphaAssignmentRows": sum(bool(alpha_pattern.fullmatch(row[3])) for row in normalized_rows),
        "alphaBoxRows": sum("box" in row[0].lower() and bool(alpha_pattern.fullmatch(row[3])) for row in normalized_rows),
        "caseAnomalies": sum(row[3] != row[3].upper() for row in candidates),
        "qualifierAnomalies": sum(row[2] not in ("", "Even", "Odd") for row in candidates),
        "ambiguousAssignmentKeys": sum(len(values) > 1 for values in assignment_keys.values()),
        "parishLabelVariants": len({row[4] for row in normalized_rows}),
        "geometryColumns": sum(name.lower() in {"geometry", "geom", "wkt", "geojson", "latitude", "longitude"} for name in [str(sheet.cell_value(0, column)).strip() for column in range(5)]),
        "rawLogicalRowsSha256": raw_digest,
        "workbookCreatedAt": created_at,
        "workbookLastSavedAt": saved_at,
    }


def inspect_source_dir(source_dir, expected=EXPECTED, pdf_reader=read_pdf, workbook_reader=inspect_workbook):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {path.name for path in source_dir.iterdir() if path.is_file() and not path.name.endswith("-decrypted.xls")}
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")

    receipts = []
    workbook_summary = None
    for item in expected:
        body = (source_dir / item["file"]).read_bytes()
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
            page_text = pdf_reader(body)
            pages = len(page_text)
            if pages != item["pages"]:
                raise ValueError(f"pdf-page-count:{item['file']}")
            for page_index, markers in item["page_markers"].items():
                for marker in markers:
                    if normalized(marker) not in page_text[page_index]:
                        raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
        elif item["kind"] == "xls":
            workbook_summary = workbook_reader(body)
            if workbook_summary != item["workbook"]:
                raise ValueError(f"workbook-summary-drift:{item['file']}")
        elif item["kind"] == "json":
            value = json.loads(body)
            for path, expected_value in item.get("checks", {}).items():
                try:
                    actual = at_path(value, path)
                except (KeyError, IndexError, TypeError, ValueError) as error:
                    raise ValueError(f"missing-json-path:{item['file']}:{path}") from error
                if actual != expected_value:
                    raise ValueError(f"json-value-drift:{item['file']}:{path}")
            field_names = {field.get("name") for field in value.get("fields", [])}
            if not set(item.get("field_names", [])).issubset(field_names):
                raise ValueError(f"json-field-drift:{item['file']}")
            if set(item.get("prohibited_field_names", [])).intersection(field_names):
                raise ValueError(f"unexpected-postcode-field:{item['file']}")
        else:
            raise ValueError(f"unsupported-kind:{item['kind']}")
        receipts.append({"file": item["file"], "url": item["url"], "bytes": len(body), "sha256": item["sha256"], "pages": pages})

    return {
        "schemaVersion": "postal-context-bm-source-inspection/v1",
        "countryCode": "BM",
        "exactBodies": receipts,
        "exactBodiesByteAndSha256Bound": len(receipts),
        "exactOfficialBodiesBytes": sum(receipt["bytes"] for receipt in receipts),
        "workbook": workbook_summary,
        "currentAddressingSheetEdition": "4/2026",
        "officialLocationExamplesValidated": 9,
        "currentCompleteAssignmentDenominatorEstablished": False,
        "officialOrRightsClearedPostcodePolygonRecords": 0,
        "featureRowsQueried": 0,
        "rawWorkbookRowsEmitted": 0,
        "productionEligibleRecords": 0,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
