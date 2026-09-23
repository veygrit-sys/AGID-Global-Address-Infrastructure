# Data Licenses and Source Boundary

This repository pack is an AGID seed package for New Hampshire. The AGID-authored
metadata, tests, and documentation are released under the repository license. External
source materials remain governed by their original providers.

## Bundled Data

- State-level bbox and centroid seed
- Capital centroid seed
- Major city name seeds
- Source metadata and import policy
- Conformance vectors

## Not Bundled

- Raw personal addresses
- Recipient records
- USPS restricted API responses
- ZIP+4 delivery-point payloads
- Full TIGER/Line geometry extracts
- OSM database extracts
- Proof witnesses or private-key material

## Source Ledger

- us-census-tiger-line: U.S. Census Bureau TIGER/Line and TIGERweb geography products - metadata-link-only; public-government-review-current-terms
- us-census-geocoder: U.S. Census Geocoding Services API - not-bundled; public-government-review-current-terms
- usps-web-tools: USPS Addresses and ZIP lookup APIs - not-bundled; restricted-api-do-not-bundle
- usgs-gnis: U.S. Geological Survey Geographic Names Information System - metadata-link-only; public-government-review-current-terms
- openstreetmap: OpenStreetMap - metadata-link-only; open-license-review-required

Before importing full geometry, postal, POI, or routing datasets, review the current
provider terms and store checksums, source vintage, attribution, and redistribution rules.
