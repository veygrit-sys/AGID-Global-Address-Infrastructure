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
