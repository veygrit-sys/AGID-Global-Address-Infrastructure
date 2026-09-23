"""Fail-closed inspection of exact Peru Postal Context M2 source bodies."""
import argparse
import hashlib
import html
import json
import re
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET


EXPECTED_SOURCES = [
    {
        "file": "orientation.html",
        "url": "https://www.gob.pe/institucion/mtc/pages/521-conocer-tu-codigo-postal-nacional",
        "bytes": 29353,
        "sha256": "62fed4a093c2397e88824a9f063c554326659b99bb1e2dc11ddd3189e9c976bb",
        "kind": "html",
        "markers": [
            "El código postal se encuentra conformado por cinco números",
            "Último cambio 14 enero 2024",
            "codigopostal.gob.pe/pages/invitado/consulta.jsf",
        ],
    },
    {
        "file": "dataset.html",
        "url": "https://www.datosabiertos.gob.pe/dataset/mtc-codigo-postal-peru",
        "bytes": 30523,
        "sha256": "21d4cc5c498c09fde2346d2b736c508fa8d372e4d5fa5af3ea7730c347b6dbb4",
        "kind": "html",
        "markers": [
            "MTC - CODIGO POSTAL PERU",
            "Open Data Commons Attribution License",
            "2018-03-23",
            "d70d8723-a477-49e0-baf5-3b038be614ee",
            "https://www.datosabiertos.gob.pe/sites/default/files/codigo_postal.xlsx",
            "Public",
        ],
    },
    {
        "file": "resource.html",
        "url": "https://www.datosabiertos.gob.pe/dataset/mtc-codigo-postal-peru/resource/111b6346-7b29-42ca-a7c7-463fe0de1141",
        "bytes": 26184,
        "sha256": "c1dcb8b15e482d5c4dbaddb278b7d79a8e28a7610fdc84588fb7f60462cbf91b",
        "kind": "html",
        "markers": [
            "111b6346-7b29-42ca-a7c7-463fe0de1141",
            "codigo_postal.xlsx",
            "length=4757603",
            "Mar 23, 2018",
        ],
    },
    {
        "file": "codigo_postal.xlsx",
        "url": "https://www.datosabiertos.gob.pe/sites/default/files/codigo_postal.xlsx",
        "bytes": 4757603,
        "sha256": "42864abe006eaa4e79110bfd81d0d6f434571e9fefa8e6c6669b834f692e306a",
        "kind": "xlsx",
    },
    {
        "file": "legal.pdf",
        "url": "https://cdn.www.gob.pe/uploads/document/file/5373186/322604-decreto-supremo-n-007-2011-mtc.pdf?v=1699178401",
        "bytes": 4035048,
        "sha256": "d2034af6aa6194ebb341dfb0165e933c2dc9650ed714a3e0147cc43a33e739ad",
        "kind": "pdf",
    },
    {
        "file": "bulletin-2022.pdf",
        "url": "https://cdn.www.gob.pe/uploads/document/file/5212120/Bolet%C3%ADn%20Estad%C3%ADstico%20del%20Sector%20Postal%20del%20A%C3%B1o%202022.pdf?v=1696049618",
        "bytes": 1959246,
        "sha256": "778753f51c60ce1b0106c8aa8b2d47696969ddbb852e526d95dc57927b223738",
        "kind": "pdf",
    },
    {
        "file": "odc-by-1.0.html",
        "url": "https://opendatacommons.org/licenses/by/1-0/",
        "bytes": 45921,
        "sha256": "7d7e622bbb4b5f21b1c5cb2dd7ce8b1b747ee2c3ab9fc8309c19082e12d13b2d",
        "kind": "html",
        "markers": [
            "Open Data Commons Attribution License (ODC-By) v1.0",
            "subject only to the attribution requirements set out in Section 4",
            "4.2 Notices",
        ],
    },
    {
        "file": "app-wrapper.html",
        "url": "https://sistemas.mtc.gob.pe/aplicaciones/codigo-postal-peru/",
        "bytes": 4546,
        "sha256": "d2bc85bc02ba8847275f797396dbe39c62645129008c9675297d68631e918454",
        "kind": "html",
        "markers": ["Attention Required!", "Sorry, you have been blocked", "Cloudflare Ray ID"],
    },
]

EXPECTED_XLSX = {
    "sheet": "Listado CPN-MTC",
    "headers": [
        "Departamento",
        "Provincia",
        "Distrito",
        "Capital Distrito",
        "Ubigeo Centro Poblado",
        "Centro Poblado / Localidad",
        "Código Postal",
    ],
    "nonemptyDataRows": 98378,
    "postalCodeRows": 98378,
    "fiveDigitRows": 98378,
    "invalidPostalCodeRows": 0,
    "uniquePostalCodes": 2669,
    "uniquePopulatedCentreIds": 97992,
    "sample15082Count": 2,
    "geometryColumns": 0,
    "coordinateColumns": 0,
}

NS_MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def digest(body):
    return hashlib.sha256(body).hexdigest()


def clean_html(value):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def column_index(cell_ref):
    letters = re.match(r"[A-Z]+", cell_ref or "")
    if not letters:
        raise ValueError("xlsx-cell-reference-missing")
    value = 0
    for letter in letters.group(0):
        value = value * 26 + ord(letter) - 64
    return value


def read_shared_strings(archive):
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return ["".join(node.text or "" for node in item.iter(NS_MAIN + "t")) for item in root]


