# AddressQL Postal Validation Parity v0.1

This note fixes the minimum shared `PostalValidationResult` contract across:

| Adapter | Representation | Artifact |
| --- | --- | --- |
| PostgreSQL JSONB | `jsonb_build_object` | `extensions/addressql-postgres/sql/addressql--0.1.0.sql` |
| DuckDB STRUCT | `struct_pack` | `extensions/addressql-duckdb/sql/addressql_duckdb_v0_3.sql` |
| DuckDB JSON helper | `to_json(struct_pack(...))` via `addressql_postal_validate_json` | `extensions/addressql-duckdb/sql/addressql_duckdb_v0_3.sql` |
| SQL fixture JSON | JSON literal in SQL fixture | `docs/specs/fixtures/addressql-return-shapes-v0.1.sql` |

The shared schema is `AddressValidationResult v0.1`:

```text
docs/specs/schemas/address-validation-result-v0.1.schema.json
```

Required fields:

```text
version
purpose
status
confidence
source_refs
result_boundaries
privacy
non_claims
```

Required boundaries:

```text
format_pass_does_not_imply_existence
existence_pass_does_not_imply_delivery
delivery_pass_does_not_imply_identity
identity_pass_does_not_disclose_full_address
```

## Boundary

PostgreSQL returns JSONB and can match the schema shape directly.

DuckDB currently returns STRUCT と区切り文字列 for local analytical use. It also exposes `addressql_postal_validate_json` as a local JSON helper so tests and downstream adapters can inspect an `AddressValidationResult v0.1`-like JSON payload. This is still not a full JSON Schema validation target until the real DuckDB CLI smoke and schema validator run together.

The SQL fixture JSON is the adapter-neutral shape reference used by tests.

## Negative Claim Fixture

The adapter-neutral negative fixture is:

```text
docs/specs/fixtures/addressql-postal-validation-negative-claims-v0.1.json
```

Its exportable JSON Schema is:

```text
docs/specs/schemas/addressql-postal-validation-negative-claims-v0.1.schema.json
```

It maps unsafe reviewer or adapter claims to the boundary flag that must stay
present in every `PostalValidationResult`:

| Case | Required boundary |
| --- | --- |
| `format-pass-claims-existence` | `format_pass_does_not_imply_existence` |
| `existence-pass-claims-delivery` | `existence_pass_does_not_imply_delivery` |
| `delivery-pass-claims-identity` | `delivery_pass_does_not_imply_identity` |
| `identity-validation-discloses-full-address` | `identity_pass_does_not_disclose_full_address` |

The negative fixture is synthetic and contains no raw private address,
recipient, witness, private-key, proof-secret, production credential, or
production traffic material.

## Non-Claims

- Postal validation is not full address identity.
- Format success does not imply address existence.
- Existence success does not imply delivery availability.
- Delivery-related validation does not imply residence, ownership, legal identity, or recipient authorization.
- Postal validation does not guarantee latency, availability, or a runtime service-level objective.
- Public fixtures must not include raw private addresses, recipient data, proof witnesses, private keys, proof secrets, production credentials, or production carrier traffic.
