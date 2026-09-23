# AGID Ocean Index

AGID ocean root index for marine addressable geography, ocean packs, sea-area logical repositories, and source policy.

## Status

- Owner: `dawnportinfo-design`
- Repository: `agid-ocean`
- Stage: `wave-0-index`
- Data readiness: `index-ready`
- Privacy: no raw personal address, recipient, precise private coordinate, witness, proof-secret, or private-key material.

## Scope

This repository is an AGID coordination index for marine addressable geography.
It stores repository pointers, multilingual name policy, source policy, coarse
boundary or bounding-box policy, adjacency policy, quality gates, and
conformance status.

It does not store private delivery addresses, recipient records, precise private
coordinates, witness material, private keys, large hydrographic extracts, map
tiles, generated search indexes, AIS/telemetry streams, or political claims.

## Related Repositories

- `agid-pacific` - Pacific
- `agid-atlantic` - Atlantic
- `agid-indian` - Indian
- `agid-arctic` - Arctic
- `agid-southern` - Southern

## Data Boundary

GitHub may contain safe manifests, source notes, repository plans, synthetic
fixtures, quality gate metadata, and coarse non-personal marine references.
Precise hydrographic geometry, bathymetry, tiles, external GIS extracts,
generated caches, and operational telemetry must stay in external
content-addressed packs.

## Disputed Names, EEZ, And Sovereignty

AGID marine identifiers are technical addressing references. They do not decide
sovereignty, EEZ rights, or geopolitical claims. Disputed names and EEZ
relations must be source-attributed and display-policy switchable.

## Natural Features

Mountains, deserts, rivers, and lakes stay in country-or-region natural-feature
packs by default. A separate repository should be created only when scale,
maintainer ownership, and source boundaries justify it.

## Validation

The repository includes JSON manifests and a lightweight GitHub Actions workflow
that validates JSON files. Public release content must pass AGID no-raw-address
review before data publication.
