# Gibraltar Postal Context M2 review

## Technical summary

Gibraltar remains blocked at M1. UPU August 2026 provides a complete one-record denominator: `GX11 1AA` is the single postcode for the whole country. That evidence is sufficient to define the postal identity, but not a postal boundary. The only reviewed official map source states that public access does not imply reproduction or distribution permission, so AGID cannot publish a Gibraltar-wide Polygon until explicit authority exists.

## The trustworthy result is one generic code and zero eligible areas

The intended grain is one current generic postcode plus an explicitly virtual country-wide or unavailable result. Current UPU evidence gives 1/1 code completeness, zero duplicates and exact normalization to `GX11 1AA`. The January 2013 country sheet and current RGPO addresses agree with the code; `E/V` remains a domestic addressing alternative, not a second postcode.

| Evidence | Result | M2 implication |
|---|---:|---|
| Current normalized postcode denominator | 1 | Complete for identity |
| Official sub-country postal areas | 0 | No operator postal polygon exists |
| Rights-cleared virtual territory polygons | 0 | Real map path remains blocked |
| OAR/address/WFS feature rows queried | 0 | No address or land data entered AGID |

A chart is omitted because the exact authority/geometry matrix is more useful than plotting a one-record denominator.

## Postal, territory and address authority stay separate

RGPO/UPU establish assignment. A future Gibraltar-wide surface would use an independently authorized territory boundary and must be labelled `virtual`, not `official`. The Official Gibraltar Address Register, parcels, buildings and AGID cells remain separate address context; none is dissolved or relabelled as postal geometry.

## Method and reproducibility

The audit pinned five directly captured operator/UPU responses by URL, retrieval time, byte length and SHA-256. Poppler rendered the relevant UPU pages and pdfplumber reconciled the generic-code sentence, August 2026 edition and single-code table. Government Geoportal, disclaimer, WFS/download metadata and OAR help were verified through official web retrieval; deterministic CLI capture returned HTTP 403 twice, so no body hash or feature query is claimed.

The Browser plugin was attempted after connector/API checks but its Windows sandbox initialization failed. No external-browser fallback was used. Shared deterministic UI tests remain the only rendering-capability evidence because rendering a synthetic or unauthorized boundary would misstate M2.

## Limitations and robustness

- The 2013 UPU country sheet says the operator was developing a UK-style system; the current August 2026 UPU general document still lists exactly one whole-country code. The newer source controls the denominator.
- Public WFS access is not treated as permission. The Geoportal disclaimer requires prior approval for reproduction/distribution.
- Territory geometry would be virtual context, not evidence of delivery zones or sovereignty.
- Poppler produced non-empty PNGs, but the local image viewer failed on valid Windows paths; extracted text was reconciled instead and this limitation is recorded.

## Recommended next step

Do not authenticate, query/export OAR or WFS features, accept a contract, request an API key, pay, publish or deploy without explicit approval. After pending countries and 2026-09-06T08:50:00.000Z, recheck the official sources. Resume earlier only with written territory-boundary reuse/publication authority, then pin an immutable virtual artifact and execute the real GI API/app-to-map path.

## Further questions

The decisive open question is whether HM Government will authorize a current boundary for derivative public AGID serving and whether RGPO confirms the single generic code remains current. Until both are answered, M2 remains unmet.
