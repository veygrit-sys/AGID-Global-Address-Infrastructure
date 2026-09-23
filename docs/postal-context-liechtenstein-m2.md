# Liechtenstein Postal Context M2 verification

## Result

Liechtenstein meets its country-specific M2 definition for the current
swisstopo domicile-postcode area release. The fixed 2026-08-11 source produces
13 official Polygon features for 9485-9488 and 9490-9498, reaches the real AGID
postcode API and the application map path, and publishes no address, building,
recipient, customer or land-right rows.

## Scope and decision

The source is the swisstopo official directory of towns and cities, which is
mandated to publish locality and postcode perimeters and explicitly covers the
Principality of Liechtenstein. The publication includes only domicile-address
postcode types represented by the directory. Company, professional, internal,
administrative, PO-box, facility and other special codes remain non-areal.

| Gate | Evidence | Decision |
| --- | --- | --- |
| Current official source | STAC item and assets dated 2026-08-11 | Pass |
| Reuse rights | swisstopo OGD terms allow use, distribution, processing and commercial use with attribution | Pass |
| Country partition | All selected `ZIP_ID` rows use BFS 7001-7011 and no Swiss canton | Pass |
| Geometry | 13 `REAL`, not-in-modification PLZ6 suffix-00 polygons | Pass |
| Privacy and authority separation | No address/building/person rows; Postal Code -> Polygon only | Pass |
| Application path | API lookup -> GeoJSON conversion -> bounds/fit -> translucent fill/outline -> clear/re-search | Pass |

## Source lineage and fixed artifacts

The Shapefile ZIP SHA-256 is
`a58e105be27c1b4f4797ccbb5765861711ada593163059969c49a33489e0a60a`;
the WGS84 CSV ZIP SHA-256 is
`0542e70aaf2890a5e48d8bb22e2aec233a413bc26a8420d506551ac3a1af1e26`.
Both match the STAC multihashes. The product page, STAC documents, January
2026 technical PDF and OGD terms were retained as retrieval evidence and their
digests are recorded in `M2-SOURCE-NOTICE.md`.

The raw downloads are excluded from Git. The published fixed artifacts are:

- descriptor: `sha256:3860959238e86ad87a9377b0640f08d1c98cb788fd66ef08f41e5a5c858ec06b`;
- graph: `sha256:e5763ad9fc37d6811bb2ba5b71696f4d0df548b152527f2a3b9b9c264db507f3`;
- geometry: `sha256:6fe679982604ba84da1e8416fda56b78fa5561f21d6c5bc88b24afa3837aae15`.

## Transformation and data-quality audit

The source CSV has 5,716 rows. Twenty rows use official municipality BFS codes
7001-7011 and resolve to 13 distinct PLZ4/`ZIP_ID` pairs. The builder rejects a
selected `ZIP_ID` if any joined row has a Swiss canton or a municipality code
outside 7001-7011. It then selects the corresponding PLZ polygon, requires
`STATUS=REAL`, `INMODIFICA=FALSE` and suffix `00`, transforms EPSG:2056 to
EPSG:4326, rounds to eight decimals and normalizes RFC 7946 ring winding.

All 13 features passed closed-ring, coordinate-envelope, positive-area, Turf
and JSTS validity checks. All 20 official CSV centroids fall inside their
published postcode polygon. The final artifact has 10,598 positions and no
topology repairs or invented areas.

## API and application verification

`9490` and its spaced form `94 90` normalize to the same four-digit code. The
real descriptor loads with no warnings; the API returns one official Polygon,
source date 2026-08-11, confidence 1 and the required swisstopo lineage. The
application conversion creates a renderable feature collection, computes LI
bounds for map fit and installs a fill at opacity 0.22 plus a three-pixel
outline at opacity 0.95. Clear removes both layers and the source; re-search
restores them. `9400` returns no match and `94A0` is rejected without geometry.

## Reproduction and residual limits

After expanding the two pinned ZIPs, run:

```text
node scripts/build-postal-context-li-m2.mjs <AMTOVZ_ZIP.shp> <AMTOVZ_ZIP.dbf> <AMTOVZ_CSV_WGS84.csv> <output-directory> <report.json>
```

This M2 claim is limited to the current official domicile postcode areas. It
does not claim deliverability, recipient identity, an address-to-building
link, a legal cadastral boundary, or an area for every Swiss Post routing code.
Future monthly source editions require a new fixed digest and replay of the
same country-partition, topology, API and rendering gates.
