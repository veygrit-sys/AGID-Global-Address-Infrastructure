# AGID Mathematical Model Resume

Last updated: 2026-06-07

## Purpose

This resume separates the AGID mathematical model from the product resume. The goal is to keep the algorithm precise enough for SDK implementation, testing, and future papers, while the main resume stays focused on product direction and differentiation.

AGID's mathematical model has four jobs:

1. Convert latitude/longitude into a deterministic global cell.
2. Encode that cell into a stable 12-character AGID string.
3. Decode the string back to the same cell center and polygon.
4. Render grid lines and selected red cells from the same absolute cell geometry.

## Scope Boundary

This resume covers only the public AGID coordinate-to-cell model. It does not
define AOID private records, PID issuance policy, ZK address predicates,
postal deliverability, or AMN registry anchoring.

Boundary rule:

- AGID math defines `lat/lon -> cell -> 12-character AGID`.
- AOID ID rules define owner-managed private address handles, currently using
  9- to 16-character unambiguous Base32 with optional linked AGID hash anchor.
- Address verification defines whether public postal/address evidence is good
  enough for a country, language, city, rural area, island, mountain, desert,
  wetland, ice field, or other special region.
- AMT defines address semantics, candidates, clusters, unresolved outcomes,
  history, and PID issuance.
- ZK materials define selective disclosure of address-derived predicates.

Keeping these layers separate prevents a mathematically valid AGID from being
mistaken for a delivery guarantee, an AOID ownership proof, or a verified
postal address.

## Core Contract

The core AGID model must be:

- deterministic across platforms,
- independent of the current map viewport,
- usable offline,
- portable to every SDK target,
- stable at the equator, prime meridian, antimeridian, poles, and Null Island,
- able to provide the exact selected-cell polygon used by the visible grid.

The visual rule is simple: the black grid line and the red selected cell must come from the same quantized cell boundary. If they do not share the same source geometry, the UI can drift during pan, zoom, pitch, or device-pixel changes.

## Coordinate Assumptions

The current implementation uses WGS84-like latitude/longitude inputs and a spherical model for grid math.

Input:

```text
latitude  lat in degrees
longitude lon in degrees
```

Internal radians:

```text
phi   = lat * pi / 180
theta = lon * pi / 180
```

Unit sphere vector:

```text
x = cos(phi) * cos(theta)
y = cos(phi) * sin(theta)
z = sin(phi)
```

Longitude is normalized to the `[-180, 180]` range for region lookup and antimeridian handling.

## Cubed-Sphere Face Selection

AGID maps the sphere to six cube faces.

```text
absX = abs(x)
absY = abs(y)
absZ = abs(z)
```

The face is selected by the dominant axis:

- `face 0`: positive X
- `face 1`: negative X
- `face 2`: positive Y
- `face 3`: negative Y
- `face 4`: positive Z
- `face 5`: negative Z

For the selected face, local face coordinates are derived as:

```text
xi  = uc / max(absX, absY, absZ)
eta = vc / max(absX, absY, absZ)
```

`xi` and `eta` are in the face-local range near `[-1, 1]`.

## Equal-Area-Style Tangent Correction

The current TypeScript core uses a tangent correction pair:

```text
E(t)      = tan(t * pi / 4)
E_inv(a)  = atan(a) * 4 / pi
```

Encoding applies the inverse correction before quantization:

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

This should be described as an equal-area-style or near-uniform tangent correction until empirical distortion reports prove the exact area behavior. The documentation and code comments should avoid overclaiming beyond measured min, max, and average cell sizes.

## Quantization

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

Each cube face has:

```text
K * K = 2^42 cells
```

All six faces have:

```text
6 * 2^42 = 26,388,279,017,472 cells
```

Using Earth radius `R = 6,371,000 m`, the average cell area target is approximately:

```text
Earth area        = 4 * pi * R^2
Average cell area = Earth area / (6 * 2^42)
Average side      = sqrt(Average cell area) ~= 4.4 m
```

The app currently reports an average grid size around `4.4 m`. The next validation pass should measure real min, max, mean, and standard deviation over representative latitudes, faces, face edges, poles, and antimeridian samples.

## Hilbert Curve Ordering

Within each face, AGID uses a Hilbert curve to map `(qx, qy)` into a one-dimensional value:

```text
h = Hilbert_L(qx, qy)
```

Because `L = 21`, the Hilbert value uses:

```text
2 * L = 42 bits
```

Why Hilbert:

- better spatial locality than simple row-major ordering,
- useful for future range scans and nearby-cell operations,
- deterministic and portable across SDKs,
- compact enough for the 10-character hash payload.

The inverse operation must recover:

```text
(qx, qy) = Hilbert_L^-1(h)
```

## Bit Packing

AGID packs the face and Hilbert value:

```text
packed = (face << 42) | h
```

Bits used:

```text
face    = 3 bits
hilbert = 42 bits
total   = 45 bits
```

The 10-character hash uses Base32 capacity:

```text
10 chars * 5 bits = 50 bits
```

So the current hash has spare representational capacity. SDKs should still treat the current contract as 45 used bits inside a 10-character Base32 field.

