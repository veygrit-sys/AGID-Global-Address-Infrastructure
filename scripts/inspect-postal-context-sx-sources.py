"""Offline, digest-bound Sint Maarten Postal Context source inspector.

Reads exact official bodies from a caller-provided temporary directory and
emits aggregate receipts only. It performs no network request, address lookup,
source-row output, geometry creation, licence inference or promotion.
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
        "file": "upu-general-addressing-issues.pdf",
        "url": "https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf",
        "bytes": 631050,
        "sha256": "ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d",
        "kind": "pdf",
        "pages": 12,
        "page_markers": {3: ["Universal DataBase (Sep. 2025)", "List of countries which do not require postal codes", "Sint Maarten (Dutch part)"]},
    },
    {
        "file": "upu-sint-maarten-addressing.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/sxmEn.pdf",
        "bytes": 87688,
        "sha256": "626d5fdf025965722eee53fa8fe6ba9bc66773b63ccf37e1f21196ff3b2f768f",
        "kind": "pdf",
        "pages": 1,
        "page_markers": {0: ["Sint Maarten (Dutch part)", "SXM", "Since 16 May 2011", "Postal Services Sint Maarten (PSS)", "11/2011"]},
    },
    {
        "file": "upu-designated-operators-2025-es.pdf",
        "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/statusOfPostalEntities/20250312dPRMAnListOfEntitiesES.pdf",
        "bytes": 321314,
        "sha256": "f75ce24cd8fa32ed0751078029987e2d5c4b257c3527a27388c7f5b364aa3dfb",
        "kind": "pdf",
        "pages": 21,
        "page_markers": {1: ["S. Maarten", "Postal Services Sint Maarten (PSS)"]},
    },
    {
        "file": "btp-post.html",
        "url": "https://btp.sx/post.html",
        "bytes": 31285,
        "sha256": "d92a660af0c4688bcf5254f3438572bfc2053cbbbf6c2d8f133226eb44992432",
        "kind": "html",
        "markers": ["Postal services regulations", "Ministerial decree concession PSS", "Last update: Aug 13, 2018"],
    },
    {
        "file": "government-pss-news-2024.html",
        "url": "https://www.sintmaartengov.org/news/pages/Civil-Registry-Delivers-Voting-Cards-to-Post-Office-for-Upcoming-Election.aspx",
        "bytes": 45538,
        "sha256": "1eb1155b091a1a0790ef940570683d408510ba627b70b232bc2816f2b1a91ffb",
        "kind": "html",
        "markers": ["7/17/2024", "Postal Services Sint Maarten (PSS NV)", "The Post Office will be responsible"],
    },
]


def digest(body):
    return hashlib.sha256(body).hexdigest()


def normalized(text):
    return re.sub(r"\s+", " ", html.unescape(text).replace("’", "'")).strip()


def inspect_source_dir(source_dir, expected=EXPECTED):
    source_dir = Path(source_dir)
    expected_names = {item["file"] for item in expected}
    observed_names = {path.name for path in source_dir.iterdir() if path.is_file() and path.suffix.lower() in {".pdf", ".html"}}
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
        else:
            raise ValueError(f"unsupported-kind:{item['kind']}")
        receipt = {"file": item["file"], "url": item["url"], "bytes": len(body), "sha256": item["sha256"]}
        if pages is not None:
            receipt["pages"] = pages
        exact_bodies.append(receipt)
    return {
        "schemaVersion": "postal-context-sx-source-inspection/v1",
        "countryCode": "SX",
        "exactBodies": exact_bodies,
        "exactBodiesByteAndSha256Bound": len(exact_bodies),
        "exactOfficialBodiesBytes": sum(item["bytes"] for item in exact_bodies),
        "currentPostalCodeFormat": "none",
        "upuListsSintMaartenAsNotRequiringPostalCodes": True,
        "designatedOperator": "Postal Services Sint Maarten (PSS)",
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