# Malta Postal Context runtime

Status: `M1_metadata` contract seed and synthetic runtime conformance

Country code: `MT`
Planned country repository: `agid-postal-mt`
Canonical postcode form: `AAA NNNN`

This implementation connects a future Malta country-data repository to the
shared AGID Postal Context Graph, resolver, API routes and AGID cell output. It
does not bundle MaltaPost results, Maltese addresses or building geometry. All
executable fixtures are synthetic and cannot be promoted.

## Authority model

```text
MaltaPost postcode assignment
  -> confirmed Office of the Address Registrar addressable object and geocode
  -> explicit source relationship or reviewed building crosswalk
  -> Planning Authority Large Scale Topography building footprint
  -> OAR region/locality/street and NSO statistical context
  -> optional derived postcode surface
  -> AGID cell cover
```

MaltaPost operates the postcode finder and defines the current seven-character
postcode. The Office of the Address Registrar (OAR) is responsible for the
address and related location registers. The Planning Authority supplies public
large-scale building geometry, while NSO spatial divisions provide statistical
context. These are independent claims.

## Postcode geometry

The reviewed official sources do not establish a reusable nationwide MaltaPost
postcode polygon product. The runtime therefore uses `address-range-first`
semantics. MaltaPost's finder accepts street, locality and household information,
so an operator result is assignment evidence for the supplied address, not proof
of a surrounding area.

An experimental surface may be generated from a pinned, confirmed set of OAR
address points or ranges:

```text
D(c, r, m) = MaltaTerritory ∩ Model_m(ConfirmedAddresses(c, r))
```

where `r` is the exact confirmed release and `m` records the generation method
and parameters. The output must be `derived_geometry`, carry accuracy and source
digests, and be served only on explicit geometry opt-in. It never becomes a
MaltaPost boundary. P.O. Box and facility codes remain non-areal unless separate
authoritative geometry exists.

## Address register transition

The OAR was established under the Address Register and related Location
(Geospatial) Registers Regulations and assumed the former Address Management
Unit responsibilities. Address information moved to `address.gov.mt` from
1 January 2026. The regulations describe addresses, addressable objects,
geocodes, buildings and doors/entry points.

The National Data Portal also warns that its current contents are works in
progress and should not be treated as official records without confirmation.
AGID therefore promotes an OAR address only from a confirmed release or explicit
confirmation receipt. Gazette lineage, identifier, status and valid/known time
remain attached during the transition.

## Address and building display

A confirmed public address may expose region, locality, local council, official
street, door number, public building name, postcode and public geocode. These
components do not identify a Planning Authority footprint by themselves.

The Planning Authority's Large Scale Topography Buildings dataset supplies
Buildings 2D through WFS/WMS. Exact building display requires a shared source
identifier or reviewed explicit crosswalk from the confirmed addressable object.
Containment and nearest-distance matches stay `candidate_building`. Building
geometry does not prove ownership, occupancy, a cadastral boundary or delivery.

## Sources and rights

Primary official sources are:

- [MaltaPost Postcode Finder](https://www.maltapost.com/postcode/?l=1) for
  current individual postcode assignment;
- [Office of the Address Registrar](https://address.gov.mt/) for address, door,
  street, locality and region governance;
- [Address Register metadata](https://portal.data.gov.mt/data-service/about/address-register)
  for register status and legal basis;
- [Address Register regulations](https://legislation.mt/eli/sl/546.4/eng) for the
  addressable-object and location-register model;
- [Planning Authority Buildings 2D](https://portal.data.gov.mt/dataset/large-scale-topography-buildings)
  for building geometry;
- [NSO Maps](https://nso.gov.mt/maps/) for statistical geography.

MaltaPost query receipts require automation and redistribution review. OAR
records require confirmation and field-level terms. The Planning Authority
dataset is cataloged under CC BY 4.0, but its portal metadata flags personal-
information presence, so public fields must be allow-listed. Visibility in a
portal is never treated as permission to publish every field.

## Privacy boundary

Electoral-register, person-register, resident, household, owner, identity-card,
recipient, forwarding, customer, shipment and non-public unit information are
excluded from public artifacts. Public address context must not be enriched from
those registers merely because they contain an address string.

## Runtime behavior

`normalizeMaltaPostalCode` accepts Unicode-width letters and digits, uppercases
letters, accepts compact or spaced input, returns `AAA NNNN`, and rejects
hyphens. The four-digit suffix remains a string so leading zeroes survive.

The shared API supports:

```text
POST /api/postal/resolve
GET  /api/postal/MT/{postcode}
GET  /api/postal/intersects?country=MT&bbox=...
```

Derived geometry is omitted by default and returned only after explicit GeoJSON
opt-in. Coordinate resolution reaches building level only through a definitive
address-to-building graph edge. AGID remains cover/index evidence and
`canonicalPostalGeometry` remains false.

## Promotion gates

M2 requires reproducible, rights-reviewed MaltaPost receipts, confirmed OAR
records and pinned PA/NSO snapshots. M3 also requires canonical normalization,
complete postcode classification, address confirmation, derived-surface
topology, 100% precision for promoted building links, privacy review and an
independent holdout. M4 requires two source refreshes through the same gates.
Synthetic fixtures never contribute to production maturity.
