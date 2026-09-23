# AddressQL Calcite v0.5

Status: deferred planner and dialect design

`addressql-calcite-planner` should be introduced only when AddressQL needs a
real custom SQL dialect, multi-database query planning, and cost-based query
optimization across adapters.  Until those needs are proven, AddressQL should
avoid adding a Java/Calcite runtime dependency to the core repository.

## Why Deferred

v0.1 through v0.4 can be handled by:

```text
PostgreSQL functions
DuckDB macros and views
Rust core functions
TypeScript/Python/Rust SDKs
static conformance tests
```

Calcite becomes valuable when AddressQL stops being only a function registry
and becomes a portable query language:

```text
SELECT *
FROM orders
WHERE ADDRESSQL.POSTAL_VALIDATE(order_postal, country).valid
  AND ADDRESSQL.DELIVERY_AVAILABLE(country, order_postal, carrier).available
```

At that point, AddressQL needs parsing, validation, relational algebra,
adapter-specific SQL generation, and optimization rules that are hard to keep
consistent with ad hoc wrappers.

## Activation Gates

Do not build the Calcite package until at least three of these gates are true:

| gate | meaning | evidence required |
| --- | --- | --- |
| `custom_sql_dialect_required` | AddressQL syntax cannot be expressed cleanly as ordinary SQL functions | accepted syntax proposal and failing adapter examples |
| `multi_database_federation_required` | one query must target PostgreSQL, DuckDB, SQLite, or NoSQL outputs consistently | cross-adapter query fixture |
| `optimizer_rules_outgrow_macros` | macro/function wrappers create repeated inefficient scans or unsafe pushdown | benchmark or query-plan counterexample |
| `adapter_sql_generation_required` | SDKs need one canonical query lowered into different SQL dialects | PostgreSQL/DuckDB/SQLite/MySQL emission fixture |
| `policy_aware_rewrite_required` | privacy and proof functions need rewrite barriers not expressible in static docs | non-claim and privacy-boundary test vectors |

If fewer than three gates are true, keep Calcite as a design document and
continue strengthening the simpler adapters.

## Architecture

```text
AddressQL SQL text
        ↓
AddressQL dialect parser
        ↓
validator against function registry and source-version policy
        ↓
relational algebra plan
        ↓
AddressQL rewrite rules
        ↓
adapter SQL emitter
        ↓
PostgreSQL / DuckDB / SQLite / MySQL / SDK-side NoSQL
```

The planner must not change the meaning of AddressQL functions.  It may change
execution order and target syntax only when determinism, source-version, and
privacy boundaries are preserved.

## Dialect Boundary

Initial dialect extensions should be small:

```sql
ADDRESSQL.POSTAL_VALIDATE(postal_code, country)
ADDRESSQL.ADDRESS_MATCH(a, b, PURPOSE 'delivery')
ADDRESSQL.WITHIN_REGION(address_ref, REGION 'agid-country-jp')
ADDRESSQL.DELIVERY_AVAILABLE(address_ref, CARRIER 'synthetic_carrier')
ADDRESSQL.PROVE(envelope, CLAIM 'deliverable')
```

The dialect must remain compatible with ordinary SQL tables, joins, views, and
projection rules.  AddressQL should not become a new database engine.

## Core Rewrite Rules

| rule | allowed rewrite | forbidden rewrite |
| --- | --- | --- |
| `source_version_literal_lock` | lock stable functions to a declared source version | silently use latest source data |
| `postal_predicate_pushdown` | push `POSTAL_VALIDATE` below joins when source-version stable | push if postal validation is volatile or source-version missing |
| `geo_bbox_prefilter` | add coarse bounding-box prefilter before expensive region checks | expose precise private coordinates in logs |
| `volatile_delivery_barrier` | keep `DELIVERY_ESTIMATE` and live carrier-like functions late | cache volatile carrier decisions as stable facts |
| `privacy_proof_barrier` | prevent `ADDRESS_PROVE` and `ADDRESS_VERIFY_PROOF` from leaking witnesses | inline witness, private key, or proof-secret fields |
| `non_claim_preservation` | carry non-claims through projections and adapter emissions | drop non-claims from planner outputs |

## Cost Model

The planner should use a cost tuple:

\[
C(q) = (io, cpu, network, privacy, volatility, source\_risk)
\]

Optimization is lexicographic by safety first:

```text
privacy and non-claim preservation
source-version correctness
determinism and volatility barriers
then IO/CPU/network cost
```

This means a faster plan is invalid if it changes a proof boundary, drops a
non-claim, or rewrites a volatile function as stable.

## Adapter Emission

The same logical plan may emit different target code:

```text
PostgreSQL -> JSONB SQL functions and optional PostGIS operators
DuckDB     -> macros, views, STRUCT outputs, local source packs
SQLite     -> loadable extension or application-defined functions
MySQL      -> UDF/stored function facade
NoSQL      -> SDK-side precompute and materialized policy-safe fields
```

The conformance suite must compare result semantics, not byte-for-byte SQL.

## Non-Claims

Calcite v0.5 does not mean:

- AddressQL is a new database engine;
- all adapters have identical query planner behavior;
- live carrier decisions are stable facts;
- proof verification proves address resolution correctness;
- `ADDRESS_HASH` is privacy protection;
- raw addresses, witnesses, private keys, or proof secrets can appear in public
  fixtures.

## First Implementation Shape

When activated, create:

```text
integrations/addressql-calcite/
|- README.md
|- grammar/addressql-dialect.md
|- rules/rewrite-rules.json
|- fixtures/query-plans.json
`- tests/non-claim-preservation.test.ts
```

Do not add Maven, Gradle, or Calcite runtime dependency until the activation
gates are met and there is an executable cross-adapter query fixture.
