# Afghanistan M2 source preflight — 2026-08-28

**M1_metadata / blocked, not M2.** One live public postal-area response passed
basic checks, but no rights-cleared, editioned source snapshot or public data
pack has been retained/published. Existing country runtime tests are synthetic.

## Existing requirements, now machine-readable

The existing [AF runtime contract](postal-context-afghanistan-runtime.md)
already required rights-reviewed Afghan Post artifacts, current validity,
independently licensed geometry, CRS/topology, privacy and reproducible lineage.
Its manifest lacked a promotion-stage entry. The new M2_experimental definition
formalizes those requirements and makes immutable publication and real AGID
verification explicit. A document check or synthetic test cannot replace them.

## Primary evidence

- [UPU addressing guide](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/afgEn.pdf),
  edition 07/2025: six-digit province/district/zone structure and the stated
  1 October 2024 transition. Its digest is pinned. Text was inspected; rendering
  succeeded, but image viewing was unavailable on this host.
- [Afghan Post description](https://afghanpost.gov.af/index.php/en/postal-code):
  mixes a 2011 introduction paragraph with later six-digit text. Preserve these
  source-specific statements; do not infer record validity or append guessed
  zone digits to a four-digit legacy code.
- [Official map](https://postalcode.afghanpost.gov.af/): its public client
  separates a postcode-specific area route from address search and bulk layers.
  The probe uses one postcode in the UPU guide, not a person or address search.
  The example is a query candidate, not assignment proof by itself.
- [Operator site](https://afghanpost.gov.af/en) and
  [policy](https://afghanpost.gov.af/en/afghan-post-policy-0): no exact product
  licence for transformed/public artifacts was established. Their copyright
  notice and policy statements do not authorize a bulk release. Web-text review
  reached the description/policy; the reproducible direct probe recorded
  network failures for all three operator-site URLs. Those failures are not
  successful source or terms snapshots.
- [OCHA/HDX catalog](https://data.humdata.org/dataset/cod-ab-afg): version 03,
  34 provinces and 401 humanitarian-use districts; metadata distinguishes 457
  designated districts with missing boundaries. CC BY 3.0 IGO applies to this
  administrative dataset, not Afghan Post geometry or an inferred postal
  assignment. Only catalog metadata, not boundary files, was downloaded.

## Reproducible, bounded checks

    node scripts/inspect-postal-context-af-sources.mjs --report <new-report.json>
    npm run verify:postal-context-afghanistan

The [probe configuration](../data/postal_country_packs/af/postal-context/m2-source-review.json)
fixes six references and one area URL. HTTPS hosts, redirects, timeouts, size,
MIME and the PDF edition digest are checked. Source bodies stay in memory.
There is no authentication, address search, bulk layer or recipient lookup.

The [source review](../reports/postal-context-m2/af-source-review-2026-08-28.json)
records three verified references, three access failures and one live area:
MultiPolygon, one polygon, one closed ring, 126 positions, 8,265 response bytes.
The source stores the requested postcode numerically; converting its number
to its six-digit string matches the requested identifier without inventing
digits. The report emits counts and SHA-256 only, not arbitrary properties or
coordinate values.

Validation checks identity, Polygon/MultiPolygon shape, finite coordinate
ranges, ring length/closure and non-degeneracy. It is **not full topology,
source CRS, dataset edition, record validity, reuse permission or real AGID
runtime verification**. The body was not retained; its hash cannot replace a
replayable snapshot. No civic number or building identity is inferred.

The shared bounded fetcher preserves AE regression checks. AF's operator and
map webpages now remain context-only/metadata-only in the postal source
catalog. One accessible map response does not grant redistribution rights or
make every webpage an eligible validation dataset.

## Engineering verification

The [engineering report](../reports/postal-context-m2/af-checks-2026-08-28.json)
records 154 AF tests, 23 rollout tests, 159 shared-runtime tests and 138 AE
regression tests, all passing, plus a successful TypeScript check.
The runtime/fixture tests do not establish real-data M2 completion.

## Conditions to resume

1. Establish exact Afghan Post retention, transformation and redistribution
   rights for a declared scope, edition and current assignment/area records.
2. Retain source and terms snapshots with timestamps and SHA-256, then verify
   record validity, correction policy and geometry CRS.
3. Complete topology checks and reproducible transformation; run real AGID
   loader/API checks using rights-cleared input and explicit civic/building
   relations if those fields are displayed.
4. Publish immutable artifacts only to an explicitly approved destination,
   then verify remote digests and replay before promotion.

Next read-only review: 2026-09-04, after all pending countries.
No new authentication, contract, repository, public data destination or
production deployment is authorized by this review date.
