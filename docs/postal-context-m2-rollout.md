# Postal Context M2 country rollout

The recurring task processes one country at a time in this order:

1. Asia (Japan first, then country/territory code order)
2. Europe
3. Americas
4. Africa
5. Oceania

The ledger is `docs/postal-context-m2-rollout.json` on the cumulative
`codex/postal-context-m2-rollout` branch of `veygrit-sys/Address-Grid-ID`.
Read the latest remote commit before every run. A local working copy may have
been removed after a verified push; an older user worktree is not the ledger.

## Scope and actual starting state

The first audit covers 252 registered country/territory profiles, including
repository-specific territory codes, not 252 ISO sovereign states. Antarctica
and the repository's special profiles are outside the five-region request.
The scheduling region is distinct from source ownership or sovereignty:
AS/GU/MP/UM run with Oceania, and EA runs with Africa. Their original profiles
are unchanged. All other profiles keep the repository's regional grouping.

At the initial audited base `cc7821cc8175031545d2a437fb5a4b10b6dfe5fe`,
110 country manifests exist and all declare M1. Only 61 spell out a named M2
stage. Missing manifests or criteria are work to do, not implicit success.
Some countries require assignment data; some require official postal geometry;
others allow an explicitly scoped experimental release. Preserve those
differences. Do not redefine M2 globally to make a country pass.

## State and resumption

- `pending`: not yet attempted in this rollout.
- `in_progress`: exactly one country; finish it before starting another.
- `blocked`: record concrete evidence, the missing permission/data/contract,
  the action needed to unblock, and an ISO timestamp `retryAfter`.
- `m2_verified`: the country's own criterion has been met by real data,
  reviewed source rights, published digest-pinned artifacts, reproducible
  validation and an AGID runtime verification record.

Visit pending countries across all regions before retrying due blockers.
Never poll the same unavailable source on every heartbeat wakeup. Prefer a
seven-day retry for unchanged source/licence blockers. Mark permission blockers
with `requiresExplicitApproval: true`; do not retry without new authority. They
remain excluded from automatic retry even after `retryAfter`; that date is a
review reminder, not permission. Explicit user approval can resume the country
earlier by clearing the gate and setting `in_progress`. Do not stop the whole rollout because one
country lacks an obtainable source. When all countries are either completed
or waiting for future review, report the next review date without claiming
completion. Pause the heartbeat only after every in-scope country has genuine
M2 evidence, or when the user asks to pause it.

The ledger checks required evidence fields, not the truth of arbitrary claims.
The executing agent must independently verify the linked artifacts and reports.
A stage label, source URL, code scaffold or passing synthetic fixture is not
M2 evidence. A no-postcode country must be reviewed against its actual system;
never invent an official code or silently mark it completed.

## Commands

```text
npm run postal-context:m2:status
npm run postal-context:m2:refresh
npm run verify:postal-context-m2
node scripts/intake-postal-context-jp-m2.mjs --report reports/postal-context-m2/<new-report>.json
node scripts/intake-postal-context-jp-m2.mjs --report <new-report>.json --expected-archive-digest sha256:<pinned-source-digest>
```

`refresh` regenerates inventory metadata and preserves progress. It refuses
duplicate countries, multiple active countries, missing proof for a completed
country, or removal of a previously tracked country. A changed M2 definition
for a completed country requires review.

## First country: Japan

