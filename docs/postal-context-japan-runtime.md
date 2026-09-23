# Japan Postal Context runtime

Status: `M2 runtime-ready / M1 Japan data`

This document describes the AGID-side runtime for a separately released Japan
Postal Context pack. The runtime, integrity checks, spatial resolver, HTTP API,
and TypeScript client are implemented here. Nationwide Japanese production
geometry is deliberately not bundled: the current Japan seed remains metadata
and synthetic fixtures until source-specific redistribution and quality gates
are satisfied.

The shared graph contract is defined in
[`postal-context-graph-v0.1.md`](postal-context-graph-v0.1.md), and repository
ownership is defined in
[`postal-context-repository-boundary.md`](postal-context-repository-boundary.md).

## 1. Polygon construction rule

Let `A_i` be licensed atomic geometries such as town/aza polygons and let
`I_c` be the atoms for which evidence proves that postal code `c` applies to
the whole atom. A derived postal region can be constructed deterministically as

\[
R_c = \operatorname{MakeValid}\left(\bigcup_{i \in I_c} A_i\right).
\]

This operation is geometrically simple. The difficult part is proving the
membership of every `A_i` in `I_c`. The following rules are mandatory:

- A whole-town assignment may be dissolved from its licensed atomic geometry.
- A partial-town, number-range, floor-range, named-exception, PO-box, route, or
  large-user assignment must not be expanded to the whole town.
- Overlaps, gaps, slivers, holes, self-intersections, zero-area rings, and
  antimeridian cases must be validated before publication.
- Assignment authority and geometry authority remain independent. An official
  postal assignment plus a derived dissolve is still `derived_geometry`, not
  `official_postal_geometry`.
- Voronoi cells, alpha shapes, buffers, kernel estimates, and AGID cell unions
  may produce useful experimental or virtual coverage, but must never be
  presented as an official postal boundary.

For an AGID candidate index at resolution `q`, a postal region may be projected
to a cell cover

\[
C_c(q) = \{g \in G_q \mid g \cap R_c \neq \varnothing\}.
\]

`C_c(q)` is an acceleration structure. The final answer is always computed
against the original geometry, so a boundary cell never proves postal membership by itself.
### 1.1 Offline/online hybrid generation

The production design is a two-layer system, not per-request polygon invention:

```text
immutable source snapshots
  -> deterministic base geometry + topology + provenance
  -> compressed multi-resolution artifacts + AGID candidate cover
  -> verified source delta
  -> bounded affected-region rebuild
  -> atomic release activation
  -> real-time lookup against the activated release
```

For an activated base time `t_0`, a later candidate can be represented as

\[
R_c(t) = R_c(t_0) \mathbin{\triangle} \Delta_c(t),
\]

where `Delta_c(t)` is an evidence-backed change set and `triangle` is the
symmetric difference. The delta is not served as authoritative merely because
it is fresh: source identity, digest, validity, topology, license, and regression
gates must pass before atomic activation. Requests continue to use the previous
verified release until then.

A mathematical or learned model is useful for candidate generation, anomaly
detection, source-link ranking, missing-area discovery, and virtual coverage.
It does not create new official truth. Model output carries a pinned model ID
and digest, training-data release IDs, method, uncertainty/accuracy, validation
status, and `derived` or `virtual` authority. It cannot raise an address above
the evidence ceiling of the source assertions.

Most storage cost is geometry, not the seven-character Japanese postal-code
string. Recommended lossless/controlled representations are:

- shared-arc topology so adjacent postal regions store a boundary once;
- integer coordinate quantization followed by delta and varint encoding;
- PMTiles or FlatGeobuf for range-addressed spatial reads;
- GeoParquet for canonical analytical columns and predicate pushdown;
- multiple deterministic levels of detail, while retaining the original
  geometry for final boundary decisions;
- dictionary/front coding for repeated postal, municipality, source, and
  license identifiers;
- sorted AGID cell ranges or bitmaps as a coarse candidate index.

This improves latency and data size without moving correctness into request-time
code. Real-time generation is reserved for `derived_candidate` or
`virtual_fallback` responses and must remain distinguishable from
`precomputed_verified` and `verified_delta`. A future public response may
expose this as `generationMode`, together with `geometryVersion`,
`modelDigest`, `accuracyMeters`, `qualityStatus`, and `sourceDate`.

## 2. Address resolution ceiling

The public coordinate flow is:

```text
coordinate
  -> indexed postal candidates
  -> exact point-in-polygon / boundary test
  -> source-authorized public address point
  -> AddressRecord assertions
  -> public building / entrance assertions
  -> AGID spatial reference
```

A postal polygon alone stops at `postal-area`. It cannot supply a block,
residence number, parcel, building name, entrance, unit, occupant, or delivery
guarantee. Promotion to premise or building requires a separately sourced
public civic/facility address point and a coherent, time-valid assertion path.
The match radius is supplied by that source; the runtime does not invent one.

Boundary matches, multiple address points, and conflicting paths are returned
as `ambiguous` or `conflict`, rather than silently selecting the nearest item.
Real residential points, private entrances, units, recipients, phone numbers,
and delivery instructions are forbidden from the public pack.

