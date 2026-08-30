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