The first implementation performs bounded official-source intake for the
[Japan Post UTF-8 ordinary assignment file](https://www.post.japanpost.jp/service/search/zipcode/download/utf-zip.html)
and pins the [field definitions and reuse notice](https://www.post.japanpost.jp/service/search/zipcode/download/readme.html).
It validates all 15 fields, seven-digit string codes, update flags, row/byte
limits and the single expected ZIP entry. It rejects altered rights text,
unapproved redirect hosts, malformed CSV and retired rows in a current file.

The normalizer preserves fallback, no-town, partial/qualified and multiple-town
semantics. An ordinary row without exception flags is still locality context,
not proof that a whole-town polygon is available. Building names, civic house
numbers, parcel identities and geometry are never inferred from the CSV.
The ordinary file does not include the separately published business-specific
assignment file.

The committed intake report contains counts, source/terms digests and validation
results only. The source archive, source locality rows and normalized JSONL
exist only in memory during this intake. No source snapshot or deployed pack
had been published by that intake step; Japan remained M1 / `in_progress`.

The next Japan step is now implemented: the [scoped real-source runtime](postal-context-japan-m2-runtime.md)
builds a non-synthetic, digest-pinned Chiyoda pack and checks all 485 selected
postcodes through the shared loader, with actual AGID v1 HTTP API checks.
Source exceptions/flags are retained and geometry/building information is not
invented. The [validation report](../reports/postal-context-m2/jp-chiyoda-runtime-2026-08-28.json)
remains explicitly publication-pending. No country maturity has been promoted.

Next: obtain approval for the separate public country repository, retain the
source/rights evidence there, publish immutable artifacts, verify remote digests
and replay before reviewing Japan's experimental M2 criterion. Do not repeat
the same approval request or build merely because the heartbeat wakes up.
Nationwide intake is not nationwide runtime, address or building coverage.

The 2026-08-28 heartbeat found no new publication authority. Japan is now
`blocked` / `M1_metadata`, with the previous intake/runtime evidence preserved.
The seven-day review date does not grant permission or trigger a rebuild.
No new source data was downloaded and no repository or public artifact was
created during this hold review. The next run selects AE (United Arab Emirates)
from pending Asia entries; no second country was started in this run.

## United Arab Emirates: source contract review

The 2026-08-28 AE run reviewed the previously missing country-specific M2
definition. The [AE contract and review](postal-context-united-arab-emirates-m2.md)
separate branch-scoped PO Boxes, Dubai entrance locators and Abu Dhabi Onwani
postal codes. It is not correct to label all AE addressing as no-postcode.
Reference metadata now stays outside postal-validation eligibility, including
exact historical-document matches that must not inherit generic UPU authority.

The [reference probe report](../reports/postal-context-m2/ae-reference-review-2026-08-28.json)
contains document hashes and actual access failures, not source-data records.
AE remains **M1_metadata / blocked**, with zero retained data snapshots or
published artifacts. Its M2 criterion requires a rights-cleared real scoped
dataset, reproducible transformation, immutable public evidence and
namespace-aware AGID checks. No country-only AE runtime was enabled.

Next read-only review is 2026-09-04, after the pending-country pass. Any new
authentication, contractual acceptance or public destination still needs
explicit authority. Japan's approval hold is unchanged. The next country is
**AF (Afghanistan)**; no second country was started in this AE run.

## Afghanistan: live area preflight

The 2026-08-28 AF run formalized the existing country M2 requirements as
a machine-readable stage without relaxing rights, temporal, geometry or
privacy conditions. The [source review](postal-context-afghanistan-m2.md)
verified one public postal-area response with a matching six-digit code:
MultiPolygon, one polygon/ring and 126 positions. No raw response was kept.

The report records three verified reference documents and three direct
operator-site access failures. A live polygon and a document hash do not
replace licensed, retained, editioned source data. AF remains M1 / blocked.
Full CRS/topology, real-data AGID checks and immutable publication are
still required. Source webpages are no longer eligible validation datasets.

Next read-only review is 2026-09-04 after all pending countries. JP and AE
holds are unchanged. The next pending country is AM; no second country
was started during this AF run.

## Armenia: office-directory and rights preflight

The 2026-08-28 AM run retained its original experimental M2 definition.
The [source and quality review](postal-context-armenia-m2.md) verified eight
official references and inspected a pinned nine-page HayPost directory:
428 rows, 427 distinct codes, one repeated-code group and four unresolved
same-baseline extraction rows. No office address became a civic-address
assertion and no polygon or building link was inferred.

AM remains M1 / blocked. Current assignment edition, reuse rights, complete
row identity, approved immutable artifacts and real-data AGID validation
are still required. Reference URLs now stay outside validation eligibility.
The next read-only review is 2026-09-04 after the pending-country pass.
JP, AE and AF are unchanged; the next pending country is AZ.
No second country was started in this AM run.

## Azerbaijan: public branch-directory quality review

The 2026-08-28 AZ run retained the original experimental M2 definition.
The [source review](postal-context-azerbaijan-m2.md) inspected the public
Azərpoçt branch payload: 993 rows, 993 distinct codes, 139 leading-zero codes
and 6,512 street hints. All record types are empty; presentation IDs equal
row indexes. Eleven coordinate pairs fail strict decimal parsing, one is
out of range, and eight street hints lack number strings. Nothing was repaired
or converted into civic addresses, building links or postal polygons.

Eight official reference probes returned expected content. Official guidance
defines public address fields, but current export/edition, exact reuse rights
and immutable artifacts remain unverified. One address-portal fetch failed;
the live non-www IDDA open-data portal was confirmed. No blanket restriction
on all AZ public data is inferred. AZ remains M1 / blocked, not M2.

Reference entries are metadata-only/context-only for AGID validation.
The next read-only review is 2026-09-04 after the pending-country pass.
JP, AE, AF and AM holds are unchanged. The next pending country is BD;
no second country was started during this AZ run.

## Bangladesh: typed-office table and TLS preflight

The 2026-08-28 BD run preserved the original complete national M2_assignment
criterion. The [source review](postal-context-bangladesh-m2.md) inspected
2,871 rows across Dhaka/Gazipur district pages and an eastern-circle table.
There are 244 blank code rows and one non-code sentinel. The regional table
has 475 distinct codes across 2,551 offices; shared codes are not unique office
identifiers. Missing fields and ambiguous labels are not filled or merged.

Current hosts worked with Windows native TLS verification; the legacy portal
still failed verification. No TLS bypass, account, paid service or data
publication was used. Six references were verified and three reference
fetches failed. Content dates (2022/2025) remain distinct from 2026 site footers.

BD stays M1 / blocked: complete current national coverage, exact reuse rights,
retained source snapshots, immutable artifacts and real AGID checks remain
unverified. M2 does not require fabricated polygons or M3/M4 building claims.
Prior country holds are unchanged. Next read-only review is 2026-09-04 after
the pending-country pass; the next pending country is BH. No second country
was started during this BD run.

## Bahrain: landmark context and open-data licence review

The 2026-08-28 BH run kept its complete M2_assignment definition. The
[source review](postal-context-bahrain-m2.md) inspected all 27 public-landmark
rows (20 distinct block labels, no explicit postcode relation). Metadata before
and after retrieval matched. Point records and their metadata envelope are
not postal polygons; repeated blocks and numbered counters are not stable IDs.

Five reference documents and the embedded portal terms were verified. The
portal-linked government open-data licence v1.0 (20 May 2025) positively covers
eligible government open datasets outside the portal too. Earlier blanket
portal-only wording was corrected without granting access to controlled records.
The postal directory remained unavailable in bounded Node/native-TLS checks.

BH remains M1 / blocked: a complete current postcode-block assignment artifact,
its exact applicable rights, retained snapshots, immutable publication and real
AGID checks are missing. No source rows, geometry or subscriber data were
published. The next read-only review is 2026-09-04 after the pending-country
pass; the next pending country is BN. Earlier countries are unchanged and no
second country was started in this BH run.

## Brunei: historical booklet and current operator attestation

The 2026-08-28 BN run retained the existing M2_source_attested target and
defined its previously missing national current-assignment criterion. The
[source review](postal-context-brunei-m2.md) verified the 2026 PosBru transition
and obtained the public SKN-linked 52-page historical booklet, SHA-256 pinned.
Its 551 rows separate 438 locality, 94 government-organization and 19 branch
records. District-heading counts differ and one branch serial is missing;
no row, polygon, address or building relation was inferred or repaired.

Eleven references were verified. The old post.gov.bn host failed resolution;
the current PosBru site works. DEPS positive reuse terms are site-specific,
not a postal or SKN licence. The booklet's 2018 metadata is not superseded by
a 2026 HTTP modification timestamp. Exact postal reuse rights, current source
attestation, approved immutable artifacts and real AGID checks remain missing.

BN stays M1 / blocked. All prior country holds are unchanged. Next read-only
review is 2026-09-04 after the pending-country pass; the next pending country
is **BT (Bhutan)**. No second country was started in this BN run.

## Bhutan: live district locator and duplicate-source review

The 2026-08-28 BT run retained M2_source_attested and defined its missing
current national assignment criterion. The [source review](postal-context-bhutan-m2.md)
queried all 20 public Dzongkhag options: 76 rows, 38 distinct postal codes
and office tuples, each tuple appearing twice. Fifty-six opening row tags
are missing. No missing fields or invalid code syntax were observed, but
these checks do not prove a current, complete national allocation edition.

Six reference documents were verified; the legacy postcode PDF returned 404.
The form and one repeated district had unchanged hashes. The multi-request
retrieval is not atomic and exact reuse rights remain unverified. NLCS map
access, cadastral descriptions and eSakor FAQs remain non-postal context.
No source row, polygon, address, building relation or private record was
published. Catalog identity alone no longer grants BT validation authority.

BT remains M1 / blocked. Approved immutable data artifacts, current source
attestation, exact rights and real AGID checks are still required. Next
read-only review is 2026-09-04 after the pending-country pass. Prior country
holds are unchanged; the next pending country is **CN (China)**. No second
country was started in this run.

## China review — 2026-08-28

CN remains M1 / blocked. The missing named M2 criterion now preserves the
existing requirement for independently licensed assignment geometry and
separate address/building review. No official polygon is fabricated.

A bounded public outlet API sample yielded 20 rows, 17 distinct six-digit
codes and three codes shared by different office labels. The reported
directory total of 54,631 is not national postal coverage. Four official
references were checked; Tianditu API documentation timed out from this host.
The old China Post link is a 2015 legal article republished in 2018, not an
assignment dataset; its catalog role now prevents strong validation by name
alone. See [CN review](postal-context-china-m2.md) and the source/check reports.

Current national assignments, exact reuse rights, geometric relations, approved
immutable artifacts and real AGID verification remain unresolved. Recheck
2026-09-04 after pending countries. All prior country entries are unchanged.
Next pending country: **GE (Georgia)**; no second country was started.

## Georgia review — 2026-08-28

GE remains M1 / blocked; its existing M2_experimental definition is unchanged.
The old postcode URL serves the homepage. The current public form returned 64
cards, including 50 initially hidden cards, across three display groups and 11
distinct codes; 46 code strings begin with zero. No rows or geometry are retained.

Four references and the NSDI terms were verified. The catalogue has 159 unique
metadata IDs across 217 theme occurrences, not 217 separate datasets. Address
Layer (92) and Named Streets (35) declare CC BY-NC-ND 4.0; Registered Building
(80) declares CC BY-NC 4.0. These conditions are present and differ, not an
unqualified open licence. See [GE review](postal-context-georgia-m2.md).

A current permitted scoped postal snapshot, exact planned-use rights, immutable
publication and real AGID validation remain unresolved. Recheck 2026-09-04 after
the pending pass. Earlier countries are unchanged. Next is **HK (Hong Kong)**;
no second country was started in this run.

## Hong Kong review — 2026-08-28

HK now has an individually reviewed M2_scoped_address_context definition and
remains M1 / blocked. Hongkong Post confirms no local postcode system; official
postal geometry stays none. The [HK review](postal-context-hong-kong-m2.md)
separates ALS bilingual address fields, GeoAddress locations and AGID cells.

Six official references passed. Two public-government-building query responses
contained building/number fields and WGS84 points; both passed the in-memory
candidate adapter and coordinate-cell roundtrip. Repeat and GeoAddress queries
matched. Source rows are not retained. Score is not confidence, date is not
validity, and a location ID is not a unique textual address or postal polygon.

DATA.GOV.HK v1.2 permits conditional commercial/noncommercial reuse; this is
not a blanket rights-denied finding. Approved immutable publication, retained
rights-reviewed snapshots and a real no-postcode pack loader/API are missing.
The 2026-09-04 reminder does not authorize new publication or automatic retries.
All previous entries are unchanged. Next pending country: **ID (Indonesia)**;
no second country was started during this run.

## Indonesia review — 2026-08-28

ID remains M1 / blocked; the pre-existing complete M2_assignment criterion is
unchanged. Two bounded official queries produced 1 and 20 rows with no missing
or invalid codes; the 20-row repeat matched bytes and normalized tuples. No
rows, coordinates, geometry or civic/building relations are published.

The public SDI label conflicts with private=true, isopen=false, null licence
and rejected review metadata. The publisher request returned 403. The source
catalog now describes web-search metadata, not confirmed bulk-open-data access.
See [ID review](postal-context-indonesia-m2.md) and its aggregate source report.

Current complete assignments, explicit reuse rights, retained snapshots,
approved fixed artifacts and actual AGID loader/API checks remain missing.
Recheck on 2026-09-04 after the pending-country pass; no restricted resources,
paid services or new destinations are authorized. Earlier entries are
unchanged. Next pending country: **IL (Israel)**; no second country was started.

## Israel review — 2026-08-28

IL remains **M1_metadata / blocked**. The missing M2 stage is now explicitly
defined as **M2_licensed_assignment**, formalizing the existing assignment,
object-type, rights, privacy and territorial rules; all nine hard blockers
are unchanged. Two official government street API pages yielded 100 row
observations, with zero per-page missing/invalid fields or duplicate keys;
the 50-row repeat and metadata matched. Street codes recur across localities,
so their comparison key includes the locality code. These are not postal
assignments, house numbers or building relations; no geometry was produced.

Current terms could not be pinned (Israel Post 403; Data.gov.il pages 404),
although the public data API worked. Empty item licence fields alone are not
a ban or a grant. The dated UPU PDF was hashed and visually checked only as
format/routing reference. Israel Post catalog readiness is metadata-only,
without changing its postal-operator authority. See the [IL review](postal-context-israel-m2.md)
and aggregate receipts for exact scope, digests and remaining evidence gates.

Recheck public references after the pending-country pass and
2026-09-04T12:24:05.981Z. No source rows, paid services or new destinations.
Earlier countries are unchanged. Next pending country: **IN (India)**;
no second country was started.

## India review — 2026-08-28

IN remains **M1_metadata / blocked** with the existing complete
**M2_assignment** definition and all 13 blockers unchanged. The official
directory resource and catalogue returned HTTP 200 but displayed sandbox,
empty-result or placeholder evidence. A title or GODL footer does not prove
current data. The substantive GODL text and official Swagger were verified;
the API requires a key and a keyless catalogue request returned 400. No
credential was used and no current assignment rows were obtained: data-quality
rates are unmeasured, not zero-percent errors.

The 2025 official boundary announcement and live DIGIPIN explanation remain
references, not current geometry, office assignments or building relations.
The shared source catalogue records web-reference availability for the PIN
directory/boundary sources while retaining their authority and metadata-only
readiness. See the [IN review](postal-context-india-m2.md) and aggregate receipts.

Public references may be rechecked after all pending countries and
2026-09-04T12:52:54.980Z; authentication and publication still require
explicit approval. Earlier country entries are unchanged. Next pending
country: **IQ (Iraq)**; no second country was started.

## Iraq review - 2026-08-28

IQ remains **M1_metadata / blocked**. Its missing M2 stage is now individually
defined as **M2_licensed_assignment**, preserving all nine prior blockers,
five-digit non-area objects, unverified migration candidates and jurisdiction
boundaries. Six references passed; the Iraq Post homepage returned 403.

The public NOGP API works without credentials and declares conditional CC BY
4.0 with individual-file terms. Discovery totals are 41 datasets and 88 files,
not postal coverage. Three postal-keyword searches returned no matches;
this is not proof of national data absence. Two public ArcGIS metadata items
have null licence/access-information fields. Neither a 2019 office map nor
the 2025 StoryMap proves current assignments, reusable polygons or buildings.
See the [IQ review](postal-context-iraq-m2.md) and aggregate receipts.

No current assignment rows were acquired; quality rates are unmeasured.
The Windows TLS adapter retains normal certificate checks. No private data,
paid operation or new publication destination was used. Current rights-cleared
source data, fixed publication and actual AGID loader/API evidence remain
missing. Recheck public references after all pending countries and
2026-09-04T13:19:11.991Z; restricted access/publication still require approval.
Earlier country entries are unchanged. Next pending country: **IR (Iran)**;
no second country was started.

## Iran review - 2026-08-28

IR remains **M1_metadata / blocked**. Its missing M2 stage is now individually
defined as **M2_licensed_assignment**, preserving all nine original blockers,
ten-digit non-area objects, five-digit forwarding context, non-postcode postal
services, operational GNAF/certificate rights and temporal/jurisdiction rules.

Four public postal entry requests timed out. NSDI redirected to its government
host and returned 502; the dated UPU PDF URL redirected through the homepage
and returned 404. No current reference bytes or source-document hashes were
retained. Search-extracted 10/2023 format text is cached context only, not a
fresh PDF or visual verification. These observations prove neither national
data absence nor a reuse ban. See the [IR review](postal-context-iran-m2.md).

No current assignment rows were acquired; quality rates are unmeasured, not
zero-percent errors. Iran Post keeps its postal-operator authority, but its
catalog readiness is metadata-only: a source label cannot establish a current
assignment. No geometry or address/building relation was generated.

Recheck public references after all pending countries and
2026-09-04T13:42:05.876Z; restricted access/publication still require approval.
Current licensed assignments, reproducible full-data checks, approved fixed
data artifacts and real AGID loader/API verification remain missing. No paid
operation or new destination was used. Earlier country entries are unchanged.
Next pending country: **JO (Jordan)**; no second country was started.

## Jordan review - 2026-08-28

JO remains **M1_metadata / blocked**, with its missing M2 stage individually
defined as **M2_licensed_assignment**. All seven existing hard blockers remain.
The [JO review](postal-context-jordan-m2.md) records one unique dated CSV behind
two resource IDs and a repeat: 240 office rows, 30 non-five-digit cells (12.5%),
zero duplicate governorate/name/code candidate keys and one repeated valid-code
occurrence. Office rows are not current assignments, polygons or buildings.

The Arabic licence v1.0 and visibly unofficial English translation were hashed
and reviewed. Conditional reuse is not categorically forbidden, but the item
licence URL points to Instagram and portal terms pages are placeholders. The
UPU 09/2004 sheet remains syntax-only. Policy sections 104/131 call for street
addressing; the unsupported carrier-route-sorting attribution was corrected.
Operator access returned 403; bounded publisher discovery returned 400, not
an empty national inventory. No private rows or new destination were published.

Current full assignments, exact rights/validity, fixed data publication approval
and actual AGID loader/API evidence remain unresolved. Public references may
be rechecked after all pending countries and 2026-09-04T14:11:12.752Z.
No restricted access or publication is authorized by that date. Earlier country
entries are unchanged. Next pending country: **KG (Kyrgyzstan)**;
no second country was started.

## Kyrgyzstan review - 2026-08-28

KG remains **M1_metadata / blocked**. Its missing named M2 stage now retains
the original independently licensed geometry, CRS/topology, crosswalk and
civic/building/privacy review requirements; all ten hard blockers are unchanged.
The [KG review](postal-context-kyrgyzstan-m2.md) profiles the full captured
directory: 2,059 observations, 2,049 numeric-code rows, 10 mobile markers,
871 distinct codes and 26 excess duplicate observation keys (1.263%).
One leading-zero code is preserved. None is promoted to a current assignment.

The repeated literal hash and 2025 publication/modified dates match. Six
references were verified, including the visually reviewed UPU 03/2019 sheet;
the UPU designated-operator page returned HTTP 500. Windows native TLS verifies
the postal site without disabling certificate checks. Portal searches are
bounded metadata discovery: an index keyword returned 117 results, of which
20 were inspected; this is not postal coverage or proof of absence.

Exact current validity/reuse rights, independently licensed geometry, fixed
data publication approval and actual AGID loader/API evidence remain missing.
No raw row, geometry, civic/building link, paid service or new destination was
published. Public references may be reviewed after all pending countries and
2026-09-04T14:37:17.782Z. Restricted access and publication still require
approval. Earlier entries are unchanged. Next pending country: **KH (Cambodia)**;
no second country was started.

## Cambodia review - 2026-08-28

KH remains **M1_metadata / blocked**. The missing M2 name now preserves the
original licensed geometry, CRS/topology, administrative/civic-building and
privacy/licence requirements; all nine blockers remain unchanged. The
[KH review](postal-context-cambodia-m2.md) profiles all six CSV resources as
three byte-identical language pairs: 1,887 active source observations.
District tables have 791 blank padding records and one duplicate postal code.
A transcription conflict is confirmed against primary Prakas physical page 26;
other administrative/postal differences, including 38 commune-to-district
prefix mismatches, remain diagnostics. No source value is automatically fixed.

Actual bytes, SHA-256, CKAN version/dates and repeat checks are pinned. Three
publisher size fields are stale. Prakas has 59 image-only pages; selected
full-page review is not full-row reconciliation. The UPU sheet was recovered
and visually verified as 11/2018; it remains a dated format reference only.

Full primary reconciliation, exact rights (including the ODC commercial-scope
and CC-grant ambiguity), independently licensed geometry, publication approval
and actual AGID pack/loader/API evidence remain missing. No raw dataset,
geometry, civic/building link, new destination or paid service was published.
Public reference retry is due after all pending countries and 2026-09-04T15:05:07.471Z.
Earlier country entries are unchanged. Next pending country: **KP**;
no second country was started.

## North Korea review - 2026-08-28

KP remains **M0_inventory / blocked**. A missing country-specific M2 definition
now requires current rights-cleared real administrative/locality context and
independently licensed geometry, reproducible validation, immutable publication
and actual AGID loader/API evidence. No code or fixture is counted as M2 data.

The [KP review](postal-context-north-korea-m2.md) pins four verified UPU references.
The PDF's KP not-required table is **Sep. 2025**; a different table is Aug. 2026.
A later file date does not update KP's table or prove permanent absence. The
unsupported three-plus-three format and example were removed from KP JSON/YAML;
optional manual input and existing country/administrative identities are preserved.
KP is not added to the production Postal Context runtime. P0 seeds, planning cells
and virtual codes do not become official postal areas or address/building links.

No current licensed data release, production geometry, civic/building relation or
approved immutable data artifact was obtained. Missing/duplicate assignment rates
are unknown, not zero; this is not proof of national data absence. No raw data,
new destination, private query, contract or paid operation was published/performed.
Public-only retry is due after all pending countries and 2026-09-04T15:34:04.282Z.
Earlier country entries are unchanged. Next pending country: **KR (South Korea)**;
no second country was started.

## South Korea review - 2026-08-28

KR remains **M1_metadata / blocked**. The original assignment-plus-National-
Basic-District M2 definition and ten hard blockers are preserved. The
[KR review](postal-context-korea-m2.md) verifies seven primary reference bodies
and two matching downloads of the public 2026-08-11 PO-box reference ZIP.
It has 996 observations, 432 codes and 21 excess exact duplicate observations.
Leading zeros and empty fields are preserved; blank range endpoints are not
filled with zero. HWP documentation is hashed, not interpreted. These are
non-area PO-box observations, not validated national assignments or geometry.

The electronic-map catalog lists KOGL Type 1 and explicitly requires application,
identity confirmation and purpose review. Its PPTX/one catalog row is not an
obtained current district vector. Two guidance network failures do not prove
data absence. Six KR source registrations now explicitly remain metadata-only;
catalog identifiers cannot alone assert strong address/building validation.

Current licensed assignment and official district data, full real-data validation,
approved immutable publication and actual AGID loader/API evidence are missing.
No raw source/civic/building records, new destination, private query, contract,
paid operation or deployment was published/performed. Public-only retry follows
all pending countries and 2026-09-04T16:07:01.229Z.
Earlier country entries are unchanged. Next pending country: **KW (Kuwait)**;
no second country was started.

## Kuwait review - 2026-08-28

KW remains **M1_metadata / blocked**. Its existing **M2_assignment** requires
complete rights-cleared current block and P.O. box tables, not a polygon. The
original criterion, twelve hard blockers and five-digit format are unchanged.

The [KW review](postal-context-kuwait-m2.md) verifies seven primary references.
The public Ministry UI advertises 4,262 P.O. box and 1,396 block observations.
Only first/last pages were inspected: 28 sampled rows, eight with four-digit
codes. Values are not zero-padded or repaired; sample rates are not national
quality estimates. Initial HTML has empty loading placeholders, not data rows.
The DOM capture hash is not a verified network data artifact or atomic snapshot.

Bulk reuse/redistribution rights remain unverified; the privacy-policy target
is Under Development. The visually reviewed UPU sheet is printed 07/2002, not
a current assignment directory. Municipality metadata failed to load; this
does not prove data absence. No private PACI queries or CSB terms acceptance
were performed. The Ministry catalog now remains metadata-only for validation;
a source name/ID/URL alone cannot assert a strong current assignment.

Complete current both-class data, primary reconciliation of malformed samples,
exact rights, approved immutable publication and real AGID loader/API evidence
are still required. No source cells, geometry, addresses/buildings, new
destination, paid operation or deployment was published/performed. Public-only
retry follows all pending countries and 2026-09-04T16:38:41.187Z.
Earlier country entries are unchanged. Next pending country: **KZ (Kazakhstan)**;
no second country was started.

## Kazakhstan review - 2026-08-28

KZ remains **M1_metadata / blocked**. The existing runtime Promotion conditions
are now formalized as **M2_typed_assignment_geometry**: typed current assignments
plus independently licensed point or area geometry, validity, CRS/topology,
RKA/building-link, privacy and jurisdiction review. All ten hard blockers remain;
a postal polygon or automatic exact building relation is not presumed.

The [KZ review](postal-context-kazakhstan-m2.md) verifies seven primary reference
bodies, distinguishes three HTML app shells and records one TLS-verification
failure. Three legal articles are digest-bound with separately reviewed effective
dates. The visually reviewed UPU sheet is printed 07/2025. Service-26 public
documentation requires a bearer token and shows two null-coordinate examples;
these are not live assignment rows or national quality metrics. Its malformed
schematic is not evidence of malformed live responses. RKA descriptive metadata
was corrected from 16 digits to 16 characters; postcode validators are unchanged.

All eleven KZ official discovery references are metadata-only for validation.
Current complete licensed assignments, independent licensed geometry, explicit
links, approved immutable publication and actual AGID release verification remain
missing. No source records, addresses/buildings, private queries, paid operations,
new destinations or deployment were performed/published. Public-only retry follows
all pending countries and 2026-09-04T17:08:16.042Z.
Earlier country entries are unchanged. Next pending country: **LA (Laos)**;
no second country was started.

## Laos review - 2026-08-28

LA remains **M1_metadata / blocked**. Its existing runtime Promotion conditions
are formalized as **M2_assignment_geometry**, with all eight hard blockers
unchanged. Point, route or area geometry needs independent rights and a proven
postal relation; no polygon or exact building link is presumed.

The [LA review](postal-context-laos-m2.md) verifies eight primary reference
bodies, distinguishes one loading shell and records two retrieval failures.
The operator displays 18 regional totals summing to 8,172 rows, not distinct
postcodes. Ten sampled first-region rows have ten distinct texts and one code;
repeated codes are not duplicate assignments. Laopedia revision 1784 has
partial lists, missing detail, a repeated village token and an unclosed list;
none are silently expanded or repaired. NFMS metadata has no verified postal
join or reuse licence. Current applicable legal status remains unverified.

All seven LA official discovery sources remain metadata-only for validation.
Complete current licensed assignments, independent licensed geometry, approved
immutable publication and actual AGID loader/API verification are missing.
No source cells, census/land records, new destination, paid operation or
deployment was published/performed. Public-only retry follows all pending
countries and 2026-09-04T17:43:12.611Z.
Earlier country entries are unchanged. Next pending country: **LB (Lebanon)**;
no second country was started.

## Lebanon (LB) — 2026-08-28 public-source review

LB remains **M1_metadata / blocked**, with its existing assignment-plus-independent-geometry
M2 conditions formalized and all eight hard blockers preserved.
[Source receipt](../reports/postal-context-m2/lb-source-review-2026-08-28.json),
[engineering checks](../reports/postal-context-m2/lb-checks-2026-08-28.json) and
[country review](postal-context-lebanon-m2.md) separate reference evidence from data.

Sixteen bounded public GETs yielded fourteen verified reference bodies and two
retrieval failures. UPU Lebanon format sections are August 2026; four or eight
digits remain unchanged, and the spaced eight-digit value has ten characters.
LibanPost initial form controls are not current assignment rows. Atlas item
terms and upstream HDX CC BY-IGO metadata concern administrative context, not
postal authority. Neither advertised administrative counts nor short resource
hashes are verified feature counts or downloaded SHA-256. No source rows,
geometry resources, private records, paid operations or deployment were produced.

All eight LB official discovery sources are metadata-only for validation.
Current licensed postal assignments, independent geometry with an explicit
crosswalk, approved immutable publication and actual AGID verification remain
missing. Public-only retry follows all pending countries and 2026-09-04T18:15:15.296Z.
The other 251 country entries are unchanged. Next pending country: **LK (Sri Lanka)**;
no second country was started this run.

## Git, privacy and authority boundaries

Use an isolated worktree from the cumulative remote branch. Preserve every
pre-existing user change, including incomplete SDK and Luxembourg work. Keep
raw national dumps, personal/customer records and heavy indexes out of AGID
Git. Do not create repositories, paid services, public data destinations or
production deployments without explicit approval. No force pushes or merges
to main. Keep `origin` unchanged and push only to the explicit approved
`veygrit-sys/Address-Grid-ID` URL, SSH first and HTTPS if SSH is unavailable.

After focused/shared tests, typechecking and diff review, commit only completed
in-scope changes. Verify GitHub's exact branch SHA before removing that run's
temporary worktree, data and local branch. Never delete unpublished work or
existing user changes. Each report names the country, actual maturity,
remaining blockers, tests, branch, commit URL and next country/action.

## Sri Lanka (LK): M1 contract, M2 blocked — 2026-08-28

LK had no country contract or M2 definition at base `5cbcaf70ee94dfd5b854ac99f8b30735cde17ab8`. Added its own assignment/independent-geometry criterion, preserving all other countries. Thirteen official reference bodies/sections were verified and three retrieval failures retained. Each initial postal HTML selector has 2,111 candidates including 5 leading-zero codes; these are not national coverage or current licensed assignments. Five NSDI administrative schemas are not postal polygons. GN officer-contact fields are detected without requesting any feature values.

[LK review](postal-context-sri-lanka-m2.md) and [source receipt](../reports/postal-context-m2/lk-source-review-2026-08-28.json) record provenance, hashes, quality limits and privacy/publication gates. LK remains disabled in the generic Postal Context runtime. No source rows, real geometry, civic/building relations, immutable data artifact or actual LK runtime verification exist. Source metadata cannot upgrade address trust. The legacy lookup-URL field now points to the public HTML search (not a machine API); five-digit syntax, languages and user address fields remain intact.

Revisit public sources only after all pending countries and `2026-09-04T18:49:33.683Z`; no restricted data, purchase, contract, new publishing destination or extra charge is authorized. Engineering/synthetic tests do not count as M2.

## Myanmar (MM): permission-gated M1, M2 blocked — 2026-08-28

Preserved the existing M2_source_attested target and all twelve hard blockers; added explicit real-data, rights, geometry, immutable-publication and AGID verification requirements. Seven initial references were byte-verified offline and three acquisition failures retained. UPU 11/2022 remains a syntax reference. MIMU v9.7 (January 2026) listing statistics are administrative metadata, not postal assignments or validated rows. Its old v9.6 source ID remains stable.

[MM review](postal-context-myanmar-m2.md) and [source receipt](../reports/postal-context-m2/mm-source-review-2026-08-28.json) document the dedicated MIMU terms and the stop on further automated requests. Written provider permission and explicit user approval are required; the review reminder `2026-09-04T19:19:35.082Z` is not permission and does not trigger automatic MM retry. YCDC remains local controlled service context. No production source rows, geometry, civic/building relations or fixed data artifacts were published; existing seven-digit synthetic runtime remains unchanged.

Other 251 entries are unchanged. Next pending country: **MN**; no second country was started.

## Mongolia (MN): edition-aware M1, M2 blocked — 2026-08-28

Preserved the M2_source_attested target and all eleven blockers; added its explicit country-specific definition. Thirteen reference documents were byte-verified offline and five acquisition failures recorded. CRC sources conflict on the 2025 count (2721 versus 2720) and standard descriptions. The 2024 directory and UPU 01/2019 were visually reviewed; extended organization examples prevent a blanket nine-digit repeal claim. Five/nine-digit syntax and the synthetic runtime remain intact.

[MN review](postal-context-mongolia-m2.md) and [source receipts](../reports/postal-context-m2/mn-source-review-2026-08-28.json) separate dated documents from reusable assignments. NSO selectors preserve different regional keys sharing a label and incompatible indicator units. Official portal names/URLs alone no longer confer strong address validation. No licensed production assignment/geometry dataset, building relations, fixed data artifacts or real AGID verification were completed.

Revisit public references after all pending countries and `2026-09-04T19:47:14.790Z`; controlled services and publication remain approval-gated. Other 251 entries are unchanged. Next pending country: **MO**; no second country was started.

## Macao (MO): no-postcode M1 contract, M2 blocked — 2026-08-28

The base had no MO manifest or M2 definition. Added the country-specific M2_scoped_address_context target and nine explicit blockers without changing MO identity or other countries. CTT FAQ 17 in three languages confirms no local postcode system; 000000 is only an online-form workaround. Postal code and official postal geometry stay null/none. Gazette evidence binds the 2026-06-01 DSCC/DSSCU authority transition and mapping reproduction permission/possible-fee requirement.

[MO review](postal-context-macao-m2.md) and [source receipts](../reports/postal-context-m2/mo-source-review-2026-08-28.json) distinguish six verified policy/legal/migration references, four unresolved HTML shells and three acquisition failures. Identical DSSCU routes and identical data-portal/terms routes are transport evidence only. Big5 Gazette decoding, UTF-8 CTT content and Portuguese HTML entities are checked explicitly. No current rights-cleared address dataset, production geometry, civic/building relations, fixed data artifact or real AGID verification exists. Generic MO runtime remains disabled and source names/URLs cannot confer strong address trust.

Revisit public references after all pending countries and `2026-09-04T20:16:33.259Z`; controlled access, mapping reproduction, purchases and publication remain approval-gated. No fees or extra cloud charges incurred. Other 251 entries are unchanged. Next pending country: **MV**; no second country was started.

## Maldives (MV): schema-aware M1, M2 blocked — 2026-08-28

Retained the existing M2_source_attested target, all twelve blockers and five-digit synthetic runtime; defined the missing country-specific M2 criterion. Six reference documents were verified, one viewer shell remained unverified, four HTTP 403 and one HTTP 404 were recorded. No access denial was bypassed. Current Maldives Post assignments and exact reuse rights remain unavailable or unverified.

[MV review](postal-context-maldives-m2.md) and [source receipts](../reports/postal-context-m2/mv-source-review-2026-08-28.json) bind UPU printed 09/2004 separately from 2020 PDF metadata, duplicate 20XXX across table groups, and the exact OneMap service/item/layer chain. Public item access with empty licenseInfo is not a reuse grant. Fifteen layer fields include nullable FCODE without a unique index, no GlobalID and string coordinates; geometry is Web Mercator, not inferred longitude/latitude or survey UTM. Statistics links preserve theme, grain and different listing/path/census dates. No feature query, real assignment/geometry/building records, fixed data artifacts or actual AGID verification was performed.

Revisit public references after all pending countries and `2026-09-04T20:38:14.966Z`; restricted access, purchases, contracts and publication remain approval-gated. Other 251 entries are unchanged. Next pending country: **MY**; no second country was started.

## Malaysia (MY): real dictionary and AGID observation, M2 blocked — 2026-08-28

Preserved the M2_source_attested target and twelve blockers; supplied the missing country criterion. The new MCMC data.gov.my CC-BY-4.0 dictionary (2026-06) was acquired and all 2,932 rows reconciled against the catalog's embedded rows. Leading zeroes survive; four whitespace-affected rows are tracked, one normalized duplicate is coalesced and the one multi-city postcode remains ambiguous. There are 2,931 normalized relations and 2,930 distinct codes.

[MY review](postal-context-malaysia-m2.md), [source receipts](../reports/postal-context-m2/my-source-review-2026-08-28.json) and [real observation checks](../reports/postal-context-m2/my-real-observation-2026-08-28.json) separate real data from source metadata and synthetic tests. A dedicated dictionary authority permits only typed city/state context, never civic/building or geometry authority. Local digest-pinned AGID loading, every distinct postcode and four HTTP checks passed. No coordinate geometry, civic/building relation, immutable data publication or production deployment. The legacy Pos page is HTTP 200 soft-404; MyGDX catalog access is not verified production API access. UPU 02/2010 and MyGeo release-policy pages remain reference evidence.

M2 remains blocked on approved immutable publication/re-download and reviewed current-validity scope. Review reminder: 2026-09-04T21:05:12.256Z; explicit publication approval is still required. Raw files and local experiment packs are excluded from Git and removed after verified code push. Other 251 entries remain unchanged. Next pending country: **NP**; no second country started.

## Nepal (NP): federal office/ward contract, M2 blocked — 2026-08-28

Added the missing Nepal-specific M2_federal_assignment_context criterion at M1. The acquired official GPO table has 753 structurally valid local-unit rows, 84 non-assignment headings and 13 repeated locality labels across contexts. Explicit ranges total 6743 arithmetic ward candidates, but no ward records were materialized and national coverage/current validity were not independently proved. Five/seven-digit syntax and separate legacy/federal identity are now recorded; NP generic data runtime remains disabled.

[NP review](postal-context-nepal-m2.md), [source receipts](../reports/postal-context-m2/np-source-review-2026-08-28.json) and [engineering checks](../reports/postal-context-m2/np-checks-2026-08-28.json) distinguish eight verified reference/table bodies, one viewer shell and two acquisition failures. Historical UPU 06/2012 and purpose-limited survey terms are not current assignment or open-redistribution grants.

Reuse rights, source edition/effective validity, approved immutable data publication and actual AGID data verification remain outstanding. No raw rows, private data, geometry or civic/building relations were published. Public-only review follows all pending countries and 2026-09-04T21:30:32.413Z; contracts, paid operations and new publication destinations still require approval. Other 251 entries remain unchanged. Next pending country: **OM**; no second country started.

## OM — 2026-08-28: regional POIs reviewed, M2 still blocked

Preserved `M2_office_assignment`: a complete rights-cleared office/code artifact. The Al Dakhiliyah open-data listing and its linked licence permit scoped reuse, but its 12-record workbook has no postal-code column. FID is not a postcode. One XY pair is shared by two records; NAMEAR is missing once and TOWN twice. No deduplication, imputation, CRS assumption or geometry generation was performed. File metadata is from 2024-05-02 despite the listing reference period 2024–2025; current office validity is unverified.

Nine documents/workbook responses were byte/hash-verified and one old policy URL failed acquisition. UPU January 2026 semantics, the two distinct open-data licences and legal restrictions were reviewed separately. Oman Post directory harvesting was not performed. No current national assignment artifact, immutable data release or real AGID loader/API proof exists; synthetic runtime tests do not satisfy M2.

[Source review](../reports/postal-context-m2/om-source-review-2026-08-28.json) and [engineering checks](../reports/postal-context-m2/om-checks-2026-08-28.json) contain provenance, validation and limitations. [Oman details](postal-context-oman-m2.md) provide reproduction and unblock conditions. Retry public sources after `2026-09-04T21:59:53.131Z` and after the pending-country pass. Additional permission is required for restricted sources, contracts or a new publishing destination.

After OM: 252 profiles, 218 pending, 34 blocked, 0 in progress, 0 evidence-verified M2. Next: **PH**. No second country was started.

## PH — 2026-08-28: locator defects and namespace transition, M2 blocked

Preserved `M2_assignment`. The exact live PHLPost HTML snapshot has 1,400 body rows: 440 entirely blank and 960 populated, of which 959 contain four-digit codes (958 distinct). One code cell contains a locality label and one row is duplicated. No imputation, correction, deduplication or administrative/geometry inference occurred. Current national coverage and edition remain unverified.

Four reference bodies were byte-verified; two PSGC requests returned 403 without bypass. Positive public-domain notice, copyright footer and government-work profit/third-party conditions are recorded separately. UPU printed 09/2004 is not its PDF 2020 timestamp. A separate PHLPost seven-character ZIP Code PH announcement is not an allocation/crosswalk and does not replace the four-digit AGID namespace.

[Country review](postal-context-philippines-m2.md), [source report](../reports/postal-context-m2/ph-source-review-2026-08-28.json) and [engineering checks](../reports/postal-context-m2/ph-checks-2026-08-28.json) provide evidence and reproduction. No approved immutable data artifact or real-data AGID loader/API proof exists. Retry public review after `2026-09-04T22:27:15.802Z` and the pending-country pass. Restricted sources, contracts, new publication destinations and additional costs need separate approval.

After PH: 252 profiles, 217 pending, 35 blocked, 0 in progress, 0 evidence-verified M2. Next: **PK**. Other 251 entries are unchanged; no second country started.

## 2026-08-28 PK: typed offices and amendment discrepancies

- Base: `aa740c2183408587071b51d19c6efe7f247a4a0c`; latest GitHub ledger and preceding PH reports were byte/hash verified.
- M2_assignment unchanged; PK is blocked, not data-complete. HTML: 2,298 delivery and 832 non-delivery rows, with 5 and 11 shared-code groups respectively. Fifteen repeated headers are not records.
- Nine official observations were captured and hashed. A 2024-named PDF contains a 2022 notice; five codes in the 2023 notice were absent from the HTML. No arithmetic branch generation, truncation, deduplication or office-class inference.
- Current completeness, full amendment effectivity, exact reuse permission, a pinned public data release and real AGID verification remain missing. No production geometry or buildings inferred.
- Sources: `reports/postal-context-m2/pk-source-review-2026-08-28.json`; engineering: `reports/postal-context-m2/pk-checks-2026-08-28.json`; detail: [Pakistan M2 review](postal-context-pakistan-m2.md).
- Retry after `2026-09-04T22:55:37.259Z` and all pending countries. Next country is selected by the status command; no second country worked in this run.

Validation: 2,083 passing JavaScript executions across overlapping groups, plus 11 Python tests; typecheck and post-metadata 31-test recheck passed. Three pre-existing baseline failures (KM duplicate source IDs, missing EH/HM YAML, BY YAML structure) remain unchanged and are not included in the green count.

After PK: 252 profiles, 216 pending, 36 blocked, 0 in progress, 0 evidence-verified M2. Next: **PS**.

## 2026-08-28 PS: P3 areas, P7 input and incomplete polygon transfer

PS had no manifest or explicit M2 definition. Primary MTDE/UPU evidence now defines `M2_official_p3_postal_areas`: a current complete rights-cleared P3 list/polygon release, immutable publication and real PS AGID verification. Source identity and territory are unchanged. P7 delivery points and exact civic-address/building relations are separate layers.

The full 2021 P3 list has 755 locality relations / 603 codes / 16 district labels / 93 shared-code groups. No identical rows or malformed P3 strings; 534 blank coverage fields remain unknown. Six complete source bodies were SHA-256 verified. The catalog describes polygons, but both full CSV transfers failed (retry received 98,304 HTTP bytes versus the declared 11,291,622-byte body). Partial data and samples do not establish geometry or completeness. P7 was not downloaded.

M2 remains blocked: complete polygons, current validity, exact publisher-selected CC BY version/attribution, CRS/topology, explicit joins and an approved immutable real-data AGID release are missing. The generic licence index is not a denial of reuse, nor proof of a particular version. TLS checks were never disabled.

AGID PS metadata no longer declares postal codes unused; P3 and P7 syntax are accepted, with all eight P7 characters accommodated. English/Arabic component input was tested locally with synthetic codes; house/building fields stayed empty. No production PS Postal Context pack was enabled.

[PS contract and reproduction](../data/postal_country_packs/ps/postal-context/README.md), [source report](../reports/postal-context-m2/ps-source-review-2026-08-28.json) and [engineering checks](../reports/postal-context-m2/ps-checks-2026-08-28.json). Recheck after `2026-09-04T23:32:29.552Z` and the pending-country first pass; new destinations, contracts or charges still need approval.

After PS: 252 profiles, 215 pending, 37 blocked, 0 in progress, 0 evidence-verified M2; 117 manifests / 85 explicit M2 definitions. Next: **QA**. Other 251 ledger entries unchanged; no second country started.

PS validation totals: 2,020 passing JavaScript executions across overlapping groups (503 unique test files), plus 12 Python tests. Typecheck, source-replay digest verification and diff audit passed. Three unchanged baseline failures remain: KM duplicated source IDs, absent EH/HM YAML, and malformed BY YAML. English/Arabic local component QA passed; full application, mobile layout and real PS spatial API remain untested.

## 2026-08-28 QA: Inwani context, road quality and scoped C0 rights

QA had no manifest/M2 criterion. The reviewed `M2_current_official_inwani_context` requires current complete-for-declared-coverage permitted civic-address data, explicit zone/street/building relations, georeferencing, immutable publication and real QA AGID verification. No normal postcode, postal polygon or building footprint is invented.

Twenty-five acquisition receipts include 19 content-reviewed references/aggregates, four transport-only shells/bundles and two initial failures. Public road counts agree on 12,645 polylines; 285 street values and 12,623 update dates are missing. QARS candidate schema has zone/street/building fields, but neither match scores nor generic Postal fields prove assignments. No individual records or geocoder queries were requested.

NPC June 2026 policy permits attributed CC-BY-4.0 reuse for C0 data. Explicit C0/CC-BY census catalog grants are preserved; their aggregate municipal geometry is not an Inwani address register. Specific QARS/road rights, current address data, a fixed approved artifact and real AGID loader/API evidence remain unverified. QA stays M1 / blocked.

[QA review](postal-context-qatar-m2.md), [source report](../reports/postal-context-m2/qa-source-review-2026-08-28.json), [engineering checks](../reports/postal-context-m2/qa-checks-2026-08-28.json). Recheck after `2026-09-05T00:03:27.720Z` and the pending-country pass. No extra charge, new public destination, contract or deployment was performed.

After QA: 252 profiles, 214 pending, 38 blocked, 0 in progress, 0 evidence-verified M2; 118 manifests / 86 explicit definitions. Next: **SA**. Other 251 country entries and all existing user changes are unchanged.

QA validation: 2025 passing JavaScript executions across overlapping groups, plus a 74-test npm entrypoint replay. Typecheck, exact-byte source replay and difference audit passed. Three baseline failures remain unchanged (KM, EH/HM, BY); no production QA data/API or browser UI deployment is claimed.

## 2026-08-29 SA: SPL facility data, API scope and M2 assignment gap

SA retains its existing `M2_assignment_and_derived_geometry` definition. Twenty-five receipts bind 22 exact documents/data files and three GEOSA PDF acquisition failures. The `04/2025` UPU guide and current SPL page establish five-digit semantics, not assignment rows or boundaries.

Fourteen SPL CSVs contain 14,014 physical records: 381 blank and 13,633 nonblank. The meaningful office subset has 529 facilities (485 five-digit postcodes, 44 other formats); the service file has 8,820 rows with 581 exact duplicates, no orphan service key, and 67 offices without a service row. These are facility/service quality findings, not nationwide assignment or geometry coverage.

The credentialed API terms restrict sublicensing, large display and generic address validation. The geocode documentation also conflicts internally by describing four digits while showing a five-digit sample. No account, contract, paid operation, geocode query, raw row publication or production runtime was used. SA remains M1 / blocked.

[SA review](postal-context-saudi-arabia-m2.md), [source report](../reports/postal-context-m2/sa-source-review-2026-08-29.json), [engineering checks](../reports/postal-context-m2/sa-checks-2026-08-29.json). Recheck after `2026-09-05T00:26:26.437Z` and the pending-country pass; new accounts, contracts, charges, destinations and deployments still require approval.

After SA: 252 profiles, 213 pending, 39 blocked, 0 in progress, 0 evidence-verified M2; 118 manifests / 86 explicit definitions. Next: **SG**. Other 251 country entries and all existing user changes remain unchanged.

## 2026-08-29 SG: point-first public preview and rights gate

SG retains its existing `M2_experimental` point-first definition. Eleven exact
references were byte-bound and reviewed. The public SLA dwelling-page preview
contains 1,420 private-residential property points and 1,416 distinct valid
six-digit codes, but is a narrow preview with four missing postcodes, 71 rows
sharing coordinates and no verified national completeness. It is not a fixed
current assignment artifact and no source rows are committed.

The reviewed SingPost national database terms require a paid, non-transferable
internal-use subscription and restrict copying, publication and derivatives.
OneMap and data.gov.sg API use requires registration, token or acceptance;
none was authorized or invoked. No official postal polygon source was found.
Address points and building footprints therefore remain separate from postal
geometry, and no polygon was generated for SG.

[SG source report](../reports/postal-context-m2/sg-source-review-2026-08-29.json)
and [engineering checks](../reports/postal-context-m2/sg-checks-2026-08-29.json)
record the exact digests, rights boundaries and validation. SG remains M1 /
blocked until a complete rights-cleared real point artifact or authorized API
receipt is immutably published and verified through AGID. Recheck after
`2026-09-05T01:26:58.142Z` and the pending-country pass. Next: **SY**.

After SG: 252 profiles, 212 pending, 40 blocked, 0 in progress, 0 evidence-verified M2; 118 manifests / 86 explicit definitions. No account, purchase, contract, new repository, public data destination or deployment was created.

## 2026-08-29 SY: no-postcode policy, unavailable current data, M2 blocked

SY now has its own `M2_scoped_no_postcode_address_context` definition. The
exact UPU General Addressing Issues document lists Syria among countries where
a postcode is not required. Postal code remains null; P.O. boxes, offices,
routes, administrative boundaries, AGID cells and generated regions are not
postcodes or official postal polygons.

Four exact UPU references were byte/hash verified: policy, 2025 postal
entities, member identity and copyright. The entities document names the
General Postal Establishment and SY-TPRA but supplies no address assignment or
geometry. Both Syrian Post root URLs timed out without bypass. This is an
acquisition failure, not proof that current data does not exist.

[SY review](postal-context-syria-m2.md), [source receipts](../reports/postal-context-m2/sy-source-review-2026-08-29.json)
and [engineering checks](../reports/postal-context-m2/sy-checks-2026-08-29.json)
record the rights and quality boundary. Zero current real assignment/address
rows, geometry records, explicit address/building relations or immutable data
artifacts were validated. The synthetic Postal Forge pack remains planning
data only. Source documents are not republished.

M2 remains blocked pending current rights-cleared real data, explicit scope,
edition and validity, approved immutable publication and actual SY AGID
verification. Recheck after `2026-09-05T02:45:52.403Z` and the pending-country
pass. Restricted access, contracts, charges, new destinations and deployment
still require approval. Validation: 294 passing tests plus TypeScript; next:
**TH**. No second country was started.

After SY: 252 profiles, 211 pending, 41 blocked, 0 in progress, 0 evidence-verified M2; 119 manifests / 87 explicit definitions.

## 2026-08-29 TH: exception-aware postal areas and app visualization blocked

TH now has `M2_exception_aware_postal_area_visualization`. The exact Thailand
Post nationwide assignment PDF contains 979 distinct five-digit codes and 219
exception tokens across its two pages. Subdistrict, village, road and
house-number conditions make a simple postcode-to-administrative-boundary join
unsafe. The PDF has no geometry, CRS, topology, stable rows or current-validity
claim, so no polygon was generated.

Five official public bodies were byte/hash verified. The government catalog
describes a Zipcode dataset and an Open Data Common label, but its single HTML
resource URL is empty. The exact data.go.th dataset returned 403 without
bypass. Reviewed Thailand Post terms do not expressly grant bulk extraction,
derivative polygon, redistribution or API serving. Raw source bodies remain
outside Git.

The shared app path requests API geometry after exact postcode search, accepts
only postal Polygon/MultiPolygon, fits the map, draws opacity-0.22 fill plus a
clear outline, and fails closed for missing/non-area/API-failure results. TH has
no eligible runtime artifact, so no real Thai map result exists. The shared
notice also lacks distinct authority, basis-date and confidence fields.

[TH review](postal-context-thailand-m2.md), [source report](../reports/postal-context-m2/th-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after
`2026-09-05T03:09:44.464Z` and the pending-country pass. After TH: 252 profiles,
210 pending, 42 blocked, 0 in progress, 0 evidence-verified M2; 120 manifests /
88 explicit definitions. Next: **TJ**. No second country was started.

## 2026-08-29 TJ: six-digit postal-area visualization blocked

TJ now has `M2_current_six_digit_index_area_visualization`. Three exact public
references were byte/hash verified: the Tajik Post postcode list, its
postal-office list and the September 2019 UPU addressing sheet. The index page
has 258 six-digit occurrences and 188 distinct codes across mixed-grain
articles; the office table has 88 facility rows and 80 distinct codes. Repeated
codes cannot be treated as a one-to-one postal area, and the displayed
`753456` outlier is retained for authoritative confirmation rather than fixed.

None of the references contains Polygon/MultiPolygon geometry, CRS, topology,
editioned current completeness or an explicit derivative/API reuse grant. The
Tajik Post footer states all rights reserved. Office points and administrative
boundaries were not relabelled as postal areas; raw source bodies remain out of
Git.

The shared app path still verifies exact-code search, geometry opt-in,
Polygon/MultiPolygon filtering, map fit, translucent opacity-0.22 fill,
opacity-0.95 width-3 outline, clear/re-search and failure states. TJ has no
eligible runtime artifact or real area result, and the shared notice still
lacks distinct authority, basis-date and confidence fields.

[TJ review](postal-context-tajikistan-m2.md), [source report](../reports/postal-context-m2/tj-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after
`2026-09-05T03:38:36.537Z` and the pending-country pass. After TJ: 252 profiles,
209 pending, 43 blocked, 0 in progress, 0 evidence-verified M2; 121 manifests /
89 explicit definitions. Next: **TL**. No second country was started.

## 2026-08-29 TL: seven-character format corrected, postal areas blocked

TL now has `M2_current_seven_character_delivery_area_visualization`. Five
exact primary references were byte/hash verified. The August 2026 UPU sheet
supersedes AGID's five-digit-only metadata: the canonical value is `TL` plus
five digits. It gives five P.O. box, home and organization delivery examples,
but no complete current assignment table or postal geometry.

The Correios contact page displays an unlabelled six-digit `535022`; it remains
an unresolved contact-address token and was not silently corrected or promoted.
Correios states all rights reserved. The current UPU database page exposes a
contract, NDA, data-use declaration and rates; no account, contract, payment or
acceptance was performed. Government plans for delivery to Administrative Post
level do not make administrative boundaries postcode polygons.

No eligible Polygon/MultiPolygon, immutable artifact, TL runtime/API or real
app result exists. The shared search path still verifies API geometry opt-in,
area-only filtering, map fit, opacity-0.22 fill, opacity-0.95 width-3 outline,
clear/re-search and failure states, while its visible notice still lacks
distinct authority, basis-date and confidence fields.

[TL review](postal-context-timor-leste-m2.md), [source report](../reports/postal-context-m2/tl-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after
`2026-09-05T04:04:11.098Z` and the pending-country pass. After TL: 252 profiles,
208 pending, 44 blocked, 0 in progress, 0 evidence-verified M2; 122 manifests /
90 explicit definitions. Next: **TM**. No second country was started.

## 2026-08-29 TM: current office indices verified, postal areas blocked

TM now has `M2_current_six_digit_delivery_area_visualization`. Seven exact
primary references were byte/hash verified. The current public Turkmenpost
departments API contains 153 unique six-digit office indices across seven
regions; 137 have office points and 16 do not. It contains no postal
Polygon/MultiPolygon, boundary field, CRS or delivery-area relation.

The two-page December 2020 UPU sheet confirms six digits and gives home,
P.O.-box and poste-restante examples, but it is not a current complete
assignment. The current app states all rights reserved, and no express bulk,
derivative-polygon, redistribution or API-serving grant was found. UPU's
licensed product route exposes a contract, NDA, use declaration and rates; no
authentication, agreement or payment was performed.

Office points, kiosks and Welayat/Etrap boundaries were not buffered,
Voronoi-partitioned or relabelled as postal areas. No eligible immutable
artifact, TM runtime/API or real app result exists. Shared tests still verify
exact-code search, geometry opt-in, area-only filtering, map fit,
opacity-0.22 fill, opacity-0.95 width-3 outline, clear/re-search and failure
states; the visible notice still lacks distinct authority, basis-date and
confidence fields.

[TM review](postal-context-turkmenistan-m2.md), [source report](../reports/postal-context-m2/tm-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after
`2026-09-05T04:32:30.161Z` and the pending-country pass. After TM: 252
profiles, 207 pending, 45 blocked, 0 in progress, 0 evidence-verified M2; 123
manifests / 91 explicit definitions. Next: **TR**. No second country was
started.

## 2026-08-29 TR: real PTT assignments verified, postal areas blocked

TR now has `M2_current_five_digit_delivery_area_visualization`. The current
public PTT service was followed from its UI/client to bounded real API data. An
ALTINDAĞ response contains 3,269 street/neighbourhood rows, 8 distinct valid
five-digit postcodes, 26 neighbourhoods and 3,169 street labels. Its five
fields contain no Polygon/MultiPolygon, coordinate, boundary, CRS or topology.

PTT's current legal notice requires prior permission and does not establish
bulk redistribution, derivative-polygon or AGID API-serving rights. The UPU
sheet confirms five-digit placement plus P.O.-box and poste-restante
exceptions. TUCBS access follows data-owner permission/Open Data
classification; no current public postcode-area service receipt was verified.

No address row or administrative boundary was relabelled as a postal area, and
raw source bodies remain outside Git. Shared tests continue to verify exact
search, geometry opt-in, Polygon/MultiPolygon filtering, map fit,
opacity-0.22 fill, opacity-0.95 width-3 outline, clear/re-search and failure
states. TR has no eligible runtime artifact or real area result, and the shared
notice still lacks distinct authority, basis-date and confidence fields.

[TR review](postal-context-turkey-m2.md), [source report](../reports/postal-context-m2/tr-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after
`2026-09-05T05:06:23.425Z` and the pending-country pass. After TR: 252
profiles, 206 pending, 46 blocked, 0 in progress, 0 evidence-verified M2; 124
manifests / 92 explicit definitions. Next: **TW**. No second country was
started.

## 2026-08-29 TW: current controlled assignment and postal areas blocked

TW now has `M2_current_six_digit_delivery_area_visualization`. Ten exact
official references were byte/hash verified. The government CSV is a 475-byte
Big5 link catalog with four rows, no assignment records and no postcode or
geometry fields. Current Chunghwa Post rules state that public raw-file
distribution stopped; obtaining the address text file requires an external
account, a company-sealed application and operator approval. None was submitted.

The operator API specification exposes address-to-six-digit string, prefix-to-
city/area string and address JSON methods, with no Polygon/MultiPolygon,
coordinate or boundary field. The public authorization covers specified 3+3
data files but creates no geometry or third-party NLSC rights. NLSC doorplates
are point features, buildings are separate polygons, and reviewed vector rules
require eligible applicants, a bound IP and internal use. No postcode-area
layer or public vector redistribution grant was verified.

No address range, three-digit centre, doorplate, building, parcel,
administrative boundary, buffer, Voronoi cell or model was relabelled as a
postal area. Raw source bodies remain outside Git. Shared tests still verify
exact search, geometry opt-in, Polygon/MultiPolygon filtering, map fit,
opacity-0.22 fill, opacity-0.95 width-3 outline, clear/re-search and failure
states. TW has no eligible real-data runtime or area response, and the shared
notice still lacks distinct authority, basis-date and confidence fields.

[TW review](postal-context-taiwan-m2.md), [source report](../reports/postal-context-m2/tw-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after explicit approval, the
pending-country pass and `2026-09-05T05:57:18.791Z`, unless a public
rights-cleared postal-area release appears earlier. After TW: 252 profiles,
205 pending, 47 blocked, 0 in progress, 0 evidence-verified M2; 124 manifests /
92 explicit definitions. Next: **UZ**. No second country was started.

## 2026-08-29 UZ: real operator polygon verified, AGID reuse blocked

UZ now has `M2_current_operator_postal_area_visualization`. Ten exact official
references were byte/hash verified. The current UzPost office list contains
1,593 unique six-digit indices, with 1,591 valid office coordinates and two
malformed longitude strings. The list itself has no geometry field.

The exact detail response for `100000` contains a closed 98-vertex ring with a
translucent `0.3` fill. The exact current client searches indices, requests the
detail, constructs a Yandex Polygon, applies server fill/stroke and fits the
map. This verifies a real operator search-to-area path, but only one detail was
sampled and it does not establish national completeness, declared delivery-
area semantics, CRS or a versioned release.

The reviewed public offer governs website/mobile-app use and creates no
verified bulk, derivative-polygon, persistence, redistribution, immutable-
publication or AGID API-serving grant. Public GET/CORS capability is not a
data licence. No registration, contract acceptance, payment or bulk harvest
was performed. Raw bodies remain outside Git.

No office point, administrative boundary, buffer, Voronoi cell or model was
promoted to official postal geometry. Shared tests verify exact search,
Polygon/MultiPolygon filtering, fit, translucent fill, clear outline,
clear/re-search and failure states. UZ has no eligible immutable artifact or
real-data AGID runtime/API/app result, and the shared notice still lacks
distinct authority, basis-date and confidence fields.

[UZ review](postal-context-uzbekistan-m2.md), [source report](../reports/postal-context-m2/uz-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after explicit approval, the
pending-country pass and `2026-09-05T06:40:00.000Z`, unless a public rights-
cleared immutable area release appears earlier. After UZ: 252 profiles, 204
pending, 48 blocked, 0 in progress, 0 evidence-verified M2; 124 manifests / 93
explicit definitions. Next: **VN**. No second country was started.

## 2026-08-29 VN: current assignment notices verified, postal areas blocked

VN now has `M2_current_five_digit_postal_area_visualization`. Seven exact
official references were byte/hash verified. Vietnam Post dates Decision
2334/QD-BKHCN to 24 August 2025, while the ministry's 25 November 2025 article
states 18 November 2024 in its body. The unresolved conflict and absence of an
attached exact annex prevent a current assignment receipt.

The official portal is text-search-only. Its client calls a cleartext HTTP
autocomplete endpoint; the equivalent HTTPS path returned 404 in a bounded
probe. No Polygon/MultiPolygon, GeoJSON, map client or fit path was observed.
The portal legal page lists the 2017 decision, not Decision 2334. Its linked
386,841,053-byte, 552-page scanned directory was created and modified in June
2018. Exact visual checks found routing instructions and district/code tables,
not polygon coordinates, CRS or topology.

Website source-attribution language establishes no bulk, derivative-polygon,
persistence, redistribution, immutable-publication or AGID API-serving grant.
No account, registration, application, contract, payment or controlled source
was used. No administrative boundary, office or Vpostcode point, buffer,
Voronoi cell, model, address row or building was promoted to postal geometry.
Raw source bodies remain outside Git.

Shared tests verify exact search, Polygon/MultiPolygon filtering, fit,
translucent fill, clear outline, clear/re-search and failure states. VN has no
eligible current real-data artifact, API area response or app end-to-end
result, and the shared notice still lacks distinct authority, basis-date and
confidence fields.

[VN review](postal-context-vietnam-m2.md), [source report](../reports/postal-context-m2/vn-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after explicit approval, the
pending-country pass and `2026-09-05T07:20:00.000Z`, unless a public rights-
cleared current annex and postal-area release appears earlier. After VN: 252
profiles, 203 pending, 49 blocked, 0 in progress, 0 evidence-verified M2; 124
manifests / 94 explicit definitions. Next: **YE**. No second country was
started.

## 2026-08-29 YE: no-required-postcode policy verified, optional office-code data blocked

YE now has `M2_scoped_optional_office_code_address_context_visualization`.
Seven exact official references were byte/hash verified. UPU's September 2025
database lists Yemen among countries that do not require postcodes, and the
UPU Yemen sheet shows P.O. box delivery without a postcode field. Yemen Post
separately states that a P.O. box subscriber receives a distinct box number
and a postal code tied to the post office by area. These claims remain
separate; the box number is not treated as that code or as geometry.

The reviewed operator pages publish no exact code values, assignments,
current office or address rows, Polygon/MultiPolygon, CRS, topology or
complete coverage. The claimed digital office-map link is the literal
placeholder `#`. UPU copyright and Yemen Post all-rights-reserved notices do
not grant bulk, derivative, persistence, redistribution, immutable-
publication or AGID API-serving rights. No registration, application,
contract, payment or controlled source was used.

No P.O. box, office, administrative boundary, buffer, Voronoi cell, learned
region or AGID cell was promoted to postal geometry. Raw source bodies remain
outside Git. Shared tests verify exact search, Polygon/MultiPolygon filtering,
fit, opacity-0.22 fill, opacity-0.95 width-3 outline, clear/re-search and
failure states. YE has no eligible real-data artifact, API area response or
app end-to-end result; a real authority class, basis date and confidence are
therefore unavailable rather than fabricated.

[YE review](postal-context-yemen-m2.md), [source report](../reports/postal-context-m2/ye-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after the pending-country pass
and `2026-09-05T07:54:43.683Z`, unless a public rights-cleared current release
appears earlier. After YE: 252 profiles, 202 pending, 50 blocked, 0 in
progress, 0 evidence-verified M2; 125 manifests / 95 explicit definitions.
Next: **AD**. No second country was started.

## 2026-08-29 AD: road-assigned codes verified, reusable postal areas blocked

AD now has `M2_current_road_assigned_postal_area_visualization`. Ten exact
official references were byte/hash verified. The UPU sheet establishes
`ADNNN`, La Poste/Correos and examples `AD501`, `AD700` and `AD500`. UPU's
2005 article records seven zones and a code assigned to every thoroughfare;
the road database went to major mailers, Posts and the controlled POST*CODE
database. This is not a current open assignment or polygon release.

Correos currently states that its paid basic database contains Spain and
Andorra, but its overlay text does not expressly establish Andorra scope. The
licence limits use to the contractor's own database/address quality,
prohibits sublicensing and prohibits an unrelated-user postcode search. No
contract, payment or controlled data access was used.

Govern/IDE Andorra pages document address search, OpenLS, WMS/WFS and
topographic/building layers. Address points, user-drawn polygons, buildings
and parish boundaries retain their own authority and were not promoted to
full-code postal areas. The website notice limits private/personal use and
prohibits commercial use; the download portal requires user data and
conditions acceptance. No conditions were accepted and raw source bodies
remain outside Git.

Shared tests verify exact search, Polygon/MultiPolygon filtering, fit,
opacity-0.22 fill, opacity-0.95 width-3 outline, clear/re-search and failure
states. AD has no eligible current real-data artifact, API area response or
app end-to-end result; distinct authority, basis date and confidence are
unavailable rather than fabricated. Synthetic AD00x fixture geometry does not
satisfy M2.

[AD review](postal-context-andorra-m2.md), [source report](../reports/postal-context-m2/ad-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after explicit approval, the
pending-country pass and `2026-09-05T08:18:45.000Z`, unless a public current
rights-cleared assignment and postal-area release appears earlier. After AD:
252 profiles, 201 pending, 51 blocked, 0 in progress, 0 evidence-verified M2;
125 manifests / 95 explicit definitions. Next: **AL**. No second country was
started.

## 2026-08-29 AL: office-code tables verified, postal areas blocked

AL now has `M2_current_office_assignment_and_postal_area_visualization`.
Twenty-two exact Posta Shqiptare, UPU and ASIG references were byte/hash
verified. Fourteen Posta pages contain 535 rows and 532 distinct four-digit
codes, including three duplicated codes. The pages do not declare a current
complete edition, row identity, validity period or address membership and
contain no geometry.

Posta's reusable open-data page links a 562-row cadastral property inventory.
The workbook has 333 distinct cadastral-zone values and property identifiers
but no postcode, coordinate or geometry column. It is not a postal assignment
or area source, and raw property/land-rights records remain outside Git. The
UPU sheet confirms the `NNNN` format and examples, not current allocation or
geometry.

ASIG exposes civic address, road and building services, but these retain
non-postal authority. Reviewed terms limit use to non-commercial purposes,
prohibit automated programs and describe tariffs; downloads also require
registration credentials. No registration, terms acceptance, payment,
authenticated download or controlled data access was performed.

No office point, cadastral zone, address, road, building, parcel, buffer,
Voronoi cell, learned region or AGID cell was promoted to postal geometry.
Shared tests verify normalized exact search, Polygon/MultiPolygon filtering,
map fit, opacity-0.22 fill, opacity-0.95 width-3 outline, clear/re-search and
failure states. AL has no eligible real-data artifact, API area response or
app end-to-end result; authority, basis date and confidence are unavailable
rather than fabricated. Synthetic AL000x fixtures do not satisfy M2.

[AL review](postal-context-albania-m2.md), [source report](../reports/postal-context-m2/al-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after explicit approval, the
pending-country pass and `2026-09-05T08:52:51.000Z`, unless a public current
rights-cleared assignment and postal-area release appears earlier. After AL:
252 profiles, 200 pending, 52 blocked, 0 in progress, 0 evidence-verified M2;
125 manifests / 95 explicit definitions. Next: **AT**. No second country was
started.

## 2026-08-29 AT: current assignments verified, reusable postcode areas blocked

AT now has
`M2_current_assignment_and_statistical_or_derived_postal_area_visualization`.
Fifteen exact Post, RTR, BEV and Statistik Austria references were byte/hash
verified. The Post postcode directory, Post destination directory and RTR
current table agree on all 2,234 addressable four-digit codes. The operator
files and regulator table contain no geometry.

The public Statistik Austria WFS exposes 146 feature types with no postcode
feature type. The current regional STATatlas configuration exposes 13 layers
with no postcode layer, although its information text mentions postcode
regions. The priced regional-package document states a EUR 118 minimum, 40%
commercial surcharge and signed terms. Nothing was bought or accepted. BEV's
address-register page confirms quarterly postcode membership context, but no
complete permitted address relation was acquired or converted into a surface.

No destination locality, district, municipality, address, building, P.O. box,
organization, field-post record, buffer, Voronoi cell, model or AGID cell was
promoted to postal geometry. Shared tests verify exact search,
Polygon/MultiPolygon filtering, fit, opacity-0.22 fill, opacity-0.95 width-3
outline, clear/re-search and failure states. AT has no eligible real-data
artifact, API area response or app end-to-end result; authority, basis date and
confidence are unavailable rather than fabricated.

[AT review](postal-context-austria-m2.md), [source report](../reports/postal-context-m2/at-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after explicit approval, the
pending-country pass and `2026-09-29T09:27:06.000Z`, unless a public current
rights-cleared postcode-area or complete member release appears earlier. After
AT: 252 profiles, 199 pending, 53 blocked, 0 in progress, 0 evidence-verified
M2; 125 manifests / 95 explicit definitions. Next: **AX**. No second country
was started.

## 2026-08-29 AX: current assignments and statistical areas verified, publication/app blocked

AX now has
`M2_current_assignment_and_official_statistical_postal_area_visualization`.
Twelve exact Posti, Åland Post and Statistics Finland references were
byte/hash verified. Posti PCF `20260829` contains 37 current Åland records:
33 normal and four P.O.-box codes. Paavo `pno_2026` contains 32 exact matching
official-derived statistical postal-code areas.

All 32 features are Polygon/MultiPolygon, all pass Turf validity, their 530
rings close and no coordinate is out of range. The five assignments without a
Paavo feature are `22101`, `22110`, `22111`, `22151` and `22411`: four P.O.
boxes and one postal terminal. They receive no invented polygon. Paavo remains
official-derived statistical geometry generalized from building postcodes; it
is not an Åland Post operator delivery perimeter.

Posti terms permit third-party disclosure when the terms and download date
accompany the data; Statistics Finland uses CC BY 4.0. The reviewed PCF and
GeoJSON bytes are not committed. No account, payment, contract acceptance,
new repository, publication destination or deployment was used. AX has no
approved immutable transformed artifact and no production loader/API/app path.

Shared tests verify exact search, Polygon/MultiPolygon filtering, fit,
opacity-0.22 fill, opacity-0.95 width-3 outline, clear/re-search and failure
states. These tests do not load the reviewed AX bytes. A real postcode search
therefore cannot yet display the 32 areas or explain the five non-area outcomes
in the app, and M2 remains blocked.

[AX review](postal-context-aland-islands-m2.md), [source report](../reports/postal-context-m2/ax-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after explicit publication
approval, the pending-country pass and `2026-09-29T09:57:47.357Z`, unless a
newer exact release appears earlier. After AX: 252 profiles, 198 pending, 54
blocked, 0 in progress, 0 evidence-verified M2; 126 manifests / 96 explicit
definitions. Next: **BA**. No second country was started.

## 2026-08-29 BA: three operators and point inventories verified, postal areas blocked

BA now has
`M2_current_three_operator_assignment_and_postal_area_visualization`. Twelve
exact regulator, UPU, operator and government geospatial references were
byte/hash verified. RAP identifies three authorized public postal operators.
The reviewed JP BH Pošta locator has 285 code markers, the BH PostExpress table
has 468 office rows, and the Pošte Srpske locator has 584 code markers.

These 1,337 observations overlap and are not a national completeness measure.
They have no common release edition, validity or stable cross-operator row
identity and contain no postal Polygon/MultiPolygon. The UPU 04/2019 sheet's
two-digit postal-region and three-digit post-office semantics do not define a
full-code boundary.

FGU/SDI and RUGIPP administrative, cadastral, address and building evidence
retains its own authority. No office point, prefix, locality, administrative or
cadastral area, parcel, building, route, buffer, Voronoi/model surface or AGID
cell was promoted to postal geometry. House numbers and buildings require a
separate permitted stable address relation.

Shared tests verify exact search, Polygon/MultiPolygon filtering, fit,
opacity-0.22 fill, opacity-0.95 width-3 outline, clear/re-search and failure
states. BA has no eligible real-data artifact, API area response or app
end-to-end result, so translucent area visualization remains blocked rather
than fabricated.

[BA review](postal-context-bosnia-and-herzegovina-m2.md), [source report](../reports/postal-context-m2/ba-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after the pending-country pass
and `2026-09-05T10:31:04.634Z`, unless a current rights-cleared assignment and
postal-area release appears earlier. After BA: 252 profiles, 197 pending, 55
blocked, 0 in progress, 0 evidence-verified M2; 127 manifests / 97 explicit
definitions. Next: **BE**. No second country was started.

## 2026-08-29 BE: valid postal-canton polygons verified, public use blocked

BE now has
`M2_current_assignment_and_rights_cleared_postal_canton_visualization`.
Four exact bpost references were byte/hash verified: the geo.be metadata,
EPSG:4326 Postal cantons archive, current postcode-validation page and its
linked 2025 legacy workbook. The Shapefile has 1,268 Polygon features, 1,187
distinct `nouveau_PO` values, 39 special-code features and zero invalid
geometries. Source values `612` and `9` require explicit leading-zero
normalization; they were not silently rewritten.

The official metadata describes postal-canton surfaces extrapolated from
address points with administrative limits and roads. They are official-derived
postal geometry, not exact delivery, building or house-number guarantees.
Administrative, cadastral, parcel and building geometry retain separate
authority. House numbers and buildings require a separate permitted stable
address/building relation.

The same metadata grants internal use, strictly forbids commercial use and
does not establish public redistribution, derivative or API rights. Therefore
the reviewed 14,250,060-byte archive and its extracted files were audited only
as temporary inputs and are not committed, published or loaded into AGID.
The linked assignment workbook is BIFF `.xls`; the approved spreadsheet
runtime could not parse it and Excel COM was unavailable, so row-level current
assignment completeness remains unverified.

Shared tests verify exact search, Polygon/MultiPolygon filtering, fit,
opacity-0.22 fill, opacity-0.95 width-3 outline, clear/re-search and failure
states. Those tests do not load restricted BE source bytes. A real BE postcode
search therefore cannot lawfully return or display the translucent postal area
in the public app yet, and M2 remains blocked rather than fabricated.

[BE review](postal-context-belgium-m2.md), [source report](../reports/postal-context-m2/be-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after the pending-country pass
and `2026-09-05T10:56:01Z`, unless written public redistribution, derivative,
API and commercial-use rights plus a current complete assignment release
appear earlier. After BE: 252 profiles, 196 pending, 56 blocked, 0 in progress,
0 evidence-verified M2; 127 manifests / 97 explicit definitions. Next: **BG**.
No second country was started.

## 2026-08-29 BG: historical assignments and current points verified, postal areas blocked

BG now has
`M2_current_assignment_and_rights_cleared_postal_area_visualization`. Five
exact Eurostat GISCO/TERCET references were byte/hash verified: the 2025
version and file catalogs, EPSG:4326 point GeoJSON, BG-to-NUTS crosswalk and
methodology V4. Bulgarian Posts' government open-data catalog separately
identifies a CC0 settlement/postcode dataset, version 2.4 dated 2020-10-27.
Its exact resource bytes and a current complete 2026 edition were not verified.

The exact GISCO file contains 4,880 distinct valid four-digit BG features, all
Point and zero Polygon/MultiPolygon. TERCET attributes zero BG records to a
current Member State postal-code dataset, 101 to address data, 4,359 to GISCO
2020 and 420 to manual/geocoded input. Eurostat does not guarantee complete
coverage or exact locations. The point count is therefore not a current
assignment or area-coverage denominator.

No locality, point, NUTS match, EKATTE or administrative/cadastral area,
address/building feature, buffer, Voronoi/model surface or AGID cell was
promoted to postal geometry. Special and non-geographic codes remain non-area.
House numbers and buildings require separate permitted stable relations.

Shared tests verify exact search, Polygon/MultiPolygon filtering, fit,
opacity-0.22 fill, opacity-0.95 width-3 outline, clear/re-search and failure
states. BG has no eligible real-data area artifact, API area response or app
end-to-end result, so translucent visualization remains blocked rather than
fabricated.

[BG review](postal-context-bulgaria-m2.md), [source report](../reports/postal-context-m2/bg-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after the pending-country pass
and `2026-09-05T11:31:04.000Z`, unless a current complete assignment and
postal-area/member release appears earlier. After BG: 252 profiles, 195
pending, 57 blocked, 0 in progress, 0 evidence-verified M2; 127 manifests / 97
explicit definitions. Next: **BY**. No second country was started.

## 2026-08-29 BY: official-derived zones documented, current vector and reuse rights blocked

BY now has
`M2_current_belpost_assignment_and_rights_cleared_nca_postal_zone_visualization`.
Eight exact public observations totaling 10,226,461 bytes were byte/hash
verified: NCA's zone methodology and website-use rules, the public map shell
and client, Belpost's shell and client, and two live read-only Belpost
responses for postcode `220030`.

NCA states that nationwide postal-code zones entered production in 2020, are
updated every six months, and derive from Belpost address membership, the
Address Register, ATE/TE data and mapped land-feature contours. This confirms
real official-derived postal zones, not a Belpost-authored delivery perimeter.
The actual current vector layer, edition, schema, source CRS and topology were
not retrieved. NCA's website-material rules do not establish redistribution,
derivative or API rights for the map database. Five anonymous map API probes
returned 404; this observation does not prove that no service exists.

Belpost's live `220030` observation returned 21 autocomplete rows and 89 total
search matches, with 21 rows on page one and one serving-office row. All
inspected postcode values were six digit and no Polygon/MultiPolygon geometry
was present. This one-code observation is not a national completeness measure
and supplies no release version or effective date.

No public-map view, assignment/address row, office point, administrative or
cadastral area, address/building feature, buffer, Voronoi/model surface or AGID
cell was promoted to postal geometry. House numbers and buildings require a
separate permitted stable relation. Shared tests verify exact search,
Polygon/MultiPolygon filtering, fit, opacity-0.22 fill, opacity-0.95 width-3
outline, clear/re-search and failure states, but BY has no eligible real-data
artifact, API area response or app end-to-end result.

[BY review](postal-context-belarus-m2.md), [source report](../reports/postal-context-m2/by-source-review-2026-08-29.json)
and engineering checks record the gate. Recheck after the pending-country pass
and `2026-09-05T11:50:56.469Z`, unless a current rights-cleared assignment and
NCA vector release appears earlier. After BY: 252 profiles, 194 pending, 58
blocked, 0 in progress, 0 evidence-verified M2; 127 manifests / 97 explicit
definitions. Next: **CH**. No second country was started.


## 2026-08-29 CH: current swisstopo postal areas published and visualized

CH now satisfies
`M2_current_swisstopo_plzo_postal_area_visualization`. Eight exact
swisstopo receipts pin the official-directory page, OGD conditions, technical
documentation, STAC metadata, EPSG:2056 Shapefile and both validation CSVs.
The source item is dated `2026-08-11`; the Shapefile SHA-256 is
`a58e105b…e0a60a`. Reviewed OGD conditions allow redistribution,
processing, enrichment and commercial use with attribution.

All 4,060 Swiss domicile-address NPA6 perimeter features are joined through
`ZIP_ID`, separated from 13 Liechtenstein features, transformed from LV95,
checked against all 5,716 official WGS84 CSV rows, simplified within five
metres and aggregated into 3,177 NPA4 Polygon/MultiPolygon results. The
published geometry is explicitly `derived` with seven-metre display
accuracy; it is not a cadastral, delivery, address, house-number or building
guarantee. Special non-area code classes receive no fabricated surface.

The immutable graph, geometry and descriptor are pinned at commit
[`0205bd986bb39632b88c5b68e53f62caa8693521`](https://github.com/veygrit-sys/Address-Grid-ID/commit/0205bd986bb39632b88c5b68e53f62caa8693521).
The real CH pack loads 3,177 nodes and 679,832 positions. API lookup `CH/1000`
returns a MultiPolygon; the app converts it to GeoJSON, fits bounds, draws a
0.22-opacity fill with a clear width-3 outline, displays normalized code,
geometry, provenance, source date and confidence, and passes clear/re-search
plus loading, no-match, multiple, API-failure and invalid-geometry states.
`CH/9490` returns no match, preserving LI identity.

[CH review](postal-context-switzerland-m2.md), [source report](../reports/postal-context-m2/ch-source-review-2026-08-29.json)
and [engineering checks](../reports/postal-context-m2/ch-checks-2026-08-29.json)
record 239 passing tests, zero failures and zero TypeScript errors. After CH:
252 profiles, 193 pending, 58 blocked, 0 in progress, 1 evidence-verified M2;
127 manifests / 97 explicit definitions. Next: **CY**. No second country was
started.

## 2026-08-29 CY: current assignments and 2011 statistical polygons compared, current areas blocked

CY now has
`M2_current_assignment_and_statistical_or_derived_postal_area_visualization`.
The exact official 2024 Post Code Directory and CYSTAT GML were byte and
SHA-256 verified. The directory contains 33,541 street rows and 757 community
rows, forming 1,131 distinct current four-digit assignments with no geometry.

The GML contains 852 statistical distributions, 879 Polygon patches and 845
four-digit geometry codes in EPSG:3048. It is a 2011 population-distribution
layer, not a current Cyprus Post perimeter. Only 832 current codes match; 299
current codes have no matching historical geometry, and 13 historical codes
are absent from current assignments. The malformed source literal
`2011-11-31` is retained as a quality exception and was not silently repaired.

No street, community, district, address, building, route, P.O. box, buffer,
Voronoi/model surface or AGID cell was promoted to postal geometry. House
numbers and buildings still require separate permitted stable relations. The
2011 geometry may only be considered later as explicitly historical
official-statistical context.

Shared tests verify normalized search, Polygon/MultiPolygon filtering, bounds
fit, translucent fill, visible outline, clear/re-search and error states. CY
has no production-eligible current artifact, so a real current postcode search
does not shade the 2011 layer and instead remains an explicit no-verified-area
outcome.

[CY review](postal-context-cyprus-m2.md), [source report](../reports/postal-context-m2/cy-source-review-2026-08-29.json)
and [engineering checks](../reports/postal-context-m2/cy-checks-2026-08-29.json)
record 180 passing tests, zero failures and zero TypeScript errors. Recheck
after the pending-country pass and `2026-09-29T13:16:00Z`, unless a current
rights-cleared area/member release appears earlier. Authentication, agreement,
new publication destination and deployment require explicit approval. After
CY: 252 profiles, 192 pending, 59 blocked, 0 in progress, 1 evidence-verified
M2; 127 manifests / 97 explicit definitions. Next: **CZ**. No second country
was started.

## 2026-08-30 CZ: current assignments and RÚIAN members verified, postcode areas blocked

CZ now has
`M2_current_assignment_and_derived_postcode_area_visualization`. Nine exact
official bodies were byte and SHA-256 verified: four Czech Post customer
outputs and their certificates plus the nationwide RÚIAN address release dated
2026-07-31. The operator classification contains 15,666 PSČ values; the RÚIAN
release contains 3,020,222 address rows and 2,677 distinct PSČ values. Every
RÚIAN code matched the operator classification and locality list.

Neither source contains postcode Polygon/MultiPolygon geometry. RÚIAN supplies
3,019,302 complete S-JTSK address definition points, with 920 rows missing
coordinates across 263 PSČ; every observed RÚIAN PSČ still has at least one
coordinate-bearing member. The operator denominator also includes 12,989
facility, organization, P.O. box, transport-hub or contracted-partner codes
without RÚIAN address rows. These classes and the 27 no-delivery-service codes
receive no invented surface.

RÚIAN metadata grants CC BY 4.0 reuse with attribution. The Czech Post download
surface and certificates did not expose an artifact-specific public
redistribution or derivative-publication grant, so exact operator bodies were
used for audit only and remain outside Git. No address point, facility,
organization, locality, administrative boundary, buffer, Voronoi/model surface
or AGID cell was promoted to postal geometry.

Shared tests verify normalized search, Polygon/MultiPolygon filtering, bounds
fit, translucent fill, visible outline, clear/re-search and failure states. CZ
has no pinned derived method, topology/uncertainty/holdout audit, immutable
artifact or real-data CZ API/app area response, so postcode search cannot yet
display a semi-transparent CZ area and M2 remains blocked.

[CZ review](postal-context-czechia-m2.md), [source report](../reports/postal-context-m2/cz-source-review-2026-08-30.json)
and [engineering checks](../reports/postal-context-m2/cz-checks-2026-08-30.json)
record 111 passing tests, zero failures and zero TypeScript errors. Recheck
after the pending-country pass and `2026-09-30T01:16:29.738Z`, unless a
rights-cleared current area/member release appears earlier. Authentication,
agreement, new publication destination and deployment require explicit
approval. After CZ: 252 profiles, 191 pending, 60 blocked, 0 in progress, 1
evidence-verified M2; 127 manifests / 97 explicit definitions. Next: **DE**.
No second country was started.

## 2026-08-30 DE: current national product documented, licensed data and real visualization blocked

DE now has
`M2_current_deutsche_post_delivery_area_visualization`. Ten exact official
bodies were byte and SHA-256 verified. BKG documents release `2026-02` with
8,169 five-digit delivery-postcode surfaces sourced from Deutsche Post Direkt,
semiannual updates and `PLZ_5` Shapefile delivery. The documentation is dated
2026-07-14, the terms 2026-07-21 and the catalogue update 2026-07-30.

The national bytes, WFS and WMS are restricted to eligible federal/V GeoBund
users under a licence agreement; an anonymous WFS capability request returned
HTTP 403. No authentication, agreement acceptance, payment or rights claim was
made. The public BKG ZIP contains three valid EPSG:25832 Polygon records for
`38350`, `38368` and `38379`, but is explicitly compatibility test data.
Its production-eligible count is therefore zero and it remains outside Git.

BKG geometry is a generalized cartographic delivery surface, not an
administrative boundary or exact street/house/building relation. Large-recipient
and other non-area codes receive no buffer, proxy boundary, Voronoi or AGID-cell
surface. Austrian codes `87491`, `87567`, `87568` and `87569` routed
through Germany remain Austrian identity and are excluded from German coverage.

Shared tests verify normalized search, Polygon/MultiPolygon filtering, bounds
fit, translucent fill, visible outline, clear/re-search and failure states. DE
has no authorized current national artifact, immutable publication or real-data
DE API/app response, so postcode search cannot yet display a verified
semi-transparent German delivery area and M2 remains blocked.

[DE review](postal-context-germany-m2.md), [source report](../reports/postal-context-m2/de-source-review-2026-08-30.json)
and [engineering checks](../reports/postal-context-m2/de-checks-2026-08-30.json)
record 110 passing tests, zero failures and zero TypeScript errors. Recheck after
the pending-country pass and `2026-09-30T02:00:12.877Z`. Authentication,
agreement, payment, new publication destination and deployment require explicit
approval. After DE: 252 profiles, 190 pending, 61 blocked, 0 in progress, 1
evidence-verified M2; 127 manifests / 97 explicit definitions. Next: **DK**.
No second country was started.

## Denmark (DK) review - 2026-08-30

- Result: blocked at M1 under `M2_current_dagi_postnummerinddeling_visualization`.
- Official observation: 1,089 current land-clipped DAWA MultiPolygons and 1,089 matching four-digit records; exact GeoJSON SHA-256 `5f489e68f49f95fe8e89ec9cd38c7f8a93986b88a95a1b4233bf3bed22e2bbf2`.
- Rights: Dataforsyningen terms permit reuse and redistribution with authority, dataset, acquisition/service and terms attribution.
- Quality blockers: 39 Turf-invalid geometries; three-position rings for `4000` and `8543`; zero `ErGadepostnummer` fields; live response is mutable and not an immutable public artifact. No repair or proxy surface was created.
- App status: shared fit/translucent-fill/outline/clear/re-search tests pass, but DK-specific runtime/API tests use synthetic `0000`; real DK API and app-area visualization remain false.
- Evidence: [source report](../reports/postal-context-m2/dk-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/dk-checks-2026-08-30.json), and [technical review](postal-context-denmark-m2.md).
- Recheck: after the pending-country pass and 2026-09-30 unless a corrected immutable release appears earlier. Publication or deployment requires explicit approval.
- Next country: `EE` (Estonia).

## Estonia (EE) review - 2026-08-30

- Result: blocked at M1 under `M2_current_aks_sihtnumbri_alad_visualization`.
- Official observation: 5,436 distinct current AKS postcode areas, comprising 4,320 Polygons and 1,116 MultiPolygons; exact page SHA-256 values `b4a2df24…b77a2847` and `54a67aac…571b81`. Postcode `10621` independently returned a real MultiPolygon.
- Quality blockers: WFS paging is explicitly non-transaction-safe; no release edition or validity is embedded; 91 features are Turf-invalid. No repair or proxy surface was created.
- Rights: agency WFS terms permit reuse and redistribution with attribution, but capabilities flag additional external-geometry terms and Omniva's separate database terms require prior consent for publication. The complete artifact publication right remains unresolved; no agreement or operator database download was accepted.
- App status: shared fit/translucent-fill/outline/loading/no-result/multiple/failure/invalid-geometry/clear/re-search tests pass, but EE runtime/API tests use synthetic `00000`; real EE API and app-area visualization remain false.
- Evidence: [source report](../reports/postal-context-m2/ee-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/ee-checks-2026-08-30.json), and [technical review](postal-context-estonia-m2.md).
- Recheck: after the pending-country pass and 2026-09-30 unless a corrected immutable release or clear publication grant appears earlier. Agreement, publication or deployment requires explicit approval.
- Next country: `ES` (Spain).

## Spain (ES) review - 2026-08-30

- Result: blocked at M1 under `M2_current_correos_postcode_area_visualization`.
- Official observation: CartoCiudad candidate geometry for `28013` is null, find returns a Point, and WMS GetFeatureInfo returns one real official EPSG:4326 Polygon with one closed 16-position ring. Ten official bodies were byte- and SHA-256-bound.
- Rights: CartoCiudad/CNIG say Correos postcode surfaces are view/consultation only and Correos alone distributes the database. The complete database and polygon layer require payment, contract and a restrictive licence that does not permit a public third-party postcode search or sublicensing. No purchase, agreement, authentication or operator download occurred.
- Quality blockers: no complete current assignment and area/non-area denominator, national polygon count, immutable release, nationwide topology audit or approved published artifact. The real sample Polygon has `productionEligibleRecords: 0`; no point, address, administrative boundary, buffer, proxy or AGID cell became an area.
- Identity: `EA` remains a separate Africa-queue ledger identity. `ES_BAL` and `ES_CAN` remain ES address-format variants; neither rule changes source identity or territory.
- App status: shared normalization, Polygon/MultiPolygon filtering, bounds fit, translucent fill, visible outline, loading/no-result/multiple/API-failure/invalid-geometry/clear/re-search tests pass. No real ES artifact loader, API response or app-area visualization exists.
- Evidence: [source report](../reports/postal-context-m2/es-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/es-checks-2026-08-30.json), and [technical review](postal-context-spain-m2.md).
- Recheck: after the pending-country pass and `2026-09-30T04:36:12.827Z`, unless a public rights-cleared immutable release appears earlier. Payment, contract, authentication, publication or deployment requires explicit approval.
- After ES: 252 profiles, 187 pending, 64 blocked, 0 in progress, 1 evidence-verified M2; 128 manifests / 98 explicit definitions.
- Next country: `FI` (Finland). No second country was started.

## Finland (FI) M2 verified - 2026-08-30

- Result: evidence-verified under `M2_current_posti_assignment_and_paavo_statistical_area_visualization`.
- Assignment: Posti `PCF_20260829` has 3,784 records; the FI runtime publishes all 3,747 non-Åland assignments and excludes all 37 AX rows. Leading zeroes and Posti type classifications are preserved.
- Geometry: 2,976 current normal assignments join exactly to Statistics Finland Paavo `pno_2026` sea-extended Polygon/MultiPolygon features. Paavo is `derived` statistical display evidence, not a Posti delivery perimeter. Nine current normal and 762 special/endpoint assignments remain explicit non-areas.
- Rights and lineage: exact official pages, terms, WFS, PCF and Paavo bytes, capture/download date, editions and SHA-256 values are recorded. The transformed artifacts carry the Posti service notice and Statistics Finland CC BY 4.0 attribution. No raw dump, address, person, customer, building or land-right record is committed.
- Application: `00 100` normalizes to `00100`; the real API returns a Paavo Polygon, the app computes fit bounds and uses fill opacity `0.22` plus outline opacity `0.95`/width `3`. Loading, multiple, API failure, invalid geometry, non-area reasons, clear and re-search are implemented; corporate `00022`, missing-Paavo normal `42720`, and excluded AX `22100` are tested without invented surfaces.
- Validation: FI suite 149/149, shared runtime 159/159, `tsc --noEmit`, and a second byte-identical build all pass. Browser E2E was replaced by a deterministic real HTTP API plus application GeoJSON/map-layer harness.
- Artifacts: [graph](https://github.com/veygrit-sys/Address-Grid-ID/blob/4c02ee0513c7ef496662ed33b0963158197b4edf/data/postal_country_packs/fi/postal-context/m2/graph.json), [geometry](https://github.com/veygrit-sys/Address-Grid-ID/blob/4c02ee0513c7ef496662ed33b0963158197b4edf/data/postal_country_packs/fi/postal-context/m2/geometry.json), [descriptor](https://github.com/veygrit-sys/Address-Grid-ID/blob/4c02ee0513c7ef496662ed33b0963158197b4edf/data/postal_country_packs/fi/postal-context/m2/descriptor.json).
- Evidence: [source report](../reports/postal-context-m2/fi-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/fi-checks-2026-08-30.json), [technical review](postal-context-finland-m2.md), and [source/reuse notice](../data/postal_country_packs/fi/postal-context/M2-SOURCE-NOTICE.md).
- After FI: 252 profiles, 186 pending, 64 blocked, 0 in progress, 2 evidence-verified M2; 128 manifests / 98 explicit definitions.
- Next country: `FO` (Faroe Islands). No second country was started.


## Faroe Islands (FO) M2 verified - 2026-08-30

- Result: evidence-verified under `M2_current_umhvorvisstovan_postoki_visualization`.
- Source: Umhvørvisstovan `Postnr` layer 0 publishes 117 distinct current three-digit postøki as 115 source Polygons and two source MultiPolygons. ArcGIS 11.4, document 2.9.0, item GUID and every object ID/count are pinned; the EPSG:4326 query SHA-256 is `952d2b52d358cd2671673ea1bc5ee3e9161eacd6b15981a9c97f9fc08709ced2`.
- Rights: the June 2019 Faroese map-data terms permit commercial and non-commercial copying, distribution, publication, modification and combination with attribution. Exact catalogue, service, layer, item, query and terms captures have retrieval time, edition and SHA-256 evidence.
- Geometry: 116 published Polygons and one MultiPolygon have 52,065 positions and 118 closed rings. Code `476` alone had eight source self-intersections; deterministic Turf buffer `0.000001 metre / 8 steps` makes it valid with relative area delta `1.5494530300567815e-9`, and it is explicitly labelled derived/confidence `0.999999`. No absent area is invented.
- Authority separation: the mapped postal identity uses `official_postal_mapping_authority`; unchanged surfaces use `official_postal_geometry`, while the repaired `476` surface uses `derived_geometry`. Operator deliverability, addresses, buildings, people, customers and land rights are not claimed or bundled.
- Application: `FO-100` normalizes to `100`; the real API returns a Polygon, the app converts it to GeoJSON, fits bounds and uses fill opacity `0.22` plus outline opacity `0.95`/width `3`. Loading, no-match, multiple, API failure, invalid geometry, provenance metadata, clear and re-search are covered. `999` is no-match and `FO100` is rejected.
- Validation: FO policy/repository/API/app 9/9, shared postal-area UI 5/5, shared runtime 159/159, focused typecheck, and byte-identical second build all pass. Repository-wide typecheck remains blocked only by six pre-existing unresolved local workspace aliases and has no FO diagnostic. Deterministic real HTTP plus app map-source/style/fit assertions provide the drawing evidence.
- Artifacts: [graph](https://github.com/veygrit-sys/Address-Grid-ID/blob/9554e12402e3d2c80bf53bbe7d0c4120a4716925/data/postal_country_packs/fo/postal-context/m2/graph.json), [geometry](https://github.com/veygrit-sys/Address-Grid-ID/blob/9554e12402e3d2c80bf53bbe7d0c4120a4716925/data/postal_country_packs/fo/postal-context/m2/geometry.json), [descriptor](https://github.com/veygrit-sys/Address-Grid-ID/blob/9554e12402e3d2c80bf53bbe7d0c4120a4716925/data/postal_country_packs/fo/postal-context/m2/descriptor.json).
- Evidence: [source report](../reports/postal-context-m2/fo-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/fo-checks-2026-08-30.json), [technical review](postal-context-faroe-islands-m2.md), and [source/reuse notice](../data/postal_country_packs/fo/postal-context/M2-SOURCE-NOTICE.md).
- After FO: 252 profiles, 185 pending, 64 blocked, 0 in progress, 3 evidence-verified M2; 129 manifests / 99 explicit definitions.
- Next country: `FR` (France). No second country was started.

## France (FR) M2 verified - 2026-08-30

- Result: evidence-verified under the repository-specific `M2_experimental` definition for a scoped `75001`-`75020` release.
- Assignment: the pinned La Poste official CSV has 39,192 rows, 6,328 distinct postal codes and 35,007 distinct commune codes. Each target code maps exactly once to INSEE `75101`-`75120`; CSV SHA-256 is `f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22`.
- Geometry: 20 exact Data Fair responses expose the matching administrative MultiPolygons; aggregate response SHA-256 is `76d9f52e38386339a15d3becc6f4ed6eb3605af3cb82669cea772feb8fd586ec`. The pack publishes 20 source-identical, boolean-valid MultiPolygons with 1,157 positions and labels every surface `derived`. This is not a La Poste boundary or national coverage.
- Rights: La Poste and Etalab inputs use Open Licence 2.0. Exact source, metadata, licence and response-set bytes, updates, retrieval time, hashes, attribution and transformations are pinned. Raw source downloads are not committed.
- Authority separation: official postal assignment, official administrative geometry and the derived postcode display join stay distinct. No postcode outside the scope, CEDEX/PO box/route/organization, address, building, recipient, customer, deliverability, AGID proxy or land-right object receives an invented area.
- Application: `７５ ００１` normalizes to `75001`; the real API returns a MultiPolygon, the app computes fit bounds and uses fill opacity `0.22` plus outline opacity `0.95`/width `3`. Loading, no-match, multiple, API failure, invalid geometry, provenance metadata, clear and re-search are covered. `69001` is no-match and `750-01` is invalid.
- Validation: FR real-data suite 7/7, FR legacy/shared regression 74/74, repository-wide `tsc --noEmit`, and a byte-identical second build all pass. Deterministic HTTP API plus application GeoJSON/map-source/style/fit assertions provide the rendering evidence.
- Artifacts: [graph](https://github.com/veygrit-sys/Address-Grid-ID/blob/9698166109b7dffdbf3ee321ad28a669f3636512/data/postal_country_packs/fr/postal-context/m2/graph.json), [geometry](https://github.com/veygrit-sys/Address-Grid-ID/blob/9698166109b7dffdbf3ee321ad28a669f3636512/data/postal_country_packs/fr/postal-context/m2/geometry.json), [descriptor](https://github.com/veygrit-sys/Address-Grid-ID/blob/9698166109b7dffdbf3ee321ad28a669f3636512/data/postal_country_packs/fr/postal-context/m2/descriptor.json).
- Evidence: [source report](../reports/postal-context-m2/fr-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/fr-checks-2026-08-30.json), [technical review](postal-context-france-m2.md), and [source/reuse notice](../data/postal_country_packs/fr/postal-context/M2-SOURCE-NOTICE.md).
- After FR: 252 profiles, 184 pending, 64 blocked, 0 in progress, 4 evidence-verified M2; 129 manifests / 99 explicit definitions.
- Next country: `GB` (United Kingdom). No second country was started.


## United Kingdom (GB) M2 review - 2026-08-30

- Result: blocked at M1 under `M2_current_uk_unit_postcode_area_visualization`.
- Official observation: ONSPD and OS Code-Point Open/OS NI products provide postcode points or crosswalks, not unit-postcode boundaries. The reviewed Code-Point Open release is August 2026. Seven official page bodies are pinned by retrieval time, byte length and SHA-256; one stale legacy PDF URL returned HTTP 404.
- Polygon source: OS Code-Point with Polygons supplies about 1.7 million quarterly notional Great Britain extents derived from PAF delivery-address points, but access/use are agreement-controlled and the product has no Northern Ireland polygon coverage. No agreement or Data Exploration Licence was accepted, and zero production-eligible records were acquired.
- Geometry policy: notional OS polygons are derived, not official Royal Mail boundaries. Points, buffers, reconstructed Voronoi/Thiessen cells, administrative proxies, buildings, AGID cells, and synthetic `ZZ0` fixtures are not promoted. P.O. Box, BFPO, route, organization, large-user, BT, and other unavailable/non-area cases retain truthful non-area results.
- App status: shared normalization, Polygon/MultiPolygon filtering, bounds fit, translucent fill, visible outline, loading/no-match/multiple/API-failure/invalid-geometry/provenance/clear/re-search tests pass. No authorized real GB artifact, API geometry response, or semi-transparent app area exists, so M2 remains unmet.
- Validation: GB/relevant UI suite 35/35, shared Postal Context suite 161/161, ledger/rollout suite 12/12, and repository-wide `tsc --noEmit` all pass. Raw official captures and controlled data are not committed.
- Evidence: [source report](../reports/postal-context-m2/gb-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/gb-checks-2026-08-30.json), and [technical review](postal-context-united-kingdom-m2.md).
- Recheck: after the pending-country pass and `2026-09-06T07:40:08.000Z`, unless an unrestricted current polygon release or explicit licence authority appears earlier. Authentication, agreement, payment, publication, new destination, or deployment requires explicit approval.
- After GB: 252 profiles, 183 pending, 65 blocked, 0 in progress, 4 evidence-verified M2; 129 manifests / 99 explicit definitions.
- Next country: `GG` (Guernsey). No second country was started.

## Guernsey (GG) M2 review - 2026-08-30

- Result: blocked at M1 under `M2_current_guernsey_postcode_area_visualization`.
- Official observation: Guernsey Post provides an official interactive Bailiwick address/postcode finder, but no public bulk assignment file, postcode Polygon/MultiPolygon release, or open redistribution grant. Postcodes usually span multiple addresses; organizations and PO Boxes can have unique non-area codes.
- Open data: ONSPD May 2026 has 3,384 GY rows (3,298 live; 86 terminated; 10 districts; 16 sectors), but the User Guide states Channel Islands coordinates are unavailable. All sampled records have PQI 9, null grid references and unusable coordinate placeholders, so zero points or areas are promoted.
- Controlled products: Digimap advertises paid government-licensed postcode centroids, a credentialed/licensed address-point CAF, and agreement/API-key base-map tiles. Public States of Guernsey land-parcel polygons have postcode attributes but are cadastral, not postcode geometry; no feature rows were queried or committed and no parcel dissolve was made.
- Geometry policy: points/centroids, ONSPD placeholders, parcel dissolves, administrative proxies, tiles, AGID cells and synthetic fixtures are not promoted. PO Box, organization and other non-area cases retain truthful unavailable/non-area outcomes.
- App status: shared normalization, Polygon/MultiPolygon filtering, bounds fit, translucent fill, visible outline, loading/no-match/multiple/API-failure/invalid-geometry/provenance/clear/re-search tests pass. No authorized real GG artifact, API geometry response, or semi-transparent area exists, so M2 remains unmet.
- Validation: GG metadata/source/count/blocking suite 4/4, shared Postal Context suite 161/161, shared area UI suite 23/23, ledger/rollout suite 12/12, and repository-wide `tsc --noEmit` pass. Raw official captures, addresses and land/cadastre rows are not committed.
- Evidence: [source report](../reports/postal-context-m2/gg-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/gg-checks-2026-08-30.json), and [technical review](postal-context-guernsey-m2.md).
- Recheck: after the pending-country pass and `2026-09-06T08:18:41.047Z`, unless an unrestricted current release or explicit authority appears earlier. Authentication, agreement, API key, payment, publication, new destination, land-record access, or deployment requires explicit approval.
- After GG: 252 profiles, 182 pending, 66 blocked, 0 in progress, 4 evidence-verified M2; 130 manifests / 100 explicit definitions.
- Next country: `GI` (Gibraltar). No second country was started.

## Gibraltar (GI) M2 review - 2026-08-30

- Result: blocked at M1 under `M2_current_gibraltar_generic_postcode_visualization`.
- Postal denominator: UPU Universal DataBase August 2026 lists Gibraltar among countries using one code for the whole country, `GX11 1AA`; current Royal Gibraltar Post Office addresses use the same code. The 2013 UPU country sheet's `E/V` is a domestic addressing exception, not a second postcode. The denominator is 1/1 and official sub-country postal areas are zero.
- Rights and geometry: the HM Government Geoportal exposes maps/WMS/WFS, but its disclaimer says access does not grant reproduction or distribution authority without prior approval. Five Geoportal/OAR pages were web-verified but deterministic direct capture returned HTTP 403. No feature or address row was queried, and no government map, administrative boundary, point, parcel, building, buffer, AGID cell or synthetic fixture became postal geometry.
- Classification: a future whole-territory surface can only be `virtual`, never an official postal boundary, and only after explicit derivative, publication and serving rights plus immutable edition/SHA-256 evidence. Organization and PO Box examples receive no invented area.
- App status: shared Polygon/MultiPolygon filtering, fit, translucent fill, visible outline and clear/re-search checks pass. No rights-cleared GI artifact, real GI API geometry response or semi-transparent app area exists; the attempted browser runtime was blocked by Windows sandbox ACL initialization and no browser E2E is claimed.
- Validation: GI metadata/source/rights/blocking suite 4/4, shared Postal Context runtime 161/161, shared area UI 23/23, ledger/rollout suite 12/12, and repository-wide `tsc --noEmit` pass. Raw official captures, addresses and land/cadastre rows are not committed.
- Evidence: [source report](../reports/postal-context-m2/gi-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/gi-checks-2026-08-30.json), and [technical review](postal-context-gibraltar-m2.md).
- Recheck: after the pending-country pass and `2026-09-06T08:50:00.000Z`, unless explicit rights or an unrestricted current release appears earlier. Authentication, contract/NDA, API key, feature-row access, publication, new destination or deployment requires explicit approval.
- After GI: 252 profiles, 181 pending, 67 blocked, 0 in progress, 4 evidence-verified M2; 131 manifests / 101 explicit definitions.
- Next country: `GR` (Greece). No second country was started.


## Greece (GR) M2 review - 2026-08-30

- Result: blocked at M1 under `M2_current_elta_assignment_and_postcode_area_visualization`.
- Official observation: ELTA exposes street/village lookup but no reviewed reusable bulk assignment file, postcode Polygon/MultiPolygon release or product-specific redistribution grant. Eleven official response bodies are pinned by retrieval time, byte length and SHA-256.
- Crosswalk quality: TERCET 2025 contains 1,041 unique five-digit Greece codes, with zero duplicates, invalid values or blanks and 52 NUTS3 values. Methodology V4 records zero member-state postal/address rows, 1,041 rows carried from GISCO Postal Code 2020 and GeoNames as the primary source. The CSV has only NUTS3 and CODE - no geometry.
- Geometry and rights: GISCO explicitly provides points with omission/location caveats, not ELTA perimeters. ELSTAT cartography is census/statistical and its request declaration limits purpose and third-party redistribution. No ELSTAT, address, building, cadastral or land row was queried or committed; no point, NUTS/admin proxy, buffer, Voronoi cell, parcel/building dissolve or synthetic fixture became a postal area.
- App status: shared Polygon/MultiPolygon filtering, fit, translucent fill, visible outline, states, metadata, clear and re-search tests pass. No authorized real GR artifact, API geometry response or semi-transparent app area exists, so M2 remains unmet and browser E2E is not claimed.
- Validation: GR metadata/source/audit/blocking suite 10/10, existing GR runtime/route/source regression 139/139, shared Postal Context runtime 161/161, shared area UI 23/23, ledger/rollout suite 12/12, and repository-wide `tsc --noEmit` pass. Raw official captures and crosswalk rows are not committed.
- Evidence: [source report](../reports/postal-context-m2/gr-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/gr-checks-2026-08-30.json), and [technical review](postal-context-greece-m2.md).
- Recheck: after the pending-country pass and `2026-09-06T09:16:27.503Z`, unless an unrestricted current ELTA denominator and postcode polygon release appears earlier. Authentication, request submission, terms/contract acceptance, payment, publication, new destination, land-record access or deployment requires explicit approval.
- After GR: 252 profiles, 180 pending, 68 blocked, 0 in progress, 4 evidence-verified M2; 131 manifests / 101 explicit definitions.
- Next country: `HR` (Croatia). No second country was started.
## Croatia (HR) M2 review - 2026-08-30

- Target: Croatia (`HR`), Europe. The source-of-truth status command selected HR with no country in progress; no second country was started.
- M2 result: **blocked / unmet**. HR now has a country-specific `M2_current_hrvatska_posta_assignment_and_postcode_area_visualization` definition. Hrvatska pošta exposes current Excel/XML assignment downloads, but its legal notice does not establish AGID reuse or redistribution rights. DGU confirms graphical delivery-office areas, but release is request- and price-controlled and no reusable release or explicit operator-office identifier crosswalk was obtained.
- Real-data audit: TERCET 2025 HR has 667 rows, 667 distinct five-digit codes after quote normalization, 0 duplicate or invalid normalized codes, 21 NUTS3 values, and only `NUTS3`/`CODE` columns. Methodology V4 attributes 0 codes to a member-state postal dataset, 289 to address data, 24 to GeoNames and 354 to manual location/geocoding. There are 0 Polygon/MultiPolygon records and 0 production-eligible artifacts.
- App status: shared Polygon/MultiPolygon filtering, fit, translucent fill, visible outline, states, metadata, clear and re-search tests pass. No authorized real HR artifact, API geometry response or translucent app area exists, so M2 remains unmet and browser E2E is not claimed.
- Validation: HR metadata/source/audit/blocking suite 10/10, existing HR runtime/route/source regression 139/139, shared Postal Context runtime 161/161, shared area UI 23/23, ledger/rollout suite 12/12, and repository-wide `tsc --noEmit` pass. Raw official captures and crosswalk rows are not committed.
- Evidence: `docs/postal-context-croatia-m2.md`, `reports/postal-context-m2/hr-source-review-2026-08-30.json`, and `reports/postal-context-m2/hr-checks-2026-08-30.json`.
- Retry: after pending countries and 2026-09-06T09:42:03.227Z; do not authenticate, download restricted files, seek consent, request or pay for DGU data, accept terms, query address/building/cadastral/land rows, create a destination, publish or deploy without explicit approval.
- After HR: 252 profiles, 179 pending, 69 blocked, 0 in progress, 4 evidence-verified M2; 131 manifests / 101 explicit definitions.
- Next country: `HU` (Hungary). No second country was started.


## Hungary (HU) M2 review - 2026-08-30

- Target: Hungary (`HU`), Europe. The source-of-truth status command selected HU with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under the refined `M2_current_magyar_posta_assignment_and_postcode_area_visualization` definition. The public Partner Extra assignment is current and application-usable, but has neither explicit special/non-geographic classification nor area geometry.
- Real-data audit: Magyar Posta XML has 3,817 rows, 3,817 distinct valid four-digit codes, 16 leading-zero codes, 0 duplicate/invalid codes, and only `Code`/`city`/`TimeWindowID`. TERCET 2025 has 3,156 distinct valid codes and only `NUTS3`/`CODE`; it overlaps 3,049 current codes (79.879%), omits 768 and adds 107. Both have 0 Polygon/MultiPolygon records.
- Authority and geometry: TERCET/GISCO points and NUTS correspondence, KSH administrative units and controlled KCR addresses remain separate from postal membership. No point, buffer, Voronoi cell, administrative proxy, address, building, parcel, cadastral object or synthetic fixture was promoted; no raw rows were committed.
- App status: shared Polygon/MultiPolygon validation, fit, translucent fill, visible outline, states, provenance, clear and re-search tests pass. No rights-cleared real HU artifact, API geometry response, fit or translucent area exists, so M2 remains unmet and browser E2E is not claimed.
- Validation: HU review 11/11, existing HU regression 139/139, shared Postal Context runtime 161/161, shared area UI 23/23, ledger/rollout 12/12, and repository-wide `tsc --noEmit` pass (346/346 tests total). Raw official captures and postcode rows are not committed.
- Evidence: `docs/postal-context-hungary-m2.md`, `reports/postal-context-m2/hu-source-review-2026-08-30.json`, and `reports/postal-context-m2/hu-checks-2026-08-30.json`.
- Retry: after pending countries and 2026-09-06T10:04:25.824Z; do not authenticate, request controlled KCR/address/cadastral data, accept terms/contracts, request keys, pay, create a destination, publish or deploy without explicit approval.
- After HU: 252 profiles, 178 pending, 70 blocked, 0 in progress, 4 evidence-verified M2; 131 manifests / 101 explicit definitions.
- Next country: `IE` (Ireland). No second country was started.


## Ireland (IE) M2 review - 2026-08-30

- Target: Ireland (`IE`), Europe. The source-of-truth status command selected IE with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under the refined `M2_current_eircode_identity_and_routing_key_area_visualization` definition. A full seven-character Eircode is an address/property identity and must remain point/non-area; only its separately governed three-character Routing Key can have an area context.
- Current rights: ECAF/ECAD assignment and coordinate products require annual licences and secure-portal access. No licence, contract, account, key or payment was accepted and no Finder, address or coordinate row was extracted.
- Public-data audit: TERCET 2025 has 139 rows, 139 unique format-valid Routing Keys including D6W, 0 duplicates/invalid keys, 8 NUTS3 values and only `NUTS3`/`CODE`. Methodology V4 attributes all 139 IE rows to GeoNames and none to member-state postal/address data; there are 0 coordinates and 0 Polygon/MultiPolygon records.
- CSO evidence: the 2026 SIMS report uses Routing Key Areas internally but keeps connection microdata inside CSO; Q1 2026 notes say substation-based splits may not precisely follow geographic boundaries. No CSO boundary or confidential row was acquired.
- Geometry policy: no Finder point, GISCO/GeoNames point, NUTS/county/statistical proxy, buffer, Voronoi cell, building/parcel dissolve or generic synthetic planning cell was promoted. Full-code non-area and future official/derived/virtual Routing Key context remain explicit.
- App status: shared Polygon/MultiPolygon filtering, fit, translucent fill, visible outline, point-only non-area and clear checks pass. No rights-cleared real IE artifact, API geometry response, map fit or translucent area exists, so browser E2E is not claimed.
- Validation: IE evidence 5/5, rollout invariants 8/8, shared area UI 5/5, shared runtime 24/24, and repository-wide `tsc --noEmit` pass (43/43 recorded assertions). PDF text/digests reconcile, but local raster inspection failed with Windows error 206 and is not claimed.
- Evidence: `docs/postal-context-ireland-m2.md`, `reports/postal-context-m2/ie-source-review-2026-08-30.json`, and `reports/postal-context-m2/ie-checks-2026-08-30.json`. Raw official captures and rows are not committed.
- Retry: after pending countries and 2026-09-06T10:32:18.330Z; do not register, authenticate, accept terms/contracts, request data/keys, pay, crawl Finder, create a destination, publish or deploy without explicit approval.
- After IE: 252 profiles, 177 pending, 71 blocked, 0 in progress, 4 evidence-verified M2; 132 manifests / 102 explicit definitions.
- Next country: `IM` (Isle of Man). No second country was started.

## Isle of Man (IM) M2 review - 2026-08-30

- Target: Isle of Man (`IM`), Europe. The source-of-truth status command selected IM with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under the new `M2_current_unit_postcode_and_truthful_postal_area_visualization` definition. Exact unit-postcode geometry and separately labelled outward-code postal context remain distinct, and no point, sentinel or administrative proxy may become an area.
- Current ONSPD audit: the May 2026 public query returned 4,591 live rows, 4,591 distinct valid IM unit postcodes, 0 duplicates and 0 invalid codes across 10 outward codes. Every row has `GRIDIND=9`, null easting/northing, online sentinel `LAT=100`/`LONG=0`, and no ArcGIS geometry. The official user guide states that no geographic coordinates are provided for Isle of Man postcodes.
- Rights and access: non-BT ONSPD reuse is available under OGL v3 with required ONS/OS/Royal Mail attribution. The Post Office Finder is personal-use-only, and RFQ47 describes postcode lookup as an internal capped RESTful API. No Finder address, credential, contact, contract, payment, key or internal API was used.
- Government GIS audit: all six advertised folders yielded 25 services, 122 layers and 4 tables with zero metadata errors. No name contained `postcode` or `postal`; the only broad `post` matches were point layers for post boxes and post offices. No facility feature was queried and no point was promoted.
- Geometry policy: 0 exact unit-postcode surfaces, 0 outward-code postal surfaces and 0 production-eligible records. Sentinels, facility points, constituencies/administration, addresses, routes, PO boxes, organisations, buffers, Voronoi cells, parcels/buildings and synthetic fixtures remain unavailable or separate authority.
- App status: shared Polygon/MultiPolygon filtering, point-only non-area handling, fit, translucent fill, visible outline and clear checks pass. No rights-cleared real IM artifact, API geometry response, map fit or translucent area exists, so browser E2E is not claimed.
- Validation: IM evidence 6/6, rollout invariants 8/8, shared area UI 5/5, shared runtime 24/24 and repository-wide `tsc --noEmit` pass (44/44 recorded assertions). PDF text/digests reconcile, but local raster inspection failed with Windows error 206 and is not claimed.
- Evidence: `docs/postal-context-isle-of-man-m2.md`, `reports/postal-context-m2/im-source-review-2026-08-30.json`, and `reports/postal-context-m2/im-checks-2026-08-30.json`. Raw official captures and postcode/address rows are not committed.
- Retry: after pending countries and `2026-09-06T11:20:49.034Z`; do not contact procurement, register, authenticate, accept terms/contracts, request an API overview/key/data, pay, crawl Finder, create a destination, publish or deploy without explicit approval.
- After IM: 252 profiles, 176 pending, 72 blocked, 0 in progress, 4 evidence-verified M2; 133 manifests / 103 explicit definitions.
- Next country: `IS` (Iceland). No second country was started.

## Iceland (IS) M2 verified - 2026-08-30

- Target: Iceland (`IS`), Europe. The source-of-truth status command selected IS with no country in progress; no second country was started.
- Result: evidence-verified under `M2_current_byggdastofnun_postnumer_visualization`.
- Official source and rights: Byggðastofnun's authority page, metadata edition 1.0, WFS 2.0.0 capabilities, schema and explicit EPSG:4326 query are pinned at `2026-08-30T12:20:57.000Z` by byte length and SHA-256. Public copying, reuse and publication are recorded with the exact attribution `Byggt á gögnum frá Byggðastofnun.` and provider disclaimer; no authentication, contract, payment, account, new destination or deployment was used.
- Geometry and exceptions: 175 source features yield all 174 distinct current codes as 32 Polygons and 142 MultiPolygons (261,851 positions / 252 closed rings). Code 310's two rows are unioned by postcode; the 815/816 UUID collision is not identity. All 62 deterministic repairs are explicit `derived_geometry` at confidence `0.99999`, 112 unchanged surfaces remain official at confidence `1`, maximum relative area delta is `0.000008030888399062609`, and 12 source overlaps remain multiple-candidate evidence without clipping or invented areas.
- Authority separation: no point, route, PO box, organisation, address, building, customer, recipient or land-right row is published; no statistical, administrative or AGID surface replaces the postal source.
- Application: `1 02` normalizes to `102`; the real API returns its Byggðastofnun MultiPolygon, and the app converts it, computes fit bounds and uses fill opacity `0.22` plus outline opacity `0.95`/width `3`. Normalized code, geometry type, official/derived provenance, source date and confidence are present. Loading, no-match, multiple, API failure, invalid geometry, clear and re-search are covered; `101` verifies derived repair, `999` no-match and `10A` invalid.
- Validation: Iceland suite 150/150, shared runtime 162/162, repository `tsc --noEmit`, full shared topology and a second byte-identical build all pass (312 gated test executions). Browser E2E was replaced by a deterministic real HTTP API plus application GeoJSON/map-layer harness.
- Artifacts: [graph](https://github.com/veygrit-sys/Address-Grid-ID/blob/2c0f6937a0b0fb0b790097d6f3a4a49fad12918a/data/postal_country_packs/is/postal-context/m2/graph.json), [geometry](https://github.com/veygrit-sys/Address-Grid-ID/blob/2c0f6937a0b0fb0b790097d6f3a4a49fad12918a/data/postal_country_packs/is/postal-context/m2/geometry.json), [descriptor](https://github.com/veygrit-sys/Address-Grid-ID/blob/2c0f6937a0b0fb0b790097d6f3a4a49fad12918a/data/postal_country_packs/is/postal-context/m2/descriptor.json).
- Evidence: [source report](../reports/postal-context-m2/is-source-review-2026-08-30.json), [engineering checks](../reports/postal-context-m2/is-checks-2026-08-30.json), [technical review](postal-context-iceland-m2.md), [build report](../reports/postal-context-m2/is-build-2026-08-30.json), and [source/reuse notice](../data/postal_country_packs/is/postal-context/M2-SOURCE-NOTICE.md). Raw official captures and WFS rows are not committed.
- After IS: 252 profiles, 175 pending, 72 blocked, 0 in progress, 5 evidence-verified M2; 133 manifests / 103 explicit definitions.
- Next country: `IT` (Italy). No second country was started.

## Italy (IT) M2 review - 2026-08-30

- Target: Italy (`IT`), Europe. The source-of-truth status command selected IT with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under the refined `M2_current_poste_italiane_assignment_and_postcode_area_visualization` definition. A complete current assignment, explicit publication rights and real CAP area geometry are all mandatory.
- Official update: Poste Italiane's third 2025 update is effective from 25 May 2026 and replaced CAPs remain valid for at least twelve months. Its 172,296-byte ZIP contains exactly two SHA-pinned PDF change lists and no CSV, GeoJSON, Shapefile, GeoPackage, complete nationwide assignment or Polygon/MultiPolygon.
- Rights and denominator: CAP Professional describes multi-CAP streets, arcs and civic range/parity, but requires purchase, registration/login and a PIN. Poste's current FAQ limits the database to internal use and prohibits transfer to third parties. No product data, credential, contract, payment or provider contact was used.
- Open-data audit: ANNCSU advertises monthly open address downloads and daily APIs, but the official schema has zero CAP fields and the national download returned 403; zero address rows were acquired. ISTAT's 2026 WGS84 release is administrative/statistical geometry, not CAP geometry. No ANNCSU point, ISTAT administration, DBGT building, cadastral parcel, buffer, Voronoi cell or synthetic fixture was promoted.
- App status: shared Polygon/MultiPolygon filtering, fit, translucent fill, visible outline, states, metadata, clear and re-search tests pass. No rights-cleared real IT artifact, API geometry response, map fit or translucent area exists, so browser E2E is not claimed.
- Validation: IT existing runtime/source regression 71/71, shared Postal Context runtime 162/162, shared area UI 23/23, ledger/rollout 12/12 and repository-wide `tsc --noEmit` pass (268 recorded test executions). Initial launcher/dependency-only failures are recorded in the engineering report and do not hide product-test failures.
- Evidence: `docs/postal-context-italy-m2.md`, `reports/postal-context-m2/it-source-review-2026-08-30.json`, and `reports/postal-context-m2/it-checks-2026-08-30.json`. Raw official captures and address/building/cadastral/land rows are not committed.
- Retry: after pending countries and `2026-09-06T13:34:49.549Z`; do not purchase CAP Professional, register/authenticate, contact a provider, accept terms/contracts, request restricted data/keys, pay, create a destination, publish or deploy without explicit approval.
- After IT: 252 profiles, 174 pending, 73 blocked, 0 in progress, 5 evidence-verified M2; 133 manifests / 103 explicit definitions.
- Next country: `JE` (Jersey). No second country was started.

## Jersey (JE) M2 review - 2026-08-30

- Target: Jersey (`JE`), Europe. The source-of-truth status command selected JE with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_jersey_unit_postcode_and_truthful_postal_area_visualization`. Exact unit-postcode geometry and separately labelled broader postal context remain distinct; points, sentinels and administrative proxies never become areas.
- Current ONSPD audit: May 2026 contains 3,215 live and 459 terminated distinct valid JE codes. All 3,674 rows have `GRIDIND=9`, null eastings/northings, online `LAT=100`/`LONG=0` sentinels and no geometry in the explicit sample. The official guide confirms that Channel Islands postcodes receive no geographic coordinates.
- Government JSearch audit: 1,914 distinct point records overlap 1,891 live and 19 terminated ONSPD codes, contain four unmatched values including one invalid code and omit 1,324 live codes. The item/layer has blank licence/access fields and the open-data catalogue has zero postcode datasets, so no OGL-J coverage or public-serving right is inferred.
- Jersey Post and authority: the interactive finder was not queried and supplies no reviewed bulk, redistribution, public API or polygon grant. No point, parish/administration, road, address, building, land parcel, buffer, Voronoi cell or synthetic fixture was promoted; no raw rows were committed.
- App status: shared Polygon/MultiPolygon validation, fit, translucent fill, visible outline, point-only non-area handling, metadata, clear and re-search checks pass. No rights-cleared real JE artifact, API geometry response, map fit or translucent area exists, so browser E2E is not claimed.
- Validation: JE evidence 6/6, rollout invariants 8/8, shared area UI 5/5, shared runtime 24/24 and repository-wide `tsc --noEmit` pass (44/44 recorded assertions). PDF text/digests reconcile, but local raster inspection failed with Windows error 206 and is not claimed.
- Evidence: `docs/postal-context-jersey-m2.md`, `reports/postal-context-m2/je-source-review-2026-08-30.json`, and `reports/postal-context-m2/je-checks-2026-08-30.json`. Raw official captures and postcode/address rows are not committed.
- Retry: after pending countries and `2026-09-06T14:03:19.968Z`; do not contact a provider, register/authenticate, accept terms/contracts, request data/keys, pay, crawl the finder, create a destination, publish or deploy without explicit approval.
- After JE: 252 profiles, 173 pending, 74 blocked, 0 in progress, 5 evidence-verified M2; 134 manifests / 104 explicit definitions.
- Next country: `LI` (Liechtenstein). No second country was started.

## Liechtenstein (LI) M2 verified - 2026-08-30

- Target: Liechtenstein (`LI`), Europe. The source-of-truth status command selected LI with no country in progress; no second country was started.
- Result: evidence-verified under `M2_current_swisstopo_plzo_li_domicile_visualization`.
- Official source and rights: the swisstopo official directory explicitly covers Switzerland and the Principality of Liechtenstein and is updated monthly. The 2026-08-11 STAC Shapefile and WGS84 CSV assets, current product page, January 2026 technical documentation and OGD terms have retrieval time, byte length and SHA-256 evidence. The reviewed OGD terms allow use, distribution, processing and commercial use with attribution.
- Country identity and geometry: the WGS84 CSV has 20 rows using official municipality BFS 7001-7011, resolving through `ZIP_ID` to all 13 distinct current LI domicile codes (9485-9488 and 9490-9498). Every selected polygon is `REAL`, not in modification and PLZ6 suffix `00`. The pack publishes 13 source Polygons with 10,598 positions; all rings, Turf/JSTS validity, LI envelope and 20 source-centroid containment checks pass without repair or invented geometry.
- Authority separation: only Postal Code -> Polygon -> Address Context is published. Company, professional, internal, administrative, PO-box, facility, route and organisation codes remain non-area; no address, building, recipient, customer, deliverability or land-right row enters the artifact.
- Application: `94 90` normalizes to `9490`; the real API returns its official Polygon with source date 2026-08-11 and confidence 1. The app converts it to GeoJSON, computes fit bounds and uses fill opacity `0.22` plus outline opacity `0.95`/width `3`. Shared loading, no-match, multiple, API-failure, invalid-geometry and provenance states plus clear/re-search pass; `9400` is no-match and `94A0` invalid.
- Validation: LI country/API/app suite 150/150, shared store/routes/service/OpenAPI 49/49, full-source `tsc --noEmit`, and four byte-identical replay comparisons all pass (204 recorded checks, 0 failures). Deterministic real HTTP plus app map-source/style/fit assertions provide rendering evidence.
- Artifacts: [graph](https://github.com/veygrit-sys/Address-Grid-ID/blob/676b10c048d625b240ebb9ba7267d63f171deff8/data/postal_country_packs/li/postal-context/m2/graph.json), [geometry](https://github.com/veygrit-sys/Address-Grid-ID/blob/676b10c048d625b240ebb9ba7267d63f171deff8/data/postal_country_packs/li/postal-context/m2/geometry.json), [descriptor](https://github.com/veygrit-sys/Address-Grid-ID/blob/676b10c048d625b240ebb9ba7267d63f171deff8/data/postal_country_packs/li/postal-context/m2/descriptor.json).
- Evidence: [build/source report](../reports/postal-context-m2/li-current-plzo-2026-08-30.json), [engineering checks](../reports/postal-context-m2/li-checks-2026-08-30.json), [technical review](postal-context-liechtenstein-m2.md), and [source/reuse notice](../data/postal_country_packs/li/postal-context/M2-SOURCE-NOTICE.md). Raw source downloads and expanded source rows are not committed.
- After LI: 252 profiles, 172 pending, 74 blocked, 0 in progress, 6 evidence-verified M2; 134 manifests / 104 explicit definitions.
- Next country: `LT` (Lithuania). No second country was started.

## Lithuania (LT) M2 review - 2026-08-30

- Target: Lithuania (`LT`), Europe. The source-of-truth status command selected LT with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_lietuvos_pastas_postcode_area_visualization`. A current complete rights-cleared Lietuvos paštas assignment denominator, real postcode Polygon/MultiPolygon surfaces, an immutable approved artifact and the real application path are all mandatory.
- Official operator path: Lietuvos paštas documents authenticated postcode endpoints and an optional `geoArea`/`geoCenterLocation` on postcode records. All API communication requires authentication, provider configuration and a contract; an anonymous production request returned `401 Bearer`. No complete response denominator or processing, public-serving and redistribution grant was obtained.
- Public-data audit: Registrų centras publishes CC BY 4.0 postcode-bearing civic-address points, but the current storage endpoint reports no data. The official portal still lists postcode geographic boundaries as an evaluated open-data need rather than a released layer. Address points, delivery areas, post offices, routes, administration, buildings, buffers, Voronoi cells and synthetic fixtures were not promoted to postal areas.
- Application status: shared Polygon/MultiPolygon validation, normalization, fit, translucent fill, visible outline, loading/no-match/multiple/API-failure/invalid-geometry states, provenance, clear and re-search checks pass. No rights-cleared real LT polygon artifact or API response exists, so real LT map fit, translucent area rendering and browser E2E are not claimed.
- Validation: LT country/API/runtime suite 71/71, shared area UI 5/5, shared runtime 24/24, rollout invariants 8/8 and LT ledger evidence 5/5 pass; the full checked-out source typecheck passes with explicit local workspace-package paths (114 recorded assertions, 0 failures). Initial stale-expectation and workspace-link launcher failures remain disclosed in the engineering report.
- Evidence: `docs/postal-context-lithuania-m2.md`, `reports/postal-context-m2/lt-source-review-2026-08-30.json`, and `reports/postal-context-m2/lt-checks-2026-08-30.json`. Exact public bodies are byte/SHA-256 bound in the report; transient response headers, raw bodies and address/building/cadastral/land rows are not committed.
- Retry: after pending countries and `2026-09-06T15:28:24.300Z`; do not register, authenticate, request credentials, accept a contract or terms, pay, query protected address/building/cadastral/land data, create a destination, publish or deploy without explicit approval.
- After LT: 252 profiles, 171 pending, 75 blocked, 0 in progress, 6 evidence-verified M2; 134 manifests / 104 explicit definitions.
- Next country: `LU` (Luxembourg). No second country was started.

## Luxembourg (LU) M2 review - 2026-08-30

- Target: Luxembourg (`LU`), Europe. The source-of-truth status command selected LU with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_luxembourg_postcode_area_visualization`. A complete rights-cleared POST denominator, real postcode Polygon/MultiPolygon, approved immutable artifact and real application path remain mandatory.
- Official assignment audit: current POST CSV has 9,715 rows / 4,750 codes (275 leading-zero codes); current CACLR has 4,430 codes. The sets differ by 389 POST-only and 69 CACLR-only codes, so omissions and endpoint classes cannot be silently merged.
- Geometry audit: current BD-Adresses has 179,491 features / 4,200 codes and every geometry is Point; 230 CACLR codes lack an address point and none of POST's 275 leading-zero codes has one. No official or rights-cleared derived postcode polygon was found; no point buffer, hull, Voronoi/raster cell, administrative, parcel or building proxy was generated.
- Rights: POST files are publicly downloadable, but the legal notice applies copyright and no explicit AGID processing, public-serving or redistribution grant was found. CACLR/BD-Adresses are CC0 but do not supply postcode areas.
- Application status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, clear and re-search behavior pass. No real LU polygon artifact exists, so real LU API/map rendering and browser E2E are not claimed.
- Validation: shared area UI 5/5, shared runtime 24/24, rollout invariants 8/8, LU ledger evidence 5/5 and full TypeScript 1/1 pass (43 recorded assertions, 0 failures). The initial empty dependency-junction failure and PDF image-inspection Windows error 206 are disclosed.
- Evidence: `docs/postal-context-luxembourg-m2.md`, `reports/postal-context-m2/lu-source-review-2026-08-30.json`, and `reports/postal-context-m2/lu-checks-2026-08-30.json`; ten exact official bodies/distributions are byte/SHA-256 bound. Raw POST/CACLR/address files and PDF images are not committed.
- Retry: after pending countries and `2026-09-06T16:08:26.315Z`; do not contact a provider, register, authenticate, accept terms, pay, create a destination, publish or deploy without explicit approval.
- After LU: 252 profiles, 170 pending, 76 blocked, 0 in progress, 6 evidence-verified M2; 135 manifests / 105 explicit definitions.
- Next country: `LV` (Latvia). No second country was started.

## Latvia (LV) M2 review - 2026-08-30

- Target: Latvia (`LV`), Europe. The source-of-truth status command selected LV with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_latvia_postcode_area_visualization`. A complete rights-cleared Latvijas Pasts denominator, real postcode Polygon/MultiPolygon, approved immutable artifact and real application path remain mandatory.
- Official assignment audit: the current operator page lists 11 books; 8 current PDFs / 142 pages were byte-pinned and 3 non-browser downloads returned HTTP 522. No complete operator denominator or explicit AGID processing/public-serving/redistribution grant was established.
- VZD audit: the 2026-08-29 CC BY 4.0 address CSV has 610,513 rows; all 550,515 active rows are approved, valid postcode-bearing Points with coordinates, covering 693 codes. The current nine-layer SHP archive has no postcode-area layer.
- Geometry: no official or rights-cleared derived postcode polygon was found; no address point, endpoint, administrative/locality, road, parcel or building proxy, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted.
- Application status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, clear and re-search behavior pass. No real LV polygon artifact exists, so real LV API/map rendering and browser E2E are not claimed.
- Validation: shared area UI 5/5, LV country contracts 14/14, shared runtime 24/24, rollout invariants 8/8, LV ledger evidence 5/5 and full TypeScript 1/1 pass (57 recorded assertions, 0 failures).
- Evidence: `docs/postal-context-latvia-m2.md`, `reports/postal-context-m2/lv-source-review-2026-08-30.json`, and `reports/postal-context-m2/lv-checks-2026-08-30.json`; eighteen exact official bodies/distributions are byte/SHA-256 bound. Raw postal books, address CSV, SHP and source bodies are not committed.
- Retry: after pending countries and `2026-09-06T16:45:28.862Z`; do not contact a provider, register, authenticate, accept terms, pay, create a destination, publish or deploy without explicit approval.
- After LV: 252 profiles, 169 pending, 77 blocked, 0 in progress, 6 evidence-verified M2; 135 manifests / 105 explicit definitions.
- Next country: `MC` (Monaco). No second country was started.

## Monaco (MC) M2 review - 2026-08-30

- Target: Monaco (`MC`), Europe. The source-of-truth status command selected MC with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_monaco_postcode_area_visualization`. A complete current rights-cleared ordinary-plus-exception denominator, real postcode Polygon/MultiPolygon, approved immutable artifact and real application path remain mandatory.
- Official assignment audit: the 2026-08-08 Open-Licence La Poste base has 39,192 rows / 6,328 codes and exactly one Monaco row, `98000 MONACO`; its Monaco geocode and requested geometry are empty, and the official catalogue says postcode contours are not supplied.
- Operator/exception audit: current 2026 La Poste Monaco material displays `98020 MONACO CEDEX` as an example but provides no complete 980xx allocation denominator, polygon product or bulk address-data grant.
- Geometry: the reviewed 2021 Open-Licence BAN-derived hull GeoJSON has 6,158 features and zero `98xxx` records. No Principality/commune, quartier, urban-plan, address, building, road, endpoint, buffer, hull, Voronoi/raster or synthetic proxy was promoted.
- Application status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, clear and re-search behavior pass. No real MC polygon artifact exists, so real MC API/map rendering and browser E2E are not claimed.
- Validation: shared area UI 5/5, MC country contracts 14/14, shared runtime 24/24, rollout invariants 8/8, MC ledger evidence 5/5 and full TypeScript 1/1 pass (57 recorded assertions, 0 failures).
- Evidence: `docs/postal-context-monaco-m2.md`, `reports/postal-context-m2/mc-source-review-2026-08-30.json`, and `reports/postal-context-m2/mc-checks-2026-08-30.json`; seventeen exact official/public-service bodies or distributions are byte/SHA-256 bound. Raw CSV, GeoJSON, PDFs and source bodies are not committed.
- Retry: after pending countries and `2026-09-06T17:24:29.593Z`; do not contact a provider, register, authenticate, accept terms, pay, create a destination, publish or deploy without explicit approval.
- After MC: 252 profiles, 168 pending, 78 blocked, 0 in progress, 6 evidence-verified M2; 135 manifests / 105 explicit definitions.
- Next country: `MD` (Moldova). No second country was started.

## Moldova (MD) M2 review - 2026-08-30

- Target: Moldova (`MD`), Europe. The source-of-truth status command selected MD with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_moldova_postcode_area_visualization`. A complete current rights-cleared ordinary/exception denominator plus real postcode Polygon/MultiPolygon is mandatory.
- Current operator audit: the public Poșta Moldovei map/API has 1,164 active facilities, 1,144 distinct postal-code labels, 1,164 valid Points and 0 Polygon/MultiPolygon. `zip_code=2012` returns one facility Point and 26 street/house membership rows, not an area.
- Government audit: three ASP CKAN workbooks contain 4,873 code-bearing rows and 0 geometry; resources are dated 2015, metadata 2020 and each package says `License Not Specified`. General date.gov.md guidance does not replace dataset-specific terms.
- Geometry policy: broad quality-standard distribution zones, facility points, membership rows, localities, administration, addresses, buildings, parcels, buffers, hulls, Voronoi/raster cells and synthetic fixtures were not promoted.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area, clear and re-search behavior pass. No real eligible MD polygon exists, so real MD API/map rendering and browser E2E are not claimed.
- Validation: shared area UI 5/5, shared runtime 24/24, rollout invariants 8/8, MD ledger evidence 5/5 and full TypeScript 1/1 pass (43 recorded assertions, 0 failures).
- Evidence: `docs/postal-context-moldova-m2.md`, `reports/postal-context-m2/md-source-review-2026-08-30.json`, and `reports/postal-context-m2/md-checks-2026-08-30.json`; nineteen exact official bodies are byte/SHA-256 bound. Raw APIs, XLSX, PDFs and source bodies are not committed.
- Retry: after pending countries and `2026-09-06T17:52:30.260Z`; do not contact a provider, register, authenticate, accept terms, pay, create a destination, publish or deploy without explicit approval.
- After MD: 252 profiles, 167 pending, 79 blocked, 0 in progress, 6 evidence-verified M2; 136 manifests / 106 explicit definitions.
- Next country: `ME` (Montenegro). No second country was started.

## Montenegro (ME) M2 review - 2026-08-30

- Target: Montenegro (`ME`), Europe. The source-of-truth status command selected ME with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_montenegro_postcode_area_visualization`. A complete current rights-cleared five-digit postcode and six-digit PAK/exception denominator, real postcode Polygon/MultiPolygon, approved immutable artifact and real application path remain mandatory.
- Operator audit: the current office page embeds 164 unique valid latitude/longitude markers and zero polygons; its first rendered page has 12 distinct five-digit office codes, not a complete denominator. The dictionary and Gazette 150 rule define five-digit postcode and six-digit PAK street-part semantics, PO boxes and poste restante but no area product.
- Rights/catalogue audit: the operator rights page is under construction and no public bulk-processing/redistribution grant was established. Five current Government CKAN searches found zero postal datasets; six `PAK` hits are unrelated substring matches. UZN address, spatial-unit and eID/payment property services are separate non-postal authorities and no protected path was used.
- Geometry: no facility/address Point, PAK route or street part, municipality, spatial unit, parcel, building, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area, loading/no-match/multiple/API-failure/invalid-geometry, provenance, clear and re-search behavior pass. No real eligible ME polygon exists, so real ME runtime/API/map rendering and browser E2E are not claimed.
- Validation: shared area UI 5/5, shared runtime 24/24, rollout invariants 8/8, ME ledger evidence 5/5 and full TypeScript 1/1 pass (43 recorded assertions, 0 failures). PDF text/digests reconcile; local PNG visual inspection failed with Windows error 206 and is not claimed.
- Evidence: `docs/postal-context-montenegro-m2.md`, `reports/postal-context-m2/me-source-review-2026-08-30.json`, and `reports/postal-context-m2/me-checks-2026-08-30.json`; seventeen exact official bodies are byte/SHA-256 bound. Raw source bodies, office points, address, cadastral and property rows are not committed.
- Retry: after pending countries and `2026-09-06T18:22:01.106Z`; do not contact a provider, register, authenticate, accept terms, pay, create a destination, publish or deploy without explicit approval.
- After ME: 252 profiles, 166 pending, 80 blocked, 0 in progress, 6 evidence-verified M2; 136 manifests / 106 explicit definitions.
- Next country: `MK` (North Macedonia). No second country was started.

## North Macedonia (MK) M2 review - 2026-08-30

- Target: North Macedonia (`MK`), Europe. The source-of-truth status command selected MK with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_north_macedonia_postcode_area_visualization`. A complete current rights-cleared four-digit ordinary and exception denominator, real postcode Polygon/MultiPolygon, approved immutable artifact and real application path remain mandatory.
- Operator audit: the official addressing table has 1,831 rows, 230 codes, 1,693 localities, 230 delivery offices, 87 municipalities and 15 branches; the official locator has 331 unique valid facility Points and 326 rendered codes. Both have zero polygons.
- Reconciliation/rights: only 218 codes overlap; 12 are table-only and 108 locator-only, so no complete reconciled ordinary-plus-exception denominator is claimed. Privacy/contact pages provide no dataset-specific public-serving grant. Government open-data and NSDI requests timed out; this records availability failure, not nonexistence.
- Geometry: no locality/facility Point, delivery office, municipality, branch, address/cadastral unit, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area, loading/no-match/multiple/API-failure/invalid-geometry, provenance, clear and re-search behavior pass. No real eligible MK polygon exists, so real MK runtime/API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area UI 5/5, shared runtime 24/24, rollout invariants 8/8, MK ledger evidence 5/5 and full TypeScript 1/1 pass (44 recorded assertions, 0 failures).
- Evidence: `docs/postal-context-north-macedonia-m2.md`, `reports/postal-context-m2/mk-source-review-2026-08-30.json`, and `reports/postal-context-m2/mk-checks-2026-08-30.json`; eight exact official bodies are byte/SHA-256 bound. Raw source bodies, locality rows and facility coordinates are not committed.
- Retry: after pending countries and `2026-09-06T18:56:31.619Z`; do not contact a provider, register, authenticate, accept terms, pay, create a destination, publish or deploy without explicit approval.
- After MK: 252 profiles, 165 pending, 81 blocked, 0 in progress, 6 evidence-verified M2; 137 manifests / 107 explicit definitions.
- Next country: `MT` (Malta). No second country was started.

## Malta (MT) M2 review - 2026-08-30

- Target: Malta (`MT`), Europe. The source-of-truth status command selected MT with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_malta_postcode_area_visualization`. A complete current rights-cleared ordinary/exception denominator plus real postcode Polygon/MultiPolygon is mandatory.
- Operator audit: the current finder bundle uses API v1 and maxResult 50. Anonymous GETs returned 89 towns, 116 Il-Ħamrun streets and three current records for the published HMR 2042 example. The response fields are address components plus `postCode`; the bundle and responses contain zero geometry tokens and no complete denominator.
- OAR and rights: the current OAR table has 85 locality rows and only locality/council/region columns, with no postcode or geometry. MaltaPost website terms limit unaltered reproduction to personal non-commercial use or internal circulation; no dataset-specific AGID processing, derivation, public-serving or redistribution grant was established. Three Government catalogue requests returned HTTP 403, recorded only as availability failure.
- Geometry: no finder address, prefix, OAR locality/street, address Point, Planning Authority building, administrative/statistical/cadastral proxy, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area, loading/no-match/multiple/API-failure/invalid-geometry, provenance, clear and re-search behavior pass. No real eligible MT polygon exists, so real MT runtime/API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area UI 5/5, shared runtime 24/24, rollout invariants 8/8, MT ledger evidence 5/5 and full TypeScript 1/1 pass (44 recorded assertions, 0 failures).
- Evidence: `docs/postal-context-malta-m2.md`, `reports/postal-context-m2/mt-source-review-2026-08-30.json` and `reports/postal-context-m2/mt-checks-2026-08-30.json`; twelve exact official bodies are byte/SHA-256 bound. Raw source bodies and address rows are not committed.
- Retry: after pending countries and `2026-09-06T19:32:32.164Z`; do not contact a provider, register, authenticate, accept terms, pay, create a destination, publish or deploy without explicit approval.
- After MT: 252 profiles, 164 pending, 82 blocked, 0 in progress, 6 evidence-verified M2; 137 manifests / 107 explicit definitions.
- Next country: `NL` (Netherlands). No second country was started.

## Netherlands (NL) M2 review - 2026-08-30

- Target: Netherlands (`NL`), Europe. The source-of-truth status command selected NL with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_netherlands_pc6_assignment_and_cbs_area_visualization`. A complete current rights-cleared PostNL ordinary/exception denominator, corrected CBS/Esri reconciliation, approved immutable artifact and real application path remain mandatory.
- CBS geometry audit: the corrected 2025-v1 ZIP was fixed 2026-08-18. Its GeoPackage has 465,935 unique valid PC6 MultiPolygons, 597,956 polygon parts and 14,458,509 positions, with zero malformed codes, empty geometry or invalid geometry. CBS/Esri CC BY 4.0 NL surfaces remain `derived_geometry`, never PostNL assignment authority.
- PostNL/rights audit: PCT-R covers current H house-number, B P.O.-box and N NAPO ranges and PCT-H about nine million addresses, but the product is purchased through a protected environment. Public terms restrict use to personal/strictly internal purposes and prohibit reproduction or third-party availability; no AGID public-serving grant was established.
- Exception evidence: public headquarters code `2521 CA` has one CBS surface, while public P.O.-box codes `2500 GG` and `2500 CC` have none. No P.O.-box/NAPO/organization/special area, BAG/address/building, PC4/PC5, administrative/statistical/cadastral proxy, buffer, hull, Voronoi/raster cell or synthetic fixture was invented or promoted.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area, clear and re-search behavior pass. No approved complete NL runtime artifact exists, so real NL normalization/API/map rendering and browser E2E are not claimed.
- Validation: reproducible full-source inspector 1/1, shared area UI 5/5, shared runtime 24/24, rollout invariants 8/8, NL ledger evidence 5/5, changed JavaScript/JSON syntax 5/5 and full TypeScript 1/1 pass (49 recorded assertions, 0 failures). The initial empty dependency-tree and ENOSPC installation failures are disclosed in the engineering report.
- Evidence: `docs/postal-context-netherlands-m2.md`, `reports/postal-context-m2/nl-source-review-2026-08-30.json`, and `reports/postal-context-m2/nl-checks-2026-08-30.json`; twelve exact official bodies/distributions are byte/SHA-256 bound. Raw ZIP, GeoPackage, workbook, page bodies and address rows are not committed.
- Retry: after pending countries and `2026-09-06T20:04:32.662Z`; do not contact a provider, register, authenticate, accept terms, pay, query protected address/building/cadastral/land data, create a destination, publish or deploy without explicit approval.
- After NL: 252 profiles, 163 pending, 83 blocked, 0 in progress, 6 evidence-verified M2; 137 manifests / 107 explicit definitions.
- Next country: `NO` (Norway). No second country was started.

## Norway (NO) M2 review - 2026-08-30

- Target: Norway (`NO`), Europe. The source-of-truth status command selected NO with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_norway_assignment_and_official_area_visualization`. Reviewed Posten public-serving rights, a fixed current Kartverket geometry artifact/digest, complete reconciliation, approved immutable artifact and real application path remain mandatory.
- Operator audit: the current Windows-1252 TAB register is effective 2025-10-01 and has 5,122 unique well-formed codes: G 3,318, P 1,740, B 60 and S 4, with zero malformed or duplicate rows and 359 municipality references.
- Territory audit: seven rows use Posten's county-like 21 Svalbard classification and one uses 22 Jan Mayen. These operational fields were retained without merging repository `NO` and `SJ` identities.
- Geometry/rights audit: data.norge advertises official monthly Kartverket Postnummerområder downloads/services under CC BY 4.0 and explicitly says P.O.-box codes are additional. Repeated WFS/download-host requests timed out, so zero fixed geometry artifacts and zero Polygon/MultiPolygon features were digest/topology verified. A free Posten download was not treated as an AGID processing/public-serving grant.
- Geometry policy: no P/O-box or special area, municipality/county, address/building point, FKB object, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area, loading/no-match/multiple/API-failure/invalid-geometry, provenance, clear and re-search behavior pass. No real eligible NO artifact exists, so real NO API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area UI 5/5, shared runtime 24/24, rollout invariants 8/8, NO ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and full TypeScript 1/1 pass (51 recorded assertions, 0 failures).
- Evidence: `docs/postal-context-norway-m2.md`, `reports/postal-context-m2/no-source-review-2026-08-30.json`, and `reports/postal-context-m2/no-checks-2026-08-30.json`; six exact official/licence bodies are byte/SHA-256 bound. Raw source bodies and postcode rows are not committed.
- Retry: after pending countries and `2026-09-06T20:52:33.425Z`; do not contact a provider, register, authenticate, accept terms, pay, query protected address/building/cadastral/land rows, create a destination, publish or deploy without explicit approval.
- After NO: 252 profiles, 162 pending, 84 blocked, 0 in progress, 6 evidence-verified M2; 137 manifests / 107 explicit definitions.
- Next country: `PL` (Poland). No second country was started.

## Poland (PL) M2 review - 2026-08-30

- Target: Poland (`PL`), Europe. The source-of-truth status command selected PL with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under `M2_current_poland_pna_assignment_and_postcode_area_visualization`. Explicit compatible Poczta rights, a fixed authoritative postcode Polygon/MultiPolygon, complete reconciliation, approved immutable artifact and real application path remain mandatory.
- Operator audit: the exact official July 2026 PDF has 1,786 pages / 7,874,157 bytes, 121,627 PNA occurrences and 21,642 distinct `NN-NNN` codes from `00-001` to `99-440`; it contains zero geometry terms. Poczta's current public search database is dated 2026-08-30; one non-personal `00-940` lookup returned six rows, seven fields and zero geometry tokens.
- Rights audit: Poczta states that it owns System PNA economic copyrights, sells electronic lists with quarterly updates and requires written consent for PDF reproduction, electronic processing, other-publication use and database storage. No AGID processing, derivation, redistribution or public-serving grant was established.
- Geometry policy: GUGiK PRG/address data remain separate administrative/address authorities. No lookup-row envelope, locality, voivodeship/district/commune/PRG boundary, address/building point, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted. Six direct Geoportal/WFS timeouts are availability evidence only, not proof of nonexistence.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area, clear and re-search behavior pass. No real eligible PL artifact exists, so real PL API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area UI 5/5, shared runtime 24/24, rollout invariants 8/8, PL ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and full TypeScript 1/1 pass (51 recorded assertions, 0 failures). ENOSPC dependency installation and the temporary workspace-path typecheck workaround are disclosed.
- Evidence: `docs/postal-context-poland-m2.md`, `reports/postal-context-m2/pl-source-review-2026-08-30.json`, and `reports/postal-context-m2/pl-checks-2026-08-30.json`; eight exact official bodies are byte/SHA-256 bound. Raw source bodies, PDF/text extraction, search rows and PNGs are not committed.
- Retry: after pending countries and `2026-09-06T21:20:33.981Z`; do not contact a provider, register, authenticate, accept terms, pay, query protected data, create a destination, publish or deploy without explicit approval.
- After PL: 252 profiles, 161 pending, 85 blocked, 0 in progress, 6 evidence-verified M2; 138 manifests / 108 explicit definitions.
- Next country: `PT` (Portugal). No second country was started.

## Portugal (PT) M2 review - 2026-08-30

- Target: Portugal (PT), Europe. The source-of-truth status command selected PT with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under M2_current_portugal_postcode_assignment_and_authoritative_area_visualization. Explicit compatible CTT rights, a current complete assignment/exception denominator, a fixed authoritative postcode Polygon/MultiPolygon, complete reconciliation, approved immutable artifact and real application path remain mandatory.
- Operator audit: six exact CTT HTML bodies total 608,046 bytes and are byte/SHA-256 bound. They establish the seven-digit NNNN-NNN form, postal designation, address-driven POST search, reverse-code lookup and a separate P.O.-box mode, but not a fixed complete distribution or area artifact.
- Rights and geometry audit: CTT describes database licensing, supply of address-database portions and geographic webservices. Address treatment associates each address with its door coordinates in WGS84 EPSG:4326, which is Point context rather than a postcode area. No compatible AGID processing, derivation, storage, redistribution or public-serving grant was established.
- Authority policy: DGT says CTT assigns postcodes and DGT has no postcode-code creation/intervention role. CAOP, parish/municipality, cadastral, address/street and door-point geometry remain separate authorities. No union, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area, loading/no-match/multiple/API-failure/invalid-geometry, provenance, clear and re-search behavior pass. No real eligible PT artifact exists, so real PT API/map rendering and browser E2E are not claimed.
- Evidence: docs/postal-context-portugal-m2.md, reports/postal-context-m2/pt-source-review-2026-08-30.json and reports/postal-context-m2/pt-checks-2026-08-30.json. Raw CTT bodies, address rows, P.O.-box rows and DGT bodies are not committed.
- Retry: after pending countries and 2026-09-06T21:59:04.571Z; do not contact a provider, register, authenticate, accept terms, pay, submit/query protected data, create a destination, publish or deploy without explicit approval.
- After PT: 252 profiles, 160 pending, 86 blocked, 0 in progress, 6 evidence-verified M2; 139 manifests / 109 explicit definitions.
- Next country: RO (Romania). No second country was started.

## Romania (RO) M2 review - 2026-08-30

- Target: Romania (RO), Europe. The source-of-truth status command selected RO with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under M2_current_romania_postcode_assignment_and_authoritative_area_visualization. Explicit compatible rights, a current complete six-digit assignment/exception denominator, a fixed authoritative postcode Polygon/MultiPolygon, complete reconciliation, approved immutable artifact and real application path remain mandatory.
- Operator audit: seven exact official bodies total 4,689,771 bytes and are byte/SHA-256 bound. The current public database is described as periodically updated and supports address-to-postcode and postcode-to-address POST search. Official structure defines six digits; Infocod is supplied after a written request and updated monthly.
- Rights and authority: Poșta Română's 2025 organization regulation assigns national postal-nomenclature maintenance to operator functions. ANCOM Decision 810/2024 treats the postcode system as non-physical network infrastructure and places relevant third-party postal-provider access behind a civil contract. No compatible AGID processing, derivation, storage, redistribution or public-serving grant was established.
- Geometry policy: dated operator evidence says the postcode database then lacked GPS coordinates and distinguishes 47 street-level municipalities from single-code localities elsewhere. No newer fixed authoritative area release was verified. No county/UAT/locality/SIRUTA, RENNS point, ANCPI parcel/building, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area, loading/no-match/multiple/API-failure/invalid-geometry, provenance, clear and re-search behavior pass. No real eligible RO artifact exists, so real RO API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime plus RO country contracts 41/41, rollout invariants 8/8, RO ledger evidence 5/5, changed JavaScript/JSON syntax 6/6 and full TypeScript 1/1 pass (62 recorded assertions, 0 failures).
- Evidence: docs/postal-context-romania-m2.md, reports/postal-context-m2/ro-source-review-2026-08-30.json and reports/postal-context-m2/ro-checks-2026-08-30.json. Raw official bodies, rendered PDF pages, address rows and geometry are not committed.
- Retry: after pending countries and 2026-09-06T22:30:06.794Z; do not contact a provider, register, authenticate, accept terms or a contract, pay, submit/query protected data, create a destination, publish or deploy without explicit approval.
- After RO: 252 profiles, 159 pending, 87 blocked, 0 in progress, 6 evidence-verified M2; 139 manifests / 109 explicit definitions.
- Next country: RS (Serbia). No second country was started.

## Serbia (RS) M2 review - 2026-08-30

- Target: Serbia (RS), Europe. The source-of-truth status command selected RS with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under M2_current_serbia_postcode_assignment_and_pak_area_visualization. A current complete five-digit assignment/exception denominator, fixed official PAK geometry delivery, explicit compatible rights, full reconciliation, approved immutable artifact and real application path remain mandatory.
- Operator audit: Pošta defines distinct five-digit postcodes and six-digit PAKs. Its current FAQ says the electronic postcode database cannot be downloaded, WSP is registered access, and the exact 2025 ENP PDF is only a sales-point subset with 689 five-digit occurrences / 686 distinct tokens.
- Geometry and rights audit: Pošta explicitly says over 113,000 PAKs are georeferenced nationwide and each PAK Polygon covers buildings belonging to part of one street. The exact GIS price PDF lists 90 RSD per PAK spatial-position data unit before VAT. No purchase, fixed delivery or compatible AGID processing/derivation/storage/redistribution/public-serving grant was established.
- Authority policy: RGZ weekly open street/house-number CSV/GPKG has address/cadastral identifiers but no advertised postcode or PAK field. No ENP sales point/office, RGZ address/street/point, administrative/cadastral/building/parcel object, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted; RS/XK identity remains separate.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area, loading/no-match/multiple/API-failure/invalid-geometry, provenance, clear and re-search behavior pass. No eligible fixed RS artifact exists, so real RS API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime plus RS country contracts 41/41, rollout invariants 8/8, RS ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and full TypeScript 1/1 pass (63 recorded assertions, 0 failures).
- Evidence: docs/postal-context-serbia-m2.md, reports/postal-context-m2/rs-source-review-2026-08-30.json and reports/postal-context-m2/rs-checks-2026-08-30.json. Fifteen exact official bodies total 1,411,809 bytes and are byte/SHA-256 bound. Raw official bodies, rendered PDF pages, address/PAK rows and geometry are not committed.
- Retry: after pending countries and 2026-09-06T23:01:37.379Z; do not contact a provider, register, authenticate, accept terms or a contract, pay, submit/query protected data, create a destination, publish or deploy without explicit approval.
- After RS: 252 profiles, 158 pending, 88 blocked, 0 in progress, 6 evidence-verified M2; 139 manifests / 109 explicit definitions.
- Next country: RU (Russia). No second country was started.

## Russia (RU) M2 review - 2026-08-31

- Target: Russia (RU), Europe. The source-of-truth status command selected RU with no country in progress; no second country was started.
- M2 result: **blocked / unmet** under M2_current_russia_postcode_assignment_and_area_visualization. A current complete six-digit assignment/exception denominator, exact valid area coverage, compatible rights, complete reconciliation, approved immutable artifact and real application path remain mandatory.
- Operator audit: seven exact official bodies total 2,062,744 bytes and are byte/SHA-256 bound. Russian Post defines the index as the unique post-office number assigned to an address. Its current directory advertises 61,358 office records formed 2026-08-25 and monthly-or-faster updates; the exact current archive returned HTTP 417 and a numbered relative archive returned 404 during this audit, which are availability observations rather than non-existence proof.
- Address, rights and geometry audit: FIAS/GAR is the open official address register and advertises twice-weekly snapshots. Federal Law 443-FZ establishes common-access/open address information used by postal services, but not a Russian Post area licence. The tariff API PDF version 3.20 exposes office dictionary fields, not Polygon/MultiPolygon. No complete assignment/exception denominator, official postcode-area release or compatible AGID postal-area public-serving grant was established.
- Authority policy: office indices, operator lookups, tariff records, FIAS address objects, administration, cadastre, buildings, parcels and territory remain separate. No point, street/boundary, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted; RU/source identity remains unchanged.
- App status: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, point-only non-area and clear/re-search behavior pass. No eligible fixed RU artifact exists, so real RU API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime plus RU country contracts 31/31, rollout invariants 8/8, RU ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and full TypeScript 1/1 pass (53 recorded assertions, 0 failures).
- Evidence: docs/postal-context-russia-m2.md, reports/postal-context-m2/ru-source-review-2026-08-31.json and reports/postal-context-m2/ru-checks-2026-08-31.json. Raw official bodies, rendered PDF pages, address rows and geometry are not committed.
- Retry: after pending countries and 2026-09-06T23:41:07.953Z; do not contact a provider, register, authenticate, accept terms or a contract, pay, submit/query protected data, create a destination, publish or deploy without explicit approval.
- After RU: 252 profiles, 157 pending, 89 blocked, 0 in progress, 6 evidence-verified M2; 140 manifests / 110 explicit definitions.
- Next country: SE (Sweden). No second country was started.

## SE - Sweden

- Status: `blocked` / M2 unmet
- Attempt: 1 at 2026-08-31T00:16:38.482Z
- Definition: `M2_current_sweden_five_digit_assignment_and_area_visualization`
- Evidence: `reports/postal-context-m2/se-source-review-2026-08-31.json` (`sha256:fa6883c88986118798d067c2c6ba91d1d285422f559f8ab280c8f6fe038b0908`)
- Checks: `reports/postal-context-m2/se-checks-2026-08-31.json` (`sha256:633e7b21ce0ae1754a4bfdb82083317e9a14b0ee4a81b39dc2ef6afc749a62bc`)
- Country report: `docs/postal-context-sweden-m2.md`
- Exact-body receipts: 9 bodies / 910,512 bytes with SHA-256; raw pages/PDFs, rendered pages, address rows and geometry stay outside Git.
- Result: PTS/PostNord governance and Postnummerservice's commercial five-digit surface product are verified, but no delivery was acquired; organization-only terms prohibit resale/sublicensing, Lantmäteriet requires an approved application purpose and provides address Points, and no compatible public-serving Polygon/MultiPolygon artifact or real SE API/UI area path exists.
- Application: shared Polygon/MultiPolygon draw/fit/translucent fill/outline/clear and error/provenance contracts pass, but no real SE loader, API response, map rendering or browser E2E is claimed.
- Retry: not before 2026-09-07T00:16:38.482Z while pending countries remain; any provider contact, registration, application, terms acceptance, purchase, publication or deployment requires explicit approval.
- Next country: SI (Slovenia).

## SI - Slovenia

- Status: `blocked` / M2 unmet
- Attempt: 1 at 2026-08-31T00:49:09.000Z
- Definition: `M2_current_slovenia_assignment_crosswalk_and_area_visualization`
- Evidence: `reports/postal-context-m2/si-source-review-2026-08-31.json` (`sha256:eab55088fbae287ed33e208e5a3b6a4ed6dc361029a381df39bcf27d0fd36fff`)
- Checks: `reports/postal-context-m2/si-checks-2026-08-31.json` (`sha256:884dcc19073f33dccc626c0f6a46b1b7f9c931fd030c6500fbcb1045a48d91fd`)
- Country report: `docs/postal-context-slovenia-m2.md`
- Exact-body receipts: 20 bodies / 17,226,218 bytes with SHA-256; raw HTML/XML/CSV/GeoJSON and temporary inspection output stay outside Git.
- Source and geometry: the current Pošta normal CSV contains 570 rows / 569 unique four-digit codes with duplicate `1002`. All 466 GURS postal-district codes match Pošta, and all 445 Polygon plus 21 MultiPolygon features have finite coordinates, closed rings and no duplicate IDs/codes.
- Result: 103 Pošta codes have no GURS geometry, the official current special-code PDF needed to source-classify them returns HTTP 404, and compatible Pošta processing/storage/derivation/redistribution/public-serving permission is unverified. No unmatched code was inferred as non-area, and no approved immutable artifact exists.
- Application: shared Polygon/MultiPolygon draw/fit/translucent fill/outline/clear and SI synthetic repository/runtime/API contracts pass, but raw GURS geometry was not promoted; no real SI loader, API response, map rendering or browser E2E is claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime plus SI country contracts 38/38, rollout invariants 8/8, SI ledger evidence 5/5, changed JavaScript/JSON syntax 6/6 and full TypeScript 1/1 pass (59 recorded assertions, 0 failures).
- Retry: not before 2026-09-07T00:49:09.000Z while pending countries remain; provider contact, registration, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After SI: 252 profiles, 155 pending, 91 blocked, 0 in progress, 6 evidence-verified M2; 141 manifests / 111 explicit definitions.
- Next country: SJ (Svalbard and Jan Mayen). No second country was started.

## SJ - Svalbard and Jan Mayen

- Status: `blocked` / M2 unmet
- Attempt: 1 at 2026-08-31T01:28:39.617Z
- Definition: `M2_current_svalbard_jan_mayen_assignment_and_official_area_visualization`
- Evidence: `reports/postal-context-m2/sj-source-review-2026-08-31.json` (`sha256:d6e1c42fac8693466691935f4bff57050c53af7f2b967882c4e9b33b2e749767`)
- Checks: `reports/postal-context-m2/sj-checks-2026-08-31.json` (`sha256:31967c28f7baf0c247927d3ca7a066d316e9ee29a81c5e41052529ae478c28ff`)
- Country report: `docs/postal-context-svalbard-jan-mayen-m2.md`
- Exact-body receipts: 5 bodies / 723,960 bytes with SHA-256; raw HTML/text, source rows, WFS/Atom attempts and temporary inspection output stay outside Git.
- Source denominator: the complete current Posten register has 5,122 unique rows and is effective 2025-10-01. Exact SJ filtering yields eight unique codes: seven source-classified 21 Svalbard rows and one 22 Jan Mayen row, with G 6, P 1, B 1 and S 0. These operational fields were retained without merging repository NO/SJ identities.
- Result: Posten public-serving permission is unverified. Kartverket advertises official `Postnummerområder` under CC BY 4.0, but five WFS/Atom attempts timed out; no fixed geometry body, SJ coverage, Polygon/MultiPolygon validation or eight-code area/non-area reconciliation exists. No Point, municipality, settlement, island, administration, building, buffer, hull, Voronoi/raster or synthetic proxy was promoted.
- Application: shared Polygon/MultiPolygon draw/fit/translucent fill/outline/clear, error and provenance contracts pass, but no real SJ loader, API response, map rendering or browser E2E is claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime/store contracts 29/29, rollout invariants 8/8, SJ ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and focused TypeScript 1/1 pass (51 recorded assertions, 0 failures). Repository-wide TypeScript was attempted but the available dependency tree is incomplete; unrelated inherited errors are disclosed in the checks report.
- Retry: not before 2026-09-07T01:28:39.617Z while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After SJ: 252 profiles, 154 pending, 92 blocked, 0 in progress, 6 evidence-verified M2; 142 manifests / 112 explicit definitions.
- Next country: SK (Slovakia). No second country was started.

## SK - Slovakia

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T02:02:10.112Z`
- Definition: `M2_current_slovakia_psc_assignment_and_area_visualization`
- Evidence: `reports/postal-context-m2/sk-source-review-2026-08-31.json` (`sha256:e1b612208236149d5d47573995bf6264226ce422439e08ef9caa49ff26878e8a`)
- Checks: `reports/postal-context-m2/sk-checks-2026-08-31.json` (`sha256:74cedef7d10b72737b1fa860ef8d3c677e6f6d6e55724882a905a43d2c8667e1`)
- Country report: `docs/postal-context-slovakia-m2.md`
- Exact-body receipts: 20 official bodies / 135,325,717 bytes with SHA-256; raw HTML/JavaScript/JSON/XML/GeoJSON and address/source rows remain outside Git.
- Operator evidence: the current public Slovenská pošta UI performs bounded street/municipality search (`limit=5`). One non-personal sample returned `81107` and `81108`; direct code `81108` returned no row. The generated access XML has 2,449 office/access-point Point records and no area geometry. Neither establishes a complete assignment/exception denominator.
- Address and geometry evidence: eight current daily Register adries NUTS3 metadata records state no access limitation and CC BY 4.0 for author and database rights. The exact current SK010 GeoJSON has 160,897 real address features: 158,803 Point and 2,094 null geometry, 108 distinct valid five-digit postal codes, and zero Polygon/MultiPolygon.
- Result: compatible operator processing/storage/derivation/redistribution/public-serving permission, a complete operator denominator, fixed PSČ area product, complete area/non-area reconciliation, approved immutable artifact and real SK API/UI area path remain unverified. No Point buffer, hull, Voronoi/raster, administrative/cadastral/building/office/access-point or synthetic proxy was promoted.
- Application: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, Point-only non-area, clear and re-search contracts pass. No real eligible SK artifact exists, so real SK API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime/store contracts 29/29, rollout invariants 8/8, SK ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and focused TypeScript 1/1 pass (51 recorded assertions, 0 failures). Repository-wide TypeScript was attempted but the available dependency tree has unrelated missing packages and inherited errors; the limitation is recorded in the checks report.
- Retry: not before `2026-09-07T02:02:10.112Z` while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After SK: 252 profiles, 153 pending, 93 blocked, 0 in progress, 6 evidence-verified M2; 142 manifests / 112 explicit definitions.
- Next country: SM (San Marino). No second country was started.

## SM - San Marino

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T02:35:10.604Z`
- Definition: `M2_current_san_marino_cap_assignment_and_area_visualization`
- Evidence: `reports/postal-context-m2/sm-source-review-2026-08-31.json` (`sha256:9378cbd7bad8728c3324f17119c4ac64b9e93859a5082deac9c74da4d6ee5989`)
- Checks: `reports/postal-context-m2/sm-checks-2026-08-31.json` (`sha256:017f021e42eb3373684d715602d9ff1ed41815a327356a56e4d4f5cdf207ebf1`)
- Country report: `docs/postal-context-san-marino-m2.md`
- Exact-body receipts: 10 official bodies / 1,699,234 bytes with SHA-256; raw HTML/JSON/GeoJSON and office/source rows remain outside Git.
- Operator evidence: the current official Poste office page contains all ten `47890`-`47899` values. These are office-address examples, not a complete assignment/exception denominator, and compatible processing/storage/derivation/redistribution/public-serving rights are unverified.
- Administrative and geometry evidence: the official denominator is nine Castelli, while the `CASTELLI` ArcGIS layer has 12 administrative Polygon features, including three Serravalle and two Borgo Maggiore sub-polygons. All 27,446 positions are finite and all 12 rings close, but the returned GeoJSON declares EPSG:4326 while bbox longitude 21.32-21.44 does not intersect expected San Marino.
- Result: no Castello/sobborgo or office point was promoted as CAP area. In particular, `47891` Dogana and `47899` Serravalle still lack a postal-source-defined split. Resource-specific reuse rights, complete reconciliation, approved immutable artifact and real SM API/UI area path remain blocked.
- Application: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, Point-only non-area, clear and re-search contracts pass. No real eligible SM artifact exists, so real SM API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime/store contracts 29/29, rollout invariants 8/8, SM ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and focused TypeScript 1/1 pass (51 recorded assertions, 0 failures). Repository-wide TypeScript was attempted but the available dependency tree has unrelated missing packages and inherited errors; the limitation is recorded in the checks report.
- Retry: not before `2026-09-07T02:35:10.604Z` while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After SM: 252 profiles, 152 pending, 94 blocked, 0 in progress, 6 evidence-verified M2; 143 manifests / 113 explicit definitions.
- Next country: UA (Ukraine). No second country was started.

## UA - Ukraine

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T03:03:41.090Z`
- Definition: `M2_current_ukraine_postal_index_assignment_and_area_visualization`
- Evidence: `reports/postal-context-m2/ua-source-review-2026-08-31.json` (`sha256:f446fcb61253fe62755cf95df9579a73c916c169208acd517a7e4ffb2193ac7b`)
- Checks: `reports/postal-context-m2/ua-checks-2026-08-31.json` (`sha256:780244a5138147e01eeb7d2f4f0a2334a0d14c741910793eaacee198824d91ad`)
- Country report: `docs/postal-context-ukraine-m2.md`
- Exact-body receipts: 6 official bodies / 13,280,996 bytes with SHA-256. The expanded 117,904,566-byte CSV is separately fixed as `sha256:46e0a2992a23d32a8165e9bf2fa6f0b83c8f261585da72717bbbf7020d22d512`; raw PDF/HTML/JSON/7z/CSV and address rows remain outside Git.
- Open-data evidence: the official CC BY August 2025 archive reproducibly contains 320,249 Windows-1251 address-membership rows, 16 columns and 28,796 distinct valid five-digit indices (`01001`-`93891`, including 1,435 leading-zero codes). The monthly portal marks it not updated, and no coordinate, geometry, Polygon or MultiPolygon column exists.
- Current API evidence: Address Classifier v3.20 (2026-02-11) and general API documentation (2026-03-09) require a bearer obtained after contract. They document address membership, a courier-area yes/no flag and office-point latitude/longitude, but no postcode Polygon/MultiPolygon endpoint. No contact, contract, credential or authenticated request was attempted.
- Result: no address/office row, office point, KATOTTG/administrative boundary, settlement, street, building, parcel, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted as a postcode perimeter. A current complete assignment/exception/non-area denominator, fixed area product, full reconciliation, approved immutable artifact and real UA API/UI area path remain blocked.
- Application: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, Point-only non-area, clear and re-search contracts pass. No real eligible UA artifact exists, so real UA API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime/store contracts 29/29, rollout invariants 8/8, UA ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and focused TypeScript 1/1 pass (51 recorded assertions, 0 failures). Repository-wide TypeScript was attempted but the available dependency tree has unrelated missing packages and inherited errors; the limitation is recorded in the checks report.
- Retry: not before `2026-09-07T03:03:41.090Z` while pending countries remain; provider contact, contract/terms acceptance, registration, authentication, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After UA: 252 profiles, 151 pending, 95 blocked, 0 in progress, 6 evidence-verified M2; 143 manifests / 113 explicit definitions.
- Next country: VA (Vatican City). No second country was started.

## XD - Dhekelia

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T04:15:44.116Z`
- Definition: `M2_current_dhekelia_bfpo_and_cyprus_assignment_area_visualization`
- Evidence: `reports/postal-context-m2/xd-source-review-2026-08-31.json` (`sha256:3d14761219a34d4ca5abfb380a30b0101bb0f84e25951d5059244890020d8f14`)
- Checks: `reports/postal-context-m2/xd-checks-2026-08-31.json` (`sha256:7635f73282951761c78c61d0b3cf1a751eead8d604078571742c1a050bee473f`)
- Country report: `docs/postal-context-dhekelia-m2.md`
- Exact-body receipts: 7 official bodies / 4,207,851 bytes with SHA-256; raw HTML/XLSX/PDF, source rows, rendered pages and temporary inspection output remain outside Git.
- Dual-system evidence: current GOV.UK maps Dhekelia to BFPO `58` and shadow postcode `BF1 2AU`, and instructs BFPO addressing by number rather than location. The current Cyprus Post workbook separately contains `6370` and `7502`: 39 `Dekeleia` street rows at 7502, one military-labelled row at 6370 and two community rows; a `Dekeleias`/3045 false positive was excluded.
- Result: the six-sheet workbook has no coordinate, CRS, WKT, GeoJSON, Polygon or MultiPolygon field. Cyprus Post resource-specific AGID processing/storage/derivation/redistribution/public-serving permission, an immutable fixed release and a complete cross-system assignment/eligibility/exception/non-area denominator are unverified. The 2015 SBA PDF is environmental and was not promoted as postal geometry.
- Identity and geometry: XD, Cyprus, Akrotiri, Episkopi and Ayios Nikolaos remain distinct. No territory, combined SBA boundary, community, street, environmental map, office, address, point, building, parcel, buffer, hull, Voronoi/raster cell or synthetic proxy was promoted.
- Application: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, Point-only non-area, clear and re-search contracts pass. No eligible XD artifact exists, so real XD API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime/store contracts 29/29, rollout invariants 8/8, XD ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and focused TypeScript 1/1 pass (51 recorded assertions, 0 failures).
- Retry: not before `2026-09-07T04:15:44.116Z` while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After XD: 252 profiles, 149 pending, 97 blocked, 0 in progress, 6 evidence-verified M2; 145 manifests / 115 explicit definitions.
- Next country: XK (Kosovo). No second country was started.

## XK - Kosovo

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T04:57:44.714Z`
- Definition: `M2_current_kosovo_official_postal_code_assignment_and_area_visualization`
- Evidence: `reports/postal-context-m2/xk-source-review-2026-08-31.json` (`sha256:a00b018f876ba5b2c2cc18dcaf4a4899127984be06dbe89fe1f2e9fd36fb4f20`)
- Checks: `reports/postal-context-m2/xk-checks-2026-08-31.json` (`sha256:147ff6e6c5492a77e0ba30fd6098157100819f2e28bde43247a320d645466ee1`)
- Country report: `docs/postal-context-kosovo-m2.md`
- Exact-body receipts: 8 official bodies / 860,744 bytes with SHA-256; raw HTML/JSON/PNG, source geometry and temporary inspection output remain outside Git.
- Operator evidence: the current official Posta page embeds 133 unique five-digit assignments across seven regions.
- Real geometry evidence: the official Geoportal Layer API exposes `PostalZone` and `ZyratPostare`. Dynamic WMS GetFeatureInfo returned two duplicate Level-1 `Prishtinë`/`10000` EPSG:4326 MultiPolygons with finite closed rings, and GetMap rendered actual translucent fill with visible boundaries.
- Result: representative geometry does not establish a fixed complete artifact or all-133-code coverage. Feature level/parent/duplicate semantics, immutable version/schema, full operator area/non-area reconciliation and resource-specific compatible Posta/Geoportal public-serving rights remain unverified. No dynamic response, Level-1 assumption, office, administrative/address/building/parcel/point/buffer/hull/Voronoi/raster or synthetic proxy was promoted.
- Application: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, Point-only non-area, clear and re-search contracts pass. No approved XK artifact exists, so real XK API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime/store contracts 29/29, rollout invariants 8/8, XK ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and focused TypeScript 1/1 pass (51 recorded assertions, 0 failures).
- Retry: not before `2026-09-07T04:57:44.714Z` while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After XK: 252 profiles, 148 pending, 98 blocked, 0 in progress, 6 evidence-verified M2; 146 manifests / 116 explicit definitions.
- Next country: XU (current ledger identity). No second country was started.

## XU - Akrotiri

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T05:23:45.136Z`
- Definition: `M2_current_akrotiri_bfpo_and_cyprus_postal_area_visualization`
- Evidence: `reports/postal-context-m2/xu-source-review-2026-08-31.json` (`sha256:fb151d3a3dda727448dcb58b54fbd1cfbc75effde1ac5126899f123837af8f80`)
- Checks: `reports/postal-context-m2/xu-checks-2026-08-31.json` (`sha256:1dfe7013559d7f4ef4f180c9e1530d0befce1feba6effb9e52f6ab1b5a59723e`)
- Country report: `docs/postal-context-akrotiri-m2.md`
- Exact-body receipts: 9 official bodies / 8,102,778 bytes with SHA-256; raw HTML/ZIP, source geometry and temporary inspection output remain outside Git.
- Route evidence: current GOV.UK maps Akrotiri to BFPO `57` and shadow postcode `BF1 2AT`; it separately preserves Episkopi `53` / `BF1 2AS`. BFPO addressing is a route, not an area assertion.
- Real geometry evidence: the fixed official DLS September 2025 Shapefile has 870 Polygon features, 848 distinct code values, zero null/invalid geometry and one valid 1,285-point `AKROTIRI` / `4640` Polygon in CGRS93 LTM.
- Result: DLS 4640 name/code geometry does not establish equivalence to BFPO 57, BF1 2AT, all XU territory or all eligible users. The current complete dual-system assignment/eligibility/alias/exception/non-area denominator, authoritative cross-system reconciliation and resource-specific compatible DLS public-serving rights remain unverified. No name/containment assumption, route, territory, administrative/environmental area, office, address, building, parcel, point, buffer, hull, Voronoi/raster cell or synthetic proxy was promoted.
- Application: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, Point-only non-area, clear and re-search contracts pass. No approved XU artifact exists, so real XU API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, shared area/runtime/store contracts 29/29, rollout invariants 8/8, XU ledger evidence 5/5, changed JavaScript/JSON syntax 7/7 and focused TypeScript 1/1 pass (51 recorded assertions, 0 failures).
- Retry: not before `2026-09-07T05:23:45.136Z` while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After XU: 252 profiles, 147 pending, 99 blocked, 0 in progress, 6 evidence-verified M2; 147 manifests / 117 explicit definitions.
- Next country: AG (Antigua and Barbuda). No second country was started.


## AG - Antigua and Barbuda

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T05:49:45.489Z`
- Definition: `M2_current_antigua_barbuda_optional_postal_identifier_and_area_visualization`
- Evidence: `reports/postal-context-m2/ag-source-review-2026-08-31.json` (`sha256:7d8bc4e0fda4594f8c36a01178b4beb6e7ac94b6cc0af76215579bf2950734e6`)
- Checks: `reports/postal-context-m2/ag-checks-2026-08-31.json` (`sha256:56e23dec994e36ce5892f8de7055786507a67a60a77f2b22e2c3e3aa7a14174a`)
- Country report: `docs/postal-context-antigua-barbuda-m2.md`
- Exact-body receipts: 7 official bodies / 1,674,773 bytes with SHA-256; raw PDF/HTML, rendered pages, source rows and temporary inspection output remain outside Git.
- Postal-system evidence: the UPU August 2026 publication's September 2025 table lists Antigua and Barbuda among countries which do not require postal codes. This keeps `postalCode` nullable but does not prove that no internal office, route, P.O.-box or organization identifiers exist.
- Operator and rights evidence: current UPU references identify Antigua and Barbuda Postal Service, General Post Office and organization code `AGA`. They publish no complete identifier/alias/eligibility/exception/non-area denominator or geometry. UPU rights are reserved and no resource-specific compatible public-serving permission was established.
- Existing pack boundary: the draft Postal Forge pack's 246 planning cells, 48 synthetic locality identifiers and 12 required boundary slots remain simulation/planning fixtures; it contains zero official municipality records and zero production-eligible postal areas.
- Result: no official, derived or virtual postal Polygon/MultiPolygon exists. No island, parish, locality, administrative boundary, office, route, P.O. box, organization, address, building, parcel, Point, buffer, hull, Voronoi/raster cell, AGID planning cell or synthetic proxy was promoted. No approved immutable artifact or real AG API/UI path exists.
- Application: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, Point/non-area, clear and re-search contracts pass. No eligible real AG artifact exists, so real AG API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, source-inspector unit tests 5/5, shared area/runtime/store contracts 29/29, rollout invariants 8/8, AG ledger evidence 5/5, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (57 recorded assertions, 0 failures).
- Retry: not before `2026-09-07T05:49:45.489Z` while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After AG: 252 profiles, 146 pending, 100 blocked, 0 in progress, 6 evidence-verified M2; 148 manifests / 118 explicit definitions.
- Next country: AI (Anguilla). No second country was started.

## AI - Anguilla

- Status: `m2_verified` / M2 achieved
- Attempt: 1 at `2026-08-31T06:30:16.139Z`
- Definition: `M2_current_upu_whole_territory_derived_visualization`
- Evidence: `reports/postal-context-m2/ai-current-whole-territory-2026-08-31.json` (`sha256:f84b550e390ffb4e536f0a996342d05446830039eb763a9cffd5e3647cb6a12d`)
- Checks: `reports/postal-context-m2/ai-validation-2026-08-31.json` (`sha256:99905de17fef699c5bb8b18e0e41b9e6ebf0e7ee2d04828a5180c0d6056f4b2e`)
- Country report: `docs/postal-context-anguilla-m2.md` (`sha256:4b13276402e33b36c614beaac4dc8482249efb57dfa22199793cd9a7861a969a`)
- Official assignment: the UPU Universal POST*CODE DataBase August 2026 and Anguilla addressing sheet establish `AI-2640` as the single postcode for the whole territory. UPU material remains reference evidence and is not redistributed.
- Real display geometry: fixed geoBoundaries commit `9469f09592ced973a3448cf66b6100b741b64c0d`, boundary `AIA-ADM0-96724787`, boundary year 2021, CC BY 4.0. The reproducible coordinate-preserving partition retains all 28 parts and 10,606 positions as two independently valid derived MultiPolygons; area delta is `1.4901161193847656e-8` square metres.
- Authority: UPU assignment is official but has no geometry authority. Geometry is explicitly `derived`, confidence `0.92`, and is not an official postal, legal, survey, cadastral or delivery boundary. POCDS service zones, addresses, buildings, parcels, recipients, customers and land-rights objects were not promoted.
- Application: `AI2640` and full-width `ＡＩ ２６４０` normalize to `AI-2640`; the real descriptor flows through the shared runtime and Express API to two MultiPolygons, multiple-result state, union-bounds fit, opacity-0.22 fill, opacity-0.95/width-3 outline, provenance metadata, clear and re-search. `AI-2641` returns 400 with no fabricated geometry. Deterministic route-to-map verification substitutes for browser E2E.
- Validation: AI country/topology/API/app 16/16, shared runtime 162/162, shared area UI 5/5, TypeScript and diff checks all pass; a second isolated build reproduced descriptor, graph and geometry digests (185 recorded passes, 0 failures).
- Published artifact commit: `636f4bc9620c24eeb9304b1a2cf944d9201ade10` on `codex/postal-context-m2-rollout`.
- After AI: 252 profiles, 145 pending, 100 blocked, 0 in progress, 7 evidence-verified M2; 149 manifests / 119 explicit definitions.
- Next country: AR (Argentina). No second country was started.

## AR - Argentina

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T07:54:17.132Z`
- Definition: `M2_current_correo_argentino_cpa_assignment_and_area_visualization`
- Evidence: `reports/postal-context-m2/ar-source-review-2026-08-31.json` (`sha256:2ebd32f9ab89db98d36a378bf123628cb4e0a36e55c748040bcd087dbea2b18e`)
- Checks: `reports/postal-context-m2/ar-checks-2026-08-31.json` (`sha256:1e46200e67468007e714ff512f88f590b33f7ea42e21974f8d1347d9e8f76004`)
- Country report: `docs/postal-context-argentina-m2.md`
- Exact-body receipts: 8 official bodies / 432,562 bytes with SHA-256; raw HTML/JSON/PDF, rendered pages, lookup responses, source rows and temporary inspection output remain outside Git.
- Operator and access evidence: Correo Argentino maintains the national locality/street/height CPA master and offers free individual epistolary lookup. Official AAIP record EX-2023-59298590 documents partial or total database processing as a commercial product supplied through batch/Web Service and particular agreements with intellectual-property protection.
- Georef boundary: the official OpenAPI `0.5.X` has ten address/territorial/download paths but no CPA/postal schema key or postal-area endpoint. No Georef point, locality, department, municipality, census unit or other territorial geometry was promoted as CPA assignment or postal area.
- Result: no current complete authorized assignment/alias/validity/exception/non-area denominator, compatible AGID public-serving rights, or fixed official/derived/virtual postal Polygon/MultiPolygon was found. No nominal block face, street range, address, building, parcel, Point, buffer, hull, Voronoi/raster cell, AGID cell or synthetic fixture was promoted.
- Application: shared Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, Point/non-area, clear and re-search contracts pass. No eligible real AR artifact exists, so real AR API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, source-inspector unit tests 6/6, AR country/runtime/API boundary 12/12, shared area/runtime/store contracts 29/29, rollout invariants 8/8, AR ledger evidence 5/5, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (70 recorded assertions, 0 failures).
- Retry: not before `2026-09-07T07:54:17.132Z` while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After AR: 252 profiles, 144 pending, 101 blocked, 0 in progress, 7 evidence-verified M2; 149 manifests / 120 explicit definitions.
- Next country: AW (Aruba). No second country was started.

## AW - Aruba

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T08:45:47.702Z`
- Definition: `M2_current_post_aruba_postcode_assignment_and_area_visualization`
- Evidence: `reports/postal-context-m2/aw-source-review-2026-08-31.json` (`sha256:67b439cef18bee4ddef3e40c7f2660afa3a31430f2e44d13456acec50f9c7b77`)
- Checks: `reports/postal-context-m2/aw-checks-2026-08-31.json` (`sha256:26c726b10d2f2ce505fe7cef4ca740a8b6615db2a0486cf1c3c3cc155842972f`)
- Country report: `docs/postal-context-aruba-m2.md`
- Exact-body receipts: 4 official bodies / 839,174 bytes with SHA-256; raw HTML/PDF, rendered pages and temporary inspection output remain outside Git.
- Postal authority: Post Aruba states that Aruba has no postal code. The UPU September 2025 Universal DataBase independently lists Aruba among countries and territories which do not require postal codes.
- Rights: reviewed Post Aruba bodies assert 2026 copyright and publish no open postal dataset licence; public web access was not treated as processing, derivation, redistribution or public-serving permission.
- Result: no postcode search key, current assignment/alias/validity/exception/non-area denominator or official/derived/virtual postal Polygon/MultiPolygon exists. No island, district, region, locality, neighbourhood, address, route, service area, parcel, building, Point, buffer, hull, Voronoi/raster cell, AGID cell, commerce ZIP placeholder or synthetic AW planning code was promoted.
- Application: shared normalization/no-match, Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, Point/non-area, clear and re-search contracts pass. No eligible real AW input or area artifact exists, so real AW API/map rendering and browser E2E are not claimed.
- Validation: reproducible source inspector 1/1, source-inspector unit tests 5/5, shared area/runtime/store contracts 29/29, rollout invariants 8/8, AW ledger evidence 5/5, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (57 recorded assertions, 0 failures).
- PDF review: UPU physical page 4 rendered to a non-empty 1158x1638 RGB PNG and exact bytes, 12-page count, page markers and render SHA-256 passed. The local image-view helper failed with Windows error 206 even at a short path; no image was committed.
- Retry: not before `2026-09-07T08:45:47.702Z` while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After AW: 252 profiles, 143 pending, 102 blocked, 0 in progress, 7 evidence-verified M2; 150 manifests / 121 explicit definitions.
- Next country: BB (Barbados). No second country was started.

## 2026-08-31 Barbados (BB) - blocked at M1

- **Primary evidence:** preserved and SHA-256-verified 11 exact official/public bodies (1,951,330 bytes): current Barbados Postal Service search, addressing and terms pages; the UPU 11/2014 one-page addressing guide; and current public BBID Experience, WebMap, building-item, FeatureServer and layer metadata. No feature or address row was queried.
- **Rights:** BPS terms assert copyright and restrict making, transmitting and storing electronic copies. The public BBID Experience has `licenseInfo: null` and no terms field; its WebMap and building item have empty licence metadata and no terms field. Public viewing and Query capability do not grant AGID processing, derivation, redistribution or public-serving rights.
- **Geometry:** BBID layer `Simplified Buildings 24082026` is an `esriGeometryPolygon` building-footprint layer with `BuildingID`, `ShortPosta` and `LongPostal` fields. A building footprint is not a legacy ShortPosta postal area. No dissolve, fill, buffer, parcel/locality/parish/point/AGID proxy, or fabricated area is permitted. A LongPostal footprint remains ineligible until an explicit, permitted same-feature relationship and privacy review exist.
- **M2/app status:** M2 remains unmet. There is no complete current finite assignment denominator, rights-cleared fixed artifact, production BB API record, or real postcode-to-Polygon/MultiPolygon app path. Loading, no-match, multiple, API-failure, invalid-geometry, metadata, clear and re-search behavior therefore remain intentionally disabled for BB real data.
- **Validation:** 59/59 deterministic checks passed across exact-source inspection, inspector unit tests, shared Postal Context runtime tests, rollout invariants, BB ledger contracts, focused TypeScript checking and syntax/JSON validation. The UPU PDF was also rendered at 150 dpi and checked for a non-empty page without relying on OCR.
- **Retry:** after `2026-09-07T09:32:18.170Z`, and only after the pending-country sweep; no provider contact, account, contract, payment, protected-row query, new destination or deployment without explicit approval.
- **Next:** Saint Barthélemy (`BL`).

## BL - Saint Barthélemy

- Status: m2_verified / M2 achieved
- Attempt: 1 at 2026-08-31T10:26:19.045Z
- Definition: M2_current_laposte_single_postcode_derived_collectivity_visualization
- Evidence: reports/postal-context-m2/bl-current-single-postcode-2026-08-31.json (sha256:6f13839e5d8d3647064e827bc4490e1229593f1d3655055fb02cc34810bfd8e2)
- Checks: reports/postal-context-m2/bl-validation-2026-08-31.json (sha256:bade8154b2ade5087c4a8ec68f177f1542675b28aa26ab7a10b50f72f0818bb6)
- Country report: docs/postal-context-saint-barthelemy-m2.md (sha256:9e38c65c9c0956fa4613416c675ef96e10fad9207f3d82be2e037b477cd5ae20)
- Official assignment: the complete La Poste snapshot updated 2026-08-08 has 39,192 rows and exactly one 977-prefix and one 97133 row, both 97701 Saint-Barthélemy to 97133. La Poste explicitly supplies no open postcode contours.
- Real display geometry: fixed geo.api.gouv.fr code and postcode queries return the same 21-part, 2,912-position real MultiPolygon. The coordinate-preserving build passes Turf and JSTS; all seven exact source receipts total 1,879,646 bytes and remain outside Git under Open Licence 2.0.
- Authority: assignment is official; the displayed administrative geometry is derived, confidence 0.97, and is not an official postal, legal, survey, cadastral or delivery boundary. No address, building, parcel, recipient, customer, land-rights or fabricated area is published.
- Application: BL plus 97133 normalizes to 97133; the real descriptor flows through the shared runtime and Express API to the MultiPolygon, bounds fit, opacity-0.22 fill, opacity-0.95/width-3 outline, provenance metadata, clear and re-search. Invalid input returns 400 without fabricated geometry. Deterministic route-to-map verification substitutes for browser E2E.
- Validation: BL country/topology/API/app 16/16, shared runtime 162/162, shared area UI 5/5, TypeScript and diff checks all pass; a second isolated build reproduced descriptor, graph and geometry digests (185 recorded passes, 0 failures).
- Published artifact commit: f66ebcd354b97507111691ba003f26e5eec31f57 on codex/postal-context-m2-rollout.
- After BL: 252 profiles, 141 pending, 103 blocked, 0 in progress, 8 evidence-verified M2; 151 manifests / 123 explicit definitions.
- Next country: BM (Bermuda). No second country was started.

## BM - Bermuda

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T11:37:20.370Z`
- Definition: `M2_current_bpo_assignments_and_postal_area_visualization`
- Evidence: `reports/postal-context-m2/bm-source-review-2026-08-31.json` (`sha256:f788c2355fe77717f134cd16f57c84355a3368e83ca26aa87d2e6a301cb2b14c`)
- Checks: `reports/postal-context-m2/bm-checks-2026-08-31.json` (`sha256:c900e3115e126ccd09accf89370ec002e357fe9314bd7412ed59574ad792b35f`)
- Country report: `docs/postal-context-bermuda-m2.md`
- Exact-body receipts: 12 official/public bodies / 1,039,242 bytes with SHA-256; raw HTML, JSON, PDF, encrypted/decrypted workbook bytes, logical source rows, rendered pages and temporary inspection output remain outside Git.
- Assignment evidence: the current BPO location page confirms nine live examples, and its official workbook exposes 2,087 candidate assignment rows, 2,086 unique normalized rows and 102 normalized codes. The workbook was last saved in 2019, has one embedded header, one case anomaly, one qualifier anomaly, one duplicate, 30 ambiguous assignment keys and 12 parish-label variants; it declares no edition, validity period, correction log, geometry or completeness denominator.
- Format evidence: the UPU `4/2026` addressing sheet defines home delivery as `AA NN` and PO Box codes as `AA AA`. This corroborates syntax only and does not cure workbook currency, rights, exceptions or area geometry.
- Rights: Government of Bermuda terms reserve Crown copyright in content and databases and prohibit reproduction, distribution, modification and transmission without written permission. UPU Universal POST*CODE 2026.1 access requires a contract, NDA, exhibits, data-use declaration and rates. Public viewing was not treated as AGID processing, derivation, redistribution or public-serving permission.
- Geometry: no official or rights-compatible fixed BM postal Polygon/MultiPolygon was found. The public BELCO tile package is unlisted private-owner imagery with empty access/licence metadata and is not queryable vector data. The only Polygon FeatureServer candidate is outside Bermuda and has no postcode field. No parish, locality, route, building, Point, buffer, hull, raster/Voronoi cell, AGID cell or synthetic fixture was promoted.
- Application: shared Polygon/MultiPolygon-only draw, bounds fit, translucent fill, visible outline, Point/non-area, clear and re-search contracts pass. With no eligible real BM area artifact, real BM search-to-API-to-map rendering and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 7/7, shared area/runtime/store contracts 29/29, rollout invariants 8/8, BM ledger evidence 6/6, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (60 recorded assertions, 0 failures). The UPU PDF and ten-page government terms PDF were rendered and checked as non-empty; the encrypted XLS was read with Excel's standard built-in protection and no provider/user credential.
- Retry: not before `2026-09-07T11:37:20.370Z` while pending countries remain; provider contact, written permission, contract/NDA acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After BM: 252 profiles, 140 pending, 104 blocked, 0 in progress, 8 evidence-verified M2; 152 manifests / 124 explicit definitions.
- Next country: BO (Bolivia). No second country was started.

## BO - Bolivia

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T12:44:51.745Z`
- Definition: `M2_current_agbc_postcode_assignment_and_area_visualization`
- Evidence: `reports/postal-context-m2/bo-source-review-2026-08-31.json` (`sha256:dfcb4fbdd13412d2f6517b4965233de63fb5e3793ce556aad0acdc4c77c4f461`)
- Checks: `reports/postal-context-m2/bo-checks-2026-08-31.json` (`sha256:8177399d6983beaf8695a1f9f76be616d2f110b75603f036eccbb6e1276f61ab`)
- Country report: `docs/postal-context-bolivia-m2.md`
- Exact-body receipts: 9 AGBC, UPU and ArcGIS bodies / 1,421,915 bytes with SHA-256. Raw HTML, JSON, JavaScript, PDF, office/address rows, rendered pages and temporary inspection output remain outside Git.
- Postal authority: UPU General Addressing Issues physical page 4 (`Sep. 2025`) includes Bolivia among countries not requiring postal codes. The Bolivia addressing sheet edition `2/2026` shows home, P.O. Box and rural delivery without a postcode line. `Casilla Postal 3515` is a box identifier, not a code.
- AGBC objects and rights: the current portal labels `PE123456789` as a shipment tracking identifier, exposes a P.O. Box service and nine office records, asserts 2026 copyright and links `Terminos y Condiciones` only to `#`. No open postal dataset licence, assignment denominator or geometry release is published; only the aggregate office count was retained.
- Geometry: no current BO postcode exists to anchor a postal Polygon/MultiPolygon. The indexed `CodigoPostal` Polygon layer uses Colombia CRS EPSG:3116 and an extent around longitude -75.63, latitude 6.11, outside Bolivia; licence fields are empty and no feature row was queried. No department, province, municipality, locality, office, route, address, building, Point, buffer, hull, Voronoi/raster cell, model, AGID cell or foreign Polygon was promoted.
- Application: shared Polygon/MultiPolygon-only draw, bounds fit, translucent fill, visible outline, Point/non-area, clear and re-search contracts pass. With no valid BO postcode input or eligible real area artifact, real BO search-to-API-to-map rendering and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 7/7, shared area/runtime/store contracts 29/29, rollout invariants 8/8, BO ledger evidence 6/6, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (60 recorded assertions, 0 failures).
- PDF review: both relevant UPU pages rendered to non-empty RGB PNGs; exact bytes, 13 total physical pages, text markers, dimensions, non-white bounds and render SHA-256 passed. The local image-view helper returned Windows error 206 even through a short mapped path; no image was committed.
- Retry: not before `2026-09-07T12:44:51.745Z` while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After BO: 252 profiles, 139 pending, 105 blocked, 0 in progress, 8 evidence-verified M2; 153 manifests / 125 explicit definitions.
- Next country: BQ (Caribbean Netherlands). No second country was started.

## BQ - Caribbean Netherlands

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T13:36:23.702Z`
- Definition: `M2_current_caribbean_netherlands_postcode_assignment_and_area_visualization`
- Evidence: `reports/postal-context-m2/bq-source-review-2026-08-31.json` (`sha256:404cd477a0ae7cc0f1141a78c7f40b9983ccce427a394032f5cec96d544b2738`)
- Checks: `reports/postal-context-m2/bq-checks-2026-08-31.json` (`sha256:15ab77999dda86de8fcad951bbe227f4fb842a084107eb46ac42a010ff31f8d2`)
- Country report: `docs/postal-context-caribbean-netherlands-m2.md`
- Exact-body receipts: 8 RCN, ACM, Internetconsultatie and UPU bodies / 1,751,301 bytes with SHA-256. Raw HTML/PDF, addresses, rendered pages and temporary inspection output remain outside Git; no feature or address row was queried.
- Current authority: the current RCN postal-service page says no postcodes exist in Bonaire, Saba or Sint Eustatius. ACM identifies FXDC as the supervised concession holder, and UPU's September 2025 table independently lists Bonaire, Saint Eustatius and Saba among territories not requiring postal codes.
- Proposal boundary: the concluded 2024 consultation describes `0000AA-0999ZZ` as a proposal. Its final report records `0000BQ` as a workaround, excludes `0000AA-0000ZZ` from proposed use and calls `0100AA` only a possible first combination. None was promoted as an assignment, lookup input or area key.
- Rights: RCN applies CC0 1.0 to eligible website text while restricting most images. Text-reference reuse does not create or license a future assignment/geometry dataset; no compatible complete postal public-serving right was established.
- Geometry and identity: with no current assignment there is no official/derived/virtual BQ postal Polygon/MultiPolygon. No island, public body, administrative area, locality, office, route, address, building, parcel, Point, buffer, hull, Voronoi/raster cell, model, AGID cell or proposal scenario was promoted. BQ and the three island identities remain separate from European Netherlands, Aruba, Curaçao and Sint Maarten.
- Application: shared Polygon/MultiPolygon-only draw, bounds fit, translucent fill, visible outline, Point/non-area, clear and re-search contracts pass. With no valid BQ input or eligible immutable area artifact, real BQ search-to-API-to-map rendering and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 7/7, shared area/runtime/store contracts 29/29, rollout invariants 8/8, BQ ledger evidence 6/6, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (60 recorded assertions, 0 failures).
- PDF review: three PDFs / 20 physical pages were byte- and text-verified; four relevant pages rendered to non-empty RGB PNGs with fixed dimensions, non-white bounds and SHA-256. Web screenshots timed out or missed cache for three pages, and the local image-view helper returned Windows error 206 through original and short paths; no image was committed.
- Retry: not before `2026-09-07T13:36:23.702Z` while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After BQ: 252 profiles, 138 pending, 106 blocked, 0 in progress, 8 evidence-verified M2; 154 manifests / 126 explicit definitions.
- Next country: Brazil (`BR`). No second country was started.

## BR - Brazil

- Status: `blocked` / M2 unmet
- Attempt: 1 at `2026-08-31T14:18:56.294Z`
- Definition: `M2_current_correios_cep_assignment_and_area_visualization`
- Evidence: `reports/postal-context-m2/br-source-review-2026-08-31.json` (`sha256:95f521e3fc1e3989f8d201661f2b57317ee6b556771bba39637e0d39780cae2f`)
- Checks: `reports/postal-context-m2/br-checks-2026-08-31.json` (`sha256:c04390b3ab5decfa4e435368801423d389fddd5a4e9dfed03ce3869150b4e13c`)
- Country report: `docs/postal-context-brazil-m2.md`
- Exact-body receipts: 4 Correios and UPU bodies / 512,491 bytes with SHA-256. Raw HTML/PDF, UPU example addresses, rendered pages and temporary inspection output remain outside Git; no DNE dataset, API credential, feature or address row was queried.
- Assignment authority and version: Correios advertises DNE as its complete official and exclusive national database with more than 1.3 million CEPs. The current schedule reaches V.26082 on 2026-08-31. DNE is delivered only after a formal request, contract, use commitment and payment and remains licence-restricted.
- API/public portal: Busca CEP API manual v1.0 requires a Brazilian corporate account, a commercial contract containing service 86738 and a Bearer token. Public Busca CEP 1.5.8 is CAPTCHA-protected. Neither path was accessed beyond its public documentation, treated as a complete fixed release or scraped.
- Format and object classes: the UPU sheet confirms eight digits, displayed `NNNNN-NNN`, and distinguishes ordinary delivery, P.O. box, community mailbox and big-mailer/special-code examples. Syntax and examples are not current assignment rows, and non-area objects were not expanded to surfaces.
- Rights and geometry: compatible AGID processing, derivation, redistribution and public-serving rights were not established. DNE TXT/MDB rows and documented API responses contain typed address/range/object attributes, not geometry. No CNEFE point or CEP aggregate, municipality/district/neighbourhood/census boundary, road, building, parcel, buffer, hull, Voronoi/raster cell, model or AGID cell was promoted as a Correios postal Polygon/MultiPolygon.
- Application: shared Polygon/MultiPolygon-only draw, bounds fit, translucent fill, visible outline, Point/non-area, clear and re-search contracts pass. With no approved immutable real BR area artifact, real BR search-to-API-to-map rendering and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 7/7, shared area/runtime/store contracts 29/29, rollout invariants 8/8, BR ledger evidence 6/6, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (60 recorded assertions, 0 failures).
- PDF review: the two-page UPU sheet rendered to non-empty 993x1404 RGB PNGs; exact bytes, page count, six text markers, dimensions, non-white bounds and render SHA-256 passed. The local image-view helper returned Windows error 206; no image was committed.
- Retry: not before `2026-09-07T14:18:56.294Z` while pending countries remain; Correios contact, corporate registration, contract/term acceptance, payment, credential use, protected-row query/scrape, destination creation, publication or deployment requires explicit approval.
- After BR: 252 profiles, 137 pending, 107 blocked, 0 in progress, 8 evidence-verified M2; 154 manifests / 127 explicit definitions.
- Next country: Bahamas (`BS`). No second country was started.

## BS - Bahamas

- Status: blocked / M2 unmet
- Attempt: 1 at 2026-08-31T14:59:26.917Z
- Definition: M2_current_bahamas_postcode_assignment_and_area_visualization
- Evidence: reports/postal-context-m2/bs-source-review-2026-08-31.json (sha256:da04ceb2f6c8cd13843b12fcb1bfa93f70754e08d2a032d4b1683d074b558ee9)
- Checks: reports/postal-context-m2/bs-checks-2026-08-31.json (sha256:a76de0733c5bb985a553db9463de015fc9eba0f1bb7eada2f774fdbcb1412ef8)
- Country report: docs/postal-context-bahamas-m2.md
- Exact-body receipts: 6 Bahamas authority and UPU bodies / 2,910,631 bytes with SHA-256. Raw HTML/PDF, example addresses, rendered pages and temporary inspection output remain outside Git; no feature, assignment or address row was queried.
- Current postal authority: UPU Bahamas addressing sheet edition 10/2025 says that The Bahamas does not apply a postcode system or home-delivery system. Mail is dispatched through Post Office Boxes, and Poste Restante is available to people without a box. The September 2025 UPU no-postcode table independently lists Bahamas.
- Object boundary: GT 2001 and comparable examples contain a post-office abbreviation plus P.O. Box number; neither is a postcode or postal-area key. No island name/abbreviation, office, box, Poste Restante object or historical Nassau-Freeport routing practice was promoted.
- Rights: UPU website information reuse with source acknowledgement was distinguished from its copyright/database restrictions. The reviewed ministry page and government-hosted historical rate book publish no complete current assignment/geometry dataset licence. Compatible AGID processing, derivation, redistribution and public-serving rights were not established.
- Geometry and identity: there is no current BS postcode assignment to anchor an official, derived or virtual postal Polygon/MultiPolygon. No island, administrative/planning/electoral area, locality, office, route, service area, address, building, parcel, Point, buffer, hull, Voronoi/raster cell, model or AGID cell was promoted. ISO BS and all island identities remain distinct.
- Application: shared Polygon/MultiPolygon-only draw, bounds fit, translucent fill, visible outline, Point/non-area, clear and re-search contracts pass. With no valid BS postcode input or eligible immutable real area artifact, real BS search-to-API-to-map rendering and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 7/7, shared area/runtime/store contracts 29/29, rollout invariants 8/8, BS ledger evidence 6/6, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (60 recorded assertions, 0 failures).
- PDF review: three PDFs / 36 physical pages were byte- and text-verified; four relevant pages rendered to non-empty RGB PNGs with fixed dimensions, non-white bounds and SHA-256. Web screenshots succeeded for three UPU pages, the government rate-book page had a cache miss, and the local image-view helper returned Windows error 206 through original and short paths; no image was committed.
- Retry: not before 2026-09-07T14:59:26.917Z while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After BS: 252 profiles, 136 pending, 108 blocked, 0 in progress, 8 evidence-verified M2; 155 manifests / 128 explicit definitions.
- Next country: Belize (BZ). No second country was started.

## BZ - Belize

- Status: blocked / M2 unmet
- Attempt: 1 at 2026-08-31T15:51:58.097Z
- Definition: M2_current_belize_postcode_assignment_and_area_visualization
- Evidence: reports/postal-context-m2/bz-source-review-2026-08-31.json (sha256:b256d5ebe68082a757860ed10bf9b1dc261f274de3be125ac8922b819df69e55)
- Checks: reports/postal-context-m2/bz-checks-2026-08-31.json (sha256:f9c67582d9bb3bf0580b3d3fd37e5559e40f36bc280ae6500bdf069fb27a2ddd)
- Country report: docs/postal-context-belize-m2.md
- Exact-body receipts: 7 Belize Postal Service and UPU bodies / 1,055,719 bytes with SHA-256. Raw HTML/PDF, example addresses, rendered pages and temporary inspection output remain outside Git; no feature, assignment, P.O.-Box-holder or address row was queried.
- Current postal authority: the UPU September 2025 table explicitly lists Belize among countries not requiring postal codes. The Belize addressing sheet edition 05/2021 has no postcode line, and current Belize Postal Service regular-mail and P.O.-Box instructions publish no postcode requirement.
- Object boundary: a private P.O. Box number forms part of an address but is not a postcode or postal-area key. No address example, district, caye, city, town, village, locality, post office, route, delivery area, box or other service object was promoted.
- Rights: UPU website information reuse with source acknowledgement was distinguished from its copyright/database restrictions. The reviewed Belize Postal Service pages publish no complete current assignment/geometry dataset licence. Compatible AGID processing, derivation, redistribution and public-serving rights were not established.
- Geometry and identity: there is no current BZ postcode assignment to anchor an official, derived or virtual postal Polygon/MultiPolygon. No administrative/settlement area, office, route, address, building, parcel, Point, buffer, hull, Voronoi/raster cell, model or AGID cell was promoted. ISO BZ, all six districts, cayes and settlement identities remain distinct.
- Application: shared Polygon/MultiPolygon-only draw, bounds fit, translucent fill, visible outline, Point/non-area, clear and re-search contracts pass. With no valid BZ postcode input or eligible immutable real area artifact, real BZ search-to-API-to-map rendering and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 7/7, shared area/runtime/store contracts 29/29, rollout invariants 8/8, BZ ledger evidence 6/6, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (60 recorded assertions, 0 failures).
- PDF review: two PDFs / 13 physical pages were byte- and text-verified; two relevant pages rendered to non-empty 1241x1754 RGB PNGs with fixed non-white bounds and SHA-256. The local image-view helper returned Windows error 206 through original and short paths, and web screenshot calls returned no visible image payload; no image was committed.
- Retry: not before 2026-09-07T15:51:58.097Z while pending countries remain; provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After BZ: 252 profiles, 135 pending, 109 blocked, 0 in progress, 8 evidence-verified M2; 156 manifests / 129 explicit definitions.
- Next country: Canada (CA). No second country was started.

## CA - Canada

- Status: blocked / M2 unmet
- Attempt: 1 at 2026-08-31T16:29:28.906Z
- Definition: M2_current_canada_post_assignment_and_area_visualization
- Evidence: reports/postal-context-m2/ca-source-review-2026-08-31.json (sha256:d1c14546a5f52592c6775525ff1069cd40a1377bc4e66980615893fb6329a9f3)
- Checks: reports/postal-context-m2/ca-checks-2026-08-31.json (sha256:3a92dc2279c236da402f1b3e92825d696ae5d82efebfd795c88ccbac4501f96d)
- Country report: docs/postal-context-canada-m2.md
- Exact-body receipts: 11 Canada Post and Statistics Canada bodies / 2,395,946 bytes with SHA-256. Raw HTML/JSON/PDF, assignment/address/feature rows, rendered pages and temporary inspection output remain outside Git.
- Current assignment: Canada Post identifies Postal Code Address Data as the complete list and publishes monthly files; the review-date release is 260807ad.zip. Acquisition requires a use request, pricing and a licence agreement. No provider was contacted, no request submitted and no licensed row acquired.
- Format and object classes: ANA NAN contains an FSA and LDU. A full code may identify a block face, single building, large-volume receiver or rural community. Technical specifications also type lock-box, route and general-delivery records; none was expanded into a surface.
- Rights and geometry: AddressComplete requires a key/terms, and the licensed product schema publishes addresses/ranges rather than full-code Polygon/MultiPolygon, CRS or topology. Compatible AGID public-serving rights were not established.
- CFSA boundary: the open 2021 layer contains 1,643 three-character Polygon CFSAs derived from respondent-reported codes and dissemination areas. It may differ from Canada Post-assigned FSA geography, has no LDU/full-code geometry and was not promoted. No FSA/CFSA, PCCF, NAR, ODB, administrative, road, parcel, Point, buffer, cell, model, AGID or synthetic proxy was promoted.
- Application: shared Polygon/MultiPolygon-only draw, bounds fit, translucent fill, visible outline, Point/non-area, clear and re-search contracts pass. With no eligible immutable real CA full-code area artifact, real CA search-to-API-to-map rendering and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 7/7, shared area/runtime/store contracts 29/29, rollout invariants 8/8, CA ledger evidence 6/6, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (60 recorded assertions, 0 failures).
- PDF review: four PDFs / 49 physical pages were byte- and text-verified; four relevant pages rendered to non-empty 150-DPI RGB PNGs with fixed dimensions, non-white bounds and SHA-256. The local image-view helper returned Windows error 206 through original and short paths, so interactive visual inspection could not complete; no image was committed.
- Retry: not before 2026-09-07T16:29:28.906Z while pending countries remain. Provider contact/request, registration, authentication, licence/contract acceptance, payment, protected-row access, destination creation, publication or deployment requires explicit approval.
- After CA: 252 profiles, 134 pending, 110 blocked, 0 in progress, 8 evidence-verified M2; 156 manifests / 130 explicit definitions.
- Next country: Chile (CL). No second country was started.


## CL - Chile

- Status: blocked / M2 unmet
- Attempt: 1 at 2026-08-31T17:13:59.841Z
- Definition: M2_current_correoschile_assignment_and_area_visualization
- Evidence: reports/postal-context-m2/cl-source-review-2026-08-31.json (sha256:9487c98c69cdbaa5f567c2ed2da9ac42199ce4140aa799b284444f7d0c42d2a1)
- Checks: reports/postal-context-m2/cl-checks-2026-08-31.json (sha256:621b2254cda3d3d4f3808d67f031c45226e3e488f5a238419523a4d57142545f)
- Country report: docs/postal-context-chile-m2.md
- Exact-body receipts: 8 ChileAtiende, CorreosChile, UPU and IDE Chile Geoportal bodies / 692,958 bytes with SHA-256. Raw HTML/XML/JSON/PDF, address or feature rows, rendered pages and temporary inspection output remain outside Git.
- Assignment authority: the current ChileAtiende procedure and CorreosChile form require commune, street and municipal number and return a property-specific seven-digit observation. The developer normalization API requires customer credentials and returns normalized address/postcode fields without geometry. No address was submitted, CAPTCHA bypassed, credential used or integration request made.
- Format and object classes: the UPU 03/2017 sheet defines three distribution-area digits plus four sequential block-face digits and separately documents commune fallback, post-office/P.O.-box and rural no-number cases. Syntax, examples, one lookup and the three-digit prefix are not current complete assignment evidence; non-area objects were not expanded to surfaces.
- Catalog and geometry: the fixed official CSW query for codigo postal matched 0 records. Broad postal matched two unrelated border-control datasets. DPA 2023 is region/province/commune administrative Polygon geometry, not postal geometry. No DPA/commune, census, road, address-range, parcel, Point, building, buffer, hull, cell, model, AGID or synthetic proxy was promoted.
- Rights: no complete versioned assignment denominator or written rights compatible with AGID processing, derivation, redistribution and public area serving were established. There are 0 approved current assignment rows, real seven-digit Polygon/MultiPolygon records and production runtime artifacts.
- Application: shared and synthetic CL normalization, routing, Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, no-match, Point/non-area, clear and re-search contracts pass. With no eligible immutable real CL artifact, real CL search-to-API-to-map rendering and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 7/7, shared and CL repository/runtime/API/source contracts 41/41, rollout invariants 8/8, CL ledger evidence 6/6, changed Python/JavaScript/JSON syntax 8/8 and focused TypeScript 1/1 pass (72 recorded assertions, 0 failures).
- PDF review: two PDFs / four physical pages were byte- and text-verified; three relevant pages rendered to non-empty 150-DPI RGB PNGs with fixed dimensions, non-white bounds and SHA-256. The local image-view helper returned Windows error 206, so interactive visual inspection is not claimed; no image was committed.
- Retry: not before 2026-09-07T17:13:59.841Z while pending countries remain; provider contact/integration request, registration, authentication, terms/licence/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After CL: 252 profiles, 133 pending, 111 blocked, 0 in progress, 8 evidence-verified M2; 156 manifests / 131 explicit definitions.
- Next country: Colombia (CO). No second country was started.

## CO - Colombia

- Status: `m2_verified` / M2 achieved
- Attempt: 1 at `2026-08-31T18:08:30.995Z`
- Definition: `M2_current_national_472_derived_area_visualization`
- Evidence: `reports/postal-context-m2/co-source-review-2026-09-01.json` (`sha256:b3c245e7687d0a1bcf3a238b1e8a03443a170bc1085dc3029436c7fe2979c409`)
- Checks: `reports/postal-context-m2/co-checks-2026-09-01.json` (`sha256:157076e67c5aeb6a80125298b3d26563705875a3c43e77acaba9b288bd5b4fa3`)
- Country report: `docs/postal-context-colombia-m2.md` (`sha256:32fe63509a8456c30a92f9b3ad771a2282f0d63191e20a76e592e2ad9987e168`)
- Exact primary receipts: eight official 4-72/MINTIC and datos.gov.co bodies / 70,743,890 bytes with SHA-256. Raw HTML, CSV, ZIP, ArcGIS JSON, PDF, rendered page and temporary transform output remain outside Git.
- Assignments: the current official dataset updated 2025-05-20 has 3,681 distinct valid normal six-digit rows: 1,395 urban and 2,286 rural. Reversible numeric normalization and the fixed official Shapefile produce an exact 3,681-code match with zero assignment-only or geometry-only codes.
- Rights and dates: the government catalog applies CC BY-SA 4.0 and links the exact 4-72 archive; the viewer open clause permits reuse, redistribution and transformation with required attribution and safeguards. Assignment date remains 2025-05-20 and the older geometry source date remains 2016-06-28.
- Geometry: GDAL 3.12.1 reproducibly creates 3,681 topology-valid derived MultiPolygons with 312,937 positions, 4,586 rings and confidence 0.97. One collapsed non-area LineString component is discarded; no area is invented and no official-current-boundary claim is made.
- Authority separation: expanded postcodes, sites, properties, addresses, buildings, P.O. boxes, organizations, routes, people, customers, parcels, land rights, administrative/cadastral areas, Points, buffers, hulls, Voronoi/raster cells, models and AGID proxies are excluded.
- Application: full-width/spaced `CO/110 911` normalizes to `110911`; the real API returns one derived MultiPolygon with code, geometry type, class, source dates and confidence. The app converts it to GeoJSON, fits exact bounds, renders opacity-0.22 fill and opacity-0.95/width-3 outline, clears and re-searches. Loading, no-match, multiple, API-failure, invalid-geometry and invalid-input/no-fabrication states are verified. Deterministic route-to-map verification substitutes for browser E2E.
- Validation: CO suite 143/143, shared store/graph/runtime/topology/UI 45/45 and rollout policy 8/8 pass; TypeScript no-emit, builder syntax, JSON parse and diff checks pass; a second build reproduced all three artifact digests (196 recorded tests, 0 failures).
- Published artifact commit: `5afa0ae7a01b23615a56a0d578881ce0ff54539a`; documentation/checks commit: `3a73f9fadefe31a4e3a4a064bcb6ba45d3bb1382`, both on `codex/postal-context-m2-rollout`.
- After CO: 252 profiles, 132 pending, 111 blocked, 0 in progress, 9 evidence-verified M2; 156 manifests / 132 explicit definitions.
- Next country: Clipperton Island (`CP`). No second country was started.

## CP - Clipperton Island

- Status: `m2_verified` / M2 achieved.
- Attempt: 1 at `2026-08-31T19:42:34.212Z`; completed `2026-08-31T20:46:09.208Z`.
- Definition: `M2_current_laposte_single_postcode_derived_territory_visualization`.
- Official assignment: La Poste's complete 39,192-row snapshot updated 2026-08-08 and three exact searches have one CP assignment: current application code 98901, ILE DE CLIPPERTON, postcode 98799.
- Geometry and authority: current geo.api.gouv.fr code and postcode queries return the same real valid Polygon. It is published only as derived administrative territory display context with confidence 0.97, not an official postal, legal, cadastral, survey or delivery boundary.
- Identity/history: INSEE's former COG use of 98799 and current five-position application code 98901 remain separate from La Poste's current postal assignment. CP identity is unchanged.
- Object boundary: French Defense primary evidence states no inhabitants and no habitation. No address, building, parcel, P.O. box, organization, route, person, customer, land right, Point, buffer, hull, cell, model or AGID proxy was promoted.
- Rights and receipts: Etalab Open Licence 2.0 permits reuse with attribution. Fifteen exact data/reference receipts total 2,845,023 bytes with SHA-256; the Defense legal-notice and UPU terms pages are separately fixed by SHA-256 in the ledger. Raw CSV, HTML, JSON, PDF, rendered pages and temporary output remain outside Git.
- Geometry validation: one part, one closed ring, 110 positions, exact bounds `[-109.234607, 10.287154, -109.19979, 10.31957]`, geodesic area 8.889080340032724 km², Turf/JSTS/shared topology valid, no coordinate modification; a second build reproduced descriptor, graph and geometry byte-for-byte.
- Application: full-width/spaced CP/98799 normalizes to 98799; the real API returns one derived Polygon with geometry type, provenance, source date and confidence. The app converts it to GeoJSON, fits exact bounds, renders opacity-0.22 fill and opacity-0.95/width-3 outline, clears and re-searches. Shared loading/no-match/multiple/API-failure/invalid-geometry states pass; invalid 98798 returns 400 with no fabricated area. Deterministic route-to-map verification substitutes for browser E2E.
- Validation: CP focused 9/9, shared runtime 162/162 and shared postal-area UI 7/7 pass; TypeScript no-emit and diff checks pass; UPU text/page/raster checks pass (178 recorded tests, 0 failures).
- Published implementation/artifact commit: `7f9723b9c8ef706027483b66646b7b0a08fc2190` on `codex/postal-context-m2-rollout`.
- After CP: 252 profiles, 131 pending, 111 blocked, 0 in progress, 10 evidence-verified M2; 157 manifests / 133 explicit definitions.
- Next country: Costa Rica (`CR`). No second country was started.

## CR - Costa Rica

- Status: `blocked` / M2 unmet.
- Attempt: 1 at `2026-08-31T21:09:35.746Z`; completed `2026-08-31T21:45:25.7693185Z`.
- Definition: `M2_current_correos_assignment_to_rights_cleared_district_area_visualization`.
- Evidence: `reports/postal-context-m2/cr-source-review-2026-09-01.json` (`sha256:bcf94411cb5e6ee6420759ce6ee883d6e4d799f81ff220aa7940817abe5d1079`).
- Checks: `reports/postal-context-m2/cr-checks-2026-09-01.json` (`sha256:c10d582c98abe5d92ad14ab027900498311ec3bc891fd65f8d2e051c02c3184c`).
- Country report: `docs/postal-context-costa-rica-m2.md` (`sha256:d53ca29f7e919ff1b68edb90e0a36c4f4f327a91dc8b926d0851277f03e90205`).
- Exact receipts: six top-level Correos/INEC bodies / 15,518,804 bytes plus the 34,595-byte archive metadata member, all fixed by byte count and SHA-256. Raw HTML, JSON, Shapefile archive, feature rows and temporary inspection output remain outside Git.
- Assignment and join: the current Correos observation has 493 enabled district rows and 493 unique five-digit codes. INEC UGED 2024 has 492 unique Polygon codes; 492 join exactly and `60702` is Correos-only. Correos simultaneously enables `60702` and `61301` for Puerto Jiménez without validity or supersession fields, so a complete current one-to-one or dated alias crosswalk is not established.
- Rights: Correos provides free interactive access but no explicit nationwide extraction, derivation, redistribution or public-serving licence. The UGED archive metadata marks Copyright and attribution while use limitation is missing; applicability of the public-site CC BY-SA statement to the archive and derived public serving remains unclear.
- Geometry and authority: UGED has 492 non-empty, OGC-valid EPSG:8908 Polygons, but they remain source-specific geostatistical geometry and 0 were promoted. No postal, legal DTA, cadastral, address, building, parcel, Point, buffer, hull, cell, model, synthetic or AGID proxy area was created; CR, province, canton, district and UGED identities remain distinct.
- Application: shared and synthetic CR normalization, routing, Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, clear and re-search contracts pass. With no approved immutable, rights-cleared and alias-resolved real CR artifact, real CR API/search-to-map visualization and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 4/4, shared and CR repository/runtime/API/UI contracts 41/41, rollout invariants 8/8, changed JavaScript/JSON/diff checks 6/6 and focused TypeScript 1/1 pass (61 recorded checks, 0 failures).
- Retry: not before `2026-09-07T21:09:35.746Z` and only after all pending countries have been swept. Public metadata may then be rechecked; provider contact/request, registration, authentication, terms/licence/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After CR: 252 profiles, 130 pending, 112 blocked, 0 in progress, 10 evidence-verified M2; 157 manifests / 134 explicit definitions.
- Next country: Cuba (`CU`). No second country was started.

## CU - Cuba

- Status: `blocked` / M2 unmet.
- Attempt: 1 at `2026-08-31T22:07:06.826Z`; completed `2026-08-31T22:45:35.1589258Z`.
- Definition: `M2_current_correos_cuba_assignment_and_postal_area_visualization`.
- Evidence: `reports/postal-context-m2/cu-source-review-2026-09-01.json` (`sha256:515cfe21bafa6c122a89e36bc6e580cfab26e0dc1642d0a390b33da8f565b80a`).
- Checks: `reports/postal-context-m2/cu-checks-2026-09-01.json` (`sha256:c443d16284153e290f6f6ea6dfa1feea4bc1e104da47fc16f237848581d3b17f`).
- Country report: `docs/postal-context-cuba-m2.md` (`sha256:2a7ee09273ae7299ba26ddda219fb78fcb82811791c12a8386a334d0bfa7b604`).
- Exact receipts: eleven successful Correos/UPU official bodies / 1,492,006 bytes, all fixed by byte count and SHA-256. Empty timeout bodies are excluded; raw HTML, JavaScript, JSON, PDFs, headers, cookies, renders and office rows remain outside Git.
- Assignment and data quality: Correos' public page describes 812 post offices while its current UI-equivalent query reports 841. The observed ten-row page has 13 office identity/address/contact/service fields and no geometry, membership, validity, alias or supersession field. It is an office directory, not a complete current delivery-code denominator; 0 assignment rows are eligible for AGID.
- UPU and rights: the Cuba sheet is visibly dated `09/2004` and supplies five-digit `CP` syntax/examples only. POST*CODE documents postcode/locality validation, requires registration/API keys or country-unique CDS security tokens, and supplies no area geometry. UPU copyright requires written permission and restricts external distribution; compatible AGID processing/derivation/redistribution/public-serving rights are not established.
- Geometry and authority: 0 official or rights-cleared derived CU Postal Polygon/MultiPolygon records exist. No office address or postcode, locality, municipality, province, IDERC/ONEI/GEOCUBA/OSM context, point, buffer, hull, cell, model, synthetic fixture or AGID proxy was promoted; office, postal, administrative, statistical, cartographic, cadastral, address and building identities remain distinct.
- Application: shared and synthetic CU normalization, runtime/API, Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, states, metadata, clear and re-search contracts pass. With no approved immutable real CU artifact, real CU API/search-to-map visualization and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 4/4, existing CU regression 139/139, shared runtime/API/area UI 54/54, ledger/rollout invariants 14/14 and repository-wide TypeScript 1/1 pass (213 recorded automated checks, 0 failures). Three relevant UPU PDF pages were rendered and visually reconciled.
- Retry: not before `2026-09-07T22:07:06.826Z` and only after all pending countries have been swept. Provider contact, registration, key/token request, authentication, terms/declaration/NDA/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After CU: 252 profiles, 129 pending, 113 blocked, 0 in progress, 10 evidence-verified M2; 157 manifests / 135 explicit definitions.
- Next country: Curaçao (`CW`). No second country was started.

## CW - Curaçao

- Status: `blocked` / M2 unmet.
- Attempt: 1 at `2026-08-31T22:53:09.194Z`; completed `2026-08-31T23:15:36.8554694Z`.
- Definition: `M2_current_cpost_curacao_postcode_assignment_and_area_visualization`.
- Evidence: `reports/postal-context-m2/cw-source-review-2026-09-01.json` (`sha256:378cb59069f9bd466da025d489be4507cd183c12aa3a0e44ddaf1b1ad57a67ea`).
- Checks: `reports/postal-context-m2/cw-checks-2026-09-01.json` (`sha256:b20daed0c0bc656253c09c49404c21b17e8b56adf237ceb021bf7cba960fe52e`).
- Country report: `docs/postal-context-curacao-m2.md` (`sha256:580e6359e5014a9c93747a6e4acd0ff3129f661c482baf82623a5775cb250daa`).
- Exact receipts: four Cpost/UPU bodies / 926,717 bytes, all fixed by byte count and SHA-256. Raw HTML, PDFs, extracted text, rendered pages and temporary inspection output remain outside Git.
- Postal status and correction: the UPU September 2025 list includes Curaçao among countries and territories not requiring postal codes. Current Cpost pages publish address delivery, postal boxes and registered-mail pickup but no code table. The unsupported CW four-digit JSON/YAML/hierarchy metadata was corrected to `None` with null regex/API/rule; no replacement code was invented.
- Identity and authority: the May 2015 UPU sheet preserves CUW for Curaçao and identifies Cpost International N.V. as designated operator. CW remains separate from AW, SX, BQ, the former Netherlands Antilles and NL.
- Rights and geometry: Cpost asserts 2026 copyright and the four bodies publish no open postal dataset licence. There are 0 official/derived/virtual postal Polygon/MultiPolygon records. No island, district, locality, address, route, service area, postal box, building, Point, buffer, hull, cell, model, synthetic code or AGID proxy was promoted.
- Application: shared normalization/no-match, Polygon/MultiPolygon-only draw, map fit, opacity-0.22 translucent fill, visible outline, non-area rejection, clear and re-search contracts pass. With no valid CW postcode input or eligible real artifact, real CW API/search-to-map visualization and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 5/5, CW address metadata 2/2, shared area runtime 29/29, rollout invariants 8/8, CW ledger 5/5, focused TypeScript 1/1 and changed syntax/JSON/YAML checks 11/11 pass (62 recorded checks, 0 failures). Repository-wide address common/YAML tests retain unrelated pre-existing KM duplicate-source and EH/HM missing-YAML failures.
- Retry: not before `2026-09-07T22:53:09.194Z` and only after all pending countries have been swept. Provider contact, registration, authentication, terms/licence/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After CW: 252 profiles, 128 pending, 114 blocked, 0 in progress, 10 evidence-verified M2; 158 manifests / 136 explicit definitions.
- Next country: Dominica (`DM`). No second country was started.

## DM - Dominica

- Status: `blocked` / M2 unmet.
- Attempt: 1 at `2026-08-31T23:25:39.859Z`; completed `2026-08-31T23:47:56.1446788Z`.
- Definition: `M2_current_dominica_postal_service_postcode_assignment_and_area_visualization`.
- Evidence: `reports/postal-context-m2/dm-source-review-2026-09-01.json` (`sha256:ac0a3f9b42239f3e0be6c62838355f071964ad917f4938adbd4fc75d68fa09da`).
- Checks: `reports/postal-context-m2/dm-checks-2026-09-01.json` (`sha256:b926c4ea7b040ce45f72a4cd9b373f0e8b967d880bdcf87834cd09839eda128e`).
- Country report: `docs/postal-context-dominica-m2.md`.
- Exact receipts: six Dominica government and UPU bodies / 1,455,690 bytes, all fixed by byte count and SHA-256. Raw HTML, PDFs, extracted text, rendered pages, addresses and temporary inspection output remain outside Git.
- Postal status and correction: the UPU September 2025 list includes Dominica among countries and territories not requiring postal codes. The July 2002 UPU sheet shows a Roseau address without a postcode; current government/UPU operator pages list the General Post Office, branches, Parcel Post and Dominica Postal Service without a code table. DM JSON/YAML/hierarchy now use `None`, null regex/API/rule and no unsupported postcode field/token/order.
- Rights: the Dominica government limits copying to unaltered personal non-commercial use and prohibits transmission/distribution without prior written permission. UPU material has copyright/database restrictions. Compatible AGID processing, derivation, redistribution and public-serving rights were not established.
- Identity, geometry and draft-pack boundary: DM remains distinct from Dominican Republic DO; no five-digit DO code or geometry was borrowed. There are 0 official/derived/virtual postal Polygon/MultiPolygon records. The draft DM pack's 48 locality fixtures, 246 planning cells, three test vectors, AGID values and synthetic code seeds were not promoted. No island, parish, district, locality, address, office, route, service area, parcel, building, Point, buffer, hull, cell, model or AGID proxy was promoted.
- Application: shared normalization/no-match, Polygon/MultiPolygon-only draw, map fit, opacity-0.22 translucent fill, visible outline, non-area rejection, clear and re-search contracts pass. With no valid DM postcode input or eligible real artifact, real DM API/search-to-map visualization and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 5/5, DM address metadata 2/2, common address contracts 68/68, shared area runtime 29/29, rollout invariants 8/8, DM ledger 6/6, focused TypeScript 1/1 and changed syntax/JSON/YAML checks 12/12 pass (132 recorded checks, 0 failures).
- PDF review: the Dominica sheet and no-postcode page rendered to non-empty 992x1404 and 993x1404 RGB PNGs with fixed SHA-256. The local image-view helper returned Windows error 206 through original and short paths, so interactive display is not claimed; no image was committed.
- Retry: not before `2026-09-07T23:25:39.859Z` and only after all pending countries have been swept. Provider contact, registration, authentication, terms/licence/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After DM: 252 profiles, 127 pending, 115 blocked, 0 in progress, 10 evidence-verified M2; 159 manifests / 137 explicit definitions.
- Next country: Dominican Republic (`DO`). No second country was started.

## DO - Dominican Republic

- Status: `blocked` / M2 unmet.
- Attempt: 1 at `2026-08-31T23:54:10.401Z`; completed `2026-09-01T00:26:00.9862659Z`.
- Definition: `M2_current_inposdom_assignment_and_postal_area_visualization`.
- Evidence: `reports/postal-context-m2/do-source-review-2026-09-01.json` (`sha256:e523912c2c08c75a574408eabf8761b6ebbb6b16637940484f40644ebf49f6d6`).
- Checks: `reports/postal-context-m2/do-checks-2026-09-01.json` (`sha256:1812373f192586c95c0af45509460834d415b0c13f4f0966375595542e8175d7`).
- Country report: `docs/postal-context-dominican-republic-m2.md`.
- Exact receipts: twelve INPOSDOM, UPU and datos.gob.do bodies / 2,524,052 bytes, all fixed by byte count and SHA-256. Raw HTML, JavaScript, JSON, GeoJSON, PDFs, postcode rows, coordinates, polygon responses, renders and temporary output remain outside Git.
- Index quality: the public client loads 1,403 rows: 1,401 valid rows, 528 unique five-digit codes, two invalid values, no missing coordinates and 29 exact duplicate groups. Its Last-Modified date is 2021-04-16 and it publishes no current release/version, validity, alias, supersession, exception or object-class contract.
- Polygon observations: fixed official-example probes 10100, 10101 and 11903 have six valid Polygon features, six closed rings and 11,465 vertices. They publish only `zipcode`, with no complete-coverage proof, immutable edition, producer lineage, official/derived/virtual class, reference date, CRS, method, confidence or exception model.
- Rights and current data: INPOSDOM terms protect portal content, compilations and programs without explicit bulk processing, derivation, redistribution or public-serving permission. The complete UPU 2026.1 database requires contract, NDA, data-use declaration and rates. The government portal's four INPOSDOM datasets do not include postcode assignments or polygons. No provider contact, registration, contract/NDA/terms acceptance, payment or bulk crawl was attempted.
- Authority boundary: 0 records are production-eligible. No province, National District, municipality, district, section, paraje, barrio, sector, locality, address, office, route, P.O. box, parcel, building, Point, buffer, hull, Voronoi/raster cell, AGID cell, interpolation/model surface or synthetic `99999` fixture was promoted.
- Application: the official client can search, show candidates/no-match, fetch real polygons, fit and render 18% fill with a 2-pixel outline, but it lacks required failure/invalid-geometry distinctions and provenance metadata. Shared AGID normalization, API and Polygon/MultiPolygon draw/fit/fill/outline/clear/re-search contracts pass; without an approved immutable artifact, real DO AGID API/app visualization and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 7/7, DO country/runtime/source contracts 139/139, shared area runtime 29/29, rollout invariants 8/8, DO ledger 7/7, focused TypeScript 1/1 and changed syntax/JSON checks 13/13 pass (205 recorded checks, 0 failures).
- PDF review: the DO sheet and two relevant General Addressing Issues pages rendered to non-empty 992x1404, 993x1404 and 993x1404 RGB PNGs with fixed SHA-256. The local image-view helper returned Windows error 206 through original and short paths, so interactive display is not claimed; no image was committed.
- Retry: not before `2026-09-07T23:54:10.401Z` and only after all pending countries have been swept. Provider contact, registration, authentication, terms/contract/NDA/data-use acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After DO: 252 profiles, 126 pending, 116 blocked, 0 in progress, 10 evidence-verified M2; 159 manifests / 138 explicit definitions.
- Next country: Ecuador (`EC`). No second country was started.

## EC - Ecuador

- Status: `blocked` / M2 unmet.
- Attempt: 1 at `2026-09-01T00:34:11.103Z`; completed `2026-09-01T01:00:43.9865049Z`.
- Definition: `M2_current_mintel_assignment_and_postal_area_visualization`.
- Evidence: `reports/postal-context-m2/ec-source-review-2026-09-01.json` (`sha256:ee9fb31db052b0dd574822b298b46c48d3954171e610d6c72dff5c585cbebbb6`).
- Checks: `reports/postal-context-m2/ec-checks-2026-09-01.json` (`sha256:8fe2c771a0f7bc34006b6059e25a4843ab65ab9823387297937e7d8347ec127d`).
- Country report: `docs/postal-context-ecuador-m2.md`.
- Exact receipts: nine official Ecuador bodies / 667,199 bytes, all fixed by byte count and SHA-256. Raw HTML, JavaScript, JSON, PDFs, postcode rows, coordinates, WKT, renders and temporary output remain outside Git.
- Official lookup: the official example `180204` returns one valid closed MultiPolygon with 227 coordinate pairs; the official client uses the same-origin PHP endpoint, draws it and fits the map. The response lacks a release, validity, alias/supersession, object class, producer lineage, edition, reference date, CRS, method, confidence and exception model, and one probe does not prove complete coverage.
- Semantics and currentness: the vigente 2015 standard defines six digits as province, planning district and postal zone. Its 1,225-zone statement is historical, not a current denominator, because the standard expressly permits changes after geographic or demographic updates.
- Rights and access: ARCP Resolution 2020-26 declares national postcode lists, thematic maps and vector postal polygons public, but requires interested natural or legal persons to accept an annexed use agreement and satisfy protected-download safeguards. The fixed five-page resolution omits Annex 1. No agreement was reviewed or accepted, and no provider contact, registration, authentication, protected download or payment was attempted.
- Authority boundary: 0 records are production-eligible. No province, planning district, circuit, parish, census sector, locality, address, office, route, P.O. box, organization, parcel, building, Point, buffer, hull, Voronoi/raster cell, AGID cell, interpolation/model surface or synthetic `999999` fixture was promoted.
- Application: the official client proves a live search-to-area fit/draw path, while shared AGID normalization, API, Polygon/MultiPolygon draw/fit, translucent fill, clear outline, clear/re-search and failure contracts pass. Without an approved immutable artifact, real EC AGID API/app visualization, browser E2E and a separate data app are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 6/6, EC country/runtime/source contracts 139/139, shared area runtime 29/29, rollout invariants 8/8, EC ledger 7/7, focused TypeScript 1/1 and changed syntax/JSON checks 10/10 pass (201 recorded checks, 0 failures).
- PDF review: technical-standard pages 4, 5 and 11 and resolution pages 4 and 5 rendered to non-empty RGB PNGs with fixed SHA-256. The local image-view helper returned Windows error 206 through original and short paths, so interactive display is not claimed; no image was committed.
- Retry: not before `2026-09-08T00:34:11.103Z` and only after all pending countries have been swept. Provider contact, registration, authentication, use-agreement/contract acceptance, protected download, payment, destination creation, publication or deployment requires explicit approval.
- After EC: 252 profiles, 125 pending, 117 blocked, 0 in progress, 10 evidence-verified M2; 159 manifests / 139 explicit definitions.
- Next country: Falkland Islands (`FK`). No second country was started.

## FK - Falkland Islands

- Status: `m2_verified` / M2 achieved.
- Attempt: 1 at `2026-09-01T01:11:41.684Z`.
- Definition: `M2_current_upu_fiqq_whole_territory_derived_visualization`.
- Evidence: `reports/postal-context-m2/fk-current-whole-territory-2026-09-01.json` (`sha256:3ae0be3dfcec6b0004aca3f70b40274d438328246f98bc26e726920c17ca7e75`).
- Checks: `reports/postal-context-m2/fk-validation-2026-09-01.json` (`sha256:cf46fb861a990a6246abc8f3ce6204bd5631b12a98df390dd4c2ac1bbf9b1291`).
- Country report: `docs/postal-context-falkland-islands-m2.md` (`sha256:b9c0a8a0226fddcf6b93694b912b96d61c102b8118188a99ba1adc6d8ada494d`).
- Official assignment: the country-specific UPU sheet states that `FIQQ 1ZZ` is the single postcode for the whole territory. The August 2026 general table's `F1QQ 1ZZ` glyph is preserved as a source exception and rejected; current Falkland Islands Government and GOV.UK office pages corroborate `FIQQ 1ZZ`.
- Real display geometry: fixed geoBoundaries commit `9469f09592ced973a3448cf66b6100b741b64c0d`, boundary `FLK-ADM0-20895774`, boundary year 2021, CC BY 4.0. The reproducible transform preserves all 394 source outer rings and 13,250 outer positions, omits 488 land-cover water-exclusion rings / 2,944 positions because the code covers the whole territory, and partitions the result into two independently valid derived MultiPolygons. The documented filled interior area is 114.45298678976631 km².
- Authority: UPU assignment is official but has no geometry authority. Geometry is explicitly `derived`, confidence `0.90`, and is not an official postal, legal, survey, cadastral or delivery boundary. No address, building, parcel, recipient, customer or land-rights data is published; FK identity remains separate.
- Application: `FIQQ1ZZ` and full-width `ＦＩＱＱ １ＺＺ` normalize to `FIQQ 1ZZ`; the real descriptor flows through the shared runtime and Express API to two MultiPolygons, multiple-result state, union-bounds fit, opacity-0.22 fill, opacity-0.95/width-3 outline, source/date/confidence metadata, clear and re-search. `F1QQ 1ZZ` and invalid codes return no fabricated area. Deterministic route-to-map verification substitutes for browser E2E.
- Validation: FK country/topology/API/app 16/16, shared runtime 162/162, shared area UI 5/5, TypeScript and diff checks all pass; a second isolated build reproduced descriptor, graph and geometry digests (185 recorded passes, 0 failures).
- Published artifact commit: `59799057a8dfee4bc943a83c28c561b0e0374ce6` on `codex/postal-context-m2-rollout`.
- After FK: 252 profiles, 124 pending, 117 blocked, 0 in progress, 11 evidence-verified M2; 160 manifests / 140 explicit definitions.
- Next country: Grenada (`GD`). No second country was started.

## GD - Grenada

- Status: `blocked` / M2 unmet.
- Attempt: 1 at `2026-09-01T02:05:43.142Z`; completed `2026-09-01T02:34:01.3606649Z`.
- Definition: `M2_current_grenada_postal_corporation_postcode_assignment_and_area_visualization`.
- Evidence: `reports/postal-context-m2/gd-source-review-2026-09-01.json` (`sha256:e8598290e35e565fbf5a02ff2cc15af0b3d339269ab7c136014375b4344b33fe`).
- Checks: `reports/postal-context-m2/gd-checks-2026-09-01.json` (`sha256:1e416ef833becc06ea26f44c6ac9dba0d31d45b730d94e01ca9dede106ef38ab`).
- Published evidence commit: `6ddfca0b8aa033ca76f67b69f6e222cb9f51066f`; both pinned GitHub bodies were retrieved through the authenticated API and matched local SHA-256.
- Country report: `docs/postal-context-grenada-m2.md`.
- Exact receipts: six GPC, Government of Grenada and UPU bodies / 1,195,959 bytes, all fixed by byte count and SHA-256. Raw HTML, PDFs, extracted text, rendered pages, addresses and temporary inspection output remain outside Git.
- Postal status and correction: the UPU September 2025 list includes Grenada among countries and territories not requiring postal codes. The May 2004 UPU sheet has three postcode-free village/P.O. Box/municipality examples and records `WEST INDIES` as optional wording, not a code. Current GPC/government pages list the operator, ten GPC locations, 52 postal stations and six sub-offices without a code table. GD JSON/YAML/hierarchy now use `None`, null regex/API/rule and no unsupported postcode field/token/order.
- Rights: GPC pages state all rights reserved, the government page is copyright-marked, and UPU material has copyright/database restrictions. Compatible AGID processing, derivation, redistribution and public-serving rights for a postal dataset were not established.
- Identity, geometry and draft-pack boundary: GD and source-described Grenada, Carriacou and Petite Martinique identities remain unchanged. There are 0 official/derived/virtual postal Polygon/MultiPolygon records. The draft GD pack's 48 locality fixtures, 246 planning cells, three test vectors and synthetic code seeds were not promoted. No country, island, parish, district, locality, address, office, route, service area, parcel, building, Point, buffer, hull, cell, model, airport code or AGID proxy was promoted.
- Application: shared normalization/no-match, Polygon/MultiPolygon-only draw, map fit, opacity-0.22 translucent fill, visible outline, non-area rejection, clear and re-search contracts pass. With no valid GD postcode input or eligible real artifact, real GD API/search-to-map visualization and browser E2E are not claimed.
- Validation: exact-source inspection 1/1, source-inspector unit tests 5/5, common address contracts 68/68, shared area runtime 29/29, rollout invariants 8/8, GD address sync 2/2, GD ledger 7/7, focused TypeScript 1/1 and changed syntax/JSON/YAML checks 9/9 pass (130 recorded checks, 0 failures).
- PDF review: the Grenada sheet and no-postcode page rendered to non-empty 993x1404 RGB PNGs with fixed SHA-256. The local image-view helper returned Windows error 206 through original and short paths, so interactive display is not claimed; no image was committed.
- Retry: not before `2026-09-08T02:05:43.142Z` and only after all pending countries have been swept. Provider contact, registration, authentication, terms/licence/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After GD: 252 profiles, 123 pending, 118 blocked, 0 in progress, 11 evidence-verified M2; 161 manifests / 141 explicit definitions.
- Next country: French Guiana (`GF`). No second country was started.

## GF - French Guiana

- Result: `m2_verified` / `M2_current_laposte_all_postcodes_derived_commune_visualization` at `2026-09-01T02:54:50.355Z`.
- Official assignment denominator: the complete 39,192-row La Poste snapshot has exactly 25 distinct `973` postcode rows mapped to 22 distinct INSEE communes. The snapshot is the 2026-08-08 data update under Etalab Open Licence 2.0; all metadata, licence, documentation and source bodies remain outside Git and are fixed by 32 byte-count/SHA-256 receipts totalling 6,473,543 bytes.
- Geometry and authority: the fixed 22-feature department response and all 25 exact `geo.api.gouv.fr` postcode queries agree by commune identity and coordinates. The published 17 Polygon and eight MultiPolygon responses are unmodified commune contours with `derived` provenance and confidence `0.90`, never official postal, legal, cadastral or delivery boundaries.
- Shared-surface exception: `97311/97352` share Roura, `97318/97360` share Mana and `97353/97390` share Régina. Each code remains a separate postal node while the full commune surface is intentionally identical; no sub-commune perimeter is inferred.
- Geometry validation: 73 closed rings and 118,559 published positions pass finite-range, Turf and JSTS validity gates. The largest API response has 11,375 positions, below the 20,000-position gate. An independent second build reproduced descriptor, graph and geometry SHA-256 exactly.
- App path: real API lookup normalizes `９７３ ００` to `97300`, returns its real derived MultiPolygon and provenance, calculates exact fit bounds, renders opacity-`0.22` fill plus opacity-`0.95`/width-`3` outline, clears and re-searches `97370`. `97399` is `no_match`; `973-00`, cross-country `75001` and invalid geometry yield no fabricated area. Shared UI tests retain loading, multiple, API-failure and invalid-geometry states and expose selected code, type, class, source date and confidence.
- Authority/privacy: official postal assignment, official administrative geometry and derived display publication remain separate. No address, building, parcel, recipient, customer, deliverability or land-right row is bundled. GF identity and department code `973` remain unchanged.
- Verification: GF suite `10/10`, shared graph/runtime/schema/topology/UI/service/store plus France regressions `75/75`, repository-wide TypeScript, JSON/diff/raw-source audits and deterministic rebuild all passed (`86` checks, `0` failed).
- Evidence commit: `410ce010d5e996adc2535c6f6e0e5a352122704c`; descriptor `sha256:d225a9de69e70e80ce487be5b90c5ce69aa2ddf9c045944d946e95c135cb404c`, graph `sha256:1aff3293404e6ab813c14b83593a4b4f461ee6a062060dd6aef44c2716098db8`, geometry `sha256:4947e12fc0a4f90b4d157c34b21e2da4ae8b22d999c64e4df963ef4943c9915b`.
- Reports: `reports/postal-context-m2/gf-current-postcodes-2026-09-01.json`, `reports/postal-context-m2/gf-validation-2026-09-01.json`, and `docs/postal-context-french-guiana-m2.md`.
- Next country: Greenland (`GL`). No second country was started.

## GL - Greenland

- Status: `blocked` / M2 unmet.
- Attempt: 1 at `2026-09-01T03:30:45.800Z`; completed `2026-09-01T03:52:05.6869258Z`.
- Definition: `M2_current_greenland_address_register_postcode_polygon_visualization`.
- Evidence: `reports/postal-context-m2/gl-source-review-2026-09-01.json` (`sha256:40c199aaaff32294e0d0ee4796a98660cf093b0bd559f70326b5e4ec21925354`).
- Checks: `reports/postal-context-m2/gl-checks-2026-09-01.json` (`sha256:094a2e0c28d2ebba6b83e4ed5bbf4a4449e249e5c9b31c50a7151146bd5938a0`).
- Published evidence commit: `468b04419c8724026b3a96de3ce0490250172604`; both pinned GitHub bodies were fetched from the cumulative branch and matched local SHA-256.
- Country report: `docs/postal-context-greenland-m2.md`.
- Exact receipts: five Tusass and Government of Greenland/NunaGIS bodies / 363,762 bytes, all fixed by byte count and SHA-256. Raw HTML, JSON, GeoJSON, postcode rows and temporary inspection output remain outside Git.
- Current denominator: the complete public Address Register `Postnummer` query returned 32 records for 31 distinct four-digit codes. Tusass provides 28 coded and 44 dash-valued locality rows and omits register values 3940, 3972 and 3982, so the public register controls this observation.
- Geometry: 30 features contain real closed Turf-valid Polygon geometry with 38 rings and 3,902 positions. The only 2412 feature, OBJECTID 42399, is empty. Empty 3992 OBJECTID 42400 is rejected while separate OBJECTID 42369 is valid. No missing surface was fabricated.
- Rights and currentness: NunaGIS states the services are publicly available and connectable to GIS, but the reviewed pages and service metadata publish no explicit permission for AGID storage, derivation, redistribution or public serving. Empty `copyrightText` is not treated as a licence. Source date fields are null and no fixed release/reference date is published.
- Authority boundary: 0 records and 0 artifacts are production-eligible. No municipality, locality, place-name, address point, building, route, Point, buffer, hull, Voronoi/raster cell, AGID cell or model surface was promoted. GL and Greenland/Kalaallit Nunaat identity remain separate from Denmark, the Faroe Islands, Canada and other Arctic jurisdictions.
- Application: the shared normalization, Polygon/MultiPolygon-only draw, map fit, translucent fill, visible outline, invalid-geometry rejection, clear and re-search contracts pass. Without an approved immutable artifact, real GL API/search-to-map visualization and browser E2E are not claimed.
- Validation: fixed-source validation 1/1, shared area runtime 29/29, rollout invariants 8/8, cumulative M2 verification 31/31, TypeScript 1/1 and changed syntax/JSON/diff 1/1 pass (71 recorded checks, 0 failures). GL ledger assertions pass separately after this ledger update.
- Retry: not before `2026-09-08T03:30:45.800Z` and only after all pending countries have been swept. Provider contact, registration, authentication, terms/licence/permission/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After GL: 252 profiles, 121 pending, 119 blocked, 0 in progress, 12 evidence-verified M2; 163 manifests / 143 explicit definitions.
- Next country: Guadeloupe (`GP`). No second country was started.

## GP - Guadeloupe

- Result: `m2_verified` / `M2_current_laposte_all_postcodes_derived_commune_visualization` at `2026-09-01T04:04:46.227Z`.
- Official assignment denominator: the complete 39,192-row La Poste snapshot has 38 GP rows, 33 distinct postal codes and 32 distinct INSEE 971xx communes. The snapshot is the 2026-08-08 data update under Etalab Open Licence 2.0; all metadata, licence, documentation and source bodies remain outside Git and are fixed by 40 byte-count/SHA-256 receipts totalling 3,663,819 bytes.
- Identity and exceptions: postal prefix alone does not assign territory. BL `97133/97701` and MF `97150/97801` remain excluded. `97139/97142` share Les Abymes; `97125`, `97130`, `97131` and `97180` have multiple Ligne 5 rows but stay one postal identity and one whole-commune surface.
- Geometry and authority: the fixed 32-feature department response and all 33 exact `geo.api.gouv.fr` GP postcode queries agree by commune identity and coordinates. The published 21 Polygon and 12 MultiPolygon responses are unmodified commune contours with `derived` provenance and confidence `0.90`, never official postal, legal, cadastral or delivery boundaries.
- Geometry validation: 67 closed rings and 41,291 published positions pass finite-range, Turf and JSTS validity gates. The largest API response has 2,446 positions, below the 20,000-position gate. An independent second build reproduced descriptor, graph and geometry SHA-256 exactly.
- App path: real API lookup normalizes `９７１ １０` to `97110`, returns its real derived MultiPolygon and provenance, calculates exact fit bounds, renders opacity-`0.22` fill plus opacity-`0.95`/width-`3` outline, clears and re-searches `97190`. `97199` is `no_match`; `971-00`, cross-country `97300`, BL `97133`, MF `97150` and invalid geometry yield no fabricated area. Shared UI tests retain loading, multiple, API-failure and invalid-geometry states and expose selected code, type, class, source date and confidence.
- Authority/privacy: official postal assignment, official administrative geometry and derived display publication remain separate. No address, building, parcel, recipient, customer, deliverability or land-right row is bundled. GP, BL and MF identities remain unchanged.
- Verification: GP suite `9/9`, shared graph/runtime/schema/topology/normalization/service/store plus France regressions `162/162`, postal-area UI/map `5/5`, repository-wide TypeScript, JSON/diff/raw-source audits and deterministic rebuild all passed (`177` checks, `0` failed).
- Evidence commit: `d175a8afe9ac4cb319c19fa6053f2358df1efdc4`; descriptor `sha256:2cb4b29c35dfbf4daeb085f3d85fc3a7f82111a898bdc52d206961c693b8d0d8`, graph `sha256:6498e3deaff95420ebae23f44449835757ed104b744c6f5664f6030ea9b561d5`, geometry `sha256:bfaa43b5d2d513dab824f6c08103a96c36c4011fd23e43ad73d0a9ef1c11d7c8`.
- Reports: `reports/postal-context-m2/gp-current-postcodes-2026-09-01.json`, `reports/postal-context-m2/gp-validation-2026-09-01.json`, and `docs/postal-context-guadeloupe-m2.md`.
- After GP: 252 profiles, 120 pending, 119 blocked, 0 in progress, 13 evidence-verified M2; 164 manifests / 144 explicit definitions.
- Next country: South Georgia and the South Sandwich Islands (`GS`). No second country was started.

## GS - South Georgia and the South Sandwich Islands

- Result: `m2_verified` / `M2_current_upu_siqq_whole_territory_derived_visualization` at `2026-09-01T06:02:56.595Z`.
- Official assignment: the August 2026 Universal POST*CODE table and the GS country sheet establish `SIQQ 1ZZ` as the single postcode for the whole territory. UPU bytes are not redistributed; exact URLs, editions, retrieval time and SHA-256 evidence are retained.
- Real geometry and rights: fixed BAS Sub-Antarctic coastline edition 1.0 explicitly sources South Georgia and the South Sandwich Islands from South Georgia GIS under CC BY 4.0. The exact `source='South Georgia GIS'` filter keeps 357 Polygon features; EPSG:3031-to-4326 reprojection preserves 357 rings and 90,610 positions without rounding or simplification, then the natural -30 longitude gap yields two independently valid derived MultiPolygons.
- Authority/privacy: UPU assignment has geometry authority `none`; displayed coastline surfaces are `derived`, confidence `0.90`, and never official postal, legal, survey, cadastral or delivery boundaries. No address, building, parcel, recipient, customer, deliverability or land-right data is published; GS identity remains distinct.
- Application: the real local API normalized full-width and compact/lowercase input to `SIQQ 1ZZ` and returned two MultiPolygons twice with HTTP 200. The running app fit both territory groups, rendered opacity-`0.22` fill and opacity-`0.95`/width-`3` outline over a visible Natural Earth background, displayed code/type/derived/source/date/confidence, cleared and re-searched successfully. Wrong, unknown and invalid geometry inputs produce no fabricated area.
- Browser evidence: in-app Browser setup failed before navigation because of a Windows deny-read ACL error and is not claimed. Bundled Chromium 151.0.7922.34 was used against the running app; only place search and the background style were controlled, never the Postal Context API. Both fixed screenshots were visually inspected. The clear/re-search comparison removed 5,110 and restored 5,116 blue canvas pixels.
- Shared app correction: visual verification exposed a style-load race. Postal layers now attempt immediate synchronization and retry on `styledata`/`idle` only when MapLibre is not ready; the delayed-style case has a regression test.
- Verification: focused GS/API/normalization/store/UI suite `19/19`, shared runtime `162/162`, TypeScript, JSON/diff audit and independent byte-identical rebuild all pass. The fixed browser report records two real Postal API 200 responses, fit, clear, re-search and visual results.
- Evidence commit: `0953cdeb51f02228dd4acb6c2378badca7b886dd`; descriptor `sha256:4dc30a194c8bb145a4beeb4b67f7a6757aa04de6c8a4d577ed1537fb136e7ceb`, graph `sha256:f6301f3da3fae3271ae78fb33ac076042e9ca4e73021c4e3cca19fc71eaee704`, geometry `sha256:226d55f0ce996092c1c03edd6b496230ac053486756ccef82f13d70c585b7ce4`.
- Reports: `reports/postal-context-m2/gs-current-whole-territory-2026-09-01.json`, `reports/postal-context-m2/gs-validation-2026-09-01.json`, `reports/postal-context-m2/gs-browser-visual-2026-09-01.json`, and `docs/postal-context-south-georgia-south-sandwich-islands-m2.md`.
- After GS: 252 profiles, 119 pending, 119 blocked, 0 in progress, 14 evidence-verified M2; 165 manifests / 145 explicit definitions.
- Next country: Guatemala (`GT`). No second country was started.

## GT - Guatemala

- Status: `blocked` / M2 unmet.
- Attempt: 1 at `2026-09-01T06:21:18.707Z`; completed `2026-09-01T06:48:25.7392111Z`.
- Definition: `M2_current_correos_guatemala_postcode_area_visualization`.
- Evidence: `reports/postal-context-m2/gt-source-review-2026-09-01.json` (`sha256:564e793e59b0e2b62f9d098d429f0d6b9d0cb3a20d93e66fe623db4b01e6aaa8`).
- Checks: `reports/postal-context-m2/gt-checks-2026-09-01.json` (`sha256:7a4e077d067d779be7be44b0323528bcdf9f4e807ba94bd01dc1fa5631dab0a0`).
- Published evidence commit: `8dc96ec82b404aa73b54f7c381db7210a0bd8dc5`; the remote branch SHA and both GitHub Contents API bodies were verified, with byte counts and SHA-256 matching the local reports.
- Country report: `docs/postal-context-guatemala-m2.md`.
- Current assignment denominator: the 2025-07-21 Correos page and all 22 linked department PDFs are fixed by byte count/SHA-256. Their 35 pages contain 560 occurrences / 544 unique five-digit codes across prefixes 01-22, mixing department, municipality, Guatemala City zone and named-locality objects. The November 2025 UPU sheet confirms five digits and department/route/delivery-office semantics.
- Rights and geometry: the Correos tables publish no Polygon/MultiPolygon and no compatible data licence. SEGEPLAN free access is not a dataset-specific postal reuse grant; the INE CC Attribution populated-place resource is centroid points, not Correos postal geometry. Zero official/derived/virtual postal areas and zero production records were promoted.
- Running app: the isolated app started at `http://127.0.0.1:3000/`. In-app Browser setup failed before navigation because Windows deny-read ACL setup failed, so Playwright Chromium was used and visually inspected. Searching `GT 01001` and selecting Guatemala City showed the place/background map and an ordinary red AGID cell, but no translucent postal area, postal outline, source/date/confidence metadata or unavailable notice. Direct `GET /api/v1/postal/GT/01001?geometry=geojson` returned HTTP 503 `Postal Context pack is unavailable`. The AGID cell was not relabelled as postal geometry.
- Verification: fixed-source inspection 1/1, source-inspector units 4/4, GT metadata/runtime 139/139, shared postal-area UI 6/6, shared runtime/API/service 39/39, rollout 8/8, root TypeScript 1/1, running API and browser checks 2/2 pass (200 recorded checks, 0 failures). Existing GT synthetic fixtures remain M1 test material only.
- Retry: not before `2026-09-08T06:21:18.707Z` and only after pending countries have been swept. Provider contact, registration, authentication, terms/licence/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After GT: 252 profiles, 118 pending, 120 blocked, 0 in progress, 14 evidence-verified M2; 165 manifests / 146 explicit definitions.
- Next country: Guyana (`GY`). No second country was started.

## GY - Guyana

- Status: `blocked` / M2 unmet; the inaccurate no-postcode placeholder was replaced by current seven-digit metadata and a country-specific M2 definition.
- Attempt: 1 at `2026-09-01T07:07:19.468Z`; completed `2026-09-01T07:43:37.8103352Z`.
- Evidence: `reports/postal-context-m2/gy-source-review-2026-09-01.json` (`sha256:588a57d45a8e8ab97dc45b810c844557cd79ea64fad0f001ffa6e70f9554ed6c`); checks `reports/postal-context-m2/gy-checks-2026-09-01.json` (`sha256:416b26de3b37ca762b2c55f37a611f7aff0e582bda8c2f3ac540468b78c5ead3`).
- Published evidence commit: `c2d7c2d873ab8f25fbb304d08ed20a3549c53137`.
- Current denominator: 14 exact bodies / 3,938,769 bytes; current GPOC finder has 2,272 rows, 214 valid seven-digit codes across ten regions, one six-digit anomaly `120101`, 23 localities, 239 sub-localities, 1,910 streets, 64 post offices and three exact duplicates. No geometry field exists.
- Semantics/exceptions: GPOC and UPU digit meanings stay source-specific. UPU edition `08/2025` confirms seven digits but includes six-digit P.O. Box example `413018`; neither exception is padded or made into an area.
- Rights/geometry: no applicable GPOC open-data/public-serving licence was located. UPU complete data requires contract, NDA, data-use declaration and annual fees. Guyana GeoPortal public APIs returned zero resources; the Bureau open licence does not license GPOC/UPU or supply a postcode crosswalk. Zero official/derived/virtual postal areas and zero production records were promoted.
- Running app: the isolated app ran at `http://127.0.0.1:3011/`. In-app Browser setup failed before navigation due Windows deny-read ACL setup; Playwright Chromium entered `GY 4130106`, recorded twelve unrelated place results and auto-selected Kazakhstan. The fixed screenshot was displayed and visually inspected. No GY Postal Context request, unavailable notice, translucent postal fill, outline or provenance appeared. Direct GY API returned 404 `Postal Context country is not supported`; the background map and AGID cell were not promoted.
- Verification: fixed-source inspection 1/1, inspector units 3/3, address-format metadata 68/68, shared postal runtime/API/service/UI 45/45, rollout 8/8, TypeScript 1/1, real app API and visual checks 2/2 pass (128 recorded, 0 failed).
- Retry: not before `2026-12-01T07:07:19.468Z` and only after pending countries have been swept. Provider contact, registration, authentication, terms/licence/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After GY: 252 profiles, 117 pending, 121 blocked, 0 in progress, 14 evidence-verified M2; 166 manifests / 147 explicit definitions.
- Next country: Honduras (`HN`). No second country was started.

## HN - Honduras

- Status: `blocked` / M2 unmet; the current five-digit system is recorded while the six-character `05/2004` UPU sheet remains explicit legacy evidence.
- Attempt: 1 at `2026-09-01T07:52:20.335Z`; completed `2026-09-01T08:23:17.5686267Z`.
- Definition: `M2_current_honducor_honduras_five_digit_postcode_area_visualization`.
- Evidence: `reports/postal-context-m2/hn-source-review-2026-09-01.json` (`sha256:b9683364a79d2d21f36285d657a6d91186ed0ebce9b7e4368c71a98728bee883`); checks `reports/postal-context-m2/hn-checks-2026-09-01.json` (`sha256:8bee871e90555f06c53a959cb1e1a01d605f7c303b9f38bb7b881ae32acc625c`).
- Published evidence commit: `d223f3cc4750bca910569c094cf5093dcdee8dc7`.
- Current/legacy semantics: August 2026 UPU tables list Honduras among countries requiring postcodes, length five, format `99999`, numeric. The country sheet is edition `05/2004`, says six alphanumeric characters and shows `CM1102`; it was not rewritten as current data.
- Operator and denominator: current HONDUCOR pages, EMS guidance, FAQ, agency map and February 2024 manual version 1.1 establish operator/service context but no complete current postcode assignment or area release. The official site search returned eleven broad postcode results and no applicable public data licence.
- Geometry and rights: the fixed SINIT catalogue contains 1,034 layers and zero postal/correo/HONDUCOR matches. Administrative, settlement, lot, block, parcel and agency proxies were not promoted. UPU complete data requires contract, NDA, declaration and annual fees and is not postal geometry. Zero official/derived/virtual postal areas and zero production records were promoted.
- Running app: the isolated app ran at `http://127.0.0.1:3012/`. In-app Browser setup failed before navigation due Windows deny-read ACL setup; Playwright Chromium entered `HN 11101`, observed eleven results including two Honduras candidates, selected Honduras and moved the map to Tegucigalpa. The fixed screenshot was displayed and visually inspected. No HN Postal Context request, unavailable notice, translucent postal fill, outline or provenance appeared. Direct HN API returned 404 `Postal Context country is not supported`; the background map and AGID grid were not promoted.
- Verification: fixed-source inspection 1/1, inspector units 3/3, address-format metadata 68/68, shared postal runtime/API/service/UI 45/45, rollout 8/8, TypeScript 1/1, real app API and visual checks 2/2 pass (128 recorded, 0 failed).
- Retry: not before `2026-12-01T07:52:20.335Z` and only after pending countries have been swept. Provider contact, registration, authentication, terms/licence/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After HN: 252 profiles, 116 pending, 122 blocked, 0 in progress, 14 evidence-verified M2; 167 manifests / 148 explicit definitions.
- Next country: Haiti (`HT`). No second country was started.

## HT - Haiti

- Status: `blocked` / M2 unmet; current integral `HTNNNN` semantics are recorded without promoting examples or administrative geometry.
- Attempt: 1 at `2026-09-01T08:40:22.648Z`.
- Definition: `M2_current_office_des_postes_haiti_htnnnn_postal_area_visualization`.
- Evidence: `reports/postal-context-m2/ht-source-review-2026-09-01.json` (`sha256:0b3d0dc763c1ef2dc9b9acff32cba6a09621c292b1871ff3bf3a10a4db6005bf`); checks `reports/postal-context-m2/ht-checks-2026-09-01.json` (`sha256:b59ef720553cf4c13c2a5ba6cec467136a06f8a0fd2b94d1e7756a72c9b9102f`).
- Published evidence commit: `d0f1b7262ac625bf51dde0427e330fd51b42d74f`.
- Current semantics: the August 2026 UPU tables list Haiti among countries requiring postcodes, total length six, format `HT9999`, alphanumeric. The September 2017 country sheet says `HT` is integral even domestically and documents department/district/municipality/delivery-area digits and 42 district examples; examples were not promoted to a complete current denominator.
- Operator and rights: UPU identifies Office des Postes d'Haiti. The listed new domain did not resolve; the legacy postcode route returned 404. The active legacy WordPress site had 14 pages, three posts and zero postcode/licence/privacy/open-data search results. UPU complete data requires contract, NDA, declaration and annual fees and is not postal geometry. No compatible AGID data rights were established.
- Geometry: CNIGS documents national reference geodata and HaitiData/GeoNode, but the current open-data application says it is under improvement. IHSI's six-digit territorial code and 509-page administrative publication remain non-postal context. Zero official/derived/virtual postal areas and zero production records were promoted.
- Running app: the isolated app ran at `http://127.0.0.1:3013/`. In-app Browser setup failed before navigation due Windows deny-read ACL setup; Playwright Chromium entered `HT 6110` and returned 12 results including two Haiti candidates. Clicking Haiti retained the first Southern River, Australia result. The fixed screenshot was displayed and visually inspected. No HT Postal Context request, unavailable notice, translucent postal fill, outline or provenance appeared. Direct HT API returned 503 `Postal Context pack is unavailable`; the background map, AGID grid and AU card were not promoted.
- Verification: fixed-source inspection 1/1, inspector units 3/3, Haiti metadata/runtime/API 80/80, shared postal runtime/API/service/UI 45/45, rollout 8/8, TypeScript 1/1, syntax/diff audit 1/1, real app API and visual checks 2/2 pass (141 recorded, 0 failed). Four UPU PDF renders were displayed and visually reconciled.
- Retry: not before `2026-12-01T08:40:22.648Z` and only after pending countries have been swept. Provider contact, registration, authentication, terms/licence/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
- After HT: 252 profiles, 115 pending, 123 blocked, 0 in progress, 14 evidence-verified M2; 167 manifests / 149 explicit definitions.
- Next country: Jamaica (`JM`). No second country was started.

## JM - Jamaica

- Status: `blocked` / M2 unmet; postcode-data creation is excluded because current primary evidence establishes no Jamaica postcode system.
- Attempt: 1 at `2026-09-01T09:20:23.139Z`; completed `2026-09-01T09:56:30.000Z`.
- Definition: `M2_current_jamaica_post_postcode_assignment_and_area_visualization`.
- Evidence: `reports/postal-context-m2/jm-source-review-2026-09-01.json` (`sha256:20d428b863cf55357b90a3199a8a314e2efbacba6739a1a1790fc156a9ff0cf2`); checks `reports/postal-context-m2/jm-checks-2026-09-01.json` (`sha256:f329381165e8babb5b2e365423ea76f74ebd9485e93b82fa6e7fee8729e88397`).
- Current status: UPU September 2025 lists Jamaica among countries not requiring postal codes; the May 2021 Jamaica sheet states that Jamaica has no postcode system. Current Jamaica Post addresses use Kingston 2/4/14 sector suffixes, which remain typed address context and are not promoted to national postcodes.
- Rights and geometry: Jamaica Post states All Rights Reserved and UPU restricts reproduction/transmission/database use. Zero official/derived/virtual postal areas and zero production records were promoted; no island, parish, sector, locality, office, route, Point, buffer, cell or synthetic code became postal geometry.
- Running app: the isolated app returned HTTP 200 at `http://127.0.0.1:3014/`; real unmocked JM Postal API lookup returned 404 unsupported. In-app Browser failed before navigation on the Windows ACL sandbox. Playwright fallback used controlled place search only and real postal API, showed two map canvases but no successful place result, postal area, notice or provenance. Browser E2E and translucent-area visualization are not claimed.
- Verification: source inspection 1/1, inspector units 5/5, JM metadata 2/2, address formats 68/68, shared runtime 30/30, rollout 8/8, ledger 6/6, TypeScript and syntax/status checks pass (135 recorded, 0 failed).
- Retry: not before `2026-09-08T09:20:23.139Z` and only after pending countries have been swept, unless Jamaica Post or UPU announces a rights-cleared fixed postcode assignment and postal-area artifact.
- After JM: 252 profiles, 114 pending, 124 blocked, 0 in progress, 14 evidence-verified M2; 168 manifests / 150 explicit definitions.
- Next country: Saint Kitts and Nevis (`KN`). No second country was started.

## KN - Saint Kitts and Nevis

- Status: `blocked` / M2 unmet; the official integral `KN9999` system is confirmed and corrected in address metadata, but no postal area was fabricated.
- Attempt: 1 at `2026-09-01T10:04:53.864Z`; completed `2026-09-01T10:26:03.123Z`.
- Definition: `M2_current_skn_postal_assignments_and_delivery_district_area_visualization`.
- Evidence: `reports/postal-context-m2/kn-source-review-2026-09-01.json` (`sha256:b265181ea5f42cd7cca964ca8e6e3be5b85888331c076e5cd0926a36a022d540`); checks `reports/postal-context-m2/kn-checks-2026-09-01.json` (`sha256:678d7621bcf7baabfceb08d4107c298a45933be90b31556d8387cd680a00d1b2`).
- Current system: seven exact Government/SKNIS and UPU bodies / 1,176,198 bytes establish the `KN` prefix, two postal-zone digits, two delivery-district digits, official 2016-10-09 launch and December 2017 UPU address format. The dated Government article exposes 32 codes, including `KN7000`, fixed as a sorted code-set digest.
- Denominator and geometry: the article is not a current versioned complete assignment/alias/validity/correction/exception/non-area denominator. It supplies prose street/locality membership, not Polygon/MultiPolygon, feature identity, CRS, topology, method, class, confidence or exceptions. Zero official/derived/virtual postal areas and zero production records were promoted.
- Rights: the current Government site states All Rights Reserved and UPU restricts reproduction, transmission and database use. No compatible AGID processing, derivation, redistribution or public-serving permission was found.
- Running app: the isolated app returned HTTP 200 at `http://127.0.0.1:3015/`; real unmocked KN Postal API lookup returned 404 unsupported. In-app Browser failed before navigation on the Windows ACL sandbox. Playwright entered `KN0101 Saint Kitts and Nevis`, saw 12 generic results and two map canvases, but selected a Turkish consulate result, issued no KN postal request and showed no postal fill, outline or provenance. Screenshot/PDF bytes and render hashes were fixed; the local image-view helper failed, so visual success is not claimed.
- Verification: source inspection 1/1, inspector units 5/5, KN metadata 2/2, address formats 68/68, shared runtime 30/30, rollout 8/8, ledger 6/6, TypeScript and syntax/status checks pass (135 recorded, 0 failed).
- Retry: not before `2026-12-01T10:04:53.864Z` and only after pending countries have been swept, unless a competent authority publishes a rights-cleared current complete assignment and postal-area artifact.
- After KN: 252 profiles, 113 pending, 125 blocked, 0 in progress, 14 evidence-verified M2; 169 manifests / 151 explicit definitions.
- Next country: Cayman Islands (`KY`). No second country was started.

## KY - Cayman Islands

- Status: `blocked` / M2 unmet; the current integral `KYN-NNNN` system is confirmed and address metadata now follows P.O. Box + official island + postcode rather than a street-only form.
- Attempt: 1 at `2026-09-01T10:40:54.523Z`; completed `2026-09-01T10:55:42.6445417Z`.
- Definition: `M2_current_cips_box_section_and_unique_postcode_context_visualization`.
- Evidence: `reports/postal-context-m2/ky-source-review-2026-09-01.json` (`sha256:0f816f677e03ab6f1f5fe6077bc8b0e809d00748537c0eda979776d6caeb4a67`); checks `reports/postal-context-m2/ky-checks-2026-09-01.json` (`sha256:d522dd9b60e20f5b89872dd09c1e882781c8b089c9317d6dde456dfc5e759991`).
- Current semantics: six fixed official bodies / 876,000 bytes establish integral KY, island codes 1/2/3, four section digits, private-letter-box delivery and undeliverable street-only mail. The 2025 regulations confirm unique company postcodes; examples and that service class are not a current complete assignment denominator.
- Geometry and rights: the public GIS has one Street Address Polygon layer, no tables and no postcode field. It is not postal geometry. The FAQ requires express written Chief Surveyor permission for map publication; blank service copyright text is not a licence. Zero official/derived/virtual postal areas and zero production records were promoted.
- Running app: HTTP 200 at `http://127.0.0.1:3016/`; real KY postal API returned 404 unsupported. In-app Browser failed before navigation on the Windows ACL sandbox. Deterministic Playwright entered `KY1-1100 Cayman Islands`, observed two canvases but no result, KY postal request, notice, translucent area or provenance. Screenshot/render bytes and hashes were fixed, but image viewing failed with Windows error 206, so visual success is not claimed.
- Verification: fixed-source inspection 1/1, inspector units 5/5, KY metadata 2/2, address formats 68/68, shared runtime 30/30, rollout 8/8, ledger 6/6, TypeScript, syntax/diff and real app/browser evidence checks pass (124 recorded, 0 failed).
- Retry: not before `2026-12-01T10:40:54.523Z` and only after pending countries have been swept, unless CIPS/UPU publishes a rights-cleared current complete typed assignment and eligible postal-area artifact.
- After KY: 252 profiles, 112 pending, 126 blocked, 0 in progress, 14 evidence-verified M2; 170 manifests / 152 explicit definitions.
- Next country: Saint Lucia (`LC`). No second country was started.
