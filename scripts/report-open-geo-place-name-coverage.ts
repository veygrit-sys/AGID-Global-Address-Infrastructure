import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'data', 'open_geo_repositories');
const JSON_REPORT_PATH = join(process.cwd(), 'test-results', 'open-geo-place-name-coverage-audit.json');
const DOC_REPORT_PATH = join(process.cwd(), 'docs', 'open-geo-place-name-coverage-audit.md');

type RepoAudit = {
  name: string;
  relativePath: string;
  hasManifest: boolean;
  hasFixtures: boolean;
  hasDataPlaceSeed: boolean;
  hasGazetteerPlaceSeeds: boolean;
  isGazetteerRepo: boolean;
  readmeText: string;
};

function walkFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    const stat = statSync(path);
    return stat.isDirectory() ? walkFiles(path) : [path];
  });
}

function listRepos(): RepoAudit[] {
  return readdirSync(ROOT)
    .map(name => join(ROOT, name))
    .filter(path => statSync(path).isDirectory())
    .filter(path => /[\\/]agid-open-/.test(path))
    .map(path => {
      const readmePath = join(path, 'README.md');
      return {
        name: path.split(/[\\/]/).at(-1) ?? path,
        relativePath: relative(process.cwd(), path),
        hasManifest: existsSync(join(path, 'manifest.json')),
        hasFixtures: existsSync(join(path, 'fixtures')),
        hasDataPlaceSeed: existsSync(join(path, 'data', 'place-seed.json')),
        hasGazetteerPlaceSeeds: existsSync(join(path, 'gazetteer', 'place-seeds.json')),
        isGazetteerRepo: /gazetteer/.test(path),
        readmeText: existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '',
      };
    });
}

function countJsonRecords(file: string) {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    if (Array.isArray(parsed)) return parsed.length;
    if (Array.isArray(parsed.places)) return parsed.places.length;
    if (Array.isArray(parsed.features)) return parsed.features.length;
    if (Array.isArray(parsed.records)) return parsed.records.length;
    return 1;
  } catch {
    return 0;
  }
}

function countSeedRecords() {
  const files = walkFiles(ROOT);
  const dataPlaceSeedFiles = files.filter(file => /[\\/]data[\\/]place-seed\.json$/.test(file));
  const gazetteerPlaceSeedFiles = files.filter(file => /[\\/]gazetteer[\\/]place-seeds\.json$/.test(file));
  return {
    dataPlaceSeedFiles: dataPlaceSeedFiles.length,
    dataPlaceSeedRecords: dataPlaceSeedFiles.reduce((sum, file) => sum + countJsonRecords(file), 0),
    gazetteerPlaceSeedFiles: gazetteerPlaceSeedFiles.length,
    gazetteerPlaceSeedRecords: gazetteerPlaceSeedFiles.reduce((sum, file) => sum + countJsonRecords(file), 0),
  };
}

function matchingRepoCount(repos: RepoAudit[], pattern: RegExp) {
  return repos.filter(repo => pattern.test(repo.readmeText)).length;
}

function markdownList(values: string[]) {
  return values.length ? values.map(value => `- \`${value}\``).join('\n') : '- None';
}

const repos = listRepos();
const seedCounts = countSeedRecords();
const gazetteerRepos = repos.filter(repo => repo.isGazetteerRepo);
const gazetteerWithSeeds = gazetteerRepos.filter(repo => repo.hasDataPlaceSeed || repo.hasGazetteerPlaceSeeds);
const gazetteerWithoutSeeds = gazetteerRepos.filter(repo => !repo.hasDataPlaceSeed && !repo.hasGazetteerPlaceSeeds);

