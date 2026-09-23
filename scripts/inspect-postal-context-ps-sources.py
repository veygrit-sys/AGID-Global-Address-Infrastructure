"""Offline, hash-bound PS source review. Outputs aggregates, never source rows.

No geometry creation, network requests, licence inference or M2 promotion.
Only complete successful responses may be supplied as source bodies.
"""
import argparse
import collections
import csv
import datetime
import hashlib
import io
import json
from pathlib import Path
import re

HEADER = ["Postcode_P3", "District_en", "District_ar", "TownName_ar", "TownName_en", "Coverage"]
ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "data/postal_country_packs/ps/postal-context/m2-source-review.json"


def digest(data):
    return "sha256:" + hashlib.sha256(data).hexdigest()


def profile_list(data):
    if not isinstance(data, bytes) or not data or len(data) > 1024 * 1024:
        raise ValueError("list-byte-limit")
    text = data.decode("utf-8-sig", errors="strict")
    if "\x00" in text:
        raise ValueError("nul-in-csv")
    rows = list(csv.reader(io.StringIO(text, newline=""), strict=True))
    if not rows or rows[0] != HEADER:
        raise ValueError("unexpected-list-schema")
    rows = rows[1:]
    if not rows or len(rows) > 2000 or any(len(row) != len(HEADER) for row in rows):
        raise ValueError("invalid-list-rows")
    if any(len(cell) > 20000 for row in rows for cell in row):
        raise ValueError("list-field-limit")
    valid = [row for row in rows if re.fullmatch(r"P[0-9]{3}", row[0])]
    counts = collections.Counter(row[0] for row in valid)
    districts = collections.defaultdict(set)
    for row in valid:
        districts[row[0]].add(row[1])
    return {
        "grain": "source P3-code / district / locality / coverage relation; not one row per polygon",
        "header": HEADER, "rows": len(rows), "syntaxValidRows": len(valid),
        "distinctP3Codes": len(counts), "invalidCodeRows": len(rows) - len(valid),
        "duplicateFullRows": len(rows) - len({tuple(row) for row in rows}),
        "sharedCodeGroups": sum(count > 1 for count in counts.values()),
        "maxRelationsPerCode": max(counts.values(), default=0),
        "codesAcrossMultipleDistrictLabels": sum(len(value) > 1 for value in districts.values()),
        "emptyFields": {name: sum(not row[i].strip() for row in rows) for i, name in enumerate(HEADER)},
        "sourceDistrictLabelCount": len({row[1] for row in rows}),
        "rowsDropped": 0, "codeRepairs": 0, "geometriesProduced": 0,
        "postalAssignmentsCurrentlyValidated": 0,
        "nationalCompleteness": None, "currentValidity": None,
        "postalAreaAccuracy": None, "positionalAccuracyMetres": None,
    }


def profile_catalog(data):
    obj = json.loads(data)
    result = obj.get("result", {})
    if obj.get("success") is not True or result.get("name") != "postcodes" or result.get("organization", {}).get("name") != "mtde":
        raise ValueError("unexpected-catalog-identity")
    resources = result.get("resources", [])
    if not resources or len({r["id"] for r in resources}) != len(resources):
        raise ValueError("invalid-catalog-resources")
    return {
        "publisherOrganization": result["organization"]["name"],
        "metadataModified": result.get("metadata_modified"),
        "publisherVersion": result.get("version") or None,
        "declaredLicenceId": result.get("license_id"),
        "declaredLicenceTitle": result.get("license_title"),
        "declaredLicenceUrl": result.get("license_url"),
        "publisherIsOpenFlag": result.get("isopen"),
        "resources": [{k: r.get(k) for k in ["id", "name", "url", "format", "size", "last_modified", "hash"]} for r in resources],
        "resourceCount": len(resources),
        "sampleResources": sum("sample" in r.get("name", "").lower() for r in resources),
        "licenceVersionConfirmed": False, "rightsClearedForProduction": False,
        "currentValidity": None, "sourceCrsConfirmed": False,
    }


