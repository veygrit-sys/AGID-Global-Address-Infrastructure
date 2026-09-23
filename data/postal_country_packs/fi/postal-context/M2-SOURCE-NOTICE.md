# Finland Postal Context M2 source and reuse notice

Release: `fi-posti-pcf-20260829-paavo-pno-2026`
Source capture: `2026-08-30T05:10:43.249Z`
Posti download date: `2026-08-30`
Runtime validity begins: `2026-08-29T00:00:00.000Z`

This directory contains transformed public-context runtime artifacts, not the
raw Posti or Statistics Finland downloads. It contains no street, house,
person, customer, recipient, dwelling, ownership, title or exact building
records.

## Assignment source: Posti

- Provider: Posti Group Oyj.
- Service page: <https://www.posti.fi/en/for-businesses/customer-support/postal-code-services>
- Download index: <https://www.posti.fi/webpcode/>
- File: `PCF_20260829.zip`; payload `PCF_20260829.dat`.
- ZIP SHA-256: `269fb75169ff1d9670bee642cf0c84f793d2a7e18d55f0b047178cfdd25f11e3`.
- Payload SHA-256: `becf89ecaa809ce66c2f6ca4316f01ab85bb107367416eb64b44d7f2ff5d039c`.
- Service description and terms: <https://www.posti.fi/mzj3zpe8qb7p/1eKbwM2WAEY5AuGi5TrSZ7/c76a865cf5feb2c527a114b8615e9580/posti-postal-code-services-service-description-and-terms-of-use-20150101.pdf>.
- Terms PDF SHA-256: `d8464513011134d1989008a4a2402436d6d32beab845a485d17e762173ae364a`.

Posti's service page says the Postal Code Data File is current, free, and has
no map data. The reviewed terms permit disclosure to a third party when the
current service description and terms, plus the download date, accompany the
data. Keep this notice with any redistribution of the transformed Posti
assignment artifact and recheck the current official terms before a later
release. Posti assignment does not establish a delivery perimeter.

## Geometry source: Statistics Finland Paavo 2026

- Provider: Statistics Finland.
- Dataset page: <https://stat.fi/en/services/statistical-data-services/geographic-data/geographic-data-by-postal-code-area>.
- WFS: <https://geo.stat.fi/geoserver/postialue/wfs>.
- Layer: `postialue:pno_2026`, sea-extended variant, output CRS WGS84.
- Captured GeoJSON SHA-256: `8cf635b677887906651a9612e69493905e8ff703b8030a9530b2023c2092868f`.
- 2026 manual: <https://stat.fi/media/uploads/tup/paavo/paavo2026_kuvaus_en.pdf>.
- Manual SHA-256: `be9485a311e65e54815cd173669d81b44393fa5c251cdb072742de7fb3cf77dc`.
- Terms: <https://stat.fi/en/about-us/get-to-know-statistics-finland/legislation/terms-of-use>.
- Attribution: `Source: Statistics Finland, Paavo (Open data by postal code area), 2026`.
- Licence: Creative Commons Attribution 4.0 International (CC BY 4.0).

Paavo areas are annual official-derived statistical areas generalized from
building-address postcodes. An address postcode does not itself form an area,
and a building's statistical area can differ from its address postcode. The
runtime therefore labels these polygons `derived`; it never describes them as
Posti delivery perimeters or canonical postal polygons.

## Deterministic partition and exceptions

- Posti PCF rows: 3,784 total; 3,747 FI rows published.
- Åland rows: 37 rows (`FI200` and `22xxx`) excluded and left to the AX pack.
- FI current normal assignments: 2,985.
- Current normal assignments joined to Paavo 2026: 2,976.
- Current normal assignments without Paavo 2026 geometry: `23840`, `23880`,
  `38370`, `40350`, `42720`, `60110`, `60250`, `99970`, `99999`.
- Other explicit non-area assignments: 762 (585 PO Box, 146 corporate, 1
  compilation, 14 reply-mail, 1 SmartPOST/parcel-machine, 15 pickup-point).
- No missing or special assignment receives a buffer, Voronoi cell,
  municipality polygon, nearest Paavo area, address point or building shape.

## Reproduction

With the exact two source payloads above, run:

```powershell
node scripts/build-postal-context-fi-m2.mjs <PCF_20260829.dat> <pno_2026.geojson> data/postal_country_packs/fi/postal-context/m2 <report.json>
```

The builder fails closed on source digests, PCF width/schema/release, duplicate
codes, unsupported geometry, open or oversized rings, non-finite/out-of-range
positions, invalid Turf topology and runtime position budgets. The committed
descriptor pins the graph and geometry hashes and counts.
