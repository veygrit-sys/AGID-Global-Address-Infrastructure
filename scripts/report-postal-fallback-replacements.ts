import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import {
  buildPostalFallbackReplacementPlan,
  validatePostalFallbackReplacementPlan,
} from '../src/lib/postalFallbackReplacementPlan';

const ADDRESS_FORMAT_ROOT = join(process.cwd(), 'src', 'data', 'address_formats');
const REPORT_PATH = join(process.cwd(), 'test-results', 'postal-fallback-replacement-plan.json');
const DOC_REPORT_PATH = join(process.cwd(), 'docs', 'postal-fallback-replacement-plan.md');

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

function countRows(counts: Record<string, number>) {
  return Object.entries(counts)
    .map(([key, count]) => `| ${key} | ${count} |`)
    .join('\n');
}

function gateRows(plan: ReturnType<typeof buildPostalFallbackReplacementPlan>) {
  return plan.gates
    .map(gate => `| \`${gate.id}\` | ${gate.label} | ${gate.requirement} |`)
    .join('\n');
}

function entriesByContinent(plan: ReturnType<typeof buildPostalFallbackReplacementPlan>) {
  const continents = [...new Set(plan.entries.map(entry => entry.continent))];

  return continents
    .map(continent => {
      const entries = plan.entries.filter(entry => entry.continent === continent);
      const rows = entries
        .map(entry => `| ${[
          `\`${entry.countryCode}\``,
          entry.countryName,
          entry.specialHandling,
          entry.profilePaths.map(path => `\`${path}\``).join('<br>'),
          entry.currentFallbackEvidenceIds.map(id => `\`${id}\``).join(', '),
          entry.replacementSourceKinds.map(kind => `\`${kind}\``).join(', '),
          entry.nextAction,
        ].join(' | ')} |`)
        .join('\n');

      return [
        `## ${continent}`,
        '',
        '| Code | Name | Handling | Profile Paths | Current Fallback | Accepted Replacement Kinds | Next Action |',
        '| --- | --- | --- | --- | --- | --- | --- |',
        rows,
      ].join('\n');
    })
    .join('\n\n');
}

const plan = buildPostalFallbackReplacementPlan(loadAddressFormats());
const errors = validatePostalFallbackReplacementPlan(plan);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const markdown = [
  '# Postal Fallback Replacement Plan',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `Verdict: **${plan.summary.fallbackDependentCount} country/region codes still depend on global official postal fallback evidence and need country-specific official replacement sources.**`,
  '',
  'This plan is intentionally stricter than the baseline postal-source coverage audit. A global official source can keep a profile from being completely unverified, but it cannot satisfy country-specific postal proof. Replacement sources must be national postal operators, government APIs, official address registers, or official bulk postcode datasets.',
  '',
  '## Summary',
  '',
  `- Profiles checked: ${plan.summary.totalProfilesChecked}`,
  `- Fallback-dependent country/region codes: ${plan.summary.fallbackDependentCount}`,
  `- Fallback-dependent address-format profiles: ${plan.summary.fallbackDependentProfileCount}`,
  `- Standard countries: ${plan.summary.standardCountryCount}`,
  `- Territories/subregions: ${plan.summary.territoryOrSubregionCount}`,
  `- Disputed or sensitive regions: ${plan.summary.disputedOrSensitiveCount}`,
  '',
  '## By Continent',
  '',
  '| Continent | Count |',
  '| --- | --- |',
  countRows(plan.summary.byContinent),
  '',
  '## Required Replacement Gates',
  '',
  '| Gate | Label | Requirement |',
  '| --- | --- | --- |',
  gateRows(plan),
  '',
  '## Safe Replacement Workflow',
  '',
  '1. Find the national postal operator, official government postcode API, official address register, or official bulk postcode dataset for one country.',
  '2. Record URL, authority, availability, license or redistribution policy, update cadence, source version, retrieval date, and credential/rate-limit status.',
  '3. Add the source to `src/lib/officialPostalSourceCatalog.ts` with the target country code explicitly listed.',
  '4. Do not bundle restricted bulk data, private API tokens, scraped personal address records, or production credentials.',
  '5. Run `npm run report:postal-source-replacements`, `npm run report:official-postal-sources`, and `npm run verify:postal-sources`.',
  '',
  '## Non-Claims',
  '',
  '- Replacing a fallback source is a source-readiness improvement, not proof that every postcode or delivery point is bundled locally.',
  '- Postal-code existence, address-to-postcode matching, carrier deliverability, AGID postal-equivalent checks, and ZK proof readiness remain separate gates.',
  '- Disputed or sensitive regions must record source boundaries without implying political recognition.',
  '',
  entriesByContinent(plan),
  '',
].join('\n');

mkdirSync(dirname(REPORT_PATH), { recursive: true });
mkdirSync(dirname(DOC_REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, JSON.stringify({
  generatedAt: new Date().toISOString(),
  ...plan,
}, null, 2));
writeFileSync(DOC_REPORT_PATH, markdown);

console.log(JSON.stringify({
  summary: plan.summary,
  reportPath: REPORT_PATH,
  markdownReportPath: DOC_REPORT_PATH,
}, null, 2));
