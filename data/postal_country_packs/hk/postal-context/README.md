# Hong Kong Postal Context contract

This is an M1 metadata seed, not a released country dataset or an existing
external repository. HK's M2 criterion is in `repository-manifest.json`.

Hongkong Post does not use a local postcode system. ALS/GeoAddress can provide
source-linked address context without a postal polygon. Preserve code `null`
and geometry `none`; virtual cells, telephone codes and form placeholders are
not official postal assignments.

The experimental adapter retains explicit bilingual building and street-number
fields as **candidates**, not mail deliverability or building-footprint proof.
GeoAddress identifies a location, potentially shared by multiple textual
addresses. Source creation dates, query time and validity are separate.

`m2-source-review.json` defines bounded public-building inspection and source
checks. `src/lib/postalContextHongKongCandidate.ts` performs in-memory parsing
and `scripts/inspect-postal-context-hk-sources.ts` records aggregates only.
No real address rows, recipients, raw dumps, source PDF, unit data or production
geometry are bundled. Existing HK planning/synthetic country-pack files are
not reused as M2 evidence and are unchanged.

Publication needs an explicitly approved destination and applicable data-use
conditions. No Space, dataset repository or production API is created here.
