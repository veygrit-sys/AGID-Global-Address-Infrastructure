# Macao (MO): no-postcode address context, M2 blocked

Reviewed on 2026-08-28 UTC against cumulative branch base
`af0dedb9efd0b85ee80774b0de18a5a2e852f561`. This is an **M1 metadata contract**,
not an address dataset, a polygon release or a new repository. MO/Macau identity
and its Traditional Chinese/Portuguese address fields are preserved.

## Country-specific completion criterion

The base had `M0_inventory` and no manifest or M2 definition. The reviewed target
is `M2_scoped_address_context`, with its exact definition in the
[manifest](../data/postal_country_packs/mo/postal-context/repository-manifest.json).
It requires a current, rights-cleared real street/civic-address release with
explicit geographic/record scope; stable source IDs or snapshot row identity;
source language fields, acquisition time, edition, validity semantics, schema
and SHA-256; reproducible transformations and real coverage/exception checks;
approved immutable digest-pinned data artifacts; and the actual MO AGID loader
and API. None of these gates is satisfied by this engineering change alone.

CTT's FAQ 17 says a local postcode system has not been adopted. `000000` is an
online-form workaround, **not a postal assignment**. All three language pages
were acquired and their specific FAQ section checked: [English](https://www.ctt.gov.mo/MacauPost/Contents/faq.aspx?lang=en-us),
[Traditional Chinese](https://www.ctt.gov.mo/MacauPost/Contents/faq.aspx?lang=zh-tc),
[Portuguese](https://www.ctt.gov.mo/MacauPost/Contents/faq.aspx?lang=pt-pt).

Consequently `postalCode=null`, postal-system state `not_used`, and official
postal geometry `none` are deliberate values, not a missing-data failure or a
request to generate polygons. Doorplates, telephone prefixes, cadastral IDs and
AGID cells must never be relabeled as CTT postcodes. An independently licensed
administrative/address geometry can supply context, but keeps its own type and
provenance. Derived/virtual regions need separate attribution and approval.

## Authority and reuse gates

[Administrative Regulation 16/2026](https://bo.dsaj.gov.mo/bo/i/2026/21/regadm16_cn.asp),
articles 25, 28 and 30, establishes the DSCC/DSSCU transition, relevant municipal
naming/doorplate responsibilities and the 2026-06-01 effective date. The separate
[HTTPS migration notice](https://www.dscc.gov.mo/redirect/redirect.html) links to
DSSCU. Legacy `dscc-macao` and `geoguide-macao` identifiers remain unchanged;
an agency transition is neither a new source row nor a data licence.

[Chief Executive Order 102/2026](https://bo.dsaj.gov.mo/bo/i/2026/21/despce_cn.asp?printer=1),
paragraph 5, requires DSSCU permission for publishing/reproducing its mapping
products and allows fees to be set. No permission, product, contract or paid
service was requested. This restriction is not generalized into a claim that
every future open-data item is closed: each exact item still needs its own
current rights review, including fields, derivatives and redistribution.

The old DSCC root/copyright requests failed the approved HTTPS redirect policy;
they were not accepted as current terms. Macao GeoGuide retrieval failed.
The [DSSCU root](https://www.dsscu.gov.mo/) and
[history route](https://www.dsscu.gov.mo/zh/aboutus/history) returned the same
5,950-byte HTML shell. The [government data portal](https://data.gov.mo/) and
[UseClause route](https://data.gov.mo/UseClause) returned the same 4,709-byte
HTML shell. Their transport bytes are hashed, but neither history/terms body
nor any dataset record was verified from those shells. HTTP 200 and a page title
are insufficient. No portal API token, feature query, address form, credential,
mapping/cadastre product or owner/occupant record was used.

## Evidence and quality boundary

[Source receipts](../reports/postal-context-m2/mo-source-review-2026-08-28.json)
record 13 initial references: **6 content-verified references, 4 unresolved HTML
shells and 3 acquisition failures**. Ten responses have byte hashes; only six
have verified document hashes. Original acquisition timestamps, content types,
byte counts and SHA-256 are retained in the
[review configuration](../data/postal_country_packs/mo/postal-context/m2-source-review.json).
Offline verification makes zero additional network requests.

Gazette pages require fatal Big5 decoding, whereas CTT uses UTF-8 and the
Portuguese FAQ contains HTML entities. Encoding declarations, titles, exact
bytes, unique FAQ/instrument sections and legal effective dates are bound before
claims are accepted. Drift, unexpected redirects, bad MIME, oversized content,
ambiguous sections or incompatible encoding fail closed and require review.
Last-Modified transport headers are not assignment editions or validity dates.

There are **zero validated real address rows, production geometry records,
explicit civic/building relations or published data artifacts** in this work.
Address missingness, duplicate rate and national coverage therefore remain
unknown (`null`), not zero. Postcode missingness is not applicable to the
documented no-postcode system. Policy and legal documents are not data coverage.

For a future real dataset, keep street, civic-address, building and AGID IDs in
separate namespaces. Preserve bilingual labels without treating them as unique
keys; do not manufacture translations, split combined text into asserted facts,
expand doorplate ranges, or infer entrances/footprints from points. House numbers
and buildings require explicit permitted records and relationships, including
one-to-many and ambiguous cases. Never derive exact addresses from containment,
proximity, name matching or postal context. Exclude personal/recipient/owner,
occupant, unit and land-rights information unless a separately approved lawful
purpose and rights review establishes otherwise; none is included here.

## AGID integration and verification

Seven current reference IDs are registered alongside preserved legacy IDs. The
MO official-source catalog remains metadata-only and cannot confer strong
address validation from an official-looking name or URL. `postalCode.format`
remains `None`, with null regex/API/rule, and JSON/YAML address fields agree.
The generic Postal Context runtime remains disabled for MO. Enabling it requires
the real no-postcode descriptor/data and actual loader/API verification above.

```sh
npm run verify:postal-context-macao
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
npx tsc --noEmit
npm run postal-context:m2:status
```

The source inspector is a bounded public-reference check, not an address API or
importer. Its live command is `npm run postal-context:mo:inspect -- --report
NEW_REPORT.json`; optional `--curl` selects an existing native curl executable.
It never overwrites a report, submits forms or queries controlled datasets.
[Engineering results](../reports/postal-context-m2/mo-checks-2026-08-28.json)
separately record tests, diff/scope audits and unchanged user work. Synthetic
or engineering test success does not promote MO to M2.

## Resume conditions

MO remains `blocked` / M2 unmet. Obtain and review a current scoped address
dataset and item-specific reuse permission, validate actual records and any
explicit geometry/building relations, reproduce transformations and quality
checks, then obtain publication approval, verify immutable artifact bytes, and
verify the real AGID integration. Source references may be rechecked only after
the pending-country pass and the ledger's retry date; that date authorizes no
restricted access, purchase or publication.

No raw pages/dumps or private data are committed. No new repository, Dataset,
Space, public destination, paid compute/inference, extra Hugging Face charge,
contract acceptance, deployment, force push or main merge was performed.
