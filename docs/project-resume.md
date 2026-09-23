# AGID Project Resume

Last updated: 2026-06-07

## Resume Map

This file is the main product and architecture resume. It should remain the
entry point for AGID as an application, standard, and integration surface. More
specialized resumes and papers should be treated as companion documents:

| Topic | Primary document | Role |
| --- | --- | --- |
| AGID project direction | `docs/project-resume.md` | Product, architecture, roadmap, and differentiation |
| AGID grid mathematics | `docs/agid-math-model-resume.md` | Coordinate-to-cell contract and SDK math |
| AGID/AOID privacy boundary | `docs/agid-aoid-design.md` | Public/private identity split and communication rules |
| AOID detailed theory | `docs/aoid-detailed-paper-ja.md` | Owner-managed private address identifier |
| Address Morphism Theory | `docs/address-morphism-theory-verified-resume.md` | Verified AMT claims and safe theorem wording |
| AMN protocol layer | `docs/address-morphism-network-resume.md` | Public audit envelope and registry direction |
| ZK address predicates | `docs/address-morphism-theory-ii-zero-knowledge-address-predicates.md` | Privacy-preserving address-derived predicates |
| Cleanup and material audit | `docs/unused-file-material-audit-2026-06-07.md` | Generated artifacts, archive candidates, and code review candidates |

Rule of use: keep this resume concise and operational. Put mathematical proofs,
ZK definitions, AOID ownership details, and AMT manuscript structure in their
own documents, then link back here.

## One-Line Summary

AGID is a deterministic global grid and address intelligence platform built as an overlay of a **virtual postal code** and a **virtual address** for displaying, validating, registering, sharing, and integrating locations across countries, territories, seas, natural features, disputed regions, and building-level places.

## Core Philosophy: Virtual Postal Code + Virtual Address

AGID's system philosophy is the superposition of two layers:

1. **Virtual Postal Code**: a globally consistent location identifier for countries and regions where postal codes do not exist, are too broad, are incomplete, or cannot keep pace with urbanization.
2. **Virtual Address**: a location reference that remains useful when conventional addresses change, disappear, or become socially unstable because of disasters, conflict, temporary housing, mobile homes, ships, redevelopment, or displaced communities.

AGID does not begin from the assumption that every person has a stable street address or that every country has a reliable postal system. It begins from the physical Earth. As long as a place can be located in geographic space, AGID can assign a deterministic grid identity and then layer postal, administrative, linguistic, and human-readable address evidence on top.

This means AGID is not trying to replace national postal systems. It is designed as a common reference layer that can coexist with them:

- Where postal systems are strong, AGID complements them with grid identity, QR registration, multilingual display, and evidence scoring.
- Where postal systems are weak or absent, AGID can function as a virtual postal code.
- Where homes, buildings, camps, routes, or administrative labels change, AGID can function as a virtual address anchored to location rather than to a fragile civic record.
- Where disaster, conflict, or informal settlement conditions break traditional addressing, AGID gives people and organizations a stable way to share, register, and recover a location reference.

The central design idea is:

```text
physical location
  -> deterministic AGID grid cell
  -> virtual postal code layer
  -> virtual address layer
  -> local-language and international-English rendering
  -> postal/geographic evidence and confidence
```

This layered model is what separates AGID from systems that only encode coordinates, only validate postal addresses, or only search map places.

## AGID/AOID Two-Layer Identity

AGID and AOID must stay separate:

- **AGID (Address Grid ID)** is the public location, address, building, and public map-feature layer. It identifies a place and can act as a virtual postal code or virtual address anchor. It can include public building names, landmarks, natural-feature and heritage labels, public address labels, postal/admin labels, and open-source geographic evidence. It must not include recipient names, phone numbers, room numbers, private access instructions, or private ownership records.
- **AOID (Address Owner ID)** is the private address layer. It identifies the owner-controlled delivery destination on top of an AGID. It can include room, recipient, phone, delivery instructions, private access notes, and owner-managed delivery details, but only the owner can update or regenerate its QR payload.

The short rule is:

```text
AGID = where and public address/building/map feature
AOID = who receives and how delivery reaches them
```

