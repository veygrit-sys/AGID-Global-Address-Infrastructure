# Türkiye Postal Context M2 source and visualization review

## Technical summary

Türkiye remains at **M1 metadata**. Nine exact primary references were
retrieved on 2026-08-29 and bound to SHA-256 receipts: the current PTT lookup
UI and client, three scoped PTT API responses, PTT's legal notice, the July
2022 UPU Türkiye sheet, and two TUCBS government references.

The strongest current real data is PTT's postcode service. A bounded
ALTINDAĞ review contains 3,269 street/neighbourhood assignments, 8 distinct
valid five-digit postcodes, 26 neighbourhoods and 3,169 street labels. It has
zero Polygon/MultiPolygon, coordinate, boundary, CRS or topology fields. It is
therefore useful assignment context, not evidence of postal delivery areas.
No street row, administrative boundary, point buffer or inferred Voronoi cell
was promoted to a postal polygon.

## Key findings and evidence

| Evidence | Exact receipt | Finding | M2 consequence |
|---|---|---|---|
| PTT postcode UI | `sha256:c33fcbbc…08252a` / 182,910 bytes | Current public province/district/neighbourhood/street lookup | Search availability is not area geometry or reuse permission |
| PTT page client | `sha256:c4449259…40c42` / 6,172 bytes | Binds POST actions to `/api/posta-kodu` and five textual result fields | Contract has no geometry request or map field |
| PTT province response | `sha256:dd4b336f…c642e` / 2,162 bytes | 81 provinces plus one selection sentinel | Directory data only |
| PTT Ankara districts | `sha256:61b6fa86…3262` / 767 bytes | 25 districts plus one selection sentinel | District identity is not a postal area |
| PTT ALTINDAĞ assignments | `sha256:f11a11cc…6ed0` / 379,715 bytes | 3,269 rows; 8 codes; 26 neighbourhoods; 3,169 streets; zero geometry fields | Real bounded data, but not national coverage or area data |
| PTT legal notice | `sha256:4533b012…b07f4` / 204,413 bytes | Prior permission is required for copying, republication and distribution | No AGID redistribution/API grant established |
| UPU Türkiye sheet | `sha256:5a4ba833…b005` / 227,891 bytes | July 2022; two pages; five digits plus P.O.-box/poste-restante exceptions | Format and exceptions only, not current complete assignments or areas |
| TUCBS current portal | `sha256:1c41bb21…3c72e` / 369,358 bytes | Sharing follows owner permission and Open Data classification | No verified public postcode-area service receipt |
| TUCBS address schema | `sha256:e10444e8…ec750` / 1,658,698 bytes | V1.1/2012 proposed postcode object has name/code attributes; outer doors are points | Conceptual schema is not a current postal polygon artifact |

Raw HTML, JavaScript, JSON, PDF and rendered pages were used only in the
isolated audit workspace and are excluded from Git. The source report retains
URLs, byte counts, hashes and observations without republishing source bodies.

## Scope and definitions

The reviewed syntax is `^[0-9]{5}$`. The UPU sheet places five digits left of
the locality. It also documents a suffixed sub-locality example, P.O. box and
poste-restante cases. Those examples do not establish that every five-digit
value is current, unique to one area or spatially exhaustive.

M2 is defined as a current complete-for-declared-coverage assignment and exact,
permitted, per-postcode Polygon/MultiPolygon delivery-area release with real TR
API and application proof. It excludes street rows, office points, point
buffers, Voronoi cells, administrative boundaries, learned regions, routes,
P.O. boxes, organizations and synthetic fixtures. Buildings and house numbers
require separate explicit permitted address relations.

## Methodology

1. Retrieved exact public primary-source bytes without authentication and
   recorded retrieval time, byte length and SHA-256.
2. Followed the public PTT client's POST action contract to bounded province,
   district and ALTINDAĞ assignment requests.
3. Profiled postcode syntax, field names, row counts, uniqueness dimensions,
   missingness and area-field absence without committing source bodies.
4. Extracted and rendered the two-page UPU PDF; checked PDF page count,
   encryption, tagging, page size, format and exception semantics.
5. Extracted the 67-page TUCBS schema and distinguished a conceptual postcode
   address component from an actual current postal-area release.
6. Compared observed data and rights with AGID's country-specific M2 contract
   and deterministic shared search/map tests.

## Quality, uncertainty and robustness

All 3,269 reviewed ALTINDAĞ assignment rows contain syntactically valid
five-digit values, for a bounded-sample validity rate of 100%. There are eight
distinct codes, no empty neighbourhood or street values, and zero geographic
fields. These figures describe one district response only. They do not measure
national delivery coverage, address coverage or postal-area completeness.

The exact UPU PDF is a two-page, tagged, unencrypted A4 file. Text extraction
and rendering succeeded. The local image viewer rejected the Windows path with
an OS path-length error, so visual inspection inside that viewer could not be
completed; exact-byte binding, metadata, extraction and rendered files were
still verified. The 67-page TUCBS document was text-extracted and its postcode
class reviewed. Neither document supplies current postal geometry.

No current area edition, validity interval, CRS, topology, national coverage
statement, immutable data artifact or express derivative/API redistribution
right was found. Rights assessment is an engineering promotion gate, not a
legal opinion.

## App visualization status

Shared deterministic tests cover exact-code candidate selection, geometry
opt-in, Polygon/MultiPolygon filtering, map fit, opacity-0.22 fill,
opacity-0.95 width-3 outline, clear and repeat search, and failure states. The
shared visible notice still lacks separate authority-class, basis-date and
confidence fields. TR has no eligible area artifact, runtime or API response,
so a real country search cannot yet draw a defensible translucent area. A
synthetic polygon would test code only and cannot establish M2.

## Next steps

1. Obtain written PTT/TUCBS permission or an explicitly compatible open-data
   licence plus a current complete-for-declared-coverage assignment and exact
   postal Polygon/MultiPolygon source or permitted area relations.
2. Preserve shared-code, street, neighbourhood, P.O. box and poste-restante
   exceptions; never expand an address row or administrative boundary into a
   postal area.
3. Record edition, validity, CRS, mappings, topology, hashes and validation;
   publish an approved immutable artifact outside AGID only after authorization.
4. Load the artifact through the real TR runtime/API and verify country plus
   postcode search, multiple/not-found/failure states, fit, translucent render,
   clear/re-search and visible authority/source/basis-date/confidence.

## Further questions

- Does PTT maintain exact delivery boundaries distinct from the public
  street/neighbourhood lookup, and can they be licensed for OSS redistribution
  and API serving?
- Is a postcode-area layer classified as Open Data in the current TUCBS
  sharing matrix, and what service, edition and terms govern it?
- Which PTT assignment timestamp, national coverage statement and history are
  authoritative?
- How are sub-locality suffixes, P.O. boxes, poste restante and repeated codes
  represented outside polygon coverage?

Recheck on or after `2026-09-05T05:06:23.425Z` and after the pending-country
pass, or earlier if rights-cleared assignment/area data or explicit permission
appears. No chart is included because there is no eligible geographic or
coverage measure to visualize; charting one district's row counts would
misleadingly imply postal-area coverage.
