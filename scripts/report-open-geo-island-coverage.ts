import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { buildP0IslandCoverageAudit } from '../src/lib/p0IslandCoverageAudit';

const ROOT = join(process.cwd(), 'data', 'open_geo_repositories');
const JSON_REPORT_PATH = join(process.cwd(), 'test-results', 'open-geo-island-coverage-audit.json');
const DOC_REPORT_PATH = join(process.cwd(), 'docs', 'open-geo-island-coverage-audit.md');

type SeedRecord = {
  sourceFile: string;
  repository: string;
  name: string;
  featureClass: string;
  agidPlaceId?: string;
  text: string;
};

function walkFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkFiles(path) : [path];
  });
}

function repoNameFor(file: string) {
  const relativePath = relative(ROOT, file);
  return relativePath.split(/[\\/]/)[0] ?? '';
}

function arrayFromJson(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { places?: unknown[] }).places)) {
    return (parsed as { places: unknown[] }).places;
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { features?: unknown[] }).features)) {
    return (parsed as { features: unknown[] }).features;
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { records?: unknown[] }).records)) {
    return (parsed as { records: unknown[] }).records;
  }
  return parsed ? [parsed] : [];
}

function recordText(value: unknown): string {
  return JSON.stringify(value ?? '').toLowerCase();
}

function seedRecords(): SeedRecord[] {
  const files = walkFiles(ROOT).filter(file =>
    /[\\/]data[\\/]place-seed\.json$/.test(file) || /[\\/]gazetteer[\\/]place-seeds\.json$/.test(file),
  );
  const records: SeedRecord[] = [];
  for (const file of files) {
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      for (const item of arrayFromJson(parsed)) {
        const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        const localized = record.localizedNames && typeof record.localizedNames === 'object'
          ? record.localizedNames as Record<string, unknown>
          : {};
        records.push({
          sourceFile: relative(process.cwd(), file),
          repository: repoNameFor(file),
          name: String(record.name ?? localized.en ?? record.label ?? ''),
          featureClass: String(record.featureClass ?? record.type ?? ''),
          agidPlaceId: typeof record.agidPlaceId === 'string' ? record.agidPlaceId : undefined,
          text: recordText(record),
        });
      }
    } catch {
      // Parse failures are handled by absence from the counted seed records; source tests cover JSON validity.
    }
  }
  return records;
}

function listOpenGeoRepos() {
  return readdirSync(ROOT)
    .map(name => join(ROOT, name))
    .filter(path => statSync(path).isDirectory())
    .filter(path => /[\\/]agid-open-/.test(path));
}

function listGazetteerRepos() {
  return listOpenGeoRepos().filter(path => /gazetteer/.test(path));
}