Definitive lookup and address promotion is governed by one assertion policy
covering quality status, evidence method, source authority, relation, and the
source/target node kinds. E4 `nearest` and E5 `virtual_grid` assertions may
remain candidate or virtual evidence, but cannot promote locality, premise,
building, or navigation context in the public runtime. At M2, a definitive
address-point anchor must also use a non-derived source and an explicit official
address, municipal, cadastral, mapping, or 3D geometry authority. Derived points
remain candidates until a country-policy source allowlist, holdout gate, and E3
evidence propagation are implemented together.

## 3. Digest-pinned pack

The server reads exactly one descriptor and two local artifacts (`graph` and
`geometry`). It validates the externally supplied descriptor SHA-256 before
JSON parsing, then checks bounded file sizes, regular-file containment, strict
UTF-8, duplicate keys, exact byte lengths, artifact SHA-256 values, counts,
schema versions, identities, graph manifest digest, topology, provenance,
publication classes, and privacy rules.

Before allocating the in-memory spatial indexes, postal polygons and public
address points share fail-closed construction limits: 500,000 bucket postings,
250,000 distinct buckets, 512 global features, and 4,096 cells per feature. A
digest-correct pack that exceeds any limit is rejected; it cannot amplify a
bounded artifact into unbounded startup memory, and the configured verified LKG
remains the only fallback.

No branch head, mutable `latest` URL, GeoNames nearest-point result, external
geocoder, or legacy postal database is used as a fallback. A separately pinned
last-known-good descriptor can be configured; if neither active nor LKG pack is
valid, Postal Context endpoints fail closed with HTTP 503. The M2 runtime serves
only the verified active pack or that configured LKG; an immutable historical
release catalog is an M3-or-later capability and is not implied here.

Configure the active release with:

```dotenv
AGID_POSTAL_CONTEXT_JP_DESCRIPTOR_PATH=C:\absolute\path\jp-descriptor.json
AGID_POSTAL_CONTEXT_JP_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

Optional fail-closed LKG configuration:

```dotenv
AGID_POSTAL_CONTEXT_JP_LKG_DESCRIPTOR_PATH=C:\absolute\path\jp-lkg-descriptor.json
AGID_POSTAL_CONTEXT_JP_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

Experimental and synthetic packs are rejected unless explicitly enabled for a
non-production validation environment:

```dotenv
AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL=false
AGID_POSTAL_CONTEXT_ALLOW_SYNTHETIC=false
```

## 4. API

The stable integration surface is exposed under `/api/v1`; `/api` remains the
server-internal legacy alias.

```text
GET  /api/v1/postal/capabilities
GET  /api/v1/postal/releases/JP
POST /api/v1/postal/resolve
GET  /api/v1/postal/JP/100-0001
GET  /api/v1/postal/intersects?country=JP&bbox=139.74,35.67,139.77,35.70
```

Postal-code lookup omits geometry unless `geometry=geojson` is explicit;
`geometry=none` and an omitted parameter return context without geometry. A
lookup geometry response is capped at 16 features and 20,000 positions. Bbox
intersection accepts `limit=1..16` (default 16) and reports `truncated` when
additional matches exist.

When one postal code has conflicting context branches, lookup returns at most
32 branch-specific `alternatives`; top-level `contexts` and `assertionIds` are
only their intersection. If that branch bound is exceeded, the result remains
`ambiguous`, includes a warning, and leaves the top-level common context empty
rather than constructing a mixed address.

Coordinate resolution requires `validAt`, accepts optional `knownAt`, uses POST,
and returns `Cache-Control: private, no-store`. `validAt` is the real-world time
being evaluated; `knownAt` is the runtime knowledge time. Postal-code and bbox
GETs accept the same names as optional query parameters.

The response does not echo coordinates, address-point coordinates, match
distance, match radius, internal address-point IDs, query node IDs, or path IDs.
It includes the pinned release, resolution status and ceiling, redacted
evidence, and an AGID cell used only as a spatial reference/candidate index.
When a public response includes an assertion ID, whether as a component
`assertionId` or lookup `assertionIds`, it is a stable source/release assertion
ID from the country pack. Transient `runtime:*` assertion IDs and runtime query,
address-point, path, or geometry-feature identifiers are never part of the
public contract.

Callers may provide an `active` release selector or pin all of `releaseId`,
`manifestDigest`, and `policyVersion` for the pack currently being served
(verified active or LKG). A pin that does not match that runtime returns HTTP
409; M2 does not search or fall back to arbitrary historical releases.
`ambiguous`, `conflict`, and `no_match` are normal domain results and return
HTTP 200.

## 5. What remains for nationwide Japan

The code path is ready for a verified Japan pack, but Japan is not yet a
nationwide production dataset. The external `agid-postal-jp` work must still:

1. pin Japan Post, ABR, municipality, PLATEAU, cadastral, and mapping source
   releases with their exact redistribution terms;
2. classify every regular, partial-town, multi-town, large-user, PO-box, route,
   and exception record;
3. construct only license-cleared atomic regions and preserve uncovered areas;
4. link public civic address points, buildings, and entrances from independent
   evidence without publishing residential/private records;
5. pass topology, completeness, holdout, freshness, drift, correction, and two
   consecutive refresh gates before `M4_stable` promotion.

Until those gates pass, the truthful capability is “Japan runtime and contract
complete; nationwide production data not complete.”
