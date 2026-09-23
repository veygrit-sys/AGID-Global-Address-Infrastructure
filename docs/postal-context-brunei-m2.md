# Brunei M2 source-attestation review

## Status and country criterion

BN remains **M1_metadata / blocked, not M2**. This 2026-08-28 review processed
one country only. The prior manifest named `M2_source_attested` but had no
stage definition. That target and all existing authority/privacy blockers are
preserved. The new criterion requires a complete, rights-cleared, source-attested
**current national routing-assignment edition** covering all four districts.
Locality, government-organization, branch and non-spatial P.O. box semantics
must remain separate. Coverage reconciliation, page/row identity, validity,
exceptions, exact source/terms hashes, reproducible transformation, an approved
immutable release and real AGID lookup checks are mandatory.

M2 assignment attestation does not require fabricated postal polygons, civic
addresses or building links. Those are separately sourced optional layers.
The normative definition is in the [manifest](../data/postal_country_packs/bn/postal-context/repository-manifest.json)
and [source review contract](../data/postal_country_packs/bn/postal-context/m2-source-review.json).

## Current operator versus historical material

[MTIC's 10 December 2025 announcement](https://www.mtic.gov.bn/Lists/News/NewDisplay.aspx?ID=318),
the [AITI licence register](https://www.aiti.gov.bn/licences/postal-licence/) and
[PosBru's own history](https://www.posbru.com.bn/about/) corroborate the transfer
of postal operations to PosBru on **1 January 2026**. The AITI register lists
a 15-year PPL licence. A licence establishes the operator, not a current open
postcode dataset. Historical Postal Services attribution is not rewritten.

The old `www.post.gov.bn` booklet/site failed DNS resolution in this environment;
native TLS checks of the old booklet and non-www root also failed. This is an
observed access failure, not proof that postal services or data no longer exist.
PosBru's [VPO description](https://www.posbru.com.bn/virtual-post-office/) concerns
accounts, transactions, customs and shipment services. No login, registration,
tracking or private service endpoint was queried. The reviewed PosBru footer
has empty hrefs for privacy/disclaimer/terms: no reuse grant was established.

## Real-source quality profile

The [public SKN user guide](https://www.skn.gov.bn/en/Home/UserGuide) explicitly
links the [52-page second-edition booklet](https://www.skn.gov.bn/Help/Buku_Poskod_Edisi_ke2.pdf).
The bytes were retrieved, SHA-256 pinned, and analyzed in memory. This is a
government-hosted historical copy, not proof of byte identity with the currently
unreachable Postal Services URL. PDF metadata is dated **26 December 2018**;
HTTP Last-Modified is **16 March 2026**. The latter is not an allocation edition.

| Observed table grain | Rows | Distinct codes | Relevant finding |
| --- | ---: | ---: | --- |
| Government organization | 94 | 31 | 9 repeated-code groups contain 72 rows; code is not an organization ID |
| Locality/area | 438 | 438 | 427 normalized names; names do not uniquely identify assignments |
| Postal branch | 19 | 19 | Printed serials skip 19 and end at 20; no row was invented |

There are **551 nonblank rows and 485 distinct codes across the three grains**,
54 extracted tables including the four-district key, and one entirely blank
structural row. All observed code cells satisfy the six-character syntax;
missing names/codes, malformed code cells and duplicate name-code rows are zero.
Twenty-four name cells wrap over lines. This checks the observed extraction,
not present-day validity or exact street/building identities.

The 39 locality tables match the sum of Mukim counts stated on district title
pages, but locality/area row counts do not match those pages' village counts:

| District prefix | Heading village count | Observed locality-table rows | Difference |
| --- | ---: | ---: | ---: |
| B | 194 | 192 | -2 |
| T | 82 | 84 | +2 |
| K | 81 | 84 | +3 |
| P | 75 | 78 | +3 |

This is a **high-risk completeness/grain discrepancy**, not permission to add or
drop rows. Some table labels describe areas, forests or facilities rather than
only villages; that may contribute, but the exact reason is unresolved.
The serial gap is a medium-risk identity exception, and currentness is a
high-risk temporal gap. Code/row/name equality is never a civic or building join.

The [UPU sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/brnEn.pdf)
is marked **1/2019**. It establishes syntax, district letters and typed physical,
major-customer and P.O. box formats, not current allocations. Its routing diagram
and booklet delivery-office terminology do not establish geographic boundaries.

## Rights, privacy and geographic separation

- No exact redistribution permission or current PosBru attestation for the
  booklet was established. Absence of a notice in extracted PDF text is not a
  legal finding that no rights exist; public access alone is insufficient.
- [DEPS site terms](https://deps.mofe.gov.bn/terms-of-use/) clause 2.1 positively
  permits reuse of covered content with attribution, modification notice and no
  endorsement. Scope, privacy, third-party rights, disclaimers and other terms
  still apply. These terms do not license Postal Services, SKN, PosBru or Survey
  artifacts. Published statistical aggregates are not census microdata or postal
  assignments. No blanket restriction on all Brunei government data is claimed.
- Survey [address applications](https://www.survey.gov.bn/permohonan-maklumat-peralamatan/)
  require title/site-plan/identity evidence and payment. The
  [map-product page](https://www.survey.gov.bn/peta/) is not a reusable postal or
  address-building dataset. No application, map purchase or acceptance was made.
- Geoportal returned only a small SPA shell, not the required restriction text;
  its guide exceeded the 4 MiB bounded-fetch limit and was not reviewed this run.
  Existing guide metadata is not newly certified. No portal query was executed.
- Land legislation links are reference context; no title, owner, applicant,
  household, recipient, customer or tracking data was retrieved or published.

Observed assignment geometry is **none**. Official polygons need explicit
postal boundary authority. Derived and virtual surfaces remain distinct; none
were generated. Exact house/building display requires independent permitted
civic records and an explicit stable building relation. AGID remains an index.

## Reproduce and audit

Use the pinned checkout and Python with `pdfplumber==0.11.9`:

```text
node scripts/inspect-postal-context-bn-sources.mjs --report <new-report.json> --python <python-executable> --curl <native-curl-executable>
python scripts/profile-postal-context-bn-booklet.test.py
npm run verify:postal-context-brunei
npm run verify:postal-context-m2
npm run verify:postal-context-runtime
```

The inspector permits only explicit official HTTPS hosts, bounded GETs and
small in-memory responses. It checks the exact booklet digest before parsing,
validates table headers/types, preserves separate grains and reports anomalies
without repairing source rows. New PDFs or changed schema require review.
Only counts, document metadata, hashes and checks enter the
[source report](../reports/postal-context-m2/bn-source-review-2026-08-28.json).
No rows, geometry, source PDF or production pack are stored in AGID Git.

The quality workflow informed grain separation, uniqueness/missingness checks,
coverage comparisons and exceptions. UPU pages were text-extracted and rendered;
local visual inspection failed with host `os error 206`. Web screenshots were
not inspectable. **A complete visual audit of the booklet is not claimed.**
Table extraction and synthetic tests do not substitute for full source review.

The host's npm launcher references a missing npm-cli.js; the same package script
targets were run through the installed Node/tsx executables. Dependencies were
installed from the cache with lifecycle scripts disabled. Engineering results
are in [the checks report](../reports/postal-context-m2/bn-checks-2026-08-28.json).

## Unblock and next run

Obtain source-attested current assignments from PosBru or the authorized provider,
resolve exact rights, source scope, heading/serial exceptions and change policy;
retain permitted snapshots outside AGID Git; reproduce and publish digest-pinned
artifacts at an approved destination, then run real AGID loader/API checks.
New accounts, contractual acceptance, paid access, public repositories/hosting
and production deployment still need explicit approval.

The ledger schedules a read-only review seven days after this observation,
**after all pending countries**, without granting additional authority. BN stays
blocked with no M2 evidence claim; the next pending country is **BT (Bhutan)**.
