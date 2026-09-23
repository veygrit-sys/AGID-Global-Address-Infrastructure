"""Read-only PHLPost locator profiler. Output counts/digests, never source rows.

HTML snapshot rows are not complete/current assignments, licensed artifacts,
postal polygons or address-building relations. No network or third-party deps.
"""
import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path

MAX_BYTES = 4 * 1024 * 1024
HEADERS = ["Region", "Provinces", "City/Municipality", "Zip Code"]


def digest(data):
    return "sha256:" + hashlib.sha256(data).hexdigest()


def normalized(value):
    return " ".join(unicodedata.normalize("NFC", value).split())


class Locator(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.found = 0
        self.active = False
        self.section = None
        self.row = None
        self.cell = None
        self.headers = []
        self.rows = []
        self.stack = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "table":
            if self.active:
                raise ValueError("nested-table")
            if values.get("id") == "offices":
                self.found += 1
                if self.found != 1:
                    raise ValueError("duplicate-table")
                self.active = True
                self.stack = ["table"]
            else:
                return
        if not self.active:
            return
        if len(values) != len(attrs):
            raise ValueError("duplicate-attribute")
        if ("hidden" in values or values.get("aria-hidden") == "true"
                or re.search(r"display\s*:\s*none|visibility\s*:\s*hidden", values.get("style", ""), re.I)):
            raise ValueError("hidden-table-content")
        if tag == "table":
            return
        if tag in ("thead", "tbody"):
            if self.section or self.row is not None:
                raise ValueError("nested-section")
            self.section = tag
        elif tag == "tr":
            if self.section is None or self.row is not None:
                raise ValueError("row-structure")
            self.row = []
        elif tag in ("th", "td"):
            if (self.row is None or self.cell is not None
                    or tag != ("th" if self.section == "thead" else "td")
                    or any(k in values for k in ("colspan", "rowspan"))):
                raise ValueError("cell-structure")
            self.cell = []
        elif tag == "br" and self.cell is not None:
            self.cell.append(" ")
        elif tag != "span" or self.cell is None:
            raise ValueError("unexpected-table-element")
        if tag != "br":
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if not self.active:
            return
        if tag == "br":
            return
        if not self.stack or self.stack.pop() != tag:
            raise ValueError("mismatched-table-tag")
        if tag in ("td", "th"):
            if self.cell is None or self.row is None:
                raise ValueError("cell-close")
            self.row.append(normalized("".join(self.cell)))
            self.cell = None
        elif tag == "tr":
            if self.row is None or self.cell is not None or len(self.row) != 4:
                raise ValueError("row-width")
            (self.headers if self.section == "thead" else self.rows).append(self.row)
            self.row = None
            if len(self.rows) > 5000:
                raise ValueError("row-limit")
        elif tag in ("thead", "tbody"):
            if self.section != tag or self.row is not None:
                raise ValueError("section-close")
            self.section = None
        elif tag == "table":
            if self.row is not None or self.section is not None:
                raise ValueError("table-close")
            self.active = False
        elif tag not in ("span", "br"):
            raise ValueError("unexpected-table-close")

    def handle_data(self, data):
        if self.active and self.cell is not None:
            if any(ord(c) < 32 and c not in "\t\n\r" for c in data) or "\ufffd" in data:
                raise ValueError("invalid-cell-text")
            self.cell.append(data)
            if sum(map(len, self.cell)) > 512:
                raise ValueError("cell-limit")
        elif self.active and data.strip():
            raise ValueError("text-outside-cell")


def profile_bytes(data, expected_digest=None):
    if not isinstance(data, bytes) or not data or len(data) > MAX_BYTES:
        raise ValueError("byte-limit")
    actual = digest(data)
    if expected_digest is not None and expected_digest != actual:
        raise ValueError("digest-mismatch")
    parser = Locator()
    parser.feed(data.decode("utf-8", errors="strict"))
    parser.close()
    if parser.found != 1 or parser.active or parser.row is not None or parser.headers != [HEADERS]:
        raise ValueError("table-schema")
    if not parser.rows:
        raise ValueError("empty-table")
    populated = [(n, row) for n, row in enumerate(parser.rows, 1) if any(row)]
    valid = [(n, row) for n, row in populated if re.fullmatch(r"[0-9]{4}", row[3])]
    invalid = [(n, row) for n, row in populated if not re.fullmatch(r"[0-9]{4}", row[3])]
    codes = Counter(row[3] for _, row in valid)
    row_counts = Counter(tuple(row) for _, row in populated)
    locality_codes = defaultdict(set)
    for _, row in valid:
        locality_codes[tuple(row[:3])].add(row[3])
    matrix = json.dumps(parser.rows, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return {
        "inputDigest": actual, "inputBytes": len(data), "tableId": "offices", "schema": HEADERS,
        "grain": "published-locator-row-not-administrative-unit-or-unique-postcode",
        "htmlBodyRows": len(parser.rows), "allBlankRows": len(parser.rows) - len(populated),
        "populatedRows": len(populated), "fourDigitRows": len(valid),
        "invalidOrMissingCodeRows": len(invalid),
        "missingFieldsInPopulatedRows": {h: sum(not row[i] for _, row in populated) for i, h in enumerate(HEADERS)},
        "completeFourFieldCandidates": sum(all(row) for _, row in valid),
        "distinctFourDigitCodes": len(codes), "leadingZeroCodeRows": sum(row[3].startswith("0") for _, row in valid),
        "sharedCodeGroups": sum(count > 1 for count in codes.values()),
        "rowsInSharedCodeGroups": sum(count for count in codes.values() if count > 1),
        "exactDuplicateRowGroups": sum(count > 1 for count in row_counts.values()),
        "duplicateRowsBeyondFirst": sum(count - 1 for count in row_counts.values() if count > 1),
        "localityKeysWithMultipleCodes": sum(len(c) > 1 for c in locality_codes.values()),
        "distinctRegionLabels": len({row[0] for _, row in populated if row[0]}),
        "distinctProvinceLabels": len({row[1] for _, row in populated if row[1]}),
        "invalidRows": [{"bodyRow": n, "codeLength": len(row[3]), "missingFieldIndexes": [i for i, v in enumerate(row) if not v],
                         "rowDigest": digest(json.dumps(row, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))} for n, row in invalid],
        "decodedMatrixDigest": digest(matrix),
        "normalization": "HTML entity decoding, NFC, whitespace collapse/trim; codes never padded, cast to numbers, deduplicated or inferred",
        "rowsRepaired": 0, "rowsDeduplicated": 0, "rowsExported": 0,
        "nationalCompleteness": None, "sourceEffectiveDate": None,
        "geometryRecords": 0, "addressBuildingRelations": 0, "countryM2Achieved": False,
    }


if __name__ == "__main__":
    if len(sys.argv) not in (2, 4) or (len(sys.argv) == 4 and sys.argv[2] != "--expected-digest"):
        raise SystemExit("usage: python inspect-postal-context-ph-table.py <html> [--expected-digest sha256:...]")
    path = Path(sys.argv[1])
    if path.stat().st_size > MAX_BYTES:
        raise SystemExit("byte-limit")
    try:
        print(json.dumps(profile_bytes(path.read_bytes(), sys.argv[3] if len(sys.argv) == 4 else None), ensure_ascii=False, indent=2))
    except (ValueError, UnicodeError) as exc:
        raise SystemExit(str(exc)) from None
