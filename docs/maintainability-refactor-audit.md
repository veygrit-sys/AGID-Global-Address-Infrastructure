# AGID Maintainability and Refactor Audit

Date: 2026-06-06

This note reviews file naming, spaghetti-code risk, and maintainability principles for the AGID codebase. It is based on the current repository shape and source-size scan, not on a full behavioral rewrite.

## Summary

The main problem is not that the project has too many features. The sharper issue is that several files now contain multiple domains whose names no longer tell future maintainers what will change when the file changes.

The safest refactor strategy is:

1. Split large files by domain responsibility.
2. Keep the old public file names as compatibility barrels during migration.
3. Move external I/O to typed service boundaries.
4. Move generated or catalog-like data out of hand-written logic.
5. Only rename a file when the current name is misleading.

Do not do a large rename-first refactor. Renaming before splitting would create churn without reducing complexity.

## Executed Scan Addendum

Scan date: 2026-06-06

Commands run:

- `npm run lint`
- Source-size scan over `src`, `scripts`, and root server entrypoints.
- Concentration scan for `any`, `console.*`, `localStorage`, `fetch`, route declarations, imports, and generic file names.

Result:

- `npm run lint` passed with `tsc --noEmit`.
- The current risk is not a compile-break risk. It is a responsibility-boundary and change-locality risk.
- The repository already has many good pure modules and tests. The issue is that the largest files still act as orchestration hubs.

### Current Quantitative Signals

