# Maldives postal context runtime

Maldives is an M1 metadata and synthetic-runtime country pack connected to the shared Postal Context API and AGID spatial index. It stores five-digit postcodes as strings so leading zeroes survive and accepts ASCII, full-width, Arabic-Indic and Eastern Arabic-Indic digits while rejecting prefixes and punctuation.

This release contains no Maldives Post rows, real addresses, recipients or senders, OneMap layers, Census microdata, land-registry surveys, parcels, production polygons, buildings, owners, occupants or other personal data.

## Evidence and geometry

1. A pinned current Maldives Post result is dated five-digit island, locality, atoll or postal-region assignment evidence, not a postcode polygon, delivery entitlement, civic address or building.
2. UPU's September 2004 sheet documents five digits to the right of locality and Malé-region and atoll prefix structures. It is dated syntax, not current allocations or geometry.
3. OneMap is the authoritative national map. The linked island FeatureServer can support an exact rights-cleared island geometry, but public access does not by itself grant redistribution or a postal-code relation.
4. Joining an exact postcode assignment to an exact permitted island boundary produces an island administrative join surface. It is derived and never a postal-authority polygon.
5. LD Codes and FCodes identify islands, reefs, plots or features under survey workflows. They are never postcodes, civic addresses or buildings.
6. Maldives Bureau of Statistics maps and Census 2022 island or atoll aggregates are validation context only. They are not legal, engineering, navigational, precision, household-address or building evidence.
7. Exact building display requires an explicit rights-cleared civic-address identifier, separately permitted building geometry and a provider-defined stable relation or reviewed explicit crosswalk.
8. Voronoi, interpolated and model-generated surfaces may compress or fill gaps only as versioned derived geometry with uncertainty; they never become official postcode boundaries.

## Resolution flow

coordinate -> official postal surface or postal-service point -> typed five-digit assignment -> administrative atoll -> island or city -> ward or locality -> street, house, floor, apartment or unit -> explicit address-building relation -> MV AGID cell

AGID remains an independent spatial index. It never relabels a Maldives Post row, UPU prefix, OneMap island, LD Code, FCode, Census row, nearest building or model output as canonical postal geometry.

## Runtime configuration

~~~text
AGID_POSTAL_CONTEXT_MV_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_MV_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_MV_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_MV_LKG_DESCRIPTOR_DIGEST
~~~

The standard endpoints accept countryCode=MV or /api/postal/MV/{postcode}. Geometry remains opt-in and preserves official, island-administrative-join, derived and non-spatial evidence classes.
