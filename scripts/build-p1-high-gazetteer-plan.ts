import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import {
  buildExternalOssGeoPostalIntegrationPlans,
} from '../src/lib/externalOssGeoPostalIntegration';
import {
  buildGeoOpenSourceGapStrategyReport,
} from '../src/lib/geoOpenSourceGapStrategy';
import {
  buildP1HighGeoRepositoryPlan,
  type P1HighGeoRepositoryPlan,
  type P1HighPlanItem,
} from '../src/lib/p1HighGeoRepositoryPlan';

const ADDRESS_FORMAT_ROOT = join(process.cwd(), 'src', 'data', 'address_formats');
const JSON_PLAN_PATH = join(process.cwd(), 'data', 'open_geo_repositories', 'p1-high-33-plan.json');
const DOC_PLAN_PATH = join(process.cwd(), 'docs', 'p1-high-33-gazetteer-plan.md');

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

function markdownTable(headers: string[], rows: string[][]) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' |')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function cell(value: string | number | boolean | string[]) {
  if (Array.isArray(value)) return value.length ? value.join(', ').replace(/\|/g, '/') : '-';
  return String(value).replace(/\|/g, '/');
}

function itemRows(items: P1HighPlanItem[]) {
  return items.map(item => [
    cell(item.rank),
    cell(item.wave),
    cell(item.countryCode),
    cell(item.countryName),
    cell(item.continent),
    cell(item.regionKind),
    cell(item.presentLocalCoreRoles),
    cell(item.missingCoreRoles),
    cell(item.recoveryTrack),
    cell(item.repositorySet.slice(0, 4).join('<br>')),
  ]);
}

function summaryTable(title: string, record: Record<string, number>) {
  return [
    `## ${title}`,
    '',
    markdownTable(['Key', 'Count'], Object.entries(record)
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([key, count]) => [key, String(count)])),
    '',
  ].join('\n');
}

function waveSection(plan: P1HighGeoRepositoryPlan) {
  return [
    '## Execution Waves',
    '',
    markdownTable(
      ['Wave', 'Ranks', 'Items', 'Objective', 'Exit criteria'],
      plan.waves.map(wave => [
        String(wave.wave),
        `${wave.rankRange[0]}-${wave.rankRange[1]}`,
        String(wave.itemCount),
        wave.objective,
        wave.exitCriteria.join('<br>'),
      ]),
    ),
    '',
  ].join('\n');
}

function markdown(plan: P1HighGeoRepositoryPlan) {
  return [
    '# P1 High 33 Gazetteer Repository Plan',
    '',
    `Generated: ${plan.generatedAt}`,
    '',
    'This plan covers every current `P1-high` open-geodata gap in the AGID source catalog.',
    'P1 means manual fallback remains required and only one local core geo role is present.',
    '',
    'The work should recover the missing three core roles before any package is presented as strong address-validation infrastructure.',
    '',
    '## Summary',
    '',
    `- Target count: ${plan.targetCount}`,
    `- Available P1 entries: ${plan.availableCount}`,
    `- Selected entries: ${plan.selectedCount}`,
    `- Wave size: ${plan.waveSize}`,
    `- JSON plan: \`${relative(process.cwd(), JSON_PLAN_PATH)}\``,
    '',
    summaryTable('By Continent', plan.summary.byContinent),
    summaryTable('By Region Kind', plan.summary.byRegionKind),
    summaryTable('By Recovery Track', plan.summary.byRecoveryTrack),
    '## Operating Principles',
    '',
    ...plan.operatingPrinciples.map(item => `- ${item}`),
    '',
    '## Release Gates',
    '',
    ...plan.releaseGates.map(item => `- ${item}`),
    '',
    waveSection(plan),
    '## P1 33 Item Plan',
    '',
    markdownTable(
      ['Rank', 'Wave', 'Code', 'Name', 'Continent', 'Kind', 'Present role', 'Missing roles', 'Recovery track', 'Repository set'],
      itemRows(plan.items),
    ),
    '',
    '## Residual Risks',
    '',
    ...plan.residualRisks.map(item => `- ${item}`),
    '',
  ].join('\n');
}

const externalPlans = buildExternalOssGeoPostalIntegrationPlans(loadAddressFormats());
const gapReport = buildGeoOpenSourceGapStrategyReport(externalPlans);
const p1Plan = buildP1HighGeoRepositoryPlan(gapReport);

mkdirSync(dirname(JSON_PLAN_PATH), { recursive: true });
mkdirSync(dirname(DOC_PLAN_PATH), { recursive: true });
writeFileSync(JSON_PLAN_PATH, `${JSON.stringify(p1Plan, null, 2)}\n`);
writeFileSync(DOC_PLAN_PATH, markdown(p1Plan));

console.log(JSON.stringify({
  version: p1Plan.version,
  targetCount: p1Plan.targetCount,
  availableCount: p1Plan.availableCount,
  selectedCount: p1Plan.selectedCount,
  waveCount: p1Plan.waves.length,
  byContinent: p1Plan.summary.byContinent,
  byRecoveryTrack: p1Plan.summary.byRecoveryTrack,
  jsonPlanPath: JSON_PLAN_PATH,
  markdownPlanPath: DOC_PLAN_PATH,
}, null, 2));
