# Finland Postal Context M2 evidence

Finland reaches the rollout criterion
`M2_current_posti_assignment_and_paavo_statistical_area_visualization` with a
non-synthetic, digest-pinned runtime release. Posti establishes current
five-digit assignments; Statistics Finland Paavo 2026 supplies separate
official-derived statistical display geometry. Paavo is not called a Posti
delivery perimeter or a canonical postal polygon.

## Data and authority result

Posti `PCF_20260829` contains 3,784 unique fixed-width records. The deterministic
FI partition publishes 3,747 records and excludes all 37 Åland records identified
by `FI200` plus `22xxx`. Of 2,985 normal FI assignments, 2,976 join exactly to a
Paavo `pno_2026` Polygon/MultiPolygon. Nine current normal assignments have no
Paavo 2026 geometry. Another 762 assignments are PO Box, corporate, compilation,
reply-mail, parcel-machine or pickup-point classifications. All 771 outcomes
remain non-area; no buffer, Voronoi, municipality, address point or building is
substituted.

The full Paavo source contains 3,018 features (2,740 Polygon, 278 MultiPolygon),
725,808 positions and 8,114 rings. Every feature passed Turf `booleanValid`, all
rings close, and all coordinates are finite WGS84 values. The published FI join
contains 2,976 features and 652,032 positions.

## Reuse and reproducibility

The [source notice](../data/postal_country_packs/fi/postal-context/M2-SOURCE-NOTICE.md)
records official URLs, capture/download date, versions and SHA-256 values. It
accompanies the transformed Posti assignment artifact as required by the
reviewed Posti terms. Statistics Finland attribution and CC BY 4.0 are included.
Raw downloads, addresses, people, customers, recipients, buildings and land
rights are not committed.

[`scripts/build-postal-context-fi-m2.mjs`](../scripts/build-postal-context-fi-m2.mjs)
fails closed on both input digests, PCF record schema, duplicate codes, Paavo
identity/year/type, topology, ring closure, coordinate range and runtime budgets.
A second build to a separate directory reproduced identical graph, geometry and
descriptor hashes.

## Application path

The pinned descriptor loads through the real Postal Context pack loader. The
HTTP API normalizes `00 100` to `00100` and returns the real Paavo Polygon with
`assignmentAuthority=official_postal_operator`, `geometryAuthority=derived_geometry`,
source date and confidence `0.95`. The application converts it to GeoJSON,
computes fit bounds, draws a background-visible fill (`0.22`) and clear outline
(`0.95`, width `3`), and supports clear plus re-search.

Loading, API failure and ambiguous results already have explicit states. This
change adds fail-closed validation for malformed API Polygon/MultiPolygon and
specific reasons for PO Box, organization, route/endpoint, and current normal
codes lacking the selected Paavo boundary. Tests prove corporate `00022` and
normal `42720` receive no invented area, and `22100` remains outside FI.

## Verification

- Finland country suite: 149 passed, 0 failed.
- Shared Postal Context runtime suite: 159 passed, 0 failed.
- TypeScript: `tsc --noEmit` passed.
- Deterministic rebuild: graph, geometry and descriptor SHA-256 all matched.
- Browser E2E was not required; a deterministic real HTTP API plus application
  conversion/map-layer harness verifies the same render, fit, clear and re-search
  behavior.

Machine-readable evidence is in
[`fi-source-review-2026-08-30.json`](../reports/postal-context-m2/fi-source-review-2026-08-30.json)
and [`fi-checks-2026-08-30.json`](../reports/postal-context-m2/fi-checks-2026-08-30.json).
