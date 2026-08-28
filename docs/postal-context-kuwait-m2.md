# Kuwait M2 source and partial-assignment review — 2026-08-28 UTC

Status: **blocked / M1_metadata**. Kuwait's existing **M2_assignment** means
complete, current, rights-cleared **block and P.O. box assignment tables**.
It does not require a postal polygon. The original criterion, four stages,
twelve hard blockers, five-digit format and source-profile boundaries remain
unchanged. Geometry belongs to the separate later stage; no invented surface
is used to pass this review.

## Primary evidence and its limits

- The [Ministry of Communications public tables](https://www.moc.gov.kw/en/important-links?tab=2)
  render separate P.O. box and block assignments. Initial HTML contains six
  empty loading placeholders per table, not six records and not an empty
  official dataset. Public browser pagination advertises **4,262 P.O. box
  observations** and **1,396 block observations**. These UI totals are not
  independently validated national coverage.
- Only each table's first and last page was inspected: 12 P.O. box observations
  (pages 1/427) and 16 block observations (pages 1/140), at
  `2026-08-28T16:28:49.551Z` and `2026-08-28T16:29:26.322Z`.
  Of these **28** sampled rows, **8** displayed four-digit codes: P.O. box
  ordinals 4,261–4,262 and block ordinals 1,391–1,396. This is a sample-specific
  format finding, not a national error estimate. The cause is unverified;
  no leading zero is guessed, no range expanded and no source value repaired.
  National missing, duplicate and invalid-code rates remain **unknown**, not 0.
- The Ministry footer reserves rights; its observed Privacy & Policy link
  leads to an [Under Development page](https://www.moc.gov.kw/en/under-development).
  Exact bulk reuse/redistribution rights and an assignment edition were not
  verified. A working public lookup is not permission to publish a full dump.
  This does not imply that all Kuwait government data prohibits reuse.
- The [UPU addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/kwtEn.pdf)
  was downloaded, SHA-256 pinned, rendered and visually reviewed (one physical
  page). Its printed edition is **07/2002**, despite HTTP Last-Modified in 2020.
  It describes five-digit placement and distinguishes P.O. box from home/block
  addressing; its examples are not current records and are not imported.
- [Kuwait Finder](https://pacigis.github.io/?language=en) provides informational
  reference with accuracy/usage caveats, not a verified postal geometry export.
  [PACI services](https://services.paci.gov.kw/) and the
  [applications guide](https://services.paci.gov.kw/applications-guide) establish
  service/identifier context, not a licensed public address-building crosswalk.
  No Civil ID, customer, resident, owner, title or application query was made.
- The [Municipality layer metadata endpoint](https://gismaps.baladia.gov.kw/arcgis/rest/services/KM/KM_Dynamic_All_Parcels/MapServer/layers)
  failed with `curl-network-error`; this is not evidence that the data is absent.
  No feature query was made. The [CSB portal](https://gis.csb.gov.kw/en/) identifies
  Census **2011** and offers a terms-acceptance gate, which was not accepted.
  Historical statistical boundaries cannot supply a current postal assignment.

## Reproducible review, not a data release

The [source report](../reports/postal-context-m2/kw-source-review-2026-08-28.json)
contains actual retrieval times, URLs, MIME, sizes, response SHA-256 values,
content checks and sample diagnostics. HTTP failure bodies never gain a
verified-source digest. The UPU digest binds the recorded visual review;
changed PDF bytes require a new visual review.

The browser capture digest identifies the exact serialized DOM observations,
**not signed network data or an immutable published assignment artifact**.
The two captures are not atomic. Transient source cells are not committed;
only sample counts, invalid-code lengths, ordinals and explicit denominators
are published. Future public UI observations can be independently recaptured
and profiled, but the private temporary capture cannot be recovered from its
digest after cleanup. Reproduction of this particular sample requires retaining
the same bytes outside Git with separately approved rights/storage.

```text
node scripts/inspect-postal-context-kw-sources.mjs --report NEW.json --dom-captures PRIVATE_CAPTURE.json
# Optional native verified-TLS transport: --curl C:/Windows/System32/curl.exe
npm run verify:postal-context-kuwait
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
```

Without `--dom-captures`, the inspector performs only bounded anonymous primary
reference GETs. Capture schema is `postal-context-kw-dom-capture/v1`, with two
first/last-page captures at the exact Ministry URL. Each carries `url`,
`observedAt`, `capture`, and two ordered tables, each containing `heading`,
`header`, string `rows`, visible `containerText` and pagination `buttons`
(`text`, `disabled`). Headers/classes, column counts, row-to-visible-text
binding, page totals, chronology and byte limits are checked. No authentication,
hidden endpoints, server-action replay, query submission or terms acceptance
is performed by the inspector. Samples/tests alone never satisfy M2.

## AGID boundary and next gate

`kuwait-post` remains an authoritative **discovery** source, but now has
`metadata-only` validation readiness. Together with the other six KW catalog
sources, its ID, label or URL alone cannot yield strong assignment validation.
The existing KW descriptor/route runtime and synthetic fixtures are unchanged.
No real loader, current assignment release or production geometry is claimed.

To unblock M2, obtain complete current rights-cleared Ministry **both-class**
tables; resolve the four-digit observations using primary evidence; retain
five-digit string identity, area/governorate/block or P.O. box-range grain,
version, validity, capture time, terms and SHA-256. Validate class-specific
coverage, missing/duplicate/range exceptions and reproducible transformation.
Then obtain explicit approval for the publication destination, publish fixed
artifacts outside AGID Git, verify bytes/digests and exercise the actual AGID
loader/API. P.O. boxes remain non-spatial. Optional derived geometry and exact
street/building display require their own licensed inputs and explicit links;
they are neither inferred nor prerequisites added to Kuwait's M2 definition.

Retry public evidence after seven days **and after all pending countries**.
That review does not authorize contracts, accounts, paid compute, private
queries, new publication destinations or deployment. Next queued country: KZ.
