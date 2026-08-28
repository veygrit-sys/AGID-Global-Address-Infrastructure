# Kyrgyzstan M2 source and quality review

KG remains **M1_metadata / blocked**, not M2. The existing KG promotion
contract required independently licensed geometry as well as assignments;
the new named `M2_licensed_assignment_geometry` stage preserves this and all
ten original hard blockers. A directory-only, synthetic or metadata release
does not meet it. No other country's definition or progress was changed.

## Captured source and grain

The [Kyrgyz Post directory](https://post.kg/language/en/new-postal-codes/)
was retrieved twice during 2026-08-28T14:36:41Z–14:37:17Z. It has seven area,
20 city and 59 group keys in its embedded data literal. Its UI labels are
branch, postal code and address context. One observation is a row at a
particular hierarchy path and array position; that position is not a stable
postal-object identifier. The entire captured literal was profiled.

| Check | Count / rate | Meaning |
| --- | --- | --- |
| Directory observations | 2,059 | Not unique offices or national assignments |
| Six-digit string observations | 2,049 | Syntax only; current validity unverified |
| Distinct numeric strings | 871 | 452 repeated-code groups; 1,178 excess occurrences |
| Mobile marker observations | 10 / 0.486% | Typed non-numeric exception, not a bad postcode |
| Exact composite-key excess duplicates | 26 / 1.263% | 26 repeated groups; 2,033 distinct observation keys |
| Whitespace/NFKC comparison duplicates | Same 26 | Comparison only; source fields are not rewritten |
| Leading-zero numeric observations | 1 | Kept as a string; no repair or padding |
| Missing branch/code/context cells | 0 / 0% each | Measured only on this captured directory |
| Unrecognized non-numeric cells | 0 / 0% | Not proof that future exceptions cannot occur |

The comparison key is area/city/group plus all three fields. Repeated codes
are expected many-to-one context, whereas exact repeated observations need
source reconciliation before conversion. Neither count is used to silently
deduplicate or invent object identity. High downstream risk: treating a code
as an office key would collapse distinct observations; using a row's address
text as a civic/building assertion would exceed its authority.

The [aggregate source report](../reports/postal-context-m2/kg-source-review-2026-08-28.json)
pins every acquired response and the extracted literal. Both directory HTML
responses, literal hashes and date metadata agree. Literal SHA-256 is
`3c87e44e27ddba9fa4329ecd1ccb91b9db343e02ddc14ae0f3cd4805ba7a437f`.
The source's published date is 2025-10-16 and modified date is 2025-10-28;
edition and record validity are unverified/null. A 2026 HTTP or retrieval date
cannot replace these. Repeatability is not an atomic current national snapshot.

## Rights, reference evidence and access

Six of seven references passed content checks. The one-page
[UPU format sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/kgzEn.pdf)
was hash-pinned and visually reviewed in full: edition 03/2019, six digits,
country/region/office structure and address-element semantics. Its examples
are not retained and are not current assignments. The UPU designated-operator
directory returned HTTP 500; this is an access observation, not absence of an
operator or a national dataset.

The [operator FAQ](https://post.kg/language/en/frequently-asked-questions/)
describes street/house lookup and separate address fields. The
[privacy policy](https://post.kg/language/en/privacy-policy-2/) concerns website
visitor information and includes site-use consent wording. The
[media policy](https://post.kg/language/en/information-for-the-media/) offers
media access and an official-request channel. None of these inspected pages
pins a bulk-directory reuse licence. No account, form, personal-data query,
clickthrough or explicit contractual acceptance was performed; no new rights
are presumed. This is not a conclusion that all KG reuse is forbidden.

The [government portal description](https://data.gov.kg/ru/about) and public
catalog searches concern discovery, not an exact post.kg licence. The literal
`postal` and `почт*` searches returned zero; `индекс` returned 117 with only
20 metadata results inspected (price, volume, trust or other indices, not a
verified postal-assignment release). Resources were not downloaded. Query
counts are not a national absence or coverage claim. The
[land-agency homepage](https://gosreg.gov.kg/ru/) confirms Address Register
metadata, not open address/building relations. No register, cadastre, owner,
person or legacy `nsdi.kg` query was made.

Node's initial postal-host TLS verification failed. Windows native TLS then
verified the chain and fetched the public pages. The reproducible command uses
the existing bounded native transport on Windows; verification is never
disabled. Non-200 bodies are not stored or hashed as source documents.

## Reproducibility, AGID and missing gates

Run these from the cumulative branch with its locked dependencies:

```text
node scripts/inspect-postal-context-kg-sources.mjs --report reports/postal-context-m2/kg-source-review-<new-time>.json
npm run verify:postal-context-kyrgyzstan
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
npx tsc --noEmit
```

The literal reader uses the existing TypeScript parser as syntax inspection,
never `eval`, a VM or browser script execution. It accepts inert strings,
arrays and objects (including source trailing commas), rejects duplicate
hierarchy keys, executable forms, unsafe keys, shape drift and size/depth
overruns, and outputs aggregate quality metrics only. Reports are create-only.
No source row or transformed production data is persisted by that command.

The catalog retains Kyrgyz Post's operator authority but marks the directory
metadata-only: source ID, label or URL alone cannot grant strong validation.
The existing synthetic KG runtime/API continues to test authority separation,
not real-data completion. Current-assignment quality rates are **unmeasured**
because zero current assignment records have been validated. This is distinct
from the measured directory-cell rates above.

Still required: a lawful current typed release, stable identity and duplicate
reconciliation, exact source-to-terms binding, edition/validity, independently
licensed point/route/area geometry and CRS/topology checks, administrative and
civic/building/privacy reviews, approved immutable data publication and actual
AGID loader/API proof. Official polygons are not presumed; derived, virtual
and none remain distinct. House numbers and buildings require separate explicit
rights-cleared relations. No geometry, crosswalk or production pack was created.

Public-reference review is due after all pending countries and
**2026-09-04T14:37:17.782Z**. This date grants no restricted access, contract,
paid operation or new publication authority. The next pending country is KH;
no KH work was started during this run. The [engineering receipt](../reports/postal-context-m2/kg-checks-2026-08-28.json)
records actual checks and source-code digests separately from M2 evidence.
