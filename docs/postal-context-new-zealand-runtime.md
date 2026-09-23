# New Zealand Postal Context runtime

Status: `M1 metadata and synthetic runtime conformance`

AGID can load New Zealand independently alongside the existing country packs.
The shared API and resolver support four-digit normalization, delivery-network
areas, non-areal postal services, source-linked address/building evidence, and
AGID candidate cell covers without copying licensed national datasets into this
repository.

## 1. Canonical postcode

```text
input -> NFKC -> remove whitespace -> exactly four digits
```

Leading zeroes are retained. Hyphens and non-digits are rejected. NZ Post says
the first digit represents a processing line, the middle digits reflect sort
areas and delivery network, and the final digit identifies an urban area, box
lobby, or rural delivery round.

The runtime uses `delivery-network-first` semantics:

```text
postcode
  -> NZ Post delivery type
  -> PNF Polygon / MultiPolygon / lobby point / non-area
  -> LINZ public address point
  -> source-backed premise or building assertion
  -> AGID cell cover
```

## 2. Source and rights boundaries

### NZ Post PNF

The Postcode Network File is the authoritative definition of the NZ Post
postcode network. It is updated six-monthly and covers urban delivery, Rural
Delivery, PO Box, and Private Bag postcodes. It is licensed and paid; no PNF row
or geometry is bundled here. A production importer must record whether base or
commercial rights permit each artifact.

### NZ Post PAF and Address Checker

PAF and the credentialed Address Checker support postal address validation but
have product, retention, caching, branding, and redistribution rules. Box, Bag,
CMB, Counter Delivery, RD Number, and Mailtown fields have explicit restricted
status in the API terms. Runtime receipts are validation evidence only unless a
separate approved artifact contract permits storage.

### LINZ NZ Addresses

LINZ holds official address and road data. The public NZ Addresses layer is
used for address identifiers, house numbers, road names, suburb/locality,
position method, lifecycle, and point geometry under CC BY 4.0. It does not
become NZ Post assignment evidence.

### LINZ Building Outlines

The open layer represents roof outlines derived from aerial imagery. It can
provide candidate building geometry but does not itself contain a definitive
address-to-building link or legal parcel boundary. Proximity and containment
remain derived.

### Stats NZ

SSGA meshblocks, statistical areas, territorial authorities, and regional
councils add versioned context. They are not postcode boundaries.

Official references:

- [NZ Post postcodes](https://www.nzpost.co.nz/personal/sending-in-nz/postcodes)
- [NZ Post addressing standards](https://www.nzpost.co.nz/business/shipping-in-nz/addressing-standards)
- [NZ Post Postcode Network File](https://www.nzpost.co.nz/business/sending-within-nz/quality-addressing/postcode-network-file)
- [NZ Post Address Checker terms](https://www.nzpost.co.nz/business/terms-and-conditions/addressing-api)
- [LINZ road, address and places data](https://www.linz.govt.nz/products-services/data/types-linz-data/road-address-and-places-data)
- [LINZ NZ Addresses](https://data.linz.govt.nz/layer/123113-nz-addresses/)
- [LINZ NZ Building Outlines](https://data.linz.govt.nz/layer/101290-nz-building-outlines/)
- [LINZ attribution](https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-linz-data)
- [Stats NZ geographic hierarchy](https://www.stats.govt.nz/methods/geographic-hierarchy/)

## 3. Geometry policy

For an official PNF release `r`, postcode `c` may have geometry

```text
G(c, r) in {Polygon, MultiPolygon, Point, none}
```

according to its delivery type. When licensed PNF geometry is unavailable, a
candidate surface can be estimated from source-backed address points `A_c` and
a rights-cleared clip boundary `B`:

```text
D_c = B intersect union({Voronoi(a) | a in A_c})
```

`D_c` remains derived. It must record input digests, method, parameters,
holdout performance, topology, gaps, overlaps, and date. It cannot be called an
NZ Post boundary.

## 4. Rural and non-areal delivery

An RD address preserves street number and road separately from `RD n`.
Mailtown is the base of the delivery round and may not be the property's
physical locality. PO Box and Private Bag records return their own routing and
optional lobby context; they never inherit a nearby street building.

## 5. Runtime configuration

```text
AGID_POSTAL_CONTEXT_NZ_DESCRIPTOR_PATH=C:\absolute\path\nz-descriptor.json
AGID_POSTAL_CONTEXT_NZ_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_NZ_LKG_DESCRIPTOR_PATH=C:\absolute\path\nz-lkg-descriptor.json
AGID_POSTAL_CONTEXT_NZ_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

The shared endpoints are:

```text
POST /api/postal/resolve
GET  /api/postal/NZ/:postcode
GET  /api/postal/intersects?country=NZ&bbox=...
```

Geometry remains opt-in with `geometry=geojson`. AGID cells are indexes, not
substitutes for exact point-in-polygon or source-linked address resolution.

## 6. Current completion boundary

This implementation completes the country contract, source/rights profile,
normalizer, multi-country store support, API routing, AGID integration, and
synthetic conformance tests. It does not claim nationwide production coverage.
M2 requires a licensed PNF/PAF environment or a consciously open-only pack,
pinned LINZ and Stats NZ snapshots, reproducible joins, derived-geometry
evaluation, rural/box/bag exception handling, and correction/rollback flows.
