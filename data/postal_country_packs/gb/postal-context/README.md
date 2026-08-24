# `agid-postal-gb` contract seed

Status: `M1 metadata / no production United Kingdom data`

This directory is the lightweight seed for a future independent
`agid-postal-gb` repository. It contains source policy, quality gates, and
non-geographic synthetic fixtures only. It contains no PAF rows, ONSPD rows,
UPRNs, AddressBase records, real addresses, credentials, or production
geometry.

The shared resolver remains in Address-Grid-ID. A future GB repository will
publish immutable, digest-addressed packs through the same interface as Japan,
Singapore, and the Netherlands.

## Postcode geometry rule

A unit postcode such as `SW1A 1AA` is a Royal Mail routing and delivery-point
allocation. It may cover one large user or a group of usually adjacent small
user addresses. The code, its ONS coordinate, and a polygon are three different
claims.

```text
Royal Mail unit-postcode assignment
  -> licensed delivery-point address
  -> source-backed UPRN
  -> exact building relation when licensed evidence exists
  -> optional derived unit-postcode surface
  -> AGID cell cover for candidate indexing
```

The evidence stays independent:

- Royal Mail PAF is authoritative for delivery-point address and postcode
  assignment, subject to its licence.
- ONSPD relates live and terminated postcodes to coordinates and administrative
  or statistical areas. Its mean grid reference is not an exact delivery point
  or an official postcode boundary.
- OS Open UPRN supplies authoritative identifiers and coordinate references for
  addressable locations, not full address strings or building footprints.
- OS OpenMap Local contains generalized building context. A nearest-building
  match remains derived until an explicit address-to-building relationship
  supports it.
- AddressBase and detailed OS building products can support the exact
  address-to-UPRN-to-building path only under reviewed product rights.

## Derived polygon rule

Let `A_c` be the rights-cleared address points for postcode `c`, `B` a licensed
clip boundary, and `V(p)` the Voronoi cell of point `p`. A candidate surface is

```text
R_model(c) = B intersect union(V(p) for p in A_c)
```

Buffers, alpha shapes, learned boundaries, and AGID cell unions are also useful
candidate models. Every such surface remains `derived_geometry`; it never gains
Royal Mail assignment authority. A holdout set must measure address inclusion,
false inclusion, and boundary stability before promotion.

## Address display ceiling

AGID may display organization, building name/number, thoroughfare, dependent
locality, post town, postcode, public UPRN, and a building relation only when
they form one coherent source-backed path. The postcode centroid or derived
polygon alone can return postal and administrative context but cannot invent a
house number, premise, building, recipient, or deliverability status.

## United Kingdom rights partitions

ONSPD licensing requires multiple attributions. Northern Ireland postcodes
beginning `BT` additionally require Land and Property Services terms, including
a separate review for commercial reuse. The builder therefore partitions `BT`
instead of assuming Great Britain reuse rights apply across the entire UK.

Royal Mail PAF, AddressBase, and detailed building products remain licensed
partitions. Open UPRN identifiers do not make linked premium fields open.

## Production promotion

Promotion beyond M1 requires:

- reviewed PAF, AddressBase, OS building, and LPS rights by artifact and use;
- pinned ONSPD and OS releases, schemas, digests, notices, and attributions;
- explicit live, terminated, reused, no-grid-reference, large-user, PO Box,
  BFPO, Crown Dependency, and offshore handling;
- exact address-to-UPRN-to-building joins with conflicts retained;
- explicit `derived_geometry` labels and reproducible algorithms;
- independent holdout, topology, privacy, freshness, and two-refresh gates;
- no recipient, occupant, customer, credential, or private unit data in Git.

## Files

- `repository-manifest.json`: unit-postcode semantics, gates, and blockers.
- `source-profile.json`: conservative Royal Mail, ONS, OS, and LPS boundaries.
- `fixtures/united-kingdom-synthetic.json`: non-geographic conformance cases.
