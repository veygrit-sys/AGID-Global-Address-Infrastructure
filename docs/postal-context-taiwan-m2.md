# Taiwan Postal Context M2 source and visualization review

## Technical summary

Taiwan remains at **M1 metadata**. Ten exact official references were retrieved
on 2026-08-29 and bound to byte counts and SHA-256. The strongest public
government resource advertised as a CSV is a 475-byte Big5 link catalog with
four rows and three fields (file name, format and URL). It contains no postcode
assignment row and no coordinate, boundary or geometry field.

The current Chunghwa Post usage-rules ODT explicitly says that 3+3 address text
files are no longer distributed from its public site or the government data
portal. Obtaining the current text file requires an external account, a printed
application bearing company seals and operator approval, followed by quarterly
updates. No account, application, authentication or terms acceptance was used.
The public API specification returns strings only. No postal polygon was
generated from address ranges, three-digit centres, doorplate points,
buildings, parcels, administrative boundaries or models.

## Key findings and evidence

| Evidence | Exact receipt | Finding | M2 consequence |
|---|---|---|---|
| Government dataset page | `sha256:781662a1…ddee1` / 520,953 bytes | Metadata updated 2026-06-01; OGL v1 label; one CSV resource | Metadata and licence label do not establish a current geometry artifact |
| Dataset CSV resource | `sha256:06a0e9da…2c77` / 475 bytes | Big5 link catalog: 4 rows, 3 fields, 0 assignments, 0 postcode or geometry fields | Not real postcode data |
| Chunghwa Post downloads | `sha256:9c075a2d…6445` / 1,894,162 bytes | Lists authorization, rules, API documents and V2603 Windows application | Product discovery is not an immutable postal-area artifact |
| Public authorization PDF | `sha256:00799fd9…f039` / 248,663 bytes | Allows reproduction and interface presentation of covered 3+3 data files with legal/third-party limits | Does not create geometry or rights in NLSC/third-party data |
| Current usage-rules ODT | `sha256:bd27a5fe…0167` / 8,279 bytes | Public raw-file distribution stopped; account, sealed application and approval required | Controlled source was not accessed; current national rows remain unverified |
| Operator API specification | `sha256:feb34104…bf0` / 842,004 bytes | Seven pages; address-to-code, prefix-to-city/area and address JSON; 0 geometry fields | Lookup result is not a Polygon/MultiPolygon |
| Web Service application | `sha256:406dfea6…aa21` / 288,993 bytes | Registration, one fixed IP and single-address queries | No anonymous bulk or area API |
| NLSC map provenance | `sha256:5f6cae85…79a3` / 911,223 bytes | Local governments maintain doorplate positions; NLSC periodically uses them for maps/search | Operational point provenance, not postal-area or blanket reuse authority |
| NLSC WFS catalog | `sha256:849848b2…6950` / 15,003 bytes | Doorplates are points; buildings are separate polygons; no postcode-area layer found | Neither layer may be relabelled as postal geometry |
| NLSC integration rules | `sha256:19155a52…7d7b` / 307,577 bytes | Vector services require eligible applicants, bound IP and internal use; batch doorplates require review | No public reusable vector/derivative grant established |

Raw HTML, CSV, ODT, PDF, RAR, EXE and rendered pages were retained only in the
isolated audit directory and are not committed. The current V2603 archive was
downloaded and hash-checked; its unsigned installer was extracted but never
executed. A binary lookup application is not a documented postcode-area data
release.

## Scope and definitions

The canonical value is six digits and is stored as text, for example `106000`.
M2 requires current, complete-for-declared-coverage 3+3 assignments plus an
exact rights-cleared per-code Polygon/MultiPolygon artifact, immutable approved
publication, TW runtime/API integration and real application proof. The app
must fit the map, draw a translucent fill and clear outline, expose provenance,
and fail clearly for not-found, multiple, API-failure and invalid/non-area
geometry.

