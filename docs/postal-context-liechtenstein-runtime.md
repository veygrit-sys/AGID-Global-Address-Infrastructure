# Liechtenstein Postal Context runtime

Status: `M1_metadata`

The Liechtenstein pack joins the shared Swiss postcode system to sovereign LI
address, building, and boundary evidence without merging the two countries.

## Resolution chain

```text
Swiss Post PLZ4 assignment
  -> swisstopo LI-classified PLZO locality / PLZ6 perimeter
  -> Liechtenstein government building-address point
  -> same official building identifier or reviewed crosswalk
  -> public GWR identity + official-survey footprint
  -> LI AGID cell relation
```

The runtime accepts only structurally Liechtenstein-shaped `94xx` strings and
preserves all four digits. Structural normalization does not prove that a code
is currently allocated to Liechtenstein; a pinned source must establish that.

swisstopo publishes the official directory of localities and postcode
perimeters for Switzerland and the Principality of Liechtenstein every month.
It covers domicile-address postcode types. Special, company, administrative,
PO-box, and facility codes may have no area and never receive an invented
residential polygon.

The Liechtenstein National Administration publishes official building-address
directories, public GWR fields, sovereign boundaries, and eleven municipal
official-survey packages under attribution and license-propagation terms. An
address point or GWR coordinate is not a footprint. Exact building display
requires the same official building identifier or a reviewed crosswalk;
containment and nearest-footprint matches remain candidates.

## Country partition

Shared Swiss sources are filtered using explicit country evidence and official
LI sovereign geometry. A missing canton value, a `94xx` code, or a border clip
cannot independently classify a row. CH and AT artifacts are rejected from the
LI pack, and an LI result always receives an LI AGID relation.

## Repository and runtime boundary

The country repository owns source contracts, snapshots, rights,
normalization, country filtering, lineage, validation, and release descriptors.
AGID loads a digest-pinned descriptor and serves lookup, coordinate resolution,
bbox intersection, address/building context, and AGID relations. Raw sources,
licensed products, personal fields, and private dwelling data stay outside the
AGID repository.

Environment slots use `AGID_POSTAL_CONTEXT_LI_*`. Until a separately attested
M2+ descriptor exists, Liechtenstein remains `unconfigured`; synthetic packs
are tests only.
