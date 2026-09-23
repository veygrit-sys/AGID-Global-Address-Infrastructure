# Bangladesh Postal Context contract seed

M1_metadata only. The original M2_assignment stage requires complete, current,
rights-cleared, editioned postcode and typed-office assignment evidence.
It does not require inventing postal polygons or exact buildings.

The [M2 source review](../../../../docs/postal-context-bangladesh-m2.md) records
three observed official tables and their quality exceptions. Only aggregate
counts, hashes, scope and access metadata are retained in AGID. Source office
rows, real addresses, personal/landholder records and geometry are not bundled.

Four-digit syntax does not prove allocation. Blank-code rows stay unassigned;
GPO, HO, TSO, UPO, SO, EDSO and EDBO remain distinct when explicitly supplied.
Repeated codes or matching office names are not stable office identifiers.
Unknown type, missing parent-office cells and bilingual-name gaps are not filled.

Bangladesh Post assignments, UPU addressing conventions, SoB mapping, NSDI
catalogues, BBS census context and DLRS maps remain separate authorities.
None alone supplies an exact civic-address-to-building relation. Public access
and a general portal policy are not artifact-specific redistribution rights.

M2 remains blocked pending complete reusable national evidence, approved
immutable publication and real AGID checks. Existing synthetic fixtures are
runtime conformance data, not evidence of an M2 release. See the manifest,
source profile and m2-source-review.json for the independent gates.
