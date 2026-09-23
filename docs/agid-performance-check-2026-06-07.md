# AGID Performance Check

Date: 2026-06-07 JST

## Summary

AGID core encoding/decoding is already fast enough for interactive use. In this local Node.js benchmark, full AGID encoding averaged about 6.0 us in warm repeated cases and about 8.7 us across diverse global cells. Decoding averaged about 3.4 us. The main performance risk is not the AGID identifier math itself, but wide grid rendering and the app bundle size caused by large geocoding/address modules.

## Verified Results

Environment:

- Node.js: v24.14.0
- Core implementation: `src/lib/agid.ts`
- Lightweight embed implementation: `src/embed/agidLight.ts`
- Native/WASM source: `native/agid-core/src/lib.rs`

Correctness and build checks:

| Check | Result |
|---|---:|
| AGID-focused Node tests | 30 passed, 0 failed |
| PID collision budget | pass |
| GIS warning budget | pass |
| Postal source static health | pass |
| TypeScript type check | pass |
| Production build | pass, with chunk-size warnings |
| Rust `cargo test` | not run; `cargo` is not installed in this environment |

Microbenchmark results:

| Operation | Scenario | Mean |
|---|---|---:|
| `encodeAGID` | warm repeated points | 6.046 us |
| `decodeAGID` | warm repeated ids | 3.395 us |
| `getRegionInfo` | warm repeated points | 1.658 us |
| `encodeAgidLight` | embed encoder | 3.683 us |
| `decodeAgidLight` | embed decoder | 3.211 us |
| `getRegionInfo` | diverse global cells | 6.689 us |
| `encodeAGID` | diverse global cells | 8.693 us |
| `getGridFeatures(range=1)` | diverse cells | 22.533 us |
| `getGridFeatures(range=5)` | diverse cells | 249.066 us |

Registry generation:

| Registry | Count | Time |
|---|---:|---:|
| Country registry | 240 | 9.191 ms |
| Sea registry | 749 | 13.412 ms |

Production bundle observations:

| Asset | Size |
|---|---:|
| `main-Dz-P1C4P.js` | 4,549,126 bytes |
| `main-Dz-P1C4P.js` gzip | 1,534.71 kB |
| `AddressRegistration-onCyz0kw.js` | 169,303 bytes |
| `main-DfSNBZpL.css` | 153,579 bytes |
| PWA precache | 302 entries, 5,525.06 KiB |

Vite reported that `AsiaOceaniaService.ts` and `EastAsiaService.ts` are both statically and dynamically imported from `GeocodingService.ts`, so the dynamic imports cannot split those modules into separate chunks.

## Complexity Assessment

`encodeAGID` in `src/lib/agid.ts` is effectively constant time for the identifier math: cubed-sphere quantization, 21-step Hilbert encoding, and fixed-length base32 packing. `decodeAGID` is also fixed-cost: validation, base32 decoding, Hilbert decoding, and inverse projection.

The variable-cost parts are:

- `getRegionInfo`: depends on the number of candidate country/sea regions in the 2-degree spatial cell and polygon vertex count.
- `getGridFeatures`: depends on `(2 * range + 1)^2` cells and calls cell polygon generation repeatedly.
- App startup: affected by large statically imported geocoding/address modules rather than AGID math.

## Bottlenecks

1. Grid rendering grows quadratically with range.
   `getGridFeatures(range=5)` is about 11x heavier than `range=1` in the diverse-cell benchmark. This is expected because it emits many more cell polygons.

2. The main application chunk is too large.
   The AGID core is small, but geocoding/address services are pulled into the main chunk. This can slow first load, PWA precache, and browser parse time.

3. Region lookup is good but not fully indexed.
   The current 2-degree cache avoids scanning all regions every time, which is why it is already fast. It could still degrade if natural-feature polygons, islands, wetlands, rivers, and heritage features are added without a stronger spatial index.

4. Rust/WASM validation could not be run locally.
   The native core has useful exported functions for quantization, Hilbert, ZK predicates, and grid generation, but this environment lacks `cargo`, so native tests were not executed.

## Recommended Improvements

1. Add a permanent AGID benchmark script and CI budget.
   Suggested budgets: `encodeAGID` diverse-cell mean under 25 us, `decodeAGID` under 10 us, `getGridFeatures(range=5)` under 500 us on CI hardware.

2. Fix chunk splitting in `GeocodingService.ts`.
   Remove static imports for modules that are also dynamically imported, especially `AsiaOceaniaService.ts` and `EastAsiaService.ts`, or move shared types/functions into tiny type-only modules.

3. Keep AGID math in TypeScript for now, but use Rust/WASM for heavy grid batches.
   Single encode/decode is already fast enough in TypeScript. Rust/WASM matters more for batch grid rendering, proof predicates, and large map overlays.

4. Add a real spatial index before adding many more natural features.
   A bbox R-tree, geohash bucket index, or precomputed tile index should be introduced before loading global rivers, lakes, islands, caves, wetlands, deserts, and heritage polygons into runtime lookup.

5. Batch encode/decode API.
   For shopping agents, logistics, and map rendering, expose batch endpoints/functions to amortize region lookup, WASM boundary calls, and object allocation.

6. Separate public AGID core from full address intelligence.
   Keep `agidLight` and SDK parity as the low-latency public core, and load address verification, postal sources, and natural-feature enrichment only when needed.

## Judgment

AGID identifier generation is not the current performance problem. It is already fast enough for UI interaction, API use, and agent-side calls. The next performance work should target chunk splitting, grid rendering, and future-proof spatial indexing before larger global natural-feature datasets are added.
