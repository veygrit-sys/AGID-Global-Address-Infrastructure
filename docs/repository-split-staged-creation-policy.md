# Repository Split Staged Creation Policy

AGID keeps global repository allocation complete before it creates every
physical GitHub repository.

The project may plan continent, ocean, country, territory, region, city, sea,
and special-area repositories as logical nodes. A logical node becomes a
physical GitHub repository only when it has enough public value to avoid looking
like an empty placeholder.

## Create Immediately

Create these repositories early:

- continent and region indexes
- ocean root and five ocean indexes
- country or territory parents that have a clear maintainer, source policy,
  postal status, quality gates, and no-raw-address boundary
- independent theory or SDK repositories with runnable verification

## Keep Logical Until Ready

Keep these as planned records until evidence justifies creation:

- city or province child repositories without maintainers
- sea, gulf, bay, strait, and inlet repositories without source-boundary review
- postal-zone packs without source and license policy
- natural geography packs without scale pressure
- disputed or special regions without display-policy review

## Promotion Gates

A logical repository can be promoted when it has:

- a README that explains scope and non-goals
- `manifest.json`, `sources.json`, `quality-gates.json`, and license notes
- no raw personal address, recipient, witness, proof secret, or private-key
  material
- a breadcrumb reconstruction or parent-link policy
- source and data license notes
- at least one local or GitHub validation path
- a maintainer or review owner

## Why This Matters

Creating hundreds of empty repositories weakens open-source trust. Staged
creation lets AGID show a complete world model while making only useful,
reviewable, and safe repositories public.

The rule is:

```text
Complete world design first.
Create physical GitHub repositories only when the repository can stand alone.
```
