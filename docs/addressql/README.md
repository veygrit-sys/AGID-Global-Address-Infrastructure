# AddressQL

Status: open-source release candidate

Target repository: `dawnportinfo-design/addressql`

AddressQL is a query layer for treating addresses as structured, validated,
deliverable, and privacy-preserving data.  It is not a new database engine.  It
is a portable specification, function registry, adapter model, and conformance
suite for existing SQL and NoSQL systems.

## Separation From Address Morphism Theory

AddressQL must not be merged into the AMT paper.

The relationship is:

```text
Address Morphism Theory
  = theory of address referents, evidence, resolution, envelopes, and safe refusal

AddressQL
  = query language and adapter surface for using address functions in databases
```

Compatibility is allowed and useful.  AddressQL may consume AMT-compatible
envelopes, AGID regions, postal source catalogs, Address Communication Objects,
and ZK Address Predicate proof bundles.  But AddressQL is a separate OSS
project with its own papers, specification, tests, and release gates.

## Quick Start

AddressQL ships as a repo-ready, self-hosted OSS implementation inside the
AGID workspace. It includes an executable API, PostgreSQL and DuckDB surfaces,
TypeScript/Python/Rust SDKs, global country-format metadata, and signed local
runtime data adapters. It avoids hosted dependencies, production credentials,
and private address fixtures.

```bash
npm run verify:addressql
npm run verify:addressql-oss
npm run verify:addressql-postgres
npm run verify:addressql-duckdb
npm run verify:addressql-duckdb:cli
npm run verify:addressql-postal-negative-claims
npm run verify:addressql-sdk
npm run verify:addressql-global-preload
npm run verify:addressql-global-coverage
npm run verify:addressql-multilingual-quality
npm run verify:addressql-place-names
npm run verify:addressql-api
npm run verify:addressql-runtime-config
npm run verify:addressql-runtime-release
npm run verify:addressql-delivery-point
npm run verify:addressql-zk
```

Run the P1 self-hosted API on loopback:

```bash
npm run serve:addressql-api
```

The default server is useful for L1 format validation. To exercise the
fail-closed runtime adapter path with the checked-in synthetic fixture:

```powershell
$env:ADDRESSQL_RUNTIME_CONFIG="docs/specs/fixtures/addressql-runtime-config-conformance-v1.json"
$env:ADDRESSQL_ALLOW_CONFORMANCE="1"
npm run serve:addressql-api
```

Conformance data is never promoted to live evidence. Approved local datasets
also require `ADDRESSQL_TRUST_STORE` with a trusted Ed25519 public key.

Build a local JP postcode-only runtime from the reusable Japan Post official
CSV and the GeoNames CC BY 4.0 cross-check:

```bash
npm run sync:addressql-public-postal-data
npm run sync:addressql-official-postal-data
```

The command stores derived postcodes, aggregate quality evidence, source
versions, archive digests, terms, and correction routes under the ignored
`.agid-runtime/addressql/jp` directory. It does not retain source ZIP files,
address rows, recipient data, or coordinates. The generated adapters remain
`conformance` until an independent reviewer supplies an Ed25519 public key and
signatures.

`verify:addressql-duckdb:cli` is optional for ordinary local development: it
skips when DuckDB is not installed.  The GitHub Actions smoke workflow installs
DuckDB and runs:

```bash
npm run verify:addressql-duckdb:cli -- --require-cli
```

That CI mode fails if the `duckdb` executable is missing or if the SQL smoke
does not run.

Optional native checks:

```bash
cargo check --manifest-path native/addressql-core/Cargo.toml
cargo check --manifest-path sdk/addressql-rs/Cargo.toml
```

On Windows, Rust tests that link native binaries require MSVC Build Tools.

## Open-Source Scope

Initial packages:

```text
addressql-spec
addressql-core-js
addressql-core
addressql-global-country-preload
addressql-postgres
addressql-duckdb
addressql-sqlite
addressql-js-ts
addressql-py
addressql-rs
addressql-conformance
addressql-fixtures
```

Detailed planning docs:

- [Specification v0.1](specification-v0.1.md)
- [Technical Stack](technical-stack.md)
- [Function Registry v0.1](function-registry-v0.1.md)
- [Country And Postal Functions](country-postal-functions.md)
- [Global Country Preload v0.7](global-country-preload-v0.7.md)
- [Global Country Coverage v0.1](global-country-coverage-v0.1.md)
- [Country Data Promotion v0.1](country-data-promotion-v0.1.md)
- [Multilingual Quality v0.1](multilingual-quality-v0.1.md)
- [Official Place-Name Ranking v1](official-place-name-ranking-v1.md)
- [Practical API v1](practical-api-v1.md)
- [Runtime Release Security v1](runtime-release-security-v1.md)
- [Signed L5 Delivery-Point Contract v1](signed-delivery-point-contract-v1.md)
- [Postal Operations v1](postal-operations-v1.md)
- [JP Public Postal Source Receipt](sources/jp-public-postal-sources-v1.json)

The practical API includes fail-closed runtime evidence adapters and a local
postcode-set adapter. Only independently attested, non-expired source
versions can enable postal-existence or delivery-area decisions; partial
datasets never turn absence into a negative result.
The L5 endpoint is separate: it accepts only a salted delivery-point
commitment and bounded signed carrier assertions. Carrier disagreement is a
stopping conflict, and L4 area evidence cannot become an L5 point decision.

