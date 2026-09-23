# Myanmar M2 source review — 2026-08-28 UTC

## Decision

**M1_metadata / blocked; M2 not achieved.** At base
`1906f9f39c0335aa73aeffd779f15ae4b0e8a043`, MM already had synthetic runtime support
and the target `M2_source_attested`, but no explicit M2 definition. This review formalizes
that target and retains all twelve existing hard blockers, seven-digit normalization and
synthetic fixtures. It does not replace the country's identity or redefine another country.

Current rights-cleared postal assignments, explicit permitted geometry relations, real-record
validation, approved immutable data artifacts and actual AGID data-loader/API evidence remain
missing. Passing code tests, source hashes and the published review are not M2 data completion.

## References, editions and grain

The [UPU addressing reference](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/mmrEn.pdf)
was rendered and both pages visually reviewed. Its printed edition is **11/2022**;
the HTTP modification date in February 2023 is not the edition. It describes seven digits in
2+2+3 groups for state/region/country, town/township and quarter/village tract. Rural and P.O. Box
examples do not guarantee a street or house. Illustrative addresses and contact details are not
retained as data, and the reference proves neither current assignments nor postal polygons.

The [government postal-service directory](https://myanmar.gov.mm/-/myanmar-post-services)
links the [Myanmar Post lookup](https://www.myanmarpost.com.mm/postcode?tab=information).
Its September 2018 article date is historical, not a current data edition. The lookup failed
direct retrieval. Both the [Survey Department](https://surveydepartment.gov.mm/) and
[One Map announcement](https://surveydepartment.gov.mm/news/930) failed verified TLS retrieval;
no verification bypass was used. These observations do not establish that data is absent.

The already-observed [MIMU Pcode listing](https://www.themimu.info/place-codes) advertises
**v9.7, January 2026**, not v9.6. The historical source ID is retained for compatibility, while
the displayed version is corrected. Its dated village summary reports 66,659 villages and
54,604 with coordinates: 81.9% when rounded to one decimal place; the arithmetic remainder
is 12,055. An older 79% statement on the same page is not combined with that denominator.
Neither the older administrative totals nor these aggregate statements validate rows, national
postal coverage, point accuracy or postal assignments. PCodes are administrative identifiers,
not Myanmar Post postcodes. No XLSM/workbook, macro, camp/IDP dataset or village rows were acquired.

The [MIMU GIS reference](https://www.themimu.info/gis-resources) describes operational geometry,
scale 1:250,000 and WGS 1984. These are publisher metadata, not verified features, topology,
accuracy or permitted postal geometry. A future administrative join remains derived/contextual;
it never becomes an official postal-authority boundary merely by containment or matching names.

## Permission stop and address separation

The former terms URL, [About MIMU](https://www.themimu.info/about-us), is an agency page.
The [dedicated terms](https://www.themimu.info/mimu-terms-conditions), observed during the
initial reference preflight, restrict commercial purposes and systematic collection/database
compilation, and require specific written permission for GIS distribution and online embedding.
They also restrict automated gathering (sections 2, 5 and 9). After reviewing them, **additional
MIMU requests were stopped**. The checker excludes MIMU at both request and redirect layers.
There is no command-line consent/bypass flag. Attribution, a public link, a future retry date
or an existing subscription does not grant permission. No contract was accepted or permission sought.
Resumption needs appropriate provider permission and explicit user approval, or an independently
permitted alternative source; no authority is inferred from this review.

The [YCDC directory](https://myanmar.gov.mm/yangon-city-development-council) describes local
land/building services, not a national public address registry. No linked forms were opened or
submitted. House numbers and buildings require separate explicit permitted civic/building
relations. Exclude recipient, household, contact, owner, tenant, title, tax, cadastral-rights,
camp-location and private query/form records. Proximity, administrative containment, a model
or an AGID cell cannot establish an exact address or building relation.

## Verification and reproduction

Seven initial reference documents were byte-checked against SHA-256 receipts; three acquisition
failures were retained. The report's original UTC observation times are not replaced by the
later offline verification time. Raw HTML/PDF and rendered images were temporary, not committed.
Two government pages also have reviewed section hashes and title checks, excluding dynamic
navigation/news. The postcode hyperlink is independently bound to its label and exact URL.
MIMU metadata is checked only against the already-observed pinned bytes; no repeat fetch occurs.
The UPU check binds PDF MIME/signature to the separately visually reviewed bytes.

```text
npm run verify:postal-context-myanmar
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
npx tsc --noEmit
node scripts/inspect-postal-context-mm-sources.mjs --report <new-report>.json --curl <native-curl-executable>
```

The live command permits bounded unauthenticated HTTPS GETs only (4 MiB, 25 seconds,
approved hosts); all MIMU entries return `permission-required-no-request`. Changed content,
schema, MIME, redirects and errors fail closed. Its new report cannot recreate missing historical
source bytes or turn historical metadata into current data. Offline verification requires the
exact previously obtained documents and receipt fields; no source documents are redistributed here.

[Source receipt](../reports/postal-context-m2/mm-source-review-2026-08-28.json) and
[engineering receipt](../reports/postal-context-m2/mm-checks-2026-08-28.json) keep reference
validation separate from synthetic/regression tests. Assignment missing/duplicate rates and
national coverage remain unknown, not zero. No new repository, Dataset/Space, paid compute,
extra Hugging Face charge, public data destination, production deployment, force push or main
merge is authorized. The ledger's seven-day review reminder does not override its approval gate.
