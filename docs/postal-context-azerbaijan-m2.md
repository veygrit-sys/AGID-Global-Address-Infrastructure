# Azerbaijan M2 source and branch-directory review

Status: **M1_metadata / blocked**, reviewed 2026-08-28. No M2 data release.
The original criterion remains unchanged: M2_experimental requires pinned,
rights-cleared snapshots that reproduce experimental packs with complete lineage.

## Intended use and observed grain

The [operator FAQ](https://www.azerpost.az/az/tez-tez-verilen-suallar/umumi-br-suallar/yasadigim-unvanin-poct-indeksini-nece-oyrene-bilerem)
directs postcode users to the office/branch search on the
[Azərpoçt homepage](https://www.azerpost.az/). Its public HTML includes a single
JSON-valued Vue branches attribute: offices, their displayed codes and office
locations, plus street-number search hints. It is not a postal-area polygon
dataset or an official civic-address-to-building register.

The [aggregate report](../reports/postal-context-m2/az-source-review-2026-08-28.json)
records exact URLs, acquisition times, response hashes and schema/quality counts.
Eight reference probes returned expected content. The separate address portal
at unvanportali.az failed the bounded direct fetch; this is a run-local access
failure, not proof that the service or all public address data is unavailable.
A reference probe validates MIME and markers (and the UPU digest), not a licence.

## Quality checks and exceptions

| Check | Observed result | Risk and treatment |
| --- | --- | --- |
| Office/branch rows | 993, all with AZ plus four digits; 139 leading-zero codes | Preserve strings. Counts cover this response, not verified national coverage. |
| Within-response uniqueness | 993 distinct codes and presentation IDs, no repeats | High impact: IDs equal row indexes; no cross-edition stable identity established. Postcode is not adopted as a stable object key. |
| Record type | Empty for all 993 rows | High impact/high confidence: preserve unknown classification, never invent residential, PO Box or organization classes. |
| Coordinates | 981 decimal/range-valid pairs; 11 rejected by strict decimal parser; 1 outside latitude/longitude range | High impact: 12/993 pairs need review (1.21%). Quarantine, do not swap, repair or geocode silently. Parser rejection is not proof that the upstream position is wrong. |
| Street hints | 6,512 entries in 936 branches; 8 empty number strings | These are search hints, not enumerated official premise IDs, polygon membership or building crosswalks. No range expansion is performed. |
| Basic textual context | No missing office title, city, region or address strings | Text completeness does not validate a civic address or delivery. |
| Temporal/spatial validity | No established source edition, valid-from/to, CRS or verified position accuracy | Retrieval time and copyright year cannot supply those facts. No independent nationwide or multi-edition coverage claim. |

The HTML response was 2,701,599 bytes with SHA-256
9461e43e63eb855dd725a0abb549973be0f5b863d2d775329455612e08723cd8.
The once-decoded embedded JSON digest was
b31b721c86c7ec22a0d2a1817e150e3b22de1c82472d8e57efd320c294bccbdd.
These identify observed bytes; neither body was retained or published.
A hash without a retained source is not a reproducible fixed data artifact.

The bounded parser accepts exactly one branches attribute, decodes entities
once and uses JSON.parse without evaluating JavaScript. It rejects changed
schemas, extra fields, non-string codes, malformed UTF-8, oversized responses
and unexpected hosts. Empty coordinates never coerce to zero. Cities/regions
are counted as UI filters, not validated administrative units. No search_url,
ATM payload or duplicate_branches dataset is queried or merged.

## Rights and separate address/building authority

The [UPU guide](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/azeEn.pdf),
dated July 2019, establishes AZ plus four-digit placement and addressing
examples, not current allocations. Its pinned digest is in the profile/report.
Complete one-page text was read. A page render succeeded, but image-tool display
failed with host path error 206; visual inspection is not claimed complete.

The [official address-register guidance](https://emlak.gov.az/az/page/view/39)
positively identifies public territorial and transport names/history, property
types and numbers. Owner information also exists in the register but is not in
that public-field enumeration. Public-field access must not be confused with
owner/occupant/title access or with obtaining a versioned, reusable bulk export.

The [ÜRIS explanation](https://emlak.gov.az/az/news/view/9349-%C3%9Cnvan-Reyestri-%C4%B0nformasiya-Sistemi-n%C9%99dir-v%C9%99-sistemin-hans%C4%B1-%C3%BCst%C3%BCnl%C3%BCkl%C9%99ri-var)
describes the official address system. A branch's office address does not become
the address of every location sharing its postcode. Exact building display
requires a permitted official object ID or reviewed explicit relation; street
hints and spatial proximity are insufficient.

The [cadastre service description](https://emlak.gov.az/az/news/view/5733-Da%C5%9F%C4%B1nmaz-%C9%99mlak-nec%C9%99-kadastr-u%C3%A7otuna-al%C4%B1n%C4%B1r)
concerns registration/measurement and service fees. It does not establish that
all public address fields or all geographic layers are paid.

The live [IDDA portal](https://opendata.az/en) and its
[FAQ](https://opendata.az/en/page/faq) describe open data reuse with exclusions.
An exact postal/address dataset, publisher, licence, edition and export still
need review. Neither portal branding nor postal-sector statistics proves
postal assignment geometry. The canonical non-www URL replaces the legacy
catalog URL; no inference is drawn from the old host's failure.

The [operator privacy landing page](https://www.azerpost.az/az/mexfilik-siyaseti)
was reachable and displayed a mobile-app link. It did not establish permission
to retain or republish this office dataset. This bounded review does not assert
that reusable Azerbaijani data cannot exist elsewhere.

## AGID integration and reproduction

Operator guidance, the exact branch homepage, the exact UPU PDF and government
reference entries are now context-only/metadata-only for postal validation.
Provider authority is preserved, but a reference name/ID/URL cannot confer
current address validation. Existing AZ synthetic loader/API tests continue;
they are not real-data AGID verification. No runtime descriptor was enabled.

Run node scripts/inspect-postal-context-az-sources.mjs --report <new-report.json>
for a new bounded observation. The report is created exclusively and contains
only aggregates/hashes, not source rows, street numbers, coordinate pairs or
contact details. A future live response can differ; no archived replay or
source-data publication is claimed. Tests cover malformed data and authority
boundaries; the [engineering report](../reports/postal-context-m2/az-checks-2026-08-28.json)
records country/shared/rollout suites, catalog regressions and typechecking.

To unblock: establish exact retention, transformation and redistribution
rights and a current edition/validity/correction policy; resolve stable record
identity, type and coordinate exceptions for the selected experimental scope;
retain approved snapshots outside AGID Git; reproduce a real pack, publish
immutable artifacts at an explicitly approved destination and replay actual
AGID lookups. Independently source and license any included civic addresses,
buildings or derived geometry. The unchanged M2 definition does not require
inventing polygons or claiming national coverage from a limited pack.

No country/territory identity changed. No official, derived or virtual polygon
was generated; Nakhchivan and cross-border gaps remain unbridged.
Next read-only review: **2026-09-04**, after the pending-country pass.
Accounts, contracts, fees, new repositories/public destinations and deployment
still require approval. The next country is **BD (Bangladesh)**; no second
country was started in this run.
