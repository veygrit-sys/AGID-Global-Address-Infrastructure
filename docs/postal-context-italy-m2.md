# Italy Postal Context M2 review

## Technical summary

Italy (`IT`) remains at `M1_metadata`; M2 is blocked. Poste Italiane is the competent CAP assignment authority, and the current public CAP page identifies the third 2025 update as effective from 25 May 2026. The downloadable public package is only a two-PDF change set. It is neither a complete nationwide assignment denominator nor a Polygon/MultiPolygon release. The more detailed CAP Professional product requires purchase, login and a PIN, and Poste's current FAQ limits the database to internal use and prohibits transmission or transfer to third parties.

The two plausible open geometry paths also fail the postal-area test. ANNCSU publishes address/civic data under an open-data programme, but its current published schema has no CAP field, so an address-to-CAP membership join cannot be reproduced from that release. ISTAT publishes current administrative/statistical boundaries, not CAP areas. No address, building, cadastral, land or feature rows were queried or committed, and no administrative polygon, point buffer, Voronoi cell or synthetic fixture was promoted.

## Key findings

| Authority or product | Current evidence | Reuse state | Postal-area result |
| --- | --- | --- | --- |
| Poste Italiane public CAP update | Effective 2026-05-25; ZIP contains two PDF change lists | Publicly retrievable page/package; no complete bulk publication grant found | 0 Polygon/MultiPolygon records; not a nationwide denominator |
| CAP Professional | Product specification covers multi-CAP streets, arcs, civic ranges/parity and updates | Purchase, registration, login and PIN; FAQ says internal use and no third-party transfer | No data acquired; no public publication/serving authority |
| ANNCSU open address archive | Monthly national/regional CSV ZIPs and daily APIs are advertised | Open-data page available; direct national download returned 403 during this run | Published schema has 0 CAP fields and no postal polygons |
| ISTAT 2026 boundaries | Regions, provinces/metropolitan cities and municipalities in WGS84 | Public official statistical cartography | Administrative geometry only; 0 eligible CAP polygons |
| AGCOM postal regulation | Confirms Poste manages CAP structure and announces changes | Public regulatory page | Confirms authority, not a nationwide CAP geometry release |

A chart or map was intentionally omitted. The decisive comparison is the authority/rights/geometry matrix above, and displaying any spatial surface would incorrectly imply that a lawful real CAP area had been obtained.

## Scope and country-specific M2 definition

The review grain is one current Italian CAP assignment and its exact source-defined Polygon/MultiPolygon or truthful non-area reason. Italy remains a separate country identity; San Marino (`SM`) and Vatican City (`VA`) are not merged into IT.

IT reaches M2 only when all of the following are true:

1. A current rights-cleared nationwide Poste Italiane assignment denominator covers grouped municipalities, multi-CAP cities, street arcs, civic-number ranges and parity, transition history, and special/non-geographic records.
2. Every searchable geographic CAP has an authoritative postal-area Polygon/MultiPolygon or a reproducible rights-cleared membership-derived surface. Edition, effective date, terms, attribution, CRS, topology, members, exclusions, coverage, uncertainty and SHA-256 are pinned.
3. The approved immutable artifact is published without raw private address, customer, building, cadastral or land-right data.
4. The real AGID API/app normalizes the CAP, returns valid geometry, fits the map, renders a translucent fill and clear outline, and reports selected code, geometry kind, official/derived/virtual class, source, reference date and confidence. Loading, no match, multiple candidates, API failure, invalid geometry, clear and re-search states pass.

Public change PDFs, a product specification, unlicensed CAP Professional rows, ANNCSU civic points, ISTAT administrative polygons, DBGT buildings, cadastral parcels, buffers, Voronoi cells and synthetic fixtures do not satisfy this definition. Point, route, PO box, organization and other non-area records retain a truthful non-area/unavailable reason.

## Source and byte review

Seven top-level official response bodies were captured and SHA-256 pinned, together with both PDF members of the current CAP-update ZIP. The machine report records exact byte lengths, retrieval times and hashes. The ANNCSU schema was verified through its official web response but deterministic direct byte capture failed; therefore no digest is claimed for it. The national ANNCSU download returned HTTP 403; no workaround, account, credential or row extraction was attempted.

The current public CAP package is 172,296 bytes and contains exactly two PDFs:

- `1100-ACCR_ElencoCapStrade inserite 3° Pubblicazione 2025.pdf` (83,900 bytes), a street-insertion change list.
- `1100-ACCR_Variazioni CAP Strade e Archi 3° Pubblicazione 2025.pdf` (100,977 bytes), a street/arc change list.

It contains no CSV, GeoJSON, Shapefile, GeoPackage or other nationwide assignment/geometry payload. Poste also states that replaced CAP assignments remain valid for at least twelve months, so a production denominator must preserve valid and known times rather than collapse the transition.

## Data-quality assessment

- Completeness: critical for M2. No complete current public nationwide assignment rows and no eligible CAP geometry records were obtained.
- Uniqueness: not measurable for the national denominator because only change documents, not the full table, are public in the reviewed package.
- Validity: the public operator definition confirms an exact five-digit CAP. Production must preserve leading zeroes as text.
- Consistency: public updates, CAP Professional, ANNCSU, ISTAT and DBGT have different grains and authorities. They remain separate.
- Timeliness: the effective public update is 25 May 2026; the CAP Professional specification reviewed is June 2019 and is documentation, not a current purchased snapshot.
- Integrity: street arcs/ranges/parity, historical overlap, special records and country identity cannot be dropped. Administrative or building geometry cannot be relabelled as a CAP boundary.

## Application status

The repository's shared Postal Context code already validates Polygon/MultiPolygon-only responses, map bounds, translucent fill, visible outline, metadata, failure states, clear and re-search. Existing Italy runtime fixtures are synthetic and remain test-only. Because this run found no rights-cleared real IT geometry artifact, there is no real IT API response, no real search-to-fit-and-fill result and no browser E2E claim. This is a blocker, not an invitation to fabricate geometry.

## Limitations and robustness

This is a dated public-release and rights audit, not a legal opinion and not proof that no private or future product can exist. CAP Professional data was not purchased or authenticated, ANNCSU's blocked national download was not bypassed, and no consent or licence expansion was requested. The finding is robust for M2 because every available public path lacks at least one mandatory element: complete current assignment, publication rights, or real postal-area geometry.

## Recommended next step

After the pending-country pass and not before `2026-09-06T13:34:49.549Z`, recheck Poste Italiane, ANNCSU and authoritative public catalogues for an unrestricted current nationwide assignment and postal-area release. Resume sooner only if such a release appears. Purchasing CAP Professional, registering/authenticating, accepting a contract or new licence, contacting a provider, paying, requesting restricted data, publishing to a new destination or deploying requires explicit approval.

## Further questions

- Will Poste publish a current full assignment denominator with redistribution/API-serving rights rather than change-only PDFs?
- Can an authorized release expose explicit geographic CAP membership while preserving multi-CAP street-range and transition semantics?
- If a derived surface is permitted, which rights-cleared membership and clipping sources define its reproducible uncertainty and exceptions?

Machine-readable evidence is in `reports/postal-context-m2/it-source-review-2026-08-30.json`; engineering results are in `reports/postal-context-m2/it-checks-2026-08-30.json`.
