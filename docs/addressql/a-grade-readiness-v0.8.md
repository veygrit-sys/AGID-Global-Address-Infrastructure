# AddressQL A-Grade Readiness v0.8

AddressQL is considered A-grade when it is no longer only a specification bundle. It must expose executable release gates across the database adapter, portable core, analytics adapter, SDK layer, proof boundary, country/postal preload, and OSS publication boundary.

This document is a release-readiness contract. It is not a claim that AddressQL has complete global postal data, audited ZK circuits, or production carrier deliverability.

## A-Grade Layers

| Layer | Required evidence | Gate |
| --- | --- | --- |
| PostgreSQL extension | JSONB functions, postal format/existence split, optional PostGIS boundary, fixtures, smoke SQL | `npm run verify:addressql-postgres` |
| Rust core | PostgreSQL-independent `country_profile`, `postal_validate`, `postal_equivalent`, adapter contracts | `npm run verify:addressql-core` and `npm run verify:addressql-core:cargo` |
| DuckDB | local fixtures, postal gap report, CLI smoke path, optional CI hard gate | `npm run verify:addressql-duckdb` and `npm run verify:addressql-duckdb:cli -- --require-cli` |
| SDKs | TypeScript, Python, Rust facades, local fixtures, non-claim preservation | `npm run verify:addressql-sdk` |
| ZK hooks | proof input schema, verifier hook, forbidden private material checks, non-claims | `npm run verify:addressql-zk` |
| Country/postal preload | official, weak, no-postal-code, postal-equivalent profiles | `npm run verify:addressql-global-preload` |
| OSS boundary | public repository manifest, license split, no private fixtures, export dry-run | `npm run verify:addressql-oss` and `npm run verify:addressql-export` |
| Runtime data | canonical postcode digest, Ed25519 attestation, trust-store, expiry, and path-boundary checks | `npm run verify:addressql-runtime-config` |
| Public source intake | Japan Post official CSV plus GeoNames CC BY 4.0 cross-check, aggregate holdout, mutable-archive digest receipt, and no-key fail-closed state | `npm run verify:addressql-api` |
| Umbrella gate | all lightweight AddressQL tests plus A-grade readiness | `npm run verify:addressql` |

## Current A-Grade Score Model

The executable score lives in `src/lib/addressQlAGradeReadiness.ts`.

Weights:

- PostgreSQL real function surface: 16
- Rust core portable kernel: 15
- DuckDB research and CLI gate: 12
- SDK fixture parity: 12
- ZK hook boundary: 12
- Global country/postal preload: 13
- OSS publication boundary: 10
- Release verification commands: 10

An A-grade report requires:

```text
score >= 90
blockingGates.length == 0
readyForAGrade == true
```

## Hard Local Gates

Some A-grade gates are environment-dependent:

- `cargo` is required for `npm run verify:addressql-core:cargo`.
- `duckdb` CLI is required for `npm run verify:addressql-duckdb:cli -- --require-cli`.

These are intentionally separate from the lightweight `npm run verify:addressql` umbrella so the repository remains testable before local native tools are installed.

## Non-Claims

AddressQL A-grade readiness does not claim:

- Complete global address or postal-code coverage.
- Residence, identity, or carrier SLA proof.
- Audited ZK circuit verification.
- Production source licensing clearance for every country.
- Hosted registry or managed proof service readiness.

The A-grade gate means the open-source implementation has enough executable structure to be judged, improved, packaged, and reviewed without relying on informal promises.
