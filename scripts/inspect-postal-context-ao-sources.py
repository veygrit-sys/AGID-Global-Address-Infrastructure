"""Offline, digest-bound Angola Postal Context source inspector."""

import argparse
import hashlib
import html
import json
import re
from pathlib import Path

import pdfplumber


EXPECTED = [
    {"file":"correios-angola-services.html","url":"https://www.correiosdeangola.ao/detalheservicos.aspx?cid=+26","bytes":20569,"sha256":"26b8bb1a3f90c8f866a990f8026deb3f1be71e48216e55b689170521485089e9","kind":"html","markers":["Correios de Angola","Caixa Postal"]},
    {"file":"correios-angola-stations.html","url":"https://correiosdeangola.ao/redebalcoes.aspx","bytes":123520,"sha256":"2c655ac55d2ca046d3f3ffe3f3f5b572ed054f13a791a658bc1211ed832ee07c","kind":"html","markers":["Correios de Angola","Central Postal","Cacuaco"]},
    {"file":"inacom-postal-legislation.html","url":"https://inacom.gov.ao/legislacao-servicos-postais/","bytes":52209,"sha256":"5529eac3ab6235f0ba24c3655bfd69bcd519f5669070d5f68f3a84e72d939cc7","kind":"html","markers":["Legislação","Serviços Postais"]},
    {"file":"upu-aicep-angola.html","url":"https://www.upu.int/en/Universal-Postal-Union/About-UPU/Restricted-Unions/AICEP?cid=25&csid=1","bytes":142964,"sha256":"f1f118c2a56dabeb2282b3a96b9c7652b0e049977cdc08d81a6d547a7c051950","kind":"html","markers":["Angola","Correios de Angola"]},
    {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93717,"sha256":"6b97e98d7a6c5c9111779b9a5e9bf6ba363a396e89b570daeb1a2aa1450e77af","kind":"html","markers":["None of the materials provided on this website may be used, reproduced or transmitted","Access to databases of the UPU"]},
    {"file":"upu-general-addressing-20260820.pdf","url":"https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"page_markers":{"3":["Universal DataBase (Sep. 2025)","List of countries which do not require postal codes","Angola"]}},
    {"file":"upu-angola-addressing-200409.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/agoEn.pdf","bytes":94199,"sha256":"8a85d5bc908767cea0a5816482b8907a4abe3e86073c177060bf7252a9b9309b","kind":"pdf","pages":1,"page_markers":{"0":["Angola","LUANDA","BP 1327","09/2004"]}}
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(text):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", text))).strip()


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {path.name for path in source_dir.iterdir() if path.is_file() and path.suffix.lower() in {".pdf", ".html"}}
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")
    receipts = []
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
        else:
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            with pdfplumber.open(path) as pdf:
                pages = len(pdf.pages)
                if pages != item["pages"]:
                    raise ValueError(f"pdf-page-count:{item['file']}")
                for page_index, markers in item["page_markers"].items():
                    text = normalized(pdf.pages[int(page_index)].extract_text() or "")
                    for marker in markers:
                        if normalized(marker) not in text:
                            raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
        receipts.append({"file":item["file"],"url":item["url"],"bytes":len(body),"sha256":item["sha256"],"pages":pages})
    return {
        "schemaVersion":"postal-context-ao-source-inspection/v1",
        "countryCode":"AO",
        "exactBodies":receipts,
        "exactBodiesByteAndSha256Bound":len(receipts),
        "exactOfficialBodiesBytes":sum(item["bytes"] for item in receipts),
        "currentPostalCodeFormat":"none",
        "upuListsAngolaAsNotRequiringPostalCodes":True,
        "postalBoxIsNonPostcodeObject":True,
        "currentCompletePostalCodeAssignmentsValidated":0,
        "officialPostalGeometryRecords":0,
        "productionEligibleRecords":0,
        "rawSourceRowsEmitted":0
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
