# AGID Core Data Production Loop

## Purpose

The AGID core data loop tracks production of the global address repository
units: country packs, territory packs, autonomous-region packs, disputed-area
packs, polar packs, and child repositories for large countries or megacities.

The loop is intentionally small and local. It does not fetch external networks
or store raw personal addresses. It only records which safe repository unit
should be produced next and how many units remain.

## Source of Truth

The loop reads:

```text
data/global_entities/agid-repository-placement.json
```

This placement file is Asia-first and includes all continent indexes. Large
countries can contribute more than one production unit because the parent
country index and each child repository must be tracked separately.

Current production unit classes:

- `country-or-territory-pack`
- `country-index`
- `child-pack`

## Commands

Preview the next unit and remaining counts:

```bash
npm run data:core-loop
```

Record the next planned unit in the ledger:

```bash
npm run data:core-loop:write
```

Mark one unit complete and update remaining counts:

```bash
tsx scripts/agid-core-data-production-loop.ts --write --mark-complete=agid-country-jp
```

The ledger is written to:

```text
reports/agid-core-data-production-ledger.jsonl
```

## Current Count Model

The loop counts production units, not only ISO-like countries.

For example, a large country can count as:

```text
agid-country-cn
agid-cn-bj
agid-cn-sh
agid-cn-gd
...
```

This keeps the remaining count honest for countries where one repository would
be too large to maintain.

After the initial multi-repo review, the generated placement currently expands
to `459` production units. This is based on `272` country/territory/polar units
plus child repositories for countries that should not start as a single large
repository.

## Initial Multi-Repo Countries

Start these countries as parent index repos plus child repositories:

- North America: `US`, `CA`, `MX`
- South America: `BR`, `AR`, `CO`, `PE`
- Europe: `GB`, `FR`, `DE`, `IT`, `ES`, `PL`, `UA`, `RU`
- Asia: `CN`, `IN`, `JP`, `ID`, `PK`, `BD`, `IR`, `TR`, `SA`, `PH`, `VN`, `TH`, `MY`, `KR`
- Africa: `NG`, `ET`, `ZA`, `EG`, `KE`, `TZ`, `DZ`, `CD`
- Oceania: `AU`

Keep these countries as single-country packs for now, but watch for later
split evidence:

- `CL`
- `RO`
- `SE`
- `NZ`

The watchlist can be promoted later when source volume, building density,
community PR volume, or region-specific maintenance pressure justifies it.

## Privacy Boundary

Core data units may contain:

- repository ownership metadata
- breadcrumb node schemas
- address format rules
- source metadata
- quality scores
- safe conformance fixtures
- AGID identifiers and parent ids

Core data units must not contain:

- raw personal addresses
- recipients
- phone numbers
- emails
- private keys
- proof witnesses
- precise private coordinates

Heavy geometry, OSM/Overture extracts, tiles, search indexes, and caches stay in
external packs, not in the app bundle.

## Completion Policy

A unit should only be marked complete when it has:

1. repository name and ownership rule;
2. breadcrumb schema and parent reconstruction rule;
3. country or territory address format rule;
4. source/license metadata;
5. quality and evidence status;
6. no-raw-address release check compatibility;
7. at least one safe public conformance fixture or explicit reason why fixtures
   are deferred.

If a unit is weak or disputed, it should still be produced, but with
`Partial`/`Manual required` quality status rather than pretending to be verified.