def inspect(observations, config, now=None):
    now = now or datetime.datetime.now(datetime.timezone.utc)
    refs = config["references"]
    if len(observations) != len(refs) or len({o["id"] for o in observations}) != len(observations):
        raise ValueError("observation-set")
    results = []
    for ref in refs:
        o = next((o for o in observations if o["id"] == ref["id"]), None)
        if o is None or o.get("requestedUrl") != ref["url"] or o.get("observedAt") != ref["observed_at"]:
            raise ValueError("receipt-binding")
        observed = datetime.datetime.fromisoformat(o["observedAt"].replace("Z", "+00:00"))
        if observed.tzinfo is None or observed > now:
            raise ValueError("invalid-observed-time")
        row = {k: o.get(k) for k in ["id", "requestedUrl", "finalUrl", "redirects", "observedAt", "httpStatus", "contentType", "lastModified", "failureKind"]}
        row.update({"edition": ref["edition"], "contentVerified": False, "sourceDocumentDigest": None})
        if ref["kind"] == "unavailable":
            if "bytes" in o or o.get("bodyPath") or o.get("responseDigest") or o.get("httpStatus") != ref.get("http_status") or o.get("failureKind") != ref.get("failure_kind"):
                raise ValueError("failed-source-cannot-prove-content")
            row["status"] = "unavailable-not-data"
        else:
            data = o.get("bytes")
            if not isinstance(data, bytes) or not data or len(data) > config["limits"]["max_reference_bytes"]:
                raise ValueError("reference-byte-limit")
            if o.get("httpStatus") != 200 or o.get("finalUrl") != ref["url"] or o.get("redirects") != []:
                raise ValueError("incomplete-or-redirected-receipt")
            if o.get("byteLength") != len(data) or len(data) != ref["bytes"] or o.get("responseDigest") != digest(data) or digest(data) != ref["digest"]:
                raise ValueError("source-changed-review-required")
            if (o.get("contentType") or "").split(";")[0].strip().lower() not in ref["accepted_mime"]:
                raise ValueError("unexpected-mime")
            if ref["kind"] == "p3-list":
                profile = profile_list(data)
            elif ref["kind"] == "catalog":
                profile = profile_catalog(data)
            elif ref["kind"] in ["pdf", "html"]:
                if ref["kind"] == "pdf" and not data.startswith(b"%PDF-"):
                    raise ValueError("invalid-pdf")
                profile = ref["reviewed_profile"]
            else:
                raise ValueError("unsupported-reference-kind")
            if profile != ref["reviewed_profile"]:
                raise ValueError("fresh-profile-mismatch")
            row.update({"byteLength": len(data), "responseDigest": digest(data), "sourceDocumentDigest": digest(data),
                        "contentVerified": True, "status": "reviewed-snapshot-not-current-m2-data", "profile": profile,
                        "structureRecomputed": ref["kind"] in ["p3-list", "catalog"],
                        "humanReviewReusedByExactDigest": ref["kind"] in ["pdf", "html"]})
        results.append(row)
    return {"schemaVersion": "postal-context-ps-source-review/v1", "countryCode": "PS", "generatedAt": now.isoformat().replace("+00:00", "Z"),
            "criterionId": config["m2_criterion"]["id"], "references": results,
            "countryM2Achieved": False, "currentPostalAssignmentsValidated": 0,
            "completePolygonArtifactsRetrieved": 0, "productionGeometryRecords": 0,
            "publishedImmutableDataArtifacts": 0, "realAgidRuntimeVerified": False,
            "rawSourceRowsInGit": 0, "personalOrBuildingRecordsPublished": 0,
            "p7ResourcesDownloaded": 0, "sourceNetworkRequestsDuringVerification": 0,
            "paidOperations": 0, "contractAcceptancePerformed": False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observations", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    observations = json.loads(Path(args.observations).read_text(encoding="utf-8"))
    for o in observations:
        if o.get("bodyPath"):
            path = Path(o["bodyPath"])
            if path.stat().st_size > config["limits"]["max_reference_bytes"]:
                raise ValueError("reference-byte-limit")
            o["bytes"] = path.read_bytes()
    report = inspect(observations, config)
    target = Path(args.report)
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    print(json.dumps({"report": str(target), "references": len(report["references"]), "countryM2Achieved": False}))


if __name__ == "__main__":
    main()
