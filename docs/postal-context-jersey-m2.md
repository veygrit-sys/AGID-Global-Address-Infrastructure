# Jersey Postal Context M2 review

## Technical summary

Jersey (`JE`) remains at `M1_metadata`; M2 is blocked. The May 2026 ONS Postcode Directory provides a reusable current denominator of 3,215 live Jersey unit postcodes, but the official guide states that no geographic coordinates are supplied for Channel Islands postcodes. All 3,674 live and terminated JE rows have `GRIDIND=9`, null eastings/northings and online-service latitude/longitude sentinels `100/0`; an explicit geometry sample returned no geometry.

The Government of Jersey's public `JSearchSept2023` service does contain a postcode layer, but it is only point geometry. Its 1,914 records cover 1,891 of the 3,215 live May 2026 ONSPD codes, include 19 terminated codes, contain four values absent from the current directory and omit 1,324 live codes. The ArcGIS item and layer expose blank licence/access fields, and the government open-data catalogue returns no postcode dataset. OGL-J therefore cannot be presumed to cover this uncatalogued service. Jersey Post's public address finder supplies neither a reviewed bulk/API-serving grant nor postal polygons.

No point, placeholder coordinate, parish, road, address, building, land parcel, buffer, Voronoi cell or synthetic fixture was promoted. There is no rights-cleared real JE Polygon/MultiPolygon, immutable area artifact, real API geometry response or search-to-translucent-area application result.

## Key findings

| Authority or product | Current evidence | Rights and quality state | Postal-area result |
| --- | --- | --- | --- |
| Jersey Post address finder | Interactive address/postcode lookup; upcoming properties may be absent and updates may take two months | No rows queried; no reviewed bulk extraction, redistribution or public API-serving grant | No Polygon/MultiPolygon |
| Government JSearch | 1,914 distinct postcode values; `esriGeometryPoint`; edition name `JSearchSept2023` | 1,891 live overlaps, 19 terminated overlaps, 4 unmatched values, 1 invalid value, 1,324 live omissions; licence/access fields blank | 0 polygons; points remain points |
| Government open-data catalogue | OGL-J terms for qualifying hosted items; postcode CKAN search count 0 | Does not automatically license uncatalogued `roadworks.gov.je` data | No catalogued postcode boundary release |
| ONSPD May 2026 | 3,215 live and 459 terminated JE codes; all format-valid and distinct | Non-BT OGL reuse established with attribution; all rows `GRIDIND=9`, null east/north and `100/0` sentinels | 0 returned geometries; guide confirms Channel Islands coordinate omission |
| AGID shared UI capability | Polygon/MultiPolygon validation, map fit, translucent fill, visible outline, metadata, clear/re-search and failure states | Deterministic tests only; no real JE artifact | Capability passes, country M2 does not |

A chart or map was intentionally omitted. This is a binary authority/rights/geometry gate, and any plotted surface would falsely imply that a lawful real Jersey postal area had been obtained.

## Scope and country-specific M2 definition

The intended grain is one current Jersey unit-postcode assignment and its exact source-defined surface or honest point/non-area/unavailable reason, plus any separately governed outward-code, sector or district postal context. Jersey remains its own identity; Guernsey, the United Kingdom, the Isle of Man and other territories are not merged into JE.

JE reaches `M2_current_jersey_unit_postcode_and_truthful_postal_area_visualization` only when all of the following are true:

1. A current rights-cleared nationwide unit-postcode denominator pins its edition, effective date, update cadence, terms, attribution, coverage, special/non-geographic classes, exceptions, byte length and SHA-256.
2. Every searchable geographic unit code has an authoritative or rights-cleared real Polygon/MultiPolygon, or the unit is truthfully classified as point/non-area/unavailable and a real broader postal-context surface is independently available and labelled at its actual outward-code, sector or district grain.
3. The approved immutable artifact pins CRS, topology, membership, validity, method, uncertainty and SHA-256 without publishing private address, customer, building, cadastral or land-right data.
4. The real AGID API/app normalizes the JE code, preserves exact-unit versus broader-context grain, returns only eligible geometry, fits the map, renders a translucent fill and clear outline, and reports selected code, geometry kind, official/derived/virtual class, source, reference date, confidence and any non-area reason. Loading, no match, multiple candidates, API failure, invalid geometry, clear and re-search states pass.

ONSPD sentinels, JSearch points, addresses, routes, PO boxes, organisations, parishes, administrative areas, roads, buildings, parcels, buffers, Voronoi cells and synthetic fixtures do not satisfy this definition.

## Source and reproducibility review

Ten official reference surfaces produced 17 exact response or archive-member bodies pinned by retrieval time, byte length and SHA-256 in the machine report. The evidence includes the Jersey Post finder and terms, Government of Jersey open-data terms and CKAN result, JSearch item/layer/all-row response, ONSPD item/layer/two complete JE pages/geometry sample, the May 2026 user-guide item/ZIP/PDF/ODT, and the current ONS licence page. Raw rows and captures remain temporary and are not committed.

