# Iceland Postal Context M2 evidence

## Outcome

Iceland satisfies its country-specific
`M2_current_byggdastofnun_postnumer_visualization` criterion. The current
rights-reviewed Byggðastofnun postcode layer is byte-pinned, transformed
reproducibly into immutable AGID artifacts, loaded through the real API and
verified through the application map conversion/fit/paint path.

## Official source and reuse

Byggðastofnun's postcode page identifies its statutory boundary role and links
the public geodata. The metadata record, WFS 2.0.0 capabilities,
DescribeFeatureType and explicit EPSG:4326 GeoJSON request were captured at
`2026-08-30T12:20:57.000Z`; their lengths and SHA-256 digests are recorded in
the machine report and source notice. Metadata edition 1.0 has temporal end
`2025-05-18`; the layer reports update `2024-08-19`.

The official reuse statement permits copying, reuse and publication with the
attribution `Byggt á gögnum frá Byggðastofnun.` and provider disclaimer. The
review is an engineering rights receipt, not a legal conclusion. No account,
authentication, payment, contract acceptance, new destination or deployment
was used.

## Transform and exceptions

The WFS response has 175 features and 174 distinct three-digit codes. Code
`310` has two source features and is unioned by postcode. A UUID shared by
codes `815` and `816` is preserved as a source anomaly and never used as the
published identity. Missing source/correction dates remain explicit in the
build receipt.

Source geometry is cleaned and checked with JSTS 2.7.1. Invalid surfaces use
deterministic zero-buffer repair; codes 611, 806 and 900 receive the documented
bounded epsilon/simplify edge-case transforms. All 62 repaired code surfaces
are `derived_geometry` at confidence `0.99999`; 112 unchanged surfaces remain
official/authoritative at confidence `1`. Maximum relative area change is
`0.000008030888399062609`. The complete 174-feature pack passes shared
topology with 261,851 positions and 252 closed rings.

Twelve source overlaps above 0.01 m² remain source-preserved
multiple-candidate evidence. No clipping or administrative/AGID replacement is
performed. No point, route, PO box, organisation, address, building, customer,
recipient or land-right object is expanded into an area.

## Real application path

The pinned descriptor loads 175 nodes, 174 assertions and 174 real postcode
areas. Searching country `IS` and `1 02` normalizes to `102`; the real HTTP API
returns the Byggðastofnun MultiPolygon. The application converts it to its map
feature collection, computes fit bounds and installs a translucent fill at
opacity `0.22` plus an outline at opacity `0.95` and width `3`. The UI payload
contains selected normalized postcode, geometry type, official/derived
provenance, source, basis date and confidence.

No-result (`999`), invalid postcode (`10A`), repaired code (`101`), invalid
geometry, clear and re-search paths are tested. Loading, API failure and
multiple-candidate handling use the shared fail-closed state model; the source
overlap audit supplies the Iceland-specific multiple-candidate evidence.
Browser E2E was not run; the deterministic real HTTP route plus application
GeoJSON/map-layer harness is the equivalent rendering verification.

## Validation

- Iceland country/API/app suite: 150 passed, 0 failed.
- Shared Postal Context runtime suite: 162 passed, 0 failed.
- Repository `tsc --noEmit`: passed.
- Second build from the pinned raw bytes: graph, geometry and descriptor SHA
  values all byte-identical.
- Artifact commit: [`2c0f6937a0b0fb0b790097d6f3a4a49fad12918a`](https://github.com/veygrit-sys/Address-Grid-ID/commit/2c0f6937a0b0fb0b790097d6f3a4a49fad12918a).

The raw WFS response and official-page captures remain outside Git. See
`reports/postal-context-m2/is-source-review-2026-08-30.json`,
`reports/postal-context-m2/is-checks-2026-08-30.json`, the build report and
`data/postal_country_packs/is/postal-context/M2-SOURCE-NOTICE.md`.
