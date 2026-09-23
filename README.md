# AGID

AGID is an address and location intelligence system built around a deterministic global grid ID. Its core philosophy is the superposition of a **virtual postal code** and a **virtual address**: a virtual postal code for countries and regions where postal codes are absent, too broad, or incomplete, and a virtual address for locations whose ordinary address is missing, temporary, changing, or lost through disaster, displacement, redevelopment, or mobile use.

It combines a MapLibre-based map UI, country-aware address registration, multilingual address rendering, open-source postal/geographic evidence, QR registration, and SDK generation for multiple programming languages.

The goal is practical: make land, sea, mountain, waterfront, disputed-area, temporary, disaster-affected, no-postal-code, and building-level locations easier to identify, display, validate, share, and integrate without depending on a single proprietary map provider.

## Privacy and Human-Rights Defaults

AGID/AOID is a privacy-preserving address infrastructure project, not a token-first crypto project and not a central raw-address database. The default posture is:

- **Ethereum optional**: AGID generation, AGID decode, address display, address correction, AGID-S local decryption, QR/NFC intake, basic POS handoff, user export, user deletion, and high-risk safety workflows must work without wallets, gas, public ledgers, or crypto payments.
- **Local-first**: address resolution, language tabs, postal assistance, registered-address drafts, OCR/evidence drafts, POS decisions, and offline queues should run locally whenever feasible. Hosted registries, ZK, cloud sync, and Ethereum are optional evidence, verification, settlement, or audit layers.
- **No raw address by default**: public payloads, examples, audit exports, logs, Address DNS records, Ethereum records, public QR payloads, and registry records use commitments, short-term aliases, roots, nullifiers, tails, and redacted evidence. Raw addresses, AOID plaintext, recipient names, phone numbers, unit details, proof codes, precise coordinates, and real AGID-S payloads stay local, encrypted, or explicitly scoped by user consent.

This matters for ordinary delivery privacy, but especially for domestic-violence, refugee, humanitarian, disaster, censorship-risk, and under-addressed contexts. High-risk workflows must prefer AGID-S, coarse disclosure, short expiries, immediate revocation/used-state marking, no address-history retention, and clear consent. See [Privacy and Human-Rights Positioning](docs/privacy-human-rights-positioning.md) and [Privacy Design](docs/privacy-design.md).

## AGID Standard Surface

AGID is designed so the standard stands apart from the web application. The app is a reference implementation; the contract for other tools, SDKs, logistics systems, GIS pipelines, and offline devices is kept in explicit standard artifacts.

| Artifact | Role | Status |
| --- | --- | --- |
| [`sdk/agid-spec/agid-spec.json`](sdk/agid-spec/agid-spec.json) | Language-neutral AGID core contract for encoding, decoding, cell bounds, and cell polygons. | Canonical |
| [`sdk/agid-spec/test-vectors.json`](sdk/agid-spec/test-vectors.json) | SDK parity vectors used to verify `encode`, `decode`, and `cellBounds` across languages. | Required before formal SDK distribution |
| [`sdk/agid-spec/README.md`](sdk/agid-spec/README.md) | Human-readable specification boundary and conformance rules. | Canonical guide |
| [`docs/agid-spec-v0.1-rc.md`](docs/agid-spec-v0.1-rc.md) | Release-candidate scope, conformance levels, public/private boundaries, launch gates, and known limitations for AGID v0.1. | Release candidate |
| [`/api/v1/openapi.json`](src/lib/openApiSpec.ts) | Versioned integration API contract for AGID services. | OpenAPI 3.1 |
| [`docs/agid-security.md`](docs/agid-security.md) | Public-layer AGID security policy for strict ID parsing, QR boundaries, and open-source release integrity. | Required before public release |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting, severity handling, external-audit readiness, and rules for reports that avoid real address material. | Required before public release |
| [`docs/privacy-human-rights-positioning.md`](docs/privacy-human-rights-positioning.md) | Front-door privacy and human-rights positioning: Ethereum optional, local-first, and no raw address by default. | Public stance |
| [`docs/programming-language-selection-policy-ja.md`](docs/programming-language-selection-policy-ja.md) | Project-wide language selection and refactor policy for TypeScript, Rust, SQL, Solidity, Circom, Lean, Python, and generated SDKs. | Engineering governance |
| [`LICENSE_POLICY.md`](LICENSE_POLICY.md) | Recommended license split for SDKs, specs, ZK circuits, local resolver, POS, servers, papers, and commercial extensions. | Public release policy |
| [`docs/repository-owner-routing.md`](docs/repository-owner-routing.md) | GitHub owner routing: public research and OSS under `dawnportinfo-design`, commercial product and hosted operations under `veygrit-sys`. | Repository ownership policy |
| [`DATA_LICENSES.md`](DATA_LICENSES.md) | Top-level data-license index for geography, postal, map, trade, carrier, and external evidence layers. | Required for source packs |
| [`docs/data-licenses.md`](docs/data-licenses.md) | Detailed data-license policy for open-source, government, OSM, postal, and geographic evidence layers. | Required for source packs |

