# Israel M2 source review — 2026-08-28

## Result and country-specific criterion

**M2 is not achieved.** IL remains `M1_metadata`, `blocked`, with no promotion
evidence or real published pack. The previous manifest had no named M2 stage;
`M2_licensed_assignment` now formalizes its existing rules, without changing
any of the nine hard blockers, runtime fixtures, territorial identity or
postal-system semantics.

M2 requires a current, rights-cleared Israel Post assignment artifact,
complete for its explicitly declared source-stated coverage, with seven-digit
string codes, postal-object types, validity and immutable source/terms
digests. It must be reproducibly transformed, published to an approved fixed
destination and verified by the actual AGID loader/API. Geometry, civic
addresses and building relations require independent source authority and
permissions if included. Neither national coverage nor official polygons
are presumed. A government street sample cannot substitute for assignments.

## Primary evidence and what was actually acquired

The [aggregate receipt](../reports/postal-context-m2/il-source-review-2026-08-28.json)
records requests at 2026-08-28T12:24:05.981Z–12:24:17.460Z. Successful response
bytes were hashed in memory; source bodies were not retained in this Git
repository. These are observations, not recoverable, pinned source snapshots.

| Primary source | Observation | Limit |
| --- | --- | --- |
| [Israel Post terms](https://israelpost.co.il/pages/termsofuse) | Direct request returned HTTP 403. Search-indexed primary text was readable and describes information-only, nonbinding use, restrictions on official/commercial reliance and reserved rights. | No current terms body or effective edition pinned; cached text is not a new licence snapshot. No postcode queries or authentication performed. |
| [Data.gov.il terms](https://data.gov.il/terms-of-use) | Direct request returned 404. Indexed primary text identifies an update on 2025-08-30 and conditional reuse with attribution. | Item overrides, privacy and third-party rights still require review. The 404 response's 2024 Last-Modified is an error asset, not the licence/data edition. |
| [Population Authority street catalogue](https://data.gov.il/he/datasets/population_authority/321) and [API documentation](https://data.gov.il/api/1/util/snippet/api_info.html?resource_id=9ad3862c-8391-4b2f-84a4-2d4c68625f4b) | Direct page requests returned 404; indexed API documentation identifies the public CKAN resource. | Page failure does not prove that the dataset disappeared: the exact public API worked. No protection bypass attempted. |
| [Official package metadata](https://data.gov.il/api/3/action/package_show?id=321) | HTTP 200 twice; dataset `d2581732-eca4-4988-b986-df8e791a1d60`, organization `population_authority`, resource `9ad3862c-8391-4b2f-84a4-2d4c68625f4b`, CSV datastore active. | `license_id`, `license_title` and resource hash were empty. Empty item licences alone neither grant nor prohibit reuse; current default terms and overrides remain unpinned. |
| [UPU addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/isrFr.pdf) | HTTP 200, one page, visually inspected, edition 10/2022; 134,613 bytes, SHA-256 `88584e23c0cedcf91081f6f515e3027ef43d250ba9c50ddc496d23ab072b20ac`. | Seven digits precede the locality. Examples and cross-border routing notes are format/routing references only, not current assignments or boundary evidence. No examples or contacts copied. |

Metadata modification times were `2026-08-16T00:31:01.131577` for the package
and `2026-08-16T00:30:50.716977` for the resource. Their timezone is not stated;
they are not postal validity dates. Metadata bytes (34,270) matched on repeat:
SHA-256 `5055775a87e5a55c7c2dfcf64e0be394c91c8dbe032babb635e245cc60faf9d3`.
The dated CSV URL was checked as lineage metadata but never downloaded.
Maintainer/contact fields were not exported.

## Bounded street quality inspection

The public `/api/3/action/datastore_search` request used the exact resource,
`sort=_id asc`, `limit=50` and offsets **0, 50, 0**. Two initial pages gave 100
row observations; the 50-row repeat matched both response bytes and normalized
tuple digest. All three pages reported 63,571 rows, explicitly not an estimate.
That is the source-reported street total, not validated national/postal coverage.

Only the five expected fields were accepted: resource-local row ID, locality
code/name and street code/name. Comparison uses **locality code + street
code**. Street codes were reused across localities (one shared code on the
first page, six on the second), so street code alone is not a global key.
Both initial pages separately had zero missing names, invalid codes/names,
duplicate row IDs and duplicate composite keys; their observed ID ranges
were disjoint. This is a per-page profile, not a whole-dataset uniqueness test
or a cross-page composite-key audit.

Codes arrived as JSON numbers; string transport codes, if encountered, retain
leading zeros without guessed padding. The `_id` is not a durable civic ID.
Code `9000` and equal locality/street labels occurred on two rows then one row;
these are diagnostic counts only, not documented sentinel meanings. No
normalization invents postal codes or house numbers.

No postal-assignment, house-number, coordinate, civic-address, building or
AGID-relation fields exist in the accepted schema. All such output counts
are zero; geometry is `none`. Stable repeated pages and metadata do not
establish an atomic snapshot, postal validity or a complete dataset.

## AGID safety change

The Israel Post source keeps its `authoritative` postal-operator provenance,
but its catalog readiness changes to `metadata-only`. Source ID, URL or name
alone therefore cannot supply strong validation or become a preferred
production source without real artifact evidence. Other IL source permissions,
the address format, country policy and runtime geometry are unchanged.

The separate nine-digit distribution code remains non-postal. PO boxes,
routes and other non-area objects are not forced into polygons. Street
proximity does not grant civic-address or building display. The UPU routing
note concerning Palestinian localities does not define IL coverage,
sovereignty or borders. No country/territory identity is changed.

## Reproduction, remaining work and authority

Run `node scripts/inspect-postal-context-il-sources.mjs --report <new-path.json>`
to repeat the bounded public inspection. It refuses to overwrite a receipt,
follows no bulk/next links, enforces host/MIME/schema/request/size limits and
persists only aggregate counts and hashes. Live responses may change; the
recorded receipt is not a claim of perpetual availability. The source
contract pins the UPU digest and review scope. JSON bodies are capped at
2 MiB; the shared reference reader also imposes a bounded response limit.

Use `npm run verify:postal-context-israel`, `npm run verify:postal-context-runtime`,
`npm run verify:postal-context-m2` and `npx tsc --noEmit` with installed tools.
On this host the npm launcher is broken, so the corresponding installed
`node_modules/tsx/dist/cli.mjs` and `node_modules/typescript/bin/tsc` entry points
are invoked directly. The [engineering receipt](../reports/postal-context-m2/il-checks-2026-08-28.json)
records exact commands, counts, code hashes and audit scope. Synthetic tests
test software behavior; they do not prove M2 data completeness.

Unblock with the current licensed assignment and full declared-scope checks,
exact permitted source/terms snapshots, object exceptions, privacy review,
reproducible conversion, approved immutable publication and actual AGID
loader/API verification. Independently clear street data rights before
production reuse. Recheck public references **2026-09-04T12:24:05.981Z**, only
after all pending countries. No login, agreement, restricted dataset, paid
service, new repository/Space/destination or deployment is authorized by the
retry date. No Hugging Face resources or additional paid operations were used.
Next pending country is **IN (India)**; no work on IN was started here.
