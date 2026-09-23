# Niger Postal Context runtime

Status: `M1_metadata` contract seed and synthetic runtime coverage. No upstream
Niger Poste rows, real addresses, personal data, land records or production
geometry are bundled.

## Authority model

The current Niger Poste directory publishes four columns of meaning through
three fields: four-digit code, locality and region. The dated March 2005 UPU
sheet places the code to the left of the locality and describes digit 1 as the
region and the remaining digits as the post office. Current published rows use
region digits 1 through 8.

The following implications are intentionally strict:

- `normalizeNigerPostalCode` validates only the current four-digit shape;
- a current official row is required to assert a routing assignment;
- a row does not contain coordinates or a canonical boundary;
- a locality, administrative region or agency point is context, not a postcode
  polygon;
- buffers, Voronoi cells, learned surfaces and AGID covers remain derived;
- address and building resolution require evidence independent of the postcode.

The dated UPU sheet says that deliveries were made only to P.O. Boxes. Niger
Poste now advertises P.O. Box, parcel and home-delivery services. The old sheet
therefore governs dated formatting context, not current service availability.

## Source partitions

| Partition | Authority | Public-pack rule |
|---|---|---|
| Niger Poste code observations | Official routing assignment | Pin source, terms, digest, parser and observation time; no bulk mirror without rights |
| Niger Poste agency observations | Official office identity | No catchment, customer, holder or building inference |
| UPU 2005 addressing sheet | Dated format semantics | No live assignment or current-service claim |
| IGN.N products | Official geographic or land context | Product-specific contract, licence, vintage and CRS; never postal authority |
| Civic address and building | Dataset-specific | Exact relation and field rights required |
| OSM candidates | Community ODbL | Separate attributed partition |
| Derived and virtual candidates | AGID/model output | Explicitly noncanonical |
| Private and query data | Controlled | Never part of a public country pack |

## Geometry policy

For a postcode `c`, an official routing observation may assert:

`c -> locality -> region`

It does not establish a measurable region `R_c`. Until Niger Poste publishes an
authorized geographic definition or an issuer-authorized boundary crosswalk,
the canonical geometry is:

`G_official(c) = none`

A derived candidate may be computed for search, for example from validated
delivery observations or AGID cells:

`R_derived(c, t, m) = f(observations_t, administrative_context_t, method_m)`

but every result must retain `authority=derived`, method, parameters, training
or observation cut-off, uncertainty, licence lineage and validity time. It may
never be serialized as an official Niger Poste polygon.

When several candidates overlap, the API returns ambiguity rather than silently
choosing the nearest feature. Exact point-in-polygon is applied only to geometry
that actually exists in the selected authority partition.

## Address and building resolution

The display hierarchy is:

`country -> region -> department -> commune -> locality/quarter -> postcode`

then, only when separately supported:

`explicit civic address point -> explicit address-building relation -> building`

P.O. Box identifiers and physical street addresses are separate delivery modes.
A postcode, office name, administrative containment, land parcel, nearest road,
text similarity or model score cannot on its own produce a door, entrance,
premise or building. Person-linked address data, box holders, recipients,
residents, owners and occupants are excluded from public artifacts.

## AGID crosswalk

AGID is a candidate index, cache key and interoperability crosswalk. Store the
relationship with explicit role and time:

`postal-observation -> derived-cover -> AGID cell set`

An AGID cell does not become a Niger Poste code, postcode boundary,
administrative unit, land parcel, civic address or building. Exact geometry is
still returned from the governing source partition when licensed.

## API behavior

The shared endpoints support Niger without country-specific route code:

- `POST /api/postal/resolve` accepts `countryCode: "NE"`;
- `GET /api/postal/NE/:postcode` normalizes the current four-digit shape;
- `GET /api/postal/intersects?country=NE&bbox=...` searches only admitted
  postal geometry.

In the M1 synthetic pack, postcode lookup returns context and an empty geometry
array. Bbox lookup returns `no_match`. Coordinate resolution reaches a building
only through an explicit synthetic civic-address relation.

## Realtime, models and compression

Live calls are ingestion observations, not invisible fallbacks. A receipt must
include source URL, terms/version, payload digest, observation time, valid time,
parser version, selected fields, quality state and expiry. A source outage or
unverified response degrades to stale or unavailable; it does not create a new
official fact.

Models may rank code candidates, detect source drift, estimate uncertainty and
propose derived surfaces. Production promotion still requires authoritative
assignment evidence and, independently, authorized geometry evidence. Training
data must be rights-cleared and time-sliced so a future observation cannot leak
into historical validation.

Compact lookup may use a minimal perfect hash or finite-state structure for
code-to-row offsets. Spatial candidates may use PMTiles, FlatGeobuf or Parquet
with AGID cell covers. Compression must preserve exact codes, source and terms
digests, validity intervals, authority, uncertainty and correction history.

## Hosting

Cloudflare Workers/R2 may serve the API and digest-pinned public artifacts.
Hugging Face may host rights-cleared public datasets, reproducible derived
models and evaluation cards. Neither target receives restricted IGN.N products,
person-linked addresses, box-holder records, private building relations, raw
queries or artifacts with unresolved redistribution rights.

## Promotion checklist

1. Pin the current Niger Poste page and terms, without committing copied rows.
2. Obtain field-level extraction, caching and redistribution approval.
3. Reconcile code, locality and region observations with explicit valid time.
4. Keep agency identity independent from catchment geometry.
5. License each IGN.N product and preserve edition, CRS and digest.
6. Admit a postcode polygon only through explicit issuer-authorized geography.
7. Require a rights-cleared civic point and explicit building relation for
   building display.
8. Apply HAPDP purpose, proportionality, security, retention and redaction
   controls.
9. Keep ODbL, restricted, derived, synthetic and query partitions isolated.
10. Pass ambiguity, holdout, freshness, rollback and correction tests twice
    before `M4_stable`.

## References

- Niger Poste postal codes: <https://nigerposte.ne/code-postal/>
- Niger Poste agencies: <https://nigerposte.ne/agences/>
- UPU Niger addressing sheet: <https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/nerEn.pdf>
- Institut Géographique National du Niger: <https://ignniger.org/domaines-de-competences-de-lign-n.html>
- HAPDP national legislation: <https://www.hapdp.ne/legislation-nationale>
