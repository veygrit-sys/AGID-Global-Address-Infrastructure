# agid-js-ts

JavaScript/TypeScript SDK package scaffold for AGID.

This package is generated from `agid-spec/agid-spec.json` so every language binding follows the same coordinate model, ID format, and public API.

## SDK Target Matrix

| Field | Value |
| --- | --- |
| Language | JavaScript/TypeScript |
| Package | `@agid/agid` |
| Ecosystem | web |
| Package manager | npm |
| Runtime | Node.js / browser |
| Primary use | Web apps, Node.js, and developer tooling |
| Test command | `npm test` |

The machine-readable target manifest is `agid-sdk.json`. The complete language matrix is published by `agid-spec/sdk-targets.json`.

## API

- `encode(latitude, longitude)`
- `decode(agid)`
- `cellBounds(agid)`
- `cellPolygon(agid)`
- `normalizeAgid(agid)`
- `isValidAgid(agid)`
- `validateAgid(agid)`

## Optional 16-character wire format

For an issued 12-character ID, use `toAGID16(id)` to retain its prefix and exact cell and append a version and typo check. For example, `JP05AV8TJGHD` becomes `JP05AV8TJGHD1MEQ`. Use `toLegacyAGID(value)` to recover the original ID or `normalizeAGIDCode(value)` to preserve its format. Both readers accept canonical 12-character, raw 16-character and grouped 4-4-4-4 input, and return null for invalid input.

Run `npm run test:wire` to build and test the standalone wire-format API. Coordinate encoding and decoding in this SDK are still scaffolds.

## Security Boundary

AGID is a public location/address/building-map-feature identifier. SDKs must keep recipient names, phone numbers, room or unit numbers, private delivery instructions, owner keys, device keys, AOID private payloads, and encrypted AOID payloads outside the public AGID contract. Validation helpers are generated so clients can reject malformed or unsafe public AGID strings before decode, QR, NFC, POS, registry, or resolver use.

## Status

This scaffold is ready for implementation work, but it is not ready for formal distribution until the generated encode/decode/cellBounds parity tests pass for this language. The canonical implementation is the existing TypeScript/Rust core in this repository; language implementations should use the shared spec and vectors in `agid-spec`.

## Release Gate

Before publishing this SDK, run `npm test` and confirm every parity vector in `agid-parity-vectors.json` matches the canonical `agid-spec/test-vectors.json`.
