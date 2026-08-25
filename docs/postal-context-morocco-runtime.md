# Morocco Postal Context runtime

Morocco is a typed five-digit postcode case. The UPU/Barid Al-Maghrib case study assigns the first digit to one of nine routeing zones, the first two digits to a province, and the remaining series to a delivery sector, agency or centre, or large-volume recipient. The fifth digit controls the code type: `0/1/7/8` for home-delivery sectors, `2–6` for agencies or centres serving counters and P.O. boxes, and `9` for large-volume recipients.

AGID therefore does not polygonize every five-digit code. An exact licensed operator sector surface may be canonical. A generated surface for an eligible home-delivery sector remains derived and uncertainty-bearing. Agency coordinates stay points; P.O. box and large-volume-recipient codes stay non-area records.

This is an M1 metadata and synthetic-runtime release. It contains no current Barid Al-Maghrib rows, real addresses, production polygons, ANCFCC features, cadastral rights, buildings, recipient records or personal data.

## Evidence and geometry

1. The UPU case study establishes structure and type semantics, not a current assignment database or official polygon file.
2. Codepostal.ma can validate a pinned operator-controlled result at capture time; search and download access do not establish a live bulk API, geometry or redistribution rights.
3. Morocco's Open Data portal lists district, locality, agency-code and agency-coordinate datasets under its ODbL-derived licence. Each exact resource and its duties must be pinned. The postcode lists state a September 2018 update and cannot be labelled current without a newer check.
4. ANCFCC topographic, administrative, city-plan, cadastral and geodetic products remain independently ordered or licensed context. Administrative or cadastral geometry is not postal geometry.
5. A permitted derived sector surface must record inputs, method, uncertainty, exclusions, topology, validity, source CRS and digest, and it remains non-canonical.
6. Exact building display requires separately permitted building geometry plus a source-defined stable relation, common identifier or reviewed explicit crosswalk to the exact civic address.
7. MA and EH are separate packs. Source coverage is recorded without turning postal or map coverage into a sovereignty claim.

## Resolution flow

`coordinate -> official sector surface or permitted civic-address point -> typed five-digit candidate -> locality/commune/province-or-prefecture/region -> explicit address-building relation -> MA AGID cell`

AGID remains an independent spatial index. It never relabels an AGID cell, administrative boundary, cadastral parcel, office point, nearest building, Voronoi cell or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_MA_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_MA_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_MA_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_MA_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=MA` or `/api/postal/MA/{postcode}`. Geometry remains opt-in and preserves official versus derived evidence.
