import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import {
  buildExternalOssGeoPostalIntegrationPlans,
} from '../src/lib/externalOssGeoPostalIntegration';
import {
  buildGeoOpenSourceGapStrategyReport,
} from '../src/lib/geoOpenSourceGapStrategy';
import {
  buildP2MediumGeoRepositoryPlan,
  type P2MediumGeoRepositoryPlan,
  type P2MediumPlanItem,
} from '../src/lib/p2MediumGeoRepositoryPlan';

const ADDRESS_FORMAT_ROOT = join(process.cwd(), 'src', 'data', 'address_formats');
const JSON_PLAN_PATH = join(process.cwd(), 'data', 'open_geo_repositories', 'p2-medium-200-plan.json');
const DOC_PLAN_PATH = join(process.cwd(), 'docs', 'p2-medium-200-gazetteer-plan.md');

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

function itemRows(items: P2MediumPlanItem[]) {
  return items.map(item => [
    cell(item.rank),
    cell(item.wave),
    cell(item.countryCode),
    cell(item.countryName),
    cell(item.continent),
    cell(item.regionKind),
    cell(`${item.localCoreRoleCount}/4`),
    cell(item.missingCoreRoles),
    cell(item.stage),
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

function waveSection(plan: P2MediumGeoRepositoryPlan) {
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

function markdown(plan: P2MediumGeoRepositoryPlan) {
  return [
    '# P2 Medium 200 Gazetteer Repository Plan',
    '',
    `Generated: ${plan.generatedAt}`,
    '',
    'This plan covers every current `P2-medium` open-geodata gap in the AGID source catalog.',
    'P2 means the country or region has partial local coverage, manual fallback, or redistribution risk that still prevents a strong open-source address-validation pack.',
    '',
    'The goal is not to create 200 empty repositories. The goal is to turn 200 medium-risk entries into reviewable, source-linked, fixture-backed packages in waves.',
    '',
    '## Summary',
    '',
    `- Target count: ${plan.targetCount}`,
    `- Available P2 entries: ${plan.availableCount}`,
    `- Selected entries: ${plan.selectedCount}`,
    `- Wave size: ${plan.waveSize}`,
    `- JSON plan: \`${relative(process.cwd(), JSON_PLAN_PATH)}\``,
    '',
    summaryTable('By Continent', plan.summary.byContinent),
    summaryTable('By Region Kind', plan.summary.byRegionKind),
    summaryTable('By Execution Stage', plan.summary.byStage),
    '## Operating Principles',
    '',
    ...plan.operatingPrinciples.map(item => `- ${item}`),
    '',
    '## Release Gates',
    '',
    ...plan.releaseGates.map(item => `- ${item}`),
    '',
    waveSection(plan),
    '## P2 200 Item Plan',
    '',
    markdownTable(
      ['Rank', 'Wave', 'Code', 'Name', 'Continent', 'Kind', 'Local roles', 'Missing roles', 'Stage', 'Repository set'],
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
const p2Plan = buildP2MediumGeoRepositoryPlan(gapReport);

mkdirSync(dirname(JSON_PLAN_PATH), { recursive: true });
mkdirSync(dirname(DOC_PLAN_PATH), { recursive: true });
writeFileSync(JSON_PLAN_PATH, `${JSON.stringify(p2Plan, null, 2)}\n`);
writeFileSync(DOC_PLAN_PATH, markdown(p2Plan));

console.log(JSON.stringify({
  version: p2Plan.version,
  targetCount: p2Plan.targetCount,
  availableCount: p2Plan.availableCount,
  selectedCount: p2Plan.selectedCount,
  waveCount: p2Plan.waves.length,
  byContinent: p2Plan.summary.byContinent,
  byStage: p2Plan.summary.byStage,
  jsonPlanPath: JSON_PLAN_PATH,
  markdownPlanPath: DOC_PLAN_PATH,
}, null, 2));