This distinction is also the privacy boundary. AGID can be generated and shared by SDKs and devices without central approval, and it may be enriched with public address/building/map-feature evidence. AOID is local-first and can sync only through explicit private sync paths. Central services may improve quality, confidence, postal lookup, building evidence, map-feature evidence, and geographic evidence, but they must not publish AOID contents into the public AGID layer.

Current AOID identifier rule:

- AOID IDs are normalized as 9- to 16-character unambiguous Base32 strings.
- When linked to an AGID, the AOID must contain the AGID hash anchor, not the
  two-character AGID prefix.
- Sixteen identical repeated characters are rejected.
- Any four-character consecutive run in the Base32 alphabet is rejected.
- The AOID public handle is not ownership proof and must not expose recipient,
  phone, room, delivery instruction, or exact private coordinate fields.

Detailed identity rules are kept in [AGID and AOID Design Principles](./agid-aoid-design.md).

## Independent Standard Surface

AGID should be presented as a standard first and an application second. The app is the reference implementation, but integrations should be able to depend on explicit standard artifacts:

- `sdk/agid-spec/agid-spec.json` defines the language-neutral AGID core.
- `sdk/agid-spec/test-vectors.json` defines SDK parity expectations for `encode`, `decode`, and `cellBounds`.
- `/api/v1/openapi.json` defines the versioned API contract for hosted AGID services.
- `docs/data-licenses.md` defines how open-source, government, postal, map, and geographic evidence sources keep their own license boundaries.

This matters because AGID is intended to be used by SDKs, logistics tools, embedded devices, offline workflows, GIS validation paths, QR readers, address registration systems, and humanitarian mapping tools. Those users need a stable standard surface instead of a dependency on one React UI or one server implementation.

Detailed conformance rules are kept in [AGID Standard and Conformance](./agid-standard.md).

## Problem

Addresses are not globally uniform. Some countries have reliable postal APIs, some have weak or partial postal datasets, some do not use postal codes at all, and many areas need coordinates, administrative hierarchy, local scripts, romanization, or geographic feature names to be understandable.

The address gap is not only technical. It is also social and humanitarian:

- some countries and territories have no practical postal code for many residents,
- some postal codes cover areas that are too large for delivery or emergency response,
- informal settlements and fast-growing suburbs may exist before official address records catch up,
- displaced people may lose a civic address while still needing to receive aid, medicine, payments, or identity-linked services,
- natural disasters can erase buildings and street signs while the location still matters,
- ships, mobile bases, field camps, temporary clinics, and remote work sites may need address-like identifiers without being conventional addresses.

AGID treats an address as a layered evidence object:

- coordinate and grid identity,
- administrative and postal metadata,
- local-language display,
- international-English display,
- source quality,
- confidence,
- manual confirmation when data is weak.

## Product Direction

The product should work as a practical location layer between maps, addresses, QR codes, logistics, drones, emergency response, and SDK users.

The current direction is:

1. **Stable grid first**: black grid lines and selected red cells must align exactly and remain deterministic across viewport changes.
2. **Address quality second**: address display must show what is verified, what is partial, and which source supports it.
3. **Language correctness third**: address-language tabs are not app-language settings; they are the languages actually used for addresses in the selected country or region.
4. **Open-source evidence fourth**: use official or open-source postal/geographic data where available; fall back gracefully where not.
5. **Integration fifth**: make the AGID core portable through generated SDKs and typed service boundaries.

Detailed grid and encoding math is kept in a separate resume: [AGID Mathematical Model Resume](./agid-math-model-resume.md).

## Competitive Landscape and Differentiation

AGID is closest to a mix of coordinate-code systems, postal validation tools, open geocoders, and GIS infrastructure. The important distinction is that AGID is not only a code for a point. It is a deterministic grid ID plus address evidence, multilingual rendering, private registration, QR sharing, and SDK portability.

### Short Positioning

AGID should be positioned as:

- a deterministic location ID that works without central approval,
- a virtual postal-code layer for regions with missing, weak, broad, or incomplete postal-code systems,
- a virtual-address layer for people, organizations, assets, and locations whose conventional address is absent, temporary, lost, or changing,
- an address-quality layer that improves results with postal and open-source evidence,
- a multilingual international-shipping address renderer,
- a private address registration and QR layer,
- a portable SDK/spec for apps, terminals, logistics, drones, and offline tools.

