# Cyprus Postal Context M2 source review

## Technical summary

Cyprus remains at `M1_metadata`. The official 2024 Cyprus Post directory provides a current assignment denominator of 1,131 distinct four-digit street/community postcodes, but it contains no geometry. The public CYSTAT GML contains genuine Polygon geometry for a 2011 population-distribution layer, not a current Cyprus Post perimeter. Only 832 of the 1,131 current directory codes match that historical layer; 299 current codes do not, and 13 historical geometry codes are absent from the current denominator.

The application must therefore not shade these historical polygons as current postal areas. No CY production artifact, real CY API result, bounds fit, translucent fill or outline is enabled by this review. Missing surfaces remain explicit no-area outcomes rather than buffers, administrative substitutes, Voronoi cells or model output.

## Key findings

| Evidence | Exact result | M2 consequence |
| --- | ---: | --- |
| Cyprus Post directory | 33,541 street rows; 757 community rows | Current assignment evidence, not perimeter evidence |
| Distinct current street/community codes | 1,131 | Required comparison denominator |
| CYSTAT GML | 852 statistical distributions; 879 Polygon patches | Historical official-statistical geometry only |
| Four-digit historical geometry codes | 845 | Not a current operator release |
| Exact code matches | 832 / 1,131 (73.56321839%) | Insufficient for a current national postal-area product |
| Current codes without 2011 geometry | 299 | Must return no current area |
| 2011 codes absent from current assignments | 13 | Must remain historical/retired candidates, not current results |
| Current operator perimeter records | 0 | Real CY map visualization remains blocked |
| Published immutable CY artifacts | 0 | M2 cannot be claimed |

## Scope and data definitions

- **Current assignment** means a four-digit code found in the 2024 street or community sheets of the official Post Code Directory.
- **Historical official-statistical geometry** means the CYSTAT population-distribution surface whose measurement/reference period is declared as 2011. It is not labeled as a Cyprus Post delivery perimeter.
- **Current drawable postal area** requires a current postcode-specific operator or official-statistical Polygon/MultiPolygon, or a reproducible derived surface from a complete permitted current member relation.
- **Address/building context** stays separate. A street/community row, DLS address point, parcel or proximity relation cannot prove an exact building link.
- Country identity, Republic-government service coverage, the Green Line, Sovereign Base Areas and effective control remain separately sourced assertions.

## Sources and rights reviewed

1. [Official Post Code Directory](https://data.gov.cy/el/dataset/odigos-tahydromikoy-kodika-post-code-directory): portal metadata reports CC BY 4.0, modification on 2024-09-18 and temporal coverage beginning 2024-01-01. The exact XLSX is pinned at 3,263,480 bytes and `sha256:5e89b5768cb914af3a22e2df0438532bbfd69a5f8556e1cc2ec87d665a96db04`.
2. [Official CYSTAT dataset 481](https://www.data.gov.cy/en/dataset/481): the CC BY 4.0 dataset identifies a 2011 statistical distribution. The exact DLS-hosted GML is pinned at 22,603,791 bytes and `sha256:ce8ea42520475bcdbf93c891a69402a34372e06d6d84ab0b0fac70763be7b5f7`.
3. [Cyprus Post postal-code API](https://www.cypruspost.post/en/api-postal-codes): access is request-based through a Contact form. No authentication, agreement or bulk retention right was requested or assumed.
4. [DLS INSPIRE Addresses](https://www.data.gov.cy/el/dataset/dieythynseis-addresses-inspire): a separate point/address relation with reported partial coverage; it does not close national postcode geometry or building identity.

This is an engineering evidence review, not a legal opinion. No account, contract, payment, publication destination or deployment was created.

## Methodology and reproducibility

The byte-bound inspector verifies both file sizes and SHA-256 digests before parsing. It then:

1. reads the XLSX workbook relationships and shared strings without executing formulas;
2. extracts four-digit codes from column E of `Streets` and column D of `Communities`;
3. profiles the GML CRS, distribution count, Polygon patches, interiors, dates and `SU.ASU.PO_*` identifiers;
4. compares the union of current directory codes with four-digit historical geometry identifiers;
5. fails closed if counts, digests, schemas or the 832/299/13 comparison drift;
6. records zero current drawable coverage until a production-eligible source and immutable artifact pass the real AGID path.

The source bodies are deliberately excluded from Git. Only source receipts, hashes, profiles, tests and the audit conclusion are committed.

## Limitations and robustness

- The GML declares `EPSG:3048`, so any later artifact needs a pinned EPSG:3048-to-EPSG:4326 transform and topology validation.
- The source literally contains `2011-11-31` as a measurement end. That is not a valid calendar date and must be preserved as a source-quality exception, never silently repaired.
- Exact code equality cannot prove temporal equivalence. Even the 832 matches remain historical statistical context until a country-specific current-authority decision and artifact are approved.
- The 299 unmatched current codes make interpolation especially unsafe. No administrative clipping, buffering, Voronoi construction, learned boundary or AGID cell is accepted as an official replacement.
- A future historical-view feature may expose the 2011 layer only with a clear historical label, official-statistical authority, source date and separate opt-in behavior.

## Application visualization status

The shared application path already supports country/postcode normalization, Polygon/MultiPolygon validation, map bounds fitting, a semi-transparent fill, a distinct outline, clear/re-search and error states. Cyprus has no production-eligible artifact wired to that path, so the correct current UI result is **no verified area available**, with the source-vintage explanation. The 2011 layer is not silently returned for a current search.

## Unblock conditions and next steps

1. Obtain a current reusable postcode Polygon/MultiPolygon release, or a complete permitted current address/member relation suitable for a clearly derived surface.
2. Pin edition, validity, schema, declared coverage, rights, attribution and SHA-256; retain special/non-area classes and separately reconcile historical codes.
3. Publish an approved immutable artifact without raw personal, customer or land-rights data.
4. Pass real CY loader/API/app tests for normalization, geometry validity, ambiguity, bounds fit, translucent fill, outline, authority, source date, confidence, loading, no-result, invalid geometry, API failure, clear and re-search.
5. Recheck public metadata no earlier than 2026-09-29 after all pending countries have been visited. Authentication, agreements, paid access, new publication destinations and deployment require explicit approval.

The next country in the ledger is Czech Republic (`CZ`).

## Further questions

- Will CYSTAT or DLS publish a post-2021/current postcode boundary release with stable downloadable features and redistribution terms?
- Can Cyprus Post provide a versioned complete current street/address membership relation under retention and derivative rights suitable for an OSS-derived surface?
- Should a separate historical mode expose the 2011 statistical layer after immutable artifact review, even though it cannot satisfy current M2?
