# AddressQL Technical Stack

Status: v0.1 implementation plan

AddressQL should be implemented as a specification and adapter ecosystem, not as
a new database engine.

## Stack Overview

| layer | package | primary technology | role |
| --- | --- | --- | --- |
| specification | `addressql-spec` | Markdown, JSON Schema, SQL examples | Function contracts, result schemas, determinism rules, adapter levels |
| reference core | `addressql-core-js` | TypeScript | Reference registry, JSON result shaping, policy checks, synthetic fixtures |
| reference core | `addressql-core` | Rust | PostgreSQL-independent country, postal, normalization, matching, distance, delivery, SQLite, WASM, and SDK core |
| SQL adapter | `addressql-postgres` | PostgreSQL SQL functions, JSONB, optional PostGIS | First full adapter target |
| SQL adapter | `addressql-duckdb` | DuckDB SQL macros and local fixture views | Analytics, benchmark, and source-pack validation adapter |
| SQL adapter | `addressql-sqlite` | SQLite loadable extension or WASM-backed UDF | Local-first and offline adapter |
| SQL adapter | `addressql-mysql` | MySQL UDF/stored-function facade | Compatibility adapter |
| NoSQL adapter | `addressql-nosql-sdk` | MongoDB/Firestore/DynamoDB SDK wrappers | Document database support |
| geospatial data | `addressql-source-packs` | AGID refs, postal catalogs, GeoJSON/JSON manifests | Source-versioned evidence |
| country preload | `addressql-global-country-preload` | country/territory profiles, address-format JSON, postal status policies | Local-first country address, validation, and postal readiness map |
| mobility/logistics | `addressql-mobility-kernel` | road graphs, synthetic congestion fixtures, queueing models | Congestion, bottleneck, reachability, and delay semantics |
| proof/privacy | `addressql-proof-hooks` | AMT Envelope, proof input schema, verifier hook, ZK-ready bundle adapters | Envelope-based proof surfaces, v0.6 verifier-hook readiness, public-signal safety, and non-claim tests |
| API/SDK | `addressql-js-ts` | TypeScript | Web, Node.js, Address Login, and developer tooling SDK |
| API/SDK | `addressql-py` | Python | Research notebooks, data preparation, and benchmark corpus checks |
| API/SDK | `addressql-rs` | Rust | Native SDK facade over `addressql-core` |
| planner/compiler | `addressql-calcite-planner` | Apache Calcite, Java, adapter SQL emitters | Deferred custom SQL dialect, relational algebra, adapter SQL generation, and cost-based optimization once activation gates are met |
| conformance | `addressql-conformance` | Golden fixtures, adapter matrix, node:test | Registry, determinism, non-claim tests |
| developer tools | `addressql-cli` | TypeScript CLI | Local checks, fixture export, docs generation |

## Adapter Matrix

| target | package | target level | execution model | first-release role |
| --- | --- | --- | --- | --- |
| PostgreSQL | `addressql-postgres` | `L4_proof_privacy` | SQL functions returning JSONB, optional PostGIS-backed region operations | Primary full adapter |
| SQLite | `addressql-sqlite` | `L3_delivery_communication` | Loadable extension, WASM-backed UDF, or application-defined functions | Offline/local reference adapter |
| DuckDB | `addressql-duckdb` | `L2_matching_postal` | SQL macros and analysis views over local CSV/JSON/Parquet-style source packs | Research, benchmark, and local source-pack validation adapter |
| MySQL | `addressql-mysql` | `L2_matching_postal` | Stored functions or UDF facade | Compatibility adapter |
| MongoDB | `addressql-nosql-sdk` | `L2_matching_postal` | SDK-side functions with optional aggregation pre/post-processing | Document database compatibility |
| Firestore | `addressql-nosql-sdk` | `L1_structure` | SDK-side validation and denormalized indexed fields | Mobile/web app storage compatibility |
| DynamoDB | `addressql-nosql-sdk` | `L1_structure` | SDK-side normalization and key design helpers | Serverless compatibility |

## Adapter Levels

