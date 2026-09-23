# Cross-Border POS and Shopping-Agent Auxiliary Data Layer

This layer supports AGID/AOID POS terminals, cross-border delivery, and shopping agents with fully free local, self-hosted, static, or operator-imported data. It is not a customs broker, carrier acceptance engine, or legal clearance oracle. It returns evidence sources, missing fields, warnings, and manual-review reasons.

## Core Rule

Use official/open sources only when they can be bundled, self-hosted, cached locally, or imported by an operator without relying on a free-tier API quota. Never auto-clear customs, restricted goods, carrier rules, or private address disclosure from auxiliary data alone.

## Runtime Shape

- `getCrossBorderAuxiliaryDataLayer()` returns the source registry.
- `buildCrossBorderAuxiliaryContext(input)` returns the required domains, recommended source IDs, warnings, and manual-review reasons for a specific corridor.
- `getRecommendedFullyFreeCrossBorderSources()` returns the default source set for fully free deployments.
- `getRecommendedFreeCrossBorderSources()` is intentionally aliased to the fully-free policy so that "free" never means "free tier".
- API path helpers are available at:
  - `/api/v1/cross-border/auxiliary/sources`
  - `/api/v1/cross-border/auxiliary/context`
  - `/api/v1/shopping-agent/cross-border/context`

## Adopt First

| Source | Use | Reason |
| --- | --- | --- |
| `datasets-harmonized-system` | Offline HS code assist | Static, open, low-latency |
| `wto-tariff-data` | Official tariff evidence snapshots | Strong official provenance |
| `frankfurter-self-host` | FX estimates | Self-host/local cache, no public API dependency |
| `gs1-digital-link-standard` | Product/logistics QR/NFC parsing | Local standards parser |
| `gs1-epcis-standard` | POS and handoff event model | Local event/export model |
| `upu-s10-standard` | Postal item ID syntax validation | Local check-digit and format validation |
| `libpostal-self-host` | Address parsing and normalization | Self-hosted OSS parser |
| `pelias-self-host` | Address search/autocomplete | Self-hosted geocoder |
| `openaddresses-dataset` | Address evidence and Pelias import | Static local data bundles |
| `eu-taric` | EU tariff/measure evidence | Official EU source |
| `ec-vat-rates` | EU VAT reference | Official EU reference |
| `open-food-facts-api` | Barcode and food/product hints | Use local export/self-host, not public scan-time API |
| `osm-nominatim-self-host` | Address/geocoding candidate support | Open source; self-host/cache for production |
| `overpass-api` | OSM feature context | Useful for AGID natural-feature context |
| `japan-post-postal-csv-posuto` | Japan postal-code assist | Static, offline-friendly |

## Use After Key or Terms Review

| Source | Use | Reason for caution |
| --- | --- | --- |
| `un-comtrade-api` | Trade-flow analytics | Token/quota and redistribution review |
| `world-bank-wits` | Tariff/trade metadata refresh | Public live API dependency; use operator-imported snapshots instead |
| `uk-trade-tariff-api` | UK tariff/VAT/measure evidence | Public live API; keep as reference or optional connector |
| `usitc-hts-rest-api` | US HTS/tariff evidence | Public live API; keep as reference or optional connector |
| `ec-vies` | EU VAT number validation | Live national registry dependency |
| `usps-addresses-api` | US address validation | Registration and terms required |
| `gs1-verified-by-gs1` | GTIN/licensee confidence | Key/terms required; not open core |
| `opencorporates-api` | Business identity enrichment | Quota/terms; human-review only |

## Avoid as Primary

| Source | Reason |
| --- | --- |
| `what3words-api` | Proprietary, key-based, not suitable as core open AGID geocoding |

## Privacy Boundary

The auxiliary layer may use country, commodity code, barcode, value, and currency locally. In the default fully-free mode, it must not submit raw address, AGID, AOID, recipient name, phone number, shipment identifier, or private history to third-party live APIs.

## Manual Review Triggers

- Missing HS code.
- Missing declared value or currency.
- Missing destination address, AGID, or private address proof.
- Batteries, hazmat, medicine, cosmetics, food, plant/animal products, controlled dual-use goods, high-value goods, or age-restricted goods.
- Business-identity mismatch or API unavailability.

## Connector Strategy

1. Keep POS critical path local and cached.
2. Refresh official trade/tariff/FX evidence through static downloads, self-hosted importers, or operator-imported snapshots.
3. Keep all provider adapters behind a common interface.
4. Store source version, retrieval date, reporter/partner, commodity code, and checksum where applicable.
5. Return `ready-for-estimate`, `needs-manual-review`, or `insufficient-data`; never return legal customs clearance.