The ONSPD audit is reproducible by querying `PCDS LIKE 'JE%'` at offsets 0 and 2,000, sorting by `OBJECTID`, classifying blank `DOTERM` as live, validating the JE display grammar and counting `GRIDIND`, coordinate and geometry fields. The JSearch audit reads `ET_ID`, `ET_X` and `ET_Y` from all 1,914 features and compares them exactly to the pinned live and terminated ONSPD sets. This comparison is quality evidence only; it does not confer reuse rights.

## Data-quality assessment

- Completeness: critical for M2. ONSPD supplies 3,215 distinct current codes but zero eligible surfaces. JSearch covers only 1,891 live codes (58.8180%), omits 1,324 and includes terminated or unmatched values.
- Uniqueness: ONSPD has zero duplicate codes; JSearch has zero duplicate code values. JSearch has four duplicated coordinate groups containing nine rows, which is acceptable for a search point dataset but cannot prove a postal surface.
- Validity: all 3,674 ONSPD JE values match the country grammar. JSearch has one invalid value, `JE3 IJN`.
- Consistency: all ONSPD JE rows consistently state `GRIDIND=9`, null eastings/northings and the online `100/0` sentinel. JSearch is consistently point-only but is not current or complete against ONSPD.
- Timeliness: ONSPD reference month is May 2026 and its item was modified 22 June 2026. JSearch identifies itself as September 2023; the Jersey Post finder notes that its own update lag may reach two months.
- Integrity: exact unit identity, broader postal context, search point, address, building, administration, occupancy and ownership remain separate authorities and relations.

## Authority and rights separation

The ONS page establishes non-BT ONSPD reuse under OGL v3 with ONS, Ordnance Survey and Royal Mail attribution, but it cannot create geometry the source explicitly withholds. Government of Jersey OGL-J applies to qualifying information hosted on `opendata.gov.je`; the postcode catalogue search returned zero results, while JSearch is served from `roadworks.gov.je` and has blank licence/access metadata. No legal conclusion is claimed, so the safe production decision is to deny redistribution and serving until an explicit product-specific grant exists.

The Jersey Post finder was not queried. No account, credential, key, payment, contract, contact or licence acceptance was used. No address, building, cadastral or land row was acquired. Postal Code to Polygon to Address Context remains a one-way authority chain: a postcode or point cannot identify a building, resident, owner or rightsholder without a separate explicit relation and source.

## Application status

The shared Postal Context code validates Polygon/MultiPolygon-only area responses, computes fit bounds, uses a translucent fill and visible outline, and handles loading, no-match, multiple, API failure, invalid geometry, metadata, clear and re-search states. These tests verify fail-closed capability only. Because there is no production-eligible JE artifact, there is no real JE loader, API geometry response, map fit, semi-transparent area or browser E2E claim. A point or sentinel remains point/non-area or unavailable.

## Limitations and robustness

This is a dated public-release and rights audit, not legal advice and not proof that no private, unlisted or future source can exist. The JSearch service was compared to ONSPD but not promoted; blank rights fields were not interpreted as permission. The Jersey Post finder was not crawled. ONS guide text, metadata, query totals and digests reconcile, and pages 8, 23, 26, 44 and 45 were rendered. Local visual inspection failed with Windows error 206 even for short `C:\tmp` paths, so successful image review is not claimed.

The M2 decision is robust because each available path lacks at least one mandatory property: current nationwide completeness, explicit serving/redistribution rights, or real postal-area geometry.

## Recommended next step

After the pending-country pass and not before `2026-09-06T14:03:19.968Z`, recheck Jersey Post, the Government of Jersey open-data catalogue and competent public GIS sources for an explicit reusable current denominator and real postal-boundary release. Resume sooner only if such a release appears. Contacting a provider, registering or authenticating, accepting terms or a contract, requesting restricted data or a key, paying, crawling the finder, creating a repository/publication destination, publishing or deploying requires explicit approval.

## Further questions

- Will Jersey Post or the Government of Jersey publish a complete current unit-code denominator with explicit redistribution and public API-serving rights?
- Is JSearch licensed for derivative/public serving, and can its stale point layer be replaced by a complete current release?
- Does a competent source maintain genuine outward-code, sector or district postal boundaries distinct from parish and administrative geometry?
- If a derived surface is ever permitted, which complete rights-cleared membership source defines its reproducible topology, uncertainty and exceptions without exposing addresses?

Machine-readable evidence is in `reports/postal-context-m2/je-source-review-2026-08-30.json`; engineering results are in `reports/postal-context-m2/je-checks-2026-08-30.json`.
