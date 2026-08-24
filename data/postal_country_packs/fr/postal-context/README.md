# `agid-postal-fr` contract seed

Status: `M1 metadata / no production France data`

This directory is the lightweight seed for a future independent
`agid-postal-fr` repository. It contains source policy, quality gates, and
non-geographic synthetic fixtures only. It contains no La Poste rows, BAN
addresses, COG extracts, BD TOPO geometry, real addresses, or production
polygons.

The shared resolver remains in Address-Grid-ID. A future FR repository will
publish immutable, digest-addressed packs through the same country interface as
Japan, Singapore, the Netherlands, and the United Kingdom.

## France geometry rule

A five-digit `code postal` is a routing assignment, not an administrative code
or an official surface. La Poste's open dataset links postal codes to INSEE
communes, delivery labels, and line-five localities, but explicitly does not
provide postal-code boundaries.

```text
La Poste postal-code assignment
  -> code-to-INSEE-commune and delivery-locality relation
  -> BAN public address point
  -> BD TOPO explicit address-to-building link
  -> optional derived postal-code surface
  -> AGID cell cover for candidate indexing
```

The evidence stays independent:

- La Poste is authoritative for postal routing and code-to-commune relations.
- BAN is the nationally recognized public address reference and supplies
  georeferenced address localizers.
- INSEE COG is authoritative for commune, department, region, and history.
- IGN BD TOPO supplies building geometry and explicit BAN-address links.
- Commune geometry and BAN-point-generated surfaces remain administrative or
  derived geometry, never La Poste postal boundaries.

## Derived polygon rule

Let `A_c` be BAN address points carrying code `c`, `B` a rights-cleared clip
boundary, and `V(p)` a Voronoi cell. A candidate surface is:

```text
R_model(c) = B intersect union(V(p) for p in A_c)
```

A commune union is valid only as derived evidence and only when source-backed
cardinality shows the complete commune belongs to that one code. Split
communes, multi-commune codes, CEDEX, BP, CS, TSA, and poste restante stay
partial or non-areal. Every model pins input digests, algorithm, parameters,
time, and holdout results.

## Address and building display ceiling

AGID may display number, suffix, street, lieu-dit, commune, postal code, and a
building only when they form one coherent BAN/BD TOPO path. A La Poste commune
centroid, commune polygon, or derived postal surface alone cannot invent a
house number, premise, building, recipient, or deliverability status.

## Geographic and postal exceptions

- One postal code may cover multiple communes; one commune may have multiple
  postal codes.
- Corsican postal prefix `20` must not replace COG department codes `2A`/`2B`.
- Paris, Lyon, and Marseille municipal arrondissements remain distinct address
  districts.
- CEDEX and organization codes remain non-areal unless separately evidenced.
- Overseas ISO territories and Monaco are routed to separate country packs even
  if the upstream La Poste export contains them.

## Production promotion

Promotion beyond M1 requires pinned La Poste, BAN, COG, and BD TOPO releases;
exact many-to-many code/commune preservation; BAN address and explicit building
links; reproducible derived surfaces; CEDEX/special-distribution and territory
partitions; independent holdout; topology, privacy, freshness, rollback, and
two-refresh gates. Synthetic fixtures never satisfy production evidence.

## Files

- `repository-manifest.json`: postal/commune semantics, gates, and blockers.
- `source-profile.json`: conservative La Poste, BAN, IGN, and INSEE roles.
- `fixtures/france-synthetic.json`: non-geographic conformance cases.
