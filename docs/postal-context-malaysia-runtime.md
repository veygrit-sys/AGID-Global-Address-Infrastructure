# Malaysia postal context runtime

Malaysia is an M1 metadata and synthetic-runtime country pack connected to the shared Postal Context API and AGID spatial index. It stores five-digit postcodes as strings so leading zeroes survive, and models each assignment as area or non-area rather than assuming every postcode is a polygon.

This release contains no Pos Malaysia or MyGDX rows, real addresses, recipients or senders, MyGOS layers, UPI parcels, production polygons, buildings, owners, occupants or other personal data.

## Evidence and geometry

1. A pinned current Pos Malaysia result or provider-approved MyGDX response is dated postcode-locality assignment evidence, not a postcode polygon, delivery entitlement, civic address or building.
2. UPU documents five digits before locality plus P.O. box, locked bag, poste restante and window-ticket delivery. These objects can be points or non-spatial routing objects, not areas.
3. Joining an exact postcode-locality assignment to an exact permitted MyGeo administrative boundary produces an administrative join surface. It is derived and never a postal-authority polygon.
4. MyGOS access is controlled G2G. Fundamental data release follows the provider agency and MyGDI product-specific copyright and licence terms.
5. UPI provides parcel hierarchy context. A parcel identifier or lot geometry does not prove a postcode, legal civic address, building, owner or occupant.
6. MyGeoName may validate place-name spelling but is not legal evidence, geometry or address-building authority.
7. Exact building display requires an explicit rights-cleared civic-address identifier, separately permitted building geometry and a provider-defined stable relation or reviewed explicit crosswalk.
8. Voronoi, interpolated and model-generated surfaces may compress or fill gaps only as versioned derived geometry with uncertainty; they never become official postcode boundaries.

## Resolution flow

`coordinate -> official postal surface or postal-service point -> typed five-digit assignment -> state/federal territory -> division/district/jajahan -> mukim/town/locality -> street/lot/unit -> explicit address-building relation -> MY AGID cell`

AGID remains an independent spatial index. It never relabels a Pos Malaysia row, MyGDX response, administrative layer, UPI parcel, place name, nearest building or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_MY_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_MY_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_MY_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_MY_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=MY` or `/api/postal/MY/{postcode}`. Geometry remains opt-in and preserves official, administrative-join, derived and non-spatial evidence classes.
