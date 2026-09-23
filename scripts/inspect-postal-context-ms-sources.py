"""Fail-closed inspection of exact Montserrat Postal Context M2 source bodies."""
import argparse
import hashlib
import html
import json
import re
from pathlib import Path
from typing import Any

import pdfplumber

ACTIVE_POSTCODES = ["MSR1110", "MSR1120", "MSR1210", "MSR1230", "MSR1250", "MSR1310", "MSR1330", "MSR1350"]
EXPECTED_SOURCES = [
    {"file":"gov-ms-physical-planning.html","url":"https://www.gov.ms/government/ministries/ministry-of-agriculture-lands-housing-environment/physical-planning-development-services/3/","bytes":246519,"sha256":"60988773cac20c516b5a320827d9b92c845c50106e0898400dd960e3bed62238","kind":"html","markers":["Provision of spatial data and related outputs","Fulfilment of data requests"]},
    {"file":"gov-ms-postal-service.html","url":"https://www.gov.ms/government/ministries/ministry-of-finance-economic-management/montserrat-postal-service/","bytes":233693,"sha256":"a433dacb39c79c485eba5dd6245b634fbc9f84d70b7d28f3c9990539222c96a9","kind":"html","markers":["Montserrat Postal Services","Government Headquarters, Brades, MSR1110"]},
    {"file":"gov-ms-postcode-guide.pdf","url":"https://www.gov.ms/wp-content/uploads/2014/02/Postal-Code-Guide-pamphlet.pdf","bytes":149807,"sha256":"765f50e997018a668d6bdaae15c1a8a62c2898dde231efe3f02d77a258665bbd","kind":"pdf","pages":2,"page_markers":{"0":["Active Postcodes","MSR1110","MSR1120","MSR1210","MSR1230","MSR1250","MSR1310","MSR1330","MSR1350"],"1":["PO Box 140","Brades, MSR1110","Physical Address"]}},
    {"file":"statistics-ms-open-licence.html","url":"https://statistics.gov.ms/terms-and-conditions/open-licence-agreement/","bytes":118341,"sha256":"0ef3bfadde036b8ce0ba2d321e2c7964873de77652bf303ae83f8fbf771a93f1","kind":"html","markers":["limited solely to the Statistics Department of Montserrat data","shall not extend to any third party data"]},
    {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93715,"sha256":"eb9ef8eca7b2d65e2c735a37078defb348a7f23b5e768ee910ad9e582d3d9a81","kind":"html","markers":["without permission in writing from the UPU","Access to databases of the UPU"]},
    {"file":"upu-msr-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/msrEn.pdf","bytes":149097,"sha256":"984746c0eba80ea4247949c38f37051794a8039bbd6e773f72d9689eb2dd8e42","kind":"pdf","pages":1,"page_markers":{"0":["4 digits to the right of the locality preceded by the country code MSR","MSR 1 1 1 0","06/2026"]}},
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
    guide_codes: set[str] = set()
    statistics_scope_limit = False
    planning_request_path = False
    upu_rights_restriction = False
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
                all_text = []
                for page_number, markers in item["page_markers"].items():
                    page_text = " ".join((pdf.pages[int(page_number)].extract_text() or "").split())
                    all_text.append(page_text)
                    for marker in markers:
                        if marker.casefold() not in page_text.casefold():
                            raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
                if item["file"] == "gov-ms-postcode-guide.pdf":
                    joined = " ".join(all_text)
                    guide_codes = {code for code in ACTIVE_POSTCODES if code in joined}
            receipt["pages"] = item["pages"]
        else:
            cleaned = clean_html(body.decode("utf-8", errors="strict"))
            for marker in item.get("markers", []):
                if marker.casefold() not in cleaned.casefold():
                    raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
            if item["file"] == "statistics-ms-open-licence.html": statistics_scope_limit = True
            if item["file"] == "gov-ms-physical-planning.html": planning_request_path = True
            if item["file"] == "upu-copyright.html": upu_rights_restriction = True
        receipts.append(receipt)
    if any(item["file"] == "gov-ms-postcode-guide.pdf" for item in expected) and guide_codes != set(ACTIVE_POSTCODES):
        raise ValueError("active-postcode-set-changed-review-required")
    return {
        "schemaVersion":"postal-context-ms-source-inspection/v1",
        "countryCode":"MS",
        "exactBodies":receipts,
        "exactBodiesByteAndSha256Bound":len(receipts),
        "exactOfficialBodiesBytes":sum(item["bytes"] for item in receipts),
        "currentPostcodeFormat":"MSR9999",
        "integralCountryPrefix":"MSR",
        "upuAddressingSheetEdition":"06/2026",
        "observedGuidePostcodes":sorted(guide_codes),
        "observedGuidePostcodeSetSha256":hashlib.sha256("\n".join(sorted(guide_codes)).encode()).hexdigest(),
        "currentPostcodeSystemConfirmed":True,
        "currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished":False,
        "statisticsDepartmentOpenLicenceScopeLimitRecorded":statistics_scope_limit,
        "officialSpatialDataRequestPathRecorded":planning_request_path,
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
