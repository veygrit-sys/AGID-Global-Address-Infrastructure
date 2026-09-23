# Yemen Postal Context M2 review

## YE is M2 blocked; optional office code semantics are not postal areas

YE remains **M2 blocked**. UPU's current policy reference says Yemen does not
require a postcode. Yemen Post's current P.O. box service page separately says
a subscriber receives a box number and a postal code tied to the post office
by area. The reviewed operator pages expose no code values, syntax, assignment
rows, declared coverage, coordinates, Polygon/MultiPolygon or code-to-map
relation. AGID therefore has no eligible YE artifact, API area result or real-
data search-to-translucent-area application view.

The country-specific target is
`M2_scoped_optional_office_code_address_context_visualization`. It preserves
the two official statements without incorrectly treating optionality as zero
codes or treating an office/P.O. box code as a delivery-area polygon.

## Exact evidence supports policy only, not data coverage

Seven official references were bound to exact bytes and SHA-256. The 12-page
UPU General Addressing Issues PDF was created in August 2026; its physical page
4 labels the no-required-postcode list `Universal DataBase (Sep. 2025)` and
includes Yemen. The one-page Yemen addressing sheet is labelled March 2005
and shows `B.P. 1993 / SANA'A / YEMEN`, without a postcode field or geometry.
UPU's member page identifies `YE`, entry on 1 January 1930 and designated
operator Yemen Post.

Yemen Post describes itself as the public postal operator and claims more than
360 offices and 1,500 windows. Its office page claims a digital map, but the
reviewed map link is exactly `#`; it contains zero office rows, coordinates,
polygons, GeoJSON client or fit behavior. Its P.O. box page provides the only
reviewed postcode statement, but no exact code, format, assignment table,
edition or area geometry. A placeholder link and narrative claim cannot be
used to measure completeness, uniqueness, current validity or geographic
coverage.

| Evidence grain | Validated rows | Production polygons | M2 use |
| --- | ---: | ---: | --- |
| UPU policy/operator references | 0 | 0 | Policy and authority only |
| Yemen Post office page | 0 | 0 | Placeholder map claim only |
| Yemen Post P.O. box page | 0 | 0 | Optional office-code semantics only |

No chart is included because every measurable production row and geometry
count is zero; a chart would add no information and could imply coverage.

## Scope and authority remain deliberately separate

`postalCode` is nullable at country-address level. An exact future Yemen Post
row may establish an office/P.O. box code, but a P.O. box number remains a
separate identifier and neither value proves a surrounding postal area. Office
points, routes, administrative boundaries, address strings, buffers, Voronoi
cells, learned surfaces, synthetic Postal Forge cells and AGID cells cannot be
relabeled as official postal geometry.

Postal Code -> Polygon is unavailable for YE. Independently licensed
administrative, civic or building geometry may support typed address context,
but it keeps its own authority and never inherits Yemen Post authority by
containment. House number, premise and building display requires a separate
explicit permitted stable address-to-building relation. Personal, recipient,
customer, owner, occupant and land-rights data remain outside public AGID Git.

## Reproducible method and rights boundary

The bounded inspector verifies configured byte length, SHA-256, MIME, HTML
markers and PDF signatures. The two PDF pages relevant to the policy and Yemen
format were visually reviewed against the same hashed bytes. Raw source bodies
stay in temporary audit storage and are not committed.

UPU's copyright page requires written permission for reproduction and limits
external duplication. Yemen Post pages state all rights reserved and expose no
item-specific bulk, derivative, persistence, redistribution, immutable-
publication or public API-serving licence. These are practical evidence gaps,
not a legal conclusion. No account, authentication, application, contract,
payment, new repository, public destination or deployment was used.

## Shared map tests do not close the real-data gap

Shared deterministic tests cover exact postcode candidate resolution,
Polygon/MultiPolygon-only drawing, geometry opt-in, bounds/fit, translucent
fill, clear outline, update/removal and API failure states. YE has no eligible
real descriptor, so those shared tests cannot produce an operator-authorized
area. The shared notice also does not yet render distinct authority class,
basis date and confidence. Browser E2E is therefore not a valid substitute for
a real rights-cleared YE artifact.

## Uncertainty, retry and unblock path

The public pages may omit data that exists internally; zero published rows is
not evidence that no codes or office map exist. Recheck after the pending-
country pass and no earlier than `2026-09-05T07:44:14.000Z`, unless Yemen Post
publishes a public current rights-cleared code/address/geometry release sooner.

M2 can resume only when an exact current dataset supplies code semantics,
declared scope, stable row identity, Arabic fields, edition, validity, schema,
rights and SHA-256. Reproduce the transform and quality checks, publish an
approved immutable artifact outside AGID, then verify the actual YE loader,
API and app. Any drawable postal area must pass topology and the normalized
search, fit, translucent fill, outline, clear/re-search and provenance path.

Further questions are whether Yemen Post's mentioned code identifies only an
office, an internal routing unit or a customer-facing area, and whether its
digital office map is temporarily unlinked or intentionally restricted. These
questions cannot be answered from the reviewed public bytes.

The next country in the ledger is **AD (Andorra)**. No second country was
started in this run.
