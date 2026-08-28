# Bhutan M2 source review

Reviewed 2026-08-28. **BT remains M1_metadata / blocked, not M2.**
The missing criterion for the existing `M2_source_attested` target is now
explicit in `data/postal_country_packs/bt/postal-context/m2-source-review.json`.
No previous criterion, hard blocker, country identity or privacy flag was removed.

## Scope and method

The [Bhutan Post locator](https://bhutanpost.bt/postcode/) exposes a public
Dzongkhag selector. The reviewed form submits two non-personal fields to
`https://bhutanpost.bt/postcode/searchpostcode-exec.php` via POST. Despite its
legacy HTML name `loginForm`, it contains no login or identity fields. The probe
sends only the district and the visible Search value, without cookies,
authentication, arbitrary parameters, redirects, account creation or transactions.

All 20 options were visited sequentially between 09:48:48.967Z and
09:49:17.081Z. The form was hashed before and after; the first district was
repeated once. This covers the observed form options, **not an attested complete
national allocation edition**. No version, validity dates, stable row IDs,
correction policy or nationwide coverage attestation was supplied by the responses.
The acquisition is non-atomic: unchanged form and one unchanged district do not
prove other districts were unchanged during the run.

Intended grain: one source tuple of `Dzongkhag / Gewog / Post Office / Postal Code`.
Postal codes remain five-character strings. All labels are retained in memory;
NFC and whitespace normalization support comparison only. No name corrections,
geocoding, postcode inference, deduplication or assignment publication occur.

## Observed quality

| Check | Observed result | Risk / action |
| --- | --- | --- |
| Selected districts | 20 of 20 returned nonempty tables | Does not prove national postal coverage |
| Four-cell tuples | 76 rows; 38 distinct office tuples and codes | Do not equate rows with unique offices |
| Duplicate tuples | 38 groups of two; 38 excess rows (50%) | High: avoid double-counting and ambiguous source identity |
| Missing required fields | 0 of 76 in each column | Syntax completeness only |
| Invalid five-digit codes | 0 of 76 | Valid syntax is not current assignment proof |
| District mismatch | 0 of 76 | Search label agrees, not a boundary relation |
| Explicit row tags | 56 rows lack opening `tr`, across all 20 responses | Medium: parser must record template defects, not hide them |
| Office suffixes | 68 PO rows, 8 GPO rows; no CMO/CC rows observed | Scope is unverified; do not assert community offices are absent nationally |
| Version and validity | None established | High: retrieval time is not source validity |
| Source geometry / civic / building relations | None | Never synthesize official polygons or precise addresses |

The likely source/template duplication needs provider confirmation; this review
does not diagnose the provider database. Four explicit cells terminating in a
closing row tag can be profiled even when an opening tag is missing, but those
rows remain unpublishable. Changed headers, spans, nested markup, partial rows,
extra fields, unknown options, invalid encoding and oversized responses fail
closed. Synthetic tests exercise those exceptions and do not count as real M2 data.

The form SHA-256 before and after is
`f2a94909ed3ba871b249124dc0fb1fbd428b37cb74959ab3437d25f286c7c74d`.
Each district's response hash, byte length, timestamp and quality counts are in
[the source report](../reports/postal-context-m2/bt-source-review-2026-08-28.json).
The ordered response-manifest hash is
`0085b5bf6e539d93767bc0a7d7fde6a30f04b588bd3729c297fabcc767ee1c2d`.
These hashes identify observed responses, not retained source snapshots or
published assignment artifacts. Raw HTML, source rows and PDFs are not in Git.

## Source and rights review

Six reference documents passed response, content-marker or pinned-PDF checks:

- [Bhutan Post downloads](https://bhutanpost.bt/downloads/): public references and
  a copyright reservation, but no exact grant for reuse of the locator dataset
  was established. This is an unresolved permission question, not a finding that
  all Bhutan postal facts can never be reused.
- [UPU Bhutan sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/btnEn.pdf):
  edition 02/2010, 166,218 bytes, SHA-256
  `b878c01e760fb749f91c3e36aedc0a0e5f65a3437adf20dbed87f1f99bfb2be9`.
  Format, routing-digit semantics and address examples are not a current
  assignment database, real address register or building-link source. The HTTP
  modification date in 2020 does not change the document's 2010 edition.
- [NLCS map access](https://www.nlcs.gov.bt/dz/?page_id=203): the described
  topographic/administrative products need an application, approval and use
  agreement, with payment for non-government applicants. Cadastral access is
  controlled. No application, purchase or agreement was made.
- [NLCS Geo-Portal description](https://www.nlcs.gov.bt/dz/?page_id=38): discovery
  of maps and metadata, not a blanket reuse licence or postal-area authority.
- [NLCS cadastral division](https://web.nlcs.gov.bt/cadastral-information-division/):
  the authority description does not make ownership or cadastral data public
  civic-address/building relations.
- [eSakor public FAQ](https://esakor.nlcs.gov.bt/faq_eSakor): reference only.
  No NDI, Thram, owner, plot, transaction or private record was queried.

The legacy `https://bhutanpost.bt/documents/postcodes.pdf` returned HTTP 404.
That failure does not prove national data absence. Third-party copies were not
used to replace current official assignment evidence. The UPU PDF text and bytes
were reviewed; visual screenshots were unavailable in this environment, so a
complete visual PDF audit is not claimed. Neither result establishes data rights.

## AGID boundary and release gate

BT catalog references now explicitly remain context-only (map access is
legal-framework-only). A source ID, URL, operator name, example or public page
alone cannot give a postal lookup a strong validation classification. Original
provider identities and trust tiers are preserved. A future rights-cleared,
source-attested dataset needs its own promotion review before runtime use.

The existing synthetic BT loader, postcode lookup, bbox, coordinate-resolution
and API tests remain relevant engineering checks, not evidence of production
data. No real BT descriptor was enabled. Postal assignment M2 does not require
fabricating geometry; `none`, official, derived and virtual remain separate.
House numbers and buildings require independent explicit civic/building relations.

Unblock conditions:

1. Obtain a current national provider-attested assignment edition, explicit scope,
   identity, validity/corrections and exact reusable source/derived-output rights.
2. Reconcile duplicate rows, missing row tags and omitted/exceptional office kinds
   with the provider; retain permitted original snapshots outside AGID Git.
3. Reproduce typed transformations and validate source lineage, hashes and coverage.
4. Publish only to an approved immutable artifact destination and verify its bytes,
   descriptor and real AGID loader/API lookups. No new destination is approved here.

The next read-only review is seven days after the observation, **2026-09-04**,
and only after pending countries have been visited. Permission, contract, payment,
private access or publication still needs separate approval. Next pending country:
**CN (China)**; no second country was started in this run.

## Reproduction

```sh
node scripts/inspect-postal-context-bt-sources.mjs --report tmp/bt-new-review.json
npm run verify:postal-context-bhutan
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
npx tsc --noEmit
```

The inspector refuses to overwrite an existing report and does not save upstream
rows. Public endpoints can change: future hashes/counts must be re-reviewed, not
edited to match this run. Exact test commands and results are recorded in
[the engineering report](../reports/postal-context-m2/bt-checks-2026-08-28.json).

Data-quality review drove the separation of source grain, duplicate counts,
freshness and authority. The machine-readable report and scripts accompany this
review so it can be inspected independently of the prose.
