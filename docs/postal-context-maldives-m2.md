# Maldives (MV): M2 source review

Reviewed 2026-08-28 UTC from cumulative branch base
`902a14b235cfe0fa21eb85ba8c1af6f875ee9daf`. Maldives remains **M1_metadata**,
with its existing five-digit synthetic runtime. **M2 is not attained.**
No source records, real geometry or address/building relations were published.

## Preserved criterion and scope

The previous manifest already targeted `M2_source_attested` but did not define
it in `promotion.stages`. The [manifest](../data/postal_country_packs/mv/postal-context/repository-manifest.json)
now supplies that country-specific definition, preserving its target, all twelve
hard blockers, identifiers and runtime contract. The required grain is an exact
current Maldives Post assignment with source-qualified stable identity, five
character digits, original language fields, island/locality and atoll/postal
region, validity semantics, edition, retrieval time, schema and SHA-256.

An independently licensed island feature is a different grain. It requires a
reviewed stable crosswalk and input rights before any join. Joined island or
administrative surfaces remain derived, never postal-authority boundaries.
Absent official postal geometry stays `none`; prefixes and models do not fill
the gap as official data. House numbers and buildings require separate permitted
explicit civic/building records and relations. Real coverage, exceptions,
privacy, reproducible transforms, approved immutable data artifacts and actual
MV AGID loader/API verification are mandatory for M2.

## Observed evidence and risks

The [source report](../reports/postal-context-m2/mv-source-review-2026-08-28.json)
records twelve initial references: **six content-verified references, one
unresolved application shell and five HTTP failures**. Seven responses have
transport hashes; six have verified reference-document hashes. Neither count
represents assignment or geometry records. Exact URLs, original acquisition
times, bytes, MIME and SHA-256 are in the [review configuration](../data/postal_country_packs/mv/postal-context/m2-source-review.json).

