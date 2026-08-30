# Iceland Postal Context M2

This directory publishes Iceland's experimental current postcode-area runtime.
It contains 174 searchable three-digit postcode areas built from the 175-feature
Byggðastofnun `postnumer` WFS snapshot retrieved at
`2026-08-30T12:20:57.000Z`. The raw WFS response is not committed.

## Authority and geometry

Byggðastofnun is the statutory postcode-register and geographic-coverage
authority. The release pins the authority page, metadata record, WFS
capabilities, schema, explicit EPSG:4326 query, byte digest, edition and source
dates. The exact reuse attribution is in `M2-SOURCE-NOTICE.md`.

The source contains 175 features and 174 distinct codes; code `310` has two
source features which are deterministically unioned. Sixty-one source features
were invalid under JSTS and three edge cases required bounded epsilon/simplify
repair. The resulting 62 repaired codes are labelled `derived_geometry` with
confidence `0.99999`; the remaining 112 are `official`/authoritative with
confidence `1`. Maximum relative area change is below `0.00001`.

Twelve source-preserved overlaps above 0.01 m² remain multiple-candidate
evidence. They are not clipped, assigned to a neighbour, or replaced with an
administrative/AGID surface. Every published feature is a real Polygon or
MultiPolygon from the postcode source; no point, route, PO box, organisation,
address, building, customer, recipient or land-right row receives an invented
area.

## Application path

The pinned descriptor loads through the normal AGID pack store. A country `IS`
and normalized `NNN` search calls `/api/postal/IS/{postcode}`, returns the real
area and provenance, converts it to the application feature collection, fits
the map bounds and uses fill opacity `0.22`, outline opacity `0.95` and outline
width `3`. Shared UI handling remains fail-closed for loading, no result,
multiple candidates, API failure and invalid geometry; clear and re-search are
covered by the country harness.

## Evidence separation

- Byggðastofnun: current postcode assignment and area geometry.
- Pósturinn: routing/service reference only; no polygon authority here.
- HMS Staðfangaskrá: separate address-point evidence, not bundled in M2.
- IS 50V buildings: separate topographic candidate, not an address link.
- Statistics Iceland: statistical context, not a postcode boundary.
- AGID: spatial index/lookup, never the canonical postal surface.

Files:

- `repository-manifest.json`: Iceland-specific rules and M2 definition.
- `source-profile.json`: source roles, pinned release and rights evidence.
- `M2-SOURCE-NOTICE.md`: required attribution and reproducibility record.
- `m2/{descriptor,graph,geometry}.json`: public runtime artifact.
- `fixtures/iceland-synthetic.json`: test-only, non-geographic M1 fixtures.
