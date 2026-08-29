# Vietnam Postal Context runtime

Vietnam uses five-digit national postcodes. Decision 2334/QD-BKHCN and Vietnam Post's 2025 notice align ward, commune and equivalent-unit assignments to the new two-tier administration. The 2021 UPU sheet remains useful for address-line, rural, building-complex and postal-service semantics, but its district model is historical context after the reform. AGID stores every code as a five-character string so leading zeroes survive.

The M2 target is `M2_current_five_digit_postal_area_visualization`. The 2026-08-29 review found no exact current annex, reusable postal-area Polygon/MultiPolygon release or official search-to-area map path. The portal's linked directory advertises a 2018 Last-Modified date and its legal page lists the 2017 decision. Vietnam therefore remains M1 metadata and M2-blocked.

This is an M1 metadata and synthetic-runtime release. It contains no national-portal or Decision annex rows, real addresses, recipients, senders, Vpostcode queries or accounts, NSO exports, NSDI layers, surveying or mapping products, cadastral records, production polygons, buildings, households, owners, occupants or other personal data.

## Evidence and geometry

1. A pinned current national-portal or Decision 2334 row is dated assignment evidence, not a postcode polygon, delivery entitlement, civic address or building.
2. Postcodes may represent wards, communes, equivalent units, postal-service points or special-delivery objects; geometry can therefore be area or non-area.
3. Joining an exact current postcode assignment to an exact official administrative boundary produces an administrative join surface. It is source-composed and never a postal-authority polygon.
4. NSO new-to-old conversion and unit history preserve legacy district and former-unit labels with validity intervals. They do not create geometry or postal assignments.
5. A permitted Vpostcode result may supply a digital location code or candidate point. It does not automatically prove a legal address, recipient, building footprint or occupant.
6. NSDI and request-delivered surveying or mapping products require exact access, product, edition, scale, CRS and reuse rights. Portal access, registration, request or payment is not blanket redistribution permission.
7. Exact building display requires an explicit rights-cleared civic or digital-address identifier, separately permitted building geometry and a provider-defined stable relation or reviewed explicit crosswalk.
8. Mathematical, Voronoi, interpolated and model-generated surfaces may compress or fill gaps only as versioned derived geometry with uncertainty; they never become official national-postcode boundaries.

## Resolution flow

`coordinate -> official postal surface or permitted digital-address point -> typed current five-digit assignment -> province/city -> ward/commune -> legacy administrative context -> street/alley/house/unit -> explicit address-building relation -> VN AGID cell`

AGID remains an independent spatial index. It never relabels a postcode row, ward, commune, former district, Vpostcode point, parcel, nearest building or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_VN_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_VN_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_VN_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_VN_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=VN` or `/api/postal/VN/{postcode}`. Geometry remains opt-in and preserves official, administrative-join, derived and non-spatial evidence classes.
