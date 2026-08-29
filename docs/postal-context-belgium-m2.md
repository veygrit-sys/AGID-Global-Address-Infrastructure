# Belgium Postal Context M2 review

## Technical summary

BE now has the country-specific target
`M2_current_assignment_and_rights_cleared_postal_canton_visualization`, but
remains **M2 blocked**. A real national bpost Postal cantons vector exists and
all 1,268 reviewed source features pass geometry validity. The reviewed terms
grant internal use only, strictly forbid commercial use and do not grant
public repository, derivative-artifact or API redistribution. AGID therefore
cannot yet return these polygons from its public API or draw them in the real
app.

## Key findings and evidence

| Evidence | Result | Decision impact |
| --- | --- | --- |
| geo.be metadata UUID | `9738c7c0-5255-11ea-8895-34e12d0f0423`, stamped 2026-06-09 | Exact official source is identifiable |
| EPSG:4326 archive | 14,250,060 bytes; SHA-256 pinned | Reproducible source bytes exist |
| Geometry | 1,268 3D Polygon features; 1,187 distinct source codes; 0 invalid | Real areas exist, not synthetic fixtures |
| Special/exception values | 39 special-flag features; source values `612` and `9` are not four characters | Leading-zero normalization cannot be guessed |
| Rights | internal use; commercial use forbidden; public attribution required | Public AGID artifact/API is not authorized |
| Assignment workbook | current page links `zipcodes_num_nl_2025.xls`; exact bytes pinned | Legacy BIFF rows were not parsed; completeness remains unverified |

## Scope, data and definitions

The declared postal area is the exact feature from the reviewed bpost Postal
cantons vector. Its lineage says address points were extrapolated to surfaces
using administrative limits and roads. AGID records that method as an official
derived source surface; it does not call containment exact deliverability.

A public-area record additionally requires explicit rights for redistribution,
derivatives, API delivery and commercial use. Zero of the 1,268 source
features meet that publication gate. Addresses, house numbers and buildings
are out of scope for postcode geometry. They require separate permitted BeSt
and regional address/building identifiers and relations.

## Methodology

Four exact artifacts were downloaded without authentication, payment or terms
acceptance. A byte-bound inspector verifies size, SHA-256, MIME/signature and
metadata/page markers. GDAL/OGR inspected the extracted Shapefile schema,
extent, feature counts, distinct code values and `ST_IsValid` results. Internal
Shapefile component hashes are recorded in the source contract. Raw XML, ZIP,
Shapefile, HTML and XLS bodies remain outside Git.

Shared deterministic tests verify exact postcode candidate resolution,
Polygon/MultiPolygon-only drawing, explicit geometry opt-in, bounds/fit,
opacity-0.22 fill, opacity-0.95 width-3 outline, update/removal, clear/re-search
and error states. These tests do not load the restricted BE vector and cannot
promote the country.

## Limitations and robustness

The artifact is current at the download endpoint (`Last-Modified`
2026-02-05), while its DBF header is dated 2020-02-19 and the metadata says
updates occur as needed. Those dates are retained rather than collapsed into
one asserted effective date. The current bpost page links a 2025 legacy XLS
last modified 2026-03-16. The approved spreadsheet runtime rejects BIFF `.xls`
and no unapproved parser was installed, so row counts and assignment coverage
are intentionally null.

The source-code field's `612` and `9` values show why `padStart(4, '0')` must
not be applied silently. A written schema rule or current assignment crosswalk
must prove whether those values mean `0612`, `0009` or another special case.

## Recommended next steps

Request written bpost permission covering public raw/transformed
redistribution, derivative polygons, API delivery and commercial use. Separately
obtain an approved parser or newer open CSV/XLSX assignment release and bind
all code-normalization exceptions. After explicit publication approval, create
a digest-pinned immutable artifact and verify the real BE loader, API and app
search, fit, translucent fill, outline, provenance, no-result, multiple,
invalid, failure, clear and re-search paths.

Recheck after the pending-country pass and no earlier than
`2026-09-05T10:56:01.000Z`, unless new public terms or a current open release
appears sooner. Do not negotiate a licence, accept terms, pay, publish or
deploy without explicit approval.

## Further questions

- Will bpost authorize public and commercial derivative/API use of Postal cantons?
- Can bpost publish the current assignment list as CSV/XLSX with explicit four-digit special-code semantics?
- Which effective date applies to the February 2026 archive when its DBF header remains dated February 2020?
- Can public use expose individual features, or only an attributed rendered view?

Next is **BG (Bulgaria)**. No second country was started.
