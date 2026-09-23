"""Offline, digest-bound Burkina Faso Postal Context source inspector."""

import argparse
import hashlib
import html
import json
import re
from pathlib import Path

import pdfplumber


EXPECTED = [
    {"file":"laposte-code-postal.html","url":"https://laposte.bf/code-postal/","bytes":204855,"sha256":"298ea50e6672451e0360e43283302d7e9a2080bbf708cf716aea0e73714a5472","kind":"html","markers":["Code postal","Code postal de l’agence/ centre détenteur de la BP","tous droits réservés"]},
    {"file":"laposte-faq-difference.html","url":"https://laposte.bf/sp_faq/faq-c_005-quelle-est-la-difference-entre-le-code-postal-et-le-numero-de-la-boite-postale/","bytes":148561,"sha256":"0f981e6de2ebf0d1132075b6fc46dcc873dbb6bd4795456d98abbb5dce75d2ba","kind":"html","markers":["Le code postal est un numéro généralement à 5 chiffres","La boite postale est un domicile"]},
    {"file":"laposte-code-postal-script1.js","url":"https://laposte.bf/codespostaux/js/script1.js","bytes":1187,"sha256":"132ebcb7364bb5bd6c5ab803af8b8178b83ec372ddc4779a8cc1967a9ffdaade","kind":"javascript","markers":["search_ville.php?Loc=","search_cdpt.php?Loc="]},
    {"file":"search-codes-ouagadougou.html","url":"https://laposte.bf/codespostaux/admin/search_cdpt.php?Loc=Ouagadougou","bytes":5932,"sha256":"6d6d356ab842cd7d5da889bc43a0c7d0871daa6a8dc5fedbd92ed99616280e60","kind":"html","markers":["OUAGADOUGOU","10000","CISSIN","10010","10050","Agences"]},
    {"file":"search-villes-10000.html","url":"https://laposte.bf/codespostaux/admin/search_ville.php?Loc=10000","bytes":1359,"sha256":"f6f02d8d51bee15a34b82477c755b940343e47bd8dc0ad191a53946bb87f2797","kind":"html","markers":["OUAGADOUGOU","10000","DAPOYA","Liste quartiers"]},
    {"file":"search-villes-10010.html","url":"https://laposte.bf/codespostaux/admin/search_ville.php?Loc=10010","bytes":498,"sha256":"0708e7fe53fff7983d58143d253487718cf6afe60b9464732f42c1a035d6ac86","kind":"html","markers":["OUAGADOUGOU","CISSIN","10010","OUAGA 2000"]},
    {"file":"upu-bfa-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bfaEn.pdf","bytes":214668,"sha256":"2f74e36fe7f03af1b18fe408be3a964ae119ba2bb731fb1a5e70ce14060d699f","kind":"pdf","pages":1,"page_markers":{"0":["Burkina Faso","5 digits to the left of the locality name","10010 OUAGADOUGOU","BP 6000 OUAGA CNT","12/2021"]}},
    {"file":"upu-general-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"page_markers":{"3":["Universal DataBase (Sep. 2025)","List of countries which do not require postal codes","Burkina Faso"]}},
    {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93723,"sha256":"efc3fbd9cf87f8648a706e822af3185a2a94178817743935018327e755c273a2","kind":"html","markers":["None of the materials provided on this website may be used, reproduced or transmitted","Access to databases of the UPU"]},
    {"file":"igb-administrative-maps.html","url":"https://www.igb.bf/les-cartes-administratives/","bytes":62702,"sha256":"9fc2cb2ec152b3dd0cf1ce665eb35d648cfa0a5ea82b0f6a6d15e32b346fbf5f","kind":"html","markers":["Institut Géographique du Burkina","Les cartes Administratives","Les cartes des Communes sont également disponibles"]}
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(text):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", text))).strip()


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    allowed = {".pdf", ".html", ".js"}
    observed_names = {path.name for path in source_dir.iterdir() if path.is_file() and path.suffix.lower() in allowed and not path.name.startswith("search-codes-bama") and not path.name.startswith("search-codes-tenkodogo")}
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")
    receipts = []
    for item in expected:
        path = source_dir / item["file"]
        body = path.read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError(f"source-changed-review-required:{item['file']}")
        pages = None
        if item["kind"] in {"html", "javascript"}:
            text = normalized(body.decode("utf-8", errors="strict"))
            for marker in item["markers"]:
                if normalized(marker) not in text:
                    raise ValueError(f"missing-text-marker:{item['file']}:{marker}")
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
        "schemaVersion":"postal-context-bf-source-inspection/v1",
        "countryCode":"BF",
        "exactBodies":receipts,
        "exactBodiesByteAndSha256Bound":len(receipts),
        "exactOfficialBodiesBytes":sum(item["bytes"] for item in receipts),
        "currentPostalCodeFormat":"NNNNN",
        "currentPostalSystemConfirmed":True,
        "representativeCommuneCode":"10000",
        "representativeQuarterCode":"10010",
        "communeQuarterAndAgencyObjectsKeptDistinct":True,
        "postalBoxIsNonPostcodeObject":True,
        "completeAssignmentDenominatorEstablished":False,
        "compatibleRedistributionRightsEstablished":False,
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
