# Philippines Postal Context runtime

The existing AGID Philippines runtime supports the four-digit PHLPost locator namespace. A separate seven-character ZIP Code PH announcement is not silently mapped into it; see the [M2 source review](postal-context-philippines-m2.md). PHLPost publishes a locator table with Region, Province, City/Municipality and ZIP Code fields. The UPU addressing sheet places the code before the locality or province and describes digit-level routing roles. AGID stores the code as a four-character string and never turns locator labels or digit groups into geometry.

This is an M1 metadata and synthetic-runtime release. It contains no PHLPost rows, real addresses, recipients, tracking data, PSGC data rows, Geoportal or NAMRIA layers, PSA census or CBMS microdata, LRA records, production polygons, buildings, owners, title holders, occupants or other personal data.

## Evidence and geometry

1. A PHLPost locator row is routing assignment evidence, not a ZIP polygon, barangay coverage, delivery point, address or building.
2. The UPU sheet establishes four-digit position, digit routing semantics and house, street, barangay, municipality and province address order. It is not a current allocation database or geometry release.
3. The versioned PSA PSGC provides region, province, highly urbanized city, city, municipality and barangay administration. Administrative codes and boundaries do not become postal geography by name or overlap.
4. Geoportal Philippines distinguishes open, conditional, restricted and unspecified layers. Exact provider terms remain binding, and download requires requestor and purpose information plus acceptance of terms and privacy provisions.
5. NAMRIA topographic products can contain roads, structures and administrative context at source-declared scale and coverage. Topographic geometry is not a civic-address or PHLPost relation.
6. PSA POPCEN-CBMS geotagging covers service facilities, government projects and building constructions for statistics and planning. Confidential respondent, household, building-serial and permit information is never public AGID output.
7. LRA title and registered-document services are controlled property-rights evidence. Titles and parcels are not postal surfaces, building footprints, civic-address relations or public owner files.
8. Exact building display requires rights-cleared civic-address evidence, separately permitted building geometry and a source-defined stable relation or reviewed explicit crosswalk.

## Resolution flow

`coordinate -> official postal surface or permitted civic-address point -> typed PHLPost ZIP assignment -> barangay/city-or-municipality/province-or-HUC/region -> explicit address-building relation -> PH AGID cell`

AGID remains an independent spatial index. It never relabels a locator row, digit prefix, PSGC unit, census feature, parcel, nearest building, Voronoi cell or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_PH_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_PH_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_PH_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_PH_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=PH` or `/api/postal/PH/{postcode}`. Geometry remains opt-in and preserves official, derived and non-spatial evidence classes.
