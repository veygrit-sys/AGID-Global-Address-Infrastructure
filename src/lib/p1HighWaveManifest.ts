import type {
  P1HighRecoveryPackage,
  P1HighWaveRecoverySeed,
} from './p1HighWaveRecoverySeed';

export const P1_HIGH_WAVE_MANIFEST_VERSION = 'p1-high-wave-manifest-v0.1';

export type P1HighWaveManifestPackage = {
  repository: string;
  kind: P1HighRecoveryPackage['kind'];
  countryCode: string;
  countryName: string;
  coreFiles: {
    required: string[];
    present: string[];
    missing: string[];
    complete: boolean;
  };
  fixtureFiles: {
    required: string[];
    present: string[];
    missing: string[];
    complete: boolean;
  };
  publicationState: P1HighRecoveryPackage['publicationState'];
  readiness: 'source-review-ready' | 'fixture-incomplete' | 'core-incomplete';
  nonClaims: string[];
};

export type P1HighWaveManifest = {
  version: typeof P1_HIGH_WAVE_MANIFEST_VERSION;
  wave: number;
  packageCount: number;
  coreCompleteCount: number;
  fixtureCompleteCount: number;
  sourceReviewReadyCount: number;
  packages: P1HighWaveManifestPackage[];
};

function corePaths(pkg: P1HighRecoveryPackage) {
  return [pkg.paths.readme, pkg.paths.sources, pkg.paths.qualityGates];
}

function presence(paths: string[], fileExists: (path: string) => boolean) {
  const present = paths.filter(fileExists);
  const missing = paths.filter(path => !fileExists(path));
  return {
    required: paths,
    present,
    missing,
    complete: missing.length === 0,
  };
}

function readinessFor(coreComplete: boolean, fixtureComplete: boolean): P1HighWaveManifestPackage['readiness'] {
  if (!coreComplete) return 'core-incomplete';
  if (!fixtureComplete) return 'fixture-incomplete';
  return 'source-review-ready';
}

export function buildP1HighWaveManifest(
  seed: P1HighWaveRecoverySeed,
  fileExists: (path: string) => boolean,
): P1HighWaveManifest {
  const packages = seed.packages.map((pkg): P1HighWaveManifestPackage => {
    const coreFiles = presence(corePaths(pkg), fileExists);
    const fixtureFiles = presence(pkg.paths.fixtures, fileExists);
    return {
      repository: pkg.repository,
      kind: pkg.kind,
      countryCode: pkg.countryCode,
      countryName: pkg.countryName,
      coreFiles,
      fixtureFiles,
      publicationState: pkg.publicationState,
      readiness: readinessFor(coreFiles.complete, fixtureFiles.complete),
      nonClaims: pkg.nonClaims,
    };
  });

  return {
    version: P1_HIGH_WAVE_MANIFEST_VERSION,
    wave: seed.wave,
    packageCount: packages.length,
    coreCompleteCount: packages.filter(pkg => pkg.coreFiles.complete).length,
    fixtureCompleteCount: packages.filter(pkg => pkg.fixtureFiles.complete).length,
    sourceReviewReadyCount: packages.filter(pkg => pkg.readiness === 'source-review-ready').length,
    packages,
  };
}
