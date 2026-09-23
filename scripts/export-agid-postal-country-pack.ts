import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  AGID_POSTAL_COUNTRY_PACK_VERSION,
  buildAgidPostalCountryPack,
  listAgidPostalCountryPackTargetCountries,
  validateAgidPostalCountryPack,
  type AgidPostalCountryPack,
} from '../src/lib/agidPostalCountryPack';
import {
  validateOfficialMunicipalityDataset,
  type OfficialMunicipalityDataset,
} from '../src/lib/officialMunicipalityDataset';

const DEFAULT_GENERATED_AT = '2026-06-20T00:00:00.000Z';
const DATA_ROOT = join(process.cwd(), 'data', 'postal_country_packs');
const OFFICIAL_MUNICIPALITY_ROOT = join(process.cwd(), 'data', 'official_municipalities');

function countryPackReadme(pack: AgidPostalCountryPack) {
  return `# ${pack.manifest.repositoryName}

Version: ${AGID_POSTAL_COUNTRY_PACK_VERSION}
Country: ${pack.countryProfile.countryName} (${pack.manifest.countryCode})
Generated at: ${pack.manifest.generatedAt}
Official status: ${pack.manifest.officialStatus}

This is an AGID Postal Country Pack for AGID Postal Forge. It contains
AGID-created country metadata, stable locality IDs, locality aliases, landform
slots, settlement clusters, VPL seeds, postal-system priors, source metadata,
license metadata, privacy rules, and conformance test vectors.

It is not an official postal authority dataset. For mature postal countries,
this pack is a reference and compatibility layer around official postal systems,
not a replacement. For weak or no-postal countries, generated postal zones
remain simulation or draft until public authority, local review, carrier pilot,
data trust, privacy, and transition gates are satisfied.

## Files

- \`manifest.json\`: pack identity, required layers, counts, and safety flags.
- \`agid-postal-country-pack.json\`: complete generated country pack.
- \`source-catalog.json\`: source slots and license/reuse cautions.
- \`locality-index.json\`: stable non-personal locality IDs and aliases.
- \`planning-cell-index.json\`: synthetic AGID planning cells for postal-zone design.
- \`route-evidence-index.json\`: route, ferry, port, and corridor evidence slots.
- \`quality-evidence-index.json\`: address, boundary, route, and population quality slots.
- \`official-municipality-summary.json\`: official municipality source coverage status.
- \`license-ledger.json\`: redistribution status by source class.
- \`test-vectors.json\`: no-raw-address conformance examples.

## Safety Rules

- Do not store personal addresses, recipient names, phone numbers, private AOID
  bodies, AGID-S payloads, proof codes, or raw third-party datasets.
- Do not publish household-level or sensitive-facility-level public codes.
- Keep visible postal codes scoped to one municipality.
- Preserve stable locality IDs when names change.
- Keep source metadata separate from raw official or third-party datasets unless
  \`DATA_LICENSES.md\` explicitly allows redistribution.

## Regenerate

\`\`\`bash
npm run export:postal-country-pack
\`\`\`

To generate another recommended country pack:

\`\`\`bash
$env:AGID_POSTAL_COUNTRY_CODE="VU"; npm run export:postal-country-pack
\`\`\`

To generate every Postal Zone Designer target country pack:

\`\`\`bash
npm run export:postal-country-pack:all
\`\`\`
`;
}

function countryPackIndexReadme(packs: AgidPostalCountryPack[]) {
  const countries = packs
    .map(pack => `- ${pack.manifest.countryCode}: ${pack.countryProfile.countryName} (${pack.manifest.repositoryName})`)
    .join('\n');

  return `# AGID Postal Country Packs

Version: ${AGID_POSTAL_COUNTRY_PACK_VERSION}
Country pack count: ${packs.length}

This directory contains draft AGID Postal Country Packs for target countries
across mature postal systems, weak postal systems, no-postal countries, and
supplemental AGID postal-zone design. These packs are safe OSS planning
artifacts, not official postal authority datasets.

## Countries

${countries}

## Safety Contract

- Packs contain generated metadata, source slots, stable locality IDs, VPL
  seeds, and conformance vectors.
- Packs do not contain personal addresses, recipient names, phone numbers,
  private AOID bodies, AGID-S payloads, proof codes, or raw third-party data.
- Generated codes remain simulation or draft until official authority, carrier
  pilot, privacy, data-trust, and transition gates are satisfied.
- Mature postal countries are stored as reference packs for source metadata,
  validation compatibility, conformance tests, and AGID interoperability; they
  must not claim to replace official postal codes.

## Regenerate

\`\`\`bash
npm run export:postal-country-pack:all
\`\`\`
`;
}

