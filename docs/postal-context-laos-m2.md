# Laos M2 source review — 2026-08-28

LA remains **M1_metadata / blocked**, not a completed national dataset.
The [source receipt](../reports/postal-context-m2/la-source-review-2026-08-28.json)
and [engineering checks](../reports/postal-context-m2/la-checks-2026-08-28.json)
record observed evidence separately from synthetic conformance tests.

## Country-specific promotion criterion

`M2_assignment_geometry` formalizes the existing runtime Promotion section at
base `9eb00625d1d54c66a9a261b9ef4ec7ee88a18099`. It requires current rights-reviewed
Lao Postal Service or legally authorised assignments and independently licensed
point, route or area geometry; declared-scope coverage, assignment validity,
CRS/topology, temporal coverage, privacy and provenance checks; reproducible
transformation, approved immutable publication and actual AGID loader/API
verification. The eight existing hard blockers are unchanged.

Five-character postcode strings retain leading zeroes. No official polygon is
presumed. A derived administrative join must be explicitly labelled and supported
by a proven relation; virtual geometry cannot become official by inference.
Exact civic addresses/buildings need separate explicit, permitted relations.
AGID is an independent spatial index, not a replacement postal identity.

## Live public evidence, not a production release

Eleven bounded anonymous reference GETs completed at
`2026-08-28T17:43:12.611Z`: eight content-verified reference bodies, one verified
initial loading shell (not a verified data body), and two retrieval failures.
Receipts pin observed time, requested/final URL, MIME, byte length and SHA-256
when bytes were received. Unknown legal effective dates and national quality
metrics remain null, not inferred from HTTP modification times or small samples.

### Operator UI and observation grain

The [Lao Postal Service page](https://www.laopost.com.la/about/postcode) initially
returns a client-rendered loading shell. The loaded public UI was separately
observed: 18 regional cards advertise totals summing to **8,172 rows**. This is
not 8,172 distinct postcodes. Only the first region was opened; ten displayed
rows had ten distinct texts but just one postcode. Repeated codes therefore
cannot be counted as duplicate assignments. All ten sampled codes were valid
five-digit strings with leading zeroes; this is not a national accuracy rate.
The first region advertised 457 rows and still offered Load More, which was not
clicked. No search, hidden API, authentication or private record query was used.
The footer reserves rights; exact bulk reuse/redistribution permission, dataset
edition, assignment validity and full national coverage remain unverified.

The 3,987-byte temporary DOM observation has digest
`sha256:2861fe4fde5d768de6aef60fdc021b8f80be9f443bb22e16cb0a605f8b8ed958`.
It is not an atomic snapshot, verified raw HTTP data artifact or licensed release.
No code/village/address cell from it is published in AGID Git.

### Explanatory allocation reference

The current [Laopedia article and linked revision 1784](https://laopedia.gov.la/index.php?title=%E0%BA%A5%E0%BA%B0%E0%BA%AB%E0%BA%B1%E0%BA%94%E0%BB%84%E0%BA%9B%E0%BA%AA%E0%BA%B0%E0%BA%99%E0%BA%B5&oldid=1784)
have matching normalized article bytes (2,277 bytes; digest in the config and
receipt). The page displays a June 2025 modification date. Three geographic
headings contain only one detailed list: five explicit zone rows, although the
stated range has seven possible values. No missing assignments are generated
by expanding that range. Two rows lack village detail; the other three have
27 village-token observations, one repeated token within a row and one unclosed
parenthesis. The 2/5 missing-detail rate describes this article alone. Neither
spelling, punctuation nor duplicates were automatically repaired; village names
are not stable identifiers. An oldid URL is a fixed explanatory reference, not
an approved current immutable production artifact or a reuse licence.

### Administrative geometry and privacy

[NFMS layer 245](https://nfms.maf.gov.la/arcgis/rest/services/thematic/NFMSLayer/MapServer/245?f=pjson)
is a group, not a feature dataset. Child metadata 246/247/248 declares country,
province and district polygons, with Web Mercator identifiers 102100/3857.
These are not latitude/longitude coordinates or postal polygons. Province field
`PCode` does not establish postcode semantics or a join key. Blank copyright
text is not permission. No feature query, geometry download, spatial join or
topology validation was performed.

The [LSB census publication](https://www.lsb.gov.la/phc/?lang=en&p=600), dated
20 December 2025, describes GIS, buildings/dwellings and enumeration work.
It is not an obtained open address/building crosswalk. Household, individual and
property-rights information remains excluded. LaoLandReg PDF retrieval failed
with a network error, so no PDF bytes or pages were reviewed this run. A failure
does not prove data absence or grant access to controlled data.

### Legal and reuse uncertainty

The [2013 Postal Services Law reference](https://www.laotradeportal.gov.la/en-gb/site/display/1164)
binds the title and normalized Articles 9–11 section (1,582 bytes): postal-network
objects and delivery-scope postcode context, not data redistribution permission.
The English Article 65 supersession wording is chronologically ambiguous; it is
not silently corrected or treated as proof of the current consolidated law.
The direct [Electronic Data Law reference](https://lsp.moic.gov.la/?id=289&r=site%2Fdisplaylegal)
timed out. Cached search text is not a current hashed legal document. Current
applicability, exact data licences and publication rights remain unverified.

## Reproducibility and limitations

Run `node scripts/inspect-postal-context-la-sources.mjs --report NEW.json` for
bounded TLS-verified reference GETs; Windows can supply `--curl` with an absolute
native curl path. Existing reports are never overwritten. Optional
`--dom-capture PRIVATE.json` profiles the exact schema/bounds in the script.
To recapture, use the public overview, wait until loaded, and open its first
region only; record URL/title/main visible text/UTC observation time, and the
detail heading/visible row paragraphs/Load More presence. Do not access hidden
state, replay internal requests or collect later pages. Store the two captures
under schema `postal-context-la-dom-capture/v1` outside tracked content.

Dynamic page wrappers may have different HTTP digests while the exact reviewed
law section/wiki article digest remains equal. Changed identity/content fails
closed and requires new review. The transient raw bodies/capture are deleted
after verified GitHub publication; hashes cannot reconstruct deleted bytes.
An independent public recapture is possible, but exact historical reproduction
requires the same input bytes. The committed aggregate receipts do not provide
a data source for production transformation.

## Remaining work and authority

Obtain complete current permitted assignments, independently permitted geometry
and explicit crosswalks; establish exact terms/current legal status; validate
coverage, exceptions, validity, CRS/topology, privacy and reproducible provenance.
Then seek approval for immutable publication outside AGID Git and verify artifact
bytes plus the actual AGID loader/API. Synthetic tests do not satisfy those gates.
All seven LA official discovery sources are metadata-only for validation; a
source name, URL or identifier cannot alone assert a strong current assignment.

No new repository, Dataset/Space, publishing destination, paid compute/inference,
additional Hugging Face charge, contract, restricted query or production deploy
is authorized/performed here. Public-only reconsideration is deferred until all
pending countries have been visited and `2026-09-04T17:43:12.611Z` has passed.
The queue selects **LB (Lebanon)** next; no second country was started this run.