| File | Lines | Route declarations | Function signals | `any` count | Interpretation |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/App.tsx` | 4,472 | 0 | 446 | 71 | Main UI shell still owns too many controllers, side effects, map updates, storage reads, and API calls. |
| `server.ts` | 2,360 | 67 | 129 | 61 | Server bootstrap still owns many route handlers and provider proxy behaviors. |
| `src/services/GeocodingService.ts` | 1,490 | 0 | 50 | 67 | Provider orchestration, ranking, parsing, region fallbacks, and enrichment are mixed. |
| `src/components/AddressRegistration.tsx` | 1,647 | 0 | 93 | 13 | Form UI, dynamic country fields, validation, and registration actions are mixed. |
| `src/components/SettingsPanel.tsx` | 1,411 | 0 | 105 | 18 | Settings navigation, persistence actions, and display sections are mixed. |
| `src/lib/addressVerificationEngine.ts` | 1,063 | 0 | 42 | 1 | Strong typing is good, but policy data, scoring, evidence matching, and final decision logic should be separated when it grows further. |
| `src/lib/agid.ts` | 913 | 0 | 54 | 19 | Good public name, broad internal responsibility. Keep as barrel and split internals. |
| `src/server/routes/coreRoutes.ts` | 1,006 | 29 | 45 | 23 | Route split has started, but "core" now hides MCP, ZK, AMN, Polkadot, postal, trust registry, and translation routes. |

### Top Large Files

| File | Lines | Recommended treatment |
| --- | ---: | --- |
| `src/App.tsx` | 4,472 | Split into app controllers and map/panel components. |
| `src/constants/translations.ts` | 4,418 | Split into locale or namespace catalogs; consider generated output. |
| `src/lib/openApiSpec.ts` | 2,195 | Move to `src/server/openapi/` or generate from route/spec fragments. |
| `src/data/europeOpenGeoSources.ts` | 2,116 | Treat as data catalog, not logic; move under `src/data/open-geo/europe.ts` or generated data. |
| `src/data/asiaOpenGeoSources.ts` | 1,818 | Same as above. |
| `src/components/AddressRegistration.tsx` | 1,647 | Split form controller, country/language fields, quality panel, and submit actions. |
| `src/services/GeocodingService.ts` | 1,490 | Split provider clients, reverse geocoder, ranker, regional context aggregator. |
| `scripts/generate-agid-sdks.ts` | 1,487 | Split language backends and shared templates. |
| `src/components/SettingsPanel.tsx` | 1,411 | Split by settings section and persistence controller. |
| `src/lib/addressEnglish.ts` | 1,259 | Split normalization tables, formatters, and country aliases. |

### Flat `src/lib` Growth

`src/lib` currently contains 261 TypeScript files. Prefix grouping shows:

| Prefix group | Count | Risk |
| --- | ---: | --- |
| `other` | 112 | Too many domain files are no longer discoverable by prefix alone. |
| `address*` | 58 | Address parsing, rendering, verification, quality, credentials, and morphism should move into subfolders. |
| `agid*` | 13 | Good candidate for `src/lib/agid/`. |
| `grid*` | 13 | Good candidate for `src/lib/grid/`. |
| `open*` | 12 | Split into `open-data`, `openapi`, and `open-source-translation` domains. |
| `zk*` plus proof files | 6 direct `zk*`, more proof files under other names | Good candidate for `src/lib/zk/` grouped by proof purpose. |

This is the clearest structural smell: `src/lib` is becoming a catch-all package. The fix is not to rename every file immediately, but to introduce domain folders and move related files in small batches.

### Generic Or Misleading Names Found

| Current name | Problem | Preferred direction |
| --- | --- | --- |
| `src/lib/utils.ts` | Generic catch-all name. | Keep only tiny generic helpers; move domain helpers out. |
| `src/lib/addressUtils.ts` | Too broad; currently includes language, formatting, normalization, and regional logic. | Split into `address/normalization.ts`, `address/formatting.ts`, `address/language.ts`. |
| `src/lib/addressIntelligence.ts` | "Intelligence" over-promises and hides parsing/canonicalization. | `src/lib/address/parsing.ts` or `src/lib/address/canonicalization.ts`. |
| `src/lib/addressIdentity.ts` | Ambiguous with user identity/DID. | `src/lib/identity/agidAoidIdentityPolicy.ts`. |
| `src/lib/hybridArchitecture.ts` | Architectural concept, but implementation appears to be runtime placement policy. | `src/lib/runtime/placementPolicy.ts`. |
| `src/lib/openApiSpec.ts` | API spec belongs near API layer or generated output. | `src/server/openapi/spec.ts` or `src/generated/openapi/spec.ts`. |
| `src/server/routes/coreRoutes.ts` | "core" now hides many unrelated route families. | Split to `mcpRoutes.ts`, `zkRoutes.ts`, `amnRoutes.ts`, `polkadotRoutes.ts`, `addressVerificationRoutes.ts`, `translationRoutes.ts`, `postalRoutes.ts`. |
| `src/constants/translations.ts` | One giant catalog. | `src/constants/translations/{ja,en,...}.ts` or `src/data/i18n/*.json`. |
| `src/lib/agid.ts` | Name is correct as public API, but too broad internally. | Keep as compatibility barrel; split internals to `src/lib/agid/`. |
| `src/lib/aoid.ts` | Name is correct as public API if small; group if ownership/governance expands. | Keep as barrel; move policies to `src/lib/aoid/`. |

### Direct Side-Effect Concentration

The strongest spaghetti signal is direct side effects inside `src/App.tsx`:

- `localStorage`: 87 matches in `src/App.tsx`.
- `console.*`: 39 matches in `src/App.tsx`.
- `fetch(`: 7 direct matches in `src/App.tsx`.
- `any`: 71 matches in `src/App.tsx`.

This should be reduced by extracting:

1. `useAppSettingsPersistence`
2. `useSearchHistory`
3. `useQrController`
4. `useRoutePlanning`
5. `useMapDataLayers`
6. `useGeologicalLayers`
7. `useLocationPermission`

After those extractions, `App.tsx` should mostly compose hooks and render panels.

### Server Route Split Status

The route split is partially done:

- `src/server/routes/coreRoutes.ts` exists and has 29 route declarations.
- `src/server/routes/externalProxyRoutes.ts` exists.
- `server.ts` still has 67 route declarations.

This means the architecture has started moving in the right direction, but the migration boundary is incomplete. The next server refactor should move route families out of `server.ts`, not add more route handlers to it.

Recommended route family files:

| New file | Move from |
| --- | --- |
| `src/server/routes/elevationRoutes.ts` | `/api/elevation`, terrain/elevation helpers. |
| `src/server/routes/overpassRoutes.ts` | `/api/overpass`, OSM fallback behavior. |
| `src/server/routes/europeAddressRoutes.ts` | FR/NL/DK/NO/FI/DE/BE/CH/AT/SE/EE/LV/LT/IS/IT/ES/PT/GR/MT/CY routes. |
| `src/server/routes/asiaAddressRoutes.ts` | JP/CN/TW/HK/KR/Asia-Oceania related routes. |
| `src/server/routes/americasAddressRoutes.ts` | CA/MX/BR/US routes. |
| `src/server/routes/naturalFeatureRoutes.ts` | mountain, marine, geological, water-risk, country-boundary/cities/stat routes. |
| `src/server/routes/mapTileRoutes.ts` | terrain, labels, map tile proxy behavior. |

`server.ts` should eventually only create the app, install middleware, register route modules, and start the listener.

### Refactor Guards To Add

Add lightweight maintainability guards so the project does not drift back:

| Guard | Suggested threshold |
| --- | --- |
| Max non-generated TS/TSX file length | warn above 800 lines, fail above 1,500 except generated/catalog files. |
| Direct `localStorage` in UI components | allow only in approved persistence hooks. |
| Direct `fetch` in React components | disallow except intentionally local files; use service/client wrappers. |
| New `any` in core AGID/AOID/ZK/PID modules | fail unless explicitly whitelisted. |
| Route declarations in `server.ts` | fail when increasing; target zero after route migration. |
| Flat `src/lib` growth | new domain with 3+ files must use a folder. |

These checks can be implemented as a small `scripts/verify-maintainability.ts` later.

### Updated First Refactor Batch

The first batch should be small and reversible:

1. Extract `src/hooks/useAppSettingsPersistence.ts` from the many `localStorage` reads/writes in `App.tsx`.
2. Extract `src/hooks/useSearchHistory.ts` from `App.tsx` and `SettingsPanel.tsx` so both use one storage key and one migration path.
3. Move route families from `server.ts` into route files without changing handler behavior.
4. Move ZK proof files into `src/lib/zk/` with compatibility exports.
5. Split `src/lib/agid.ts` into internal modules while keeping `src/lib/agid.ts` as a barrel.

This order lowers coupling before doing visible renames.

## Current Hotspots

| File | Signal | Main risk |
| --- | ---: | --- |
| `src/App.tsx` | 4,472 lines, many hooks and side effects | UI shell, map orchestration, search, QR, route planning, storage, and service calls are mixed. |
| `src/constants/translations.ts` | 4,418 lines | Locale data is too large for one hand-edited file. |
| `server.ts` | 2,360 lines | Bootstrap, middleware, cache, provider logic, quality sweep, and route behavior are mixed. |
| `src/lib/openApiSpec.ts` | 2,195 lines | API schema is large enough to become generated or modular. |
| `src/services/GeocodingService.ts` | 1,490 lines | Provider clients, ranking, reverse geocoding, natural features, and fallback logic are mixed. |
| `src/components/AddressRegistration.tsx` | 1,647 lines | Form state, country/language policy, validation, rendering, and actions are mixed. |
| `src/components/SettingsPanel.tsx` | 1,411 lines | Settings sections and policy controls are difficult to change independently. |
| `src/lib/addressEnglish.ts` | 1,259 lines | Formatting, parsing, country rules, and examples should be modular. |
| `src/lib/addressVerificationEngine.ts` | 1,063 lines | Engine, policy, evidence scoring, and country capability rules are drifting together. |
| `src/lib/agid.ts` | 913 lines | Encoding, registry, terrain/sea/mountain concepts, and grid behavior are too broad for one file. |

## Rename Candidates

These names should be changed only after splitting or by leaving compatibility exports.

| Current file | Better direction | Reason |
| --- | --- | --- |
| `src/lib/addressIntelligence.ts` | `src/lib/addressParsing.ts` or `src/lib/addressCanonicalization.ts` | The file mainly parses and normalizes address text. "Intelligence" is vague and over-promises. |
| `src/lib/addressIdentity.ts` | `src/lib/agidAoidIdentityPolicy.ts` | The file is about AGID/AOID identity rules, not identity in general. |
| `src/lib/addressMorphismNetwork.ts` | `src/lib/amn/resolutionEnvelope.ts` or `src/lib/amnRegistry.ts` | The file implements AMN-style envelopes and registry behavior, not the whole network. |
| `src/lib/hybridArchitecture.ts` | `src/lib/runtimePlacementPolicy.ts` or `src/lib/hybridRuntimePolicy.ts` | The file describes placement decisions between device, central service, SDK, and open data. |
| `src/lib/agid.ts` | Keep as barrel, split into `src/lib/agid/encoding.ts`, `registry.ts`, `grid.ts`, `terrain.ts` | The name is fine as a public entrypoint, but the file is too broad. |
| `src/lib/openApiSpec.ts` | `src/server/openapi/spec.ts` or generated `src/generated/openApiSpec.ts` | OpenAPI belongs near API/server code or generated artifacts. |
| `src/constants/translations.ts` | `src/constants/translations/index.ts` plus locale files | One locale catalog file is now too large. |
| `src/data/*OpenGeoSources.ts` | `src/data/open-geo/{continent}.ts` or generated data files | The continent catalogs are data, not application logic. |
| `src/server/routes/coreRoutes.ts` | Split into route modules | "core" hides ZK, address verification, postal, API metadata, and registry concerns. |

## Files To Avoid Renaming For Now

| File group | Why |
| --- | --- |
| `*.test.ts` paired with current module names | Rename after module moves, otherwise tests become noisy. |
| `sdk/*` | SDK naming stability matters to downstream consumers. |
| `src/lib/*Proof.ts` files | The proof names are explicit and useful. Group them into a folder first instead of renaming each file. |
| Generated or catalog-like source files | Prefer moving them under `data` or `generated`, not inventing clever names. |

## Spaghetti-Code Risks

### `src/App.tsx`

`App.tsx` has become the coordination center for map state, location permission, QR reading, route planning, address quality, saved locations, overlays, and search. This makes new features expensive because every feature must understand too much app-level state.

Recommended split:

| New unit | Responsibility |
| --- | --- |
| `src/hooks/useLocationPermission.ts` | Browser/device location permission and current location state. |
| `src/hooks/useSearchController.ts` | Query state, search execution, candidate selection, and errors. |
| `src/hooks/useRoutePlanning.ts` | Navigation target, route search, routing profile, and route errors. |
| `src/hooks/useQrController.ts` | QR reader lifecycle and QR actions. |
| `src/hooks/useSavedAgids.ts` | Saved AGID/AOID state and local persistence. |
| `src/components/AppMapScene.tsx` | Map rendering, overlays, and map event wiring. |
| `src/components/AppPanels.tsx` | Sidebar/panels layout and panel selection. |
| `src/components/AppTopBar.tsx` | Compact top controls and global actions. |

### `server.ts`

`server.ts` should become a thin bootstrap file. The current file still mixes middleware setup, quality sweeps, API cache, provider calls, postal database initialization, and route logic.

Recommended split:

| New unit | Responsibility |
| --- | --- |
| `src/server/app.ts` | Express app creation and middleware wiring. |
| `src/server/bootstrap.ts` | Dev/prod startup and Vite integration. |
| `src/server/cache/apiCache.ts` | API cache type and helpers. |
| `src/server/quality/globalQualitySweep.ts` | Address-quality sweep logic. |
| `src/server/routes/*.ts` | Route modules by API domain. |
| `src/server/providers/*.ts` | External provider calls and typed result handling. |

### `src/services/GeocodingService.ts`

This service is doing too much. It should become an orchestration layer over smaller provider and ranking modules.

Recommended split:

| New unit | Responsibility |
| --- | --- |
| `src/services/geocoding/OsmPlaceClient.ts` | OSM place search. |
| `src/services/geocoding/OsmReverseClient.ts` | OSM reverse geocoding. |
| `src/services/geocoding/NaturalFeatureClient.ts` | Rivers, lakes, mountains, islands, deserts, caves, and similar features. |
| `src/services/geocoding/GeocodingRanker.ts` | Candidate scoring and tie-breaking. |
| `src/services/geocoding/RegionalContextRegistry.ts` | Country/region-specific fallback context. |
| `src/services/geocoding/GeocodingService.ts` | Thin facade preserving old imports. |

### `src/lib/agid.ts`

`agid.ts` should stay as a public import point, but internally it should be split.

Recommended split:

| New unit | Responsibility |
| --- | --- |
| `src/lib/agid/encoding.ts` | Deterministic AGID encode/decode and validation. |
| `src/lib/agid/grid.ts` | Grid geometry and viewport behavior. |
| `src/lib/agid/registry.ts` | Registry metadata and lookup rules. |
| `src/lib/agid/naturalFeatures.ts` | Sea, mountain, island, desert, lake, river, and terrain naming. |
| `src/lib/agid/consensus.ts` | Consensus and confidence metrics. |
| `src/lib/agid/index.ts` | Compatibility exports. |

## ZK Proof Organization

The ZK proof files are named clearly, but they are too spread out in `src/lib`. Move them into `src/lib/zk/` while preserving compatibility exports.

Suggested folders:

| Folder | Files |
| --- | --- |
| `src/lib/zk/ownership/` | `aoidOwnershipProof.ts`, ownership-related credential proofs. |
| `src/lib/zk/address/` | `privateAddressPredicateProof.ts`, `agidZkAddressProofs.ts`, `regionMembershipProof.ts`. |
| `src/lib/zk/lifecycle/` | `pidLifecycleProof.ts`, `pidIssuanceAudit.ts`, merge/split and lineage proofs. |
| `src/lib/zk/policy/` | `qualityThresholdProof.ts`, `consentPurposeScopeProof.ts`, `anonymousRateLimitProof.ts`. |
| `src/lib/zk/registry/` | `zkProofBundleRegistry.ts`, `zkProofCompatibility.ts`, `zkProofRuntime.ts`, revocation/freshness anchoring. |

This reduces cognitive load without changing proof names.

## Coding Principles To Adopt

1. One file should have one reason to change.
2. UI components should not call `fetch`, `localStorage`, or `console` directly except through small adapters.
3. External provider results should return typed `ProviderResult<T>` or `Result<T, ErrorCode>`, not `any` or silent `null`.
4. Generated specs and catalog data should live under `src/generated` or `src/data`, not inside hand-written service logic.
5. Public compatibility barrels are acceptable during refactor. They are better than breaking many imports at once.
6. Prefer domain folders over flat `src/lib` growth once a domain has more than 3 files.
7. Keep deterministic AGID/AOID/PID algorithms pure and side-effect-free.
8. Keep privacy, ZK proof, and audit code isolated from UI and provider clients.
9. Make country/region policy data declarative. Avoid long procedural switch statements.
10. Add characterization tests before splitting large files.

## TypeScript, Rust, And C++

Do not rewrite the whole app away from TypeScript for maintainability alone. TypeScript is still appropriate for UI, API routes, SDK surfaces, and policy orchestration.

Rust or C++ may be useful only for stable computational kernels:

| Candidate | Why |
| --- | --- |
| AGID grid encoding/decoding | Deterministic, performance-sensitive, easy to test with fixed vectors. |
| Geometry and point-in-region checks | Can benefit from compiled kernels if large datasets are used. |
| ZK witness generation helpers | Rust often has stronger cryptographic ecosystem support. |
| High-volume candidate clustering | Could be moved later if profiling proves it is a bottleneck. |

Keep the first refactor in TypeScript. Move to Rust only after interfaces are stable.

## Suggested Refactor Order

1. Create typed provider result and logger adapters.
2. Extract `App.tsx` hooks without changing visual behavior.
3. Split `server.ts` into bootstrap, app creation, route modules, cache, and quality sweep.
4. Split `GeocodingService.ts` into provider clients, ranker, and facade.
5. Split `AddressRegistration.tsx` into form sections and a controller hook.
6. Move ZK proof modules under `src/lib/zk/` with compatibility exports.
7. Split `agid.ts` into an `agid/` folder with a compatibility barrel.
8. Split translations and continent source catalogs into data folders.
9. Move OpenAPI spec to server/openapi or generated output.
10. Only then apply final renames to files whose old names are misleading.

## First Concrete Change To Make

Start with `App.tsx`, because it has the highest coupling and the most user-facing blast radius. The first safe extraction is `useLocationPermission`, because it can be tested and reviewed independently without touching address algorithms.

Then extract `useSearchController` and `useRoutePlanning`. Those two hooks will make later AGID/AOID, AMT, ZK, and address-verification changes much easier to reason about.

## Success Criteria

The refactor is working if:

1. `src/App.tsx` falls below 1,200 lines.
2. `server.ts` falls below 200 lines.
3. `src/services/GeocodingService.ts` becomes a facade below 250 lines.
4. No UI component directly calls external provider APIs.
5. No new `any` is introduced in core AGID/AOID/ZK/address-verification files.
6. Public import paths continue to work through compatibility barrels during migration.
7. Existing tests pass after each small extraction.
