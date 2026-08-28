# Bahrain Postal Context runtime

Bahrain uses three- or four-digit postcodes in the UPU range 1XX to 12XX. The same numeric routing namespace is used for civic block context, but AGID requires an explicit authoritative postcode-to-block relation instead of assuming that equal digits, a locality label or a coordinate proves current assignment.

This is an M1 metadata and synthetic-runtime release. It contains no current national postcode/block directory, real addresses, P.O. box subscribers, CPR records, iGA certificates, parcels, production polygons, buildings, owners, occupants, tenants, tracking records or other personal data.

## Evidence and geometry

1. Bahrain Post office addresses and the UPU sheet establish current syntax, display position, valid range and home/P.O.-box examples. They are not a complete allocation history or polygon release.
2. A P.O. box remains non-spatial delivery-receptacle evidence. It never becomes a home, subscriber, catchment, address point or building.
3. iGA building-address certificates and unit/establishment numbers are authoritative civic identifiers. Controlled certificate, CPR, owner, occupant, deed and application data remain outside public artifacts.
4. The portal terms and linked Bahrain Open Government Data License v1.0 (20 May 2025) require source/date attribution, transformation notice, prescribed disclaimer, sublicence propagation and removal handling. The government licence also covers eligible government open datasets on other government websites, not every government document or controlled record.
5. Public-place point datasets can validate block labels and coordinates, but they do not supply complete block boundaries, postcode polygons or building footprints.
6. The municipal geographic explorer is a viewer, not a blanket vector licence or legal/postal boundary source.
7. SLRB parcels are cadastral geometry. A parcel is not a postal block, building or address link, and title/ownership information is excluded.
8. A derived block-postal surface records the explicit postcode-block relation, boundary input, method, uncertainty, validity, CRS, topology, licence obligations and digest and remains non-canonical.
9. Exact building display requires a permitted iGA civic-address identifier, separately rights-cleared geometry and a source-defined stable relation or reviewed explicit crosswalk.

## Resolution flow

`coordinate -> official postal/block surface or permitted iGA civic-address point -> explicit 3/4-digit postcode-block relation -> locality/governorate -> road/building/unit evidence -> explicit address-building relation -> BH AGID cell`

AGID remains an independent spatial index. It never relabels an AGID cell, public-place point, parcel, municipal viewer feature, nearest building, Voronoi cell or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_BH_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_BH_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_BH_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_BH_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=BH` or `/api/postal/BH/{postcode}`. Geometry remains opt-in and preserves official, derived and non-spatial evidence classes.

## M2 source review

The [2026-08-28 review](postal-context-bahrain-m2.md) inspected 27 real public
landmarks but found no postcode-block assignment field. Reference source IDs,
URLs and labels are context-only or legal-framework-only, not address validation.
A metadata bbox cannot become a postal polygon. Synthetic loader/API tests are
engineering checks; no real descriptor or M2 data release was enabled.
