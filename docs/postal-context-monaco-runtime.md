# Monaco Postal Context runtime

Status: `M1_metadata` contract seed and synthetic runtime conformance

Country code: `MC`
Planned country repository: `agid-postal-mc`
Canonical postcode form: `980NN`

## Runtime boundary

AGID owns the country router, normalized API contract, source-separated graph,
geometry gates and AGID cell cover. The future country repository owns source
receipts, transformations, validation, rights and immutable releases. This
commit contains no La Poste, DPUM or IMSEE data rows and no production geometry.

## Postal model

The structural normalizer accepts exactly five digits beginning with `980` and
preserves leading zeroes. It does not prove that all one hundred possible
values are currently allocated.

`98000` can be an ordinary routing code. Other `980xx` values may be CEDEX,
organisation, service, BP or special-routing designators. Every release must
therefore store an allocation class such as:

- `ordinary`
- `cedex`
- `organization`
- `service`
- `po_box`
- `special`
- `historical`
- `unknown`

La Poste's official open-data catalogue includes Monaco postcode rows and
explicitly says it does not provide postcode contours. A code-to-routing-label
row is assignment evidence, not official polygon geometry.

## Derived geometry

A Monaco postcode surface may be generated only from rights-reviewed inputs,
for example licensed DPUM address points or another independently validated
assignment set. The release records method, parameters, source digests,
accuracy and valid/known time. The result is always `derived_geometry`, is
omitted by default from API responses and requires `geometry=geojson`.

For a single ordinary code, using the Principality boundary as a rendering
fallback can be useful, but it is still not a La Poste postcode boundary. A
CEDEX, organisation, service or BP designator remains non-areal unless separate
authoritative area evidence exists.

## Address and building ladder

Resolution proceeds through independent evidence:

1. pinned La Poste assignment;
2. licensed DPUM street and address identity;
3. explicit DPUM address-to-building identifier or reviewed crosswalk;
4. rights-reviewed building geometry;
5. dated Government/IMSEE quartier context;
6. AGID spatial cover.

A postcode alone stops at `postal_area` or a non-area routing result. An
address geocode can promote to `premise` only when the source release and
public fields are approved. A building name or footprint is public only when
the selected address branch has an explicit authoritative relationship.

Containment, nearest-distance, OSM matching and urban-plan overlays stay
`candidate_building`. They cannot display an exact building name or silently
merge separate address branches.

## Country and privacy boundaries

Monaco remains a separate `MC` pack even when La Poste distributes Monaco and
French rows together. Neighbouring French communes, buildings and addresses do
not enter MC resolution through proximity or an unqualified source row.

Public responses exclude residents, occupants, households, apartment counts,
owners, title or cadastral parties, recipients, forwarding records, customers,
shipments and non-public unit data. The existence of the internal DPUM SIG is
metadata; access and redistribution require a separate agreement.

## API behavior

The common API exposes Monaco after a verified pack is configured:

```text
POST /api/postal/resolve
GET  /api/postal/MC/{postcode}
GET  /api/postal/intersects?country=MC&bbox=...
```

Example normalization:

```text
98000  -> 98000
98 000 -> 98000
９８０００ -> 98000
98100  -> rejected
MC 98000 -> rejected
```

The synthetic route tests assert that:

- coordinate resolution returns an AGID cell;
- derived geometry is not canonical postal geometry;
- geometry is gated behind explicit opt-in;
- building resolution requires an explicit source link;
- no real address, person or production geometry enters the seed.

## Production promotion

Before `M2_experimental`, pin:

- La Poste resource URL, digest, schema, retrieval time and Open Licence 2.0
  attribution for the exact Monaco rows;
- a dated La Poste Monaco publication or allocation receipt for CEDEX/special
  routing claims;
- DPUM address/building access terms, field allow-lists, identifiers, CRS,
  digest and validity;
- Government plan number, index and effective date when plan context is used;
- IMSEE edition and document digest for district context.

Before `M3_candidate`, require complete allocation classification, independent
assignment reconciliation, zero cross-border false positives, exact
address-building link precision, public-field privacy review and fail-closed
rollback to a verified last-known-good release.
