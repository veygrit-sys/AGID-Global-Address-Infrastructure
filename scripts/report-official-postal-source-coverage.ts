import { mkdirSync,readdirSync,readFileSync,statSync,writeFileSync } from 'node:fs';
import { dirname,join,relative } from 'node:path';

import {
  collectOfficialPostalSourceCoverage,
  summarizeOfficialPostalSourceCoverage,
} from '../src/lib/officialPostalSourceCoverage';

const ADDRESS_FORMAT_ROOT = join(process.cwd(), 'src', 'data', 'address_formats');
const REPORT_PATH = join(process.cwd(), 'test-results', 'official-postal-source-coverage.json');
const DOC_REPORT_PATH = join(process.cwd(), 'docs', 'official-postal-source-coverage.md');

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function loadAddressFormats() {
  return walkJsonFiles(ADDRESS_FORMAT_ROOT).map(file => ({
    relativePath: relative(ADDRESS_FORMAT_ROOT, file),
    format: JSON.parse(readFileSync(file, 'utf8')),
  }));
}

const entries = collectOfficialPostalSourceCoverage(loadAddressFormats());
const summary = summarizeOfficialPostalSourceCoverage(entries);

function markdownList(values: string[]) {
  return values.length ? values.map(value => `- \`${value}\``).join('\n') : '- None';
}

function continentList(valuesByContinent: Record<string, string[]>) {
  return Object.entries(valuesByContinent)
    .map(([continent, values]) => `- ${continent}: ${values.length ? values.map(value => `\`${value}\``).join(', ') : 'None'}`)
    .join('\n');
}

function statusRows() {
  return Object.entries(summary.byStatus)
    .map(([status, count]) => `| ${status} | ${count} |`)
    .join('\n');
}

function continentRows() {
  return Object.entries(summary.byContinent)
    .map(([continent, count]) => `| ${continent} | ${count} |`)
    .join('\n');
}

const markdown = [
  '# Official Postal Source Coverage',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  'Verdict: **all AGID country/region address-format profiles have a postal source status, but country-specific official postal evidence is still incomplete.**',
  '',
  'This report checks local AGID address-format profiles and registered postal/open-source metadata. It does not prove that every real postal code in the world exists in the repository, and it does not run live API probes unless `verify-postal-sources --live` is executed separately.',
  '',
  '## Summary',
  '',
  `- Address-format profiles checked: ${summary.total}`,
  `- Missing official source status: ${summary.missingOfficialSourceCountryCodes.length}`,
  `- Profiles using global official fallback: ${summary.globalOfficialFallbackCountryCodes.length}`,
  `- Profiles missing country-specific official evidence: ${summary.countrySpecificOfficialMissingCountryCodes.length}`,
  '',
  '## By Status',
  '',
  '| Status | Count |',
  '| --- | --- |',
  statusRows(),
  '',
  '## By Continent',
  '',
  '| Continent | Count |',
  '| --- | --- |',
  continentRows(),
  '',
  '## Missing Official Source Status',
  '',
  markdownList(summary.missingOfficialSourceCountryCodes),
  '',
  '## Profiles Using Global Official Fallback',
  '',
  continentList(summary.globalOfficialFallbackCountryCodesByContinent),
  '',
  '## Missing Country-Specific Official Evidence',
  '',
  continentList(summary.countrySpecificOfficialMissingCountryCodesByContinent),
  '',
  '## Safe Interpretation',
  '',
  '- `authoritative` and `official` mean the profile is linked to strong source evidence in the local metadata.',
  '- `no-normal-postcode` means ordinary postcode proof should not be required; AGID/geospatial/postal-equivalent checks are safer.',
  '- Global fallback evidence is useful for baseline validation, but it is not a substitute for a national postal operator, official government postcode API, or official bulk postcode dataset.',
  '- This report is a source/readiness audit, not a complete postal-code database audit.',
  '',
  '## Next Gates',
  '',
  '- Add country-specific official postal operator or government source for each fallback country.',
  '- Add source version, update cadence, and license metadata for every postal source.',
  '- Run live probes only in a controlled network job, because some official APIs are credentialed, rate-limited, or block automated probes.',
  '- Separate format validation, existence validation, address-to-postcode matching, postal-equivalent fallback, and carrier-deliverability checks.',
  '',
].join('\n');

mkdirSync(dirname(REPORT_PATH), { recursive: true });
mkdirSync(dirname(DOC_REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, JSON.stringify({
  generatedAt: new Date().toISOString(),
  summary,
  entries,
}, null, 2));
writeFileSync(DOC_REPORT_PATH, markdown);

console.log(JSON.stringify({
  ...summary,
  reportPath: REPORT_PATH,
  markdownReportPath: DOC_REPORT_PATH,
}, null, 2));
