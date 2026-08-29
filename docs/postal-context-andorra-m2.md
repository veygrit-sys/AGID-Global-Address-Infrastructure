# Andorra Postal Context M2 review

## AD is M2 blocked; its codes are road assignments, not parish polygons

AD remains **M2 blocked**. Ten official references establish the `ADNNN`
format, two-operator context, seven geographic zones and historical assignment
of a postcode to each thoroughfare. They do not publish a current complete
road/address assignment table or a reusable Andorra postal Polygon/MultiPolygon.
AGID therefore has no eligible AD artifact, API area response or real-data
search-to-translucent-area application result.

The country-specific target is
`M2_current_road_assigned_postal_area_visualization`. It requires current
complete assignments and exact official or reproducibly derived geometry; it
does not permit a parish boundary, address point or building footprint to be
renamed as a full-code postal area.

## Exact evidence establishes semantics and a controlled market

The two-page UPU sheet is labelled September 2004. It makes `AD` part of the
five-character postcode, identifies La Poste and Correos, and shows `AD501`,
`AD700` and `AD500`. Its `AD501` example and both operators' `AD500` contacts
show why a simple one-code-per-parish polygon is unsafe.

UPU's 2005 Union Postale article records seven geographic zones, an upgraded
government road database and a postcode assigned to every thoroughfare. The
system entered use in September 2004 for businesses and October 2004 for
individuals. The completed database was distributed to major mailers, other
Posts and the UPU POST*CODE database. This is implementation history, not a
current open dataset or area geometry release.

Correos's current page states that its basic database contains all postcodes
in Spain and Andorra. It requires a contract and currently shows EUR 831.80
for quarterly updates. Its cartographic overlay is EUR 5,445 with quarterly
updates or EUR 4,500 without them. The licence limits use to the contractor's
own database/address quality, prohibits sublicensing and prohibits a public
postcode search for unrelated users. The same page describes the overlay as
all postcodes "in the country" and uses Spanish national sources; it does not
expressly state that the overlay includes Andorra. Basic-row coverage cannot
be transferred to polygon scope by assumption.

| Evidence grain | Current eligible rows | Postal polygons | M2 use |
| --- | ---: | ---: | --- |
| UPU format and 2005 implementation history | 0 | 0 | Semantics/history only |
| Correos paid basic database and overlay offer | 0 | 0 | Controlled product/rights only |
| Govern address, OGC and topographic pages | 0 | 0 | Address/admin/building context only |

No chart is included because all eligible production row and geometry counts
are zero; a chart would imply measured coverage that the evidence cannot
support.

## Government map tools do not close the rights or geometry gaps

IDE Andorra documents WMS, WFS and OpenLS services and an Urban Guide that can
search postal addresses. The OpenLS demo includes address examples with
`AD500` and `AD400`; these are address/geocoder evidence, not surrounding
postal areas. The Urban Guide's ability to draw user points, lines and
polygons is an editing tool, not operator postal boundary authority.

The topographic 1:5,000 product can supply general terrain or building shapes,
but a building shape has no postal authority without an explicit relation.
The download portal requires user details and acceptance of use conditions;
none were submitted or accepted. The reviewed website legal notice limits
content to private/personal use and prohibits commercial use. These are
practical publication gates, not a legal opinion.

## Authority separation is non-negotiable

An independently permitted parish polygon may be administrative context or a
clip. It cannot be the official geometry for `AD500` or `AD501`. A permitted
address point may prove an address/code relation but remains a point. A
derived surface would need complete rights-cleared member addresses or road
segments, a deterministic method, omissions and uncertainty, and must remain
`derived`, never `official`.

House numbers and buildings require a separate permitted stable
address-to-building relation. Containment, nearest footprint, buffers,
Voronoi cells, learned surfaces, AGID cells and user-drawn geometry do not
supply that relation. Addressees, customers, owners, occupants and land-rights
records remain outside public AGID Git.

## Reproducible review and application status

The bounded inspector verifies byte length, SHA-256, MIME, HTML markers and PDF
signatures for all ten references. UPU physical pages 1-2 and 19-20 were
reviewed against the same hashed bytes. Raw bodies stayed in temporary audit
storage and are not committed. No account, authentication, contract, payment,
conditions acceptance, new repository, public destination or deployment was
used.

Shared deterministic tests cover exact candidate resolution,
Polygon/MultiPolygon-only drawing, geometry opt-in, bounds/fit, opacity-0.22
fill, opacity-0.95 width-3 outline, update/removal and API failure states. AD
has only metadata and synthetic fixtures, so shared tests cannot produce an
operator-authorized area. Browser E2E would be synthetic and is therefore not
claimed as country M2 evidence.

## Uncertainty, retry and unblock path

The Correos overlay may cover Andorra under a contract not visible on the
public page, and the government catalog may contain a dataset with separate
conditions. Recheck only after the pending-country pass and no earlier than
`2026-09-05T08:18:45.000Z`, unless a public current rights-cleared release
appears sooner. Purchasing/accepting Correos or Govern terms requires explicit
approval and a separate rights review.

M2 can resume when a source supplies current complete ADNNN-road/address
assignments, stable row identity, edition, validity, schema, reuse/derivative/
redistribution/API rights and SHA-256. Reproduce and validate official or
clearly derived Polygon/MultiPolygon, publish an approved immutable artifact
outside AGID, then verify the actual AD loader, API and app search, fit,
translucent fill, outline, clear/re-search and provenance fields.

Further questions are whether Correos's overlay contract explicitly includes
Andorra, whether full codes remain road-level, and whether Govern will grant a
bulk current address/code crosswalk with public derivative/API rights. The
next country is **AL (Albania)**; no second country was started.
