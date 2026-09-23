# AGID Postal Forge OSS Dataset Pack

Version: agid-postal-forge-oss-dataset-pack-v0.1
Generated at: 2026-06-20T00:00:00.000Z

This pack is the OSS-safe distribution layer for AGID Postal Forge and AtlasWeaver AI.
It contains AGID-created metadata, country readiness records, template records, source
catalog entries, quality gates, and synthetic examples.

It does not bundle third-party postal, map, boundary, road, population, ISO, OGC, UPU,
OpenStreetMap, Overture, GeoNames, government, postal-authority, or carrier datasets.
Those sources are referenced only through metadata so downstream users can perform
license review and fetch data directly under the original terms.

## Files

- `manifest.json`: pack identity, version, counts, and redistribution policy.
- `agid-postal-forge-oss-dataset-pack.json`: complete generated pack.
- `source-catalog.json`: source references and license/reuse cautions.
- `quality-gates.json`: release gates for license, governance, privacy, data trust, collision, readability, migration, and territory boundaries.
- `country-profile-overrides.sample.json`: sample profile overrides for mature postal systems, weak postal systems, and synthetic countries.

## Safety Rules

- Do not treat AGID-generated postal zones as official postal codes without explicit public authority or carrier pilot approval.
- Do not replace mature Class A postal systems.
- Do not publish household-level, sensitive-facility-level, high-risk-refuge-level, or surveillance-sensitive zones.
- Do not bundle third-party datasets into this pack unless `DATA_LICENSES.md` says that redistribution is permitted.
- Keep AGID as the stable internal key so public postal formats can later be reshaped without losing lineage.

## Regenerate

```bash
npm run export:postal-forge-pack
```

## Verify

```bash
npm run verify:postal-forge-pack
```
