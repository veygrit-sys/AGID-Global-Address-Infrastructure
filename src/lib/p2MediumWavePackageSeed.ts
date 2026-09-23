import type {
  P2MediumGeoRepositoryPlan,
  P2MediumPlanItem,
} from './p2MediumGeoRepositoryPlan';

export const P2_MEDIUM_WAVE_PACKAGE_SEED_VERSION = 'p2-medium-wave-package-seed-v0.1';

export type P2MediumPackageKind =
  | 'admin-boundaries'
  | 'gazetteer'
  | 'geocoder-fixtures'
  | 'address-candidates'
  | 'no-postcode-grid'
  | 'license-ledger';

export type P2MediumSeedPackage = {
  repository: string;
  kind: P2MediumPackageKind;
  countryCode: string;
  countryName: string;
  stage: P2MediumPlanItem['stage'];
  wave: number;
  paths: {
    readme: string;
    sources: string;
    qualityGates: string;
    fixtures: string[];
  };
  publicationState: 'seed-ready' | 'metadata-only' | 'blocked-until-license-review';
  nonClaims: string[];
  firstActions: string[];
};

export type P2MediumWavePackageSeed = {
  version: typeof P2_MEDIUM_WAVE_PACKAGE_SEED_VERSION;
  wave: number;
  itemCount: number;
  packageCount: number;
  packagesByKind: Record<P2MediumPackageKind, number>;
  sourceLedgerCoverage: {
    required: number;
    present: number;
    missing: string[];
  };
  packages: P2MediumSeedPackage[];
  releaseGates: string[];
};

const PACKAGE_KIND_ORDER: P2MediumPackageKind[] = [
  'admin-boundaries',
  'gazetteer',
  'geocoder-fixtures',
  'address-candidates',
  'no-postcode-grid',
  'license-ledger',
];

function packageKindFor(repository: string): P2MediumPackageKind {
  if (repository.includes('-boundaries')) return 'admin-boundaries';
  if (repository.includes('-gazetteer')) return 'gazetteer';
  if (repository.includes('-geocoder-fixtures')) return 'geocoder-fixtures';
  if (repository.includes('-address-candidates')) return 'address-candidates';
  if (repository.includes('-no-postcode-grid')) return 'no-postcode-grid';
  return 'license-ledger';
}

function publicationStateFor(kind: P2MediumPackageKind): P2MediumSeedPackage['publicationState'] {
  if (kind === 'license-ledger' || kind === 'geocoder-fixtures') return 'seed-ready';
  if (kind === 'gazetteer' || kind === 'no-postcode-grid') return 'metadata-only';
  return 'blocked-until-license-review';
}

function packagePaths(repository: string, kind: P2MediumPackageKind) {
  const root = `data/open_geo_repositories/${repository}`;
  const fixtures = kind === 'license-ledger'
    ? [`${root}/fixtures/source-ledger-conformance.json`]
    : [
      `${root}/fixtures/synthetic-candidate-conformance.json`,
      `${root}/fixtures/source-confidence-conformance.json`,
    ];
  return {
    readme: `${root}/README.md`,
    sources: `${root}/sources.json`,
    qualityGates: `${root}/quality-gates.json`,
    fixtures,
  };
}

function nonClaimsFor(item: P2MediumPlanItem, kind: P2MediumPackageKind) {
  const nonClaims = [
    'This seed does not claim complete national address coverage.',
    'This seed does not prove delivery, postal, legal, or cadastral authority.',
    'This seed does not bundle upstream geometry or private coordinates before license review.',
  ];
  if (kind === 'no-postcode-grid') {
    nonClaims.push('The no-postcode grid is a fallback validation aid, not an official postcode system.');
  }
  if (item.manualFallback) {
    nonClaims.push('Manual review remains part of the expected behavior until conformance fixtures pass.');
  }
  return nonClaims;
}

function emptyKindCounts(): Record<P2MediumPackageKind, number> {
  return Object.fromEntries(PACKAGE_KIND_ORDER.map(kind => [kind, 0])) as Record<P2MediumPackageKind, number>;
}

export function buildP2MediumWavePackageSeed(
  plan: P2MediumGeoRepositoryPlan,
  wave = 1,
): P2MediumWavePackageSeed {
  const items = plan.items.filter(item => item.wave === wave);
  const packagesByKind = emptyKindCounts();
  const packages = items.flatMap(item => item.repositorySet.map((repository): P2MediumSeedPackage => {
    const kind = packageKindFor(repository);
    packagesByKind[kind] += 1;
    return {
      repository,
      kind,
      countryCode: item.countryCode,
      countryName: item.countryName,
      stage: item.stage,
      wave,
      paths: packagePaths(repository, kind),
      publicationState: publicationStateFor(kind),
      nonClaims: nonClaimsFor(item, kind),
      firstActions: [
        ...item.firstActions.slice(0, 3),
        'Create README, sources.json, quality-gates.json, and synthetic fixtures before any remote repository creation.',
      ],
    };
  }));
  const sourceLedgerMissing = packages
    .filter(pkg => !pkg.paths.sources.endsWith('/sources.json'))
    .map(pkg => pkg.repository);

  return {
    version: P2_MEDIUM_WAVE_PACKAGE_SEED_VERSION,
    wave,
    itemCount: items.length,
    packageCount: packages.length,
    packagesByKind,
    sourceLedgerCoverage: {
      required: packages.length,
      present: packages.length - sourceLedgerMissing.length,
      missing: sourceLedgerMissing,
    },
    packages,
    releaseGates: plan.releaseGates,
  };
}
