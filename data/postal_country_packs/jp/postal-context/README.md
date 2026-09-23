# `agid-postal-jp` contract seed

This directory is a lightweight contract seed for a future, separate
`agid-postal-jp` repository. It is not a Japan postal dataset and is not a
production API bundle.

It contains only source metadata, contract rules, promotion gates, and synthetic
fixtures. No Japan Post rows, ABR rows, municipal address records, PLATEAU
features, registry-map parcels, GSI features, real addresses, or personal data
are bundled.

## Core model

The repository models address context as a graph rather than a strict tree:

```text
postal code --serves--> ABR town/aza
                            |--contains--> civic block --addressed by--> residence number
                            `--contains--> parcel <--located on-- building
```

Postal codes can serve multiple towns, towns can be split by number ranges, a
building can occupy multiple parcels, and one residence number can apply to
multiple entrances or buildings. A cadastral land number (`地番`) and a civic
residence number (`住居番号`) are different identifiers and must never be
substituted for one another.

Every assertion keeps two authority dimensions:

- `assignment_authority`: who assigned the postal code, town ID, civic address,
  or cadastral identifier;
- `geometry_authority`: who supplied the boundary, parcel, building outline, or
  point used to represent it.

For example, a postal code may have an official Japan Post assignment while its
polygon is still `derived_geometry`. A PLATEAU building may have authoritative
published geometry while its postal or residence-number assignment remains
unknown.

## Source roles

| Source class | Intended role | Never proves by itself |
| --- | --- | --- |
| Japan Post postal data | Official postal-to-locality and large-user assignment | Postal polygon, building, house number, deliverability |
| Digital Agency ABR | Canonical municipality and town/aza ID and name | Current national lower-level geometry or postal assignment |
| Municipality or special ward | Civic block, residence number, effective notice | Cadastral equivalence or national coverage |
| Project PLATEAU | Building footprint/3D and source-present name/address | Postal or civic assignment; missing building name |
| Ministry of Justice registry map | Parcel geometry and land number | Residence number, building identity, deliverability |
| GSI fundamental data | Mapping geometry and alignment support | Postal/civic assignment or automatically redistributable output |

The exact redistribution decision belongs to each pinned source release, not to
the provider name alone. `source-profile.json` defines conservative classes and
the required artifact partitions.

## Postal-region construction

A town polygon may be dissolved into a postal region only when the postal
assignment covers the whole town. Partial-town, number-range, floor-range, and
named-exception records require smaller licensed atomic geometry. If that
evidence is absent, the result remains `partial_unknown`, a point, or no
geometry; the pipeline must not fill the gap with an authoritative-looking
Voronoi polygon.

Large-user postal codes are organization assignments. They may be linked to a
building only after a separately licensed building match, and never become a
neighborhood polygon.

## Promotion

The seed is `M1_metadata`. Synthetic fixtures can test behavior but can never
promote a production dataset.

Production promotion requires, at minimum:

- pinned source releases, checksums, terms, attribution, and transformation
  lineage;
- explicit `assignment_authority` and `geometry_authority` on every assertion;
- classification of every postal source record, including partial-town and
  large-user exceptions;
- 100% valid published geometry;
- at least 99.5% ABR town linking for classifiable regular records;
- independent holdout results of at least 98% top-1 and 99.5% top-k for a
  `stable` postal polygon layer;
- at least 95% of promoted residence-entrance/building links contained by or
  within 15 metres of the licensed building geometry;
- manual review for material feature-count or covered-area drift;
- two consecutive clean refreshes before `M4_stable`.

If municipal lower-level data is not cleared for publication, the resolver must
stop at the last supported town or block level. It must not infer a residence
number, parcel-to-address equivalence, unit, occupant, or building name.

## Files

- `repository-manifest.json`: repository boundary, authority vocabulary,
  exception rules, quality gates, and maturity stages.
- `source-profile.json`: metadata-only roles and conservative redistribution
  treatment for Japan Post, ABR, municipalities, PLATEAU, MOJ, and GSI.
- `fixtures/tokyo-synthetic.json`: Tokyo-like, non-geographic synthetic contract
  cases for regular, partial-town, large-user, residential-display, and
  cadastral behavior.

When the external repository is created, copy this contract as a seed, add a
schema and verifier, and keep real source snapshots and generated release
artifacts outside this AGID country-pack directory.