const report = {
  version: 'open-geo-place-name-coverage-audit-v0.1',
  generatedAt: new Date().toISOString(),
  verdict: 'not-complete-global-place-name-coverage',
  summary: {
    totalOpenGeoRepos: repos.length,
    reposWithManifest: repos.filter(repo => repo.hasManifest).length,
    reposWithFixtures: repos.filter(repo => repo.hasFixtures).length,
    gazetteerRepos: gazetteerRepos.length,
    gazetteerWithSeeds: gazetteerWithSeeds.length,
    gazetteerWithoutSeeds: gazetteerWithoutSeeds.length,
    reposWithDataPlaceSeed: repos.filter(repo => repo.hasDataPlaceSeed).length,
    reposWithGazetteerPlaceSeeds: repos.filter(repo => repo.hasGazetteerPlaceSeeds).length,
    completeCountrySliceClaims: matchingRepoCount(repos, /Complete Country Slice/),
    completeRegionSliceClaims: matchingRepoCount(repos, /Complete Region Slice/),
    nonCompleteDatasetDisclaimers: matchingRepoCount(repos, /not a complete country or territory address dataset/),
    noDeliveryAuthorityDisclaimers: matchingRepoCount(repos, /does not prove delivery availability|does not prove delivery, postal, legal, or cadastral authority/),
    manualFallbackDisclaimers: matchingRepoCount(repos, /does not remove manual fallback/),
    ...seedCounts,
  },
  interpretation: [
    'The repository set contains many useful open-source geography seeds, but it does not contain evidence that every place name is recorded.',
    'Most packages are seed, source, fixture, boundary, or review scaffolds rather than complete authoritative gazetteers.',
    'Complete-slice language appears only on a small subset and should be read as complete for the declared local slice, not complete global place-name coverage.',
    'A true all-place-name claim needs per-country source inventories, authoritative source versions, reconciliation fixtures, and source-delta tests.',
  ],
  requiredNextGates: [
    'Add per-country authoritative gazetteer source inventory.',
    'Track source license, version, download date, and redistribution constraints.',
    'Add reconciliation vectors against official sources plus OSM/GeoNames/Wikidata where licenses allow.',
    'Separate settlement, administrative unit, island, POI, natural feature, historical name, and alias coverage.',
    'Make complete-coverage claims impossible unless a country pack passes declared source completeness gates.',
  ],
  samples: {
    gazetteerReposMissingSeed: gazetteerWithoutSeeds.slice(0, 25).map(repo => repo.name),
    completeSliceClaimRepos: repos
      .filter(repo => /Complete Country Slice|Complete Region Slice/.test(repo.readmeText))
      .slice(0, 25)
      .map(repo => repo.name),
  },
};

const markdown = [
  '# Open Geo Place Name Coverage Audit',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `Verdict: **${report.verdict}**`,
  '',
  'This audit checks the local open-source geography repository seeds. It does not contact external official gazetteers, so it cannot prove external real-world completeness. Its purpose is to prevent overclaiming and identify the next coverage gates.',
  '',
  '## Summary',
  '',
  `- Open geo repositories: ${report.summary.totalOpenGeoRepos}`,
  `- Repositories with manifests: ${report.summary.reposWithManifest}`,
  `- Repositories with fixtures: ${report.summary.reposWithFixtures}`,
  `- Gazetteer-named repositories: ${report.summary.gazetteerRepos}`,
  `- Gazetteer repositories with place seeds: ${report.summary.gazetteerWithSeeds}`,
  `- Gazetteer repositories without place seeds: ${report.summary.gazetteerWithoutSeeds}`,
  `- \`data/place-seed.json\` files: ${report.summary.dataPlaceSeedFiles}`,
  `- \`data/place-seed.json\` records: ${report.summary.dataPlaceSeedRecords}`,
  `- \`gazetteer/place-seeds.json\` files: ${report.summary.gazetteerPlaceSeedFiles}`,
  `- \`gazetteer/place-seeds.json\` records: ${report.summary.gazetteerPlaceSeedRecords}`,
  `- Complete country slice claims: ${report.summary.completeCountrySliceClaims}`,
  `- Complete region slice claims: ${report.summary.completeRegionSliceClaims}`,
  `- Non-complete dataset disclaimers: ${report.summary.nonCompleteDatasetDisclaimers}`,
  `- No delivery/legal authority disclaimers: ${report.summary.noDeliveryAuthorityDisclaimers}`,
  `- Manual fallback disclaimers: ${report.summary.manualFallbackDisclaimers}`,
  '',
  '## Interpretation',
  '',
  ...report.interpretation.map(item => `- ${item}`),
  '',
  '## Required Next Gates',
  '',
  ...report.requiredNextGates.map(item => `- ${item}`),
  '',
  '## Sample Gazetteer Repositories Missing Place Seeds',
  '',
  markdownList(report.samples.gazetteerReposMissingSeed),
  '',
  '## Sample Complete-Slice Claim Repositories',
  '',
  markdownList(report.samples.completeSliceClaimRepos),
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
