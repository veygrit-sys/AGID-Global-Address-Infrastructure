# AddressQL for PostgreSQL v0.1

Status: executable extension scaffold

`addressql-postgres` is the first database adapter for AddressQL.  It exposes
AddressQL functions as PostgreSQL SQL/PLpgSQL functions that return `jsonb`.
PostGIS is optional: spatial functions degrade to explicit warnings when
PostGIS is unavailable.

## Scope

v0.1 implements:

- JSONB function outputs;
- country metadata functions;
- Global Country Preload v0.7 fields for address-format coverage,
  validation readiness, native/English input availability, and required
  components;
- postal status, format, normalization, validation, lookup, and
  postal-equivalent fallback;
- simple address parse/normalize/match functions;
- optional PostGIS-backed `ADDRESS_WITHIN` and `ADDRESS_DISTANCE`;
- delivery availability as operational decision support;
- synthetic fixtures only.

v0.1 does not claim:

- global address completeness;
- production carrier integrations;
- audited privacy proofs;
- raw-address privacy from plain hashes;
- legal proof of residence.

## Install Locally

Copy the control and SQL files into PostgreSQL's extension directory.

```powershell
$pgShare = pg_config --sharedir
Copy-Item extensions/addressql-postgres/addressql.control "$pgShare/extension/addressql.control"
Copy-Item extensions/addressql-postgres/sql/addressql--0.1.0.sql "$pgShare/extension/addressql--0.1.0.sql"
```

Then run:

```sql
CREATE EXTENSION addressql;
```

Load synthetic fixtures from the repository root:

```powershell
psql -v ON_ERROR_STOP=1 -f extensions/addressql-postgres/fixtures/synthetic_addressql_seed.sql
```

Run the smoke test:

```powershell
psql -v ON_ERROR_STOP=1 -f extensions/addressql-postgres/test/addressql_smoke.sql
```

## Function Naming

The PostgreSQL functions use lowercase SQL names while preserving the canonical
AddressQL meaning:

```text
ADDRESS_NORMALIZE -> addressql.address_normalize(...)
POSTAL_VALIDATE   -> addressql.postal_validate(...)
ADDRESS_WITHIN    -> addressql.address_within(...)
```

Every public function returns `jsonb` so adapters can preserve result shape,
source version, determinism, confidence, warnings, and non-claims.

## Global Country Preload Boundary

`addressql.country_address_profile` and `addressql.postal_status` expose the
same preload concepts used by the TypeScript reference layer:

```text
address_format_coverage
validation_readiness
native_input_available
english_input_available
required_components
postal_equivalent_strategy
```

This makes PostgreSQL choose the same first validation path as AddressQL core:

```text
official postal country -> format_only
no-postal-code country  -> postal_equivalent_required
weak postal country     -> metadata_gated
```

The PostgreSQL adapter still does not claim complete global address coverage.
Synthetic rows are only conformance examples for the preload contract.

## v0.2 Core Boundary

The v0.1 SQL functions are the executable PostgreSQL scaffold.  v0.2 moves the
shared semantics into:

```text
native/addressql-core
```

Future PostgreSQL/pgrx functions should call `addressql-core` for country,
postal, normalization, matching, distance fallback, and delivery availability,
then render the typed Rust result structs as `jsonb`.  PostgreSQL-specific code
should stay in the adapter layer.

## Optional PostGIS

Spatial functions do not require PostGIS at extension install time.  When
PostGIS exists in the database, `addressql.address_within` and
`addressql.address_distance` use dynamic PostGIS calls.  Without PostGIS, they
return explicit fallback warnings instead of silently pretending strict spatial
verification happened.
