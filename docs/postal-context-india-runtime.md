# India Postal Context runtime

India is a six-digit PIN and typed post-office network case. India Post defines a PIN as a postcode for a particular area mapped to the post office receiving mail for delivery under its jurisdiction. The first digit identifies a PIN region (including `9` for Army Postal Service), the first two a subregion or circle, the first three a sorting or revenue district, and the last three a delivery post office.

The Department of Posts directory can contain several Head, Sub or Branch Office rows for one PIN and separately records Delivery and Non Delivery status. AGID therefore treats a PIN as a delivery-network assignment before it treats it as a surface.

This is an M1 metadata and synthetic-runtime release. It contains no current Department of Posts rows, real addresses, production polygons, DIGIPIN outputs, Survey of India or LGD features, buildings, recipient records or personal data.

## Evidence and geometry

1. India Post Regulations establish PIN semantics, not a complete current directory, boundary file or building relation.
2. The Department of Posts monthly OGD directory supplies typed PIN and post-office assignments. Exact edition, coverage, schema, GODL declaration and digest must be pinned.
3. The official OGD catalog describes an All India Pincode Boundary GeoJSON. Catalog metadata is not the boundary artifact: the exact resource bytes, edition, coverage, licence, CRS, topology, join key and digest must be pinned before geometry is canonical.
4. The Government Open Data License - India applies only to an exact dataset whose metadata declares it. Government authorship, public viewing or free download does not transfer rights for unrelated products.
5. Local Government Directory PIN crosswalks and Survey of India administrative boundaries provide independent context; neither is PIN geometry.
6. DIGIPIN is a ten-character location grid with approximately four-metre cells under its pinned specification and encoder version. It complements a conventional address and does not identify a six-digit PIN, building, person or postal-booking entitlement.
7. A generated PIN surface records inputs, method, uncertainty, exclusions, topology, validity, CRS and digest and remains non-canonical.
8. Exact building display requires separately permitted geometry plus a source-defined stable relation, common identifier or reviewed explicit crosswalk to the exact civic address.

## Resolution flow

`coordinate -> official PIN boundary or permitted civic-address point or DIGIPIN cell -> typed delivery/non-delivery office evidence -> village/local-body/subdistrict/district/state-or-UT -> explicit address-building relation -> IN AGID cell`

AGID remains an independent spatial index. It never relabels an AGID cell, DIGIPIN cell, office point, administrative boundary, nearest building, Voronoi cell or model output as canonical PIN geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_IN_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_IN_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_IN_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_IN_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=IN` or `/api/postal/IN/{pin}`. Geometry remains opt-in and preserves official versus derived evidence.
