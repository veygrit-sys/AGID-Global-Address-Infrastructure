import type {
  P1HighRecoveryPackage,
  P1HighWaveRecoverySeed,
} from './p1HighWaveRecoverySeed';

export const P1_HIGH_WAVE_REPOSITORY_FILES_VERSION = 'p1-high-wave-repository-files-v0.1';

export type P1HighRepositoryFile = {
  path: string;
  content: string;
};

export type P1HighRepositoryFileScope = 'all' | 'core' | 'fixtures';

function json(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readmeFor(pkg: P1HighRecoveryPackage) {
  return [
    `# ${pkg.repository}`,
    '',
    `${pkg.countryName} (${pkg.countryCode}) P1 high AGID open-geodata recovery seed.`,
    '',
    'This package is metadata-first. It records source-ledger requirements, missing-role recovery fixtures, and publication gates before any remote repository is created.',
    '',
    '## Scope',
    '',
    `- Country or region code: \`${pkg.countryCode}\``,
    `- Recovery track: \`${pkg.recoveryTrack}\``,
    `- Present local core role: \`${pkg.presentRole}\``,
    `- Missing core roles: ${pkg.missingRoles.map(role => `\`${role}\``).join(', ')}`,
    `- Publication state: \`${pkg.publicationState}\``,
    '',
    '## Non-Claims',
    '',
    ...pkg.nonClaims.map(claim => `- ${claim}`),
    '',
    '## Required Files',
    '',
    '- `sources.json` - source and redistribution review ledger',
    '- `quality-gates.json` - publication and promotion gates',
    '- `fixtures/missing-role-recovery.json` - synthetic missing-role fixture map',
    '- `fixtures/manual-fallback-trigger.json` - manual review trigger fixture',
    '- `fixtures/non-claim-conformance.json` - overclaim prevention fixture',
    '',
    '## Next Actions',
    '',
    ...pkg.firstActions.map(action => `- ${action}`),
    '',
  ].join('\n');
}

function sourcesFor(pkg: P1HighRecoveryPackage) {
  return {
    schemaVersion: 'agid-open-p1-source-ledger-v0.1',
    repository: pkg.repository,
    countryCode: pkg.countryCode,
    countryName: pkg.countryName,
    presentRole: pkg.presentRole,
    missingRoles: pkg.missingRoles,
    sources: [
      {
        id: `${pkg.countryCode.toLowerCase()}-${pkg.presentRole}-local-source`,
        role: pkg.presentRole,
        ingestionStatus: 'metadata-linked',
        redistributionStatus: 'review-required',
        notes: 'One present local core role is named for P1 recovery planning; upstream data is not bundled in this seed.',
      },
      ...pkg.missingRoles.map(role => ({
        id: `${pkg.countryCode.toLowerCase()}-${role}-candidate-source`,
        role,
        ingestionStatus: 'synthetic-fixture-only',
        redistributionStatus: 'not-bundled',
        notes: 'Missing role must be recovered with source-ledger review before promotion to P2.',
      })),
    ],
  };
}

function qualityGatesFor(pkg: P1HighRecoveryPackage, releaseGates: string[]) {
  return {
    schemaVersion: 'agid-open-p1-quality-gates-v0.1',
    repository: pkg.repository,
    manualFallbackPolicy: 'required-until-conformance-pass',
    gates: releaseGates.map(id => ({ id, required: true })),
  };
}

function missingRoleFixtureFor(pkg: P1HighRecoveryPackage) {
  return {
    schemaVersion: 'agid-open-p1-missing-role-recovery-v0.1',
    repository: pkg.repository,
    presentRole: pkg.presentRole,
    missingRoles: pkg.missingRoles.map(role => ({
      role,
      status: 'synthetic-fixture-or-blocker-required',
      allowedEvidence: ['source-ledger-link', 'license-review-note', 'synthetic-conformance-vector'],
    })),
  };
}

function manualFallbackFixtureFor(pkg: P1HighRecoveryPackage) {
  return {
    schemaVersion: 'agid-open-p1-manual-fallback-v0.1',
    repository: pkg.repository,
    triggers: [
      'missing-role-evidence',
      'license-review-incomplete',
      'candidate-confidence-below-threshold',
      'legal-or-delivery-claim-requested',
    ],
    expectedOutcome: 'manual-review-required',
  };
}

function nonClaimFixtureFor(pkg: P1HighRecoveryPackage) {
  return {
    schemaVersion: 'agid-open-p1-non-claim-conformance-v0.1',
    repository: pkg.repository,
    blockedClaims: pkg.nonClaims,
    promotionRule: 'promotion-to-p2-requires-conformance-pass',
  };
}

function filesForPackage(pkg: P1HighRecoveryPackage, releaseGates: string[]): P1HighRepositoryFile[] {
  const root = `data/open_geo_repositories/${pkg.repository}`;
  const files: P1HighRepositoryFile[] = [
    { path: `${root}/README.md`, content: readmeFor(pkg) },
    { path: `${root}/sources.json`, content: json(sourcesFor(pkg)) },
    { path: `${root}/quality-gates.json`, content: json(qualityGatesFor(pkg, releaseGates)) },
  ];
  if (pkg.kind === 'license-ledger') {
    files.push({
      path: `${root}/fixtures/license-ledger-conformance.json`,
      content: json({
        schemaVersion: 'agid-open-p1-license-ledger-conformance-v0.1',
        repository: pkg.repository,
        required: ['source-license-ledger-required', 'redistribution-review-before-import'],
      }),
    });
    return files;
  }
  files.push(
    { path: `${root}/fixtures/missing-role-recovery.json`, content: json(missingRoleFixtureFor(pkg)) },
    { path: `${root}/fixtures/manual-fallback-trigger.json`, content: json(manualFallbackFixtureFor(pkg)) },
    { path: `${root}/fixtures/non-claim-conformance.json`, content: json(nonClaimFixtureFor(pkg)) },
  );
  return files;
}

export function buildP1HighWaveRepositoryFiles(seed: P1HighWaveRecoverySeed): P1HighRepositoryFile[] {
  return seed.packages.flatMap(pkg => filesForPackage(pkg, seed.releaseGates));
}

export function filterP1HighWaveRepositoryFiles(
  files: P1HighRepositoryFile[],
  scope: P1HighRepositoryFileScope,
): P1HighRepositoryFile[] {
  if (scope === 'all') return files;
  if (scope === 'fixtures') return files.filter(file => file.path.includes('/fixtures/'));
  return files.filter(file =>
    file.path.endsWith('/README.md')
    || file.path.endsWith('/sources.json')
    || file.path.endsWith('/quality-gates.json'));
}
