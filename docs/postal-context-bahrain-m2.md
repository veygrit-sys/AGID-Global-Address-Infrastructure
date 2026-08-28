# Bahrain M2 source and landmark-context review

Status: **M1_metadata / blocked**, reviewed 2026-08-28. No M2 data release.
The original M2_assignment definition is unchanged: complete rights-cleared
postcode-block assignment and non-spatial P.O. box-delivery rules must pass
authority, range, coverage, freshness, licence and digest gates. M3 geometry
and civic addresses and M4 exact buildings remain separate stages.

## Actual data and intended grain

The iGA [landmark dataset](https://www.data.gov.bh/explore/dataset/geographical-locations-of-landmarks/api/)
contains selected public-place points with numeric block labels, bilingual names
and governorate context. Its metadata and all 27 current rows were inspected
through the public Explore API. The [aggregate report](../reports/postal-context-m2/bh-source-review-2026-08-28.json)
pins exact URLs, capture times, response hashes, schema and quality results.
No source rows, names, coordinate pairs or original datasets are bundled.

| Quality check | Observed evidence | Risk / treatment |
| --- | --- | --- |
| Completeness at the actual grain | 27/27 landmark rows; matching metadata before and after retrieval | This is one complete observed point response, not complete national postal assignment. |
| Block syntax / repetition | 27 numeric integer labels within the existing BH range, 20 distinct blocks; five repeated groups contain 12 rows (44.4%) | High risk if used as postcode identity. Multiple landmarks per block are legitimate; no deduplication or postcode inference. |
| Counter and names | 27 distinct counters, contiguous 1–27; 27 normalized English names, no exact duplicate rows | Counters order this query; one snapshot cannot establish a persistent civic/office/building ID. |
| Missingness / context | No missing block, bilingual name or governorate label; four governorate labels with no bilingual mapping conflict | Source-field completeness does not prove official address hierarchy or postal allocation. |
| Coordinates | 27 distinct pairs; all finite/range-valid; longitude/latitude columns agree exactly with the Point field | No repairs. Agreement is not an accuracy measurement or provider CRS declaration; geographic reference metadata is null. |
| Geometry shape | Record geometry is Point; catalogue bbox is Polygon | High-confidence, high-impact distinction: the bbox is an envelope, not a postcode/block boundary. |
| Temporal evidence | Data processed 2026-04-28; matching metadata during capture on 2026-08-28 | Processing time is not assignment valid-from/to, correction history or an immutable source edition. |
| Postal/address/building relation | No postcode, civic identifier or explicit building relation field | Critical gap for the requested M2 grain. A numeric block cannot fill these missing relations. |

The ordered records response SHA-256 is
a11af9552ab525d00dfcf3158176115bb0c70da1bd6d739eef41286ba7e5f5e0.
Both metadata observations have SHA-256
d800266de2bb4a97944dd42f46bf14b5d733ff0d7943cc7794e067330866591d.
A digest identifies observed bytes; it does not supply a retained historical
snapshot. This review provides a reproducible observation procedure, not a
replayable data release. Quality conclusions are limited to this response.

The bounded English catalogue searches returned six postal-related metadata
entries and zero matches for block. The six schemas describe mail/parcel or
mailbox statistics, not explicit postcode-block assignments. Their underlying
records were not queried. Search coverage is not a national absence proof;
metadata search does not enumerate all fields, languages or external systems.

## Positive reuse basis and its limits

The [portal terms](https://www.data.gov.bh/pages/terms-and-conditions/), updated
7 October 2025, cover this site and linked iGA-owned sites. Their actual body is
HTML encoded inside a JSON string, not the page shell returned by many readers.
It was decoded without executing JavaScript and checked for required clauses.
Source/extraction-date attribution, transformation notice, the prescribed
disclaimer, sublicence propagation and conditional removal remain obligations.
Liability, indemnity and governing-law provisions were also reviewed.

The portal footer separately links the [Bahrain Open Government Data License](https://nea.gov.bh/Documents/OpenDataLicense.pdf),
version 1.0 dated 20 May 2025. All five bilingual pages were text-read. It gives
a royalty-free reuse basis for officially published government open datasets
on the portal **or other government websites**, subject to its obligations and
personal/confidential/restricted-data exclusions. Prior blanket portal-only
wording was corrected. A government viewer, certificate or ordinary document
does not thereby become an open dataset. Both governing documents are recorded
as references; applicability, disclaimer and removal governance must be reviewed
for an actual release. Null licence fields in the landmark metadata are not
treated as proof that no reuse rights exist.

No account, click-through agreement, contract submission, paid map/certificate
or protected query was performed. This statement describes actions taken; it
does not negate either document's conditions on implicit use. No dataset
sublicence or new publication destination was created. This is an aggregate
preflight report, not distribution of the point dataset or an M2 pack.

## Postal and civic authorities remain distinct

The [UPU guide](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bhrEn.pdf)
is dated January 2024. Its full one-page text establishes three/four-digit
format and separates home from P.O. box addressing. It does not publish a
complete current postcode-block crosswalk. A P.O. box is non-spatial delivery
evidence, never a subscriber, home, catchment or building footprint.

The [Bahrain Post directory](https://www.bahrainpost.gov.bh/en/images/pdf/services-directory-eng.pdf)
timed out in this run using both Node and normal native-curl TLS. The non-www
reference returned HTTP 403. These bounded failures are recorded, not bypassed
and not generalized to all national data. Its current bytes/edition are not
claimed verified from search snippets.

[iGA address services](https://www.iga.gov.bh/en/category/building-and-establishment-address-services)
describe official certificates and unit numbering, including applications and
identity/ownership evidence. These workflows do not expose a reusable public
address-to-building dataset. [Municipal map exploration](https://www.mun.gov.bh/newportal/ar/municipal-affairs/services/almstkshf-albldy-aljghrafy)
is a free viewer; free access does not establish vector reuse or postal authority.
[SLRB cadastral services](https://www.slrb.gov.bh/en/cadastralsurveys) concern
property boundaries and requested/purchased survey products, not postal blocks
or public owner records. None was queried for private records or ordered.

Five reference documents and the embedded terms passed content checks. The UPU
and licence PDFs have expected digests pinned. Local page renders were produced,
but the image tool failed with host path error 206; completed visual review is
not claimed. The source PDFs and renders are temporary and are not in AGID Git.

## Reproduction, AGID and completion gates

Run a new bounded observation with:

```text
node scripts/inspect-postal-context-bh-sources.mjs --report new-report.json --curl-executable C:\Windows\System32\curl.exe
```

Omit the optional curl argument to skip alternate postal-PDF transport checks.
Requests use fixed HTTPS hosts, manual redirect validation and byte/time limits,
with no authentication or TLS bypass. Metadata schema is checked **before**
record access; field expansion, private-field additions, unexpected shapes and
oversized responses fail closed. A report is created exclusively, never
overwritten. Future source changes require renewed review.

Precise BH source IDs, URLs and labels now remain context-only or
legal-framework-only for AGID postal validation. Provider authority is retained.
No real runtime descriptor, postal polygon or exact building relation was
enabled. Existing loader/API fixtures are synthetic, not real-data M2 evidence.
The [engineering report](../reports/postal-context-m2/bh-checks-2026-08-28.json)
records country/shared/rollout/catalogue checks and typechecking.

To unblock: identify the complete current authoritative postcode-block relation
and source-qualified P.O. box rules; establish exact source coverage, edition,
validity/corrections and applicable reusable rights; retain permitted snapshots
outside AGID Git; reproduce an assignment pack; publish immutable artifacts at
an explicitly approved destination and verify actual AGID loading/lookups.
Preserve disclaimer, sublicence and removal obligations. Do not invent M3/M4
geometry or civic-address links to make M2 pass.

Next read-only review: **2026-09-04**, after the pending-country pass. New accounts,
contracts, payments, public destinations/repositories and deployment still need
approval. Country identity and boundaries are unchanged. The next country is
**BN (Brunei)**; it was not started during this run.
