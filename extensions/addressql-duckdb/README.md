# AddressQL for DuckDB v0.3

Status: analysis/local-validation scaffold

`addressql-duckdb` is the v0.3 AddressQL adapter for local analytics,
research, and source-pack validation.  It is not the primary production
transaction adapter.  PostgreSQL remains the first full SQL target; DuckDB is
the fast local workbench for asking questions about fixture quality, postal
coverage gaps, country profiles, and benchmark corpora.

## Scope

This adapter provides:

- SQL macros for country, postal, normalization, matching, distance, and
  delivery decision support;
- CSV-backed synthetic fixture views;
- Global Country Preload v0.7-compatible fields for address-format coverage,
  validation readiness, native/English input availability, and required
  components;
- local validation reports for country/postal coverage;
- no network calls and no production traffic;
- research-friendly output using DuckDB `STRUCT` values and result views.

It deliberately does not claim:

- audited ZK proof generation;
- authoritative postal assignment;
- complete global address coverage;
- carrier SLA accuracy;
- raw-address privacy from plain hashes.

## Global Country Preload Parity

DuckDB exposes the same preload fields as the PostgreSQL scaffold:

```text
address_format_coverage
validation_readiness
native_input_available
english_input_available
required_components
postal_equivalent_strategy
```

This keeps the local analytics adapter aligned with the AddressQL core
preload model:

```text
official postal country -> format_only
no-postal-code country  -> postal_equivalent_required
weak postal country     -> metadata_gated
```

## Why DuckDB

DuckDB is useful for AddressQL because it can query CSV, JSON, and Parquet-like
research data locally without running a server.  That makes it suitable for:

```text
source-pack audits
country/postal coverage reports
synthetic benchmark corpora
local no-network demos
notebook and paper reproduction
```

## Run From The Repository Root

```bash
duckdb < extensions/addressql-duckdb/test/addressql_duckdb_smoke.sql
```

Or use the repository-level explicit smoke runner:

```bash
npm run verify:addressql-duckdb:cli
```

If `duckdb` is not installed, the runner reports a skipped smoke instead of
failing the normal local verification path.  Environments that require the real
CLI smoke can force failure on missing DuckDB:

```bash
npm run verify:addressql-duckdb:cli -- --require-cli
```

Set `ADDRESSQL_DUCKDB_CLI=/path/to/duckdb` when the binary is not named
`duckdb` or is outside `PATH`.

The SQL file uses repository-root relative fixture paths:

```text
extensions/addressql-duckdb/fixtures/*.csv
```

## Public Fixture Policy

The included data is synthetic and coarse.  Public tests must not contain raw
recipient addresses, private unit numbers, proof witnesses, private keys, or
production carrier credentials.

## Files

```text
extensions/addressql-duckdb/
|- README.md
|- sql/addressql_duckdb_v0_3.sql
|- fixtures/synthetic_country_profiles.csv
|- fixtures/synthetic_postal_areas.csv
|- fixtures/synthetic_addresses.csv
`- test/addressql_duckdb_smoke.sql
```

## Adapter Role

```text
addressql-core
  -> addressql-postgres    production-oriented SQL adapter
  -> addressql-duckdb      local analytics and validation adapter
  -> addressql-sqlite      offline/mobile/local adapter
  -> SDKs                  application and API integration
```

DuckDB should stay read-oriented and local-first until the shared conformance
suite proves parity with the Rust core and PostgreSQL adapter.
