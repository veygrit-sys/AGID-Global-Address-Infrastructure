# Address Research Repository Family

This directory defines local, publication-safe repository blueprints for the
address research work that is currently spread across the AGID workspace.

It does not create remote GitHub repositories. Remote creation still requires
the repository creation preflight in `src/address/repositoryCreationPreflight.ts`
and an explicit user request for that exact remote action.

## Concrete Local Templates

| Repository | Status | Purpose |
| --- | --- | --- |
| `address-morphism-theory` | publication profile | Promote the existing local AMT repository seed at `reports/address-morphism-theory-review` into the canonical public theory repository. |
| `address-research` | new local template | Hold research agenda, source catalogs, methodology, non-claim reviews, and public-good research briefs that do not belong in product code or a theory manuscript repo. |

## Planned Specialized Repositories

These are logical only until they pass the staged creation policy:

- `address-morphism-benchmarks` for synthetic executable theory and quality fixtures.
- `address-source-catalog` for source metadata, license ledgers, and public research intake.
- `address-quality-research` for address quality methodology, evaluation rubrics, and public non-claims.

## Address Information Engineering Domains

The attached research model is now materialized as 16 local domain repository
starters: four groups of four domains. The existing `address-morphism-theory`
profile is reused; the remaining 15 starters live in `domains/` and are
generated from `address-information-engineering-domains.json`.

```powershell
npx tsx reports/address-research-repositories/scripts/scaffold-address-information-engineering-repositories.ts --check
```

These are local-only repository roots. Each needs reviewed public material,
license metadata, and a named maintainer or review owner before any remote
creation preflight can be considered.

## Verification

Run:

```powershell
npx tsx --test reports/address-research-repositories/tests/repository-family-plan.test.ts
```

The verification checks that each local template has README, manifest, source,
quality-gate, and data-license files, and that the family plan records no remote
creation action.
