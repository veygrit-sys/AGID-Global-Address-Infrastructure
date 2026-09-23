import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import {
  buildExternalOssGeoPostalIntegrationPlans,
} from '../src/lib/externalOssGeoPostalIntegration';
import {
  buildGeoOpenSourceGapStrategyReport,
  type GeoOssGapEntry,
} from '../src/lib/geoOpenSourceGapStrategy';

const ADDRESS_FORMAT_ROOT = join(process.cwd(), 'src', 'data', 'address_formats');
const JSON_REPORT_PATH = join(process.cwd(), 'test-results', 'geo-open-source-gap-strategy.json');
const DOC_REPORT_PATH = join(process.cwd(), 'docs', 'geo-open-source-gap-strategy.md');

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

function tableRows(entries: GeoOssGapEntry[], limit?: number) {
  const scoped = typeof limit === 'number' ? entries.slice(0, limit) : entries;
  return scoped.map(entry => [
    entry.priority,
    entry.countryCode,
    entry.countryName,
    entry.continent,
    entry.regionKind,
    `${entry.localCoreRoleCount}/4`,
    entry.missingCoreRoles.join(', ') || '-',
    entry.proposedOpenSourcePackages.slice(0, 3).join('<br>'),
  ]);
}

function markdownTable(headers: string[], rows: string[][]) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' |')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function prioritySection(title: string, entries: GeoOssGapEntry[]) {
  if (!entries.length) return `## ${title}\n\nNone.\n`;
  return [
    `## ${title}`,
    '',
    markdownTable(
      ['Priority', 'Code', 'Name', 'Continent', 'Kind', 'Local core roles', 'Missing roles', 'First packages'],
      tableRows(entries),
    ),
    '',
  ].join('\n');
}

const plans = buildExternalOssGeoPostalIntegrationPlans(loadAddressFormats());
const report = buildGeoOpenSourceGapStrategyReport(plans);
const p0 = report.entries.filter(entry => entry.priority === 'P0-critical');
const p1 = report.entries.filter(entry => entry.priority === 'P1-high');
const p2 = report.entries.filter(entry => entry.priority === 'P2-medium');

const markdown = [
  '# Geo Open Source Gap Strategy',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  'This report identifies countries and regions where AGID still lacks enough local, redistributable, open geographic sources for strong address validation.',
  '',
  'The scoring checks local core geo roles: address, geocoding, admin-boundary, and gazetteer. Global sources are useful fallbacks, but they do not replace local country or territory packs.',
  '',
  '## Summary',
  '',
  `- Total AGID plans: ${report.totalPlans}`,
  `- Gap entries: ${report.gapCount}`,
  `- P0 critical: ${report.byPriority['P0-critical']}`,
  `- P1 high: ${report.byPriority['P1-high']}`,
  `- P2 medium: ${report.byPriority['P2-medium']}`,
  '',
  '## Open Source Build Strategy',
  '',
  ...report.openSourceBuildStrategy.map(item => `- ${item}`),
  '',
  prioritySection('P0 Critical: no postcode or no local core geo coverage', p0),
  prioritySection('P1 High: manual fallback with one or fewer local core roles', p1),
  prioritySection('P2 Medium: partial local core geo coverage or redistribution risk', p2.slice(0, 80)),
  p2.length > 80 ? `\nP2 table truncated to 80 entries in Markdown. Full list is in \`${relative(process.cwd(), JSON_REPORT_PATH)}\`.\n` : '',
  '## Reusable Package Pattern',
  '',
  'For each priority country or region, create the smallest useful open-source package:',
  '',
  '```text',
  'agid-open-<country>-boundaries',
  'agid-open-<country>-gazetteer',
  'agid-open-<country>-address-candidates',
  'agid-open-<country>-geocoder-fixtures',
  'agid-open-<country>-no-postcode-grid',
  'agid-open-<country>-license-ledger',
  '```',
  '',
  'Each package should include `manifest.json`, `sources.json`, `LICENSES.md`, `fixtures/*.json`, `tests/*.json`, and a no-raw-recipient-data policy.',
  '',
].join('\n');

mkdirSync(dirname(JSON_REPORT_PATH), { recursive: true });
mkdirSync(dirname(DOC_REPORT_PATH), { recursive: true });
writeFileSync(JSON_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(DOC_REPORT_PATH, markdown);

console.log(JSON.stringify({
  version: report.version,
  gapCount: report.gapCount,
  byPriority: report.byPriority,
  byContinent: report.byContinent,
  topP0: p0.map(entry => `${entry.countryCode}:${entry.countryName}`),
  jsonReportPath: JSON_REPORT_PATH,
  markdownReportPath: DOC_REPORT_PATH,
}, null, 2));
