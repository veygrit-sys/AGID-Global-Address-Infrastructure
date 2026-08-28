# Mongolia M2 review — 2026-08-28

Status: **M1 retained; M2_source_attested blocked**. This is source and engineering
evidence, not a national postal dataset or a production release. The existing
target and all eleven hard blockers are retained. Only MN was processed.

## Edition and count conflict

The [dated CRC explanation](https://admin.crc.gov.mn/list/shuudan/mn) of
2025-05-23 describes five digits, cites MNS 6775:2024 and reports 2,721 codes
(1,993 in the aimags plus 728 in the capital's districts). This is a publicly
readable publisher page, not an authenticated administration operation.

The [other live CRC page](https://www.crc.gov.mn/shuudan/suudangiin-negdsen-kod-xaiagzuulalt-2)
instead reports 2,720 for 2025 (1,992 + 728), alongside MNS 6775:2019 and a
five-digit zone/nine-digit building-assignment explanation. Its newer hostname
and footer do not resolve this mixed-version content. Neither count is accepted
as a validated national coverage denominator; reconcile with the publisher and
an exact effective assignment release before promotion.

The [public directory](https://zipcode.mn/page/docs/1.pdf), linked by the
[official viewer](https://zipcode.mn/page/docs/), is 4,804,305 bytes, 91 pages.
SHA-256: `2f612a3fbaaf54719d6626756225872f5a27c5faa2266b4f0a5e0b6a2b28dfb5`.
Pages 1–2 were rendered and visually checked: printed 2024 edition, order A/24
dated 2024-09-30, five-digit description and reported total 2,721. It also prints
an extended organization address. This is not proof that all nine-digit codes
were repealed or remain currently assigned. No directory-wide row validation was
performed. The mutable URL and downloaded bytes are not an approved immutable
AGID data artifact. The viewer's 2023 timestamp and PDF's 2025 HTTP modification
date are not the postal edition; local acquisition time is used, not server Date.

The [UPU sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/mngEn.pdf)
is printed **01/2019**, despite its 2020 HTTP modification time. Both pages were
visually checked; it shows five-digit placement, an extended organization example,
urban/rural/P.O. Box patterns and a glossary. Examples and contacts are not ingested
as real assignments or addresses. Historical source IDs and five/nine-digit
compatibility parsing remain intact, including leading zeros and Cyrillic fields.

## Data quality and rights

The [NSO selector page](https://data.1212.mn/pxweb/en/NSO/NSO__Regional%20development__Territory%2C%20administrative%20units/DT_NSO_0100_001V1.px/)
offers four indicators, 31 regional selections and 11 years (2014–2024). This is
metadata, not downloaded observations. `Ulaanbaatar` labels two distinct keys,
`7` and `711`: never merge by label. Totals and administrative levels overlap;
counts, thousand-square-kilometre areas and population density cannot be summed
together. Potential grain is indicator key × region key × year key in the exact
table edition. Missingness and postal coverage remain unknown, not zero.

The [Gazar address system](https://address.gazar.gov.mn/mn) describes 100 km,
10 km and 10 m grids. Government grid identifiers are neither CRC postcodes nor
AGID cells. The [standards page](https://gazar.gov.mn/service/spatial-data) lists
MNS 6925-15:2021 address and MNS 6925-16:2021 boundary specifications, not licensed
geometry records. No coordinate system or feature accuracy was validated here.

The [postal laws page](https://www.zipcode.mn/laws) provides legal/service
references, not an established dataset reuse grant. No exact rights-cleared CRC
assignment or Gazar geometry/building release was established. Public viewer,
FAQ, standard, regulator status and downloadable PDF do not imply permission to
republish their data. Five native HTTPS acquisitions failed, including the older
CRC explanation and four English Gazar pages; no TLS bypass was attempted.

## Changes and reproducibility

- All 18 acquisition receipts retain original local timestamps; 13 exact source
  byte digests were verified offline, five failures retained without fake hashes.
- `scripts/inspect-postal-context-mn-sources.mjs` checks edition/count bindings,
  selector keys/units, MIME, byte caps and exact reviewed hashes. Content changes
  require re-review. It never promotes a document to a production assignment.
- Live checks use bounded unauthenticated HTTPS GETs only (4 MiB, 25 s). The larger
  directory is excluded from the automated check; its one-time manual download
  used an 8 MiB cap and the same verified TLS. A changed PDF needs new rendering
  and explicit review. No form submissions, private lookups or feature queries.
- The MN catalog now treats portal names/URLs as metadata-only, not strong
  assignment/address validation. Dated CRC sources are discoverable. Existing
  synthetic graph, API, normalizer and shared runtime implementation are unchanged.
- [Source receipts](../reports/postal-context-m2/mn-source-review-2026-08-28.json)
  and [engineering checks](../reports/postal-context-m2/mn-checks-2026-08-28.json)
  record exact bytes, tests and scope. Raw pages/PDFs are temporary, never committed.

Run `npm run postal-context:mn:inspect -- --report NEW.json --curl C:/Windows/System32/curl.exe`
for the bounded public-reference check. Reacquire exact URLs from the config;
compare their SHA-256, edition, rights and content rather than refreshing hashes
blindly. Offline inspection uses the original receipts and bytes and performs
zero new requests. Parser tests use synthetic HTML only and are not real-data M2.

To unblock: resolve current assignment semantics/counts; acquire exact licensed
records with version, validity, schema and digests; validate real records,
exceptions and coverage; keep missing geometry `none` and permitted joins `derived`;
obtain separately permitted civic/building relations; reproduce the transformation;
approve immutable publication outside AGID Git and verify downloaded artifact bytes
and the actual MN AGID loader/API. No new repositories, public destinations,
paid compute, extra Hugging Face charges, contract acceptance or deployment occurred.

The rollout ledger records a seven-day review date. Retry public references only
after all pending countries; controlled services, publication or purchases still
require approval. Next pending country is **MO**; it was not started in this run.