## Base32 Alphabet

Current alphabet:

```text
0123456789ABCDEFGHJKMNPQRSTVWXYZ
```

The alphabet omits ambiguous letters such as `I`, `L`, `O`, and `U`.

Hash:

```text
hash = base32_10(packed)
```

Full AGID:

```text
AGID = prefix_2 + hash_10
```

Total length:

```text
12 characters
```

## Prefix Model

The 2-character prefix is separate from the coordinate hash. It is a region and display/routing hint, not the source of cell geometry.

Land:

- ISO 3166-1 alpha-2 where available.
- Special, disputed, overseas, or autonomous regions can use internal claim-aware codes.

Open ocean:

- letter + number.

Coastal and named seas:

- number + letter.

Other fallback regions:

- number + number.

Important rule:

- Sea prefixes must not collide with country-style alpha-alpha codes.
- Japanese claim-aware regions can keep Japan's claim display at the top while avoiding accidental display of other countries for Japan-specific disputed territories.

## Decoding

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

The decoded latitude/longitude represents the quantized cell corner or representative point depending on the calling function. For display and registration correctness, downstream code should prefer the full cell polygon or bounds rather than treating the decoded point as the whole address.

## Cell Polygon and Bounds

Cell polygon is built from the same quantized coordinates:

```text
p1 = inverse(face, qx,        qy)
p2 = inverse(face, qx + step, qy)
p3 = inverse(face, qx + step, qy + step)
p4 = inverse(face, qx,        qy + step)
```

The polygon is:

```text
[p1, p2, p3, p4, p1]
```

Antimeridian handling shifts longitudes relative to the first corner so the polygon does not draw across the whole world.

The selected red grid cell must use this exact polygon. The surrounding black grid lines must be derived from the same quantized boundary system.

## Viewport Grid Rendering Rule

The visible grid is a rendering layer, not the source of truth.

Current direction:

- The grid is generated from absolute AGID cell boundaries.
- Panning or zooming should trigger fast regeneration from the same quantized model.
- The screen should show either full grid coverage or no grid, not partial stale coverage.
- Display thresholds should be based on viewport scale. The current code uses a width threshold in meters and no height rule.
- Selected-cell geometry should never be independently approximated from screen pixels.

The practical rule is:

```text
black grid boundary = AGID cell boundary
red selected fill   = same AGID cell boundary
```

If the map has pitch, bearing, fractional zoom, device-pixel scaling, or delayed worker responses, stale grid responses must be ignored by request ID.

## Region Lookup Model

Region lookup is separate from cell math.

Current implementation uses:

- sea and country/territory region datasets,
- a 2-degree spatial index for narrowing candidate polygons,
- land-first logic,
- priority regions for Japan, disputed areas, overseas territories, and autonomous territories,
- sea fallback based on named seas and major ocean regions,
- last-result cache for nearby repeated lookups.

This means:

- the same coordinate hash can be decoded without a region database,
- richer region labels require region data,
- SDKs can choose core-only mode or data-pack mode.

## Address Quality Model

The address quality model is intentionally outside the pure grid math.

AGID quality can combine:

- postal-code metadata,
- official postal APIs,
- open-source geocoders,
- OpenStreetMap/OpenFreeMap/Overture building and place evidence,
- national GIS datasets,
- OpenAddresses-style reference data,
- manual user confirmation.

The quality state should be explicit:

- verified,
- geo verified,
- partial,
- no postal code,
- manual required.

The grid ID can still be valid even when the address text is partial.

## Consensus and Confidence

The current utility includes entropy-based consensus:

```text
H = -sum(p_i * log2(p_i))
confidence = 1 - H / log2(n)
```

If there is one candidate, confidence is `1`. When several sources disagree, entropy rises and confidence falls.

This is useful for:

- address-source agreement,
- multilingual rendering consistency,
- postal/geocoder/reference conflict display,
- deciding when to show manual confirmation.

## Natural Feature Model

Natural-feature handling is not part of the core cell encoding, but it affects address display.

Relevant evidence classes:

- sea and ocean regions,
- lakes, rivers, coastlines, bays, straits, channels,
- mountains, slopes, relief, elevation,
- protected natural areas,
- no-permanent-address regions.

The mountain-class helper currently follows threshold-style elevation/slope/relief classification. This should remain an evidence layer, not a replacement for official topographic datasets.

## SDK Contract

Every SDK should implement or call a common core with:

```text
encode(latitude, longitude) -> AgidResult
decode(agid) -> AgidDecoded | null
cellBounds(agid) -> bounds
cellPolygon(agid) -> lon/lat polygon
```

Required SDK invariants:

- identical Base32 alphabet,
- identical constants `L`, `K`, and `M`,
- identical face selection,
- identical tangent correction,
- identical Hilbert encode/decode,
- identical bit packing,
- identical test vectors.

Minimum test vectors:

- Tokyo Station,
- Null Island,
- New York City,
- antimeridian east/west,
- North Pole-adjacent sample,
- South Pole/Antarctica sample,
- face-edge samples,
- sea and land prefix samples.

