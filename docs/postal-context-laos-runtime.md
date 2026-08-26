# Laos postal context runtime

Laos is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, real addresses, personal data, census microdata, cadastral records or production geometry. All executable examples use the synthetic code `99999` and synthetic geometry.

## Postal Code → Geometry → Address Context

The LA normalizer accepts exactly five digits after NFKC normalization. It converts Lao and Thai digits, preserves leading zeroes and rejects country prefixes, hyphens and wrong lengths.

Articles 9 and 11 of the amended Lao Postal Services Law No. 45/NA (25 December 2013) define the postal network as post offices, mail exchange centres and mail routes, and a postcode as an indicator of location and the scope of postal-item delivery across province or capital, district, municipality and village codes. A five-digit value is therefore modelled as an area-or-non-area delivery-scope object. It is never assumed to be a complete polygon or exact address.

The runtime keeps these layers distinct:

1. exact, dated Lao Postal Service or legally authorised postcode assignment;
2. post office, P.O. Box, mail exchange centre or mail-route point/route/non-area object;
3. exact postal-authority geometry, if a future licensed artifact supplies it;
4. optional derived postal-administrative join surface with uncertainty;
5. province or capital, district, municipality, village and street/route context;
6. explicit rights-cleared civic address and separately linked building geometry;
7. independent AGID cell and versioned crosswalk.

Containment, nearest-office, route or village match, administrative overlap, Voronoi, interpolation and models may rank candidates. They cannot create an official postal assignment, canonical postal polygon, legal civic address, building link or delivery entitlement.

## Source and rights boundaries

- Lao Postal Service is the current public postcode reference. Pin the exact response, validity, schema, retrieval time, rights and digest. Search/list access is not bulk redistribution permission.
- Laopedia is an official explanatory/allocation reference. A visible page is not canonical geometry, complete history, exact civic-address data or a blanket reuse licence.
- The MAF National Forest Monitoring System exposes country, province and district layers through an ArcGIS service. Exact layer, edition, CRS, topology, attribution, terms and digest are mandatory. Blank copyright text is not an open licence, and an administrative boundary has no postal relation until an exact assignment crosswalk proves one.
- Lao Statistics Bureau census GIS can support public aggregate administrative and housing context only. Household, dwelling, individual and building-location microdata remain excluded.
- LaoLandReg and cadastral digitisation documents describe controlled land-register, textual, map and plot-plan information. They do not establish a public civic-address, parcel or building dataset.
- The current Electronic Data Law and exact approvals gate non-general, personal and official electronic data access, transfer and publication.
- OSM is an ODbL fallback validation layer and never supplies Lao Postal Service authority.

## Building display gate

The runtime may display a building only when a rights-cleared civic-address identifier is explicitly and stably related to a building identifier, and the corresponding geometry is separately permitted for that purpose and time. Postal containment, province/district/village overlap, office or route proximity, census geography, parcel overlap, coordinate equality and nearest-building logic are only candidate or validation evidence.

## API and AGID

The shared routes work without country-specific endpoint code:

- `POST /api/postal/resolve` with `countryCode: "LA"`;
- `GET /api/postal/LA/{postcode}`;
- `GET /api/postal/intersects?country=LA&bbox=...`.

Derived geometry is returned only when explicitly requested. Every result keeps assignment authority, geometry authority, derivation status, confidence and validity separate. AGID is an independent spatial index; it links by an explicit versioned crosswalk and never replaces postal, administrative, cadastral, address or building identity.

## Promotion

M2 or later requires exact rights-reviewed source artifacts, immutable digests, current assignment validity, independently licensed geometry, CRS/topology checks, temporal coverage, privacy review and reproducible provenance. Real postcode rows, addresses and production geometry belong in the independent `agid-postal-la` data repository, not this AGID application repository.
