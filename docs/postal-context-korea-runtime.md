# Korea Postal Context runtime

Korea is the reference case where the current five-digit postcode and a statutory geographic unit share the same key. Since 1 August 2015, Korea Post uses the National Basic District Number as the postcode. AGID therefore treats an exact current MOIS National Basic District polygon or multipolygon as canonical postal geometry when the artifact and its rights are fully pinned.

This commit is an M1 metadata and synthetic-runtime release. It contains no current Korea Post rows, Juso addresses, National Basic District polygons, building records, cadastral parcels, real addresses or personal data.

## Evidence model

The runtime keeps these evidence partitions separate:

1. Korea Post system metadata explains the five-digit format and National Basic District relationship, but does not validate a current code or geometry.
2. The Korea Post postcode API supplies address-to-postcode assignment receipts under a service key. An API row is not a polygon or bulk licence.
3. The MOIS Juso electronic-map National Basic District layer supplies the official postal polygon or multipolygon for the same five-digit key. No administrative boundary, road buffer, parcel, building, Voronoi cell or interpolation may replace a missing feature.
4. The Juso road-address API and public Building DB supply public civic address components and stable identifiers. In particular, the 25-digit building management number is kept as text. One road address can relate to more than one building.
5. Juso electronic-map or MOLIT GIS Integrated Building Information geometry becomes exact building output only through a source-defined identifier relationship or a reviewed explicit crosswalk. Containment, overlap, text equality and proximity are candidates only.
6. The MOLIT continuous cadastral map is validation context, not survey evidence, building identity, postcode authority or public ownership data.

The public resolution chain is:

`coordinate -> National Basic District -> postcode -> administrative context -> Juso road address -> explicit building relation -> permitted building -> KR AGID cell`

## CRS and product controls

Korean products do not share one safely assumed coordinate system. Juso spatial products may use GRS80 UTM-K EPSG:5179, while other position, building or cadastral products may use EPSG:5186. Every artifact must retain its exact source CRS, schema, edition, coverage and digest. WGS84 output requires a reviewed, versioned transform; source coordinates are never merely relabelled EPSG:4326.

Juso electronic-map access may require application, identity verification and purpose review. A KOGL marking, public-data catalog page, API service key, viewer or approved download is not by itself an unrestricted redistribution grant. Terms, purpose, public-field allowlist, derivative rights and attribution are pinned per exact product and layer.

## Building and privacy gates

An address result, entrance point, National Basic District or parcel never proves a building footprint. Detailed dong, floor and ho components are displayed only when an explicit public artifact and approved purpose permit them; they are never inferred from postcode or geometry.

Public output excludes residents, households, owners, rightsholders, occupants, recipients, forwarding and shipment records, query history, title, encumbrance, value and tax data. Building-register and cadastral information is allowlisted field by field.

## Runtime configuration

Production packs are configured independently:

```text
AGID_POSTAL_CONTEXT_KR_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_KR_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_KR_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_KR_LKG_DESCRIPTOR_DIGEST
```

The synthetic test pack exercises postcode normalization, opt-in postal geometry, coordinate resolution, bbox intersection, explicit Juso-style address-to-building linkage and AGID output. Synthetic evidence is never promotion-eligible.