AGID should not be positioned as a replacement for every GIS index, every postal API, or every map search provider. It should consume those tools as evidence and provide a stable user-facing location and address layer above them.

### Comparison Matrix

| Service / category | Primary job | Strength | Limitation AGID targets | AGID difference |
| --- | --- | --- | --- | --- |
| what3words | Human-friendly location words | Easy to say and remember | Closed word system, not an address-quality or postal-evidence platform | AGID is deterministic, SDK-oriented, evidence-aware, QR/address-registration friendly, and designed around virtual postal code + virtual address layers |
| Google Plus Codes / Open Location Code | Open coordinate code | Mature open coordinate reference | Does not by itself solve postal quality, local-language address order, building evidence, or humanitarian virtual-address workflows | AGID can interoperate with Plus Codes but adds address rendering, confidence, country policy, QR registration, and no-postal-code behavior |
| Geohash | Spatial indexing | Simple database/search prefix behavior | Cell shape and user-facing address semantics are not enough for global address UX | AGID focuses on address identity, selected-cell UX, country/sea/territory meaning, and source-aware address display |
| H3 / S2 | Spatial analytics and geofencing | Excellent backend grid libraries | Not designed as a public address or postal substitute | AGID can bridge to H3/S2 for analytics while remaining the user-facing address ID |
| National postal APIs | Official postal validation | Strong in mature postal countries | Weak or absent in many regions; cannot handle places without postal systems | AGID classifies postal strength and can still provide AGID/coordinate/geo evidence when postal data is missing |
| Commercial address validation | Deliverability checks | Carrier and ecommerce workflows | Often country-limited, proprietary, and address-first rather than location-first | AGID is location-first and can supply virtual postal/address identity before carrier-specific validation |
| Nominatim / Pelias / map geocoders | Search and reverse geocode | Large place databases and fuzzy search | Search result is not automatically a verified postal address | AGID treats geocoder output as evidence, then merges postal rules, local language, international English, and manual confidence |
| Google Maps / Apple Maps | Consumer map UX | Huge POI/search ecosystems | Provider-dependent and not a portable open ID/spec | AGID can sit above maps as a portable ID, QR, SDK, and address-quality layer |
| Logistics platforms | Operational delivery | Carrier networks, routes, SLAs | Carrier-specific and often assumes a deliverable address exists | AGID gives a neutral pre-carrier location/address identity, useful where addresses are weak |
| GIS platforms | Spatial storage, rendering, analysis | Mature standards and tooling | Too infrastructure-oriented for everyday address registration | AGID uses GIS as validation/rendering infrastructure and adds user-facing address intelligence |
| Emergency/humanitarian mapping | Crisis mapping and field coordination | Strong for disaster response and OSM/HOT workflows | Temporary records can be hard to carry into daily delivery and SDK workflows | AGID can encode disaster/temporary locations as virtual addresses while preserving open evidence and QR sharing |

### what3words

what3words is the easiest comparison because it provides a human-facing small-area grid. The difference is product philosophy and extensibility.

AGID advantages:

- Deterministic numeric/alpha grid ID instead of a closed word list.
- SDK-oriented core that can run on-device and offline.
- Visible map grid with selected-cell geometry that can be tested against the same cell polygon.
- Address intelligence: postal codes, local language, international English, building names, confidence, and source labels.
- Better fit for QR, logistics, drones, and developer workflows where machine-readable stability matters more than memorability.
- Virtual postal-code behavior for regions where a word address is not enough to express postal evidence, administrative context, and confidence.
- Virtual-address behavior for unstable, temporary, disaster-affected, or humanitarian locations where a conventional address may not exist.

what3words advantages AGID should respect:

- Extremely memorable spoken form.
- Strong consumer UX for simple location sharing.
- Simple mental model for non-technical users.

AGID should not try to copy the word-address model. AGID's wedge is verifiable, open, SDK-friendly, and address-aware.

### Google Plus Codes / Open Location Code

Plus Codes are the strongest open coordinate-code comparison. They are good for compact coordinate references and can work without street addresses.

