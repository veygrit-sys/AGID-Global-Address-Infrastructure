# Myanmar postal context runtime

Myanmar is an M1 metadata and synthetic-runtime country pack connected to the shared Postal Context API and AGID spatial index. It stores seven-digit postcodes as strings so leading zeroes survive and accepts Myanmar digits, full-width digits and ASCII digits while rejecting prefixes and punctuation.

This release contains no Myanmar Post rows, real addresses, recipients or senders, MIMU layers or PCodes, Survey Department or One Map products, YCDC forms or tax records, production polygons, buildings, owners, occupants or other personal data.

## Evidence and geometry

1. A pinned current Myanmar Post result is dated seven-digit Quarter or Village Tract assignment evidence, not a postcode polygon, delivery entitlement, civic address or building.
2. UPU's November 2022 sheet supersedes the repository's old five-digit metadata. It defines seven digits as state, region or country plus town or township plus Quarter or Village Tract, and documents home, rural, P.O. Box and building formats.
3. MIMU PCodes are administrative place identifiers. They are never Myanmar Post postcodes.
4. Joining an exact postcode assignment to an exact permitted Survey Department, One Map or MIMU administrative boundary produces an administrative join surface. It is derived and never a postal-authority polygon.
5. MIMU geospatial data requires special written permission and is constrained to stated operational purposes; catalog or viewer access is not public commercial redistribution permission.
6. YCDC land, building and property services are local and controlled. Forms or tax evidence are validation-only and never public national address data.
7. Exact building display requires an explicit rights-cleared civic-address identifier, separately permitted building geometry and a provider-defined stable relation or reviewed explicit crosswalk.
8. Voronoi, interpolated and model-generated surfaces may compress or fill gaps only as versioned derived geometry with uncertainty; they never become official postcode boundaries.

## Resolution flow

coordinate -> official postal surface or postal-service point -> typed seven-digit assignment -> state, region or union territory -> district -> town or township -> Quarter or Village Tract -> village, street, house, room or unit -> explicit address-building relation -> MM AGID cell

AGID remains an independent spatial index. It never relabels a Myanmar Post row, MIMU PCode, administrative layer, One Map feature, YCDC record, nearest building or model output as canonical postal geometry.

## Runtime configuration

~~~text
AGID_POSTAL_CONTEXT_MM_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_MM_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_MM_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_MM_LKG_DESCRIPTOR_DIGEST
~~~

The standard endpoints accept countryCode=MM or /api/postal/MM/{postcode}. Geometry remains opt-in and preserves official, administrative-join, derived and non-spatial evidence classes.
