# Fully Free Data Policy for AGID/AOID POS and Cross-Border Support

This project must not rely on free-tier SaaS quotas, trial accounts, API keys, or registration-only services for its default address, POS, and cross-border data layer.

## Default Rule

The default data path is:

```text
static open data
  + self-hosted OSS services
  + local standards parsers
  + operator-imported official snapshots
  + local cache
```

The default data path is not:

```text
free-tier commercial APIs
  + key-gated APIs
  + trial credits
  + public live endpoints required at scan time
  + services that may become paid or quota-limited
```

## Adopt by Default

| Area | Default fully-free choice | Use |
| --- | --- | --- |
| GS1 Digital Link | local URI parser | Read GTIN, SSCC, lot, serial, expiry, and GLN from QR/NFC without calling GS1 services. |
| EPCIS | local event model/export adapter | Store POS, carrier scan, recipient proof, and handoff-complete events locally. |
| UPU S10 | local format/check-digit validator | Recognize international postal item identifiers without carrier API calls. |
| libpostal | self-hosted parser | Parse and normalize multilingual addresses inside the deployment boundary. |
| Pelias | self-hosted geocoder | Address search/autocomplete from local OpenAddresses/OSM imports. |
| Nominatim | self-hosted or cached OSM geocoder | Reverse geocoding and address display support without using the public endpoint as a production dependency. |
| OpenAddresses | local data bundles | Offline address evidence, Pelias imports, and quality scoring. |
| WTO Tariff and Trade Data | operator-imported official snapshots | Tariff evidence packs and explanations, not live customs decisions. |
| Harmonized System dataset | static bundle | Offline HS-code UI assistance. |
| Frankfurter | self-host/local FX cache | Currency reference rates without relying on a public API at scan time. |

## Do Not Adopt by Default

| Source | Reason | Fully-free alternative |
| --- | --- | --- |
| UN Comtrade API | API access, quotas, and terms can affect operational use. | Operator-imported aggregate snapshots only after terms review. |
| World Bank WITS live API | Public live API is still an external operational dependency. | Operator-imported tariff/trade evidence snapshots. |
| GS1 Verified by GS1 | Access/terms/key dependency. | Local GS1 Digital Link parsing only. |
| USPS Addresses API | Registration/key dependency. | Local postal patterns, OpenAddresses, self-hosted Pelias/Nominatim, and manual review. |
| what3words API | Proprietary key-gated dependency. | AGID, Plus Codes-like open encoding, OSM/Pelias/Nominatim. |
| OpenCorporates API | Quota/terms/key dependency for high-volume use. | Operator-supplied business documents or local public-register snapshots when legally available. |
| Public Nominatim endpoint | Usage policy and rate limits make it unsuitable for production scans. | Self-host Nominatim or cache local OSM/Pelias data. |

## Implementation Contract

The code should prefer these functions when building default plans:

```text
getRecommendedFullyFreeCrossBorderSources()
getRecommendedFullyFreeTradeComplianceSources()
```

The older convenience function:

```text
getRecommendedFreeCrossBorderSources()
```

is intentionally aliased to the fully-free policy so that "free" never means "free tier".

## Privacy Contract

Under the fully-free policy:

- raw addresses are not submitted to third-party live APIs;
- AGID, AOID, AGID-S ciphertexts, recipient names, phone numbers, and shipment identifiers stay local, encrypted, or committed;
- standards parsers operate locally;
- official tariff/trade data is imported as aggregate evidence, not queried with customer-level data;
- POS scan-time decisions continue to work offline where cached data is available.

## Residual Limits

A fully free system can improve address quality and trade evidence, but it cannot guarantee final customs duty, carrier acceptance, legal residence, or product classification. Those remain human-review or issuer/carrier-authority responsibilities.
