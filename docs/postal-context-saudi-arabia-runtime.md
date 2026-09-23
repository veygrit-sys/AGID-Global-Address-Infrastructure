# Saudi Arabia Postal Context runtime

Saudi Arabia is an address-point-first case. SPL defines a five-digit Postal Code inside the six-part National Address together with Building Number, Street, District, City and Secondary or Additional Number. SPL also defines a four-letter plus four-number Short Address. These identifiers materially improve address display, but none is silently converted into a postcode polygon, cadastral parcel or building footprint.

This commit is an M1 metadata and synthetic-runtime release. It contains no current SPL records, API responses, real Short Addresses, account data, production postal surfaces, GEOSA buildings, REGA parcels, real addresses or personal data.

## Evidence layers

1. SPL National Address component pages establish official field semantics and the five-digit format, not current assignment or geometry.
2. A pinned, permitted SPL API response can establish public address components, opaque PKAddressID, BuildingNumber, AdditionalNumber, optional UnitNumber and a point for its exact version and time. A point and an undocumented or null PolygonString are not polygons.
3. Any postcode membership surface derived from rights-cleared address members is labeled derived, non-canonical, versioned and uncertainty-bearing. Missing official geometry remains a gap.
4. GEOSA governance keeps National Address, Buildings and Land Parcels as separate foundation themes and requires product-specific SANSRS/metadata. The governance document is not reusable feature data.
5. REGA portal and registration law provide cadastral validation and legal semantics only. A plot is not a postal area, building or owner output.
6. Exact building display requires a separately licensed feature plus a source-defined stable relation or reviewed explicit crosswalk to the exact SPL address. Containment, overlap, text similarity and proximity create candidates only.

## Resolution flow

`coordinate -> pinned SPL National Address point or permitted derived postal membership -> five-digit postcode -> region/city/district -> exact SPL address identity -> explicit licensed building relation -> SA AGID cell`

AGID reports its grid cell as a separate spatial index. It never relabels that cell as canonical postal geometry.

## Identifier and privacy rules

- Postal Code, BuildingNumber, AdditionalNumber, UnitNumber, Short Address and PKAddressID are stored as text. PKAddressID is opaque and is never recreated by concatenating other fields.
- UnitNumber is emitted only when the exact public-purpose artifact and terms authorize it; no unit is inferred.
- Subscriber, account, contact, proof-of-address, authentication, resident, occupant, recipient and query-log data never enter public output.
- REGA owner, rightsholder, title, encumbrance, value, transaction and tax information never enters public address output.

## CRS and territory

Every artifact retains its actual SANSRS realization or other source CRS, epoch, axis order and accuracy metadata. AGID does not guess an EPSG code or WGS84 equivalence. EPSG:4326 output requires a reviewed, versioned transform.

The repository uses ISO `SA` and only source-stated Kingdom of Saudi Arabia coverage. Postal, map, administrative and cadastral coverage is not a sovereignty determination; missing border, desert or offshore coverage is not model-filled as official.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_SA_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_SA_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_SA_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_SA_LKG_DESCRIPTOR_DIGEST
```

The standard Postal Context endpoints then accept `countryCode=SA` or `/api/postal/SA/{postcode}`. Geometry remains opt-in and carries its evidence and quality status.
