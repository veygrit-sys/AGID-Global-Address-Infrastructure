"""Fail-closed inspection of exact Cayman Islands Postal Context M2 source bodies."""
import argparse
import hashlib
import html
import json
import re
from pathlib import Path
from typing import Any

import pdfplumber

EXPECTED_SOURCES = [
    {"file":"lands-faq.html","url":"https://www.caymanlandinfo.ky/support/frequently-asked-questions","bytes":80761,"sha256":"b17c293a633e219fee66897988b9276f804d56fb9400276fc8d6fc0f1e693dd0","kind":"html","markers":["does not convey any rights to the information","express written permission of the Chief Surveyor"]},
    {"file":"layer-id-public-mapserver.json","url":"https://adapter1.caymanlandinfo.ky/wahost/rest/services/Layer_ID_Public/MapServer?f=pjson","bytes":2562,"sha256":"33d1dbb4d743616701e5e0813be8bdd1dfd10d32d1588464887c62d8e326fb41","kind":"service-json"},
    {"file":"my-egov-cips.html","url":"https://my.egov.ky/web/myegov/w/cayman-islands-postal-service","bytes":143487,"sha256":"efa9302a363c001cee02a8d32d37743ba81d1f2d962c0d991359a70da0f54b08","kind":"html","markers":["Cayman Islands Postal Service","essential service to all businesses and households"]},
    {"file":"postal-amendment-regulations-2025.pdf","url":"https://gov.ky/documents/35692/0/Postal%28Amendment%29Regulations2025_MADE.pdf/995a0241-9552-5741-ffad-792c5d2e8d1a?t=1766524023288","bytes":423736,"sha256":"ba07acdcc43acfc733783859dfa776d1ac2c8840762f54575c7cd3894b9f7488","kind":"pdf","pages":29,"page_markers":{"27":["Postal (Amendment) Regulations, 2025","unique postcode","companies"]}},
    {"file":"street-address-layer.json","url":"https://adapter1.caymanlandinfo.ky/wahost/rest/services/Layer_ID_Public/MapServer/0?f=pjson","bytes":4373,"sha256":"6fbf057d2e5a64498bbf4e18589d69723c284e50f95fefe280a9532202f45ac8","kind":"layer-json"},
    {"file":"upu-cym-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/CYMEn.pdf","bytes":221081,"sha256":"45a913295786802a5087664b2405d8b4a6ee4f15f5d7f4288722817ac6bbb9f8","kind":"pdf","pages":2,"page_markers":{"0":["7 digits separated by a single hyphen","KY1-1100","private letter boxes at post offices","street address is undeliverable","Grand Cayman (island code 1","Cayman Brac (island code 2","Little Cayman (island code 3","KY1-1103","KY1-1600","02/2019"]}},
]
EXPECTED_FIELDS = ["OBJECTID","OBJECTID_1","NUMUNIT","LABEL","FULLNAME","Shape","Shape.STArea()","Shape.STLength()"]

def digest(body: bytes) -> str: return hashlib.sha256(body).hexdigest()
def clean_html(value: str) -> str: return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()

def inspect_source_dir(source_dir: str | Path, expected: list[dict[str, Any]] = EXPECTED_SOURCES) -> dict[str, Any]:
    root = Path(source_dir)
    observed = {path.name for path in root.iterdir() if path.is_file()}
    expected_names = {item["file"] for item in expected}
    if observed != expected_names: raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed)}")
    receipts = []
    service = layer = None
    rights = False
    for item in expected:
        body = (root / item["file"]).read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]: raise ValueError(f"source-changed-review-required:{item['file']}")
        receipt = {key:item[key] for key in ["file","url","bytes","sha256"]}
        if item["kind"] == "pdf":
            if not body.startswith(b"%PDF-"): raise ValueError(f"invalid-pdf:{item['file']}")
            with pdfplumber.open(root / item["file"]) as pdf:
                if len(pdf.pages) != item["pages"]: raise ValueError(f"pdf-page-count-changed:{item['file']}")
                for page_number, markers in item["page_markers"].items():
                    page_text = " ".join((pdf.pages[int(page_number)].extract_text() or "").split())
                    for marker in markers:
                        if marker.casefold() not in page_text.casefold(): raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
            receipt["pages"] = item["pages"]
        elif item["kind"] == "html":
            cleaned = clean_html(body.decode("utf-8"))
            for marker in item.get("markers", []):
                if marker.casefold() not in cleaned.casefold(): raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
            if item["file"] == "lands-faq.html": rights = True
        else:
            value = json.loads(body)
            if item["kind"] == "service-json": service = value
            if item["kind"] == "layer-json": layer = value
        receipts.append(receipt)
    if service is not None:
        layers = service.get("layers", [])
        if len(layers) != 1 or layers[0].get("name") != "Street Address" or layers[0].get("geometryType") != "esriGeometryPolygon" or service.get("tables") != []: raise ValueError("public-gis-layer-schema-changed")
    if layer is not None:
        fields = [field.get("name") for field in layer.get("fields", [])]
        if layer.get("geometryType") != "esriGeometryPolygon" or fields != EXPECTED_FIELDS: raise ValueError("street-address-layer-schema-changed")
        if any(re.search(r"post|zip|mail", field, re.I) for field in fields): raise ValueError("street-address-layer-postcode-field-review-required")
    return {"schemaVersion":"postal-context-ky-source-inspection/v1","countryCode":"KY","exactBodies":receipts,"exactBodiesByteAndSha256Bound":len(receipts),"exactOfficialBodiesBytes":sum(item["bytes"] for item in receipts),"currentPostcodeFormat":"KYN-NNNN","integralCountryPrefix":"KY","upuAddressingSheetEdition":"02/2019","islandCodes":[1,2,3],"privateLetterBoxDeliveryAtPostOffices":True,"streetOnlyMailUndeliverable":True,"uniqueCompanyPostcodesConfirmedBy2025Regulations":True,"landInfoFaqRightsRestrictionRecorded":rights,"streetAddressLayerPostcodeFields":0,"currentCompleteAssignmentAliasValidityExceptionAndExplicitNonAreaDenominatorEstablished":False,"officialPostalGeometryRecords":0,"derivedOrVirtualPostalGeometryRecords":0,"compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished":False,"productionEligibleRecords":0,"rawSourceRowsEmitted":0}

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument("--source-dir", required=True); args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))
if __name__ == "__main__": main()
