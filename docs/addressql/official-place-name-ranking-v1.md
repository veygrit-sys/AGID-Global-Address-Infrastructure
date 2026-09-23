# AddressQL Official Place-Name Ranking v1

AddressQL ranks versioned official names and aliases before any generated
transliteration. It does not translate an address or claim that a candidate is
deliverable.

## Ranking order

For a requested target language, candidates use this order:

1. official alias;
2. official romanization;
3. official native name;
4. standardized transliteration;
5. compatibility search alias;
6. generated transliteration.

Compatibility aliases are search-only. They cannot become an international
shipping label. The API sets `translationUsed` and `automaticUseAllowed` to
`false`.

## Contextual readings

`countryCode`, `hierarchyLevel`, and `parentPlaceIds` form the disambiguation
context. The conformance fixture includes the Japanese spelling `日本橋` with
the context-dependent English readings `Nihonbashi` and `Nipponbashi`.
Without the required parent hierarchy, the result is `ambiguous`.

The same contract supports Simplified Chinese, Traditional Chinese, and
regional established English names. An official regional alias such as
`Hong Kong` ranks above a mechanically generated reading. This is alias
selection, not machine translation. The holdout evaluates that regional reading
at its declared country and hierarchy level as a separate same-script case.

## Version and source gates

Each source records:

- source ID and authority;
- explicit source version and SHA-256 dataset digest;
- country scope;
- release, reuse-terms, and correction URLs;
- review and expiry timestamps;
- reuse state;
- independent-attestation and holdout states.

Catalog receipts pin source versions and per-place name digests. Comparing two
receipts reports source-version changes, added or removed places, and changed
name sets. Every change requires review.

Expired or invalid sources are excluded at evaluation time without restarting
the API. `synthetic-conformance` and reference-only sources always require
review and never become live evidence.

## Address Morphism compatibility view

The ranking response also includes an `addressMorphism` compatibility view.
It makes the candidate, provenance, time-window, loss, and disclosure gates
explicit without echoing the input token or carrying private delivery data.
It distinguishes a ranked official name from a complete candidate-coverage
claim: the current ranking catalog has no coverage certificate, so the view
keeps the downstream decision at `manual-review` and never permits automatic
use.

This view uses the accompanying research only for schema and safety-boundary
design. It is not a primary source for country-specific naming facts, postal
rules, delivery reachability, or identity. It does not issue an AGID or handle
an AOID.

## API

```text
POST /v1/place-names/rank
```

The endpoint accepts one bounded public place-name token plus country,
language, and optional administrative context. It rejects unknown fields,
including full-address, recipient, coordinate, credential, and query-log
material. A missing catalog returns HTTP 503.

## Synthetic holdout

The versioned holdout evaluates:

- country-specific international English labels;
- Japanese and Chinese-script contextual readings;
- official-alias priority over generated transliteration;
- safe deferral when context is missing.

Reports contain aggregate counts only, sliced by country and administrative
hierarchy. `top1Accuracy` uses only vectors expected to rank; expected
deferrals use the separate `safeDeferralRate`. Reports omit query text and
per-vector outcomes.

```bash
npm run verify:addressql-place-names
```

The checked-in fixture is synthetic conformance data. It does not assert that
the example source URLs, place records, or scores are approved production
evidence.
