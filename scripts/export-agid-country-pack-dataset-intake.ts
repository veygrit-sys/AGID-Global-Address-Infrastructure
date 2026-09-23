import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  AGID_COUNTRY_PACK_DATASET_INTAKE_SCHEMA_ID,
  buildAgidCountryPackDatasetIntakePlan,
  validateAgidCountryPackDatasetIntakePlan,
  type AgidCountryPackDatasetIntakePlan,
} from '../src/lib/agidCountryPackDatasetIntake';

const OUTPUT_ROOT = join(process.cwd(), 'data', 'postal_country_packs');
const GENERATED_AT = process.env.AGID_COUNTRY_PACK_DATASET_INTAKE_GENERATED_AT || '2026-06-29T00:00:00.000Z';

async function writeJson(fileName: string, value: unknown) {
  await writeFile(join(OUTPUT_ROOT, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function markdownSummary(plan: AgidCountryPackDatasetIntakePlan) {
  const p0Rows = plan.records
    .filter(record => record.priority === 'P0')
    .map(record => `| ${record.countryCode} | ${record.countryName} | ${record.datasetClass} | ${record.stage} | ${record.sourceReadiness} | ${record.packRepositoryName || '-'} |`)
    .join('\n');

  return `# AGID Country Pack Address Dataset Intake

Schema: ${AGID_COUNTRY_PACK_DATASET_INTAKE_SCHEMA_ID}
Generated at: ${plan.generatedAt}

This file tracks the address-dataset work needed for AGID country packs. It is
not a raw address database. It is a source, license, fixture, and readiness plan
for safe country-pack production.

## Summary

- Total countries: ${plan.summary.totalCountries}
- P0 countries: ${plan.summary.p0Countries}
- Generated pack countries: ${plan.summary.generatedPackCountries}
- Valid pack countries: ${plan.summary.validPackCountries}
- Source-catalog-only countries: ${plan.summary.sourceCatalogOnlyCountries}
- Countries needing normalized official municipality datasets: ${plan.summary.normalizedOfficialMunicipalityNeeded}

## P0 Dataset Batch

| Code | Country | Class | Stage | Source readiness | Pack repo |
| --- | --- | --- | --- | --- | --- |
${p0Rows}

## Safety Rules

- Do not bundle personal addresses.
- Do not bundle recipient names, phone numbers, AGID-S payloads, proof codes, or
  private AOID bodies.
- Do not bundle raw third-party datasets until redistribution rights are
  recorded in the country pack license ledger.
- Strong-postcode countries use country packs as supplemental validation, not
  replacements for official postal authorities.
- No-postcode countries prioritize AGID planning cells, postal-equivalent
  candidates, and route evidence slots.
`;
}

async function main() {
  const plan = buildAgidCountryPackDatasetIntakePlan({ generatedAt: GENERATED_AT });
  const validation = validateAgidCountryPackDatasetIntakePlan(plan);
  if (!validation.valid) {
    throw new Error(`AGID country pack dataset intake plan is invalid: ${validation.errors.join(', ')}`);
  }

  await mkdir(OUTPUT_ROOT, { recursive: true });
  await writeJson('dataset-intake-plan.json', plan);
  await writeFile(join(OUTPUT_ROOT, 'dataset-intake-plan.md'), markdownSummary(plan), 'utf8');

  console.log('AGID country pack dataset intake export complete');
  console.log(`countries=${plan.summary.totalCountries}`);
  console.log(`p0=${plan.summary.p0Countries}`);
  console.log(`output=${join(OUTPUT_ROOT, 'dataset-intake-plan.json')}`);
  if (validation.warnings.length) {
    console.log(`warnings=${validation.warnings.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
