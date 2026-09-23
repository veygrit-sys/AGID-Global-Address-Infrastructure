# Bangladesh M2 source and office-assignment review

Status: **M1_metadata / blocked**, reviewed 2026-08-28. No M2 data release.
The original M2_assignment criterion remains unchanged: a complete,
rights-cleared, editioned postcode and typed-office assignment must pass
authority, coverage, freshness, licence and digest checks. A scoped experiment
is not sufficient for this country's existing definition. M3 geometry/address
and M4 exact-building evidence are separate, not added prerequisites for M2.

## Observed grain and quality

The [aggregate report](../reports/postal-context-m2/bd-source-review-2026-08-28.json)
pins acquisition times, response/table SHA-256 digests and validation counts.
Three official tables were inspected, independently by source and edition.
Their grain is a displayed office row, not a unique postcode, postal polygon,
civic address or stable office identifier. The following are measured counts,
not a claim of nationwide or current assignment coverage.

| Source | Content date | Rows | Valid four-digit code | Blank code | Non-code | Distinct codes within that table |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| [Dhaka district](https://bdpost.gov.bd/pages/static-pages/6922dc7d933eb65569e10a5f) | 2022-09-18 | 162 | 52 | 109 | 1 | 52 |
| [Gazipur district](https://bdpost.gov.bd/pages/static-pages/6922dc3d933eb65569e0f312) | 2022-09-06 | 158 | 23 | 135 | 0 | 23 |
| [Eastern circle](https://pmgctg.bdpost.gov.bd/pages/static-pages/6922ded8933eb65569e1dca1) | 2025-01-26 | 2,551 | 2,551 | 0 | 0 | 475 |

Total observed rows: 2,871; syntax-valid code rows: 2,626; blanks: 244;
non-code values: one. Distinct-code counts are not summed into a national
unique total. Bengali digits are normalized for checks while script counts
are preserved; normalized syntax is not proof of allocation or delivery.

| Risk | Evidence and confidence | Required handling |
| --- | --- | --- |
| High: filling unassigned rows | High confidence: 244 blank code cells. An independent recheck of the same Dhaka table digest identified the one non-code cell as a literal backtick sentinel. | Keep blanks unassigned. Quarantine the sentinel; no numeric correction, neighbor inheritance or geocoding. Blank subordinate-office rows may be legitimate, not necessarily erroneous. |
| High: guessed office types | The district English-name suffix checks identify 111 Dhaka and 137 Gazipur rows as unknown. Regional explicit Bengali type cells map all 2,551 rows. | Preserve the seven explicit GPO/HO/TSO/UPO/SO/EDSO/EDBO classes; unknown remains unknown. Do not derive type from postcode presence. |
| High: false identity or deduplication | Eastern table: 298 repeated-code groups containing 2,374 rows; one identical non-serial row group contains two rows. Dhaka and eastern tables each have one matching printed office context with multiple codes. | One code may serve multiple offices. Matching labels are not verified identity; retain ambiguity and require source-defined IDs or reviewed corrections, not a winning row. |
| Medium: overclaimed language/context coverage | Bengali-name columns are empty in all 320 district rows despite their bilingual headers. All 2,551 regional rows lack accounting-office and head-office cells. | Declare actual field/language coverage. Do not invent translations, parent-office links or stable IDs. The regional layout has no parallel English-name column; zero missing bilingual cells there does not mean bilingual coverage. |
| High: false completeness/currentness | Two district pages and one circle page; no complete national edition or assignment validity established. | Keep scope explicit. Content dates, the 2026 site footer, HTTP modification time and capture time are different facts; none alone sets assignment validity. |

The bounded parser accepts one exact reviewed table header, strict UTF-8 and
unspanned cells. It decodes entities once and never executes page JavaScript.
Changed headers, nested/ambiguous tables, row shape, spans and size limits fail
closed. Per-table response and table digests identify observed bytes; source
bodies and office rows were not retained. Consequently this is a reproducible
observation procedure, not replay from a retained historical data snapshot.

## Access and permission findings

The current Bangladesh Post and regional hosts were reachable with Windows
curl 8.21.0 using Schannel's normal certificate validation. Node's default and
system-CA modes failed chain verification on these hosts in this environment.
The legacy bdpost.portal.gov.bd references and the SoB portal reference still
failed certificate verification using native curl. This is not evidence that
all Bangladesh data is unavailable.

The opt-in transport never disables TLS checks or reads curlrc, authenticates,
or follows redirects automatically. The common probe validates each HTTPS
redirect against a fixed host allowlist and bounds response size and time.
[curl's TLS documentation](https://curl.se/docs/sslcerts.html) explains the
native Windows trust-store behavior. No certificates, host configuration or
accounts were changed.

Six reference documents passed bounded MIME/marker checks (and the UPU digest);
three reference requests failed TLS verification. A passing reference probe
does not establish a dataset licence. BBS and DLRS were checked as reference
pages, not as downloaded datasets or fully adjudicated licence terms.

The [UPU Bangladesh guide](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bgdEn.pdf)
is dated September 2014. Its four-digit layout and routing explanation are
addressing conventions, not current allocations or geographical boundaries.
Its complete one-page text was read and a local render produced. Image-tool
display failed with host path error 206, so visual review is not claimed
complete. Recipient/contact examples were not copied to AGID. Its source
digest is pinned; the PDF is not bundled.

The [NSDI FAQ](https://new.nsdi.gov.bd/faqs/) describes generally free access/use
but reserves provider-specific conditions and SoB licensing compliance. That
does not grant Bangladesh Post assignment retention or redistribution rights.
The [NSDI catalogue](https://new.nsdi.gov.bd/datacatalog/) distinguishes product
editions, partial coverage and BUTM 2010 projection. A non-restricted label is
not a reuse licence; projected coordinates are not latitude/longitude.
[BBS census context](https://bbs.gov.bd/pages/static-pages/6922e073933eb65569e27220)
and [DLRS maps](https://map.settlement.gov.bd/) are not postal assignments,
civic-address crosswalks or authorization to retrieve protected land records.

No exact retention, transformation or redistribution grant for the reviewed
postal tables was established. Government authorship, accessible HTML, footer
accuracy statements, NSDI access or a map purchase do not settle that question.
This bounded review does not assert that reusable Bangladesh sources cannot
exist elsewhere. No registration, contract acceptance, paid order, restricted
query, personal/customer record or land-title data was acquired.

## AGID boundary, reproduction and next action

The exact postal-page IDs/URLs/labels and other BD reference catalogue entries
are context-only/metadata-only for postal validation. Their provider authority
is retained, but source-name matching cannot manufacture current assignment
evidence. Existing synthetic BD loader/API tests remain conformance checks;
no real descriptor, official/derived/virtual polygon or exact building relation
was enabled. Observed table geometry remains none.

For a new bounded observation, run:

```text
node scripts/inspect-postal-context-bd-sources.mjs --report new-report.json
```

On this Windows host the verified native alternative was:

```text
node scripts/inspect-postal-context-bd-sources.mjs --report new-report.json --curl-executable C:\Windows\System32\curl.exe
```

Reports use exclusive creation and contain aggregates/hashes only. Future live
bytes may differ; the pinned observation is not overwritten. The
[engineering report](../reports/postal-context-m2/bd-checks-2026-08-28.json)
records country, shared-runtime, rollout, catalogue and type checks, including
the host's npm-launcher limitation.

To unblock M2: identify complete current national assignment sources, establish
the exact reusable rights and provider edition/coverage/validity/corrections,
preserve blank/type semantics and resolve or quarantine identity/non-code
exceptions. Retain permitted source snapshots outside AGID Git, reproduce the
complete assignment pack, publish immutable artifacts to an explicitly approved
destination, and verify real AGID loading/lookups against those bytes. A source
hash or passing synthetic suite cannot substitute for these missing steps.
Independent address/building evidence is needed only when those separate
display levels are added; none is inferred from the office tables.

Next read-only review: **2026-09-04**, after the pending-country pass. Any new
account, contract, payment, repository/public data destination or production
deployment still requires explicit approval. No country identity or boundary
was changed. The next country is **BH (Bahrain)**; it was not started in this run.