| level | meaning |
| --- | --- |
| `L0_registry` | Function registry and JSON result schemas only |
| `L1_structure` | Parse, normalize, schema, component, canonical object |
| `L2_matching_postal` | Matching, explain-match, similarity, score, issues, postal validation |
| `L3_delivery_communication` | Delivery availability, token verification, policy check, semantic ACK |
| `L4_proof_privacy` | Envelope creation, proof hooks, proof verification, unsafe-hash tests |

## Recommended Build Order

1. `addressql-spec`
2. `addressql-core-js`
3. `addressql-conformance`
4. `addressql-global-country-preload`
5. `addressql-postgres`
6. `addressql-core`
7. `addressql-duckdb`
8. `addressql-sqlite`
9. `addressql-js-ts`
10. `addressql-py`
11. `addressql-rs`
12. `addressql-mobility-kernel`
13. `addressql-proof-hooks`
14. `addressql-nosql-sdk`
15. `addressql-calcite-planner` only after at least three Calcite activation gates are true

This order keeps the project credible.  The first public release should prove
that the function registry, result schemas, and conformance tests are stable
before promising every database adapter.

## Global Country Preload Plan

v0.7 adds:

```text
src/lib/addressQlGlobalCountryPreload.ts
docs/addressql/global-country-preload-v0.7.md
```

This layer lets AddressQL preload all country/territory profiles before calling
live sources.  It combines local address-format JSON, postal source catalog
metadata, known no-postal-code states, weak/partial postal-code states, and
source-versioned non-claims.

The preload is intentionally conservative:

```text
country profile exists
  != complete verified national address dataset
  != proof of residence
  != carrier SLA
```

Its first role is to make `COUNTRY_ADDRESS_PROFILE`,
`COUNTRY_POSTAL_STATUS`, `POSTAL_REQUIRED`, `POSTAL_VALIDATE`, and
`POSTAL_EQUIVALENT` choose the correct local validation path for every country
and territory.

## PostgreSQL Plan

PostgreSQL is the first full adapter because it can support:

- SQL functions;
- JSONB result objects;
- source-version tables;
- optional PostGIS region operations;
- deterministic and stable function declarations;
- materialized result columns;
- extension-like packaging.

Example:

```sql
SELECT ADDRESS_EXPLAIN_MATCH(
  order_address,
  account_address,
  'delivery',
  'sources:2026-07'
) AS match_report
FROM orders;
```

Result shape:

```json
{
  "match": true,
  "confidence": 0.93,
  "matched_components": ["country", "region", "city"],
  "missing_components": ["room"],
  "evidence": ["postal", "admin", "agid"],
  "non_claims": ["not proof of residence"]
}
```

Executable v0.1 scaffold:

```text
extensions/addressql-postgres
```

The first adapter is intentionally SQL/PLpgSQL rather than Rust/pgrx.  That
keeps the JSONB contracts, country/postal functions, optional PostGIS boundary,
synthetic fixtures, and smoke tests easy to inspect before moving performance
kernels into Rust.

## Rust Core Plan

v0.2 extracts shared semantics into:

```text
native/addressql-core
```

The Rust core owns pure functions and typed result structs:

- country resolution and country profiles;
- postal status, normalization, validation, lookup, and postal-equivalent
  fallback;
- address normalization and purpose-relative matching;
- haversine distance fallback;
- delivery availability decision support.

The Rust core is deliberately not a PostgreSQL extension.  It has no
PostgreSQL, PostGIS, network, or hosted API dependency.  PostgreSQL/pgrx,
SQLite, WASM, CLI, and SDK layers should call the same core and render results
into their own shapes.

```text
addressql-core
  -> addressql-postgres
  -> addressql-duckdb
  -> addressql-sqlite
  -> addressql-wasm
  -> SDKs
```

## DuckDB Plan

v0.3 adds:

```text
extensions/addressql-duckdb
```

DuckDB is the analysis and research adapter.  It should answer questions such
as:

- which country profiles have no postal-code system;
- which weak-postal countries need postal-equivalent regions;
- which synthetic fixtures fail country or postal-area coverage checks;
- how postal functions behave in local notebooks and benchmark corpora;
- whether source-pack changes alter source-versioned AddressQL outputs.

The first DuckDB adapter is intentionally macro-and-view based.  It uses local
CSV fixtures and `STRUCT` outputs rather than a compiled extension.  This makes
the adapter easy to inspect and useful in papers, notebooks, and CI-style static
verification.

