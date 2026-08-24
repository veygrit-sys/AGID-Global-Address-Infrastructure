# Iceland Postal Context runtime

Status: `M1 metadata and synthetic runtime conformance`

AGID can load Iceland independently alongside the existing country packs. The
shared API and resolver support three-digit normalization, Byggðastofnun
postcode polygons, typed HMS address points, source-linked building evidence, Póstbox
exceptions, and AGID candidate cell covers without copying national source
datasets into this repository.

## 1. Canonical postcode

```text
input -> NFKC -> remove whitespace -> exactly three digits
```

Hyphens and non-digits are rejected. The runtime stores a postcode as a string
and uses `postal-area-first` semantics:

```text
postcode
  -> Pósturinn routing/service classification
  -> pinned Byggðastofnun register Polygon / MultiPolygon
  -> HMS address point with coordinate semantics
  -> source-backed premise or building assertion
  -> AGID cell cover
```

## 2. Source and rights boundaries

### Pósturinn

Pósturinn publishes postcode regional groupings and rural distribution tables.
These establish operator routing and service context. Public web pages are
review receipts, not a bulk address or polygon dataset. Customer, recipient,
shipment, forwarding and selected-delivery data are outside this pack.

### Byggðastofnun postcode register and geometry

Byggðastofnun determines Iceland's postcode boundaries and publishes the
postcode register and geographic coverage under Article 15 of the Postal
Services Act. Its page links a metadata-catalogue download service. The exact
register edition, effective decisions, schema, terms, attribution, CRS and
digest must be pinned. Náttúrufræðistofnun records that the former IS 50V
postcode layer moved to Byggðastofnun in 2022; old IS 50V rows are historical,
not the current source of authority.

### HMS Staðfangaskrá

HMS publishes Staðfangaskrá as a weekly CSV and WFS-oriented dataset. It holds
descriptive and geometric address information. `POSTNR` is the postcode area
for the address according to the latest information from Byggðastofnun.
`HEINUM`, `HNITNUM`, optional `MATSNR`, house-number fields, coordinate type,
review state, and estimated accuracy must survive ingestion.

Coordinate type is material evidence: a point can be an estimated building
centre, main entrance, driveway, a point known to be within the parcel, or an
estimated building site. A point therefore does not automatically equal a
door, building footprint, or legal parcel boundary.

### IS 50V buildings

IS 50V buildings provide topographic points, lines or polygons at national-map
scale. They add candidate building geometry. Proximity or containment does not
create a definitive HMS address-to-building relationship.

### Statistics Iceland

Statistics Iceland municipalities, urban nuclei and postcode tables add
versioned statistical context under CC BY 4.0. Statistical geography is not a
postal boundary and does not assign an address or building.

Official references:

- [Pósturinn postcode regions](https://posturinn.is/einstaklingar/ymsar-upplysingar/verdskra/svaedaskipting-postnumera/)
- [Byggðastofnun postcode register and coverage](https://www.byggdastofnun.is/is/postthjonusta/postnumer)
- [IS 50V notice of postcode-layer transfer](https://www.natt.is/is/frettir/2022/12/ornefnum-hefur-fjolgad-um-13-thusund-einu-ari-i-50v)
- [Pósturinn rural distribution](https://posturinn.is/en/individuals/information/distribution-in-rural-areas/)
- [Pósturinn Póstbox behavior](https://posturinn.is/en/individuals/faq/postbox-pakkaport-home-delivery/)
- [HMS Staðfangaskrá](https://hms.is/gogn-og-maelabord/grunngogntilnidurhals/stadfangaskra)
- [Náttúrufræðistofnun IS 50V base map data](https://www.natt.is/en/resources/geospatial-data/base-map-data)
- [Náttúrufræðistofnun spatial-data infrastructure](https://www.natt.is/en/resources/spatial-data-infrastructure)
- [Statistics Iceland open-data terms](https://www.statice.is/publications/open-data-access/)

## 3. Geometry policy

For pinned Byggðastofnun register edition `r`, postcode `c` has original
geometry

```text
G(c, r) in {Polygon, MultiPolygon}
```

If original geometry is unavailable, an experimental surface may be generated
from HMS address points `A_c` and a rights-cleared clip boundary `B`:

```text
D_c = B intersect union({Voronoi(a) | a in A_c})
```

`D_c` remains derived. It records input digests, projection, method,
parameters, holdout performance, topology, gaps, overlaps and date. It cannot
be called an official Byggðastofnun or Pósturinn boundary.

## 4. Rural, island and Póstbox behavior

Rural and island postcodes may contain disconnected areas. A postcode polygon
does not identify a particular farm, road, entrance or delivery day. Rural
distribution origin and schedule are operational metadata with their own
validity time.

A Póstbox can be selected independently of the shipment address. AGID may show
the facility as a point and delivery preference, but must not overwrite the
premise postcode, infer residence at the locker, or generate a surrounding
postcode polygon from the facility.

## 5. Runtime configuration

```text
AGID_POSTAL_CONTEXT_IS_DESCRIPTOR_PATH=C:\absolute\path\is-descriptor.json
AGID_POSTAL_CONTEXT_IS_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_IS_LKG_DESCRIPTOR_PATH=C:\absolute\path\is-lkg-descriptor.json
AGID_POSTAL_CONTEXT_IS_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

The shared endpoints are:

```text
POST /api/postal/resolve
GET  /api/postal/IS/:postcode
GET  /api/postal/intersects?country=IS&bbox=...
```

Geometry remains opt-in with `geometry=geojson`. AGID cells are indexes, not
substitutes for original point-in-polygon or source-linked address resolution.

## 6. Current completion boundary

This implementation completes the country contract, source/rights profile,
normalizer, multi-country store support, API routing, AGID integration, and
synthetic conformance tests. It does not claim nationwide production coverage.
M2 requires pinned source snapshots, layer-specific rights review, reproducible
joins, topology and holdout evaluation, attribution, ambiguity handling,
correction intake, and rollback.
