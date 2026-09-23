# Postal Context research and real-polygon integration

AGID exposes the cumulative Postal Context investigation as a generated, public-safe research catalog while keeping rollout status, runtime availability, and address authority separate.

## Current integrated snapshot

The catalog is generated from `docs/postal-context-m2-rollout.json` and every committed digest-pinned real M2 descriptor under `data/postal_country_packs/*/postal-context/m2/`.

- 252 country and territory research profiles
- 132 blocked, 102 pending, and 18 `m2_verified` rollout records
- 176 country manifests and 162 explicit country-specific M2 definitions
- 19 committed non-synthetic runtime artifacts
- 46,291 Polygon/MultiPolygon features and 3,533,674 coordinate positions
- 46,050 derived-source and 241 official-source geometry features

The generated artifact is `data/postal-context/research-catalog.json`. It includes rollout status, country-specific M2 definition, latest attempt, blocker and review date, verified report references, fixed descriptor and artifact digests, geometry/source class counts, and sample Postal Context, geometry, assertion, and linked-context IDs.

`blocked` does not mean that no research geometry can be displayed. Puerto Rico is intentionally represented as `blocked` for full M2 because a complete current redistributable USPS assignment denominator is unavailable, while its fixed 132-feature Census ZCTA pack remains available as explicitly `derived` statistical display context. Conversely, a country is never marked M2 complete merely because a runtime artifact exists.

## API and application

- `GET /api/v1/postal/research` returns the complete catalog.
- `GET /api/v1/postal/research/{country}` returns one country, including its runtime artifact and evidence state.
- `GET /api/v1/postal/capabilities` advertises research availability and aggregate counts independently from configured runtime packs.
- Postal search retrieves the country research record alongside the real geometry lookup. The visible detail card shows Postal Context ID, geometry feature ID, assertion IDs, linked context IDs, source, licence, release, country M2 state, latest validation result, fixed artifact counts, descriptor SHA-256, evidence integrity, and remaining gate.

The map still draws only eligible real Polygon/MultiPolygon geometry returned by the Postal Context API. Point, route, P.O. box, organization, missing geometry, and invalid geometry are not converted to invented surfaces.

## Runtime activation

Research metadata is available by default. Loading every committed real research pack into the runtime is an explicit validation opt-in:

```dotenv
AGID_POSTAL_CONTEXT_ENABLE_COMMITTED_RESEARCH_PACKS=true
AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL=true
```

`AGID_POSTAL_CONTEXT_ENABLE_COMMITTED_RESEARCH_PACKS` does not imply experimental or synthetic permission. Every fixed pack currently has `M2_experimental` maturity, so `AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL=true` is separately required. Explicit per-country descriptor settings always take precedence; an incomplete explicit configuration fails closed instead of falling back to the catalog.

The fixed JSON and evidence artifacts are marked `-text` in `.gitattributes` so Windows checkout does not replace the exact LF bytes and invalidate the descriptor SHA-256.

## Reproduction and verification

```bash
npm run build:postal-context-research-catalog
npm run verify:postal-context-research-catalog
npm run typecheck
```

The builder strictly verifies descriptor, graph, and geometry byte lengths, SHA-256 values, countries, record counts, and coordinate-position counts. Report evidence is classified as `verified`, `digest_mismatch`, or `missing`; an older Singapore engineering-report pin is currently surfaced as `digest_mismatch` instead of being silently trusted.

The real application path was also exercised in Chrome at desktop (1440×1000) and mobile (390×844) viewports. A deterministic geocoder result selected the real PR `00926` runtime response; the Postal Context and research APIs were not mocked. The check verified translucent fill, clear outline, background-map visibility, bounds fit, mapped postal/geometry/context/assertion IDs, research and descriptor evidence, mobile evidence-card scrolling, clear, and re-search to real PR `00612`. The submitted-search path now collapses the result sheet, and desktop fit reserves space for the evidence card so geometry and IDs remain visible together. The machine-readable receipt is `reports/postal-context-m2/agid-research-integration-2026-09-02.json`.

The catalog contains no raw source dumps, recipients, customers, residential address points, parcel/land-right data, or inferred addresses/buildings. Postal Code → Polygon → Address Context authority remains explicit, and AGID remains only the independent spatial reference/candidate index unless a separate source-backed relation says otherwise.
