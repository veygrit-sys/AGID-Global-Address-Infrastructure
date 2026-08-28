# Nepal Postal Context contract

M1 metadata and a reproducible public-table quality review, **not an M2 data release**.
This directory is an in-repository contract only; no external repository was created.

Federal office/local-unit codes and ward codes are five and seven digits respectively.
Old five-digit values must remain in a separate source/edition namespace. Syntax
acceptance does not resolve that ambiguity. Preserve Nepali/English labels and
raw Devanagari digits; never join by name or construct geography from code prefixes.

The live GPO HTML table can be inspected, but a publicly readable table is not a
redistribution licence, independent national-coverage check or immutable release.
Source rows, PDFs and private data are not committed here.

See [country review](../../../../docs/postal-context-nepal-m2.md),
[source receipts](../../../../reports/postal-context-m2/np-source-review-2026-08-28.json)
and the manifest for the exact promotion conditions and outstanding gates.

```text
npm run verify:postal-context-nepal
node scripts/inspect-postal-context-np-sources.mjs --observations tmp/np-sources --report tmp/np-review.json
npm run inspect:postal-context-nepal -- --report tmp/np-live-review.json
```

Offline replay requires the original body and JSON receipt for each ID in
`m2-source-review.json`. Bytes, MIME, URL, retrieval time and digest must match.
Bodies may be deleted after verification; hashes alone cannot reconstruct them.
Live changes require fresh review, never silent promotion. Recorded acquisition
failures are skipped until the scheduled public-source review.
