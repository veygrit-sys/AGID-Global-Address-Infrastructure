# Belarus Postal Context M2 review

## Technical summary

BY now has the country-specific target `M2_current_belpost_assignment_and_rights_cleared_nca_postal_zone_visualization`, but remains **M2 blocked**. NCA officially documents nationwide postal-code zones in production since 2020 and updated every six months. A live Belpost observation for `220030` returned assignment/address rows, but no geometry. The current NCA vector layer and reusable public data/API rights were not obtained, so the real app cannot lawfully draw the postcode as a translucent area.

## Key findings and evidence

| Evidence | Result | Decision impact |
| --- | --- | --- |
| NCA postal-zone methodology | Nationwide production in 2020; six-month updates; Belpost membership, Address Register and ATE/TE inputs | Confirms real official-derived zones exist, but not their current edition or reusable bytes |
| Belpost autocomplete for `220030` | 21 rows, one six-digit postcode, zero geometry fields | Current scoped assignment observation only |
| Belpost search for `220030` | 89 total matches; 21 page rows; one serving-office row; zero geometry fields | Pagination/relationships do not establish national completeness or an area |
| NCA website-use rules | Website material reuse conditions reviewed | Not a vector database, derivative or API licence |
| NCA public map | Shell/client accessible; five anonymous `/api` probes returned 404 | No actual zone layer, edition, schema, CRS, topology or digest retrieved |
| Production/public area | 0 eligible records; 0 immutable artifacts | Real BY API/app visualization cannot be claimed |

A compact evidence table is used instead of a chart because the decisive relationship is an authority and rights gate. Plotting one-code row counts would misleadingly imply national coverage.

## Scope, data and definitions

A BY postal area must be the actual current NCA postal-code zone, classified as official-derived because NCA constructs it from Belpost membership, the Address Register, ATE/TE data and mapped land features. It is not called a Belpost-authored delivery perimeter. A public map image or client bundle is not the vector dataset or permission to redistribute it.

Belpost assignment/address rows, serving-office points, administrative or cadastral units, parcels, addresses, buildings, buffers, Voronoi/model surfaces and AGID cells retain separate authority. Special, P.O.-box, organization, route and office-only codes remain non-area unless the actual NCA zone explicitly covers them. House numbers and buildings require a separate permitted stable address/building relation.

## Methodology

Eight exact public observations were downloaded without authentication, payment or terms acceptance and bound by byte size and SHA-256: NCA's zone-methodology page and website-use rules, the NCA map shell and client, the Belpost shell and client, and two live read-only Belpost responses for one postcode. A deterministic inspector re-hashes all 10,226,461 bytes and profiles the two JSON responses without committing their detailed address/building contents.

Five anonymous NCA map API paths were probed and returned HTTP 404. This records the observed public path only; it does not prove that no service exists. No account, contract, paid product, new repository, publication target or deployment was created.

## Limitations, uncertainty and robustness

Completeness is unknown: one postcode observation cannot be a national denominator. The 42 inspected assignment rows normalize to `220030`, all are six digit and none contains geometry. Search reports 89 total matches while page one and autocomplete each expose 21, which is retained as pagination/representation behavior rather than interpreted as inconsistent coverage.

The live responses were captured on 2026-08-29 but provide no release version or effective date. NCA says the zones are maintained every six months, yet the current edition, CRS, schema and topology were not available. NCA's website rules govern site materials; they do not establish redistribution, derivative, API or commercial rights for the postal-zone database. The absent public vector and rights evidence is a critical blocker with high confidence; the one-code Belpost assignment observation has only scoped confidence.

## Recommended next steps

Obtain from NCA and Belpost a current editioned zone export/API and complete assignment release, including special/non-area semantics. Secure written public redistribution, derivative, API and applicable commercial-use rights; then pin source CRS, schema, topology, effective time and SHA-256. Only after approval should an immutable artifact be published and the real BY loader, API and app search, fit, translucent fill, outline, provenance, no-result, multiple, invalid, failure, clear and re-search paths be verified.

Recheck after the pending-country pass and no earlier than `2026-09-05T11:50:56.469Z`, unless a current rights-cleared release appears sooner. Do not authenticate, accept terms, pay, create a destination, publish or deploy without explicit approval.

## Further questions

- Can NCA provide an editioned postal-zone vector/API with explicit public redistribution and derivative rights?
- Can Belpost provide a complete dated assignment release and non-geographic-code semantics?
- What stable key joins Belpost assignment rows to NCA zone features?
- Which address/building relations may be displayed separately from postal containment?

Next is **CH (Switzerland)**. No second country was started.