async function writeJson(outDir: string, fileName: string, value: unknown) {
  await writeFile(join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function loadOfficialMunicipalityDataset(countryCode: string): Promise<OfficialMunicipalityDataset | null> {
  const filePath = join(OFFICIAL_MUNICIPALITY_ROOT, `${countryCode.toLowerCase()}.json`);
  try {
    const dataset = JSON.parse(await readFile(filePath, 'utf8')) as OfficialMunicipalityDataset;
    const validation = validateOfficialMunicipalityDataset(dataset, countryCode);
    if (!validation.valid) {
      throw new Error(`Official municipality dataset ${filePath} is invalid: ${validation.errors.join(', ')}`);
    }
    return dataset;
  } catch (error) {
    if (
      typeof error === 'object'
      && error !== null
      && 'code' in error
      && (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  }
}

async function writeCountryPack(pack: AgidPostalCountryPack) {
  const validation = validateAgidPostalCountryPack(pack);
  if (!validation.valid) {
    throw new Error(`AGID Postal Country Pack ${pack.manifest.countryCode} is invalid: ${validation.errors.join(', ')}`);
  }

  const outDir = join(DATA_ROOT, pack.manifest.countryCode.toLowerCase());
  await mkdir(outDir, { recursive: true });
  await writeJson(outDir, 'manifest.json', pack.manifest);
  await writeJson(outDir, 'agid-postal-country-pack.json', pack);
  await writeJson(outDir, 'source-catalog.json', pack.sourceCatalog);
  await writeJson(outDir, 'locality-index.json', pack.localityIndex);
  await writeJson(outDir, 'planning-cell-index.json', pack.planningCellIndex);
  await writeJson(outDir, 'route-evidence-index.json', pack.routeEvidenceIndex);
  await writeJson(outDir, 'quality-evidence-index.json', pack.qualityEvidenceIndex);
  await writeJson(outDir, 'official-municipality-summary.json', pack.officialMunicipalitySummary);
  await writeJson(outDir, 'license-ledger.json', pack.licenseLedger);
  await writeJson(outDir, 'test-vectors.json', pack.testVectors);
  await writeFile(join(outDir, 'README.md'), countryPackReadme(pack), 'utf8');
  return outDir;
}

async function writeCountryPackIndex(packs: AgidPostalCountryPack[]) {
  const targetCountries = listAgidPostalCountryPackTargetCountries();
  const index = {
    schemaVersion: 'agid-postal-country-packs-index-v0.1',
    packVersion: AGID_POSTAL_COUNTRY_PACK_VERSION,
    generatedAt: packs[0]?.manifest.generatedAt || DEFAULT_GENERATED_AT,
    targetCountryCount: targetCountries.length,
    exportedCountryCount: packs.length,
    containsPersonalData: false,
    containsRawThirdPartyData: false,
    countries: packs.map(pack => {
      const target = targetCountries.find(country => country.countryCode === pack.manifest.countryCode);
      return {
        countryCode: pack.manifest.countryCode,
        countryName: pack.manifest.countryName,
        repositoryName: pack.manifest.repositoryName,
        packageName: pack.manifest.packageName,
        officialStatus: pack.manifest.officialStatus,
        recommendationSource: target?.recommendationSource || 'strategy',
        officialMunicipalitySummary: pack.officialMunicipalitySummary,
        terrain: pack.countryProfile.terrain,
        region: pack.countryProfile.region,
        requiredLayers: pack.manifest.requiredLayers,
        counts: pack.manifest.counts,
        relativePath: `./${pack.manifest.countryCode.toLowerCase()}/agid-postal-country-pack.json`,
      };
    }),
  };

  await mkdir(DATA_ROOT, { recursive: true });
  await writeJson(DATA_ROOT, 'index.json', index);
  await writeFile(join(DATA_ROOT, 'README.md'), countryPackIndexReadme(packs), 'utf8');
}

async function main() {
  const requestedCountryCode = (process.env.AGID_POSTAL_COUNTRY_CODE || 'FJ').trim().toUpperCase();
  const generatedAt = process.env.AGID_POSTAL_COUNTRY_PACK_GENERATED_AT || DEFAULT_GENERATED_AT;
  const exportAll = process.argv.includes('--all') || requestedCountryCode === 'ALL';
  const packs = exportAll
    ? await Promise.all(listAgidPostalCountryPackTargetCountries().map(async country => (
      buildAgidPostalCountryPack({
        countryCode: country.countryCode,
        generatedAt,
        officialMunicipalityDataset: await loadOfficialMunicipalityDataset(country.countryCode),
      })
    )))
    : [buildAgidPostalCountryPack({
      countryCode: requestedCountryCode,
      generatedAt,
      officialMunicipalityDataset: await loadOfficialMunicipalityDataset(requestedCountryCode),
    })];

  const outDirs = [];
  for (const pack of packs) {
    outDirs.push(await writeCountryPack(pack));
  }
  if (exportAll) {
    await writeCountryPackIndex(packs);
  }

  console.log(`AGID Postal Country Pack export complete`);
  console.log(`countries=${packs.length}`);
  console.log(`targetCountries=${listAgidPostalCountryPackTargetCountries().length}`);
  console.log(`outputRoot=${DATA_ROOT}`);
  console.log(`firstOutput=${outDirs[0]}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
