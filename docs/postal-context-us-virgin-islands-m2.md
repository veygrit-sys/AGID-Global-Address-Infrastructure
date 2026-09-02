# U.S. Virgin Islands Postal Context M2 review

Observed at: 2026-09-02T18:08:57.070Z
Result: **M2 blocked; six real Census ZCTA validation surfaces and detailed IDs published, but current complete USPS assignments and the production app path are unavailable**

## Current system and fixed evidence

USPS Publication 28 confirms the `VI` abbreviation and current U.S. Virgin Islands last-line forms. The USPS City State Product is the current comprehensive ZIP reference, but USPS describes it as encrypted and not exportable and says other licensed products are needed for complete five-digit coding. The reviewed July 2026 AIS licence does not establish open AGID redistribution and public-serving rights. No licensed USPS rows were accessed or committed.

Nine exact primary-source bodies totalling 2,209,911 bytes were fixed outside Git with retrieval time, byte count and SHA-256. The six-feature Census query for `008%` returned `00802`, `00820`, `00830`, `00840`, `00850` and `00851`. Census states that ZCTAs are generalized statistical representations, omit some valid ZIP Codes, and can represent unique or P.O. Box ZIP Codes. These surfaces are therefore `derived` display/validation context, not current USPS assignments or delivery boundaries.

## Polygon and ID quality

The coordinate-preserving artifact contains four Polygons and two MultiPolygons: eight parts, eight closed rings, no holes, no zero-area rings and 11,767 positions. Bounds and every exact source digest are asserted by the reproducible builder. No missing surface, address, building, parcel or person relation was fabricated.

Each feature exposes Postal Context ID, geometry ID, Census GEOID, OID and OBJECTID, country assertion ID and release ID. Five Census internal points also expose a VI-prefixed AGID reference. `00830` deterministically encoded to `VG0ETQRJZKGQ`; that crosswalk is deliberately withheld and surfaced as a mismatch instead of changing VI identity or merging territories.

## Application and visual check

The isolated actual app started at `http://127.0.0.1:3026/` and returned HTTP 200. Its production `GET /api/v1/postal/VI/00802?geometry=geojson` path returned HTTP 404 with `Postal Context country is not supported`; the loaded map shell exposed no VI postal controls. After the research catalog was rebuilt and the app restarted, `GET /api/v1/postal/research/VI` returned HTTP 200, rollout status `blocked`, six real derived features, sample Postal Context ID `postal-vi-census-zcta-00802`, geometry ID `census-vi-zcta-2020-00802`, and the separate country and AGID linked-context IDs. A successful production VI polygon display is not claimed.

The in-app Browser was attempted first, but its Windows sandbox helper exited while applying deny-read ACLs. A deterministic Playwright fallback then rendered the committed real `00802` geometry, fit it to the viewport, used `rgba(14, 165, 233, 0.38)` fill over a visible background and a clear `rgb(15, 23, 42)` boundary, displayed all detailed IDs, cleared and re-searched, and showed the `00830` AGID mismatch withholding. This is deterministic render evidence, not a human/live visual inspection or production runtime success. Local bitmap inspection also failed with Windows path error 206 and is recorded honestly.

## Verification and remaining gate

The VI artifact/ID/authority suite passed 3/3, the Americas source registry suite passed 3/3, canonical rebuild hashes matched and `git diff --check` passed. The combined address-format suite had one existing unrelated VC source-registration failure. Repository typecheck has no VI-specific error after correction but remains blocked by five unresolved local workspace package declarations.

M2 requires a current complete immutable typed VI five-digit and ZIP+4 USPS assignment denominator with aliases, validity, corrections, exceptions and explicit area/non-area states under compatible processing, redistribution and public-serving rights. Eligible geometry must then drive the real VI API and app through normalization, loading, no-match, multiple, API-failure, invalid-geometry and non-area states, fit, translucent fill, clear outline, detailed source-qualified IDs, clear and re-search.

No provider was contacted, no account was created, no terms or contract were accepted, no payment was made and no protected data was accessed. Recheck after 2026-12-02T18:08:57.070Z or earlier only if qualifying primary evidence becomes public. The pending sweep continues to the next ledger-selected country.
