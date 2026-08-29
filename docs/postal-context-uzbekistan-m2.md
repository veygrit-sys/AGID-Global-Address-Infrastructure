# Uzbekistan Postal Context M2 review

## Decision

UZ remains **M2 blocked**. The current official UzPost app demonstrably
supports six-digit postcode search, a response-specific polygon, translucent
fill, visible outline and map fit. AGID may not ingest or serve those rings yet:
written reuse rights, national completeness, geometry semantics, CRS, release
version, immutable publication and a real UZ AGID runtime/API/app path are not
established.

## Definitions and gate

`M2_current_operator_postal_area_visualization` requires a current complete-
for-declared-coverage assignment and permitted Polygon/MultiPolygon artifact,
with code-to-area semantics, jurisdiction, validity, CRS, topology, terms,
edition and SHA-256 pinned. The immutable approved artifact must load through
the UZ runtime/API and the app must normalize search, distinguish all result
and failure states, fit the map, render a translucent fill and clear boundary,
clear/re-search, and show authority, source, basis date and confidence.

A public GET or operator map proves behavior, not redistribution rights.
Office points, administrative borders, buffers, Voronoi cells and models are
not official postal areas. Buildings and house numbers require a separate
explicit permitted stable address relation.

## Evidence

Ten official references were bound to exact bytes and SHA-256. The current
operator list contains 1,593 unique six-digit indices. Of those rows, 1,591
have parseable in-range office coordinates and two have malformed longitude
strings (`190108`, `190100`); the list has no geometry field.

A bounded detail request for `100000` returned one closed 98-vertex ring. The
sample is finite, non-zero-area and has no detected self-intersection; its
bounds are `[41.305219, 69.269033, 41.327734, 69.310162]`. Server style is
fill `#b51eff` at opacity `0.3`, stroke `#595959` at opacity `1` and width `2`.
The reviewed current client calls the list and detail endpoints, constructs a
Yandex Polygon from `locations`, applies server fill/stroke and calls
`setBounds`. It also contains a by-address lookup path.

The 07/2019 UPU sheet establishes six-digit formatting and office/hub address
semantics, not current complete polygon coverage. The current government
registry links “Zip Code Addresses”, but the exact dataset bytes and dataset-
specific rights receipt could not be resolved. The archived 2019 dataset is a
branch/office/index table without geometry and was not retrieved as exact
bytes in this run.

## Rights decision

The public-offer response applies to the UzPost website and mobile app and
makes registration or use contract-sensitive. It contains no verified grant
for bulk reuse, derivative polygons, persistent external API calls, immutable
snapshot publication or redistribution. CORS capability and unauthenticated
GET access are technical facts, not licences. No account, registration,
contract acceptance, application or payment occurred.

## Method and validation

The audit re-read the ten preserved source bodies outside Git and rejected any
byte or digest drift. Deterministic checks verified office-list grain, postcode
syntax, duplicate count, coordinate failures, ring closure, bounds, area,
self-intersection count, client endpoints, Polygon construction, styling and
fit. Repository, runtime, route, catalog, shared API/UI and TypeScript checks
are recorded in the engineering receipt.

No chart is included: a chart based on one detail sample would visually imply
national coverage. Exact counts and the explicit 1-of-1,593 sampling limit are
the honest representation.

## Limitations

Only one detail endpoint was requested; bulk harvesting was deliberately not
performed. National polygon presence, topology, gaps/overlaps, code exceptions,
area meaning and temporal validity remain unknown. No version, ETag,
Last-Modified or CRS was observed. The shared app has deterministic polygon
rendering tests, but no eligible UZ real-data descriptor or end-to-end result;
its visible notice also lacks distinct authority, basis-date and confidence
fields.

## Unblock and next action

After the pending-country pass and no earlier than
`2026-09-05T06:40:00.000Z`, recheck for a public rights-cleared release. Using
the live corpus requires explicit approval plus written operator permission
for bulk retrieval, derivation, persistence, redistribution, immutable
publication and AGID API serving. Then validate all declared coverage,
exceptions, CRS and topology, publish an approved immutable artifact outside
AGID, and verify a real UZ API/app result with provenance.

The next country in the ledger is **VN (Vietnam)**. No second country was
started in this run.

## Further questions

- Does UzPost define `locations` as a delivery area, service area or display
  aid, and in which CRS/version?
- Is every one of the 1,593 indices expected to have a ring, including P.O.
  boxes, organizations or route-like codes?
- Can UzPost or the government portal issue an explicit reusable immutable
  national release rather than requiring sustained calls to the live service?