The independent standard view is documented in [AGID Standard and Conformance](docs/agid-standard.md). A language SDK is not release-ready until its parity tests pass against `sdk/agid-spec/test-vectors.json`. A public release should publish checksums or detached signatures for the spec, vectors, OpenAPI artifact, SDK packages, and public data packs. External postal, map, address, and geographic datasets keep their own licenses and attribution requirements; AGID must not relabel third-party data as AGID-owned data.

## Address Morphism Theory v2

Address Morphism Theory v2 is the verified theory layer for treating addresses as computable references rather than only strings. It preserves the previous broad chapter set in a tighter 12-chapter structure, and every main chapter has a matching executable TypeScript model and test.

- Start here: [AMT v2 Summary](docs/address-morphism-theory-v2/SUMMARY.md).
- Chapter/model registry: [Formal Model Registry](docs/address-morphism-theory-v2/formal-model-registry.md).
- Preservation map from the earlier chapter plan: [Compatibility Map](docs/address-morphism-theory-v2/compatibility-map.md).

Verify the AMT v2 document/model contract with:

```bash
npm run verify:address-morphism-v2-compatibility
```

Publication-safety boundary: AMT v2 does not claim global address completeness, raw-address fixture coverage, or that ZK/commercial APIs can repair bad address resolution. It defines the reference, evidence, abstention, privacy, governance, and benchmark boundaries that other AGID packages must respect.

## CLI Quick Start

The AGID CLI is the fastest OSS entry point for local encode/decode, validation,
bulk fixtures, and conformance checks. It is local-first and no-raw-address by
default.

```bash
npm run agid -- help
npm run agid -- encode --lat <latitude> --lon <longitude> --json
npm run agid -- validate <AGID> --json
npm run agid -- batch encode --file sample.jsonl --input-format jsonl --json
npm run agid -- conformance --json
```

All JSON/GeoJSON CLI outputs include `schemaVersion` and `cliVersion` for stable
external integration. See [AGID CLI](docs/agid-cli.md).

## Funding and Release Readiness

The open-source launch package is organized around a fundable public-good story, concrete demos, and pre-audit safety checks:

- [Governance](GOVERNANCE.md): maintainer roles, security/privacy vetoes, release criteria, and repository split policy.
- [Roadmap](ROADMAP.md): public phase plan from OSS baseline to spec/SDK, country packs, operations, and ZK/Web3 readiness.
- [Support](SUPPORT.md): where to ask for help and what private address material must never be posted publicly.
- [Funder Brief](docs/funder-brief-en.md): five-page brief for public-interest funders, civic technology programs, humanitarian infrastructure, and open-source sponsors.
- [Three Public Demos](docs/agid-three-demos-ja.md): local resolver/address element, AGID-S high-risk sharing with POS offline handoff, and audit-ready registry/ZK-ready predicate flow.
- [Funding Channels](docs/funding-channels-ja.md): GitHub Sponsors, Open Collective, and Gitcoin positioning without turning AGID into a token-first project.
- [External Audit Hardening](docs/external-audit-hardening-ja.md): what must pass before inviting outside security review.

