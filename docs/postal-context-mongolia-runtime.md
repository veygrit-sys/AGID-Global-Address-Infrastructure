# Mongolia postal context runtime

Mongolia is an M1 metadata and synthetic-runtime country pack connected to the shared Postal Context API and AGID spatial index. It preserves five-digit and extended-code compatibility, canonically NNNNN-NNNN. The dated CRC 2025 explanation cites MNS 6775:2024 and five digits, while another live CRC page retains 2019 nine-digit semantics and a conflicting 2025 count. Current assignments cannot be inferred from accepted syntax.

This release contains no CRC postcode rows, real addresses, recipients or senders, Gazar or NSDI layers, cadastral records, production polygons, buildings, owners, occupants, query history or other personal data.

## Evidence and geometry

1. A pinned current zipcode.mn result is dated assignment evidence. Search, map and list access does not automatically grant bulk reuse or canonical geometry.
2. CRC's historical MNS 6775:2019 explanation distinguishes the five-digit zone from a nine-digit building-assigned code. The four-digit extension is not itself a polygon or building footprint.
3. UPU documents five-digit placement and urban, rural, P.O. Box and organization address patterns. Its examples are not production rows or current allocation geometry.
4. An official five-digit polygon requires an exact postal-authority boundary artifact and code relation. A permitted administrative-boundary join is derived and carries lineage and uncertainty.
5. The government Gazar address system uses coordinate grids down to 10 metres. Gazar grid codes, CRC postal codes and AGID cells remain three separate identifier systems.
6. An exact nine-digit code can reach building display only through an explicit rights-cleared provider record, stable building relation and separately permitted building geometry.
7. Gazar, NSDI, boundary and NSO products are source-qualified administrative or address context. Viewer access, authority status, a standard or an open-data programme is not a blanket licence.
8. Voronoi, interpolation and model surfaces may compress or fill gaps only as versioned derived geometry with uncertainty; they never become official postcode boundaries.

## Resolution flow

coordinate -> official or derived five-digit postal surface -> aimag or capital -> soum or district -> bag or khoroo -> typed civic address -> exact nine-digit unified-code relation when assigned -> explicit address-building relation -> MN AGID cell

AGID remains an independent spatial index. It never relabels a CRC code, Gazar grid, administrative boundary, NSO aggregate, nearest building or model output as canonical postal geometry.

## Runtime configuration

~~~text
AGID_POSTAL_CONTEXT_MN_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_MN_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_MN_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_MN_LKG_DESCRIPTOR_DIGEST
~~~

The standard endpoints accept countryCode=MN or /api/postal/MN/{postcode}. Five-digit geometry remains opt-in. Nine-digit lookups return no geometry unless a separately authorized explicit building relation supplies it.

## Current review

See [MN M2 source review](postal-context-mongolia-m2.md). M2 remains blocked: 2721 versus 2720 reported codes, exact assignment validity, reuse rights, real data validation, immutable artifacts and actual AGID verification are unresolved. The 2024 directory still prints an extended organization example, so legacy syntax is not rejected. UPU is printed 01/2019. The source catalog is metadata-only until exact evidence passes; synthetic code tests are not national data completion.
