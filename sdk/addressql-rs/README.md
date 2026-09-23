# AddressQL Rust SDK v0.4

Rust SDK facade over the local `addressql-core` crate.

```rust
use addressql_sdk::{postal_validate, delivery_available};

let postal = postal_validate(Some("1000001"), "JP");
let delivery = delivery_available("JP", Some("1000001"), "synthetic_carrier", "standard");
```

Build:

```powershell
cargo test --manifest-path sdk/addressql-rs/Cargo.toml
```

On Windows MSVC targets, Cargo also needs Visual Studio Build Tools or an
equivalent linker environment.
