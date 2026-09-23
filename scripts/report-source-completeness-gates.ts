import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  buildOpenGeoSourceCompletenessSummary,
  SOURCE_COMPLETENESS_DIMENSIONS,
  sourceCompletenessSummaryInvariantFailures,
} from '../src/lib/sourceCompletenessGate';

const JSON_REPORT_PATH = join(process.cwd(), 'test-results', 'source-completeness-gates.json');
const DOC_REPORT_PATH = join(process.cwd(), 'docs', 'source-completeness-gates.md');
const CHECK_MODE = process.argv.includes('--check');

const summary = buildOpenGeoSourceCompletenessSummary();
const invariantFailures = sourceCompletenessSummaryInvariantFailures(summary);

function bullet(values: string[]) {
  return values.length ? values.map(value => `- \`${value}\``).join('\n') : '- None';
}

function dimensionRows() {
  return SOURCE_COMPLETENESS_DIMENSIONS.map(dimension => {
    const row = summary.byDimension[dimension.id];
    return `| ${dimension.id} | ${dimension.labelJa} | ${row.passing} | ${row.partial} | ${row.blocked} | ${dimension.nonClaim} |`;
  }).join('\n');
}

function sampleSections() {
  return SOURCE_COMPLETENESS_DIMENSIONS.flatMap(dimension => {
    const row = summary.byDimension[dimension.id];
    return [
      `### ${dimension.labelJa} / ${dimension.id}`,
      '',
      `Passing sample (${row.samplePassing.length} shown):`,
      '',
      bullet(row.samplePassing),
      '',
      `Blocked sample (${row.sampleBlocked.length} shown):`,
      '',
      bullet(row.sampleBlocked),
      '',
    ];
  }).join('\n');
}

function scopedLayerClaimRows() {
  return summary.claimBoundary.scopedLayerClaimChecks.map(check => {
    return `| ${check.dimension} | ${check.passingRepositories} | ${check.blockedGlobalClaimRepositories} | ${check.globalClaimAllowedRepositories} | ${check.scopeLeakRepositories.length} | ${check.assertion} |`;
  }).join('\n');
}

function inlineCodeList(values: string[]) {
  return values.length ? values.map(value => `\`${value}\``).join(', ') : 'None';
}

function normalizeGeneratedAt(text: string) {
  return text.replace(/^Generated: .+$/m, 'Generated: <ignored>');
}

function removeGeneratedAt(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeGeneratedAt);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== 'generatedAt')
        .map(([key, nested]) => [key, removeGeneratedAt(nested)]),
    );
  }

  return value;
}

function comparableJson(value: unknown) {
  return JSON.stringify(removeGeneratedAt(value), null, 2);
}