Address ranges and delivery-specific assignments can include road, section,
lane, alley, house-number, parity, P.O.-box, military or organization rules.
They do not imply that every code is a contiguous area. Doorplate points,
building footprints, parcels and administrative geometry remain separate
evidence. Buildings and house numbers require an explicit permitted stable
address-to-building relation.

## Methodology

1. Retrieved exact public primary-source bytes without authentication and
   recorded URL, time, HTTP result, byte length and SHA-256.
2. Decoded and profiled the government Big5 CSV, distinguishing its link-catalog
   grain from assignment data and checking for postcode/geometry fields.
3. Extracted the ODT rules and reviewed the public authorization separately,
   preserving the difference between access approval and reuse terms.
4. Text-extracted all seven API-spec pages and rendered page 5, confirming that
   the service returns a postcode string/normalized address and no geometry.
5. Reviewed NLSC map/WFS sources and all 22 integration-rules pages; rendered
   page 5 showing application and internal-use restrictions.
6. Compared evidence with the country-specific M2 contract and deterministic
   shared search, API and map-rendering tests.

## Quality, uncertainty and robustness

The public CSV has 100% catalog-row readability after Big5 decoding, but zero
assignment rows; a data-quality percentage over postal coverage would therefore
be undefined and misleading. The catalog's metadata update time is later than
the usage-rules file's HTTP last-modified value, which reinforces the need to
bind each exact artifact instead of assuming that portal freshness means raw
data freshness.

The one-page authorization, seven-page interface specification and relevant
page of the 22-page NLSC rules rendered legibly and matched extracted text. No
official postal-area edition, CRS, topology, national coverage statement,
validity interval or immutable data artifact was found. The V2603 Windows
installer may contain lookup material, but it was not executed, is unsigned,
is not a documented geometry export and cannot substitute for approved source
access and redistribution review.

This is an engineering promotion gate, not a legal opinion. Absence from the
reviewed public interfaces is not proof that Chunghwa Post does not maintain
internal delivery-area geometry.

## App visualization status

Shared deterministic tests cover exact-code candidate selection, explicit
geometry opt-in, Polygon/MultiPolygon filtering, map fit, opacity-0.22 fill,
opacity-0.95 width-3 outline, clear/re-search and failure states. The shared
visible notice still lacks separate authority-class, basis-date and confidence
fields. TW has no eligible runtime artifact or real area response, so the app
cannot yet display a defensible real translucent Taiwan postcode area. A
synthetic polygon would test code only and cannot establish M2.

## Next steps

1. Obtain approval for the current 3+3 address text file and written clarity on
   OSS redistribution, derivative polygons and public AGID API serving.
2. Obtain an exact operator postal-area release, or a permitted time-compatible
   doorplate membership relation that may produce explicitly **derived**,
   uncertainty-bearing surfaces; preserve gaps and non-area exceptions.
3. Pin edition, validity, coverage, schema, CRS, attribution, terms and digests;
   validate normalization, membership, topology, duplicates, gaps and overlaps.
4. Publish an approved immutable artifact outside AGID only with authorization,
   then load it through the real TW runtime/API and verify all UI states plus
   authority/source/basis-date/confidence.

## Further questions

- Does Chunghwa Post maintain exact 3+3 delivery boundaries, and can those
  boundaries or permitted derivatives be redistributed and served by AGID?
- Which current text-file terms govern derivative area creation after access
  approval, beyond the public authorization PDF?
- Can an exact public civic identifier link approved doorplate records to an
  approved building layer without containment, proximity or personal data?
- How are P.O. boxes, military, organization and delivery-specific codes typed
  outside polygon coverage?

Recheck on or after `2026-09-05T05:57:18.791Z` and after the pending-country
pass, or earlier if rights-cleared area data or explicit permission appears. No
chart is included because there is no eligible geographic or coverage measure;
charting four catalog links would misleadingly imply postal-area coverage.
