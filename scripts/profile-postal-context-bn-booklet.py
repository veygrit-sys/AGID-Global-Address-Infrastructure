"""Read-only quality preflight; emit aggregates, never postcode/name rows."""
import argparse
from collections import Counter
from hashlib import sha256
from io import BytesIO
import json
import re
import sys

MAX_BYTES = 4 * 1024 * 1024
PINNED_DIGEST = "sha256:5eb322ea0928503fd78d4d05ba32e3844e8e66578b04d3cc67a2b416ad4d866a"
HEADERS = {"JABATAN-JABATAN KERAJAAN": "government-organization", "NAMA KAMPONG": "locality", "NAMA CAWANGAN": "postal-branch"}
CODE = re.compile(r"[BKPT][A-Z][0-9]{4}\Z")


def cell(value):
    if value is None:
        return ""
    if not isinstance(value, str) or len(value) > 4096:
        raise ValueError("bn-cell-schema")
    return " ".join(value.split())


def profile_tables(pages):
    """Pages contain extracted tables. Do not repair, split, join or infer rows."""
    if not isinstance(pages, list) or not 1 <= len(pages) <= 60:
        raise ValueError("bn-page-limit")
    groups = {}
    page_counts = []
    total_tables = 0
    for page_no, tables in enumerate(pages, 1):
        if not isinstance(tables, list) or len(tables) > 8:
            raise ValueError("bn-table-limit")
        per_page = Counter()
        for table in tables:
            total_tables += 1
            if not isinstance(table, list) or not 1 <= len(table) <= 100 or any(not isinstance(r, list) or len(r) != 3 for r in table):
                raise ValueError("bn-table-schema")
            header = [cell(v) for v in table[0]]
            if header == ["BIL", "Daerah", "KOD"]:
                if [[cell(v) for v in r] for r in table[1:]] != [["1.", "Daerah Brunei Muara", "B"], ["2.", "Daerah Belait", "K"], ["3.", "Daerah Tutong", "T"], ["4.", "Daerah Temburong", "P"]]:
                    raise ValueError("bn-district-table-changed")
                continue
            if header[0] != "BIL" or header[2] != "POSKOD" or header[1] not in HEADERS:
                raise ValueError("bn-unknown-table-header")
            kind = HEADERS[header[1]]
            g = groups.setdefault(kind, {"tables": 0, "rows": 0, "blankStructuralRows": 0, "missingNameRows": 0, "missingPostcodeRows": 0, "invalidPostcodeRows": 0, "invalidSerialRows": 0, "serialSequenceMismatches": 0, "multiCodeCells": 0, "multilineNameCells": 0, "codes": Counter(), "names": Counter(), "pairs": Counter(), "prefix": Counter()})
            g["tables"] += 1
            ordinal = 0
            for raw in table[1:]:
                serial, name, code = map(cell, raw)
                if not any((serial, name, code)):
                    g["blankStructuralRows"] += 1
                    continue
                ordinal += 1
                per_page[kind] += 1
                g["rows"] += 1
                if not name:
                    g["missingNameRows"] += 1
                else:
                    g["names"][name.casefold()] += 1
                if raw[1] and "\n" in raw[1]:
                    g["multilineNameCells"] += 1
                if not re.fullmatch(r"[0-9]+", serial):
                    g["invalidSerialRows"] += 1
                elif int(serial) != ordinal:
                    g["serialSequenceMismatches"] += 1
                if not code:
                    g["missingPostcodeRows"] += 1
                elif not CODE.fullmatch(code):
                    g["invalidPostcodeRows"] += 1
                    if len(re.findall(r"\b[BKPT][A-Z][0-9]{4}\b", code)) > 1:
                        g["multiCodeCells"] += 1
                else:
                    g["codes"][code] += 1
                    g["prefix"][code[0]] += 1
                g["pairs"][(name.casefold(), code)] += 1
        if per_page:
            page_counts.append({"pdfPage": page_no, "rowsByKind": dict(per_page)})
    result = {}
    code_sets = {}
    for kind, g in groups.items():
        code_sets[kind] = set(g["codes"])
        repeated = [n for n in g["codes"].values() if n > 1]
        result[kind] = {k: v for k, v in g.items() if k not in ("codes", "names", "pairs", "prefix")}
        result[kind].update(distinctPostcodes=len(g["codes"]), repeatedPostcodeGroups=len(repeated), rowsInRepeatedPostcodeGroups=sum(repeated), distinctNormalizedNames=len(g["names"]), duplicateNameCodeRows=sum(n - 1 for n in g["pairs"].values()), districtPrefixCounts=dict(sorted(g["prefix"].items())))
    return {"extractedTables": total_tables, "groups": result, "pageCounts": page_counts, "allKindsDistinctPostcodes": len(set().union(*code_sets.values())) if code_sets else 0, "codeIsStableRowId": False, "serialIsStableRowId": False, "currentNationalCoverageEstablished": False, "exactCivicOrBuildingRelations": 0, "postalPolygons": 0, "rowsExported": 0}


def inspect_pdf(data):
    import pdfplumber
    digest = "sha256:" + sha256(data).hexdigest()
    if len(data) > MAX_BYTES or not data.startswith(b"%PDF-"):
        raise ValueError("bn-pdf-size-or-magic")
    if digest != PINNED_DIGEST:
        raise ValueError("bn-unreviewed-pdf-digest")
    with pdfplumber.open(BytesIO(data)) as pdf:
        if len(pdf.pages) != 52:
            raise ValueError("bn-booklet-page-count")
        result = profile_tables([p.extract_tables() for p in pdf.pages])
        result.update(sourceDigest=digest, byteLength=len(data), pdfPages=len(pdf.pages), extractor={"name": "pdfplumber", "version": pdfplumber.__version__, "settings": "default ruled-table extraction; whitespace-only cell normalization"}, documentTitle=pdf.metadata.get("Title"), pdfCreationDate=pdf.metadata.get("CreationDate"), pdfModificationDate=pdf.metadata.get("ModDate"), currentAssignmentEdition=None, mirrorEqualsUnavailableOriginal="not-verified", geometryType="none")
        return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stdin", action="store_true", required=True)
    parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    data = sys.stdin.buffer.read(MAX_BYTES + 1)
    print(json.dumps(inspect_pdf(data), ensure_ascii=True, sort_keys=True))