AGID advantages:

- Adds a region-aware prefix and source-aware address layer instead of only encoding coordinates.
- Separates domestic address language, international-shipping English, and app UI language.
- Handles postal-code strength classes, no-postal-code areas, seas, mountains, natural features, overseas territories, autonomous regions, and disputed areas.
- Provides private registered-address and AOID workflows, not just a public coordinate code.
- Uses a hybrid model: SDK/device for core ID, central services for quality upgrades.
- Frames the location code as part of an address stack, not only as an encoded coordinate.
- Can represent no-postal-code places as a virtual postal-code layer and temporary/disaster locations as a virtual-address layer.

Plus Code advantages AGID should respect:

- Mature open specification.
- Very broad ecosystem recognition.
- Simpler global coordinate-code story.

AGID should interoperate with Plus Codes where useful, but AGID's product value is the evidence and address rendering layer around the grid.

### Geohash

Geohash is simple, compact, and widely understood in software systems. It is useful for indexing and approximate spatial search.

AGID advantages:

- Uses a cubed-sphere style quantization instead of rectangular latitude/longitude bisection.
- Targets more stable global cell size and shape behavior.
- Uses Hilbert ordering per face for locality.
- Includes region, sea, territory, and address-quality semantics outside the raw coordinate hash.
- Provides user-facing grid display rules and selected-cell alignment requirements.

Geohash advantages AGID should respect:

- Very simple implementation.
- Existing database/search ecosystem support.
- Easy prefix matching.

AGID should not replace geohash inside every database query. It can export or bridge to geohash for infrastructure while keeping AGID as the user-facing ID.

### H3 and S2

H3 and S2 are excellent global spatial indexing systems. They are strong for analytics, geofencing, aggregation, and backend spatial operations.

AGID advantages:

- Designed as an address and delivery-facing ID, not only an analytics index.
- Carries address-display policy, language tabs, postal quality, open-source evidence, and QR/private registration workflows.
- Has a human-visible grid and selected-cell UX requirement.
- Can be implemented as SDK packages across many general-purpose languages.

H3/S2 advantages AGID should respect:

- Mature spatial libraries.
- Strong hierarchical indexing and neighbor operations.
- Large production usage in backend GIS and analytics.

AGID should not introduce H3/S2 unless integration requires it. The best strategy is optional interoperability: store AGID as the public/address ID, compute H3/S2 cells for backend analytics when needed.

### Mapcodes and Similar Short Codes

Mapcodes and other short location-code systems aim to make coordinates shorter and easier to communicate.

AGID advantages:

- Richer address and source-confidence model.
- Explicit open-source postal/geographic evidence strategy.
- Multilingual and international-shipping rendering.
- Private registered addresses and QR payloads.
- SDK and data-pack direction.

Their advantage:

- Shorter or more communication-friendly codes in some contexts.

AGID should compete on correctness, evidence, and integration rather than shortest possible string length.

### Postal Address APIs

Examples include national postal APIs, commercial address validation services, and country-specific datasets.

AGID advantages:

- Does not assume every country has reliable postal data.
- Classifies countries and regions into reliable postal API, weak postal API, strong geo OSS without postal code, and weak geo OSS/manual-required.
- Can still produce a useful AGID/coordinate/administrative/natural-feature record when postal code data is missing.
- Shows source, confidence, verified/partial/manual state instead of hiding uncertainty.
- Supports local-language and international-English order conversion.
- Provides an address fallback even when postal data is unavailable by using AGID, coordinates, administrative hierarchy, natural features, and manual confirmation.
- Explicitly treats missing postal systems as a product case, not as an error.

Postal API advantages AGID should respect:

- Strong authority for countries with official complete postal data.
- Better final-mile validation where the postal system is mature.

AGID should use postal APIs as evidence, not as the only truth source.

### Disaster, Displacement, and No-Permanent-Address Systems

Some tools focus on emergency response, refugee registration, camp management, or field mapping. They solve important operational problems but often remain tied to a crisis-specific database, a local project, or a temporary workflow.

AGID's difference:

