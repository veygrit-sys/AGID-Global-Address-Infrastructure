# AddressQL Calcite Planner

Status: deferred v0.5 integration placeholder

This directory intentionally contains no Maven, Gradle, or Apache Calcite
runtime dependency yet.  The planner should be implemented only after AddressQL
needs:

- a custom SQL dialect;
- one logical query emitted to multiple databases;
- cost-based query optimization;
- privacy-aware rewrite barriers;
- conformance tests that cannot be expressed with simple adapter fixtures.

See:

```text
docs/addressql/calcite-v0.5.md
```

Until then, keep AddressQL simple:

```text
PostgreSQL functions
DuckDB macros/views
Rust core
TypeScript/Python/Rust SDKs
```

## Activation Rule

Build this package only when at least three documented Calcite activation gates
are true.  The first implementation must preserve source versions, determinism,
volatility barriers, and non-claims across all emitted SQL.
