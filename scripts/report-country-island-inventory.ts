import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { buildCountryIslandInventory } from '../src/lib/countryIslandInventory';

const JSON_PATH = join(process.cwd(), 'data', 'open_geo_repositories', 'country-island-inventory.json');
const DOC_PATH = join(process.cwd(), 'docs', 'country-island-inventory.md');

const inventory = buildCountryIslandInventory();

function tableNames(names: string[]) {
  return names.length ? names.join('; ') : '-';
}

const markdown = [
  '# Country Island Inventory',
  '',
  `Generated: ${inventory.generatedAt}`,
  '',
  'This file records island names by country, territory, or special region from local AGID open-geodata seed repositories.',
  'It is intentionally conservative: counts are recorded AGID island anchors, not official total island counts unless a country has a passing executable completeness gate.',
  '',
  '## Summary',
  '',
  `- Countries / territories / special regions with recorded island anchors: ${inventory.countryCount}`,
  `- Total recorded island anchors: ${inventory.totalRecordedIslandAnchors}`,
  `- Source root: \`${inventory.sourceRoot}\``,
  '',
  '## Non-Claims',
  '',
  ...inventory.nonClaims.map(claim => `- ${claim}`),
  '',
  '## Countries',
  '',
  '| Country / region | Count | Claim scope | Expected | Island names |',
  '| --- | ---: | --- | ---: | --- |',
  ...inventory.countries.map(country =>
    `| ${country.countryCode} ${country.countryName} | ${country.recordedIslandCount} | ${country.claimScope} | ${country.expectedIslandCount ?? '-'} | ${tableNames(country.islandNames)} |`,
  ),
  '',
  '## Next Gate',
  '',
  'For any country not marked `complete-all-islands`, add an authoritative island inventory manifest before claiming total coverage.',
  '',
].join('\n');

mkdirSync(dirname(JSON_PATH), { recursive: true });
mkdirSync(dirname(DOC_PATH), { recursive: true });
writeFileSync(JSON_PATH, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
writeFileSync(DOC_PATH, markdown, 'utf8');

console.log(JSON.stringify({
  version: inventory.version,
  countryCount: inventory.countryCount,
  totalRecordedIslandAnchors: inventory.totalRecordedIslandAnchors,
  jsonPath: JSON_PATH,
  markdownPath: DOC_PATH,
}, null, 2));