- A displaced person, temporary clinic, mobile base, or rebuilt home can retain a location reference even when the civic address changes.
- The same AGID can be expressed as a QR payload, SDK object, map cell, registered address record, or international-English label.
- The system can show whether the location is postal verified, geo verified, partial, or manual required.
- It can coexist with humanitarian OSM/HOT-style mapping, national disaster datasets, and local administrative updates without becoming dependent on one database.

This is the clearest use case for the **virtual address** concept: AGID preserves a place reference when the legal, postal, or physical address around it is fluid.

### Geocoders and Map Search

Examples include OpenStreetMap Nominatim, Pelias, OpenCage-style formatters, Google Maps, Apple Maps, and regional government geocoders.

AGID advantages:

- Treats geocoders as evidence sources and merges them with postal metadata, address-format rules, country policies, natural features, and user-confirmed data.
- Can show weak confidence instead of pretending a search hit is a complete postal address.
- Adds QR, AOID, registered-address, SDK, and offline behavior around the search result.
- Handles seas, mountains, water, disputed regions, overseas territories, and no-permanent-address places as first-class cases.

Geocoder advantages AGID should respect:

- Large place databases.
- Search ranking, fuzzy matching, and POI discovery.
- Mature consumer map UX.

AGID should not build a closed geocoder from scratch. It should orchestrate open and official sources and preserve provenance.

### Logistics Labels and Delivery Platforms

Delivery platforms focus on getting a parcel, rider, vehicle, or route to a destination.

AGID advantages:

- Works as a neutral address evidence layer before a specific carrier is selected.
- Supports domestic and international-shipping English forms.
- Preserves local script and romanization policy.
- Can encode registered addresses into QR payloads.
- Can expose SDKs for terminals and carrier integrations.
- Can provide a stable virtual postal code before the carrier has an official postal code or route label for that place.
- Can preserve location identity when a delivery point is temporary, under reconstruction, informal, or newly urbanized.

Delivery-platform advantages AGID should respect:

- Operational carrier networks.
- Live routing, pricing, SLA, and customs integrations.

AGID should integrate with logistics systems rather than compete with carrier operations.

### GIS Platforms

Examples include MapLibre GL, OpenLayers, QGIS, PostGIS, GeoServer, GDAL, and similar tools.

AGID advantages:

- Product-level address intelligence and user workflows on top of GIS infrastructure.
- A deterministic global ID and address rendering model.
- A focused validation pipeline for postal/geographic source quality.

GIS platform advantages AGID should respect:

- Mature spatial storage, rendering, editing, and analysis.
- Standards support such as WMS, WFS, GeoJSON, vector tiles, and coordinate transformations.

AGID should use GIS tools for validation, rendering, and backend indexing, not reimplement a whole GIS stack.

### AGID's Defensible Difference

The strongest differentiation is the combination of:

- deterministic global grid identity,
- explicit virtual postal-code philosophy for countries and regions with no, weak, broad, or incomplete postal-code systems,
- explicit virtual-address philosophy for locations whose ordinary address is missing, changing, temporary, or lost,
- address-format intelligence by country/territory,
- multilingual native and international-English rendering,
- postal and open-source evidence scoring,
- explicit uncertainty display,
- private registered addresses and QR payloads,
- sea, mountain, water, natural-feature, disputed-region, overseas-territory, and autonomous-region handling,
- central quality upgrades without central dependency,
- SDK portability across many languages.

No single competitor in the landscape fully covers this combination. The risk is scope creep. The product must keep the core simple: deterministic ID first, evidence second, rendering third, registration fourth, integrations fifth.

### Product Philosophy in One Sentence

AGID is a world-common location identity layer that overlays a virtual postal code and a virtual address on top of deterministic geography, then upgrades that identity with postal evidence, open geographic evidence, local-language rendering, international-English rendering, QR sharing, and SDK portability.

### Claims AGID Can Make Now

- AGID is designed as a deterministic grid and address-intelligence layer.
- AGID can run core ID logic locally and through SDK packages.
- AGID can use central services to upgrade address quality without making the core ID central-only.
- AGID tracks source labels, confidence, and partial/manual states.
- AGID is built to handle postal-code and no-postal-code regions differently.

### Claims AGID Should Not Make Yet