| Finding | Evidence and impact | Gate / smallest remediation |
| --- | --- | --- |
| High: current assignment access unavailable | [Maldives Post finder](https://www.maldivespost.com/postcode-finder) returned HTTP 403. No current row, validity or output licence was verified. | Wait for legitimate public access or approved provider access; never bypass the refusal or substitute a pattern for an assignment. |
| High: public item is not a reuse grant | [Island item](https://www.arcgis.com/sharing/rest/content/items/3e644efe0bb348c58ee4277ac2a200ba?f=pjson) has public access but empty `licenseInfo`; attribution identifies Maldives Land and Survey Authority. | Review exact acquisition, field, derivative and redistribution terms before feature retrieval or publication. |
| High: names and feature codes are not safe join keys | [Layer 0 schema](https://services7.arcgis.com/yvCbn3q8PPtPLZIM/arcgis/rest/services/island_20240509/FeatureServer/0?f=pjson) has 15 fields. `FCODE` is a nullable string, length 15, without a unique index; `GlobalID` is absent. Only `OBJECTID` has a declared unique index. | Treat OBJECTID as snapshot-scoped. Verify actual key coverage and stable crosswalks on permitted rows. Missingness and duplicate rates remain unknown, not zero. |
| High: coordinate and geometry semantics differ | [Service metadata](https://services7.arcgis.com/yvCbn3q8PPtPLZIM/arcgis/rest/services/island_20240509/FeatureServer?f=pjson) and layer extent use 102100 / latest 3857 in metres; `latitude` and `longitude` attributes are nullable strings. | Do not relabel geometry as longitude/latitude or UTM. Validate source values and reviewed transformation before use. Field names are not coordinate validation. |
| Medium: prefix grain and time are ambiguous | The [UPU sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/mdvEn.pdf) is printed 09/2004; PDF metadata/Last-Modified are 2020. Its four Malé-region entries and twenty atoll prefixes reuse `20XXX` across groups. | Retain group + label + pattern + edition. Nine atoll prefixes start with zero. A prefix is neither a globally unique key nor a current full assignment. |
| Medium: metadata clocks are not feature validity | Item modification time and layer edit time differ. The service URL contains 20240509, but that string is not a guarantee of frozen data. | Bind exact acquisition hashes and separate item, schema, data-edit, source-edition and valid-from/to clocks. No validity interval was inferred. |
| Medium: statistics listing is not a dataset review | [Indicator listing](https://statisticsmaldives.gov.mv/census-2022-island-and-atoll-level-indicator-sheets/) dated 2024-10-10 links six workbooks, across population/employment and definition/atoll/island grains; paths contain 2023, while the census is 2022. | Keep these dates and grains distinct. Workbooks were not downloaded; no rows or household data were validated. |

Confidence is high in the recorded access statuses, byte-bound documents and
metadata fields. Actual assignment completeness, FCODE uniqueness, coordinate
missingness, topology and national coverage are **unknown**, because no licensed
real records were retrieved. These schema risks are not claims that actual
records are defective. `maxRecordCount=1000` is a response limit, not an island
count. `islandNa_1` is not assumed to encode a specific language or stable key.
No relationships are declared on the reviewed layer; none was inferred.

The [OneMap viewer](https://onemap.mv/) returned an application shell, not map
records or terms. [National mapping](https://www.geomatics.gov.mv/nationalmapping.php),
the [2025 survey standard](https://geomatics.gov.mv/uploads/Land%20Survey%20Submission%20Standards_SRVY2025-1.pdf)
and [2020 survey guideline](https://geomatics.gov.mv/uploads/Guidelines%20for%20Land%20Registration%20Survey%20of%20Islands_20201015%20V1_1.pdf)
returned HTTP 403; their contents/versions were not newly byte-verified. Existing
source identifiers and historical contract notes were retained, not promoted as
fresh evidence. A survey-submission standard is not a dataset licence and does
not override the live layer's declared CRS.

The [GIS landing page](https://statisticsmaldives.gov.mv/quicklink/gis-maps/)
contains dated listing metadata only. The [map/disclaimer route](https://statisticsmaldives.gov.mv/gismaps/)
returned 404, so the previous disclaimer text was not reverified this time.
No alternate host, query parameters or credentials were used to evade failures.
Esri's primary [item documentation](https://developers.arcgis.com/rest/users-groups-and-items/item/)
distinguishes access, licence information, item extent and metadata dates;
[layer documentation](https://developers.arcgis.com/rest/services-reference/enterprise/layer-feature-service/)
describes schema/IDs/relationships. These definitions do not provide a licence
for the Maldives source data.

## Reproducibility and AGID safety

The acquired one-page UPU PDF was rendered with native Poppler and visually
reviewed in full; pypdf text extraction was checked against the two table groups
and printed date. Only hashes and the minimal profile are committed, not the PDF,
full extracted text or example addresses. Offline verification binds the exact
PDF bytes and normalized-text SHA-256; original retrieval times are preserved.

The inspector binds the exact service/item/layer chain, MIME, known hashes,
schema, dates and URL. Drift or a new licence text requires human review. It
cannot call `/query`, export features, edit services, submit forms or send
credentials. Known HTTP 403/404 entries are not retried automatically by it.
PDF verification may reuse the prior visual review only when every byte matches.
Rechecking initial receipts performs zero new network requests.

All nine MV catalog entries are metadata-only for address validation. A
Maldives Post name or official URL can no longer turn unverified evidence into
strong address trust. Existing five-digit normalization, leading zeroes,
Dhivehi/Latin address fields, spatial runtime, synthetic fixtures and API
configuration remain unchanged. Runtime implementation and synthetic success
do not imply a production descriptor, licensed pack or tested real endpoint.

```sh
npm run verify:postal-context-maldives
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
npx tsc --noEmit
npm run postal-context:m2:status
```

`npm run postal-context:mv:inspect -- --report NEW.json` performs only the bounded
reference check; optional `--curl` selects an existing native curl executable.
It refuses to overwrite reports. [Engineering results](../reports/postal-context-m2/mv-checks-2026-08-28.json)
record tests, source hashes, exact scope and preserved user changes separately
from real-data readiness.

## Blocker and resume conditions

M2 remains blocked on current assignment access, exact reuse rights, actual
permitted data validation, fixed approved artifacts and real AGID verification.
The ledger records the next review date. Public references may be checked again
only after all pending countries and that date; it is not permission to bypass
access controls, accept a contract, purchase data or publish a new dataset.

No raw dumps, source PDFs, personal/recipient/customer records, households,
owners, occupants, land-rights data or source feature values enter AGID Git.
No new repository, public destination, Dataset/Space, paid compute/inference,
extra Hugging Face charge, contract, production deployment, force push or main
merge was performed. The next country is selected by the canonical status tool;
no second country is started in this run.
