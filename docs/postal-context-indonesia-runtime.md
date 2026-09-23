# Indonesia Postal Context runtime

Indonesia currently presents a five-digit `kode pos`, but the legal contract is broader. Law 38/2009 defines a postcode as numbers, letters or their combination used after the city name to support sorting and delivery and to identify an address or area. Government Regulation 15/2013 makes the system administrative-area based. Ministerial Regulation 8/2025 permits numeric, alphabetic or combined codes and assigns the Minister responsibility for a scheme down to the smallest area.

AGID therefore versions the current five-digit runtime separately from future ministerial schemes. A Pos Indonesia lookup can establish a current code-to-locality record at capture time; it does not establish a bulk directory, polygon, complete history or redistribution right.

This is an M1 metadata and synthetic-runtime release. It contains no current Pos Indonesia rows, real addresses, production polygons, BIG or RBI features, buildings, recipients, tracking records or personal data.

## Evidence and geometry

1. The official Pos Indonesia search validates province, city or regency, district, village or urban village and postcode results at capture time. Search access does not imply a documented bulk API or redistribution right.
2. The UPU sheet presents five digits after the locality and describes province, city or regency, district, village or urban village and RT/RW address context. It is not a current assignment database or geometry source.
3. A provincial Satu Data dataset crosswalks postcode with BPS and Kemendagri identifiers but is marked as still fulfilling Satu Data principles. It cannot be promoted to a national operator directory without exact provenance, coverage, licence, edition and digest.
4. Kemendagri administrative codes, BPS statistical codes and BIG geometry use independent identifiers and editions. Name matching is not an identity relation.
5. BIG village-boundary metadata warns that non-definitive boundaries are not an official reference and records equal-distance gap handling in an edition. These surfaces are administrative context, never canonical postal geometry.
6. BIG RBI building and public-facility layers are regional, scale- and edition-specific. An exact layer and permission must be pinned, and proximity does not establish an address-building relation.
7. A permitted generated postcode surface records inputs, method, uncertainty, islands and exclusions, topology, validity, source CRS and digest and remains non-canonical.
8. Exact building display requires separately permitted geometry plus a source-defined stable relation, common identifier or reviewed explicit crosswalk to the exact civic address.

## Resolution flow

`coordinate -> official postal surface or permitted civic-address point -> current five-digit assignment -> village-or-urban-village/district/city-or-regency/province -> RT/RW and street/premise evidence -> explicit address-building relation -> ID AGID cell`

AGID remains an independent spatial index. It never relabels an AGID cell, RT/RW, village boundary, RBI feature, nearest building, Voronoi cell or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_ID_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_ID_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_ID_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_ID_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=ID` or `/api/postal/ID/{postcode}`. Geometry remains opt-in and preserves official versus derived evidence.
