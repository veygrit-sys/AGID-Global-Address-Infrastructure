# AGID Ocean Repository Creation

AGID ocean repositories are coordination indexes for marine addressable
geography. They support address morphism for ports, shore handoff, islands,
marine regions, ocean delivery constraints, and non-postal natural geography
without storing private address material.

## Physical Repositories Created First

The first GitHub wave creates only six repositories:

- `agid-ocean`
- `agid-pacific`
- `agid-atlantic`
- `agid-indian`
- `agid-arctic`
- `agid-southern`

These repositories are data-light indexes. They contain README files, manifests,
source policy, quality gates, related repository pointers, data license notes,
and JSON validation workflows.

## Logical Sea-Area Repositories

The current placement model plans 160 logical sea-area repositories below the
five ocean indexes. Examples include:

- `agid-pacific-philippine-sea`
- `agid-pacific-sea-of-japan`
- `agid-atlantic-mediterranean-sea`
- `agid-atlantic-gulf-of-mexico`
- `agid-indian-arabian-sea`
- `agid-arctic-greenland-sea`
- `agid-southern-ross-sea`

These remain logical until source licensing, boundary confidence, maintainer
ownership, and pull-request pressure justify physical repositories. This avoids
hundreds of empty repositories while keeping the global design complete.

## Data Boundary

Ocean repositories may store:

- AGID repository pointers
- multilingual marine names
- coarse boundaries or bounding boxes
- adjacency between seas, oceans, islands, and coastal states
- source metadata and license notes
- quality gates and conformance status
- synthetic fixtures

Ocean repositories must not store:

- raw personal addresses
- recipient records
- precise private delivery coordinates
- witness data, proof secrets, or private keys
- AIS or operational telemetry
- precise hydrographic extracts, bathymetry, map tiles, generated caches, or
  search indexes
- sovereignty decisions

Large GIS and hydrographic data must live in external content-addressed packs.

## Natural Features

Mountains, deserts, rivers, and lakes are not independent repositories by
default. They remain in country-or-region natural-feature packs unless scale,
maintainer ownership, source boundaries, and public review justify a split.

## EEZ And Disputed Names

AGID marine identifiers are technical references for addressing and routing.
They do not decide sovereignty, EEZ rights, or geopolitical claims. Disputed
names and EEZ relations must be source-attributed and display-policy
switchable.

## Validation

Use these commands from the AGID workspace:

```bash
npm run generate:ocean-repo-plan
npm run prepare:ocean-index-repos
npm run verify:repository-split-allocation
npm run verify:no-raw-address-kit
```

The generated GitHub repositories include their own lightweight JSON validation
workflow.
