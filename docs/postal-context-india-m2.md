# India M2 preflight — 2026-08-28

## Outcome and unchanged criterion

**IN remains M1_metadata / blocked; M2 is not achieved.** The existing
`M2_assignment` definition is unchanged: a complete rights-cleared PIN and
typed office assignment must pass authority, coverage, freshness, licence
and digest gates. All 13 hard blockers, source profile, address format and
synthetic runtime are unchanged. Polygon/DIGIPIN/civic-address work belongs
to the existing M3 stage; exact buildings to M4. Missing optional geometry
is not substituted for the actual M2 blocker: a current complete assignment
snapshot has not been obtained and published with real AGID verification.

## Primary sources and current observations

The [aggregate source receipt](../reports/postal-context-m2/in-source-review-2026-08-28.json)
contains exact UTC request times, response sizes and SHA-256 hashes. It
retains no response bodies, default credentials, contacts or data rows.
Hashes of observed public pages are not retained assignment snapshots.

| Source | Current observation | Interpretation |
| --- | --- | --- |
| [Monthly directory resource](https://www.data.gov.in/resource/all-india-pincode-directory-till-last-month) | HTTP 200, but a sandbox warning, a 1970 footer placeholder and no directory marker in the server-rendered body. | The expected title in head metadata does not establish a real current data resource. |
| [Directory catalogue](https://www.data.gov.in/catalog/all-india-pincode-directory-through-webservice) | Correct catalogue text, published 2020-12-04 and updated 2025-10-03, but sandbox and empty-result markers. | Catalogue dates are not assignment validity or proof of a current monthly release. |
| [National boundary catalogue](https://www.data.gov.in/catalog/all-india-pincode-boundary-geo-json) and [existing Sikkim reference](https://sikkim.data.gov.in/catalog/all-india-pincode-boundary-geo-json) | Both return HTTP 200 with empty-result/missing-body markers; the national page also has a sandbox banner. | No exact boundary file, edition, topology or assignment crosswalk was obtained. Do not infer that official boundaries do not exist. |
| [National GODL page](https://www.data.gov.in/Godl) | Sandbox/footer shell without the substantive licence text. | A generic footer alone is not a reviewed licence. |
| [GODL on the Andhra Pradesh portal](https://ap.data.gov.in/godl) | Full legal text directly retrieved and read, with headings and substantive clauses checked. | Covered data permits lawful commercial/non-commercial reuse subject to attribution, non-endorsement and other conditions; personal/sensitive data and other exclusions remain outside the grant. No exact current assignment edition was bound to these terms. |
| [Official Swagger](https://sikkim.data.gov.in/backend/dataapi/v1/swagger/709e9d78-bf11-487d-93fd-d547d24cc0ef) | OpenAPI/Swagger 2.0, expected catalogue and HTTPS host, 15 parameters including 11 filters, mandatory query API key. Specification version is null. | Machine-readable access documentation, not a current office-data snapshot. Default credential values and contact fields are neither used nor exported. |
| [Registered-user help](https://sikkim.data.gov.in/help) | Describes API-key generation/access for registered users. | No login, registration or agreement was performed. |

One keyless request to the documented catalogue endpoint with `format=json`
and `limit=1` returned HTTP 400. Its body was cancelled, not exported; no
error-body digest or precise server error cause is asserted. The independent
Swagger/help evidence establishes the credential requirement. No default or
third-party API key was borrowed, no alternate protected endpoint was tried,
and no request for a new API was submitted.

All six portal diagnostics had zero static direct CSV/ZIP/GeoJSON links in
the reviewed response. This is not a browser-executed download check or proof
that every possible public source is unavailable. Exact current data is
unverified, not declared nonexistent. Access requirements do not imply that
GODL-covered data is legally restricted or that API access is paid.

## Geometry and DIGIPIN are independent evidence

The [Ministry of Communications announcement of 2025-05-27](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=2131707)
confirms the PIN-boundary publication initiative and links the national
catalogue. This is publication-history evidence, not the GeoJSON bytes or a
current complete typed-office assignment. The live [India Post DIGIPIN page](https://www.indiapost.gov.in/digipin)
describes a coordinate-derived location code that complements addresses.
It does not establish six-digit PIN assignments, exact buildings or identity.

No coordinate, boundary, DIGIPIN, civic-address, building or AGID relation is
generated here. Source-stated coverage remains separate from sovereignty or
border claims, and no uncovered area is filled as official geometry.

## Data quality and AGID safety

Validated assignment rows: **0**. Missing-PIN, duplicate-office and invalid-PIN
rates are **null / not measurable**, not zero-percent errors. A PIN can have
several offices and delivery statuses; no invented one-PIN/one-office key is
introduced. Swagger's numeric PIN *query filter* is not a response schema or
permission to store six-digit identifiers as numbers. Existing PIN strings,
office types and delivery/non-delivery semantics are preserved.

The inspector excludes head metadata, comments, scripts, styles and template
payloads when examining server-rendered body markers. Correct title, HTTP 200
and licence footer cannot override sandbox/placeholder evidence. GODL checks
require substantive clauses, not a table of contents alone. Exact Swagger
identity, parameter schema and host are checked; failures stop the dependent
catalogue request. All network reads have host, redirect, timeout and size
bounds. No returned URLs or default credentials are automatically followed.

The shared source catalogue changes only the directory and boundary entries
from claimed bulk availability to web-reference availability with dated
access caveats. Their official authority and metadata-only readiness remain
unchanged. This records the present evidence without asserting permanent
removal of either source. AGID's runtime and geography are not rewritten.

## Reproduction and remaining work

Run `node scripts/inspect-postal-context-in-sources.mjs --report <new-path.json>`.
It refuses to overwrite an existing receipt. The run makes six portal reads,
one GODL read, one Swagger read, at most one dependent keyless catalogue
request and three reference reads, excluding bounded redirects. Live bytes
can change; no body or default credential is persisted. JSON/HTML profiles
are limited to 2 MiB; reference reads use the shared bounded reader.

Run the India, shared-runtime and M2 verification commands plus the affected
source-catalogue tests and TypeScript check. The [engineering receipt](../reports/postal-context-m2/in-checks-2026-08-28.json)
records exact commands, code hashes, test counts and audit scope. This host's
npm launcher is broken, so installed tsx/tsc Node entry points are used.
Synthetic tests prove software behavior only, not M2 data completion.

Unblock using a restored lawful public download or explicitly approved OGD
API access to obtain the complete current typed PIN/office assignment, exact
edition and coverage, applicable GODL/attribution and source/terms digests.
Then reproduce whole-data checks and conversion, publish immutable artifacts
to an explicitly approved destination and verify the actual AGID loader/API.
The missing API key is not requested or retrieved from local secret stores.

Recheck public references on **2026-09-04**, at or after the ledger's precise
`retryAfter`, and only after the pending-country pass. That date does not
authorize authentication, agreements, new repositories/Spaces/datasets,
publication destinations, paid services or production deployment. No Hugging
Face operations or additional paid services were used. Next pending country:
**IQ (Iraq)**; no second country was started in this run.
