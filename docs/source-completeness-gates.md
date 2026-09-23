# Source Completeness Gates

Generated: 2026-07-22T08:21:55.923Z

Verdict: **source completeness must be evaluated by layer; no repository currently earns a global all-place-name completeness claim.**

This gate separates official gazetteers, OSM, GeoNames, Wikidata, administrative divisions, islands, POI, natural feature names, and historical/alias names. It prevents a repository from using one source type, such as GeoNames or OSM, to imply total geographic completeness.

## Summary

- Open geo repositories checked: 817
- Repositories allowed to claim global all-place-name completeness: 0
- Repositories with no blocked source layer: 0

Freshness check: `npm run check:source-completeness-gates` compares this report while ignoring generated timestamps.

## Claim Boundary

- Verdict: **global-all-place-name-claim-blocked**
- Blocked claim: `global-all-place-name-completeness`
- Allowed claim: source-layer status for explicitly named repositories, dimensions, and local seed evidence only
- Global all-place-name claim allowed for this repository set: no
- Required passing dimensions: `official-gazetteer`, `osm`, `geonames`, `wikidata`, `administrative-divisions`, `islands`, `poi`, `natural-features`, `historical-aliases`
- Dimensions still blocking that claim: `official-gazetteer`, `osm`, `geonames`, `wikidata`, `administrative-divisions`, `islands`, `poi`, `natural-features`, `historical-aliases`
- Layer passing scope invariant: passing
- Non-claim statements carried by the gate: 9
- Next gate: Close these source completeness layers before using global all-place-name completeness language: official-gazetteer, osm, geonames, wikidata, administrative-divisions, islands, poi, natural-features, historical-aliases.

## Scoped Layer Claim Checks

Passing POI or natural-feature samples remain scoped evidence unless every required source layer passes for the same repository.

| Dimension | Passing repositories | Still globally blocked | Global claim allowed | Scope leaks | Assertion |
| --- | --- | --- | --- | --- | --- |
| poi | 1 | 1 | 0 | 0 | layer-passing-remains-scoped-unless-all-required-layers-pass |
| natural-features | 14 | 14 | 0 | 0 | layer-passing-remains-scoped-unless-all-required-layers-pass |

## Dimension Results

| Dimension | Japanese label | Passing | Partial | Blocked | Non-claim |
| --- | --- | --- | --- | --- | --- |
| official-gazetteer | 公式gazetteer | 49 | 0 | 768 | An official source link does not prove every place name, alias, or feature has been imported. |
| osm | OSM | 33 | 0 | 784 | OSM cross-reference is not an unrestricted data import and does not remove ODbL attribution/share-alike review. |
| geonames | GeoNames | 51 | 0 | 766 | GeoNames corroborates public place names, but it is not by itself a legal boundary or delivery authority. |
| wikidata | Wikidata | 50 | 0 | 767 | Wikidata identity links do not prove current official status, address validity, or delivery availability. |
| administrative-divisions | 行政区画 | 48 | 128 | 641 | Administrative division coverage does not imply street, building, cadastral, or private address coverage. |
| islands | 島 | 3 | 16 | 798 | Island anchors do not prove boundaries, landing rights, route access, habitation, or delivery reachability. |
| poi | POI | 1 | 0 | 816 | POI coverage is volatile and does not prove endorsement, opening hours, access rights, or carrier support. |
| natural-features | 自然地名 | 14 | 0 | 803 | Natural feature coverage does not prove safe access, legal access, current environmental condition, or precise geometry. |
| historical-aliases | 旧地名・別名 | 50 | 0 | 767 | Alias matching does not prove current official status or that an obsolete name is safe for delivery. |

## Required Gate Semantics

- **official-gazetteer**: A national, territorial, municipal, postal, statistics, or other official place-name source is linked and versioned.
- **osm**: OSM is listed as a cross-reference source or place records carry OSM links.
- **geonames**: GeoNames is listed as a cross-reference source or place records carry GeoNames links.
- **wikidata**: Wikidata is listed as an identity/alias source or place records carry Wikidata links.
- **administrative-divisions**: Administrative records are present and backed by official or independent public cross-reference evidence.
- **islands**: Island records are present, source-linked, and protected by all-island or no-all-island overclaim gates.
- **poi**: POI records such as stations, ports, schools, hospitals, hotels, lockers, stores, or delivery depots are declared as a separate scope.
- **natural-features**: Natural features such as rivers, lakes, mountains, deserts, wetlands, glaciers, caves, valleys, reefs, and waterfalls are declared as a separate scope.
- **historical-aliases**: Aliases, historical names, former names, local-language names, and alternate spellings are represented as source-bound evidence.

