# Lebanon M2 source review — 2026-08-28

LB remains **M1_metadata / blocked**, not a completed postal dataset.
[Source receipts](../reports/postal-context-m2/lb-source-review-2026-08-28.json)
and [engineering checks](../reports/postal-context-m2/lb-checks-2026-08-28.json)
separate live reference observations from synthetic conformance tests.

## Country-specific requirement

`M2_assignment_geometry` formalizes the existing runtime Promotion section at
base `e413d30f971b546aea1ffe01bf6a4426d0e35fca`. All eight hard blockers remain.
Current rights-reviewed typed postal assignments and independently licensed
point, route or area geometry need declared coverage, validity, CRS/topology,
temporal, privacy and provenance checks, reproducible transformation, approved
immutable publication and actual AGID loader/API verification.
No official postal polygon is presumed. Derived, virtual and absent geometry
remain distinct. NAC, administrative P-code and AGID are independent identities.
Exact civic/building display needs a separate explicit permitted relation.

## Observed evidence and limits

Sixteen bounded anonymous public GETs completed at
`2026-08-28T18:15:15.296Z`: fourteen verified reference bodies and two failures.
The receipts pin requested/final URLs, observation times, MIME, bytes and SHA-256
where bytes were received. No assignment, geometry resource, feature, customer,
recipient, owner, household or land-title record was downloaded or published.

### Postal operator and formats

[LibanPost's public service page](https://www.libanpost.com/english/individuals)
is an operational reference, not an obtained current assignment table.
The [address form](https://www.libanpost.com/AddressDetails.aspx?homeService=1&lang=2)
initial HTML has separate P.O. Box, ZIP and NAC controls. The ZIP input is initially
disabled and allows 40 characters; this is a UI constraint, not a postcode format.
Governorate and light-district dropdowns have 7 and 26 nonempty options; two
dependent selectors are empty initially. Empty or disabled controls do not prove
data absence. These are form-option counts, not current administrative coverage.
No form was submitted or browser runtime exercised. Only counts, control schema
and option-label digests are retained, never values or ASP.NET client state.
The [P.O. Box page](https://www.libanpost.com/english/p-o-box-service) displays an
unavailable listing; this does not establish nationwide service absence.

The [UPU Lebanon addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/lbnEn.pdf)
is printed **08/2018**, despite later file metadata. Both physical pages were
visually reviewed. Its illustrative names, addresses and P.O. boxes are not data
records and are not republished. The [General Addressing Issues PDF](https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf)
has 12 physical pages; relevant physical pages 2, 6, 7, 9 and 12 were visually
reviewed. The Lebanon list/length/format sections are **August 2026**; other
sections need not share that edition. Four digits or eight digits remain valid
syntax. The spaced eight-digit format occupies **ten characters, not ten digits**.
The historical source ID ending `2025` is retained; only LB edition descriptions
change. Normalization, leading zeroes, country identities and fixtures are unchanged.

### Administrative geometry leads, not postal surfaces

[MOPH service metadata](https://maps.moph.gov.lb/server/rest/services/Administrative_Zones/FeatureServer?f=pjson)
and layers 2/3/4 describe governorate, district and cadaster polygons in Web
Mercator 102100/3857. `PCODE` is an administrative string field. Non-null field
schema does not establish zero missing records; GUID parent fields do not prove
referential integrity. Blank copyright and advertised editing capabilities grant
no permission. No feature or editing operation was requested.

The [Lebanon Atlas item](https://www.arcgis.com/sharing/rest/content/items/984d143d0c1440ce9f3eadb4d900a7ea?f=json)
links a different service in 4326. Its nonempty item terms permit attributed
informational/analytical sharing and adaptation, while disclaiming legal,
cadastral and authoritative boundary determination. Older P-code conventions
are explicitly caveated. Its 8/26/1,627 administrative counts are metadata claims,
not queried feature counts. They cannot be reconciled automatically with the
operator's differently scoped dropdown. Normalized terms/description hashes are
pinned; an item change requires review. No blanket postal or building licence follows.

The item links [HDX package cod-ab-lbn](https://data.humdata.org/dataset/569beba7-bad7-4951-a19d-468a035461cd).
Its API metadata explicitly labels administrative boundaries **CC BY-IGO**.
The notes document version 02, source boundaries dated 2 May 2014, humanitarian
validity from 13 November 2024 and a 30 October 2025 review. The August 2026 metadata
modification is not a new boundary date. Four listed resource formats have
advertised hashes of 8/8/8/32 characters: none is a verified downloaded SHA-256.
No resource was fetched and no topology, coverage or postal crosswalk was tested.
The [CC BY 3.0 IGO legal code](https://creativecommons.org/licenses/by/3.0/igo/legalcode)
was read and hash-bound: attribution/notices, identifying adaptations, no added
restrictions or implied endorsement, and no warranty. This observed licence is
not missing; it simply does not establish a current LibanPost assignment, exact
artifact suitability or permission to process private address/building records.

### Privacy and unavailable references

The reviewed [LibanPost privacy-policy section](https://www.libanpost.com/english/privacy-policy)
(9,191 normalized bytes) describes personal-data collection, processing and
individual access/portability. It does not authorize public redistribution.
Its published version/current legal applicability were not established.
[DLRC office reference](https://www.lrc.gov.lb/en/content/work-cadastre-offices)
retrieval failed with a network error. The
[Ministry of Economy personal-data reference](https://economy.gov.lb/ar/services/%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA-%D8%B0%D8%A7%D8%AA-%D8%A7%D9%84%D8%B7%D8%A7%D8%A8%D8%B9-%D8%A7%D9%84%D8%B4%D8%AE%D8%B5%D9%8A)
returned 403. Neither failure proves data absence or removes the existing
privacy gate; cached search text is not a current hashed legal document.

## Reproduction and next action

Run `node scripts/inspect-postal-context-lb-sources.mjs --report NEW.json`;
Windows may provide `--curl C:/Windows/System32/curl.exe`. The checker uses
bounded TLS-verified anonymous GETs, never overwrites reports, records no raw
body, and fails closed on unexpected identity/MIME/format, changed reviewed PDF
bytes, privacy text, item terms or HDX lineage. Dynamic wrappers may change
response hashes while reviewed sections remain equal. Historical byte-for-byte
reproduction requires the same inputs; digests cannot reconstruct deleted bytes.
Preflight bodies and PDF renderings are temporary and removed after GitHub
publication is verified. Aggregate receipts are not production source artifacts.

All eight LB official discovery references are now metadata-only for assignment
validation. A provider name, identifier or URL alone cannot assert a strong
current assignment. Publisher identity/trust tier remains intact.
Obtain a current permitted postal assignment release and explicit temporal
geometry relation, validate it, then request approval for immutable publication
outside AGID Git and verify the real AGID loader/API. National missing/duplicate
rates remain unknown; synthetic tests are not data-quality measurements.

No account, restricted query, contract acceptance, new repository/Dataset/Space,
public destination, paid compute, additional Hugging Face charge, deployment,
force push or main merge occurred. Public-only retry is deferred until all
pending countries have been visited and `2026-09-04T18:15:15.296Z` has passed.
The queue selects **LK (Sri Lanka)** next; it was not started this run.
