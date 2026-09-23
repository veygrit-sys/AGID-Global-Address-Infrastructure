# Singapore Postal Context runtime

Status: `M2 runtime-ready / M1 Singapore data`

AGID can now load Japan and Singapore Postal Context packs independently. The
shared resolver, digest checks, LKG rollback, API, SDK, resource limits, and
privacy rules are not copied per country. Singapore contributes a country
policy, a six-digit normalizer, source/licence rules, and synthetic conformance
fixtures.

No nationwide production Singapore dataset is bundled. The contract seed is in
[`data/postal_country_packs/sg/postal-context`](../data/postal_country_packs/sg/postal-context/README.md),
the shared graph is in
[`postal-context-graph-v0.1.md`](postal-context-graph-v0.1.md), and repository
ownership remains governed by
[`postal-context-repository-boundary.md`](postal-context-repository-boundary.md).

## 1. Full code is delivery-point-first

Singapore's full postal code is six digits. The country policy normalizes NFKC
digits and insignificant whitespace to `NNNNNN`; it does not invent digits or a
hyphenated form.

The full code is modeled as an assignment rather than an area by default:

```text
six-digit code
  -> source-backed premise / block / building assertion
  -> public civic or facility address point
  -> independently sourced building footprint, when available
  -> AGID spatial reference
```

A full-code node may therefore use `geometryType: none`. Its linked public
address point may use `Point`, and an independently linked building may use
`Polygon` or `MultiPolygon`. The runtime can resolve the graph through the
address point without pretending that the postcode itself is a polygon.

The first two digits form a postal sector used for coarse sorting. Sector and
full-code geometry remain separate. A sector polygon built from points is
`derived_geometry`; it cannot prove that every point in the surface has any one
of its member six-digit codes.

## 2. Mathematical geometry

Given observed points `p_c` for full codes `c`, a clipped Voronoi partition can
be calculated easily:

\[
V_c = \{x \in B : d(x,p_c) \le d(x,p_j),\;\forall j\ne c\},
\]

where `B` is a licensed land or service boundary. This is useful as a nearest
candidate index, not as postal truth. Dense buildings, vertical units, shared
premises, PO boxes, campuses, ports, airports, and offshore sites break the
assumption that one point owns all surrounding space.

The safe compression hierarchy is:

1. Store full-code address points and graph assertions.
2. Link a footprint only when the postal, road, block/house, and building
   evidence agree.
3. Build optional sector-level derived surfaces for coarse search.
4. Store AGID cell covers or sorted cell ranges as candidate indexes.
5. Run the final answer against source geometry and graph evidence, never the
   coarse cell cover alone.

## 3. Official source boundary

The source seed intentionally keeps three legal/technical paths separate:

- SingPost publishes the six-digit address format, while its complete 6D Postal
  Code Database is described as a subscription product. A subscription receipt
  is not assumed to grant public redistribution or public API-serving rights.
- SLA describes OneMap as Singapore's authoritative national map. Search and
  Reverse Geocode currently require registration and an API token. OneMap
  responses are evidence receipts subject to the registered developer terms,
  not an automatically redistributable bulk snapshot.
- Specifically named data.gov.sg datasets can be reused under the Singapore
  Open Data Licence with attribution and limitations. A thematic dwelling or
  facility dataset must not be advertised as complete postal coverage.

Primary references:

- [SingPost parcel/address guide](https://www.singpost.com/sites/default/files/2024-06/Parcel%2520Packing%2520Guide%2520Booklet_V202405_ver7.pdf)
- [SingPost 6D Postal Code Database subscription terms](https://www.singpost.com/dam/files/documents/2026-03/Reference_Offer-Section_1.4_Postal_Services_Operations_Code%28Updated_Nov_2009%29_1.pdf)
- [OneMap API documentation](https://www.onemap.gov.sg/apidocs/)
- [OneMap Search](https://www.onemap.gov.sg/apidocs/search)
- [OneMap Reverse Geocode](https://www.onemap.gov.sg/apidocs/reverseGeocode)
- [OneMap terms of use](https://www.onemap.gov.sg/legal/termsofuse.html)
- [Singapore Open Data Licence](https://data.gov.sg/open-data-licence)

## 4. Real-time API and learning boundary

OneMap can improve freshness and candidate recall, but it does not run as an
unverified fallback inside the public Postal Context endpoint. The production
flow is:

```text
credentialed OneMap request
  -> bounded normalized receipt
  -> source and terms version + observation time
  -> exact/nearest classification
  -> holdout and conflict checks
  -> immutable candidate pack
  -> digest verification
  -> atomic activation or LKG retention
```

A learned model may rank candidates, detect source drift, or propose a sector
surface. It cannot turn nearest evidence into an exact address, raise an
unlicensed response into a redistributable artifact, or promote derived
geometry to official geometry.

## 5. Runtime configuration

Singapore uses its own active and LKG pins:

```dotenv
AGID_POSTAL_CONTEXT_SG_DESCRIPTOR_PATH=C:\absolute\path\sg-descriptor.json
AGID_POSTAL_CONTEXT_SG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_SG_LKG_DESCRIPTOR_PATH=C:\absolute\path\sg-lkg-descriptor.json
AGID_POSTAL_CONTEXT_SG_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

Japan and Singapore fail closed independently. A bad SG descriptor does not
disable JP, and an absent JP descriptor does not disable a verified SG pack.
Synthetic or experimental packs remain disabled unless the existing explicit
validation-only flags are enabled.

The same stable API accepts `countryCode: "SG"` or an `SG` path parameter:

```text
GET  /api/v1/postal/capabilities
GET  /api/v1/postal/releases/SG
POST /api/v1/postal/resolve
GET  /api/v1/postal/SG/000001
GET  /api/v1/postal/intersects?country=SG&bbox=...
```

`intersects` returns only actual public postal-area geometry. It does not return
address points or manufacture a surface for point-first six-digit codes.

## 6. Remaining production work

The truthful capability is “Singapore runtime and contract ready; nationwide
production data not complete.” The external `agid-postal-sg` work must still:

1. obtain and record any required SingPost contract rights;
2. accept and pin OneMap developer terms, keeping tokens outside Git;
3. select licence-cleared data.gov.sg datasets with attribution and measured
   feature coverage;
4. build exact postal/address/building links and preserve conflicts;
5. validate point, building, sector, PO-box, special-site, and offshore cases;
6. pass privacy, holdout, freshness, drift, correction, and two-refresh gates.
