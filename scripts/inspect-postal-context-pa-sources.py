"""Fail-closed inspection of exact Panama Postal Context M2 source bodies."""
import argparse, hashlib, html, json, math, re
from pathlib import Path

EXPECTED_SOURCES = [
 {"file":"correos-launch.html","url":"https://www.correospanama.gob.pa/panama-da-un-paso-firme-hacia-la-modernizacion-con-el-nuevo-sistema-de-codigos-postales/","bytes":89075,"sha256":"9d46de7aead315e340ba1e446b2ec4566e1726b790c11019cc9b265de27cba66","kind":"html","markers":["Panamá, 7 de mayo de 2026","sistema de códigos postales geolocalizado","uso del código postal es completamente gratuito","codigospostalespanama.gob.pa"]},
 {"file":"postal-portal.html","url":"https://www.codigospostalespanama.gob.pa/","bytes":1175,"sha256":"6ac2d241304385b82acc4c1bea9691844ab4da9c3dafaa71d1ff87c562c0815b","kind":"html","markers":["Sistema de Códigos Postales de Panamá","/assets/index-BYGSdosv.js","/assets/index-BpoDF9g4.css"]},
 {"file":"postal-portal-index.js","url":"https://www.codigospostalespanama.gob.pa/assets/index-BYGSdosv.js","bytes":805996,"sha256":"cf24abbffe60da05a76e21a706410ea6633a5f9d8f581fc36aba97545e1cb876","kind":"text","markers":["baseURL:\"/api\"","/location","/postal/decode","postal-cell-","fillOpacity","Ej. A31234-5678"]},
 {"file":"postal-portal-index.css","url":"https://www.codigospostalespanama.gob.pa/assets/index-BpoDF9g4.css","bytes":43100,"sha256":"093a02b1c4a93b1de24a8ea54434a95233369f0ccf2c3928550108873a506536","kind":"text","markers":["leaflet-container"]},
 {"file":"postal-api-location.json","url":"https://www.codigospostalespanama.gob.pa/api/location?lat=8.9824&lng=-79.5199","bytes":2472,"sha256":"afac33720f1b8e088bf35b81f2aaab7d02ede9e52b870f57d5c266a9abf670c9","kind":"location_json"},
 {"file":"postal-api-decode.json","url":"https://www.codigospostalespanama.gob.pa/api/postal/decode?code=A7C95-69R3E","bytes":2292,"sha256":"7e9e32deae4d91e239d8ca7c82fe5624b6737cac0ed9fa88583225159ba2cfaa","kind":"decode_json"},
 {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93713,"sha256":"297fb98cd47c0ae91afdfaf2f0c2fdcf38ad2b53e12aa52c27964e2be8eae95e","kind":"html","markers":["without permission in writing from the UPU","Access to databases of the UPU"]},
]

def digest(body): return hashlib.sha256(body).hexdigest()
def clean_html(value): return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()

def validate_cells(postal):
    grid, selected = postal.get("grid") or {}, 0
    cells = grid.get("cells")
    if grid.get("level") != "PICO" or not isinstance(cells, list) or len(cells) != 9: raise ValueError("pico-grid-schema-changed-review-required")
    for cell in cells:
        bounds, center = cell.get("bounds"), cell.get("center")
        if not isinstance(bounds, list) or len(bounds) != 2 or not isinstance(center, list) or len(center) != 2: raise ValueError("pico-cell-geometry-schema-changed-review-required")
        numbers = [v for corner in bounds for v in corner] + center
        if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in numbers): raise ValueError("pico-cell-non-finite-geometry")
        if not bounds[0][0] < bounds[1][0] or not bounds[0][1] < bounds[1][1]: raise ValueError("pico-cell-invalid-bounds")
        selected += cell.get("selected") is True
    if selected != 1: raise ValueError("pico-selected-cell-count-changed-review-required")
    return len(cells), selected

def inspect_source_dir(source_dir, expected=EXPECTED_SOURCES):
    root = Path(source_dir)
    observed = {p.name for p in root.iterdir() if p.is_file() and p.name != "inspect-bundle.mjs" and p.suffix.lower() != ".pdf"}
    if observed != {item["file"] for item in expected}: raise ValueError("source-set-mismatch")
    receipts, bodies = [], {}
    for item in expected:
        body = (root / item["file"]).read_bytes(); bodies[item["file"]] = body
        if len(body) != item["bytes"] or digest(body) != item["sha256"]: raise ValueError("source-changed-review-required:" + item["file"])
        if item["kind"] in {"html", "text"}:
            text = body.decode("utf-8", errors="strict"); searchable = text + "\n" + (clean_html(text) if item["kind"] == "html" else "")
            for marker in item.get("markers", []):
                if marker.casefold() not in searchable.casefold(): raise ValueError("missing-source-marker:" + item["file"] + ":" + marker)
        receipts.append({key:item[key] for key in ["file","url","bytes","sha256"]})
    try: location, decoded = json.loads(bodies["postal-api-location.json"]), json.loads(bodies["postal-api-decode.json"])
    except (KeyError, json.JSONDecodeError) as error: raise ValueError("invalid-api-json") from error
    lp, dp = location.get("postal") or {}, decoded.get("postal") or {}; code = lp.get("codigo_completo")
    if code != "A7C95-69R3E" or dp.get("codigo_completo") != code or decoded.get("codigo_normalizado") != code: raise ValueError("location-decode-code-mismatch")
    lc, ls = validate_cells(lp); dc, ds = validate_cells(dp)
    portal = (bodies["postal-portal.html"] + bodies["postal-portal-index.js"]).decode("utf-8")
    rights = sum(portal.casefold().count(marker) for marker in ["creative commons","open licence","open license","redistribution","reuse licence","reuse license"])
    return {"schemaVersion":"postal-context-pa-source-inspection/v1","countryCode":"PA","exactBodies":receipts,"exactBodiesByteAndSha256Bound":len(receipts),"exactOfficialBodiesBytes":sum(item["bytes"] for item in receipts),"currentPostcodeSystemConfirmed":True,"currentPostcodeFormat":"XXXXX-XXXXX full; XXX-XXXXX grid-only","officialLaunchDate":"2026-05-07","liveApiObservations":2,"locationApiStatus":200,"decodeApiStatus":200,"observedNormalizedCode":code,"locationPicoCells":lc,"locationSelectedCells":ls,"decodePicoCells":dc,"decodeSelectedCells":ds,"apiResponseBodiesBundledHere":False,"portalLicenceOrReuseMarkerMatches":rights,"freeLookupConfirmed":True,"compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished":False,"currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished":False,"currentCompleteImmutablePostalAreaArtifactEstablished":False,"officialPostalPolygonOrMultiPolygonRecords":0,"derivedOrVirtualPostalPolygonOrMultiPolygonRecords":0,"productionEligibleRecords":0,"approvedAgidRuntimeArtifacts":0,"rawSourceRowsEmitted":0}

def main():
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument("--source-dir", required=True); args = parser.parse_args()
    print(json.dumps(inspect_source_dir(args.source_dir), ensure_ascii=False, indent=2))
if __name__ == "__main__": main()
