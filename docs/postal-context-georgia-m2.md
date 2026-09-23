# Georgia M2 source and resource-rights review

Reviewed 2026-08-28. **GE remains M1_metadata / blocked, not M2.**
The existing `M2_experimental` definition is preserved verbatim: pinned,
rights-cleared snapshots must reproduce experimental packs with complete
lineage. A scoped real pack is allowed; this review does not add nationwide
coverage, an official postal polygon, or M3/M4 requirements to that target.
The existing fourteen hard blockers and all privacy/territory rules remain.

## Current postal source and reproducible observation

The old `?group=3&letter=I&...zipcodes...` URL returns HTTP 200 but serves the
homepage, not a postcode form. It links the current
[Georgian Post finder](https://www.gpost.ge/help/postal-codes).
The AGID GE JSON/YAML profile, hierarchy and source references now use that
page. A source name or a successful HTTP status does not establish a valid
assignment dataset or promote an address to strongly validated.

The visible form sends a read-only POST to `/Help/FindPostalCode` using an
anonymous anti-forgery cookie/token, `regionTypeId=1` and a search string.
The inspector reproduces that standard flow; it does not bypass protection,
log in, accept a contract, send a person/parcel/house-number query, or persist
session values. The numeric region selector is not interpreted as a country
subdivision. One public street-name fragment was queried and repeated once.
Provider JavaScript is not executed.

The [source report](../reports/postal-context-m2/ge-source-review-2026-08-28.json)
ran from **10:56:30.145Z to 10:56:49.220Z**. Both search replies had 32,287
bytes and SHA-256
`52cc50d9e0db6e3a16158d4a0dca504704f46cc0ab7aa7952998c39160f6d52e`.
Identical replies for one query do not prove an atomic source edition, stable
ordering, current national allocation or complete coverage. Page hashes can
change because of ephemeral form values and dynamic site content.

Grain: one postcode/location display card under a returned heading, not a
postal polygon, official address identifier, exact building or service office.
Counts include initially hidden cards already present in the response.
Comparisons use Unicode/whitespace-normalized labels without emitting them;
no corrected source rows or inferred assignments are produced.

| Check | Observation | Risk / consequence |
| --- | --- | --- |
| Cards and grouping | 64 cards; three groups of 46, 16 and 2 | One non-random query, not a representative national sample |
| Initially hidden cards | 50/64 | Counting only visible cards would omit 78.125% of this response |
| Code strings | 11 distinct four-digit strings; 46/64 start with zero | Integer conversion would corrupt those strings |
| Missingness and syntax | 0/64 missing codes/labels, 0/64 malformed codes | Presence and syntax are not allocation or deliverability proof |
| Comparison duplicates | 0/64 excess group/code/label tuples | No stable source record identifier or assignment validity supplied |
| Numeric location labels | 5/64 | A numeral in text is not an explicit civic-number/building assertion |
| Postal geometry / exact civic / building links | 0 | Keep geometry `none`; do not infer by proximity or a postcode |

High-confidence engineering findings apply only to the inspected response.
The high-risk gaps are edition, coverage, exact postal reuse rights and
authoritative relation identity. No historical distribution or trend can be
inferred from this one-query review. The report contains aggregate statistics,
timestamps and digests, not raw HTML, addresses or provider rows. Response
hashes are observation receipts, not retained or downloadable source artifacts.

## NSDI catalogue and exact resource licences

The [NSDI catalogue](https://nsdi.gov.ge/en/geoportal) returned 159 unique
metadata IDs across 217 theme occurrences. The 58 repeated memberships are
not extra datasets or duplication of source features. These counts are not
postal/address coverage. The three selected resources have no download URL
in this catalogue view; that is not proof that no permitted access exists.
No WMS feature request, address feature, cadastral/title record or building
record was fetched.

The [portal terms](https://nsdi.gov.ge/en/terms-of-use) distinguish free
search/viewing from downloads and reuse controlled by each resource owner.
The inspector parses only public content embedded in the page and checks
the relevant terms. It does not turn portal access into a blanket licence.

| Resource | Metadata ID | Declared condition | Review implication |
| --- | --- | --- | --- |
| [Address Layer](https://nsdi.gov.ge/metadata-export-info/92) | 92 | CC BY-NC-ND 4.0 | Commercial use and sharing adapted resources are restricted |
| [Named Streets Layer](https://nsdi.gov.ge/metadata-export-info/35) | 35 | CC BY-NC-ND 4.0 | Same declared condition, independently mapped resource identity |
| [Registered Building](https://nsdi.gov.ge/metadata-export-info/80) | 80 | CC BY-NC 4.0 | Adaptation is permitted under its conditions; commercial use is restricted |

The exact owner-provided Georgian terms and response digests were reviewed:
address/street responses share
`046fdadcfb502cb0243d64dd505fa9430e2272c3b53a049a710193888fa229ef`;
building response is
`1897a19708b05abb061d6127847d90345208f8b0aa3b2aa9fe6b8f484a13add1`.
The licence URL field is null; no generic URL is substituted into that field.
The inspector rejects changed labels or bytes pending a new rights review.
These are known, different restrictions, not missing terms for all Georgian
data and not an unrestricted commercial/open-source grant.

For interpretation, the [CC BY-NC-ND deed](https://creativecommons.org/licenses/by-nc-nd/4.0/)
distinguishes sharing originals from sharing adaptations, and notes that a
mere format change is not a derivative. The
[CC BY-NC deed](https://creativecommons.org/licenses/by-nc/4.0/) permits
adaptations with noncommercial/attribution conditions. A generic deed is not
the actual licence or a substitute for the owner's full terms. Review the
specific transformation, combination, purpose and distribution before use;
do not claim every technical conversion is prohibited or that every planned
AGID artifact is permitted. Nothing was uploaded to GitHub/HF as source data.

Four further references were checked by content markers and hashes: Georgian
Post service terms, its current addressing webpage, the
[NAPR address FAQ](https://www.napr.gov.ge/en/page/frequently-asked-questions/address-registration)
and the [GeoStat population-geography page](https://www.geostat.ge/index.php/en/modules/categories/738/the-geographical-distribution-of-the-population-and-internal-migration).
Guidance, an address definition and statistics are not source assignments,
building relations or a bulk postal reuse grant. The older PDF guide was not
newly attested or used as live data in this run.

## AGID gates and next step

The source catalog retains Georgian Post's operator identity but marks its
unreleased finder evidence metadata-only. Formatting/legal references,
address/geometry context and statistics cannot independently confer postal
validation authority. The real GE runtime remains unconfigured; synthetic
runtime tests are engineering evidence only. Existing technical identity,
coverage gaps and territorial policy are unchanged.

To unblock, obtain a permitted current scoped postal snapshot and exact reuse
terms; review any proposed spatial resource use against its individual
conditions and privacy, or obtain separately approved alternative rights.
Preserve source/terms/version/hash and reproducible transformation/validation
evidence. Then publish only to an approved immutable destination, verify the
remote bytes and exercise the real AGID descriptor/loader/API. Unsupported
house numbers and buildings remain absent. No official polygon is fabricated.

Next read-only review: **2026-09-04**, after the pending-country pass. Accounts,
contracts, rights requests, payments, new repositories/public destinations
and production deployment require explicit approval. The existing zero-extra-
spend boundary is unchanged. Next pending country is **HK (Hong Kong)**.
No second country was started, and the prior country holds are unchanged.

## Reproduction

```sh
node scripts/inspect-postal-context-ge-sources.mjs --report tmp/ge-new-review.json
npm run verify:postal-context-georgia
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
npx tsc --noEmit
```

The inspector refuses to overwrite an existing report. Exact executed
commands and host limitations are in the
[engineering report](../reports/postal-context-m2/ge-checks-2026-08-28.json).
Data-quality review drove the explicit card grain, hidden-card completeness,
leading-zero handling and distinct metadata/theme counts; licence review
remains separate from syntax, source identity and geometry.
