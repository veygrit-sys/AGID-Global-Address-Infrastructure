# China M2 source review

Reviewed 2026-08-28. **CN remains M1_metadata / blocked, not M2.**
The previously unnamed M2 criterion is now explicit in
`data/postal_country_packs/cn/postal-context/m2-source-review.json`.
The existing runtime roadmap requires current typed assignments,
independently licensed point/area geometry, CRS/topology and separate
standard-address/building-link review. Those stricter CN requirements and
all ten hard blockers are preserved. This is not an assignment-only target.
Missing geometry stays `none`; no official polygon is fabricated.

## Live source and reproducible inspection

The [China Post outlet search](https://iframe.chinapost.com.cn/jsp/type/institutionalsite/SiteSearchJTApi.jsp?community=ChinaPostJT)
uses a public read-only POST to
`https://iframe.chinapost.com.cn/api/institutionalsite/findlist.do`.
The inspector sends only the page's fixed `act=list`, `size=10`,
`community=ChinaPostJT` and page number. Pages 1 and 2 were inspected,
then page 1 was repeated, without cookies, authentication, named/private
queries or redirects. No provider JavaScript was executed.

The source review ran from **10:17:05.504Z to 10:17:20.958Z**.
The API returned `text/json`, success code 0 and a directory total of
54,631. This is the provider's reported **outlet count**, not a verified
national postcode count or complete delivery-region edition. The sample
contains 20 rows (approximately 0.0366% of that reported total); it is
neither random nor representative, and quality rates cannot be generalized.

Grain: one service-outlet row. Fields include administrative labels,
outlet name, postcode, address, phone and operational schedule/state fields.
Address and phone contents are discarded immediately after schema checking;
only address presence is counted. Office/postcode labels exist transiently
for aggregate comparisons and are never written to the report. No raw
HTML/JSON, contact, address or provider row is committed.

| Check | Observed sample | Interpretation / risk |
| --- | --- | --- |
| Requests | Two 10-row pages and one repeat succeeded | Bounded observation, not national extraction |
| Postcodes | 17 distinct six-digit strings in 20 rows | Three codes shared by different outlet labels |
| Required-field missingness | 0/20 for province, city, county, outlet, postcode and address presence | Presence is not correctness or civic-address authority |
| Code syntax | 0/20 invalid or whitespace-padded | Syntax does not establish current allocation |
| Comparison duplicates | 0/20 excess label/code tuples | No stable outlet ID; unique labels are not verified identities |
| Geometry / civic / building relations | 0 | No coordinates, boundaries or explicit exact-building relation |
| Edition / validity / coverage | Not established | High: retrieval and operational dates are not assignment validity |

Full response SHA-256, byte lengths, timestamps, field-level rates and the
ordered observation-manifest hash are in the
[source report](../reports/postal-context-m2/cn-source-review-2026-08-28.json).
Page 1 had 4,233 bytes and SHA-256
`7ef11d892b6d636f942d2b0063aab597db4d6d5de44580bc55c3d75d8a7dc69b`;
page 2 had 4,209 bytes and SHA-256
`279cfca4d72875506ed8d27469f32eace0f1cc7a54059c2f962c6c63abe35f83`.
Page 1 repeated identically. This limited repeat does not prove an atomic
snapshot, stable ordering, freshness of allocations or unchanged other pages.
The hashes identify responses that were inspected, not retained source files
or publicly released assignment artifacts.

The inspector rejects changed envelopes/row fields, non-string postcodes,
unexpected MIME or HTTP status, wrong pagination, invalid UTF-8, oversized
responses and unreviewed pages. Invalid postcode syntax, missing fields and
duplicate comparison tuples are reported, not repaired or promoted.
Service suspension/resumption labels are never treated as postal validity.
Synthetic tests validate the inspector only; they are not M2 data.

## Official references and unresolved rights

Four official references were fetched and checked by content markers and
SHA-256. Their dates are distinct from the retrieval time:

- The existing [China Post source URL](https://www.chinapost.com.cn/cn/report/1813/134220-1.htm)
  republishes **2015 universal-service supervision measures on 2018-10-22**.
  It is not a postcode database or a lookup response. Its source ID and
  provider identity are preserved, but its catalog role is legal-only.
- The [State Post Bureau reply](https://www.spb.gov.cn/gjyzj/c200041/202510/745c2008e015403eb27fd9726f6bea07.shtml)
  is dated **2025-06-19**, published **2025-10-11**. It describes the
  six-digit routing system, a separate universal delivery address code,
  maintained GIS and inter-operator sharing. None establishes an open bulk
  licence, a public national assignment snapshot or AGID equivalence.
- The [China Post portal](https://www.chinapost.com.cn/) carries a copyright
  notice. The reviewed portal, lookup page and responses did not establish
  exact permission for retaining, transforming and redistributing this
  dataset. This is an unresolved reuse grant, not a conclusion that all
  postal facts are legally prohibited from reuse.
- The [NGCC platform-management news](https://www.ngcc.cn/xwzx/bnyw/202401/t20240110_2222.html)
  is dated **2021-01-15**, despite the old source ID ending in `2019`.
  The ID is retained for compatibility and the observed date is corrected
  in metadata. Free online services and update policies do not themselves
  license a particular postal, civic-address or building dataset.

The [Tianditu search documentation](https://lbs.tianditu.gov.cn/server/search2.html)
timed out from this environment; no authenticated service was queried.
That failure is not evidence of worldwide service absence. Existing
standard, UPU, geographical-name and property references remain separated;
they were not converted into live rows or newly attested as current data.
No key request, agreement, account, private registry or paid product was used.

## AGID boundary and release conditions

The supervision article and Tianditu map context cannot alone make a postal
source strongly validated. CN/HK/MO/TW source identities and pack selection
remain separate; this review does not change their territories or hierarchy.
Existing CN synthetic loader, coordinate resolution, postcode lookup,
intersects and API tests remain engineering checks. No real CN descriptor
is enabled. House numbers and buildings require independently licensed,
explicit civic-address/building relations, never proximity or postal codes.

To unblock:

1. Obtain a source-attested current national typed assignment edition with
   stable identity, validity, exceptions and explicit coverage/jurisdiction.
2. Obtain exact source/output reuse terms and independently licensed
   assignment-related point/area geometry; validate CRS and topology.
3. Complete separate standard-address, civic/building-link and privacy review;
   keep unsupported detail absent and derived/virtual layers labelled.
4. Reproduce permitted transformations and validation, publish only to an
   approved immutable data destination, verify its hashes and exercise the
   real AGID descriptor, loader and API. No such publication is authorized
   or completed by this review; this GitHub repository is private.

Next read-only review: **2026-09-04**, after the pending-country pass.
Authentication, contracts, purchases, private queries, new public destinations
and deployments still require explicit approval. Next pending country is
**GE (Georgia)** according to the ledger's regional classification; no
second country was started in this run.

## Reproduction

```sh
node scripts/inspect-postal-context-cn-sources.mjs --report tmp/cn-new-review.json
npm run verify:postal-context-china
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
npx tsc --noEmit
```

The source inspector refuses to overwrite an existing report. Future live
counts/hashes may change and need a new review, not edits to old evidence.
Exact executed checks are in the
[engineering report](../reports/postal-context-m2/cn-checks-2026-08-28.json).
Data-quality review drove the grain, missingness, shared-code and freshness
checks, and kept a public outlet listing separate from assignment authority.
