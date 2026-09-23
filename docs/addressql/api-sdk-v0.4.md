# AddressQL API/SDK v0.4

Status: executable SDK scaffold

v0.4 moves AddressQL from database adapter prototypes into developer-facing
API and SDK surfaces.  The goal is parity across TypeScript, Python, and Rust
without requiring a hosted service.

## Scope

v0.4 provides:

- TypeScript SDK for web, Node.js, Address Login, and developer tools;
- Python SDK for research notebooks, data preparation, and benchmark corpus
  checks;
- Rust SDK that reuses `addressql-core` for native embedding and future
  PostgreSQL/SQLite/WASM bridges;
- shared function names and non-claim semantics;
- synthetic fixtures only.

It does not provide:

- production carrier calls;
- live official postal API calls;
- audited ZK circuits;
- raw private address fixtures;
- hosted AddressQL API service.

## SDK Parity Surface

All v0.4 SDKs expose this bounded surface:

```text
countryResolve(input)
countryAddressProfile(country)
postalStatus(country)
postalNormalize(postalCode, country)
postalValidate(postalCode, country)
postalEquivalent(regionRef, country)
normalizeAddress(addressText, country)
addressMatch(addressA, addressB, purpose)
addressDistanceKm(latA, lonA, latB, lonB)
deliveryAvailable(country, postalCode, carrier, serviceLevel)
```

The names are idiomatic per language, but the semantics and non-claims must
remain the same.

The TypeScript reference SDK also exposes Global Country Preload readiness on
`countryAddressProfile(country)`:

```text
addressFormatCoverage
validationReadiness
nativeInputAvailable
englishInputAvailable
requiredComponents
postalEquivalentStrategy
```

No-postal-code countries must return `postal_equivalent_required` instead of
accepting an invented postal code.

## API Boundary

The public API shape is intentionally SDK-first:

```text
Application
  -> AddressQL SDK
  -> local source pack / addressql-core / database adapter
```

P1 adds an optional self-hosted Practical API without making it a dependency of
the local v0.4 functions. The TypeScript SDK provides a bounded HTTP client;
Python and Rust retain local embedding surfaces. See
`practical-api-v1.md`.

## TypeScript

Location:

```text
sdk/addressql-js-ts
```

Use:

```ts
import { countryAddressProfile, postalValidate, deliveryAvailable } from "@addressql/sdk";

const profile = countryAddressProfile("HK");
const postal = postalValidate("1000001", "JP");
const delivery = deliveryAvailable("JP", "1000001", "synthetic_carrier");
```

## Python

Location:

```text
sdk/addressql-py
```

Use:

```python
from addressql import postal_validate, delivery_available

postal = postal_validate("1000001", "JP")
delivery = delivery_available("JP", "1000001", "synthetic_carrier")
```

## Rust

Location:

```text
sdk/addressql-rs
```

Use:

```rust
use addressql_sdk::{postal_validate, delivery_available};

let postal = postal_validate(Some("1000001"), "JP");
let delivery = delivery_available("JP", Some("1000001"), "synthetic_carrier", "standard");
```

The Rust SDK depends on the local `native/addressql-core` crate.  This keeps
Rust as the source of high-performance native semantics while TypeScript and
Python provide ergonomic bindings.

## Cargo Requirement

Cargo is required for Rust SDK builds:

```powershell
cargo test --manifest-path sdk/addressql-rs/Cargo.toml
```

On Windows MSVC targets, Cargo also requires Visual Studio Build Tools or an
equivalent linker environment.  Installing Cargo alone is not enough to link
Rust test binaries.

## Release Gates

- SDKs must not call production networks in tests.
- SDKs must not include raw recipient fixtures.
- SDKs must expose non-claims in result objects.
- SDKs must keep `postal_validate` separate from identity or residence proof.
- SDKs must keep `delivery_available` separate from carrier SLA claims.
- Rust SDK must reuse `addressql-core` instead of copying divergent logic.