Executable smoke:

```bash
npm run verify:addressql-duckdb
npm run verify:addressql-duckdb:cli
```

`verify:addressql-duckdb` is the static adapter conformance gate.
`verify:addressql-duckdb:cli` runs the real DuckDB CLI smoke when the `duckdb`
binary is available.  Use `-- --require-cli` in CI jobs that install DuckDB and
must fail if the executable smoke cannot run.

CI workflow:

```text
.github/workflows/addressql-duckdb-cli.yml
```

The workflow installs DuckDB from the official GitHub release asset, runs the
static adapter gate, then runs the required CLI smoke.

Non-claims:

```text
DuckDB v0.3 is not the primary production transaction adapter.
It does not call live postal, carrier, or geocoding APIs.
It does not generate audited ZK proofs.
It does not include raw private address fixtures.
```

## API/SDK Plan

v0.4 adds:

```text
sdk/addressql-js-ts
sdk/addressql-py
sdk/addressql-rs
```

The SDKs expose the same bounded local-first surface:

```text
countryResolve / country_resolve
postalValidate / postal_validate
postalEquivalent / postal_equivalent
normalizeAddress / normalize_address
addressMatch / address_match
addressDistanceKm / address_distance_km
deliveryAvailable / delivery_available
```

The TypeScript and Python SDKs are ergonomic reference bindings for apps,
research notebooks, and Address Login tooling.  The Rust SDK reuses
`addressql-core` by path and must not fork the native semantics.

Non-claims:

```text
SDK results are source-versioned decision support.
Postal validation is not identity or residence proof.
Delivery availability is not a carrier SLA.
v0.4 SDKs do not call hosted APIs in tests.
```

## Calcite Plan

v0.5 defines the deferred planner package:

```text
integrations/addressql-calcite
```

The package is intentionally a planner contract first, not a Java runtime
dependency.  Apache Calcite becomes necessary only when AddressQL needs a real
custom SQL dialect, multi-database relational planning, adapter-specific SQL
generation, or cost-based rewrites that cannot be expressed as bounded
PostgreSQL/DuckDB/SDK functions.

Activation rule:

```text
build Calcite integration only when at least three activation gates are true
```

The first rewrite rules must preserve source-version stability, postal predicate
pushdown, geospatial bounding-box prefilters, volatile delivery barriers,
privacy proof barriers, and non-claim preservation.

## SQLite Plan

SQLite is the local-first adapter.  It should support:

- offline address form validation;
- local test fixtures;
- CLI demos;
- mobile or edge environments;
- no external network requirement.

SQLite v0.1 does not need full proof generation.  It should support policy
checks, semantic ACK, and local deterministic functions first.

## NoSQL Plan

NoSQL engines do not share a single function execution model.  AddressQL should
therefore provide SDK wrappers instead of pretending that MongoDB, Firestore,
and DynamoDB can all run identical custom query functions.

The recommended pattern is:

```text
write path:
  raw input -> AddressQL SDK -> normalized/canonical/policy-safe fields -> DB

read path:
  DB query -> stored AddressQL outputs -> optional SDK verification
```

## Proof And Privacy Plan

AddressQL v0.1 through v0.6 should be ZK-ready, not circuit-complete.

Supported in v0.1:

- `ADDRESS_ENVELOPE_CREATE`
- `ADDRESS_COMMIT`
- `ADDRESS_PROVE` as a proof-bundle facade
- `ADDRESS_VERIFY_PROOF` as verifier facade
- public-signal safety checks
- non-claim tests

v0.6 adds:

- proof input schema;
- verifier hook contract;
- allowed public signal list;
- root references for issuer, revocation, freshness, and area state;
- rejection tests for raw address, witness, private key, salt, and proof-secret
  fields.

Not claimed in v0.1 through v0.6:

- audited ZK circuits;
- production key management;
- global address completeness;
- raw-address privacy from a plain hash.

## Data And Source Policy

AddressQL adapters must not silently call production APIs in conformance tests.
Use source-versioned local fixtures and source packs.

Every source-backed result must include:

```text
source_version
schema_version
confidence or status
non_claims when relevant
```
