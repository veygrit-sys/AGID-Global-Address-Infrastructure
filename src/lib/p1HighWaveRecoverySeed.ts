import type {
  P1HighGeoRepositoryPlan,
  P1HighPlanItem,
  P1HighRecoveryTrack,
} from './p1HighGeoRepositoryPlan';

export const P1_HIGH_WAVE_RECOVERY_SEED_VERSION = 'p1-high-wave-recovery-seed-v0.1';

export type P1HighRecoveryPackageKind =
  | 'admin-boundaries'
  | 'gazetteer'
  | 'geocoder-fixtures'
  | 'address-candidates'
  | 'license-ledger';

export type P1HighRecoveryPackage = {
  repository: string;
  kind: P1HighRecoveryPackageKind;
  countryCode: string;
  countryName: string;
  recoveryTrack: P1HighRecoveryTrack;
  presentRole: string;
  missingRoles: string[];
  wave: number;
  paths: {
    readme: string;
    sources: string;
    qualityGates: string;
    fixtures: string[];
  };
  publicationState: 'recovery-seed' | 'metadata-only' | 'blocked-until-three-role-conformance';
  recoveryAssertions: string[];
  nonClaims: string[];
  firstActions: string[];
};

export type P1HighWaveRecoverySeed = {
  version: typeof P1_HIGH_WAVE_RECOVERY_SEED_VERSION;
  wave: number;
  itemCount: number;
  packageCount: number;
  packagesByKind: Record<P1HighRecoveryPackageKind, number>;
  missingRoleCoverage: {
    required: number;
    fixturedOrBlocked: number;
    missing: string[];
  };
  manualFallbackPolicy: 'required-until-conformance-pass';
  packages: P1HighRecoveryPackage[];
  releaseGates: string[];
};

const PACKAGE_KIND_ORDER: P1HighRecoveryPackageKind[] = [
  'admin-boundaries',
  'gazetteer',
  'geocoder-fixtures',
  'address-candidates',
  'license-ledger',
];

function packageKindFor(repository: string): P1HighRecoveryPackageKind {
  if (repository.includes('-boundaries')) return 'admin-boundaries';
  if (repository.includes('-gazetteer')) return 'gazetteer';
  if (repository.includes('-geocoder-fixtures')) return 'geocoder-fixtures';
  if (repository.includes('-address-candidates')) return 'address-candidates';
  return 'license-ledger';
}

function publicationStateFor(kind: P1HighRecoveryPackageKind): P1HighRecoveryPackage['publicationState'] {
  if (kind === 'license-ledger' || kind === 'geocoder-fixtures') return 'recovery-seed';
  if (kind === 'gazetteer') return 'metadata-only';
  return 'blocked-until-three-role-conformance';
}

function packagePaths(repository: string, kind: P1HighRecoveryPackageKind) {
  const root = `data/open_geo_repositories/${repository}`;
  const fixtures = kind === 'license-ledger'
    ? [`${root}/fixtures/license-ledger-conformance.json`]
    : [
      `${root}/fixtures/missing-role-recovery.json`,
      `${root}/fixtures/manual-fallback-trigger.json`,
      `${root}/fixtures/non-claim-conformance.json`,
    ];
  return {
    readme: `${root}/README.md`,
    sources: `${root}/sources.json`,
    qualityGates: `${root}/quality-gates.json`,
    fixtures,
  };
}

function recoveryAssertionsFor(item: P1HighPlanItem) {
  const presentRole = item.presentLocalCoreRoles[0] ?? 'unknown';
  return [
    `Exactly one local core role is currently present: ${presentRole}.`,
    `The missing core roles must be fixtured or explicitly blocked: ${item.missingCoreRoles.join(', ')}.`,
    'Manual fallback remains required until all missing-role conformance vectors pass.',
    'Promotion to P2 requires source-ledger, fixture, and quality-gate evidence.',
  ];
}

function nonClaimsFor(item: P1HighPlanItem) {
  const nonClaims = [
    'This recovery seed is not a complete country or territory address dataset.',
    'This recovery seed does not prove delivery availability, postal validity, or legal boundary authority.',
    'This recovery seed does not bundle upstream source data before redistribution review.',
    'This recovery seed does not remove manual fallback by itself.',
  ];
  if (item.regionKind !== 'country-or-main-region') {
    nonClaims.push('This recovery seed uses neutral technical identifiers for territory or special-region records.');
  }
  return nonClaims;
}

function emptyKindCounts(): Record<P1HighRecoveryPackageKind, number> {
  return Object.fromEntries(PACKAGE_KIND_ORDER.map(kind => [kind, 0])) as Record<P1HighRecoveryPackageKind, number>;
}

export function buildP1HighWaveRecoverySeed(
  plan: P1HighGeoRepositoryPlan,
  wave = 1,
): P1HighWaveRecoverySeed {
  const items = plan.items.filter(item => item.wave === wave);
  const packagesByKind = emptyKindCounts();
  const packages = items.flatMap(item => item.repositorySet.map((repository): P1HighRecoveryPackage => {
    const kind = packageKindFor(repository);
    packagesByKind[kind] += 1;
    return {
      repository,
      kind,
      countryCode: item.countryCode,
      countryName: item.countryName,
      recoveryTrack: item.recoveryTrack,
      presentRole: item.presentLocalCoreRoles[0] ?? 'unknown',
      missingRoles: item.missingCoreRoles,
      wave,
      paths: packagePaths(repository, kind),
      publicationState: publicationStateFor(kind),
      recoveryAssertions: recoveryAssertionsFor(item),
      nonClaims: nonClaimsFor(item),
      firstActions: [
        ...item.firstActions.slice(0, 3),
        'Create README, sources.json, quality-gates.json, and missing-role synthetic fixtures before any remote repository creation.',
      ],
    };
  }));
  const missingRoleMissing = packages
    .filter(pkg => pkg.missingRoles.length !== 3)
    .map(pkg => pkg.repository);

  return {
    version: P1_HIGH_WAVE_RECOVERY_SEED_VERSION,
    wave,
    itemCount: items.length,
    packageCount: packages.length,
    packagesByKind,
    missingRoleCoverage: {
      required: packages.length,
      fixturedOrBlocked: packages.length - missingRoleMissing.length,
      missing: missingRoleMissing,
    },
    manualFallbackPolicy: 'required-until-conformance-pass',
    packages,
    releaseGates: plan.releaseGates,
  };
}
