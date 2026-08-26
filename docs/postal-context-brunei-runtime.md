# Brunei Postal Context runtime

Brunei uses six-character postcodes: two letters followed by four digits, without an internal space in canonical form. The Postal Services second-edition booklet publishes Mukim, Kampong and postcode rows. The UPU sheet describes district, Mukim, village and delivery-point routing roles and physical, major-customer and P.O. box formats. AGID stores the code as uppercase text and never turns a row, prefix or administrative label into geometry.

This is an M1 metadata and synthetic-runtime release. It contains no Postal Services rows, real addresses, recipients, P.O. box holders, tracking or query records, Survey map layers, Geoportal exports, House Numbering applications, Land Department records, DEPS census microdata, production polygons, buildings, titles, owners, occupants or other personal data.

## Evidence and geometry

1. A pinned Postal Services booklet row is dated routing-assignment evidence, not a postcode polygon, delivery point coordinate, civic address or building.
2. The UPU sheet establishes syntax, routing semantics and address order. It is not a current allocation database or geometry release.
3. Survey Department House Numbering applications require a site plan, land title or TOL, applicant identity and payment. Only an exact authorized result may provide civic-address evidence.
4. Survey digital map products can contain roads, settlements, administrative boundaries, cadastral lots and public or private buildings at source-declared scales and coverage. Paid access is not a postal or address-building relation.
5. The Geoportal separates public and registered access and requires acceptance of restriction-of-use terms. Lot search, viewing, registration, purchase and imagery or certified-plan access do not create reuse rights.
6. DEPS BPP 2021 district, Mukim and village population, household and housing aggregates support statistical validation only. They are not addresses or building identities.
7. Land Department title registers, owners, leases, mortgages, strata interests and certified plans are controlled property-rights evidence, not public postal or address data.
8. Exact building display requires an authorized civic-address identifier, separately permitted building geometry and a source-defined stable relation or reviewed explicit crosswalk.
9. Mathematical, Voronoi, interpolated and model-generated surfaces may compress or fill gaps only as versioned derived geometry with uncertainty; they never become official Postal Services boundaries.

## Resolution flow

`coordinate -> official postal surface or authorized house-number point -> typed Postal Services assignment -> district/Mukim/Kampong -> Simpang/Jalan/house-or-unit -> explicit address-building relation -> BN AGID cell`

AGID remains an independent spatial index. It never relabels a booklet row, routing prefix, district, Mukim, Kampong, lot, census unit, nearest building or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_BN_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_BN_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_BN_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_BN_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=BN` or `/api/postal/BN/{postcode}`. Geometry remains opt-in and preserves official, derived and non-spatial evidence classes.
