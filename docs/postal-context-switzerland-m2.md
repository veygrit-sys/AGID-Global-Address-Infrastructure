# Switzerland Postal Context M2 implementation

## Technical summary

CH reaches **M2 verified** for the pinned `2026-08-11` swisstopo official directory of towns, cities and postcodes. The AGID runtime publishes a content-addressed, topology-valid display derivative covering all 4,060 Swiss domicile-address NPA6 perimeter features as 3,177 NPA4 Polygon/MultiPolygon results. Searching a Swiss postcode through the real API path produces a map-fit, 0.22-opacity fill and clear outline with provenance, source date and confidence. Thirteen Liechtenstein features are deterministically excluded.

## Key findings and evidence

| Evidence | Verified result | Decision impact |
| --- | --- | --- |
| swisstopo STAC item | Current item dated `2026-08-11`; Shapefile SHA-256 `a58e…60a` | Pins the real source edition |
| swisstopo OGD conditions | Distribution, access, enrichment, processing and commercial use permitted with attribution | Allows the derived public artifact and API response |
| Official source profile | 4,073 Polygon features: 4,060 CH and 13 LI | Supplies a complete product denominator and country split |
| LV95/WGS84 validation | 5,716 paired rows; maximum difference 0.001238 m | Validates the coordinate transformation independently |
| Derived artifact | 3,177 NPA4 features, 679,832 positions, valid topology | Fits pack and response safety limits without claiming survey precision |
| Real API/app path | `1000` returns MultiPolygon; fit, translucent fill, outline, clear/re-search and state handling pass | Meets the visible postcode-area requirement |

A table is more honest than a chart here: the decisive facts are release identity, rights, geometry validity and authority separation, not a continuous performance trend.

## Scope, data and definitions

The authoritative input is swisstopo's official directory, maintained with cantons and Swiss Post. It contains domicile-address postcode types represented by locality/postcode perimeters. Professional, company, internal, administrative and P.O.-box codes absent from this product remain non-area. NPA4 is the public four-digit lookup key; NPA6 is source refinement evidence and is not silently truncated as if it were a separate public code.

The committed geometry is explicitly `derived`, not an exact official or cadastral boundary. It is transformed from EPSG:2056 to EPSG:4326, simplified within five metres for display, quantized to six decimals and assigned a conservative seven-metre accuracy. It does not establish deliverability, house number, entrance, building, parcel, owner, occupant or recipient. Those require separate permitted stable relations.

## Methodology

Eight official receipts are pinned by byte length and SHA-256. The deterministic builder parses DBF and Polygon Shapefile bytes without a native GIS dependency, joins `ZIP_ID` to the official CSV, separates CH from LI through the canton field, converts LV95 with the published CH1903+ definition and checks every CSV coordinate against swisstopo's WGS84 CSV.

Each NPA6 perimeter is simplified before NPA4 aggregation. Three reviewed postcodes (`6072`, `6073`, `6976`) produced five simplification kinks and are deterministically split into valid polygons; any unreviewed kink fails the build. The runtime then verifies schemas, topology, position budgets, byte lengths, artifact digests and the graph manifest digest. Raw source archives remain temporary and are not committed.

## Limitations, uncertainty and robustness

The source product is monthly, while this artifact is intentionally fixed at `2026-08-11`; newer live changes require a new release. Five-metre simplification plus coordinate quantization makes the artifact suitable for UI context, not survey, cadastral or doorstep decisions. Confidence `0.99` describes lineage and deterministic transformation, not a probability that every delivery point belongs to the drawn surface.

The denominator is the official perimeter product, not every Swiss postal-routing code. The app reports no area rather than fabricating one for excluded code classes. LI identity is preserved for its separate pack and never merged into CH.

## Recommended next steps

Automate the next monthly STAC refresh as a new immutable release, diff NPA4/NPA6 membership and geometry, rerun CH/LI partition and topology checks, and retain the prior descriptor for rollback. Add a browser screenshot test when the project browser harness can run MapLibre deterministically; the current integration test already verifies the real API payload, feature conversion, bounds, fill/outline paint and clear/re-search behavior.

## Further questions

- Should the UI offer NPA6 locality selection when one NPA4 contains multiple source areas?
- What retention window should apply to monthly historical PLZO releases?
- Which official building-address and EGID relations should be added as a separately licensed address-context layer?

Next is **CY (Cyprus)**. No second country was started.
