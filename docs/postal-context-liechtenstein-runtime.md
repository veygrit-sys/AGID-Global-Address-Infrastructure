# Liechtenstein Postal Context runtime

Status: `M2_current_swisstopo_plzo_li_domicile_visualization`

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

The 2026-08-11 swisstopo edition is partitioned by joining the PLZ polygon
`ZIP_ID` to CSV municipality rows. A `ZIP_ID` is admitted only when every row
uses official municipality BFS 7001-7011 and the Swiss canton field is blank.
The exact admitted set is 9485-9488 and 9490-9498. A missing canton value, a
`94xx` code, or a border clip cannot independently classify a row. CH and AT
artifacts are rejected from the LI pack.

The fixed M2 pack contains 13 official `REAL`, not-in-modification Polygon
features, 10,598 coordinates, no synthetic or invented areas, and no address
or building rows. The API normalizes the code, returns the selected Polygon
and source metadata, and the application fits the map while drawing a
0.22-opacity fill with a 0.95-opacity three-pixel outline. Clear and re-search
remove and restore the source/layers deterministically.

## Repository and runtime boundary

The country repository owns source contracts, snapshots, rights,
normalization, country filtering, lineage, validation, and release descriptors.
AGID loads a digest-pinned descriptor and serves lookup, coordinate resolution,
bbox intersection, address/building context, and AGID relations. Raw sources,
licensed products, personal fields, and private dwelling data stay outside the
AGID repository.

Environment slots use `AGID_POSTAL_CONTEXT_LI_*`. Configure the descriptor
path and expected digest from `data/postal_country_packs/li/postal-context/m2`
to load this M2 release. Synthetic packs remain tests only and never replace
the digest-pinned current artifact.
