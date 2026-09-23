# address-morphism-theory

Publication profile for the existing local AMT repository seed:

`reports/address-morphism-theory-review`

This profile keeps the split explicit without copying the full manuscript tree a
second time inside AGID. The seed repository is already the working local home
for Address Morphism Theory; this directory records the publication contract,
promotion gates, sources, and data-license boundaries that must be satisfied
before it becomes a public remote repository.

## Owns

- AMT I and AMT II manuscripts.
- Japanese and English paper drafts.
- Formal definitions, diagrams, and small executable theory models.
- Claim maps, verification notes, expression audits, and non-claim boundaries.
- Local manuscript assembly and PDF build scripts.

## Does Not Own

- AGID/AOID resolver runtime implementation.
- Product UI, merchant console, delivery gateway, or carrier integrations.
- Country packs, postal datasets, or gazetteer production outputs.
- Private address, recipient, witness, proof-secret, private-key, or production
  credential material.

## Migration Rule

Copy and publish first. Do not delete AGID-local AMT documents until the public
repository is available, AGID links have been updated, release scripts no longer
depend on the old paths, and release notes announce the move.

## Local Verification

Run the seed repository checks:

```powershell
python -m pip install -r reports/address-morphism-theory-review/requirements.txt
npm --prefix reports/address-morphism-theory-review run verify
```

Run the AGID repository-family check:

```powershell
npx tsx --test reports/address-research-repositories/tests/repository-family-plan.test.ts
```