## Current Strengths

- Deterministic global coordinate-to-ID model.
- Near-uniform cubed-sphere style quantization.
- Hilbert locality inside each face.
- Compact 12-character ID.
- Region prefix separated from coordinate hash.
- Optional WASM acceleration path.
- Grid worker request IDs and cache path for faster rendering.
- Cell polygon available for selected-cell display.

## Known Mathematical Risks

- The equal-area claim should be validated empirically and worded carefully until distortion measurements are documented.
- Face edges can create visual seams if neighbor generation is not face-aware.
- The red selected cell and black grid can drift if one is generated from encoded cell polygons and the other from viewport pixel sampling.
- Antimeridian polygons require longitude shifting.
- Prefix collision rules for non-ISO, sea, and disputed areas must remain tested.
- SDK stubs must be completed before claiming production SDK parity.
- Region lookup polygons are data quality concerns, not pure math correctness.

## Validation Needed

Add or keep tests for:

- encode/decode round trip by sample point,
- cell polygon closes exactly,
- black grid and selected red cell share boundaries,
- no stale worker response overwrites newer grid,
- full coverage or no grid, never partial stale coverage,
- cell size min, max, average, and standard deviation,
- face-edge neighbor continuity,
- antimeridian display continuity,
- pole-adjacent stability,
- prefix category rules,
- SDK test-vector parity.

## Recommended Next Algorithm Work

1. Build a `grid-statistics` script that samples cells globally and reports min, max, mean, median, and standard deviation.
2. Add a reference implementation test that compares TypeScript and WASM output for the same vectors.
3. Make viewport grid generation explicitly derive start/end quantized cell ranges from map bounds.
4. Add an invariant test: selected-cell polygon boundaries must be present in the visible grid line set when the cell is visible.
5. Add SDK golden tests generated from `agid-spec.json`.
6. Add optional interoperability exports for Plus Code, geohash, H3, or S2 only as bridges, not as the AGID source of truth.

## Companion Documents and Boundary Map

The mathematical model resume is now in English and should stay narrowly focused
on the coordinate-to-cell contract. The companion documents below carry the
parts that should not be folded back into the AGID math resume:

1. **Address Verification Engine Resume**
   - Explain official postal sources, open-source fallback sources, country
     coverage, postal-code matching, deliverability limits, and internal quality
     scoring. This should be separate from the pure grid model because an AGID
     can be mathematically valid even when address evidence is partial.
   - Current reference: `docs/address-verification-competitor-comparison.md`.

2. **Privacy and Zero-Knowledge Proof Resume**
   - Summarize AOID ownership proofs, duplicate-registration nullifiers, PID
     issuance audit proofs, region-membership proofs, revocation freshness,
     consent scopes, and anonymous rate limits. This should avoid claiming full
     cryptographic ZK unless the implementation uses a formal ZK circuit.
   - Current references: `docs/address-morphism-theory-ii-zero-knowledge-address-predicates.md`
     and `docs/zk-address-proof-materials-roadmap-ja.md`.

3. **Natural Feature and Map Evidence Resume**
   - Cover rivers, waterfalls, lakes, islands, deserts, salt lakes, wetlands,
     ice fields, grasslands, forests, glaciers, caves, valleys, heritage sites,
     research stations, and named public map features. This should define how
     map evidence becomes display text without becoming a private address.
   - Current reference: `docs/address-morphism-theory-verified-resume.md`.

4. **Formal Verification and GIS Validation Resume**
   - Connect Lean-level lemmas, SDK parity vectors, GIS sampling, distortion
     reports, antimeridian/pole tests, face-edge tests, and grid-rendering
     invariants. This is the right place to state which claims are proven and
     which are empirically validated.
   - Current references: `formal/`, `docs/address-morphism-lean-gis-cross-verification.md`,
     and `docs/address-morphism-theory-verified-resume.md`.

5. **Data License and Source Governance Resume**
   - Summarize government, postal, OSM/OpenAddresses/Overture, NASA, space
     agency, and map-provider source rules. This matters for open-source release
     safety and for separating reusable open data from credentialed APIs.
   - Current reference: `docs/data-licenses.md`.

6. **AGID/AOID Communication and Audit Resume**
   - Document public AGID surfaces, private AOID surfaces, registration flows,
     sync boundaries, audit events, key rotation, revocation, and server-side
     retention rules.
   - Current references: `docs/agid-aoid-design.md`,
     `docs/aoid-detailed-paper-ja.md`, and `docs/address-morphism-network-resume.md`.

Recommended documentation corrections:

- Keep `README_AGID_MODEL.md` and this resume aligned with the current
  cubed-sphere + Hilbert model.
- Avoid older claims based on equirectangular quantization, Morton ordering,
  `2^25` axes, or `0.6 m` cells unless explicitly marked as historical.
- Avoid exact equal-area claims until global distortion measurements are added.
- Distinguish public AGID validity from address deliverability and AOID
  ownership.
- State that language tabs are address-language evidence, not app UI language.

## Summary

AGID's mathematical identity is:

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

The product identity is broader, but the math identity must remain this small, deterministic, testable core.
