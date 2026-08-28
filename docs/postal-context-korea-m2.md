# South Korea (KR) M2 source and access review — 2026-08-28

Status: **M1_metadata / blocked**, not M2. The existing `M2_postal_geometry`
definition and all ten hard blockers are unchanged: current Korea Post
assignments and the exact MOIS National Basic District geometry must pass
identity, licence, approval, coverage, topology, CRS, freshness and digest gates.
An implementation, catalog, synthetic fixture or PO-box list cannot replace them.

## Primary sources and exact product boundaries

- [Korea Post's system](https://www.koreapost.go.kr/kpost/subIndex/134.do?pSiteIdx=125)
  describes five-digit National Basic District numbers used since 1 August 2015.
  Format/system metadata is not a current national assignment release.
- [Korea Post's download index](https://www.epost.go.kr/search/zipcode/areacdAddressDown.jsp)
  lists data as of **2026-08-10**, published **2026-08-11**. The public PO-box
  reference ZIP was fetched and profiled; the nationwide address, change and
  range databases were not downloaded. Their links do not prove verified coverage.
- [MOIS's electronic-map catalog 15050413](https://www.data.go.kr/tcs/dss/selectFileDataDetailView.do?publicDataPk=15050413)
  is titled with **20240331**, modified **2025-12-08**, lists **PPTX / one catalog
  row**, and has temporal coverage July 2014–January 2025. It describes eleven
  layers, including National Basic Districts, and explicitly requires application,
  identity confirmation and purpose review. Its KOGL Type 1 marking is recorded,
  not ignored, but the catalog's PPTX/row count is not an obtained current vector
  dataset or a feature count. No identity form or contract was submitted.
- [Korea Post API 15056971](https://www.data.go.kr/data/15056971/openapi.do?recommendDataYn=Y)
  and [Juso search API 15057017](https://www.data.go.kr/data/15057017/openapi.do?recommendDataYn=Y)
  list no use-scope restriction in their catalogs. Service-key/application and
  traffic conditions remain; neither API was called. API catalog licensing is
  not geometry licensing, account authorization or bulk publication permission.
- [MOLIT integrated buildings 15052097](https://www.data.go.kr/data/15052097/fileData.do?recommendDataYn=Y)
  lists SHP and no use-scope restriction, with catalog title 20240715 / modified
  2025-09-08. Its listed 1,611 rows are not validated building features.
  [Cadastral product 15125044](https://www.data.go.kr/data/15125044/fileData.do?recommendDataYn=Y)
  records KOGL Type 4; it remains validation-only. No actual building/cadastral
  records were retrieved, and a parcel is not a postal polygon or building.

Seven distinct reference bodies were verified. Two `eng.juso.go.kr` guidance
requests failed at the network layer; that does **not** establish missing data,
a blanket reuse ban or permanent service closure. The separate electronic-map
catalog supplies the positive evidence for the application gate. Later catalog
modification dates never silently update the underlying product editions.

## Actual PO-box bytes, grain and reproducible profiling

The [public PO-box ZIP](https://www.epost.go.kr/search/areacd/areacd_pobox_DB.zip)
was observed twice in the review completed **2026-08-28T16:07:01.229Z**.
Both downloads and the repeated index edition matched. This is not an atomic
national snapshot and the mutable URL is not an immutable AGID data artifact.

| Object | Bytes | SHA-256 |
| --- | ---: | --- |
| ZIP | 18,548 | `19496e497de95e863a17fa6dc05018ca6d0ce33588867cb88fdb24abc3e2c938` |
| UTF-8 `20260811_사서함.txt` | 69,442 | `87bdda47afaa8d1c40feb206e0dcb158034de04a60e5d31024f4278916a74a71` |
| HWP documentation | 15,872 | `357c5b0381bb48f064d08946dfe0169838f7bf0c855c6b471f1b933a1609e7fc` |

ZIP names use the legacy Korean encoding; the table itself is UTF-8. Both entry
CRCs, sizes and SHA-256 were checked under bounded decompression. The HWP OLE
signature and hash were checked, but **its content was not interpreted**. Blank
endpoint semantics and exact redistribution conditions therefore remain open.

Grain is a **source PO-box name/range observation**, not a unique postal code,
civic address or polygon. The 10-column table contains **996 observations**,
**432 distinct valid five-digit codes**, 104 codes with multiple observations,
55 leading-zero rows and **21 excess exact duplicate observations (21/996 =
2.1084%)**. These duplicates are retained, not silently deleted or declared
erroneous assignments. All codes remain strings.

Empty counts by header order are `0, 0, 3, 373, 0, 0, 523, 533, 843, 996`.
An empty legacy postcode is not a missing current postcode. Empty endpoints are
not zero-filled. Only **150** observations have all four numeric endpoints;
zero inverted endpoints applies to that denominator, not all 996 rows.
National assignment missing/duplicate rates remain **unknown**, not zero.

The review classifies these observations as `geometry_type=po_box` with
`coordinate_geometry=none`. No area, point, civic/building relation or delivery
claim is inferred. Raw ZIP/TXT/HWP files and source records are not in AGID Git.
Only aggregate diagnostics, provenance and hashes are retained here.

Reproduce with the exact pinned configuration (a changed edition/digest fails
closed and requires review):

```sh
node scripts/inspect-postal-context-kr-sources.mjs --report /tmp/kr-new-review.json
# Optional Windows native verified-TLS transport:
node scripts/inspect-postal-context-kr-sources.mjs --report tmp/kr-new-review.json --curl C:/Windows/System32/curl.exe
npm run verify:postal-context-korea
```

Reports refuse to overwrite an existing file. Approved HTTPS hosts, anonymous
GETs, response/decompression limits, exact schema/entry names and digest checks
are enforced. Session identifiers are redacted, and unexpected bodies do not
become verified source documents.

## AGID and unblock conditions

All eight KR source registrations remain available for discovery with their
authority and product distinctions preserved. Six previously unqualified
registrations now explicitly say `metadata-only`; system and cadastre already
did. A catalog ID, label or URL alone cannot count as strong address/building
evidence or a preferred validated data provider. Synthetic runtime tests remain
separate from real-loader verification.

M2 still requires the current licensed assignment release and exact approved
National Basic District layer with compatible five-digit identities, explicit
product CRS, complete declared coverage, topology and reproducible validation.
Do not fill missing districts with administrative, parcel, building, Voronoi or
model shapes. Address and building output require separately sourced Juso/MOLIT
identifiers and explicit allowed relations; polygon membership never grants
house number, unit, owner or building identity.

No published immutable data artifact or actual AGID pack/loader/API proof exists
for this review. Obtain the required access/rights and explicit approval for an
immutable publication destination before publishing. No new dataset, Space,
repository, paid job, inference call, contract or production deployment was made.
Public-reference retry is **2026-09-04T16:07:01.229Z**, only after all pending
countries have been visited. Restricted access/publication still needs approval.

The [source receipt](../reports/postal-context-m2/kr-source-review-2026-08-28.json),
[engineering checks](../reports/postal-context-m2/kr-checks-2026-08-28.json) and
[rollout ledger](postal-context-m2-rollout.json) record this distinction.
