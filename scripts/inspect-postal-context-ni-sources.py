"""Fail-closed inspection of exact Nicaragua Postal Context M2 source bodies."""
import argparse
import hashlib
import html
import json
import re
from pathlib import Path
from typing import Any

import pdfplumber

EXPECTED_SOURCES = [
    {"file":"correos-ni-postcode-browser.html","url":"https://www.correos.gob.ni/codigo-postal/","bytes":27385,"sha256":"450686e51ff025ef783072b9fd35d3f51cd6db5a2d533b02b604167f6de00a84","kind":"html","markers":["Un momento","Verificación de seguridad en curso","www.correos.gob.ni"],"cloudflare_challenge":True},
    {"file":"correos-ni-postcode-12012-browser.html","url":"https://www.correos.gob.ni/postalcode/PostalCodes.php?operation=view&pk0=12012","bytes":27569,"sha256":"b682fec22806d60fc1bd80bec10345007dc02aeb6a7f99d3a0107dc4750c6bd7","kind":"html","markers":["Un momento","Verificación de seguridad en curso","www.correos.gob.ni"],"cloudflare_challenge":True},
    {"file":"ineter-ni-geoservices.html","url":"https://www.ineter.gob.ni/geoportales/geoservicios/","bytes":82568,"sha256":"6795fefa0493e986a473a20df50d4ebbb0919fbaa9ca427c5c0a3b43d113dd7f","kind":"html","markers":["Infraestructura de Datos Espaciales del Instituto Nicaragüense de Estudios Territoriales","WMS","WFS"],"spatial_catalog":True},
    {"file":"ineter-ni-limits.html","url":"https://www.ineter.gob.ni/geoportales/limites-politicos-administrativos/","bytes":35388,"sha256":"b9b5336015d0fff87be11705b88bf83db53f2d11a1c9a5aff26151f186895866","kind":"html","markers":["Límite Municipal","Lim_Municipal","Servicio WMS/WFS"],"spatial_catalog":True},
    {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93719,"sha256":"618993f28467ce9486c309ce7a0997d70c7a85f131c873ae788be98ec53f23ff","kind":"html","markers":["without permission in writing from the UPU","Access to databases of the UPU"],"upu_rights":True},
    {"file":"upu-general-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"page_markers":{"1":["Universal DataBase (Aug. 2026)","List of countries which require postal codes","Nicaragua"],"9":["Nicaragua","99999","N"]}},
    {"file":"upu-ni-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/nicEn.pdf","bytes":126484,"sha256":"9a714a3219f8b2dc01f62e66ed90f3eb6745d11a63d1e5d1806626ff84ef5013","kind":"pdf","pages":1,"page_markers":{"0":["5 digits on the line before the municipality name","12005","11147","05/2014"]}},
]

def digest(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()

def clean_html(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()

def inspect_source_dir(source_dir: str | Path, expected: list[dict[str, Any]] = EXPECTED_SOURCES) -> dict[str, Any]:
    root = Path(source_dir)
    observed = {path.name for path in root.iterdir() if path.is_file()}
    expected_names = {item["file"] for item in expected}
    if observed != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed)}")
    receipts = []
    challenge_bodies = 0
    spatial_catalog_bodies = 0
    spatial_postal_terms = 0
    upu_rights_restriction = False
    current_system = False
    numeric_five = False
    sheet_edition = None
    for item in expected:
        body = (root / item["file"]).read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError(f"source-changed-review-required:{item['file']}")
        receipt = {key:item[key] for key in ["file", "url", "bytes", "sha256"]}
        if item["kind"] == "pdf":
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            with pdfplumber.open(root / item["file"]) as pdf:
                if len(pdf.pages) != item["pages"]:
                    raise ValueError(f"pdf-page-count-changed:{item['file']}")
                for page_number, markers in item["page_markers"].items():
                    page_text = " ".join((pdf.pages[int(page_number)].extract_text() or "").split())
                    for marker in markers:
                        if marker.casefold() not in page_text.casefold():
                            raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
                    if item["file"] == "upu-general-addressing.pdf" and int(page_number) == 1:
                        current_system = True
                    if item["file"] == "upu-general-addressing.pdf" and int(page_number) == 9:
                        numeric_five = bool(re.search(r"Nicaragua\s+99999\s+N(?:\s|$)", page_text))
                    if item["file"] == "upu-ni-addressing.pdf":
                        sheet_edition = "05/2014"
            receipt["pages"] = item["pages"]
        else:
            cleaned = clean_html(body.decode("utf-8", errors="strict"))
            for marker in item.get("markers", []):
                if marker.casefold() not in cleaned.casefold():
                    raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
            if item.get("cloudflare_challenge"):
                challenge_bodies += 1
            if item.get("spatial_catalog"):
                spatial_catalog_bodies += 1
                spatial_postal_terms += len(re.findall(r"postal|postcode|c[oó]digo\s+postal", cleaned, flags=re.IGNORECASE))
            if item.get("upu_rights"):
                upu_rights_restriction = True
        receipts.append(receipt)
    if any(item["file"] == "upu-general-addressing.pdf" for item in expected) and not numeric_five:
        raise ValueError("current-five-digit-numeric-format-changed-review-required")
    return {
        "schemaVersion":"postal-context-ni-source-inspection/v1",
        "countryCode":"NI",
        "exactBodies":receipts,
        "exactBodiesByteAndSha256Bound":len(receipts),
        "exactOfficialBodiesBytes":sum(item["bytes"] for item in receipts),
        "currentPostcodeFormat":"NNNNN",
        "upuGeneralAddressingEdition":"08/2026",
        "upuAddressingSheetEdition":sheet_edition,
        "currentPostcodeSystemConfirmed":current_system,
        "numericFiveDigitFormatConfirmed":numeric_five,
        "correosCurrentContentRetrieved":False,
        "correosCloudflareChallengeBodies":challenge_bodies,
        "currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished":False,
        "reviewedIneterSpatialCatalogBodies":spatial_catalog_bodies,
        "reviewedIneterPostalTermMatches":spatial_postal_terms,
        "upuCopyrightAndDatabaseRestrictionsRecorded":upu_rights_restriction,
        "compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished":False,
        "officialPostalPolygonOrMultiPolygonRecords":0,
        "derivedOrVirtualPostalPolygonOrMultiPolygonRecords":0,
        "productionEligibleRecords":0,
        "approvedAgidRuntimeArtifacts":0,
        "rawSourceRowsEmitted":0,
    }

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