function readRepoFile(repoPath: string, fileName: string) {
  const path = join(repoPath, fileName);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const islandTerms = [
  'island',
  'islands',
  'islet',
  'islets',
  'archipelago',
  'atoll',
  'reef',
  'cay',
  'shoal',
  'skerry',
  'motu',
];
const islandRegex = new RegExp(`\\b(${islandTerms.join('|')})\\b`, 'i');

const records = seedRecords();
const openGeoRepos = listOpenGeoRepos();
const gazetteerRepos = listGazetteerRepos();
const p0Audit = buildP0IslandCoverageAudit();

const explicitIslandRecords = records.filter(record => /^island$/i.test(record.featureClass));
const islandLikeRecords = records.filter(record =>
  islandRegex.test(record.name) || islandRegex.test(record.featureClass) || islandRegex.test(record.text),
);
const islandLikeRepositories = [...new Set(islandLikeRecords.map(record => record.repository))].sort();
const allIslandClaimRepos = p0Audit.rows
  .filter(row => row.mode === 'complete-all-islands' && row.status === 'passing')
  .map(row => row.repository);
const mainIslandClaimRepos = p0Audit.rows
  .filter(row => row.mode === 'complete-main-islands' && row.status === 'passing')
  .map(row => row.repository);
const deferredIslandRepos = p0Audit.rows
  .filter(row => row.status !== 'passing')
  .map(row => row.repository);
const reposWithNoAllIslandGuard = gazetteerRepos.filter(repoPath =>
  /no-all-islands-overclaim|smaller-islets-not-overclaimed|all-33-islands-source-linked|complete-island-coverage-required/i
    .test(`${readRepoFile(repoPath, 'quality-gates.json')}\n${readRepoFile(repoPath, 'README.md')}`),
);

const report = {
  version: 'open-geo-island-coverage-audit-v0.1',
  generatedAt: new Date().toISOString(),
  verdict: 'not-complete-global-island-coverage',
  summary: {
    totalOpenGeoRepos: openGeoRepos.length,
    gazetteerRepos: gazetteerRepos.length,
    seedRecords: records.length,
    explicitIslandFeatureRecords: explicitIslandRecords.length,
    islandLikeSeedRecords: islandLikeRecords.length,
    repositoriesWithIslandLikeSeeds: islandLikeRepositories.length,
    p0IslandTargets: p0Audit.summary.targetCount,
    p0AllIslandPassing: p0Audit.summary.completeAllIsland,
    p0MainIslandPassing: p0Audit.summary.completeMainIsland,
    p0Partial: p0Audit.summary.partial,
    p0Deferred: p0Audit.summary.deferred,
    gazetteerReposWithIslandOverclaimGuards: reposWithNoAllIslandGuard.length,
  },
  interpretation: [
    'The repository set contains island-related public anchors, but it does not prove that all islands are recorded.',
    'Only a small P0 subset currently has executable complete-all-island or complete-main-island gates.',
    'Many island countries and territories are represented as country, subdivision, atoll, or archipelago seeds rather than exhaustive individual island inventories.',
    'A true all-island claim requires an authoritative island inventory, exact expected island count, source-linked records, and an explicit overclaim guard for each country or territory.',
  ],
  p0ExecutableStatus: p0Audit.rows.map(row => ({
    countryCode: row.countryCode,
    repository: row.repository,
    mode: row.mode,
    status: row.status,
    currentIslandSeeds: row.currentIslandSeeds,
    expectedIslandSeeds: row.expectedIslandSeeds ?? null,
    nextSmallestImprovement: row.nextSmallestImprovement,
  })),
  samples: {
    allIslandClaimRepos,
    mainIslandClaimRepos,
    deferredIslandRepos,
    islandLikeRepositories: islandLikeRepositories.slice(0, 35),
    islandLikeSeedRecords: islandLikeRecords.slice(0, 35).map(record => ({
      repository: record.repository,
      agidPlaceId: record.agidPlaceId ?? null,
      name: record.name,
      featureClass: record.featureClass,
      sourceFile: record.sourceFile,
    })),
  },
  requiredNextGates: [
    'Create per-country authoritative island inventory manifests with expected island counts.',
    'Separate all-island, main-island, inhabited-island, administrative-island, atoll, reef, cay, skerry, and disputed-feature scopes.',
    'Require no-delivery, no-boundary, and no-private-coordinate non-claims for island anchors.',
    'Add reconciliation vectors against official national geodata plus OSM, GeoNames, Wikidata, and marine gazetteers where licenses allow.',
    'Block any all-island completeness claim unless matching release gates and source-linked conformance vectors pass.',
  ],
};

function bullet(values: string[]) {
  return values.length ? values.map(value => `- \`${value}\``).join('\n') : '- None';
}

const markdown = [
  '# Open Geo Island Coverage Audit',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `Verdict: **${report.verdict}**`,
  '',
  'This audit checks locally stored open-source island-related AGID seeds. It does not query external official island inventories, so it cannot prove real-world all-island completeness. It is designed to separate safe island claims from overclaims.',
  '',
  '## Summary',
  '',
  `- Open geo repositories: ${report.summary.totalOpenGeoRepos}`,
  `- Gazetteer repositories: ${report.summary.gazetteerRepos}`,
  `- Parsed place seed records: ${report.summary.seedRecords}`,
  `- Explicit \`featureClass: island\` records: ${report.summary.explicitIslandFeatureRecords}`,
  `- Island-like seed records: ${report.summary.islandLikeSeedRecords}`,
  `- Repositories with island-like seeds: ${report.summary.repositoriesWithIslandLikeSeeds}`,
  `- P0 island audit targets: ${report.summary.p0IslandTargets}`,
  `- P0 complete all-island passing: ${report.summary.p0AllIslandPassing}`,
  `- P0 complete main-island passing: ${report.summary.p0MainIslandPassing}`,
  `- P0 partial: ${report.summary.p0Partial}`,
  `- P0 deferred: ${report.summary.p0Deferred}`,
  `- Gazetteer repos with island overclaim guards: ${report.summary.gazetteerReposWithIslandOverclaimGuards}`,
  '',
  '## Interpretation',
  '',
  ...report.interpretation.map(item => `- ${item}`),
  '',
  '## P0 Executable Status',
  '',
  '| Code | Repository | Mode | Status | Island seeds | Expected | Next improvement |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...report.p0ExecutableStatus.map(row =>
    `| ${row.countryCode} | \`${row.repository}\` | ${row.mode} | ${row.status} | ${row.currentIslandSeeds} | ${row.expectedIslandSeeds ?? '-'} | ${row.nextSmallestImprovement} |`,
  ),
  '',
  '## All-Island Claim Repositories',
  '',
  bullet(report.samples.allIslandClaimRepos),
  '',
  '## Main-Island Claim Repositories',
  '',
  bullet(report.samples.mainIslandClaimRepos),
  '',
  '## Deferred Island Expansion Repositories',
  '',
  bullet(report.samples.deferredIslandRepos),
  '',
  '## Required Next Gates',
  '',
  ...report.requiredNextGates.map(item => `- ${item}`),
  '',
].join('\n');

mkdirSync(dirname(JSON_REPORT_PATH), { recursive: true });
mkdirSync(dirname(DOC_REPORT_PATH), { recursive: true });
writeFileSync(JSON_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(DOC_REPORT_PATH, markdown, 'utf8');

console.log(JSON.stringify({
  verdict: report.verdict,
  summary: report.summary,
  jsonReportPath: JSON_REPORT_PATH,
  markdownReportPath: DOC_REPORT_PATH,
}, null, 2));