- Do not claim universal final-mile delivery correctness until carrier and postal authority integrations are proven.
- Do not claim complete global building-name coverage; treat building names as evidence from OSM, OpenFreeMap, Overture, national datasets, and user confirmation.
- Do not claim legal resolution of disputed territories; provide claim-aware display choices and neutral evidence.
- Do not claim H3/S2/PostGIS replacement; AGID can interoperate with those tools.
- Do not claim every SDK is production-complete until each package has encode/decode/cell-bounds parity tests.

## Current Capabilities

### AGID Grid

- Deterministic latitude/longitude encoding and decoding.
- Cubed-sphere style quantization path with optional WASM acceleration.
- Stable viewport grid rendering work in progress.
- Tests for stale partial grids, full-viewport grid coverage, selected-cell alignment, and user-facing grid display behavior.

### Address Registration

- Full-screen registration flow.
- Country, territory, autonomous-region, and overseas-region selection.
- Country address-language tabs separated from app UI language.
- Domestic English and international-shipping English rendering for English-address countries.
- Postal-code-aware field rendering.
- QR payload generation and reading for registered addresses.
- Building name prefill path from reverse geocode details and open-source place data.

### Place Search

- Search-only language hints derived from query scripts and aliases.
- Place-name search remains separate from app UI language and address-language tabs.
- Local OSM cache matching covers all available `name:*` tags, not a fixed small language list.
- Photon route-search suggestions retry expanded query variants when the original query returns no features.

### Address Rendering

- Country-specific address ordering.
- Native language display and international-English display.
- Multilingual-country handling.
- East Asia romanization groundwork, including Japanese Hepburn, Chinese Pinyin, Korea Revised Romanization direction, Taiwan/Hong Kong/Macau differentiated policy, and Mongolian support.
- Arabic, Portuguese, Spanish, French, German, Italian, Traditional Chinese, Simplified Chinese, and other major language workflows.

### Data Coverage

- Address format data organized by continent and subregion.
- JSON and YAML address-format variants.
- Generated continent-level address hierarchy files.
- Special support paths for overseas territories, autonomous territories, disputed territories, and no-permanent-address locations.
- Postal source verification scripts.
- Address coverage policy classification:
  - Postal Code Available + Reliable API,
  - Postal Code Available + Weak API,
  - No Postal Code + Strong Geo OSS,
  - No Postal Code + Weak Geo OSS.

### Open-Source Geography

- MapLibre GL frontend.
- OpenStreetMap/OpenFreeMap-compatible search and rendering paths.
- Overpass proxy path.
- OpenLayers dependency for GIS-oriented workflows.
- Turf geometry utilities.
- Overture Maps-ready building-name candidate logic.
- Optional GIS validation output for GDAL and QGIS.

### Persistence and Communication

- Dexie-backed local application database.
- localStorage fallback compatibility.
- Saved AGIDs, saved QR records, registered addresses, AOIDs, and sync queue models.
- Hybrid central/device/SDK architecture policy for deciding which workflows use central quality, local-first private storage, portable SDK logic, or versioned open-data packs.
- Central hybrid quality endpoint and frontend service fallback path for address/postal/geo quality decisions.
- Communication health endpoint.
- Server-Sent Events path for job updates.
- Typed HTTP client with request IDs, retries, timeout handling, source labels, warnings, and confidence fields.

### Drone and Navigation Groundwork

- Internal drone landing assessment model.
- Drone corridor and mission package models.
- Navigation destination service.
- Drone UI intentionally not exposed by default.

### SDK Direction

SDK folders exist for many language targets, including:

- C, C++, Rust, WASM,
- JavaScript/TypeScript,
- Python, Go, Swift, Kotlin, Java, PHP,
- .NET, Ruby target direction, Dart, R, Julia, Elixir, Lua, Zig, Nim.

The SDK strategy is to keep the AGID encoding/decoding core portable while the web app handles rich address intelligence.

## Recent Engineering Improvements

- Verified that the app launches at `http://127.0.0.1:3000/`, returns HTTP
  200, and reports `/api/health` as `{"status":"ok"}` in the 2026-06-07 smoke
  pass.