## Samples

### 公式gazetteer / official-gazetteer

Passing sample (10 shown):

- `agid-open-ax-gazetteer`
- `agid-open-baar-gazetteer`
- `agid-open-be-gazetteer`
- `agid-open-bn-gazetteer`
- `agid-open-bt-t-gazetteer`
- `agid-open-bv-gazetteer`
- `agid-open-cl-di-gazetteer`
- `agid-open-cl-sg-gazetteer`
- `agid-open-cn-gazetteer`
- `agid-open-cp-gazetteer`

Blocked sample (10 shown):

- `agid-open-ac-geocoder-fixtures`
- `agid-open-ac-license-ledger`
- `agid-open-ad-address-candidates`
- `agid-open-ad-geocoder-fixtures`
- `agid-open-ad-license-ledger`
- `agid-open-ae-boundaries`
- `agid-open-ae-gazetteer`
- `agid-open-ae-license-ledger`
- `agid-open-ae-no-postcode-grid`
- `agid-open-af-boundaries`

### OSM / osm

Passing sample (10 shown):

- `agid-open-ax-gazetteer`
- `agid-open-be-gazetteer`
- `agid-open-bn-gazetteer`
- `agid-open-bt-t-gazetteer`
- `agid-open-cn-gazetteer`
- `agid-open-cygl-gazetteer`
- `agid-open-fm-gazetteer`
- `agid-open-fo-gazetteer`
- `agid-open-id-gazetteer`
- `agid-open-ie-gazetteer`

Blocked sample (10 shown):

- `agid-open-ac-geocoder-fixtures`
- `agid-open-ac-license-ledger`
- `agid-open-ad-address-candidates`
- `agid-open-ad-geocoder-fixtures`
- `agid-open-ad-license-ledger`
- `agid-open-ae-boundaries`
- `agid-open-ae-gazetteer`
- `agid-open-ae-license-ledger`
- `agid-open-ae-no-postcode-grid`
- `agid-open-af-boundaries`

### GeoNames / geonames

Passing sample (10 shown):

- `agid-open-ax-gazetteer`
- `agid-open-baar-gazetteer`
- `agid-open-be-gazetteer`
- `agid-open-bn-gazetteer`
- `agid-open-bt-t-gazetteer`
- `agid-open-bv-gazetteer`
- `agid-open-cl-di-gazetteer`
- `agid-open-cl-sg-gazetteer`
- `agid-open-cn-gazetteer`
- `agid-open-cp-gazetteer`

Blocked sample (10 shown):

- `agid-open-ac-geocoder-fixtures`
- `agid-open-ac-license-ledger`
- `agid-open-ad-address-candidates`
- `agid-open-ad-geocoder-fixtures`
- `agid-open-ad-license-ledger`
- `agid-open-ae-boundaries`
- `agid-open-ae-gazetteer`
- `agid-open-ae-license-ledger`
- `agid-open-ae-no-postcode-grid`
- `agid-open-af-boundaries`

### Wikidata / wikidata

Passing sample (10 shown):

- `agid-open-ax-gazetteer`
- `agid-open-baar-gazetteer`
- `agid-open-be-gazetteer`
- `agid-open-bn-gazetteer`
- `agid-open-bt-t-gazetteer`
- `agid-open-bv-gazetteer`
- `agid-open-cl-di-gazetteer`
- `agid-open-cl-sg-gazetteer`
- `agid-open-cn-gazetteer`
- `agid-open-cp-gazetteer`

Blocked sample (10 shown):

- `agid-open-ac-geocoder-fixtures`
- `agid-open-ac-license-ledger`
- `agid-open-ad-address-candidates`
- `agid-open-ad-geocoder-fixtures`
- `agid-open-ad-license-ledger`
- `agid-open-ae-boundaries`
- `agid-open-ae-gazetteer`
- `agid-open-ae-license-ledger`
- `agid-open-ae-no-postcode-grid`
- `agid-open-af-boundaries`

### 行政区画 / administrative-divisions

Passing sample (10 shown):