def read_sheet_name(archive):
    root = ET.fromstring(archive.read("xl/workbook.xml"))
    sheets = root.find(NS_MAIN + "sheets")
    if sheets is None or len(sheets) != 1:
        raise ValueError("xlsx-sheet-count-changed-review-required")
    return sheets[0].attrib.get("name")


def cell_value(cell, shared_strings):
    value = cell.find(NS_MAIN + "v")
    if value is None or value.text is None:
        return ""
    if cell.attrib.get("t") == "s":
        return shared_strings[int(value.text)]
    return value.text


def inspect_xlsx(body):
    from io import BytesIO

    try:
        archive = zipfile.ZipFile(BytesIO(body))
        shared_strings = read_shared_strings(archive)
        sheet_name = read_sheet_name(archive)
        rows = []
        for _event, row in ET.iterparse(archive.open("xl/worksheets/sheet1.xml"), events=("end",)):
            if row.tag != NS_MAIN + "row":
                continue
            row_number = int(row.attrib.get("r", "0"))
            values = [""] * 7
            for cell in row.findall(NS_MAIN + "c"):
                index = column_index(cell.attrib.get("r"))
                if 2 <= index <= 8:
                    values[index - 2] = cell_value(cell, shared_strings).strip()
            if row_number >= 2:
                rows.append((row_number, values))
            row.clear()
    except (KeyError, ET.ParseError, zipfile.BadZipFile, ValueError, IndexError) as error:
        raise ValueError("invalid-xlsx-review-required") from error
    if not rows or rows[0][0] != 2:
        raise ValueError("xlsx-header-row-missing")
    headers = rows[0][1]
    data_rows = [values for row_number, values in rows[1:] if row_number >= 3 and any(values)]
    codes = [values[6].zfill(5) for values in data_rows if values[6]]
    populated_centre_ids = {values[4] for values in data_rows if values[4]}
    lower_headers = [header.casefold() for header in headers]
    geometry_columns = sum(any(marker in header for marker in ("geometry", "geometría", "polygon", "polígono", "wkt", "geojson")) for header in lower_headers)
    coordinate_columns = sum(any(marker in header for marker in ("latitude", "latitud", "longitude", "longitud", "coordenada")) for header in lower_headers)
    counts = Counter(codes)
    return {
        "sheet": sheet_name,
        "headers": headers,
        "nonemptyDataRows": len(data_rows),
        "postalCodeRows": len(codes),
        "fiveDigitRows": sum(len(code) == 5 and code.isdigit() for code in codes),
        "invalidPostalCodeRows": sum(not (len(code) == 5 and code.isdigit()) for code in codes),
        "uniquePostalCodes": len(counts),
        "uniquePopulatedCentreIds": len(populated_centre_ids),
        "sample15082Count": counts["15082"],
        "geometryColumns": geometry_columns,
        "coordinateColumns": coordinate_columns,
    }


def inspect_source_dir(source_dir, expected=EXPECTED_SOURCES, expected_xlsx=EXPECTED_XLSX):
    root = Path(source_dir)
    observed = {path.name for path in root.iterdir() if path.is_file()}
    required = {item["file"] for item in expected}
    if observed != required:
        raise ValueError("source-set-mismatch")
    receipts = []
    bodies = {}
    for item in expected:
        body = (root / item["file"]).read_bytes()
        bodies[item["file"]] = body
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError("source-changed-review-required:" + item["file"])
        if item["kind"] == "html":
            text = body.decode("utf-8", errors="strict")
            searchable = text + "\n" + clean_html(text)
            for marker in item.get("markers", []):
                if clean_html(marker).casefold() not in searchable.casefold():
                    raise ValueError("missing-source-marker:" + item["file"] + ":" + marker)
        elif item["kind"] == "pdf" and not body.startswith(b"%PDF-"):
            raise ValueError("invalid-pdf:" + item["file"])
        receipts.append({key: item[key] for key in ("file", "url", "bytes", "sha256")})
    workbook = inspect_xlsx(bodies["codigo_postal.xlsx"])
    if workbook != expected_xlsx:
        raise ValueError("xlsx-schema-or-count-drift-review-required")
    return {
        "schemaVersion": "postal-context-pe-source-inspection/v1",
        "countryCode": "PE",
        "exactBodies": receipts,
        "exactBodiesByteAndSha256Bound": len(receipts),
        "exactOfficialAndLicenceBodiesBytes": sum(item["bytes"] for item in receipts),
        "currentPostcodeSystemConfirmed": True,
        "currentPostcodeFormat": "NNNNN",
        "officialOrientationLastChanged": "2024-01-14",
        "datedOpenDataReleaseDate": "2018-03-23",
        "datedOpenDataLicence": "Open Data Commons Attribution License",
        "datedReleaseReuseRightsEstablishedWithAttribution": True,
        "currentLookupAutomationCachingAndRedistributionRightsEstablished": False,
        "currentLookupFetchStatus": "unavailable_from_review_environment",
        "datedRelease": workbook,
        "publishedBulletinCodeDenominator": 2670,
        "datedReleaseUniqueCodeGapFromBulletin": 2670 - workbook["uniquePostalCodes"],
        "currentCompleteAssignmentValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished": False,
        "currentCompleteImmutablePostalAreaArtifactEstablished": False,
        "officialPostalPolygonOrMultiPolygonRecords": 0,
        "derivedOrVirtualPostalPolygonOrMultiPolygonRecords": 0,
        "productionEligibleRecords": 0,
        "approvedAgidRuntimeArtifacts": 0,
        "rawSourceRowsEmitted": 0,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
