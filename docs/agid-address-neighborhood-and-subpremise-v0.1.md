# AGID Grid Neighborhood and Building Reference v0.1

Status: implemented and internally tested

## 1. Grid Model

AGID divides each cubed-sphere face into `2^21` cells on each axis. The
21-bit value is per face axis; it is not a claim that the complete AGID string
contains only 21 spatial bits.

`getAdjacentAGIDCells` returns the immediate eight-neighbor set:

- four edge-adjacent candidates,
- four corner-adjacent candidates,
- reprojected neighbors across face seams, poles, and the antimeridian.

The implementation samples the neighboring cell center on the source face,
projects it back to the sphere, and re-encodes it. This avoids treating face
local `qx` and `qy` arithmetic as globally continuous.

`matchAGIDGridNeighborhood` reports `same-cell`, `edge-adjacent`,
`corner-adjacent`, `separate`, or `invalid`. The first three are accepted only
as same-or-near area candidates. They do not prove that two records identify
the same building, entrance, traversable route, or delivery endpoint.

## 2. Public Building Reference

The public identity tuple is:

```text
canonical AGID + opaque buildingId
```

The opaque building identifier is 1 to 64 ASCII letters, numbers, dots,
underscores, colons, or hyphens. It is not a recipient identifier and must not
encode unit or access information.

Two references with the same building ID in the same cell are
`same-public-building`. The same building ID in an adjacent cell is
`same-building-boundary` and requires review when authoritative building
geometry is available. A shared cell without a shared building ID is an area
match, not a building identity match.

## 3. Private Sub-premise Metadata

Unit, floor, entrance, and internal-route values live in a separate
`private-sub-premise` object with `client-controlled` retention. They are
excluded from:

- the AGID,
- the public reference key,
- public building comparison,
- public conformance vectors,
- normalization canonical keys.

Private sub-premise comparison is an explicit, separate operation. Public
nearby-grid matching never implies a sub-premise match.

## 4. Synthetic Regression Benchmark

The deterministic benchmark generates exactly 10,000 synthetic address
variants across ten script and country profiles. It covers case, width,
whitespace, punctuation, Unicode decomposition, dash variants, non-ASCII
decimal digits, wrapping symbols, and mixed variants.

It also runs:

- 2,000 boundary checks: adjacent seam acceptance and separated-cell rejection,
- 1,000 public/private separation checks,
- a zero-tolerance public sub-premise leakage check.

The current gates are:

| Metric | Gate |
| --- | --- |
| Normalization success rate | at least `99.5%` |
| Boundary-value error rate | at most `0.1%` |
| Public sub-premise leakage rate | exactly `0%` |

Run:

```bash
npm run verify:agid-address-matching
npm run benchmark:agid-address-normalization
```

This is a synthetic regression and boundary-safety benchmark. It does not
measure real-world address coverage, building geometry accuracy, carrier
deliverability, entrance reachability, or commercial address-validation parity.
