# Belgium Postal Context runtime

Status: `M1_metadata`. This change defines contracts, source lineage, runtime wiring and synthetic conformance fixtures. It does not bundle bpost, BeSt, regional register, cadastral or production geometry rows.

## Evidence ladder

Belgium uses `postal-area-first` because bpost/NGI publishes an official Postal Cantons vector through geo.be. A four-digit bpost lookup or list row establishes assignment evidence; only the exact pinned postal-canton vector feature establishes canonical postal geometry. Leading zeroes are retained and `B-` or `BE-` prefixes are rejected.

The public resolution ladder is:

```text
coordinate
  -> exact bpost postal-canton feature (or honest non-area)
  -> dated FPS Finance administrative context
  -> BOSA BeSt Address identity plus original regional source ID
  -> explicit Flanders / Wallonia / Brussels address-to-building relation
  -> exact rights-cleared building feature
  -> BE AGID cell
```

Postal-canton containment is postal context, not exact deliverability. Special and organization codes receive geometry only when the pinned postal-canton release contains that exact code and feature. WMS pixels, municipalities, centroids, buffers, Voronoi cells and interpolation are never promoted to canonical postal geometry.

## Address and building gates

BOSA BeSt Address is the countrywide crosswalk and retains its Brussels, Flanders or Wallonia source identifier, object type, validity and licence lineage. An address point or an ICAR building centroid is not a footprint.

- Flanders: the Address Register must explicitly relate the addressable object to a stable Building Register identifier; GRB is retained as separate geometry lineage. Building units, parcels, berths and stands remain distinct object types.
- Wallonia: exact output requires an explicit ICAR-to-public-PICC relation or common identifier. ICAR coordinates are available only for exact PICC matches and are labelled as centroids.
- Brussels: exact output requires an explicit UrbIS relation or common stable identifier such as a pinned `inspire_Id`. Third-party cadastral terms remain separate from the UrbIS licence.
- Federal cadastre: public cadastral-plan building geometry is supporting evidence only. Parcels do not become buildings and the plan does not establish legal property boundaries.

Owner, rightsholder, title, transaction, tax, cadastral-income, valuation, person, resident, recipient and household fields are excluded from public packs.

## Source and release requirements

Every artifact pins product and edition, provider, licence, attribution, allowed fields and derivatives, coverage, capture and effective time, schema, original CRS, reviewed WGS84 transform and digest. bpost/NGI, BOSA CC BY 4.0, Vlaanderen open-data, SPW CC BY 4.0, UrbIS and FPS Finance terms remain separately attributable.

The runtime uses the standard country-scoped environment variables:

```text
AGID_POSTAL_CONTEXT_BE_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_BE_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_BE_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_BE_LKG_DESCRIPTOR_DIGEST
```

Public API behavior remains shared with the existing Postal Context routes. `geometry=geojson` is required to return postal-canton geometry, production releases remain immutable and digest-pinned, and synthetic fixtures never qualify as production evidence.
