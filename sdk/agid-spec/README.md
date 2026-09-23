# agid-spec

`agid-spec` is the canonical language-neutral AGID specification package.

Use `agid-spec.json` as the contract for every generated AGID SDK package. Do not treat the web app UI, address registration flow, or private AOID records as the core AGID contract.

## SDK Target Matrix

`sdk-targets.json` lists every generated SDK language, package manager, test command, runtime target, and release status. Downstream CI should use that file instead of maintaining separate language lists.

## Canonical Artifacts

| File | Role |
| --- | --- |
| `agid-spec.json` | Normative AGID core contract: precision, projection assumptions, string format, API names, security boundary, and vector references. |
| `test-vectors.json` | Parity vectors for SDK implementations. |
| `sdk-targets.json` | Multi-language SDK release matrix. |
| `agid-sdk.json` | Manifest for the spec package itself. |
| `../../docs/agid-address-neighborhood-and-subpremise-v0.1.md` | Neighborhood, building-reference, sub-premise privacy, and synthetic benchmark profile. |

## SDK Parity Requirement

A generated SDK is not ready for formal distribution until it passes parity tests for:

- `encode`
- `decode`
- `cellBounds`
- `normalizeAgid`
- `isValidAgid`
- `validateAgid`

`cellPolygon` should also be implemented for map and GIS clients, but `encode`, `decode`, `cellBounds`, and the validation helpers are the minimum cross-language compatibility gate.

The v0.1 neighborhood extension adds `adjacentCells` and
`gridNeighborhoodMatch`. It uses eight-neighbor semantics and reprojects across
cubed-sphere face boundaries. This extension does not change AGID encoding or
the minimum parity gate for existing SDKs.

## Address Reference Boundary

A public building reference is the canonical AGID plus an opaque `buildingId`.
Unit, floor, entrance, and internal-route fields are private sub-premise
metadata. They are client-controlled and excluded from the AGID, public
reference key, public building comparison, and public conformance vectors.

Run `npm run verify:agid-address-matching` and
`npm run benchmark:agid-address-normalization` to verify this boundary and the
10,000-vector synthetic normalization regression set. Synthetic results are not
a measured real-world delivery success rate.

## Security Requirement

AGID is public by design, so SDK security focuses on integrity and strict parsing:

- trim and uppercase before validation,
- accept only the 12-character AGID format,
- reject hashes outside the AGID Base32 alphabet,
- reject packed values outside the 45-bit AGID range,
- reject face values outside `0..5`,
- never treat AGID as a container for recipient, phone, unit, room, private delivery, owner-key, device-key, or encrypted AOID payload fields.

Formal releases should publish checksums or detached signatures for `agid-spec.json`, `test-vectors.json`, generated SDK packages, and public data packs.

## Release Gate

Do not publish a language SDK until its `agid-sdk.json` manifest exists, its test command passes, and every required API listed in `sdk-targets.json` has parity coverage.