- `agid-open-ax-gazetteer`
- `agid-open-baar-gazetteer`
- `agid-open-bn-gazetteer`
- `agid-open-bt-t-gazetteer`
- `agid-open-bv-gazetteer`
- `agid-open-cl-di-gazetteer`
- `agid-open-cl-sg-gazetteer`
- `agid-open-cn-gazetteer`
- `agid-open-cp-gazetteer`
- `agid-open-crim-gazetteer`

Blocked sample (10 shown):

- `agid-open-ac-geocoder-fixtures`
- `agid-open-ac-license-ledger`
- `agid-open-ad-address-candidates`
- `agid-open-ad-geocoder-fixtures`
- `agid-open-ad-license-ledger`
- `agid-open-ae-boundaries`
- `agid-open-ae-gazetteer`
- `agid-open-ae-license-ledger`
- `agid-open-ae-no-postcode-grid`
- `agid-open-ag-address-candidates`

### 島 / islands

Passing sample (3 shown):

- `agid-open-fo-gazetteer`
- `agid-open-ki-gazetteer`
- `agid-open-pn-gazetteer`

Blocked sample (10 shown):

- `agid-open-ac-geocoder-fixtures`
- `agid-open-ac-license-ledger`
- `agid-open-ad-address-candidates`
- `agid-open-ad-geocoder-fixtures`
- `agid-open-ad-license-ledger`
- `agid-open-ae-boundaries`
- `agid-open-ae-gazetteer`
- `agid-open-ae-license-ledger`
- `agid-open-ae-no-postcode-grid`
- `agid-open-af-boundaries`

### POI / poi

Passing sample (1 shown):

- `agid-open-poi-source-scope-fixtures`

Blocked sample (10 shown):

- `agid-open-ac-geocoder-fixtures`
- `agid-open-ac-license-ledger`
- `agid-open-ad-address-candidates`
- `agid-open-ad-geocoder-fixtures`
- `agid-open-ad-license-ledger`
- `agid-open-ae-boundaries`
- `agid-open-ae-gazetteer`
- `agid-open-ae-license-ledger`
- `agid-open-ae-no-postcode-grid`
- `agid-open-af-boundaries`

### 自然地名 / natural-features

Passing sample (10 shown):

- `agid-open-bt-t-gazetteer`
- `agid-open-bv-gazetteer`
- `agid-open-cp-gazetteer`
- `agid-open-eebd-gazetteer`
- `agid-open-ki-gazetteer`
- `agid-open-mh-gazetteer`
- `agid-open-natural-feature-source-scope-fixtures`
- `agid-open-pg-gazetteer`
- `agid-open-ph-gazetteer`
- `agid-open-phis-gazetteer`

Blocked sample (10 shown):

- `agid-open-ac-geocoder-fixtures`
- `agid-open-ac-license-ledger`
- `agid-open-ad-address-candidates`
- `agid-open-ad-geocoder-fixtures`
- `agid-open-ad-license-ledger`
- `agid-open-ae-boundaries`
- `agid-open-ae-gazetteer`
- `agid-open-ae-license-ledger`
- `agid-open-ae-no-postcode-grid`
- `agid-open-af-boundaries`

### 旧地名・別名 / historical-aliases

Passing sample (10 shown):

- `agid-open-ax-gazetteer`
- `agid-open-baar-gazetteer`
- `agid-open-be-gazetteer`
- `agid-open-bn-gazetteer`
- `agid-open-bt-t-gazetteer`
- `agid-open-bv-gazetteer`
- `agid-open-cl-di-gazetteer`
- `agid-open-cl-sg-gazetteer`
- `agid-open-cn-gazetteer`
- `agid-open-cp-gazetteer`

Blocked sample (10 shown):

- `agid-open-ac-geocoder-fixtures`
- `agid-open-ac-license-ledger`
- `agid-open-ad-address-candidates`
- `agid-open-ad-geocoder-fixtures`
- `agid-open-ad-license-ledger`
- `agid-open-ae-boundaries`
- `agid-open-ae-gazetteer`
- `agid-open-ae-license-ledger`
- `agid-open-ae-no-postcode-grid`
- `agid-open-af-boundaries`

## Policy

- A complete country or territory claim must name the exact completeness scope: all-place-name, all-island, main-island, administrative-division, POI, natural-feature, or alias scope.
- A source layer can pass without allowing data redistribution; metadata links and conformance vectors may be enough for a source-bound claim.
- A global all-place-name claim is blocked unless every required source layer passes and the repository has explicit overclaim guards.
- POI and natural feature scopes are volatile and require separate freshness and access non-claims.
