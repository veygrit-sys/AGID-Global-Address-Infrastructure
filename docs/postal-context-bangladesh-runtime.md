# Bangladesh Postal Context runtime

Bangladesh uses four-digit postcodes. Bangladesh Post publishes district pages containing Upazila, bilingual post-office name, office class and postcode rows. The UPU addressing sheet places the code to the right of the locality and models routing through the regional head office, thana and secondary post office. AGID stores the code as a four-character string and never turns office labels or digit groups into geometry.

This is an M1 metadata and synthetic-runtime release. It contains no Bangladesh Post rows, real addresses, recipients, tracking data, census microdata, SoB or NSDI layers, DLRS maps, production polygons, buildings, owners, occupants or other personal data.

## Evidence and geometry

1. GPO, HO, TSO, UPO, SO, EDSO and EDBO remain typed office classes. A table row is assignment evidence, not a polygon, delivery point or building.
2. Official tables contain subordinate rows with a blank postcode. They stay unassigned and never inherit a neighboring code without an explicit source relation.
3. The UPU sheet establishes four-digit syntax, routing semantics and village, delivery-post-office, thana and district address order. It is not a current allocation database or geometry release.
4. Survey of Bangladesh products can contain Building and Structure and administrative features at declared scales and BUTM2010 CRS. Exact product terms, permission, edition, scale and digest are required; topographic geometry is not a civic-address link.
5. The NSDI FAQ says provider-specific terms may vary even where portal data is free to download and use. Catalog or portal presence is not a common licence or postal authority.
6. BBS enumeration areas exist for complete census coverage and remain census context, not postcode polygons, delivery surfaces, addresses or buildings.
7. DLRS mouza and cadastral maps are controlled land evidence. They are not postal surfaces, building footprints, civic-address relations or public ownership files.
8. Exact building display requires rights-cleared civic-address evidence, separately permitted building geometry and a source-defined stable relation or reviewed explicit crosswalk.

## Resolution flow

`coordinate -> official postal surface or permitted civic-address point -> typed post-office assignment -> village-or-area/upazila-or-thana/district/division -> explicit address-building relation -> BD AGID cell`

AGID remains an independent spatial index. It never relabels an office point, digit prefix, enumeration area, administrative boundary, mouza, nearest building, Voronoi cell or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_BD_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_BD_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_BD_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_BD_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=BD` or `/api/postal/BD/{postcode}`. Geometry remains opt-in and preserves official, derived and non-spatial evidence classes.