P2 postal operations run without network or private address data:

```bash
npm run monitor:addressql-postal-operations -- \
  --input docs/specs/fixtures/addressql-postal-operations-input-v1.json \
  --output .agid-runtime/postal-operations-report.json \
  --fail-on-action
```

The runtime registry disables expired adapters during each evaluation. The
operations report aggregates correction receipt-to-publication SLA and emits
country promotion, demotion, review, hold, or blocked recommendations without
changing country capability state.

- [Congestion And Mobility Functions](congestion-mobility-functions.md)
- [API/SDK v0.4](api-sdk-v0.4.md)
- [Calcite v0.5](calcite-v0.5.md)
- [ZK Proof Hooks v0.6](zk-proof-hooks-v0.6.md)
- [Theory Foundations](theory-foundations.md)
- [Database/GIS/Logistics Synthesis](database-gis-logistics-synthesis.md)
- [Cross-Cutting Layers](cross-cutting-layers.md)
- [Research Plan](research-plan.md)
- [Open-Source Release Readiness](open-source-release-readiness.md)

Executable adapter scaffold:

- [AddressQL for PostgreSQL v0.1](../../extensions/addressql-postgres/README.md)
- [AddressQL Rust Core v0.2](../../native/addressql-core/README.md)
- [AddressQL for DuckDB v0.3](../../extensions/addressql-duckdb/README.md)
- [AddressQL TypeScript SDK v0.4](../../sdk/addressql-js-ts/README.md)
- [AddressQL Python SDK v0.4](../../sdk/addressql-py/README.md)
- [AddressQL Rust SDK v0.4](../../sdk/addressql-rs/README.md)
- [AddressQL Calcite Planner v0.5](../../integrations/addressql-calcite/README.md)

Repository manifest:

- [repository-manifest.json](repository-manifest.json)

Recommended license split:

```text
Code: Apache-2.0
Papers/specs: CC-BY-4.0
```

## Core Promise

```text
SQL functions for address validation, matching, postal fallback, congestion-aware
reachability, delivery eligibility, and privacy-preserving address proofs.
```

AddressQL does not promise perfect global address resolution.  It does preload
country/territory profiles so every country can choose a local validation path
before live API use, but every function must declare its source version,
determinism level, privacy boundary, and non-claims.

## Architecture Layers

AddressQL's core is:

```text
Database research
GIS research
Logistics research
Congestion / mobility research
```

The cross-cutting layers are applied in this order:

```text
1. Security / Privacy / ZK
2. Linguistics / Multilingual / NLP
3. Standards / Interoperability
4. Governance / Source Policy / Licensing
5. Temporal / Versioning
6. Developer Experience / Conformance
7. UX / Address Forms
```

## MVP Function Surface

The first release keeps a bounded core plus country/postal metadata functions:

```text
ADDRESS_PARSE
ADDRESS_NORMALIZE
ADDRESS_COMPONENT
ADDRESS_SCHEMA
COUNTRY_RESOLVE
COUNTRY_ADDRESS_PROFILE
COUNTRY_POSTAL_STATUS
COUNTRY_SOURCE_POLICY
ADDRESS_MATCH
ADDRESS_EXPLAIN_MATCH
ADDRESS_SIMILARITY
ADDRESS_SCORE
ADDRESS_ISSUES
POSTAL_STATUS
POSTAL_FORMAT
POSTAL_NORMALIZE
POSTAL_REQUIRED
POSTAL_VALIDATE
POSTAL_EQUIVALENT
ADDRESS_WITHIN
DELIVERY_AVAILABLE
ADDRESS_MASK
ADDRESS_COMMIT
ADDRESS_ENVELOPE_CREATE
ADDRESS_PROVE
ADDRESS_VERIFY_PROOF
ADDRESS_POLICY_CHECK
ADDRESS_ACK
```

The important kernel is:

```text
ADDRESS_MATCH
COUNTRY_POSTAL_STATUS
POSTAL_STATUS
POSTAL_EQUIVALENT
DELIVERY_AVAILABLE
ADDRESS_COMMIT
ADDRESS_ENVELOPE_CREATE
ADDRESS_PROVE
ADDRESS_ACK
```

## Release Gates

- No raw address fixtures in public tests.
- `ADDRESS_HASH` remains discouraged and unsafe-by-default.
- Proof functions accept envelope or proof policy, not raw address as the
  primary public interface.
- Every function declares determinism: `immutable`, `stable_by_source_version`,
  or `volatile`.
- AMT compatibility is an adapter boundary, not an AMT paper chapter.
- Calcite remains deferred until activation gates are met.
- ZK hooks remain proof-input/verifier-hook readiness, not audited circuits.

## GitHub Publication Target

The intended public repository is:

```text
https://github.com/dawnportinfo-design/addressql
```

First public description:

```text
AddressQL: portable SQL/SDK functions for structured, postal-aware,
delivery-aware, privacy-bound address queries.
```

Recommended GitHub topics:

```text
address-validation
postgresql
postgis
duckdb
geospatial
logistics
privacy
zero-knowledge
open-source
```