Before a public release candidate, run:

```bash
npm run verify:oss-launch
```

For build-output release gates, run a fresh build before asset and PWA checks. CI should set a short artifact-age budget so stale `dist` output cannot pass silently:

```bash
npm run verify:release-build-assets
```

The command defaults `AGID_BUILD_BUDGET_MAX_AGE_MINUTES` to `30` and then runs build, asset-budget, and PWA checks in order.

## Project Resume

For a deeper project summary, architecture map, validation strategy, and roadmap, see [Project Resume](docs/project-resume.md).
For the address translation theory behind the native and international-English address tabs, see [Verified Address Translation Theory](docs/verified-address-translation-theory.md).
For the public/private identity split between AGID and AOID, see [AGID and AOID Design Principles](docs/agid-aoid-design.md).
For the detailed distinction from what3words, Plus Codes, geohash, H3/S2, postal APIs, geocoders, logistics platforms, GIS tools, and humanitarian mapping systems, see the competitive landscape section in the [Project Resume](docs/project-resume.md#competitive-landscape-and-differentiation).

## Core Capabilities

- **Deterministic AGID grid**: absolute grid positioning based on latitude/longitude, designed to stay stable while panning and zooming.
- **Address registration**: full-screen address registration flow with country/region selection, address-language tabs, postal-code fields, QR generation, and registered-address persistence.
- **Privacy controls**: local-first address storage, external address-data opt-out, public/full QR payload modes, private-data clearing, and server log redaction. See [Privacy Design](docs/privacy-design.md).
- **AGID/AOID identity split**: AGID stays a public place, address, and building identifier, while AOID stays an owner-controlled private delivery/recipient identifier.
- **Anti-surveillance private proof stance**: full addresses, AOID bodies, recipient names, phone numbers, unit details, and private history are not central-server plaintext data. ZK Address Proof, ZK Residence Proof, and ZK Delivery Eligibility should expose only scoped facts such as "resident in Japan", "inside Tokyo", or "inside a delivery zone". AOID must not become a global public tracking identifier; public flows use purpose-specific commitments and domain-separated nullifiers. See [Security and Privacy Design](docs/security-privacy-design.md).
- **Search-only multilingual place lookup**: query-derived language hints and aliases improve place-name recall without changing app language or address-language tabs. See [Place Search Language Design](docs/search-language-design.md).
- **Multilingual address rendering**: native-language and international-English address display with country-specific ordering, romanization, and multilingual-country support.
- **Postal and open-source evidence**: postal-code metadata, source classification, confidence display, and fallback behavior for countries with weak or unavailable postal APIs.
- **Public map-feature labels**: OpenStreetMap/OpenFreeMap/Overture-ready lookup and ranking for buildings, roads, bridges, mountains, rivers, lakes, ponds, bays, water bodies/waterfronts, parks, grasslands, deserts, forests, wetlands, beaches, islands, caves, valleys, waterfalls, glaciers, reefs, springs, ruins, heritage/world-heritage sites, and place labels that strengthen address display.
- **Sea, natural, and special geography**: support paths for sea names, mountains, waterfronts, natural features, territories, autonomous regions, and disputed regions.
- **GIS validation**: optional open-source validation path using generated GeoJSON, GDAL when available, and QGIS review projects.
- **Drone and navigation planning groundwork**: internal drone landing, corridor, mission package, and navigation services without exposing drone UI by default.
- **Multi-language SDK output**: generated SDK packages under `sdk/` for C, C++, Dart, .NET, Elixir, Go, Java, JavaScript/TypeScript, Julia, Kotlin, Lua, Nim, PHP, Python, R, Rust, Swift, WASM, Zig, and related runtimes.

## Architecture

```text
Map UI / Address UI
        |
        v
Typed frontend services
        |
        v
Express API proxy and validation endpoints
        |
        v
Open-source providers, local metadata, postal datasets, GIS validation
```

Important areas:

- `src/App.tsx`: application shell, map orchestration, QR/search/navigation wiring.
- `src/components/`: focused UI surfaces such as address registration, grid detail, search, saved locations, postal lab, and geo architect panels.
- `src/lib/`: AGID math, address rendering, validation policies, HTTP client, endpoint builders, grid logic, QR payloads, and data-quality helpers.
- `src/services/`: geocoding, routing, communication, drone, navigation, and geo-admin service boundaries.
- `src/data/address_formats/`: country, territory, autonomous-region, disputed-region, and special-location address metadata organized by continent and subregion.
- `src/data/address_hierarchy/`: generated continent-level address hierarchy files.
- `scripts/`: metadata sync, address hierarchy generation, SDK generation, postal-source verification, and GIS validation.
- `docs/`: project resume, GIS validation notes, and refactor/code-quality scans.

## Address Quality Model

AGID separates address accuracy into several layers instead of presenting every result as equally certain:

- **Postal Code Available + Reliable API**: postal-code lookup and strong validation are allowed.
- **Postal Code Available + Weak API**: format validation and candidate suggestions are used, but manual confirmation remains important.
- **No Postal Code + Strong Geo OSS**: AGID, coordinates, administrative hierarchy, and open geographic sources drive a Geo Verified result.
- **No Postal Code + Weak Geo OSS**: AGID and coordinates become the primary identifier and manual confirmation is required.

This policy is implemented in `src/lib/addressCoveragePolicy.ts` and surfaced through address quality summaries and tests.

## Open-Source Data Strategy

AGID uses open-source data as evidence layers:

- Map rendering: MapLibre GL, OpenFreeMap/OpenStreetMap-compatible tiles, PMTiles-ready paths.
- Geometry and analysis: Turf, OpenLayers, generated GeoJSON, optional GDAL/QGIS/PostGIS review paths.
- Geocoding and place labels: OSM/Nominatim-style data, Photon-compatible search, Overpass, OpenFreeMap/Overture-ready building and public map-feature label candidates.
- Postal/address rules: local address-format metadata, libaddressinput/OpenCage-style formatting concepts, official postal APIs when available, and open postal datasets where quality is sufficient.
- Language data: CLDR-based language/country display data, native scripts, and country-specific international-English rendering rules.

The app should treat each source as evidence with a source label, confidence, warnings, and fallback behavior.

## Development

### Requirements

- Node.js 18 or newer
- npm
- Optional: Rust toolchain for the WASM AGID core
- Optional: GDAL and QGIS for GIS validation review

### Install

```bash
npm install
```

### Linux

AGID is intended to run on Linux without shell-specific npm scripts. On Ubuntu/Debian-like systems, install Node.js 18 or newer plus a native build toolchain for optional dependencies:

```bash
sudo apt-get update
sudo apt-get install -y nodejs npm build-essential python3
npm install
npm run verify:linux
npm run lint
npm run build
```

The `clean` command is implemented with Node instead of `rm -rf`, so it works the same way on Linux, macOS, and Windows. Optional GIS, Rust WASM, and ZK workflows may need their own Linux packages such as GDAL, QGIS, Rust, or Circom-compatible tooling.

### Apple Platforms

AGID is also checked for macOS, iOS, iPadOS, and Safari/PWA compatibility:

```bash
npm run verify:apple
npm run lint
npm run build
```

The Apple compatibility check verifies Safari/PWA metadata, home-screen install settings, safe-area viewport CSS, Apple Maps handoff, and browser API fallbacks. Web NFC is not available on iOS Safari, so POS flows must keep QR and manual payload intake as equal fallback paths.

### Run

```bash
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

The official integration API base path is:

```text
http://localhost:3000/api/v1
```

OpenAPI is available at:

```text
http://localhost:3000/api/v1/openapi.json
```

Legacy `/api` routes remain available as compatibility aliases while external clients migrate to `/api/v1`.

### Lightweight Embed

For iframe and WebView integrations, use the standalone embed page instead of loading the full map application bundle:

```html
<iframe
  title="AGID"
  src="http://localhost:3000/embed?lat=<latitude>&lon=<longitude>&prefix=JP&compact=1"
  loading="lazy"
></iframe>
```

Supported query parameters:

- `agid`, `id`, or `q`: render an existing 12-character AGID.
- `lat` + `lon`: generate an AGID from coordinates.
- `prefix`: optional 2-character country, territory, or sea prefix for coordinate-generated IDs.
- `address`: optional short address line shown on the card.
- `label`: optional card label.
- `theme`: `auto`, `light`, or `dark`.
- `compact=1`: removes outer spacing for tight iframe/WebView layouts.
- `hideActions=1`: hides open/copy-link actions.

The embed entry does not import React, MapLibre, address metadata, or translation modules. It keeps only the deterministic AGID coordinate math, copy actions, and a link back to the main app.

### Build

```bash
npm run build
```

### Type Check

```bash
npm run lint
```

### GIS Validation

```bash
npm run verify:gis
```

Fast changed-file preflight:

```bash
npm run verify:gis:changed
```

Strict validation:

```bash
npm run verify:gis:strict
```

See [GIS validation](docs/gis-validation.md).

### Postal Source Verification

```bash
npm run verify:postal-sources
```

Live provider checks can be run when network access is available:

```bash
npm run verify:postal-sources:live
```

### Address Metadata Generation

```bash
npm run sync:address-metadata
npm run organize:address-formats
npm run generate:address-format-yaml
npm run generate:address-hierarchy
```

### SDK Generation

```bash
npm run generate:agid-sdks
```

Optional Rust WASM build:

```bash
npm run build:rust-wasm
```

## Current Engineering Strategy

1. Keep AGID grid math deterministic and viewport rendering stable.
2. Keep address registration separate from app language settings and country selection.
3. Prefer typed service boundaries over direct `fetch` calls in UI components.
4. Classify postal/geographic source quality instead of hiding uncertainty.
5. Keep large generated country/address data out of UI components.
6. Split heavy app-shell responsibilities into hooks and service modules one slice at a time.
7. Use tests to prevent regressions in grid rendering, QR registration, address-language compatibility, and data-source policy.
8. Follow the project language-selection policy: TypeScript-first for UI/API/policy, Rust for deterministic numeric cores and high-volume workers, SQL for indexed persistence, Solidity for minimal on-chain state, Circom/ZK tooling for real proof circuits, Lean for formal claims, Python for GIS/document experiments, and generated SDKs for public runtime distribution.

## Validation Snapshot

Recent local checks used during the current refactor pass:

```bash
node --import tsx --test src/App.gridUi.test.ts src/App.registrationQr.test.ts src/components/GridDetailPanel.test.ts src/components/AddressRegistration.test.ts src/lib/refactorGuard.test.ts src/lib/apiEndpoints.test.ts src/services/GeoAdminService.test.ts src/hooks/useAppDatabasePersistence.test.ts
npm run lint
npm run build
```

Build warnings currently remain around large chunks and mixed static/dynamic imports in geocoding services. They are known refactor targets, not runtime blockers.

## License

The current repository software license is MIT. See [LICENSE](LICENSE).

AGID also maintains a license split policy for SDKs, specifications, ZK circuits, local resolver/POS code, server code, papers, enterprise extensions, and source data. See [LICENSE_POLICY.md](LICENSE_POLICY.md).

Third-party geography, postal, map-feature, trade, carrier, official-source, and external datasets are not relicensed as AGID software. See [DATA_LICENSES.md](DATA_LICENSES.md) and [docs/data-licenses.md](docs/data-licenses.md).

## Acknowledgements

AGID builds on open-source geography and web tooling, including MapLibre GL, OpenStreetMap, OpenFreeMap-compatible map delivery, Turf, OpenLayers, CLDR data, PMTiles, Open Location Code, and the broader open GIS ecosystem.
