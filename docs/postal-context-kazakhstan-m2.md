# Kazakhstan M2 evidence review — 2026-08-28 UTC

Status: **blocked / M1_metadata**. The previous runtime document already required
typed current assignments, independently licensed point or area geometry,
current/legacy validity, CRS/topology, RKA/building-link, privacy, jurisdiction
and provenance review. The manifest lacked machine-readable stages. This review
formalizes that existing requirement as **M2_typed_assignment_geometry**, keeps
all ten hard blockers and adds no forced polygon or automatic building claim.

## Primary evidence and limits

- The [UPU addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/kazEn.pdf)
  was downloaded, hashed, rendered and visually reviewed on both physical pages.
  Its printed edition is **07/2025**. It documents current `LNNLNLN` and legacy
  `NNNNNN` coexistence; examples are not a current assignment directory.
- The [postal-index rules](https://adilet.zan.kz/rus/docs/V1600014158), including
  the amendment effective **2026-07-12**, describe the first letter as the
  capital/region/republican-city component, two digits as the address block and
  the remaining pairs as the object within that block. The national operator
  assigns codes to registered real-estate objects. Section 11's free database
  access provision is not evidence that this project acquired a complete
  current dataset or verified its bulk redistribution rights.
- The [addressing rules](https://adilet.zan.kz/rus/docs/V2600038643) have general
  effect from **2026-07-01**, with specified provisions including section 62
  effective **2026-07-12**. Section 62 defines RKA length as **16 characters**.
  The former metadata wording “16-digit” was too restrictive; this review does
  not establish an alphabet or add an RKA validator. RKA remains separate from
  both postal-code types and cannot itself establish a footprint or owner.
- The [NSDI rules](https://adilet.zan.kz/rus/docs/V2300032134), effective
  **2025-01-01**, provide free self-service for generally accessible spatial
  data. Copies and other request mechanisms may differ. Exact dataset rights,
  state CRS, assignment links, privacy and publication still need review.
- The public [QazPost service-26 documentation](https://open.post.kz/services/details/26)
  explicitly requires a bearer token. The rendered document was observed at
  `2026-08-28T16:59:50.182Z`. Both of its **two example records** have null X/Y
  coordinates. This denominator describes documentation only, not national
  data quality. Nulls are never converted to zero coordinates. The separate
  response-structure schematic says coordinate fields are strings and is not
  parseable JSON as displayed; this does **not** prove that live API responses
  are invalid. No live request, example address/code/RKA link or login was used.
- The [address certificate page](https://www.gov.kz/services/3690?lang=en)
  describes login and digital-signature requests. The [NSDI portal](https://map.gov.kz/)
  is a discovery entry point; the [rights-register page](https://www.gov.kz/memleket/entities/adilet-mng/activities/11887)
  is an explanatory page, not an address/building data release. No certificate,
  identity, parcel, owner or rights query was performed.

The bounded HTTP review obtained **seven verified reference bodies**, three
application shells ([operator](https://post.kz/?lang=en), API documentation
entry point and [cadastral map](https://map.gov4c.kz/egkn/)), and one
`curl-tls-verification-failed` result for the existing
[English Post Law reference](https://www.adilet.zan.kz/eng/docs/Z1600000498).
TLS verification was not disabled. A shell or failed request is not evidence
that the underlying data is absent. Rendered API documentation is recorded
separately from its initial HTML shell.

## Reproducible review, not a release

The [source report](../reports/postal-context-m2/kz-source-review-2026-08-28.json)
records retrieval times, URL, MIME, byte count, SHA-256 and content checks.
The three legal documents bind their title, document ID and exactly one
normalized article digest. Effective dates come from reviewed text, never
the HTTP Last-Modified header or a changing database footer. Changed article
or PDF bytes require a new review; failure bodies receive no verified-source
digest. Hashes identify observed bytes, not a permanent upstream version.

```text
node scripts/inspect-postal-context-kz-sources.mjs --report NEW.json --api-doc-capture PRIVATE.json
# Optional native verified-TLS transport: --curl C:/Windows/System32/curl.exe
npm run verify:postal-context-kazakhstan
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
```

Without a capture, the inspector makes only bounded anonymous reference GETs.
A public browser capture has exactly `url`, `observedAt`, `title` and `text`
(visible body text), serialized as UTF-8 JSON. Exact page/title/auth-notice
binding, example schema, byte and row limits are checked before profiling.
Its **6,940-byte** capture is identified by SHA-256 in the report. The private
temporary document, example codes, addresses and RKA values are not committed
and are deleted after GitHub verification. The digest cannot reconstruct that
capture; future observations can be recaptured, but this exact observation
requires the same bytes. It is not an immutable data artifact or a live API
snapshot. Missing/duplicate rates for national assignments remain **unknown**.

## AGID boundary and remaining gates

All eleven country-specific official catalog references are metadata-only for
validation, including `post-kz`. Authoritative discovery provenance remains;
a name, source ID or URL alone cannot produce strong assignment validation.
The current/legacy regex, normalizer, route runtime and synthetic fixtures are
unchanged. No current production assignment, geometry, address/building
relation or real AGID release verification is claimed.

To satisfy the existing KZ criterion, obtain complete declared-scope, current,
typed rights-cleared assignments and independently licensed point or area
geometry. Pin exact resource/terms versions, retrieval times and SHA-256;
validate coverage, exceptions, current-versus-legacy validity, CRS/topology,
RKA/building-link review, privacy and jurisdiction. Keep geometry authority
and official/derived/virtual/none labels independent. Exact street/building
display requires its own explicitly sourced relation. Reproduce the transform,
obtain approval for the publication destination, publish immutable artifacts
outside AGID Git, verify bytes and exercise the actual AGID loader/API.

No raw dump, real address, geometry or property record is included. No account,
contract acceptance, restricted request, new repository/dataset/Space, paid
compute, additional Hugging Face charge or production deployment occurred.
Public-only review is due **2026-09-04T17:08:16.042Z**, after all pending countries;
that date is not permission for restricted access or publication. Next: **LA**.