const markdown = [
  '# Source Completeness Gates',
  '',
  `Generated: ${summary.generatedAt}`,
  '',
  'Verdict: **source completeness must be evaluated by layer; no repository currently earns a global all-place-name completeness claim.**',
  '',
  'This gate separates official gazetteers, OSM, GeoNames, Wikidata, administrative divisions, islands, POI, natural feature names, and historical/alias names. It prevents a repository from using one source type, such as GeoNames or OSM, to imply total geographic completeness.',
  '',
  '## Summary',
  '',
  `- Open geo repositories checked: ${summary.repositoryCount}`,
  `- Repositories allowed to claim global all-place-name completeness: ${summary.globalAllPlaceNamesAllowedCount}`,
  `- Repositories with no blocked source layer: ${summary.completeSliceAllowedCount}`,
  '',
  'Freshness check: `npm run check:source-completeness-gates` compares this report while ignoring generated timestamps.',
  '',
  '## Claim Boundary',
  '',
  `- Verdict: **${summary.claimBoundary.verdict}**`,
  `- Blocked claim: \`${summary.claimBoundary.blockedClaim}\``,
  `- Allowed claim: ${summary.claimBoundary.allowedClaim}`,
  `- Global all-place-name claim allowed for this repository set: ${summary.claimBoundary.globalAllPlaceNamesAllowed ? 'yes' : 'no'}`,
  `- Required passing dimensions: ${inlineCodeList(summary.claimBoundary.requiredPassingDimensions)}`,
  `- Dimensions still blocking that claim: ${inlineCodeList(summary.claimBoundary.blockedDimensions)}`,
  `- Layer passing scope invariant: ${summary.claimBoundary.layerPassingScopeInvariant ? 'passing' : 'failing'}`,
  `- Non-claim statements carried by the gate: ${summary.claimBoundary.nonClaimCount}`,
  `- Next gate: ${summary.claimBoundary.nextGate}`,
  '',
  '## Scoped Layer Claim Checks',
  '',
  'Passing POI or natural-feature samples remain scoped evidence unless every required source layer passes for the same repository.',
  '',
  '| Dimension | Passing repositories | Still globally blocked | Global claim allowed | Scope leaks | Assertion |',
  '| --- | --- | --- | --- | --- | --- |',
  scopedLayerClaimRows(),
  '',
  '## Dimension Results',
  '',
  '| Dimension | Japanese label | Passing | Partial | Blocked | Non-claim |',
  '| --- | --- | --- | --- | --- | --- |',
  dimensionRows(),
  '',
  '## Required Gate Semantics',
  '',
  ...SOURCE_COMPLETENESS_DIMENSIONS.map(dimension => `- **${dimension.id}**: ${dimension.minimumRule}`),
  '',
  '## Samples',
  '',
  sampleSections(),
  '## Policy',
  '',
  '- A complete country or territory claim must name the exact completeness scope: all-place-name, all-island, main-island, administrative-division, POI, natural-feature, or alias scope.',
  '- A source layer can pass without allowing data redistribution; metadata links and conformance vectors may be enough for a source-bound claim.',
  '- A global all-place-name claim is blocked unless every required source layer passes and the repository has explicit overclaim guards.',
  '- POI and natural feature scopes are volatile and require separate freshness and access non-claims.',
  '',
].join('\n');

if (CHECK_MODE) {
  const failures: string[] = [...invariantFailures];
  if (!existsSync(DOC_REPORT_PATH)) {
    failures.push(`Missing Markdown report: ${DOC_REPORT_PATH}`);
  } else if (normalizeGeneratedAt(readFileSync(DOC_REPORT_PATH, 'utf8')) !== normalizeGeneratedAt(markdown)) {
    failures.push(`Stale Markdown report: ${DOC_REPORT_PATH}. Run npm run report:source-completeness-gates.`);
  }

  const jsonSemanticChecked = existsSync(JSON_REPORT_PATH);
  if (jsonSemanticChecked) {
    const existing = JSON.parse(readFileSync(JSON_REPORT_PATH, 'utf8'));
    if (comparableJson(existing) !== comparableJson(summary)) {
      failures.push(`Stale JSON report semantics: ${JSON_REPORT_PATH}. Run npm run report:source-completeness-gates.`);
    }
  }

  if (failures.length) {
    console.error(JSON.stringify({
      status: 'stale',
      failures,
      ignoredFields: ['generatedAt'],
      markdownReportPath: DOC_REPORT_PATH,
      jsonReportPath: JSON_REPORT_PATH,
      jsonSemanticChecked,
    }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: 'fresh',
    ignoredFields: ['generatedAt'],
    markdownReportPath: DOC_REPORT_PATH,
    jsonReportPath: JSON_REPORT_PATH,
    jsonSemanticChecked,
  }, null, 2));
  process.exit(0);
}

if (invariantFailures.length) {
  console.error(JSON.stringify({
    status: 'invalid',
    failures: invariantFailures,
    markdownReportPath: DOC_REPORT_PATH,
    jsonReportPath: JSON_REPORT_PATH,
  }, null, 2));
  process.exit(1);
}

mkdirSync(dirname(JSON_REPORT_PATH), { recursive: true });
mkdirSync(dirname(DOC_REPORT_PATH), { recursive: true });
writeFileSync(JSON_REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
writeFileSync(DOC_REPORT_PATH, markdown, 'utf8');

console.log(JSON.stringify({
  version: summary.version,
  repositoryCount: summary.repositoryCount,
  globalAllPlaceNamesAllowedCount: summary.globalAllPlaceNamesAllowedCount,
  completeSliceAllowedCount: summary.completeSliceAllowedCount,
  claimBoundary: summary.claimBoundary,
  byDimension: summary.byDimension,
  jsonReportPath: JSON_REPORT_PATH,
  markdownReportPath: DOC_REPORT_PATH,
}, null, 2));
