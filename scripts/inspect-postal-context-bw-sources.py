"""Offline, digest-bound Botswana Postal Context source inspector."""

import argparse
import hashlib
import html
import json
import re
from pathlib import Path

import pdfplumber


EXPECTED = [
    {"file":"botswanapost-home.html","url":"https://botswanapost.post/","bytes":112724,"sha256":"8f1dd427e9a490fa409f36123a776188669ed1c1ed264737513283ef16c55f32","kind":"html","encoding":"utf-8","markers":["BotswanaPost is mandated to provide, develop, operate and manage postal services","P.O.Box 100, Gaborone","Copyright © BotswanaPost, 2026"]},
    {"file":"gov-mci.html","url":"https://gov.bw/ministries/ministry-communications-and-innovation","bytes":67677,"sha256":"f3fa02d92f29546b00407c62884008192972236e89626dbdc778b4c55642c608","kind":"html","encoding":"utf-8","markers":["BotswanaPost (BotsPost)","Postal Address: Private Bag 00414, Gaborone, Botswana","Physical address: Westgate Mall, Plot 54690 Gaborone"]},
    {"file":"bwaEn.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bwaEn.pdf","bytes":197674,"sha256":"6409e4792a773e2bfabe6ccd9927e2816420e380873632788a6b9b4868f3e666","kind":"pdf","pages":1,"page_markers":{"0":["Botswana","P.O. Box delivery","P.O. Box 231","Private bag delivery","P/Bag 1061","GABORONE","09/2004"]}},
    {"file":"General-Addressing-Issues.pdf","url":"https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"page_markers":{"3":["Universal DataBase (Sep. 2025)","List of countries which do not require postal codes","Botswana"]}},
    {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93721,"sha256":"66504524b7f19e2ed890c6e1cea0159df1fb0d88bb4729d75af85887b80fca0c","kind":"html","encoding":"utf-8","markers":["without permission in writing from the UPU","Access to databases of the UPU","All rights reserved"]}
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(value):
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


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
            text = normalized(body.decode(item["encoding"], errors="strict"))
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
        "schemaVersion":"postal-context-bw-source-inspection/v1",
        "countryCode":"BW",
        "exactBodies":receipts,
        "exactBodiesByteAndSha256Bound":len(receipts),
        "exactOfficialBodiesBytes":sum(item["bytes"] for item in receipts),
        "currentPostalCodeFormat":"none",
        "upuListsBotswanaAsNotRequiringPostalCodes":True,
        "currentOfficialExamplesUsePoBoxOrPrivateBagAndLocalityWithoutPostcode":True,
        "postalBoxAndPrivateBagAreNonPostcodeObjects":True,
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
