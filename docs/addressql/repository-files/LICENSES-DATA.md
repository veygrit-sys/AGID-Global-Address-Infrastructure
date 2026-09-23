# AddressQL Data And Documentation License Policy

AddressQL separates code, specifications, and data.

## Code

Source code, tests, package metadata, scripts, and adapter scaffolds are
licensed under Apache-2.0.

## Papers, Specifications, And Documentation

Papers, specifications, diagrams, and narrative documentation are licensed under
CC-BY-4.0 unless a file states otherwise.

## Data And Fixtures

Public tests must use synthetic fixtures only.

The optional JP runtime sync uses source-specific terms:

| source | retained runtime fields | reuse terms | attribution |
| --- | --- | --- | --- |
| Japan Post UTF-8 postal CSV | unique ordinary-address postcodes only | Japan Post states that it asserts no copyright in postal-code data and permits free redistribution | Japan Post Co., Ltd. |
| GeoNames JP postal archive | unique postcodes only | CC BY 4.0 | GeoNames, https://www.geonames.org/ |

The source receipt is
`docs/addressql/sources/jp-public-postal-sources-v1.json`. Downloaded ZIP files
are not retained. Local derived data is written below `.agid-runtime/`, which
is excluded from the public repository.

AddressQL public fixtures must not include:

```text
raw private address
recipient name
phone number
email address
proof witness
private key
proof secret
production credential
live carrier credential
production API response
```

Third-party source data must remain in source-specific packages with its own
license, attribution, version, and source-policy notes.  AddressQL code may
define adapter contracts for such data, but the first public repository should
not silently bundle restricted datasets.

## Non-Claims

```text
Postal validation is not proof of residence or identity.
Deliverability is not proof of residence or identity.
ZK proof-hook readiness is not audited circuit verification.
Calcite planner readiness is not a working federated SQL engine.
```
