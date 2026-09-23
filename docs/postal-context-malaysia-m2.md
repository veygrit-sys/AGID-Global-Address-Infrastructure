# Malaysia M2 review: real dictionary, not a production postal surface

Reviewed 2026-08-28 from cumulative base `f751d508e3414d46f8776e4df7399a2b3b73f97d`. The existing `M2_source_attested` target and twelve blockers are retained. M1 remains the production stage. Only MY was advanced in this run.

## Real data and its grain

The [official MCMC catalog](https://data.gov.my/data-catalogue/poskod) identifies a CC-BY-4.0 postal dictionary for June 2026. Its fields are state, city and postcode. The catalog timestamp is 16 June 2026 12:00 without an explicit timezone; CSV/Parquet object modification times are in August. Neither timestamp supplies row-effective dates. The annual-update warning requires caution for current critical use. No immutable edition link is supplied.

All 2,932 CSV rows match the catalog's embedded preview as a multiset. There are 2,930 distinct five-character codes and 237 leading-zero rows. Outer ASCII spaces affect one state and three city labels. NFC/outer-space normalization retains raw labels and row ordinals, reducing 17 raw state labels to 16 and 391 raw city labels to 390. One exact normalized tuple is coalesced; the two different city assignments for one postcode stay separate. Output has 2,931 relations. Neither postal code nor an unqualified city name is a unique row key.

The CSV parser deliberately rejects unreviewed quoting, extra fields, invalid UTF-8, control characters and numeric/width coercion. It never pads a four-digit value or guesses administrative identities. Empty data fails rather than becoming zero coverage. Row identifiers hash typed postcode/state/city tuples; these are AGID identifiers, not claimed provider IDs. Geometry, CRS, accuracy and source validity are absent. Parquet bytes were pinned but not decoded: no Parquet/CSV parity claim is made. Completeness was not independently measured against a postal-authority census.

## Source separation

- [Pos Malaysia legacy finder](https://www.pos.com.my/postal-services/quick-access/?postcode-finder): HTTP 200 contains a missing-page message. Transport success does not establish a working lookup or assignment.
- [MyGDX JomBelajar catalog](https://jombelajar.mygdx.gov.my/en/landing-page/listCatalog/256063c2-dbf9-4765-8d84-47a60db3c742?theme=third-theme): names postal data and approval gates. A production endpoint/response was not verified; the separate training-home request timed out. No login or supplied training credentials were used.
- [UPU](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/mysEn.pdf): both pages visually reviewed. Printed 02/2010 differs from 2020 PDF metadata. Five digits precede locality; street and non-street delivery, boxes, locked bags, poste restante and ticket windows are distinct. Examples are not current records and were not ingested.
- [MyGeo inventory](https://www.mygeoportal.gov.my/sites/default/files/Dokumen_MyGeoportal/Senarai_Data_Fundamental_2026.pdf): page 8 (printed 6) lists administrative feature classes, not unique region IDs or postal boundaries. Provider release conditions apply.
- [MyGeo Data Services](https://www.mygeoportal.gov.my/en/applications/mygeo-data-services): government users with granted IDs; 267 layers refers to 2023, not current validated coverage. No restricted service was queried.
- [MyGDI guideline](https://www.mygeoportal.gov.my/sites/default/files/Dokumen_MyGeoportal/Garis%20Panduan%20MyGDI.pdf): pages 45–46 (printed 43–44) reviewed visually. Value-added spatial publication requires custodian permission and source acknowledgement. This is not a permission for an exact product and is not the MCMC dictionary's license.
- [UPI](https://www.mygeoportal.gov.my/index.php/en/unique-parcel-identifier-upi) and [MyGeoName](https://mygeoname.mygeoportal.gov.my/index.jsp?lang=en) provide parcel-code/name context. They do not establish postcode polygons, legal civic addresses, ownership or exact building relations. MyGeoName's declared ISO-8859-1 encoding and disclaimer were reviewed separately.

[CC BY 4.0 legal terms](https://creativecommons.org/licenses/by/4.0/legalcode.en), sections 2–5, require applicable attribution/license notices and change indications, without implying endorsement or imposing prohibited downstream restrictions. No warranty or separate privacy rights are granted. Scope is the identified MCMC dictionary, not whole websites, UPU PDFs or MyGeo products. Attribution and transformation notices are embedded in the experimental pack.

## AGID experiment and safety boundary

`official_postal_dictionary` is a new narrow source-authority value: it permits direct nonspatial postal/locality/administrative context only. It cannot authorize address roots, postal delivery assignments, buildings, entrances or geometry. Existing authority behavior is unchanged; dedicated tests cover rejected promotions. Catalog names and URLs remain metadata-only, including the UPU URL-as-source alias.

The exact reviewed CSV produces a deterministic, digest-pinned experimental pack. It is deliberately non-promotable, opt-in, and valid only at a one-millisecond acquisition observation window. That window records this experiment, not an invented assignment lifetime. Original labels/row lineage are retained outside the graph. Every distinct postcode was checked with the real loader, and four localhost HTTP checks covered leading zeroes, ambiguity, duplicate coalescing and coordinate resolution. AGID supplies an independent cell ID; absent geometry means no postal spatial match, street, building or covered cell is manufactured.

Reproduce after obtaining the exact digest-matching CSV in an ignored temporary directory:

```powershell
npm run build:postal-context-malaysia-observation -- --csv tmp/my-sources/malaysia-mcmc-postcodes-csv.bin --out tmp/new-my-pack --report tmp/new-my-checks.json
npm run verify:postal-context-malaysia
```

The source hash must match the reviewed configuration. The builder refuses existing outputs, changed data, unreviewed receipts and unsupported editions. It does not download, upload or deploy. `inspect:postal-context-malaysia -- --report tmp/new-review.json` is a bounded public reference recheck, not automatic renewal of source rights or M2.

## Remaining gates

No new data repository, Dataset, Space, release destination or paid service was created. Raw CSV/Parquet/HTML/PDF and experiment artifacts are not in AGID Git. Only code, configuration and aggregate/hash reports are committed. The [source receipt](../reports/postal-context-m2/my-source-review-2026-08-28.json), [real observation validation](../reports/postal-context-m2/my-real-observation-2026-08-28.json) and [engineering checks](../reports/postal-context-m2/my-checks-2026-08-28.json) distinguish evidence classes.

M2 remains blocked: approve a specific no-extra-charge immutable publishing destination, publish/re-download and verify the dictionary artifact, and review service scope/current-validity evidence. Production deployment is a separate approval. Geometry and exact civic/building context remain absent unless independently licensed explicit relationships are acquired. The ledger records the approval gate and review date; NP is next in the pending queue.