- Verified that the production build succeeds through Vite in the 2026-06-07
  pass, while still warning about a large main bundle.
- Added a full workspace material audit that separates generated cleanup
  candidates, archive candidates, and code-review candidates without deleting
  files.
- Hardened AOID normalization around 9- to 16-character Base32 handles,
  linked-AGID anchors, repeated-character rejection, and four-character
  consecutive-run rejection.
- Moved address-registration territory datasets out of the large UI component.
- Added frontend API endpoint builders.
- Added a typed GeoAdmin service for country stats, city lists, boundaries, data-quality reports, and OSM region search.
- Added a hybrid architecture policy layer so central services improve quality without making AGID core, local records, or SDK use dependent on the server.
- Added refactor guard tests to keep direct country-admin URL construction out of UI components.
- Kept DB synchronization isolated in a dedicated hook.
- Verified focused grid, QR, address-registration, grid-detail, endpoint, service, and persistence tests.

## Validation Commands

Focused refactor tests:

```bash
node --import tsx --test src/App.gridUi.test.ts src/App.registrationQr.test.ts src/components/GridDetailPanel.test.ts src/components/AddressRegistration.test.ts src/lib/refactorGuard.test.ts src/lib/apiEndpoints.test.ts src/services/GeoAdminService.test.ts src/hooks/useAppDatabasePersistence.test.ts
```

Type check:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

GIS validation:

```bash
npm run verify:gis
npm run verify:gis:changed
npm run verify:gis:strict
```

Postal source validation:

```bash
npm run verify:postal-sources
npm run verify:postal-sources:live
```

## Quality Risks

### Main Bundle Size

The production build still warns about a large main chunk. The highest-value fix is to split geocoding, address rendering, and app-shell workflows into lazily loaded domain modules.

### Geocoding Service Coupling

`GeocodingService.ts` still mixes search, reverse geocoding, OSM place lookup, Overture/OpenFreeMap building names, regional enrichment, and address format loading.

Recommended split:

- place database,
- OSM/Overpass clients,
- smart search,
- building-name service,
- regional reverse geocoder,
- regional context registry.

### App Shell Size

`App.tsx` still owns too many workflows. Continue extracting:

- location permission,
- search controller,
- route planning,
- QR controller,
- saved-location controller,
- quality report controller,
- app panels.

### Translation Catalog Size

The app-language translation file is large enough that locale additions can accidentally become fallback-only. Split by locale and add key-completeness tests.

### Postal and Geo Source Quality

Some countries have reliable official APIs, while others only have weak postal metadata or strong non-postal geographic data. The app should keep showing this difference clearly instead of forcing every country into the same validation behavior.

## Roadmap

### Phase A: Stabilize Core UX

- Finish grid full-coverage behavior and selected-cell alignment.
- Make grid visibility all-or-nothing when the viewport is outside the display threshold.
- Keep address registration full-screen, clear, and country-first.

### Phase B: Strengthen Address Intelligence

- Expand multilingual-country address tab policies.
- Improve native-to-English building name conversion.
- Improve country-specific international-English ordering.
- Add more source and confidence signals to address cards.

### Phase C: Harden Data Pipelines

- Keep address formats in continent/subregion/country files.
- Generate hierarchy files from stable source metadata.
- Add changed-file fast paths for postal and GIS validation.
- Make every source label traceable.

### Phase D: Split Runtime Architecture

- Split app shell hooks.
- Split geocoding services.
- Split server routes.
- Split translation catalogs.
- Keep compatibility barrels where public imports already exist.

### Phase E: Integration and SDKs

- Keep SDKs generated from a single AGID core model.
- Add language-specific smoke tests.
- Publish packages only after test and documentation parity is stable.

## GitHub Publishing Strategy

Because the current working tree is large, publish in a way that preserves reviewability:

1. Create a named branch from the current detached worktree.
2. Commit the current AGID feature/refactor batch with a clear message.
3. Push the branch to GitHub.
4. Open a draft PR with:
   - summary,
   - test commands,
   - known warnings,
   - follow-up refactor targets.
5. Avoid mixing generated cache/build folders into the commit.

If GitHub authentication is unavailable, keep the branch and commit local and report the exact re-authentication command needed.
