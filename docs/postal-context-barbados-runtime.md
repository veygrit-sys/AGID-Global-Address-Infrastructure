# Barbados Postal Context Runtime

Status: M1_metadata. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, live responses, real addresses, personal data or production geometry.

## Postal and BBID evidence flow

BPS legacy postcode observation -> `BBNNNNN` -> permitted Lands and Surveys feature -> explicit `BuildingID + ShortPosta + LongPostal + footprint` -> structured address context -> independent AGID crosswalk

The current Barbados Postal Service guide and lookup retain the integral `BB` plus five-digit locality form. The UPU sheet is dated November 2014. On 13 December 2024, the Government of Barbados described the six-character BBID and updated postcode: remove the BBID parish identifier and append the remaining five characters to the old postcode. AGID accepts `BBNNNNN` and `BBNNNNN-AAAAA`, but never invents the suffix or reconstructs the omitted parish character.

## Geometry and building-level display

No rights-cleared nationwide postcode polygon release is bundled. The official BBID web map currently exposes BuildingID, ShortPosta and LongPostal on building polygons. A permitted, pinned feature can therefore establish a strong single building-postcode observation. Public ArcGIS Query access and empty licence metadata do not authorize bulk scraping, caching, mirroring or republication.

Building display is allowed only through that same-feature relation or another rights-cleared explicit stable join. A legacy postcode, syntactically valid LongPostal, locality, parish, point, parcel, address string, containment, proximity, buffer, Voronoi cell or model cannot prove a building. The locality layer is reference-only; parish material has separate all-rights-reserved constraints; paid Digimap products are not open postal data. OSM remains a separate ODbL validation partition.

## Realtime, mathematical generation and compression

Realtime BPS and BBID observations improve freshness when purpose, minimized query, service and layer version, selected fields, observed time, terms, rate policy and request-response digests are retained. Timeout or empty output is unknown, not evidence of no assignment. Prefix indexes, feature IDs, quantized coordinates, PMTiles and bounded-error simplification can compress permitted data, but every modified surface remains derived with algorithm, inputs, uncertainty and error bounds. A model may detect drift and prioritize review; it cannot create a BBID, suffix, assignment, boundary, address, person or delivery entitlement.

## Privacy, AGID, Hugging Face and Cloudflare

LongPostal is building-unique by design, so a code, footprint and query log can reveal household or security context. Apply purpose limitation, minimization, retention, access control and publication review. AGID stays an independent spatial index and never becomes canonical Barbados postal or BBID geometry.

Only rights-cleared, licence-compatible, versioned Parquet, GeoParquet or PMTiles partitions may be published on Hugging Face; production readers pin a Hub commit and verify digests. Restricted and household-level material remains gated or external. Cloudflare Workers can serve metadata and permitted indexes, R2 can hold immutable shards, and Durable Objects can coordinate release pointers. A Hugging Face Space is demonstration only.

## Synthetic fixture

The bundled `BB99999` and `BB99999-Z9Z9Z` values are fabricated, were not checked against live services and cannot be promoted. Their point, polygon, explicit civic-address relation and building exist only to test separation among legacy area context, updated building linkage, administration, privacy and AGID.
