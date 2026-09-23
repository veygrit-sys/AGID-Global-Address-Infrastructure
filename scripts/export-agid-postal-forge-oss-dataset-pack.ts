import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { AgidPostalCountryProfile } from '../src/lib/agidPostalCodeEngine';
import {
  AGID_POSTAL_FORGE_OSS_DATASET_PACK_VERSION,
  buildAgidPostalForgeOssDatasetPack,
  validateAgidPostalForgeOssDatasetPack,
} from '../src/lib/agidPostalForgeDatasetPack';

const DEFAULT_GENERATED_AT = '2026-06-20T00:00:00.000Z';

const sampleProfileOverrides: AgidPostalCountryProfile[] = [
  {
    countryCode: 'JP',
    countryName: 'Japan',
    population: 124000000,
    areaKm2: 377975,
    terrain: 'mixed',
    evidenceSources: ['official-postal-authority-required-before-bundling'],
    addressFormat: {
      countryCode: 'JP',
      name: 'Japan',
      postalCode: {
        regex: '^\\d{3}-?\\d{4}$',
        format: 'NNN-NNNN',
        source: 'Japan Post official postal code data',
      },
    },
  },
  {
    countryCode: 'VU',
    countryName: 'Vanuatu',
    population: 320000,
    areaKm2: 12189,
    terrain: 'archipelago',
    evidenceSources: ['island-first-design-review', 'carrier-pilot-required'],
    privacy: {
      addressEntitiesPerArea: 250,
      populationPerArea: 900,
      minimumAddressEntities: 50,
      minimumPopulation: 250,
    },
    dataQuality: {
      address: 0.35,
      road: 0.45,
      admin: 0.55,
      population: 0.55,
      boundary: 0.6,
      threshold: 0.7,
    },
  },
  {
    countryCode: 'ZZ',
    countryName: 'Synthetic Archipelago Example',
    population: 42000,
    areaKm2: 760,
    terrain: 'archipelago',
    evidenceSources: ['synthetic-example-only'],
    governance: {
      government: 0,
      municipality: 0,
      carrier: 0,
      platform: 0.2,
      threshold: 0.7,
    },
  },
];

function packReadme(generatedAt: string) {
  return `# AGID Postal Forge OSS Dataset Pack

Version: ${AGID_POSTAL_FORGE_OSS_DATASET_PACK_VERSION}
Generated at: ${generatedAt}

This pack is the OSS-safe distribution layer for AGID Postal Forge and AtlasWeaver AI.
It contains AGID-created metadata, country readiness records, template records, source
catalog entries, quality gates, and synthetic examples.

It does not bundle third-party postal, map, boundary, road, population, ISO, OGC, UPU,
OpenStreetMap, Overture, GeoNames, government, postal-authority, or carrier datasets.
Those sources are referenced only through metadata so downstream users can perform
license review and fetch data directly under the original terms.

## Files

- \`manifest.json\`: pack identity, version, counts, and redistribution policy.
- \`agid-postal-forge-oss-dataset-pack.json\`: complete generated pack.
- \`source-catalog.json\`: source references and license/reuse cautions.
- \`quality-gates.json\`: release gates for license, governance, privacy, data trust, collision, readability, migration, and territory boundaries.
- \`country-profile-overrides.sample.json\`: sample profile overrides for mature postal systems, weak postal systems, and synthetic countries.

## Safety Rules

- Do not treat AGID-generated postal zones as official postal codes without explicit public authority or carrier pilot approval.
- Do not replace mature Class A postal systems.
- Do not publish household-level, sensitive-facility-level, high-risk-refuge-level, or surveillance-sensitive zones.
- Do not bundle third-party datasets into this pack unless \`DATA_LICENSES.md\` says that redistribution is permitted.
- Keep AGID as the stable internal key so public postal formats can later be reshaped without losing lineage.

## Regenerate

\`\`\`bash
npm run export:postal-forge-pack
\`\`\`

## Verify

\`\`\`bash
npm run verify:postal-forge-pack
\`\`\`
`;
}

async function writeJson(outDir: string, fileName: string, value: unknown) {
  await writeFile(join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const generatedAt = process.env.AGID_POSTAL_FORGE_PACK_GENERATED_AT || DEFAULT_GENERATED_AT;
  const pack = buildAgidPostalForgeOssDatasetPack({ generatedAt });
  const validation = validateAgidPostalForgeOssDatasetPack(pack);

  if (!validation.valid) {
    throw new Error(`AGID Postal Forge OSS Dataset Pack is invalid: ${validation.errors.join(', ')}`);
  }

  const outDir = join(process.cwd(), 'data', 'postal_forge_oss');
  await mkdir(outDir, { recursive: true });
  await writeJson(outDir, 'manifest.json', pack.manifest);
  await writeJson(outDir, 'agid-postal-forge-oss-dataset-pack.json', pack);
  await writeJson(outDir, 'source-catalog.json', pack.sources);
  await writeJson(outDir, 'quality-gates.json', pack.qualityGates);
  await writeJson(outDir, 'country-profile-overrides.sample.json', sampleProfileOverrides);
  await writeFile(join(outDir, 'README.md'), packReadme(generatedAt), 'utf8');

  console.log(`AGID Postal Forge OSS Dataset Pack exported to ${outDir}`);
  console.log(`countries=${pack.manifest.counts.countries}`);
  console.log(`templates=${pack.manifest.counts.templates}`);
  console.log(`sources=${pack.manifest.counts.sourceRecords}`);
  console.log(`qualityGates=${pack.manifest.counts.qualityGates}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
