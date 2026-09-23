# address-research

Local template for a dedicated address research repository.

This repository should become the neutral research home for source discovery,
methodology, literature notes, open questions, license ledgers, and public
research briefs. It keeps general address research separate from:

- canonical Address Morphism Theory manuscripts,
- AGID product/runtime implementation,
- country-pack or postal-data production outputs,
- commercial carrier integration work.

## Owns

- Research agenda and roadmap.
- Official-source discovery methodology.
- Source catalog metadata and provenance ledgers.
- Literature and prior-art notes.
- Public non-claim reviews and hypothesis registers.
- Reproducible research brief templates.

## Does Not Own

- AMT canonical manuscripts.
- AGID resolver, merchant console, wallet, or delivery gateway runtime.
- UPS, DHL, or other carrier credentials or raw API payloads.
- Private address, recipient, witness, proof-secret, private-key, or production
  credential material.

## First Import Candidates

- `docs/research/`
- `docs/agid-original-database-er-sql-research-ja.md`
- `docs/research-paper-volume-separation.md`
- `docs/product/global-country-territory-research-plan.md`
- `src/lib/addressResearchSystematization.ts`
- `src/lib/addressInformationEngineeringFoundations.ts`

Each import should be reviewed before publication and labeled as verified,
hypothesis, non-claim, or source catalog metadata.

## Public Note Index

`note-classification.json` classifies every current `docs/research` note before
any material is copied. `catalog/public-note-index.json` is a deterministic,
metadata-only export: it records titles, claim labels, scopes, source hashes,
and the AMT-owned notes intentionally excluded from this repository.

```powershell
npx tsx reports/address-research-repositories/address-research/scripts/build-public-note-index.ts --check
```

Use `--write` only after changing an already reviewed classification or source
note. A successful index does not approve publication; each listed document is
still marked `review-before-publication`.

## Local Verification

```powershell
npx tsx --test reports/address-research-repositories/tests/repository-family-plan.test.ts
```
