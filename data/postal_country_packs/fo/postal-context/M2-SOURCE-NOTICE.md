# Faroe Islands Postal Context M2 source notice

This release uses the official `Postnr` (`Postøki í Føroyum`) ArcGIS layer
published by Umhvørvisstovan, the Faroese Environment Agency. It contains
postal-area context only. No raw download, address, building, recipient,
customer, occupant, owner or land-right record is committed.

## Official sources and capture

- Service catalogue: <https://www.foroyakort.fo/vevtaenastur>
- MapServer: <https://gis.us.fo/arcgis/rest/services/fyrisitingarlig_kort/us_postnr/MapServer>
- Layer 0: <https://gis.us.fo/arcgis/rest/services/fyrisitingarlig_kort/us_postnr/MapServer/0>
- Fixed query: `where=1=1`, all reviewed fields, geometry enabled,
  `outSR=4326`, `f=geojson`
- Retrieved: `2026-08-30T05:59:44.058Z`
- Service edition: ArcGIS Server `11.4`, document `2.9.0`, layer `Postnr`,
  source CRS EPSG:5316 and query output EPSG:4326
- Query result: 117 features and 117 distinct three-digit postcodes
- Raw GeoJSON SHA-256:
  `952d2b52d358cd2671673ea1bc5ee3e9161eacd6b15981a9c97f9fc08709ced2`
- Layer metadata SHA-256:
  `58a5f7501ce327d9a6b7b2fb210f93b34271d77239ff8a01c8776659be28740b`
- MapServer metadata SHA-256:
  `fae19e9f79924bb1a74bac130a31610090e74a17250e8f2197057249d5fbb75c`
- Item identity SHA-256:
  `5f1744ae6752f7696ceb837e5932456befc8935401aa0c1049ba2d7d66fa6d9c`
- Count response SHA-256:
  `13698bf27b9585f0ecdd3458bc884193a170ae5bcfdad9d2772f1120af2b0635`
- Object-ID response SHA-256:
  `fd9acf02e0e5a5f747ef04fea8a0a8b5733d1b9e636133935d5b0b5c79733361`
- Service-catalogue HTML SHA-256:
  `a5c902589a2ad8f3d906e47b48e590e207ee004431c497e193b406710da2f578`
- WMS capabilities SHA-256:
  `b962dfa9e76e103c398152026ae09b99e2add45856c572d876413ac57c4fc473`

The service does not expose a usable `returnUpdates` timestamp. The immutable
snapshot identity is therefore the exact service/layer path, server and
document versions, retrieval instant, object-ID set, feature count and raw
query digest together.

## Rights and attribution

The June 2019 [English terms](https://www.foroyakort.fo/um-foeroyakort/terms-and-conditions-in-english)
grant worldwide copying, distribution, publication, modification, combination,
commercial use and non-commercial use subject to attribution and the terms
notice. The captured terms HTML SHA-256 is
`9b78c1c03c495bff72bfdc1cb5d30946ced18d92b8945fa95ab064749fc0e083`.

Required attribution retained by AGID:

> Data from the Faroese Environment Agency, Umhvørvisstovan: Postnummur;
> downloaded through web service 2026-08-30.

## Deterministic transformation and exception

[`scripts/build-postal-context-fo-m2.mjs`](../../../scripts/build-postal-context-fo-m2.mjs)
fails closed on the raw digest, feature and object-ID counts, duplicate or
malformed codes, labels, geometry types, ring closure, Faroe coordinate range,
position budget and Turf validity. It sorts by the zero-padded three-digit
postcode and emits canonical graph, geometry and descriptor artifacts.

The source MultiPolygon for postcode `476` contains eight self-intersections.
Only that feature receives Turf `buffer(0.000001 metres, steps=8)` as a
deterministic topology repair. The result is a valid Polygon, changes area by
`1.5494530300567815e-9` relative, and is published as `derived` with confidence
`0.999999`. The other 116 geometries retain `official` provenance. This repair
does not create an area where none existed.

Posta operator services and the Umhvørvisstovan address register remain
separate references. Postal-area containment is not deliverability, an address,
a building relation, a recipient, occupancy or a land right.
