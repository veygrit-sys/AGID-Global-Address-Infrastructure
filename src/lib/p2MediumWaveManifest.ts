import type {
  P2MediumSeedPackage,
  P2MediumWavePackageSeed,
} from './p2MediumWavePackageSeed';

export const P2_MEDIUM_WAVE_MANIFEST_VERSION = 'p2-medium-wave-manifest-v0.1';

export type P2MediumWaveManifestPackage = {
  repository: string;
  kind: P2MediumSeedPackage['kind'];
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
  publicationState: P2MediumSeedPackage['publicationState'];
  readiness: 'source-review-ready' | 'fixture-incomplete' | 'core-incomplete';
  nonClaims: string[];
};

export type P2MediumWaveManifest = {
  version: typeof P2_MEDIUM_WAVE_MANIFEST_VERSION;
  wave: number;
  packageCount: number;
  coreCompleteCount: number;
  fixtureCompleteCount: number;
  sourceReviewReadyCount: number;
  packages: P2MediumWaveManifestPackage[];
};

function corePaths(pkg: P2MediumSeedPackage) {
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

function readinessFor(coreComplete: boolean, fixtureComplete: boolean): P2MediumWaveManifestPackage['readiness'] {
  if (!coreComplete) return 'core-incomplete';
  if (!fixtureComplete) return 'fixture-incomplete';
  return 'source-review-ready';
}

export function buildP2MediumWaveManifest(
  seed: P2MediumWavePackageSeed,
  fileExists: (path: string) => boolean,
): P2MediumWaveManifest {
  const packages = seed.packages.map((pkg): P2MediumWaveManifestPackage => {
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
    version: P2_MEDIUM_WAVE_MANIFEST_VERSION,
    wave: seed.wave,
    packageCount: packages.length,
    coreCompleteCount: packages.filter(pkg => pkg.coreFiles.complete).length,
    fixtureCompleteCount: packages.filter(pkg => pkg.fixtureFiles.complete).length,
    sourceReviewReadyCount: packages.filter(pkg => pkg.readiness === 'source-review-ready').length,
    packages,
  };
}
