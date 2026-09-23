"""Offline, digest-bound Trinidad and Tobago Postal Context source inspector.

Reads exact official public reference bodies from a caller-provided temporary
directory and emits aggregate receipts only. It performs no network request,
address query, source-row output, geometry creation, licence inference or
promotion.
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
        "file": "ttpost-postal-code.html",
        "url": "https://ttpost.net/news/postal-code/",
        "bytes": 215020,
        "sha256": "7f6ab1118d57afe860cafa5ce4f04cf8b9dbf8109dedc28d5f3f59e9a0abba60",
        "kind": "html",
        "markers": [
            "assignment of a six-digit postal code",
            "first two (2) digits",
            "second two (2) digits",
            "final two (2) digits",
            "Postal Code System is completed",
            "postal codes are available for all addresses",
            "WhatsApp messages",
        ],
    },
    {
        "file": "ttpost-system.html",
        "url": "https://ttpost.net/2017/02/27/trinidad-tobago-postal-code-system-tt-pcs-2/",
        "bytes": 199030,
        "sha256": "e2c3dea7457de117d046a1fd031249310c6bf5914a191deecd0ef22647d7e2a8",
        "kind": "html",
        "markers": [
            "small geographic area/point",
            "either a zone or building within the delivery loop",
            "group of addresses",
            "large institutions",
            "postal code and address databases",
        ],
    },
    {
        "file": "upu-trinidad-and-tobago-addressing.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/ttoEn.pdf",
        "bytes": 223139,
        "sha256": "f6a57ec8b37b7e0c6518091c2ee6d13b83b88575f9ad9330e0952a37ca18acdb",
        "kind": "pdf",
        "pages": 2,
        "page_markers": {
            0: ["Six digits after the name of the postal district", "Delivery Point/Zone", "Delivery Route", "PO Box address", "PO BAG 302"],
            1: ["Trinidad and Tobago Postal Corporation", "PIARCO 350462", "05/2014"],
        },
    },
    {
        "file": "upu-general-addressing-issues.pdf",
        "url": "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf",
        "bytes": 631050,
        "sha256": "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d",
        "kind": "pdf",
        "pages": 12,
        "page_markers": {
            1: ["Universal DataBase (Aug. 2026)", "Trinidad and Tobago"],
            6: ["Trinidad and Tobago"],
            10: ["Trinidad and Tobago", "999999 N"],
        },
    },
    {
        "file": "ttpost-postal-code-brochure.pdf",
        "url": "https://ttpost.net/wp-content/uploads/2018/04/Postal_Code_Brochure.pdf",
        "bytes": 1303162,
        "sha256": "82af6872fa67b65e461194f9679116bd012e1451f5857449c9c41e1529e599a7",
        "kind": "image_pdf",
        "pages": 2,
    },
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(text):
    return re.sub(r"\s+", " ", html.unescape(text).replace("’", "'")).strip()


def html_text(text):
    without_scripts = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.IGNORECASE)
    without_styles = re.sub(r"<style[\s\S]*?</style>", " ", without_scripts, flags=re.IGNORECASE)
    return normalized(re.sub(r"<[^>]+>", " ", without_styles))


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {
        path.name
        for path in source_dir.iterdir()
        if path.is_file() and path.suffix.lower() in {".pdf", ".html"}
    }
    if observed_names != expected_names:
        raise ValueError(f"source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed_names)}")

    exact_bodies = []
    for item in expected:
        path = source_dir / item["file"]
        body = path.read_bytes()
        if len(body) != item["bytes"] or digest(body) != item["sha256"]:
            raise ValueError(f"source-changed-review-required:{item['file']}")
        pages = None
        if item["kind"] == "html":
            text = html_text(body.decode("utf-8", errors="strict"))
            for marker in item["markers"]:
                if normalized(marker) not in text:
                    raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
        elif item["kind"] in {"pdf", "image_pdf"}:
            if not body.startswith(b"%PDF-"):
                raise ValueError(f"invalid-pdf:{item['file']}")
            with pdfplumber.open(path) as pdf:
                pages = len(pdf.pages)
                if pages != item["pages"]:
                    raise ValueError(f"pdf-page-count:{item['file']}")
                for page_index, markers in item.get("page_markers", {}).items():
                    text = normalized(pdf.pages[page_index].extract_text() or "")
                    for marker in markers:
                        if normalized(marker) not in text:
                            raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
        else:
            raise ValueError(f"unsupported-kind:{item['kind']}")
        exact_bodies.append({
            "file": item["file"],
            "url": item["url"],
            "bytes": len(body),
            "sha256": item["sha256"],
            "pages": pages,
        })

    return {
        "schemaVersion": "postal-context-tt-source-inspection/v1",
        "countryCode": "TT",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "NNNNNN",
        "upuCurrentDatabaseRequiresPostalCodes": True,
        "upuCurrentLength": 6,
        "ttPostSystemCompletedForAllAddresses": True,
        "mixedAreaAndNonAreaPostalObjectSemantics": True,
        "currentCompletePostalCodeAssignmentsValidated": 0,
        "officialPostalGeometryRecords": 0,
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
