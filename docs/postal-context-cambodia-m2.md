# Cambodia M2 source audit — 2026-08-28 (UTC)

KH remains **M1_metadata / blocked**, not M2. This is a reproducible source
quality and runtime-guard change, not a production postal dataset or a claim
that Cambodia lacks public data. The missing named M2 stage now retains the
prior [runtime Promotion contract](postal-context-cambodia-runtime.md): typed
current assignments, independently licensed point/area geometry, CRS/topology,
administrative crosswalks, civic/building-link review, privacy/licence review,
approved fixed artifacts and actual AGID loader/API verification. All nine
hard blockers remain unchanged.

## Captured data and independent authority

The [MPTC Prakas 77 PDF](https://file.go.gov.kh/mptc/prakas-postal-codes.pdf)
is 9,052,096 bytes, signed/effective 2025-12-30. Its SHA-256 is
`52f34f7dd5f696e1d3d0acb1789801524c37db3f3705849170f5db322bc48244`.
The PDF has 59 image-only pages (no extractable text on any page).
Full physical pages 1, 2, 3, 26, 27, 28, 58 and 59 were visually reviewed this
run; this is **not full-row reconciliation**. Typed provincial, district and
commune assignments are not coordinate geometry.

The [ODC postal-code dataset](https://data.opendevelopmentcambodia.net/en/dataset/postal-codes)
declares version 1, citation date 2025-12-30 and metadata modification
2026-05-27T07:56:13.947984 (no timezone supplied). It describes converting the
PDF to CSV but does not provide a verified executable conversion in the
captured metadata. All six public resource URLs were downloaded and profiled.
The Khmer/English-labelled pair at each level is byte-identical and bilingual,
so six downloads represent three unique tables, not double the coverage.

| Source-table grain | Active rows | Leading-zero postal strings | Duplicate-code excess | Postal vs own administrative-code disagreements |
|---|---:|---:|---:|---:|
| Province/capital | 25 | 9 | 0 | 0 |
| District/municipality/khan | 210 | 88 | 1 (0.476%) | 7 (3.333%) |
| Commune/sangkat | 1,652 | 768 | 0 | 43 (2.603%) |

All 1,887 active rows have six-digit postal strings and non-empty expected
fields. District CSVs each contain 791 wholly blank padding records; these
are counted separately, not called missing assignments. Source administrative
keys are unique at each level. Five commune observations disagree with their
administrative parent prefix. Joining by the supplied administrative keys
finds all parents, but 38/1,652 commune observations (2.300%) disagree with
the joined district postal prefix. These comparisons are diagnostics, not
proof of invalid official assignments or boundary equivalence.

One conflict **is independently confirmed**: district source record ordinal
78 (header excluded) differs from the visible primary PDF on physical page
26, appendix row 8.10. Its CSV postal string duplicates record ordinal 69.
The exact CSV and PDF digests bind the observation. No code was automatically
repaired, no rows were deduplicated and no real source row is bundled here.

The unique CSV hashes (SHA-256) are:

- Province: `5a80653e0e6d5b66ecf50a6d9bfcdc3994e3d64aa2223e51a940537c95cf2b26`
- District: `15061e50c30ea1e429822ecbe64e7e2703397289ef146c0033e19a012364149e`
- Commune: `307733c90a50e8291ca3a87e7f798b51d78a6c4c0abf945c80c93a5ff3dc80f0`

Three of six publisher size fields differ from actual byte lengths. Publisher
hash fields are opaque and not used for integrity. Repeated district bytes
and dataset metadata match; that is repeatability, not an atomic release,
effective-date attestation or complete current national coverage.

The [UPU format sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/khmEn.pdf)
was initially unavailable but subsequently returned the one-page 11/2018
sheet; that exact PDF was visually reviewed and hashed. It supplies dated
format semantics only. The NCDD Gazetteer and Cambodia Post homepage were
reviewed as public references, with no geometry download or civic/property
query. NCDD administrative identity is not MPTC postal geometry. Neither
postcode containment nor a formatted address establishes a building relation.

## Rights and release gates

ODC metadata declares `cc-by-sa` via a generic non-versioned link; its original
materials footer and [terms](https://opendevelopmentcambodia.net/terms-of-use/)
name CC BY-SA 4.0. Those terms, last modified 2015-11-04, also restrict
commercial gain beyond cost recovery and refer to third-party terms. The
scope/precedence needs clarification for the intended release. This is a
conservative publication gate, not a conclusion that all reuse is forbidden.
The separate law record has `notspecified` as its licence; a copyright flag
does not establish upstream public-domain status. The
[CC BY-SA legal code](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en)
does not establish that a licensor controls every upstream right. Pin exact
file-to-terms lineage, attribution, modifications and share-alike treatment.
No account, clickthrough or explicit contract acceptance was performed.

To unblock, obtain a verified full transformation/reconciliation with resolved
exceptions, current validity and exact reuse rights; independently licensed
geometry and reviewed administrative crosswalks; documented civic/building
and privacy review; approval for immutable data publication outside AGID Git;
and a real AGID pack/loader/API check. No new repository, HF Dataset/Space,
paid operation, inference job or production deployment was created. Existing
HF subscription does not authorize additional spending or publication.

## Reproduce and verify

`node scripts/inspect-postal-context-kh-sources.mjs --report <new-file.json>`
performs bounded, unauthenticated HTTPS reads with verified TLS, public CKAN
identity checks, strict UTF-8/CSV parsing and all-row aggregate diagnostics.
It never persists raw response bodies. Changed PDF bytes require human review
and changed resource bindings fail closed. Visual comparison is an explicitly
separate manual step, not falsely automated OCR. It cannot promote M2.

The [source receipt](../reports/postal-context-m2/kh-source-review-2026-08-28.json)
pins retrieval times, bytes, metadata, digests, exceptions and repeat checks.
The [engineering receipt](../reports/postal-context-m2/kh-checks-2026-08-28.json)
records actual country/shared/catalog tests, typechecking, base GitHub
verification and code digests. Synthetic checks validate engineering only.
Assignment-level missing/duplicate rates remain unknown because zero current
assignment rows are validated; source observation rates must not replace them.

The ledger records the retry date, unblock condition and separate authority
gates. Retry public sources only after all pending countries and the due date.
Raw source bytes and this run's temporary worktree are removed only after
GitHub commit/content verification; all pre-existing user changes stay intact.
