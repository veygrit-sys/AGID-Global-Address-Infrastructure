# Liechtenstein M2 source and reuse notice

Release: `li-swisstopo-plzo-20260811`
Retrieved: `2026-08-30T14:39:53.180Z`
Provider: Federal Office of Topography swisstopo

Required source reference:

> Federal Office of Topography swisstopo

swisstopo's OGD terms permit use, redistribution, access, enrichment,
processing and commercial use, subject to source attribution. Derived data
keeps the same attribution duty. AGID records this as an engineering rights
receipt, not a legal opinion.

## Pinned references

- Product page: <https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities>
  SHA-256 `08464329ded2fe935f7ff18f71b096a6f9631f36a9e7ca5e833337944754006d`
- STAC collection: <https://data.geo.admin.ch/api/stac/v0.9/collections/ch.swisstopo-vd.ortschaftenverzeichnis_plz>
  SHA-256 `92f1abe4566cf888098f4af4fcf4aad7a7f5c46e87846b056f1057b551c6b3bf`
- STAC item listing observed at retrieval: <https://data.geo.admin.ch/api/stac/v0.9/collections/ch.swisstopo-vd.ortschaftenverzeichnis_plz/items>
  SHA-256 `8bc77c5e97a817f67d86bf341313ac80ad9bcde49db1b43728674c2d00597166`
- Technical documentation, January 2026: <https://www.swisstopo.admin.ch/dam/de/sd-web/63GBDVbxjKqw/Jan26_Amtliches%20Ortschaftenverzeichnis%20-%20Technical%20Documentation.pdf>
  SHA-256 `45779d8fbb26006c1692fdf8b1aa1a0bb7a525bced1c5d1fdfe4950ae6c17b50`
- OGD terms: <https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices>
  SHA-256 `329a068db693a6261f2f51fd6eb413021bd7cb529e8e2aad145283c4904c40da`
- EPSG:2056 Shapefile ZIP: <https://data.geo.admin.ch/ch.swisstopo-vd.ortschaftenverzeichnis_plz/ortschaftenverzeichnis_plz/ortschaftenverzeichnis_plz_2056.shp.zip>
  40,687,840 bytes; SHA-256 `a58e105be27c1b4f4797ccbb5765861711ada593163059969c49a33489e0a60a`
- EPSG:4326 CSV ZIP: <https://data.geo.admin.ch/ch.swisstopo-vd.ortschaftenverzeichnis_plz/ortschaftenverzeichnis_plz/ortschaftenverzeichnis_plz_4326.csv.zip>
  193,427 bytes; SHA-256 `0542e70aaf2890a5e48d8bb22e2aec233a413bc26a8420d506551ac3a1af1e26`

The STAC item datetime is 2026-08-11. Its asset multihashes independently
match both ZIP SHA-256 values above. The product is updated monthly and covers
Switzerland and the Principality of Liechtenstein.

## Country partition and exclusions

The WGS84 CSV has 5,716 rows. Exactly 20 rows use official municipality BFS
codes 7001-7011; they resolve to 13 unique `ZIP_ID` and PLZ4 values. Every row
for those `ZIP_ID` values has a blank Swiss canton field and a Liechtenstein
BFS code. The polygon DBF contains one `REAL`, not-in-modification, PLZ6 suffix
`00` feature for each selected `ZIP_ID`.

The publication contains only these domicile codes: 9485-9488 and 9490-9498.
The official directory excludes non-domicile company, professional, internal
and administrative postcode types. PO boxes, facilities, routes and other
special codes receive no invented polygon.

## Reproduction

Expand the two pinned ZIPs, then run:

```text
node scripts/build-postal-context-li-m2.mjs <AMTOVZ_ZIP.shp> <AMTOVZ_ZIP.dbf> <AMTOVZ_CSV_WGS84.csv> <output-directory> <report.json>
```

The builder verifies expanded component digests, transforms EPSG:2056 to
EPSG:4326, normalizes ring winding, checks Turf/JSTS topology and verifies all
LI CSV centroids against the published polygon. Raw downloads, addresses,
buildings, recipients, customers and land-right data are not stored in AGID.
