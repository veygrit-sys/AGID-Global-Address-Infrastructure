# AddressQL Country Data Promotion v0.1

Status: P2 executable promotion-readiness index

## Purpose

Country metadata is not promoted merely because a source URL or a postal
regular expression exists. P2 evaluates L2 through L5 independently:

```text
L2 postal existence
L3 administrative and locality consistency
L4 delivery area
L5 delivery point
```

Each target records required, observed, approved, and missing evidence. An
enabled target additionally requires a registered runtime adapter and a
cryptographically verified independent quality attestation.

## Current Result

The index covers all 276 country and neutral-scope profiles.

AU, GT, NZ, and PA currently reach `review_candidate` for L3 because their
official-source metadata, reuse terms, version and freshness window, declared
scope, correction route, multilingual and neutral-scope policy, and synthetic
administrative holdout pass the metadata evaluation gate.

They remain blocked because the repository does not yet contain:

```text
approved-administrative-keys
independent-signature
runtime-adapter
```

No L2, L3, L4, or L5 country capability is enabled. The existing Guatemala
country pack remains metadata and synthetic fixtures only; it is not a
postcode-existence database.

## API

```text
GET /v1/promotions
GET /v1/countries/{countryCode}/promotions
```

The first endpoint returns the global promotion summary. The second returns
one country's exact blockers, evidence status, source identifiers, review
deadline, synthetic holdout digest, and privacy boundary.

## Expiry

Country source reviews are time bounded. Once `reviewBy` expires, the source
is removed from the approved evaluation index and the country automatically
falls back from `review_candidate` to `blocked`.

The P2 operations monitor in `postal-operations-v1.md` adds the runtime side
of this boundary. It compares source versions and correction routes,
automatically removes expired adapters from runtime evaluation, measures
aggregate receipt-to-publication correction SLA, and emits country promotion
or demotion recommendations. Recommendations do not mutate this index or
enable a country.

## Non-Claims

- A review candidate is not an enabled validation capability.
- Synthetic holdouts do not contain or prove real administrative keys.
- Administrative metadata does not prove postal-code existence.
- Postal existence does not prove address or delivery-point existence.
- No raw address, recipient record, precise coordinate, credential, or query
  log is accepted by the promotion index.

## Verification

```bash
npm run verify:addressql-country-data-promotion
npm run verify:addressql-api
npm run verify:addressql
```
