# AGID Mathematical Model Guide

This document summarizes the mathematical model used by AGID (Address Grid ID).
It is intentionally aligned with the current implementation and the language-neutral
specification in `sdk/agid-spec/agid-spec.json`.

For the more detailed paper-oriented resume, see
[`docs/agid-math-model-resume.md`](docs/agid-math-model-resume.md).

## 1. Overview

AGID is a deterministic global location identifier. It maps a latitude/longitude
coordinate to a global grid cell and encodes that cell as a 12-character string:

```text
AGID = 2-character region prefix + 10-character Base32 coordinate hash
```

The current core model uses:

- WGS84-like latitude/longitude input,
- a six-face cubed-sphere projection,
- tangent-corrected face coordinates,
- `2^21` by `2^21` quantization per face,
- Hilbert curve ordering inside each face,
- 45 used packed bits encoded into a 10-character Base32 hash.

The average global cell size is approximately `4.4 m` per side. Exact cell
dimensions vary by face position and should be reported through empirical
distortion tests rather than overclaimed as perfectly equal-area.

## 2. Coordinate Model

Input coordinates are:

```text
latitude  lat in degrees
longitude lon in degrees
```

They are converted to radians:

```text
phi   = lat * pi / 180
theta = lon * pi / 180
```

Then to a unit-sphere vector:

```text
x = cos(phi) * cos(theta)
y = cos(phi) * sin(theta)
z = sin(phi)
```

Longitude is normalized for antimeridian-safe lookup and rendering.

## 3. Cubed-Sphere Face Selection

AGID maps the unit sphere to six cube faces. The selected face is determined by
the dominant absolute vector component:

```text
absX = abs(x)
absY = abs(y)
absZ = abs(z)
```

Face assignment:

```text
0 = +X
1 = -X
2 = +Y
3 = -Y
4 = +Z
5 = -Z
```

For the selected face, AGID derives local coordinates `(xi, eta)` in a range near
`[-1, 1]`.

## 4. Tangent Correction

The implementation uses a tangent correction pair:

```text
E(t)     = tan(t * pi / 4)
E_inv(a) = atan(a) * 4 / pi
```

Encoding applies the inverse correction:

```text
u = 0.5 * (E_inv(xi)  + 1)
v = 0.5 * (E_inv(eta) + 1)
```

Decoding applies the forward correction:

```text
u_norm = (qx / K) * 2 - 1
v_norm = (qy / K) * 2 - 1
xi     = E(u_norm)
eta    = E(v_norm)
```

This should be described as an equal-area-style or near-uniform correction until
distortion measurements are documented.

## 5. Quantization

Current constants:

```text
L = 21
K = 2^21 = 2,097,152
M = K - 1 = 2,097,151
```

Quantization:

```text
qx = clamp(floor(u * K), 0, M)
qy = clamp(floor(v * K), 0, M)
```

Each face has:

```text
K * K = 2^42 cells
```

All six faces have:

```text
6 * 2^42 = 26,388,279,017,472 cells
```

Using Earth radius `R = 6,371,000 m`, the average cell area is approximately:

```text
4 * pi * R^2 / (6 * 2^42)
```

The average side length is approximately `4.4 m`.

## 6. Hilbert Ordering

Inside each face, AGID uses a Hilbert curve:

```text
h = Hilbert_L(qx, qy)
```

Because `L = 21`, the Hilbert value uses:

```text
2 * L = 42 bits
```

Hilbert ordering is used because it preserves locality better than simple
row-major ordering and is useful for nearby-cell operations, range scans, and
SDK parity tests.

The inverse operation must recover:

```text
(qx, qy) = Hilbert_L^-1(h)
```

## 7. Bit Packing and Base32

AGID packs the face and Hilbert value:

```text
packed = (face << 42) | h
```

Used bits:

```text
face    = 3 bits
hilbert = 42 bits
total   = 45 bits
```

The 10-character hash has 50 bits of Base32 capacity:

```text
10 characters * 5 bits = 50 bits
```

The current Base32 alphabet is:

```text
0123456789ABCDEFGHJKMNPQRSTVWXYZ
```

It omits ambiguous letters such as `I`, `L`, `O`, and `U`.

## 8. Prefix Model

The two-character prefix is a region and routing hint. It is not the source of
cell geometry.

Prefix classes:

- land: ISO 3166-1 alpha-2 where available,
- open ocean: letter + number,
- coastal or named sea: number + letter,
- other fallback region: number + number.

The prefix layer can require region datasets. The coordinate hash can be encoded
and decoded without those datasets.

## 9. Decoding

Decoding reverses the process:

```text
prefix = id[0:2]
hash   = id[2:12]
packed = decodeBase32(hash)
face   = packed >> 42
h      = packed & ((1 << 42) - 1)
qx,qy  = HilbertDecode(K, h)
lat,lon = inverseCubedSphere(face, qx, qy)
```

The decoded point is a representative point of the quantized cell. For address,
registration, and display correctness, callers should use the cell polygon or
cell bounds instead of treating the decoded point as the entire address.

## 10. Cell Polygon

A selected cell polygon must be generated from the same quantized cell boundary
used by the visible grid:

```text
p1 = inverse(face, qx,        qy)
p2 = inverse(face, qx + step, qy)
p3 = inverse(face, qx + step, qy + step)
p4 = inverse(face, qx,        qy + step)
polygon = [p1, p2, p3, p4, p1]
```

The practical rendering invariant is:

```text
black grid boundary = AGID cell boundary
red selected fill   = same AGID cell boundary
```

If grid lines and selected-cell polygons come from different approximations,
they can drift during pan, zoom, pitch, bearing, or device-pixel changes.

## 11. SDK Contract

Every SDK should implement the same core operations:

```text
encode(latitude, longitude) -> AgidResult
decode(agid) -> AgidDecoded | null
cellBounds(agid) -> bounds
cellPolygon(agid) -> lon/lat polygon
```

Required invariants:

- identical Base32 alphabet,
- identical constants `L`, `K`, and `M`,
- identical face selection,
- identical tangent correction,
- identical Hilbert encode/decode,
- identical bit packing,
- identical test vectors.

## 12. Known Risks

The current model should not overclaim:

- The tangent correction should be validated empirically before claiming exact
  equal-area behavior.
- Face-edge neighbor generation must be face-aware.
- Antimeridian polygons need longitude shifting.
- Prefix collision rules must stay tested for land, sea, disputed territories,
  and special regions.
- Region lookup quality is a data problem, not pure grid-math correctness.

## 13. Summary

AGID's current mathematical identity is:

```text
WGS84-like lat/lon
-> unit sphere
-> cubed-sphere face
-> tangent-corrected face coordinates
-> 2^21 by 2^21 quantized cell
-> Hilbert index
-> 45-bit packed value
-> 10-character Base32 hash
-> 2-character region prefix + hash
```

This small deterministic core should remain separate from address quality,
postal validation, natural-feature evidence, AOID privacy, and UI language
handling.
