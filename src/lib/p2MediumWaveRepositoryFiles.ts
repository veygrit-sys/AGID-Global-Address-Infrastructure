import type {
  P2MediumSeedPackage,
  P2MediumWavePackageSeed,
} from './p2MediumWavePackageSeed';

export const P2_MEDIUM_WAVE_REPOSITORY_FILES_VERSION = 'p2-medium-wave-repository-files-v0.1';

export type P2MediumRepositoryFile = {
  path: string;
  content: string;
};

export type P2MediumRepositoryFileScope = 'all' | 'core';

function json(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readmeFor(pkg: P2MediumSeedPackage) {
  return [
    `# ${pkg.repository}`,
    '',
    `${pkg.countryName} (${pkg.countryCode}) P2 medium AGID open-geodata seed package.`,
    '',
    'This package is metadata-first. It creates a repository-ready scaffold for source review, synthetic conformance, and future address-quality promotion without bundling upstream geodata.',
    '',
    '## Scope',
    '',
    `- Country or region code: \`${pkg.countryCode}\``,
    `- Stage: \`${pkg.stage}\``,
    `- Package kind: \`${pkg.kind}\``,
    `- Publication state: \`${pkg.publicationState}\``,
    '',
    '## Non-Claims',
    '',
    ...pkg.nonClaims.map(claim => `- ${claim}`),
    '',
    '## Required Files',
    '',
    '- `sources.json` - source and redistribution review ledger',
    '- `quality-gates.json` - promotion gates',
    '- `fixtures/synthetic-candidate-conformance.json` - synthetic candidate tests',
    '- `fixtures/source-confidence-conformance.json` - source confidence tests',
    '',
    '## First Actions',
    '',
    ...pkg.firstActions.map(action => `- ${action}`),
    '',
  ].join('\n');
}

function sourcesFor(pkg: P2MediumSeedPackage) {
  return {
    schemaVersion: 'agid-open-p2-source-ledger-v0.1',
    repository: pkg.repository,
    countryCode: pkg.countryCode,
    countryName: pkg.countryName,
    packageKind: pkg.kind,
    upstreamDataBundled: false,
    redistributionStatus: 'review-required-before-import',
    sources: [
      {
        id: `${pkg.countryCode.toLowerCase()}-${pkg.kind}-source-candidate`,
        role: pkg.kind,
        ingestionStatus: 'metadata-only',
        redistributionStatus: 'not-bundled',
        confidence: 'unknown-until-source-review',
      },
    ],
  };
}

function qualityGatesFor(pkg: P2MediumSeedPackage, releaseGates: string[]) {
  return {
    schemaVersion: 'agid-open-p2-quality-gates-v0.1',
    repository: pkg.repository,
    publicationState: pkg.publicationState,
    gates: releaseGates.map(id => ({ id, required: true })),
  };
}

function syntheticCandidateFixtureFor(pkg: P2MediumSeedPackage) {
  return {
    schemaVersion: 'agid-open-p2-synthetic-candidate-conformance-v0.1',
    repository: pkg.repository,
    packageKind: pkg.kind,
    candidatePolicy: {
      rawAddressMaterialAllowed: false,
      productionCoordinatesAllowed: false,
      syntheticOnlyUntilLicenseReview: true,
    },
    expectedBehavior: [
      'candidate-generation-visible',
      'manual-review-on-low-confidence',
      'no-delivery-or-legal-claim',
    ],
  };
}

function sourceConfidenceFixtureFor(pkg: P2MediumSeedPackage) {
  return {
    schemaVersion: 'agid-open-p2-source-confidence-conformance-v0.1',
    repository: pkg.repository,
    minimumRequiredFields: [
      'source_id',
      'source_role',
      'license_review_status',
      'redistribution_status',
      'last_reviewed_at',
    ],
    promotionBlockers: [
      'missing-license-review',
      'upstream-data-bundled-before-review',
      'complete-coverage-claim',
      'delivery-validity-claim',
    ],
  };
}

function licenseLedgerFixtureFor(pkg: P2MediumSeedPackage) {
  return {
    schemaVersion: 'agid-open-p2-license-ledger-conformance-v0.1',
    repository: pkg.repository,
    requiredBeforeImport: [
      'source-license-ledger',
      'redistribution-review',
      'attribution-plan',
      'non-claim-review',
    ],
  };
}

function filesForPackage(pkg: P2MediumSeedPackage, releaseGates: string[]): P2MediumRepositoryFile[] {
  const root = `data/open_geo_repositories/${pkg.repository}`;
  const files: P2MediumRepositoryFile[] = [
    { path: `${root}/README.md`, content: readmeFor(pkg) },
    { path: `${root}/sources.json`, content: json(sourcesFor(pkg)) },
    { path: `${root}/quality-gates.json`, content: json(qualityGatesFor(pkg, releaseGates)) },
  ];
  if (pkg.kind === 'license-ledger') {
    files.push({
      path: `${root}/fixtures/source-ledger-conformance.json`,
      content: json(licenseLedgerFixtureFor(pkg)),
    });
    return files;
  }
  files.push(
    { path: `${root}/fixtures/synthetic-candidate-conformance.json`, content: json(syntheticCandidateFixtureFor(pkg)) },
    { path: `${root}/fixtures/source-confidence-conformance.json`, content: json(sourceConfidenceFixtureFor(pkg)) },
  );
  return files;
}

export function buildP2MediumWaveRepositoryFiles(seed: P2MediumWavePackageSeed): P2MediumRepositoryFile[] {
  return seed.packages.flatMap(pkg => filesForPackage(pkg, seed.releaseGates));
}

export function filterP2MediumWaveRepositoryFiles(
  files: P2MediumRepositoryFile[],
  scope: P2MediumRepositoryFileScope,
): P2MediumRepositoryFile[] {
  if (scope === 'all') return files;
  return files.filter(file =>
    file.path.endsWith('/README.md')
    || file.path.endsWith('/sources.json')
    || file.path.endsWith('/quality-gates.json'));
}
