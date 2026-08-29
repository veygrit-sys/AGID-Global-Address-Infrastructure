# Qatar M2 review - 2026-08-28 UTC

Status: **M1_metadata / blocked; M2 not achieved**. QA had no manifest or M2
definition at the fresh rollout base `f02c10a521febc1febce6d4891bcfac14c84f80e`.
This review defines `M2_current_official_inwani_context` individually; it does
not redefine any other country's criterion.

## Authority and data grain

[Qatar Post](https://qatarpost.qa/Home/PostalStandards) describes Inwani/Anwani
zone, street and building identifiers, separately from PO-box delivery.
The [UPU sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/qatEn.pdf)
is dated 08/2024 and contains layout examples, not assigned-address data.
Preserve the existing QA no-postcode form. Neither PO boxes, zones, dummy zeroes
nor a generic geocoder `Postal` field establish an official postal code.

The official CGIS QARS Custom Locator metadata advertises `ZONE_NO`,
`STREET_NO` and `BUILDING_NO` candidate outputs in WKID 2932. The Compound
Locator has a different, generic schema. Neither schema is a published address
register; candidate scores are not calibrated positional or delivery accuracy.
No geocoding/reverse-geocoding request or individual address was collected.

The [ZonesStreets layer](https://services.gisqatar.org.qa/server/rest/services/Vector/ZonesStreetsFS/FeatureServer/0)
is a **road polyline** layer, not postal regions or buildings. Two aggregate
queries agree on 12,645 features. Of these, 285 lack STREET and 12,623 lack
LAST_UPDATE. Only 22 date values exist (2015-04-30 through 2015-06-08 UTC).
These are measured missingness counts; nullable schema flags are not measurements.
The dates cannot establish the freshness of all roads. No feature topology,
duplicate-address rate, source coverage or address-building join was verified.
The public Vector directory omits this directly accessible service, so the
directory must not be interpreted as an exhaustive inventory.

## Rights and public-data search

The [NPC licensing policy](https://www.npc.qa/en/media/Documents/OpenData/En_OpenDataLicensingPolicy.pdf)
is **June 2026**, not the historical 2014 framework. Its reviewed cover and
pages 4-7 adopt CC-BY-4.0 for classified C0 open data, including attributed
commercial adaptation. Restricted/personal data and logos are excluded;
re-identification and implied endorsement are prohibited. Chapter Two is
guidance, not an amendment to CC-BY. The exact approval day was not established.

The portal's embedded page content, not just its empty rendered shell, was
parsed. Its general website restrictions explicitly allow exceptions; they
must not erase a dataset-specific CC-BY-4.0 grant. The road/QARS services have
not been verified as C0 or as covered by a specific permission. Empty copyright
metadata is not proof either of an open licence or of prohibition.

Bounded English catalog searches returned 3 `address`, 10 `zone`, and 21
`building` results, including the last paginated result. These queries are not
an exhaustive national absence claim. The NPC population-by-zone data and
2015 building census data carry explicit C0 catalog identifiers and CC-BY-4.0
URLs. They are aggregate statistics: the latter's advertised polygons describe
municipalities, not individual buildings. No census rows or geometry were
downloaded, and none are used to invent Inwani addresses.

The separate CGIS topographic price list has a 2017 server modification date.
It describes products and negotiated commercial use, but neither current
prices nor applicability to the reviewed APIs is proven. No purchase, account,
explicit contract acceptance, authentication or new public hosting occurred.

## Reproduction and AGID

The [source report](../reports/postal-context-m2/qa-source-review-2026-08-28.json)
contains hashes, timestamps, source editions, public schemas and aggregate
profiles only. It separates 19 content-reviewed references from four transport
shell/bundle receipts and two initial failed acquisitions. The bare data host
failed; `www.data.gov.qa` worked. The policy exceeded the initial 4 MiB cap;
a single exact-URL 16 MiB retry obtained the complete 10,112,684-byte PDF.

```text
node scripts/inspect-postal-context-qa-sources.mjs --input-dir tmp/qa-source --report tmp/qa-replay.json
node scripts/inspect-postal-context-qa-sources.mjs --acquire tmp/qa-new --report tmp/qa-new-review.json --curl C:/Windows/System32/curl.exe
node --import tsx --test scripts/inspect-postal-context-qa-sources.test.mjs src/lib/postalContextQatarM2.test.ts
```

Acquisition is opt-in, bounded public GET only, with exact reviewed hashes.
Content/redirect/schema drift requires human review; it never silently promotes
data. Raw bodies stay in the ignored temporary directory. Existing QA address
JSON/YAML are unchanged. The source catalog's former strong `qatar-gis`
classification is fixed: viewer, QARS, UPU, census catalog and licence references
are metadata-only and excluded from preferred postal-validation sources.

## Unblock

Obtain a current, complete-for-declared-coverage official Inwani artifact with
explicit zone/street/building relations and georeferencing; verify applicable
C0 status/licence or permission, source edition, CRS, coverage and third-party
rights. Validate stable keys, duplicates, missingness, geometry and temporal
joins. Building footprints need a separate explicit permitted source relation.
Only after approval of an immutable, no-extra-charge publication destination
can the actual QA descriptor and loader/API be verified. No raw addresses,
recipient/QID/owner/land-rights data or model-generated official polygons belong
in AGID Git. Recheck public evidence after seven days and after pending countries;
the next scheduled country is SA, not another country in this run.
