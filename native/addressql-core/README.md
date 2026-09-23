# addressql-core v0.2

Status: pure Rust core scaffold

`addressql-core` separates AddressQL semantics from the PostgreSQL extension.
The crate contains deterministic, source-versioned address functions that can
be called by:

- PostgreSQL adapters through pgrx or a C ABI wrapper;
- SQLite loadable extensions;
- WASM builds;
- CLI tools;
- TypeScript, Python, Go, Swift, Kotlin, or Rust SDKs.

## Design Rules

- No PostgreSQL dependency in this crate.
- No PostGIS dependency in this crate.
- No network calls.
- No raw recipient fixtures.
- Synthetic fixtures only.
- Functions return typed Rust structs; adapters decide JSONB, BSON, protobuf,
  or HTTP response shapes.

## v0.2 Function Surface

```text
country_resolve
country_address_profile
postal_status
postal_normalize
postal_validate
postal_lookup
postal_equivalent
address_normalize
address_match
address_distance_km
delivery_available
```

## Adapter Boundary

```text
addressql-core
  -> addressql-postgres
  -> addressql-sqlite
  -> addressql-wasm
  -> addressql-sdk
```

Adapters must not change the non-claim semantics.  For example,
`postal_validate` is not address identity, and `delivery_available` is not proof
of residence.

## Build

```powershell
cargo test --manifest-path native/addressql-core/Cargo.toml
```

The current Codex workspace may not include Cargo.  The repository-level
`npm run verify:addressql-core` performs static conformance checks for the
scaffold.
