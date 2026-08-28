"""Read-only Pakistan Post HTML profiler: aggregate evidence, never a data pack.

Office, account-office and attached-branch columns retain their source roles.
Counts describe this snapshot, not completeness, current validity or permission.
"""
import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

MAX_BYTES = 4 * 1024 * 1024
HEADERS = {
    "dpo": ["DELIVERY POST OFFICES", "POST CODE", "ACCOUNT OFFICE", "PROVINCE", "POST CODE OF ATTACHED BRANCH OFFICES"],
    "ndpo": ["NON DELIVERY POST OFFICES", "POST CODE", "ACCOUNT OFFICE", "PROVINCE"],
}


def digest(data):
    return "sha256:" + hashlib.sha256(data).hexdigest()


def matrix_digest(rows):
    return digest(json.dumps(rows, ensure_ascii=False, separators=(",", ":")).encode("utf8"))


def normalized(value):
    return " ".join(unicodedata.normalize("NFC", value).split())


class Directory(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = {}
        self.active = self.section = self.row = self.cell = None
        self.stack = []
        self.optional_end_tags = Counter()

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "table":
            if self.active:
                raise ValueError("nested-table")
            target = values.get("id")
            if target not in HEADERS:
                return
            if target in self.tables:
                raise ValueError("duplicate-table")
            self.tables[target] = {"thead": [], "tbody": [], "tfoot": []}
            self.active = target
        if self.active is None:
            return
        if len(values) != len(attrs):
            raise ValueError("duplicate-attribute")
        if ("hidden" in values or values.get("aria-hidden", "").lower() == "true"
                or re.search(r"display\s*:\s*none|visibility\s*:\s*hidden", values.get("style", ""), re.I)):
            raise ValueError("hidden-content")
        if tag == "table":
            pass
        elif tag in ("thead", "tbody", "tfoot"):
            if self.stack != ["table"] or self.section:
                raise ValueError("section-structure")
            self.section = tag
        elif tag == "tr":
            if not self.section or self.row is not None or self.stack[-1] != self.section:
                raise ValueError("row-structure")
            self.row = []
        elif tag in ("td", "th"):
            if self.row is None or self.cell is not None or self.stack[-1] != "tr" or any(k in values for k in ("rowspan", "colspan")):
                raise ValueError("cell-structure")
            self.cell = []
        elif tag in ("strong", "p", "span", "br") and self.cell is not None:
            if tag in ("p", "br"):
                self.cell.append(" ")
        else:
            raise ValueError("unexpected-table-element")
        if tag != "br":
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if self.active is None or tag == "br":
            return
        # HTML permits omission of these two end tags; never repair cells or fields.
        if tag in ("td", "th") and self.stack and self.stack[-1] == "p":
            self.stack.pop()
            self.optional_end_tags["p"] += 1
        if tag == "table" and self.stack == ["table", "tbody"]:
            self.stack.pop()
            self.section = None
            self.optional_end_tags["tbody"] += 1
        if not self.stack or self.stack.pop() != tag:
            raise ValueError("mismatched-tag")
        if tag in ("td", "th"):
            self.row.append(normalized("".join(self.cell)))
            self.cell = None
        elif tag == "tr":
            if self.cell is not None or len(self.row) != len(HEADERS[self.active]):
                raise ValueError("row-width")
            self.tables[self.active][self.section].append(self.row)
            if sum(map(len, self.tables[self.active].values())) > 6000:
                raise ValueError("row-limit")
            self.row = None
        elif tag in ("thead", "tbody", "tfoot"):
            self.section = None
        elif tag == "table":
            self.active = None
        elif tag == "p":
            self.cell.append(" ")

    def handle_data(self, data):
        if self.active is None:
            return
        if self.cell is None:
            if data.strip():
                raise ValueError("text-outside-cell")
            return
        if "\ufffd" in data or any(ord(c) < 32 and c not in "\t\r\n" for c in data):
            raise ValueError("invalid-cell-text")
        self.cell.append(data)
        if sum(map(len, self.cell)) > 512:
            raise ValueError("cell-limit")


def profile_bytes(data, expected_digest=None):
    if not isinstance(data, bytes) or not data or len(data) > MAX_BYTES:
        raise ValueError("byte-limit")
    if expected_digest is not None and digest(data) != expected_digest:
        raise ValueError("digest-mismatch")
    parser = Directory()
    parser.feed(data.decode("utf8", errors="strict"))
    parser.close()
    if set(parser.tables) != set(HEADERS) or parser.active or parser.stack:
        raise ValueError("table-set")
    results, code_sets = {}, {}
    for table_id, sections in parser.tables.items():
        header = HEADERS[table_id]
        if sections["thead"] != [header] or sections["tfoot"] not in ([], [header]):
            raise ValueError("header-schema")
        rows = sections["tbody"]
        if not rows:
            raise ValueError("empty-table")
        repeated = sum(row == header for row in rows)
        populated = [(i, row) for i, row in enumerate(rows, 1) if any(row) and row != header]
        valid = [(i, row) for i, row in populated if re.fullmatch(r"[0-9]{5}", row[1])]
        invalid = [(i, row) for i, row in populated if not re.fullmatch(r"[0-9]{5}", row[1])]
        codes, tuples = Counter(row[1] for _, row in valid), Counter(tuple(row) for _, row in populated)
        code_sets[table_id] = set(codes)
        results[table_id] = {
            "assignmentClass": "delivery_post_office" if table_id == "dpo" else "non_delivery_post_office",
            "schema": header, "bodyRows": len(rows), "repeatedHeaderRows": repeated,
            "footerHeaderRows": len(sections["tfoot"]), "allBlankRows": sum(not any(row) for row in rows),
            "populatedRows": len(populated), "fiveDigitRows": len(valid), "invalidCodeRows": len(invalid),
            "leadingZeroRows": sum(row[1].startswith("0") for _, row in valid),
            "nonLeadingZeroRows": sum(not row[1].startswith("0") for _, row in valid),
            "distinctFiveDigitCodes": len(codes), "sharedCodeGroups": sum(n > 1 for n in codes.values()),
            "rowsInSharedCodeGroups": sum(n for n in codes.values() if n > 1),
            "exactDuplicateGroups": sum(n > 1 for n in tuples.values()),
            "duplicateRowsBeyondFirst": sum(n - 1 for n in tuples.values() if n > 1),
            "missingFields": {h: sum(not row[i] for _, row in populated) for i, h in enumerate(header)},
            "invalidRows": [{"bodyRow": i, "codeLength": len(row[1]), "rowDigest": matrix_digest(row)} for i, row in invalid],
            "decodedMatrixDigest": matrix_digest(rows),
        }
        if table_id == "dpo":
            results[table_id]["attachedBranchCode"] = {
                "fiveDigitRows": sum(bool(re.fullmatch(r"[0-9]{5}", row[4])) for _, row in populated),
                "missingRows": sum(not row[4] for _, row in populated),
                "invalidNonemptyRows": sum(bool(row[4]) and not bool(re.fullmatch(r"[0-9]{5}", row[4])) for _, row in populated),
                "sameAsOfficeCodeRows": sum(bool(row[4]) and row[4] == row[1] for _, row in populated),
                "generatedByArithmetic": False,
            }
    return {
        "inputDigest": digest(data), "inputBytes": len(data), "tables": results,
        "optionalHtmlEndTags": dict(parser.optional_end_tags),
        "crossClassSharedCodes": len(code_sets["dpo"] & code_sets["ndpo"]),
        "grain": "source-row-with-explicit-office-class-not-unique-code-or-geographical-area",
        "normalization": "HTML entity decoding, NFC, whitespace collapse; no numeric conversion, padding, deduplication or office-label merging",
        "rowsExported": 0, "rowsRepaired": 0, "rowsDeduplicated": 0, "amendmentsApplied": 0,
        "nationalCompleteness": None, "sourceEffectiveDate": None,
        "productionGeometryRecords": 0, "addressBuildingRelations": 0, "countryM2Achieved": False,
    }


if __name__ == "__main__":
    if len(sys.argv) not in (2, 4) or (len(sys.argv) == 4 and sys.argv[2] != "--expected-digest"):
        raise SystemExit("usage: python inspect-postal-context-pk-directory.py <html> [--expected-digest sha256:...]")
    path = Path(sys.argv[1])
    if path.stat().st_size > MAX_BYTES:
        raise SystemExit("byte-limit")
    try:
        print(json.dumps(profile_bytes(path.read_bytes(), sys.argv[3] if len(sys.argv) == 4 else None), ensure_ascii=False, indent=2))
    except (ValueError, UnicodeError) as exc:
        raise SystemExit(str(exc)) from None
