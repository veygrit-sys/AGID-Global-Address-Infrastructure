# agid-zig

Zig SDK package scaffold for AGID.

This package is generated from `agid-spec/agid-spec.json` so every language binding follows the same coordinate model, ID format, and public API.

## SDK Target Matrix

| Field | Value |
| --- | --- |
| Language | Zig |
| Package | `agid` |
| Ecosystem | systems |
| Package manager | Zig build |
| Runtime | Zig >=0.12 |
| Primary use | Systems programming and small binaries |
| Test command | `zig test src/agid_parity_test.zig` |

The machine-readable target manifest is `agid-sdk.json`. The complete language matrix is published by `agid-spec/sdk-targets.json`.

## API

- `encode(latitude, longitude)`
- `decode(agid)`
- `cellBounds(agid)`
- `cellPolygon(agid)`
- `normalizeAgid(agid)`
- `isValidAgid(agid)`
- `validateAgid(agid)`

## Security Boundary

AGID is a public location/address/building-map-feature identifier. SDKs must keep recipient names, phone numbers, room or unit numbers, private delivery instructions, owner keys, device keys, AOID private payloads, and encrypted AOID payloads outside the public AGID contract. Validation helpers are generated so clients can reject malformed or unsafe public AGID strings before decode, QR, NFC, POS, registry, or resolver use.

## Status

This scaffold is ready for implementation work, but it is not ready for formal distribution until the generated encode/decode/cellBounds parity tests pass for this language. The canonical implementation is the existing TypeScript/Rust core in this repository; language implementations should use the shared spec and vectors in `agid-spec`.

## Release Gate

Before publishing this SDK, run `zig test src/agid_parity_test.zig` and confirm every parity vector in `agid-parity-vectors.json` matches the canonical `agid-spec/test-vectors.json`.
