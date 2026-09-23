import { mkdirSync,readdirSync,readFileSync,statSync,writeFileSync } from 'node:fs';
import { dirname,join,relative } from 'node:path';

import {
  buildAgidPostalCountryProfiles,
  classifyAgidPostalCountries,
  type AgidPostalCountryProfile,
} from '../src/lib/agidPostalCodeEngine';
import type { AddressCoverageFormatLike } from '../src/lib/addressCoveragePolicy';

const ADDRESS_FORMAT_ROOT = join(process.cwd(), 'src', 'data', 'address_formats');
const REPORT_PATH = join(process.cwd(), 'test-results', 'agid-postal-code-engine.json');

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function loadProfiles(): AgidPostalCountryProfile[] {
  return walkJsonFiles(ADDRESS_FORMAT_ROOT).flatMap(file => {
    try {
      const format = JSON.parse(readFileSync(file, 'utf8')) as AddressCoverageFormatLike;
      const countryCode = String(format.countryCode || '').trim().toUpperCase();
      if (!countryCode) return [];
      return [{
        countryCode,
        countryName: format.name,
        addressFormat: format,
        evidenceSources: [
          relative(ADDRESS_FORMAT_ROOT, file).replace(/\\/g, '/'),
          ...(format.openSourceIds || []),
          ...(format.addressRules?.openSourceIds || []),
        ],
      }];
    } catch {
      return [];
    }
  });
}

const profiles = buildAgidPostalCountryProfiles(loadProfiles());
const classification = classifyAgidPostalCountries(profiles);
const report = {
  generatedAt: new Date().toISOString(),
  version: 'agid-postal-code-engine-report-v0.1',
  summary: {
    classA: classification.classA.length,
    classB: classification.classB.length,
    classC: classification.classC.length,
    eligibleForAgidPostalGeneration: classification.eligible.length,
    blockedExistingPostalPrimary: classification.blocked.length,
  },
  countryCodes: {
    classA: classification.classA.map(country => country.countryCode),
    classB: classification.classB.map(country => country.countryCode),
    classC: classification.classC.map(country => country.countryCode),
    eligible: classification.eligible.map(country => country.countryCode),
    blocked: classification.blocked.map(country => country.countryCode),
  },
  entries: [...classification.classA, ...classification.classB, ...classification.classC],
};

mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  reportPath: REPORT_PATH,
  summary: report.summary,
}, null, 2));
