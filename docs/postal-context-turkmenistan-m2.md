# Turkmenistan Postal Context M2 source and visualization review

## Technical summary

Turkmenistan remains at **M1 metadata**. Seven exact primary references were
retrieved on 2026-08-29 and bound to SHA-256 receipts: the current Turkmenpost
home and departments surfaces, their public app client and departments API, the
December 2020 UPU Turkmenistan addressing sheet, UPU's current Addressing
Solutions page, and an official government operator article.

The strongest current real data is Turkmenpost's public office directory. It
contains 153 unique, syntactically valid six-digit indices across seven
regions; 137 records include an office point and 16 do not. It has zero postal
Polygon/MultiPolygon or boundary fields. It is therefore valuable typed office
context, not evidence of nationwide delivery areas. No point, administrative
boundary or inferred Voronoi cell was promoted to a postal polygon.

## Key findings and evidence

| Evidence | Exact receipt | Finding | M2 consequence |
|---|---|---|---|
| Turkmenpost home | `sha256:13eecbe5…04a98` / 2,011 bytes | Current official operator surface at `post.tm` | No data or reuse grant on the shell |
| Departments UI | `sha256:0f37d499…12456` / 2,011 bytes | Current public office-search route | Client-rendered shell is not geometry evidence |
| Public app client | `sha256:1d2a65fb…f95bc` / 715,163 bytes | Binds the UI to `/api/departments`; contains all-rights-reserved wording | Confirms API lineage but not derivative/API redistribution rights |
| Departments API | `sha256:ee2dd15f…2994` / 31,862 bytes | 153 unique indices; 137 points; 16 missing points; zero boundary fields | Office data cannot satisfy area visualization |
| UPU country sheet | `sha256:fb32d146…0234` / 220,815 bytes | December 2020; two pages; six digits; five examples | Format and exceptions only, not current complete assignments or areas |
| UPU Addressing Solutions | `sha256:ce41c597…f407` / 200,030 bytes | Universal POST*CODE has licence documents, contract, NDA, declaration and rates | Contractual/paid route was not entered |
| Government article | `sha256:7cb4324b…5183` / 21,380 bytes | Corroborates Turkmenpost and selected offices | No postal boundaries or reuse grant |

Raw HTML, JavaScript, JSON, PDF and rendered pages were used only in the
isolated audit workspace and are excluded from Git. The source report retains
URLs, byte counts, hashes and observations without republishing source bodies.

## Scope and definitions

The reviewed syntax is `^[0-9]{6}$`. The UPU sheet explains the leading digits
as main town or province and the trailing digits as delivery office. Its
examples cover large-town, regional and village home delivery, P.O. box and
poste-restante cases. Those examples do not establish that every six-digit
value is assigned, current or spatially exhaustive.

M2 is defined as a current complete-for-declared-coverage assignment and exact,
permitted delivery-area release with real TM API and application proof. It
excludes office points, point buffers, Voronoi cells, administrative
boundaries, learned regions, routes, P.O. boxes, organizations and synthetic
fixtures. Buildings and house numbers require separate explicit source
relations.

## Methodology

1. Retrieved exact public primary-source bytes without authentication and
   recorded retrieval time, byte length and SHA-256.
2. Followed the public departments page's app-client binding to the operator's
   `/api/departments` endpoint.
3. Profiled directory grain, index syntax, uniqueness, optional coordinate
   presence and area-field absence.
4. Rendered the two-page UPU PDF at 144 DPI and extracted its text; checked PDF
   page count, encryption, tagging, page size and example semantics.
5. Compared the observed data and rights surface with AGID's country-specific
   M2 contract and deterministic shared search/map tests.

## Quality, uncertainty and robustness

All 153 directory values are unique six-digit strings, so the observed office
index validity rate is 100% and duplicate rate is 0%. Coordinate missingness is
16/153, or about 10.46%. These figures describe only the captured public office
directory. They do not measure national delivery coverage, address coverage or
postal-area completeness.

The exact PDF is a two-page, tagged, unencrypted A4 file. Text extraction and
rendering succeeded. The local image viewer rejected the Windows path with an
OS path-length error, so visual inspection inside that viewer could not be
completed; exact-byte binding, PDF metadata, extraction and rendered files were
still verified. This limitation does not affect the decisive absence of area
geometry in the operator API.

No current edition, validity interval, CRS, topology, delivery-area coverage or
express derivative/API redistribution right was found. Rights assessment is an
engineering promotion gate, not a legal opinion.

## App visualization status

Shared deterministic tests cover exact-code candidate selection, geometry
opt-in, Polygon/MultiPolygon filtering, map fit, opacity-0.22 fill,
opacity-0.95 width-3 outline, clear and repeat search, and failure states. The
shared visible notice still lacks separate authority-class, basis-date and
confidence fields. TM has no eligible area artifact, runtime or API response,
so a real country search cannot yet draw a defensible translucent area. A
synthetic polygon would test code only and cannot establish M2.

## Next steps

1. Obtain explicit reuse/API rights plus a current complete-for-declared-
   coverage assignment and exact postal Polygon/MultiPolygon data or permitted
   delivery-area relations.
2. Preserve office, shared-code, P.O. box and poste-restante exceptions; never
   expand a point or administrative boundary into a postal area.
3. Record edition, validity, CRS, mappings, topology, hashes and validation;
   publish an approved immutable artifact outside AGID only after authorization.
4. Load the artifact through the real TM runtime/API and verify country plus
   postcode search, multiple/not-found/failure states, fit, translucent render,
   clear/re-search and visible authority/source/basis-date/confidence.

## Further questions

- Does Turkmenpost publish a delivery-address assignment distinct from its
  office directory, and what geographic semantics do repeated service modes
  carry?
- Is there an express licence for bulk extraction, derivative postal areas,
  redistribution and public API serving?
- What are the current effective date, national coverage statement and change
  history for six-digit office indices?
- Which authority, if any, defines exact delivery boundaries and non-area
  exceptions?

Recheck on or after `2026-09-05T04:32:30.161Z` and after the pending-country
pass, or earlier if rights-cleared assignment/area data or explicit permission
appears. No chart is included because there is no eligible geographic or
coverage measure to visualize; charting office counts would misleadingly imply
postal-area coverage.
