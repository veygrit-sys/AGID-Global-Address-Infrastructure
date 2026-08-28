# Armenia M2 source and directory review

Status: **M1_metadata / blocked**, reviewed 2026-08-28. This is a preflight,
not an M2 data release. The original country definition is unchanged:
`M2_experimental` - pinned rights-cleared snapshots reproduce experimental
packs with complete lineage.

## Intended data and grain

The [HayPost directory](https://www.haypost.am/image/Editor/d/3/d3cded6c5e6205e50a54b3c9d7018e78.pdf)
lists post offices, their codes and office locations. A row describes a network
office, not a unique postal area or an arbitrary residential address. The
[UPU guide](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/armEn.pdf)
is dated December 2021 and describes four-digit formatting and coding components;
its examples do not establish current allocation.

The [source review report](../reports/postal-context-m2/am-source-review-2026-08-28.json)
records bounded HTTPS fetches, acquisition times, document digests, exact URLs
and aggregate inspection. Eight reference probes and one directory fetch
returned verified content. Verification means expected document bytes/markers,
not data rights or operational coverage.

## Checks and quality findings

PDF.js 5.6.205 inspected all nine directory pages. The code-column layout is
accepted only for the explicitly pinned PDF SHA-256. Changed bytes require a
fresh layout/edition review. Code strings retain leading zeroes. Row context is
checked at the code's baseline; wrapped cells are not silently repaired.

| Check | Observed result | Risk and action |
| --- | --- | --- |
| Code-column rows | 428; 427 distinct codes; 185 rows start with zero | Keep codes as strings. Counts describe this document only. |
| Postcode uniqueness | 1 repeated-code group, 2 rows | High impact/high confidence: postcode alone cannot be an office key; preserve both rows. |
| Four-digit format | 0 malformed code cells | Syntax passes, but allocation/currentness remains unverified. |
| Same-baseline context | 4 of 428 rows (0.935%) lack a matched region, office or address column | Medium impact/high confidence in the extraction result: review wrapped/merged cells; this is NOT evidence that upstream fields are absent. |
| Full reconstruction/geometry/building | Not verified; no polygons or building links | No exact address or building claims may be enabled from this evidence. |

The directory is 158,330 bytes, SHA-256
`638bf8cf400382bc4da0a9c27a840ec7f524cc0e46364e5f39fea19269ef1e30`.
Its PDF metadata creation/modification date is 2023-06-21, while HTTP
Last-Modified is 2026-01-16. Neither establishes assignment validity. No
provider-declared current edition, valid-from or valid-to was established.
There is no multi-edition trend analysis or independently verified nationwide
coverage. The duplicate may be legitimate multiplicity or a source issue;
do not resolve it by dropping one row.

PDF pages were rendered, but local image inspection failed with the host's
image-tool path error. Text/position inspection is therefore recorded as such,
not a completed visual table audit. The source PDFs are temporary and are not
retained in Git or published by this run.

## Official address, building and access evidence

The [Cadastre registration description](https://www.cadastre.am/index.php/en/real-estate-registration)
ties address registration to authorized community decisions. It does not
provide a public address-object export or postcode-to-building crosswalk.

The [information-provision guidance](https://www.cadastre.am/index.php/en/provide-information)
describes registration, ordering an area and paying for electronic cadastral
map downloads. No account or order was created. This does not establish that
every layer is paid; it does mean a website cannot serve as a blanket open
licence. A layer-specific grant, permitted fields and release remain missing.

The [2021 geoportal launch](https://www.cadastre.am/news/1786) is dated
government-access context, not a current public layer release. The
[geoportal overview](https://www.cadastre.am/en/improvement/improvement3)
describes WMS/WFS capability, which does not grant redistribution rights.
The [mapping description](https://www.cadastre.am/index.php/en/cadastre_mapping)
also discusses historical survey errors and subsequent corrections; pin the
actual layer vintage and boundary policy, not merely the portal name.
The [application privacy policy](https://www.cadastre.am/index.php/en/privacy_policy)
addresses personal-information handling and free/paid services, not a licence
for republishing datasets.

High impact/high confidence: a permitted current assignment release, reusable
public address fields and immutable artifacts have not been established by
this bounded review. This is an evidence gap, not a claim that no reusable data
exists anywhere in Armenia.

## Changes and AGID safety

HayPost search, its exact directory URL, the exact UPU guide URL and Cadastre
reference entries are metadata-only/context-only in the source-trust catalog.
Provider authority is retained; document identity cannot confer current postal
validation strength. Tests cover ID, URL and name matching.

The existing AM runtime and synthetic route/loader tests remain supported.
They do not count as real-data AGID integration. No AM descriptor was enabled
and no production deployment was performed. A postcode's office address must
never become the civic address of all points sharing that code. Exact buildings
still require independent permitted identifiers or reviewed relations. No
official, derived or virtual geometry was fabricated. Country/territory
identity and boundary policy are unchanged.

## Reproduction and remaining gates

Run `node scripts/inspect-postal-context-am-sources.mjs --pdfjs-module /local/pdfjs-dist/legacy/build/pdf.mjs --report <new-report.json>`
with PDF.js 5.6.205 for comparable extraction. The bounded probe stores counts
and hashes only, never PDF bodies, source rows or metadata identities. Its
network failures are explicit and do not trigger login or paid fallbacks.

The [engineering checks](../reports/postal-context-m2/am-checks-2026-08-28.json)
record country/shared/rollout tests and typechecking. Tests use synthetic
inputs and repository metadata; they are not production-data completion.

To unblock, establish exact acquisition, retention, transformation and
redistribution rights; obtain a current source edition and validity/correction
policy; resolve row identity and extraction exceptions; retain approved source
snapshots outside AGID Git; validate a real scoped pack, publish immutable
artifacts at an explicitly approved destination and replay their hashes and
AGID lookups. Independently license any included geometry/address/building data.

Next read-only review: **2026-09-04**, after the pending-country pass.
Registration, payment, contracts, new public destinations and deployment need
additional approval. The next country is **AZ**; no second country was started.
