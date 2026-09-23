# Iran M2 source review - 2026-08-28

## Result and country-specific criterion

**IR remains M1_metadata / blocked, not M2 complete.** Its starting manifest
had no named M2 stage. The new `M2_licensed_assignment` formalizes the existing
ten-digit place identifier, five-digit forwarding context, non-area objects,
P.O. Box/poste restante exceptions, GNAF/certificate privacy and temporal and
jurisdiction rules. All nine prior hard blockers and other manifest rules
are unchanged; no other country's definition or identity is changed.

M2 requires a current rights-cleared Iran Post release complete for its
declared source, jurisdiction and time scope; reproducible full-data checks
and conversion; immutable published data; and actual AGID loader/API evidence.
Any geometry or civic-address/building relation has independent authority,
licence, validity and lineage. A scoped release is not universal coverage.

## Live evidence and limitations

The receipt `reports/postal-context-m2/ir-source-review-2026-08-28.json` records
exact URLs, start/completion times, failure kinds, HTTP status and successful
redirect chains. The engineering receipt is
`reports/postal-context-m2/ir-checks-2026-08-28.json`.

| Reviewed public entry | Final observation from this host | Consequence |
| --- | --- | --- |
| [Iran Post](https://post.ir/) and [www host](https://www.post.ir/) | Both connection-timeout | No operator release or current terms obtained |
| [GNAF](https://gnaf.post.ir/) | Connection-timeout | No query was submitted; no address/coordinate response or rights acquired |
| [Certificate service](https://gavahi.post.ir/) | Connection-timeout | No certificate request, login, payment or personal record |
| [NSDI](https://iransdi.ir/) | HTTPS redirect to `iransdi.ncc.gov.ir`, then 502 | No exact layer, licence, geometry or postal relationship acquired |
| [UPU Iran PDF](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/irnEn.pdf) | Redirects to `upu.int/` and `www.upu.int/`, then 404 | Not the requested PDF; no current source bytes or digest |

Earlier direct requests to the PDF returned 404 without redirects, including
Windows' normal HTTPS client. The later behavior changed to the homepage
redirect above. The search service still exposes a two-page extracted copy
showing a 10/2023 edition and the existing ten-digit and postal-service
exceptions. That copy is context only: fresh PDF bytes and a fresh complete
visual review could not be obtained. It is not treated as currently retrieved
or hash-verified. Examples and contacts are not copied into this repository.

These observations do **not** prove that national datasets are absent, that
reuse is categorically prohibited, or that every domestic client sees the
same failures. No specific root cause beyond the observed connection/HTTP
results is asserted. Current exact licence terms remain unknown, not granted.
The independent/community sources remain separate and cannot replace Iran
Post authority; they were not harvested to manufacture a postal dataset.

## Data quality and implementation boundary

The intended assignment grain is source edition / jurisdiction / postal
object / validity, not code alone. Ten-digit codes remain strings. Five-digit
forwarding context cannot become a polygon; P.O. Box and poste restante
objects must not be forced to carry a ten-digit postcode.

**Zero current assignment rows** were acquired. Missing-code, invalid-code
and duplicate-assignment rates are **null / unmeasured**, not 0% errors.
Error bodies are cancelled and never hashed as if they were source datasets.
There are no new source-data snapshots, production geometries, published data
artifacts or real AGID loader/API results. Engineering and synthetic tests
only establish implementation behavior, not M2 data completion.

The IR inspector uses a fixed allowlist, unauthenticated HTTPS GETs, at most
two concurrent resources, 2 MiB responses and three redirects. It rejects
HTTP downgrades, credentials and unapproved domains. It never submits
postcodes, coordinates, address queries or certificate requests, and never
uses a cached document as a network fallback. Unknown errors are sanitized.
PDF magic or a successful HTML response alone cannot establish a reviewed
document, current assignment, licence or geometry.

The source catalogue now keeps Iran Post operator authority separate from
metadata-only validation readiness. A source name, ID or URL alone cannot
produce strong address validation. Other catalogue entries, country formats,
source profiles, runtime, fixtures and all existing IR rules are unchanged.

## Reproduction, unblock and review

```sh
node scripts/inspect-postal-context-ir-sources.mjs --report tmp/ir-new-review.json
npm run verify:postal-context-iran
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
```

The report command refuses to overwrite existing evidence. This host's user
npm launcher is broken; package-script targets were executed with the
installed `tsx` entrypoint. The system npm CLI installed only locked cached
dependencies offline; the lockfile is unchanged. No TLS bypass, proxy
circumvention, paid service, contract or production deployment was used.

To unblock, obtain a lawful current Iran Post assignment release complete for
its declared scope, exact source/terms versions and SHA-256, reuse and display
rights, privacy/retention rules and temporal/jurisdiction coverage. Recheck
non-area object types and postal-service exceptions. Validate the full input
and reproducible conversion, obtain explicit approval for immutable data
publication outside AGID Git, and test the actual AGID loader/API. Street
numbers/buildings need independently sourced explicit address/building links.

A public-reference review is due seven days after the receipt, after the
pending-country pass; the ledger contains the exact timestamp. That date
does not grant permission for restricted access, agreements or publication.
Next pending country is **JO (Jordan)**; it was not started in this run.
