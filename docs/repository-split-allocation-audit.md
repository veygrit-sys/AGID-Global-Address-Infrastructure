# AGID Repository Split Allocation Audit

## Conclusion

The current single-repository and multi-repository allocation is broadly correct.
It is strong enough to keep as the AGID global repository placement baseline.

The important correction is operational: the placement file should be treated as
a logical ownership plan, not as an instruction to create every GitHub repository
immediately.

Current generated placement:

- Country, territory, and polar parent units: 270
- Multi-repository countries: 46
- Single-repository countries or territories: 223
- Polar special area: 1
- Planned child repositories: 1,918
- Logical upper bound if every child were created: 2,188 repositories

This means the data model is ready for global scale, but physical GitHub
creation must be staged.

## Verdict

Use this rule:

```text
single pack:
  create now

split country with 1-8 children:
  parent repo now, children as planned logical units

split country with 9-40 children:
  parent and children can be created if maintainers exist

split country with more than 40 children:
  parent repo now, priority children first, remaining children planned

polar area:
  single area repo now

ocean:
  ocean index and five ocean repos now, sea-area repos staged
```

## What Is Good

The split list correctly captures countries where one repository would become
too large or too politically and administratively complex:

- very large address datasets: US, CN, IN, JP, ID, BR, RU
- many first-level administrative units: TR, PH, TH, DZ, RO
- high-density or high-change urban countries: KR, DE, FR, IT, ES, GB
- major delivery and postal complexity: MX, CO, KE, VN, IR

The single list is also correct as the default for most countries, overseas
territories, autonomous areas, and small island states. A single repo is easier
to review, easier to govern, and less likely to create empty abandoned child
repositories.

## Watchlist Singles

These are acceptable as single repositories now, but should be watched:

| Code | Current decision | Why it is acceptable | Split trigger |
| --- | --- | --- | --- |
| HK | single | small territory, high density can fit one pack | building data or district reviews become too large |
| AE | single | national pack is simpler before postal-zone generation matures | Dubai/Abu Dhabi data or local maintainers grow |
| NZ | single | country pack plus separate CK/NU/TK is cleaner | city or regional PR load grows |
| BE | single | small country; multilingual rules can be internal | Brussels/Flanders/Wallonia review load separates |

## Low-Child Split Watchlist

These are not wrong, but the current child plan is too small to justify many
physical repos immediately:

| Code | Current child count | Recommendation |
| --- | ---: | --- |
| PK | 5 | parent repo first; expand province/city plan before child creation |
| NG | 4 | parent repo first; likely needs state-level model later |
| ET | 4 | parent repo first; region model should mature first |
| ZA | 5 | parent repo first; province and metro split can wait |
| PE | 4 | parent repo first; region/city split needs more evidence |

These should stay as logical split plans until real datasets and maintainers are
ready.

## Large Split Countries

Countries such as PH, RU, TR, TH, DZ, US, JP, KE, VN, IN, CN, ID, RO, IR, TZ,
CD, EG, MX, and CO have more than 40 child repositories planned.

The split is justified, but physical creation should be staged:

1. Create the parent country repository.
2. Create the highest-volume state, province, prefecture, or megacity repos.
3. Keep the rest in `agid-repository-placement.json` as planned units.
4. Promote planned units to physical repos only when data volume, maintainer
   ownership, or pull-request pressure justifies it.

## Ocean And Natural Features

The ocean design is good:

- root: `agid-ocean`
- ocean repos: 5
- sea-area logical repos: 160

That fits the target range of 150 to 300 sea-area repositories.

Mountains, deserts, rivers, and lakes should not become independent repository
families by default. Store them as natural-feature packs inside country, region,
polar, or ocean-adjacent repositories with:

- name
- feature type
- bbox or centroid
- source
- confidence

If no civic or postal address exists, the fallback reference can be the feature
name plus bounded latitude/longitude region.

## AGID Compatibility

The allocation is compatible with Address Morphism Theory if every repository
keeps the same reconstruction contract:

```text
node id -> parent id -> parent id -> ... -> country or area root
       -> country or area rendering rule
       -> address / AGID / alias / quality view
```

GitHub stores small and reviewable rules:

- breadcrumb schemas
- administrative crosswalks
- postal and AGID zone rules
- normalization and translation rules
- source metadata
- synthetic conformance fixtures

External packs store heavy or sensitive material:

- building polygons
- high-resolution coordinates
- search indexes
- tiles
- OSM/Overture extracts
- carrier-only route packs
- private operational samples

## Final Decision

Keep the current single/multiple allocation.

Do not create all 2,188 logical repositories at once. Create parent repos first,
then activate child repos in waves. This keeps AGID open-source friendly,
reviewable, and compatible with global address reconstruction without turning
GitHub into a huge empty repository farm.
