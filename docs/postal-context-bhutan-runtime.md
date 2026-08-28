# Bhutan Postal Context runtime

Bhutan uses five-digit postcodes. Bhutan Post exposes a locator with Dzongkhag, Gewog, Post Office and Postal Code fields. The UPU addressing sheet places the code to the right of the locality and describes routing roles for Dzongdey, Dzongkhag, Dungkhag and delivery area. AGID stores the code as a five-character string and never turns an office row, digit prefix or administrative label into geometry.

This is an M1 metadata and synthetic-runtime release. It contains no Bhutan Post rows, real addresses, recipients, P.O. box holders, tracking or query data, NLCS map or cadastral records, NSB census microdata, eSakor transactions, production polygons, buildings, Thrams, owners, occupants or other personal data.

## Evidence and geometry

1. A Bhutan Post locator row is routing-assignment evidence, not a postcode polygon, post-office catchment, delivery point, civic address or building.
2. The UPU sheet establishes five-digit position, routing semantics and urban, rural, P.O. box and organization formats. It is not a current allocation database or geometry release.
3. NLCS Geo-Portal metadata routes candidate layers to their providers. Portal visibility does not establish postal authority, full coverage or common reuse rights.
4. NLCS topographic and administrative products can require application, approval, payment and use agreements. Cadastral maps are not public, and parcels or Thrams are not postal or civic-address relations.
5. NSB house listing, structure mapping and enumeration areas serve statistical enumeration and coverage validation. Confidential census records and statistical features never become public addresses or buildings.
6. eSakor land, flat and building transactions use controlled NDI-linked identity, permanent-address, party, witness, Thram, plot and consent information. These records remain private validation evidence.
7. Exact building display requires rights-cleared civic-address evidence, separately permitted building geometry and a source-defined stable relation or reviewed explicit crosswalk.
8. Mathematical, Voronoi, interpolated and model-generated surfaces may compress or fill gaps only as versioned derived geometry with uncertainty; they never become official Bhutan Post boundaries.

## Resolution flow

`coordinate -> official postal surface or permitted civic-address point -> typed Bhutan Post assignment -> Dzongdey/Dzongkhag/Dungkhag/Gewog-or-Thromde -> explicit address-building relation -> BT AGID cell`

AGID remains an independent spatial index. It never relabels a locator row, office point, routing prefix, administrative unit, enumeration area, parcel, nearest building or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_BT_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_BT_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_BT_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_BT_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=BT` or `/api/postal/BT/{postcode}`. Geometry remains opt-in and preserves official, derived and non-spatial evidence classes.

## 2026-08-28 M2 source review

BT remains M1 / blocked. The live public locator yielded 76 rows but only
38 distinct code/office tuples, with duplicate rows and malformed row tags.
See the [source review](postal-context-bhutan-m2.md) for exact hashes, coverage and rights gates.
No real-data runtime descriptor or production geometry was enabled.
