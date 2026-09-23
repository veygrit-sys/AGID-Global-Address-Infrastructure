# Sri Lanka M2 source review — 2026-08-28 UTC

## Decision and scope

**M1_metadata / blocked; M2 not achieved.** LK previously had address-format/source inventory only,
with no country repository contract or M2 definition at base
`5cbcaf70ee94dfd5b854ac99f8b30735cde17ab8`.
This review adds an LK-specific assignment/geometry contract without changing another country's definition.

No current rights-cleared assignment release, production geometry, civic/building relation, immutable
data artifact or actual LK AGID loader/API result was obtained. The published JSON report is evidence
of reference inspection, **not a published postal dataset**. National coverage and assignment-level
missing/duplicate rates remain unknown, not zero.

## Postal source grain

[Sri Lanka Post's explanation](https://slpost.gov.lk/information/postcodes/) documents five-digit
sorting/delivery codes and the ambiguity of identically named places. The
[Sinhala-site page](https://slpost.gov.lk/si/information/postcodes/) carries the same postal explanation.
A site update date is not an assignment edition or validity period. A directory purchase reference
does not authorize buying or reproducing a directory.

The [public postcode search](https://slpost.gov.lk/postcode_new/) initially serves two HTML forms:
`frm` and `frm2`, each with a `poid` selector and the same `wgtmsr` DOM ID.
Each has 2,111 candidate options plus one placeholder. The code sets match, each with 5 values that
start with zero. The observed order also matches, but order is never used as a join key.
No missing code values, duplicate code values or duplicate normalized office labels were observed
within these selectors; that says nothing about national completeness or assignment validity.
The placeholder is excluded, and original five-digit strings are preserved.

The checker binds selectors inside their named forms, pins option-array digests and emits counts only.
It does not submit forms or verify browser behavior. A name-only join, numeric coercion, placeholder
promotion, duplicate DOM-ID lookup or a changed option list must not create assignment evidence.

## Independent administrative geometry

The [NSDI boundary reference](https://nsdi.gov.lk/boundaries) links an administrative mapping service.
Its [service metadata](https://gisapps.nsdi.gov.lk/server/rest/services/SLNSDI/Boundary/MapServer?f=pjson)
advertises 12 layers. Only five administrative layer **schemas** were inspected:

| Layer ID | Declared layer | Field count |
|---|---|---:|
| 3 | Gram Niladhari Divisions (upstream spelling retained) | 31 |
| 4 | Divisional Secretariat Boundary | 12 |
| 5 | District Boundary | 10 |
| 6 | Province Boundary | 10 |
| 7 | Country Boundary | 8 |

All five declare polygon geometry and WKID/latestWKID 4326. These are schema statements, not
verified feature geometry, counts, topology or coverage. No field name in these schemas identifies a
postal-code field; that does not prove a postal relation is unavailable elsewhere. GN/DS/census
identifiers never become postal codes.

The GN schema contains `gnd_officer_name` and `gnd_officer_phone`. No values were queried.
Future permitted intake needs an explicit public-field allowlist; wildcard, officer-contact,
customer, household, owner, title, unreviewed free-text and sensitive-layer queries remain excluded.
Neither a schema's nullability nor a service's query capability measures record quality or permission.

The [NSDI agency profile](https://www.nsdi.gov.lk/survey-department-sri-lanka) describes mapping and
cadastral responsibilities and sample building products, not a current licensed civic/building relation.
The direct Survey Department root returned HTTP 406; this is an access observation, not data absence.

## Rights, freshness and evidence

The [NSDI classification reference](https://nsdi.gov.lk/what-are-classifications-data) distinguishes
shareable and non-shareable data. Blank service copyright and a public WMS/REST endpoint are not an
exact reuse licence. Direct retrieval of [data.gov.lk](https://data.gov.lk/) and its
[draft sharing policy](https://data.gov.lk/national-data-sharing-policy-draft) failed; neither current
content nor applicability is established, and a draft is not enacted permission.

The [Data Protection Authority](https://www.dpa.gov.lk/index.php) lists the 2022 Act and 2025 amendment.
This homepage is a legal-review lead only. Historical news dates are not treated as proof of current
commencement, applicability or permission to redistribute personal data.

The bounded native-TLS checker permits only configured HTTPS hosts, unauthenticated GET, at most
4 MiB per response, a 25-second timeout and three approved-host redirects. HTTP failures, schema/MIME
changes and content drift fail closed. No tokens or raw source rows are emitted. Successful response
bytes have SHA-256 and UTC observation times; raw reference bodies are temporary only.

Three NSDI HTML bodies changed between requests while their textual content remained identical.
The checker therefore pins the explicitly reviewed article sections (excluding agency contacts),
checks page titles, and separately records full response digests. It does not auto-approve new text.
Other reviewed HTML, the option list and administrative schemas remain bound to exact reviewed bytes.
A source document digest does not imply retention of a licensed data snapshot; that M2 gate remains open.

## Promotion and next action

The exact criterion is in `data/postal_country_packs/lk/postal-context/repository-manifest.json`.
Obtain current permitted real postal assignments with office/locality scope, stable IDs, edition,
validity, source/terms hashes, multilingual disambiguation and independently licensed geometry with
an explicit temporal postal relation. If geometry is unavailable, retain explicit `none` without a
spatial lookup claim; do not create a claimed official polygon from administrative containment,
Voronoi cells, geocoding proximity or a model.

Validate real coverage, exceptions, CRS/topology, lineage, privacy and reproducible transformation.
Civic number and building display require separate explicit permitted relations.
Then obtain approval for immutable publication outside AGID Git, verify downloaded bytes and the
actual AGID loader/API. No new repository, paid compute, extra Hugging Face charge, account, contract,
public destination, deployment, force push or main merge is authorized by this review.

Retry public references only after all pending countries and the ledger's seven-day review date.
The date is not permission for restricted data or publication.

## Reproduction

```text
npm run verify:postal-context-sri-lanka
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
npx tsc --noEmit
node scripts/inspect-postal-context-lk-sources.mjs --report <new-report>.json --curl <native-curl-executable>
```

[Source receipt](../reports/postal-context-m2/lk-source-review-2026-08-28.json) and
[engineering receipt](../reports/postal-context-m2/lk-checks-2026-08-28.json) distinguish live reference
verification from synthetic/regression tests. Passing tests do not make LK M2-complete.
