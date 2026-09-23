import { buildVeygritRepositoryHandoff } from './veygritRepositoryHandoff';

export const VEYGRIT_HANDOFF_BUNDLE_MANIFEST_VERSION = 'veygrit-handoff-bundle-manifest-v0.1';

export type VeygritHandoffBundleFile = {
  path: string;
  source: 'agid' | 'veygrit-app';
  role: string;
  freshnessCheck: string;
};

export type VeygritHandoffBundleCommand = {
  cwd: 'agid' | 'veygrit-app';
  command: string;
  purpose: string;
  writesLocalFiles: boolean;
  remoteMutationAllowed: false;
};

export type VeygritHandoffBundleManifest = {
  version: typeof VEYGRIT_HANDOFF_BUNDLE_MANIFEST_VERSION;
  status: 'manifest-only-no-archive-no-remote-mutation';
  targetRepository: string;
  localAppRoot: string;
  bundleIntent: string;
  files: VeygritHandoffBundleFile[];
  freshnessCommands: VeygritHandoffBundleCommand[];
  operatorDiscoveryCommands: VeygritHandoffBundleCommand[];
  blockedActions: string[];
  nonClaims: string[];
};

export type VeygritHandoffBundleManifestValidation = {
  ok: boolean;
  errors: string[];
};

export type VeygritHandoffBundleCoverageSummary = {
  agidFileCount: number;
  veygritAppFileCount: number;
  totalFileCount: number;
  agidFreshnessCommandCount: number;
  veygritAppFreshnessCommandCount: number;
  totalFreshnessCommandCount: number;
  operatorDiscoveryCommandCount: number;
  remoteMutationAllowedCount: number;
  writesLocalFilesCount: number;
  everyFileFreshnessCheckListed: boolean;
  everyListedCommandLocalOnly: boolean;
  passExportVerifierFilesCovered: boolean;
  passExportFreshnessCommandCovered: boolean;
};

const SecretLikePattern = /sk_live_|ghp_[A-Za-z0-9_]+|providerTokenValue|carrierCredentialValue|privateKeyValue|proofSecretValue|siwc_bypass_bearer_token/i;
const RemoteMutationCommandPattern = /\b(git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|npm\s+publish|sites\s+save|deploy\s+production)\b/i;

export function buildVeygritHandoffBundleManifest(): VeygritHandoffBundleManifest {
  const handoff = buildVeygritRepositoryHandoff();
  const appRoot = handoff.localRoots.sitesApp;

  return {
    version: VEYGRIT_HANDOFF_BUNDLE_MANIFEST_VERSION,
    status: 'manifest-only-no-archive-no-remote-mutation',
    targetRepository: handoff.targetRepository.fullName,
    localAppRoot: appRoot,
    bundleIntent:
      'Review the local Veygrit app handoff as a file list and freshness-command set before any explicitly requested GitHub update.',
    files: [
      {
        path: 'docs/product/veygrit-github-handoff.md',
        source: 'agid',
        role: 'human-readable GitHub update boundary and handoff evidence',
        freshnessCheck: 'npm run verify:veygrit-github-handoff',
      },
      {
        path: 'docs/product/veygrit-sites-codex-link.md',
        source: 'agid',
        role: 'Codex task, Sites project, GitHub account, and local source link',
        freshnessCheck: 'npm run verify:veygrit-sites-bridge',
      },
      {
        path: 'src/lib/veygritRepositoryHandoff.ts',
        source: 'agid',
        role: 'machine-readable repository handoff contract',
        freshnessCheck: 'npm run verify:veygrit-github-handoff',
      },
      {
        path: 'src/lib/veygritHandoffBundleManifest.ts',
        source: 'agid',
        role: 'machine-readable review bundle manifest',
        freshnessCheck: 'npm run verify:veygrit-handoff-bundle-manifest',
      },
      {
        path: 'docs/product/veygrit-boundary-gate-index.md',
        source: 'agid',
        role: 'reviewer-facing map of Veygrit no-script-fixture boundary gates',
        freshnessCheck: 'npm run verify:veygrit-boundary-gate-index',
      },
      {
        path: 'src/lib/veygritBoundaryGateIndex.ts',
        source: 'agid',
        role: 'machine-readable boundary gate index for Veygrit review surfaces',
        freshnessCheck: 'npm run verify:veygrit-boundary-gate-index',
      },
      {
        path: 'src/lib/veygritBoundaryGateIndex.test.ts',
        source: 'agid',
        role: 'fixture-backed verifier for boundary gate docs, scripts, and module coverage',
        freshnessCheck: 'npm run verify:veygrit-boundary-gate-index',
      },
      {
        path: 'scripts/verify-veygrit-app-release-readiness.ts',
        source: 'agid',
        role: 'AGID-side verifier for Veygrit app package readiness scripts and handoff files',
        freshnessCheck: 'npm run verify:veygrit-app-release-readiness',
      },
      {
        path: 'scripts/verify-veygrit-app-release-readiness.test.ts',
        source: 'agid',
        role: 'fixture tests proving the app package verifier blocks missing scripts and remote mutation commands',
        freshnessCheck: 'npm run verify:veygrit-app-release-readiness',
      },
      {
        path: 'scripts/run-veygrit-app-release-readiness.ts',
        source: 'agid',
        role: 'local-only runner for the app package verifier fixtures and live check',
        freshnessCheck: 'npm run verify:veygrit-app-release-readiness',
      },
      {
        path: 'src/lib/veygritReleaseReadinessDiscoveryContract.ts',
        source: 'agid',
        role: 'shared release-readiness list-mode labels, args, and markdown renderers',
        freshnessCheck: 'npm run verify:veygrit-app-release-readiness',
      },
      {
        path: 'scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts',
        source: 'agid',
        role: 'local verifier for Vey ID Address Wallet pass-export fixture and schema privacy boundaries',
        freshnessCheck: 'npm run verify:vey-id-address-wallet-pass-export-fixture-schema',
      },
      {
        path: 'scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.test.ts',
        source: 'agid',
        role: 'negative tests for pass-export verifier drift, unsafe refs, malformed JSON, and missing schema paths',
        freshnessCheck: 'npm run verify:vey-id-address-wallet-pass-export-fixture-schema',
      },
      {
        path: 'docs/specs/fixtures/vey-id-address-wallet-pass-export-v0.1.json',
        source: 'agid',
        role: 'synthetic local pass-export audit fixture for Apple Wallet, Google Wallet, and QR refs',
        freshnessCheck: 'npm run verify:vey-id-address-wallet-pass-export-fixture-schema',
      },
      {
        path: 'docs/specs/schemas/vey-id-address-wallet-pass-export-v0.1.schema.json',
        source: 'agid',
        role: 'JSON Schema subset pinned by the Vey ID pass-export verifier',
        freshnessCheck: 'npm run verify:vey-id-address-wallet-pass-export-fixture-schema',
      },
      {
        path: 'scripts/sync-veygrit-github-handoff.ts',
        source: 'agid',
        role: 'local-only handoff export and currentness check',
        freshnessCheck: 'npm run check:veygrit-github-handoff',
      },
      {
        path: 'sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts',
        source: 'agid',
        role: 'test-only hosted callback vector loader shared by React and Next.js Address Login SDK conformance tests',
        freshnessCheck: 'npm run verify:veygrit-address-login-packages',
      },
      {
        path: `${appRoot}/package.json`,
        source: 'veygrit-app',
        role: 'local app script entrypoints for handoff review',
        freshnessCheck: 'npm run check:agid-handoff',
      },
      {
        path: handoff.handoffExport.generatedFile,
        source: 'veygrit-app',
        role: 'generated AGID handoff visible inside the Veygrit app root',
        freshnessCheck: 'npm run check:veygrit-github-handoff',
      },
      {
        path: handoff.handoffExport.readmeFile,
        source: 'veygrit-app',
        role: 'local app README handoff entrypoint',
        freshnessCheck: 'npm run check:agid-handoff',
      },
      {
        path: handoff.handoffExport.releaseChecklistFile,
        source: 'veygrit-app',
        role: 'local review checklist and PR body seed after explicit user request',
        freshnessCheck: 'npm run check:agid-handoff',
      },
      {
        path: `${appRoot}/scripts/check-agid-handoff.mjs`,
        source: 'veygrit-app',
        role: 'app-local handoff, README, checklist, and secret-pattern verifier',
        freshnessCheck: 'npm run check:agid-handoff',
      },
      {
        path: `${appRoot}/scripts/check-agid-handoff.test.mjs`,
        source: 'veygrit-app',
        role: 'app-local handoff verifier positive and boundary-gate negative fixture tests',
        freshnessCheck: 'npm run test:agid-handoff',
      },
      {
        path: `${appRoot}/scripts/release-readiness.mjs`,
        source: 'veygrit-app',
        role: 'app-local README and release checklist JSON readiness summary',
        freshnessCheck: 'npm run check:release-readiness',
      },
      {
        path: `${appRoot}/scripts/release-readiness.test.mjs`,
        source: 'veygrit-app',
        role: 'app-local release readiness positive and negative fixture tests',
        freshnessCheck: 'npm run test:release-readiness',
      },
    ],
    freshnessCommands: [
      {
        cwd: 'agid',
        command: 'npm run verify:veygrit-handoff-bundle-manifest',
        purpose: 'Validate this manifest, docs, package script, no-secret patterns, and no remote mutation commands.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run verify:veygrit-boundary-gate-index',
        purpose: 'Validate the Veygrit no-script-fixture boundary gate map before handoff review.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run verify:veygrit-app-release-readiness',
        purpose: 'Confirm the local Veygrit app exposes required release readiness scripts and handoff files.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run verify:vey-id-address-wallet-pass-export-fixture-schema',
        purpose: 'Validate the Vey ID Address Wallet pass-export fixture and schema before handoff review.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run report:veygrit-handoff-bundle-manifest',
        purpose: 'Print the manifest as JSON for review without packaging files.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run verify:veygrit-github-handoff',
        purpose: 'Validate the underlying Veygrit repository handoff contract.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run sync:veygrit-github-handoff',
        purpose: 'Refresh AGID_HANDOFF.md in the local Veygrit app root.',
        writesLocalFiles: true,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run check:veygrit-github-handoff',
        purpose: 'Verify AGID_HANDOFF.md is current without writing.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run verify:veygrit-sites-bridge',
        purpose: 'Validate the AGID-to-Sites bridge file map used by the Veygrit Sites handoff doc.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run verify:veygrit-sites-presave',
        purpose: 'Run the local-only Sites pre-save aggregate gate.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run verify:veygrit-address-login-packages',
        purpose: 'Validate Veygrit Address Login package traceability, including the shared test-only callback vector helper.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'agid',
        command: 'npm run verify:preaudit-secrets',
        purpose: 'Scan external audit surfaces for secret-like material.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'veygrit-app',
        command: 'npm run check:agid-handoff',
        purpose: 'Verify app-local handoff, README, checklist, and secret-like patterns.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'veygrit-app',
        command: 'npm run test:agid-handoff',
        purpose: 'Verify app-local handoff positive and boundary-gate negative fixtures without editing live files.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'veygrit-app',
        command: 'npm run check:release-readiness',
        purpose: 'Print a JSON pass/fail summary for README and release checklist readiness.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'veygrit-app',
        command: 'npm run test:release-readiness',
        purpose: 'Verify release readiness positive and negative fixtures without editing live files.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'veygrit-app',
        command: 'npm run test:store-state',
        purpose: 'Verify My Stores revoke/reconnect state repair behavior.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
      {
        cwd: 'veygrit-app',
        command: 'npm run build',
        purpose: 'Build the local Veygrit Address Wallet UI bundle.',
        writesLocalFiles: true,
        remoteMutationAllowed: false,
      },
    ],
    operatorDiscoveryCommands: [
      {
        cwd: 'agid',
        command: 'npm run verify:veygrit-app-release-readiness:list',
        purpose:
          'List bundled Veygrit release-readiness gate labels and args without executing child verifier processes.',
        writesLocalFiles: false,
        remoteMutationAllowed: false,
      },
    ],
    blockedActions: [
      'create or delete remote GitHub repositories',
      'push commits',
      'open pull requests',
      'save a Sites version',
      'deploy production',
      'send production traffic',
      'archive, zip, or publish files that have not passed the listed freshness commands',
      'persist provider tokens, carrier credentials, source repository credentials, raw address material, recipient material, witness values, private keys, or proof secrets',
    ],
    nonClaims: [
      'This manifest is a file list and verification plan, not a deployable archive.',
      'This manifest does not prove the remote repository exists.',
      'This manifest does not grant GitHub push or pull request permission.',
      'This manifest does not approve Sites save or production deploy.',
    ],
  };
}

export function buildVeygritHandoffBundleCoverageSummary(
  manifest = buildVeygritHandoffBundleManifest(),
): VeygritHandoffBundleCoverageSummary {
  const freshnessCommandSet = new Set(manifest.freshnessCommands.map(command => command.command));
  const listedCommands = [...manifest.freshnessCommands, ...manifest.operatorDiscoveryCommands];
  const passExportVerifierFiles = [
    'scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts',
    'scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.test.ts',
    'docs/specs/fixtures/vey-id-address-wallet-pass-export-v0.1.json',
    'docs/specs/schemas/vey-id-address-wallet-pass-export-v0.1.schema.json',
  ];

  return {
    agidFileCount: manifest.files.filter(file => file.source === 'agid').length,
    veygritAppFileCount: manifest.files.filter(file => file.source === 'veygrit-app').length,
    totalFileCount: manifest.files.length,
    agidFreshnessCommandCount: manifest.freshnessCommands.filter(command => command.cwd === 'agid').length,
    veygritAppFreshnessCommandCount: manifest.freshnessCommands.filter(command => command.cwd === 'veygrit-app').length,
    totalFreshnessCommandCount: manifest.freshnessCommands.length,
    operatorDiscoveryCommandCount: manifest.operatorDiscoveryCommands.length,
    remoteMutationAllowedCount: listedCommands.filter(command => command.remoteMutationAllowed !== false).length,
    writesLocalFilesCount: listedCommands.filter(command => command.writesLocalFiles).length,
    everyFileFreshnessCheckListed: manifest.files.every(file => freshnessCommandSet.has(file.freshnessCheck)),
    everyListedCommandLocalOnly: listedCommands.every(
      command => command.remoteMutationAllowed === false && !RemoteMutationCommandPattern.test(command.command),
    ),
    passExportVerifierFilesCovered: passExportVerifierFiles.every(path =>
      manifest.files.some(file => file.path === path),
    ),
    passExportFreshnessCommandCovered: freshnessCommandSet.has('npm run verify:vey-id-address-wallet-pass-export-fixture-schema'),
  };
}

export function validateVeygritHandoffBundleManifest(
  manifest = buildVeygritHandoffBundleManifest(),
): VeygritHandoffBundleManifestValidation {
  const handoff = buildVeygritRepositoryHandoff();
  const errors: string[] = [];
  const json = JSON.stringify(manifest);
  const paths = manifest.files.map(file => file.path);
  const commands = manifest.freshnessCommands.map(command => command.command);
  const discoveryCommands = manifest.operatorDiscoveryCommands.map(command => command.command);
  const coverage = buildVeygritHandoffBundleCoverageSummary(manifest);

  if (manifest.version !== VEYGRIT_HANDOFF_BUNDLE_MANIFEST_VERSION) errors.push('version-mismatch');
  if (manifest.status !== 'manifest-only-no-archive-no-remote-mutation') {
    errors.push('unexpected-manifest-status');
  }
  if (manifest.targetRepository !== handoff.targetRepository.fullName) errors.push('target-repository-mismatch');
  if (manifest.localAppRoot !== handoff.localRoots.sitesApp) errors.push('local-app-root-mismatch');
  for (const requiredPath of [
    'docs/product/veygrit-github-handoff.md',
    'docs/product/veygrit-sites-codex-link.md',
    'src/lib/veygritRepositoryHandoff.ts',
    'src/lib/veygritHandoffBundleManifest.ts',
    'docs/product/veygrit-boundary-gate-index.md',
    'src/lib/veygritBoundaryGateIndex.ts',
    'src/lib/veygritBoundaryGateIndex.test.ts',
    'scripts/verify-veygrit-app-release-readiness.ts',
    'scripts/verify-veygrit-app-release-readiness.test.ts',
    'scripts/run-veygrit-app-release-readiness.ts',
    'src/lib/veygritReleaseReadinessDiscoveryContract.ts',
    'scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts',
    'scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.test.ts',
    'docs/specs/fixtures/vey-id-address-wallet-pass-export-v0.1.json',
    'docs/specs/schemas/vey-id-address-wallet-pass-export-v0.1.schema.json',
    'scripts/sync-veygrit-github-handoff.ts',
    'sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts',
    `${handoff.localRoots.sitesApp}/package.json`,
    handoff.handoffExport.generatedFile,
    handoff.handoffExport.readmeFile,
    handoff.handoffExport.releaseChecklistFile,
    `${handoff.localRoots.sitesApp}/scripts/check-agid-handoff.mjs`,
    `${handoff.localRoots.sitesApp}/scripts/check-agid-handoff.test.mjs`,
    `${handoff.localRoots.sitesApp}/scripts/release-readiness.mjs`,
    `${handoff.localRoots.sitesApp}/scripts/release-readiness.test.mjs`,
  ]) {
    if (!paths.includes(requiredPath)) errors.push(`missing-bundle-file:${requiredPath}`);
  }
  for (const requiredCommand of [
    'npm run verify:veygrit-handoff-bundle-manifest',
    'npm run verify:veygrit-boundary-gate-index',
    'npm run verify:veygrit-app-release-readiness',
    'npm run verify:vey-id-address-wallet-pass-export-fixture-schema',
    'npm run report:veygrit-handoff-bundle-manifest',
    'npm run verify:veygrit-github-handoff',
    'npm run sync:veygrit-github-handoff',
    'npm run check:veygrit-github-handoff',
    'npm run verify:veygrit-sites-bridge',
    'npm run verify:veygrit-sites-presave',
    'npm run verify:veygrit-address-login-packages',
    'npm run verify:preaudit-secrets',
    'npm run check:agid-handoff',
    'npm run test:agid-handoff',
    'npm run check:release-readiness',
    'npm run test:release-readiness',
    'npm run test:store-state',
    'npm run build',
  ]) {
    if (!commands.includes(requiredCommand)) errors.push(`missing-freshness-command:${requiredCommand}`);
  }
  for (const requiredCommand of [
    'npm run verify:veygrit-app-release-readiness:list',
  ]) {
    if (!discoveryCommands.includes(requiredCommand)) {
      errors.push(`missing-operator-discovery-command:${requiredCommand}`);
    }
  }
  if (manifest.freshnessCommands.some(command => command.remoteMutationAllowed)) {
    errors.push('remote-mutation-command-allowed');
  }
  if (manifest.operatorDiscoveryCommands.some(command => command.remoteMutationAllowed)) {
    errors.push('remote-mutation-discovery-command-allowed');
  }
  if (manifest.freshnessCommands.some(command => RemoteMutationCommandPattern.test(command.command))) {
    errors.push('remote-mutation-command-present');
  }
  if (manifest.operatorDiscoveryCommands.some(command => RemoteMutationCommandPattern.test(command.command))) {
    errors.push('remote-mutation-discovery-command-present');
  }
  if (manifest.operatorDiscoveryCommands.some(command => command.writesLocalFiles)) {
    errors.push('operator-discovery-command-writes-local-files');
  }
  if (!manifest.files.every(file => file.freshnessCheck.startsWith('npm run '))) {
    errors.push('non-npm-freshness-check');
  }
  if (coverage.agidFileCount < 17) errors.push('insufficient-agid-file-coverage');
  if (coverage.veygritAppFileCount < 8) errors.push('insufficient-veygrit-app-file-coverage');
  if (coverage.totalFreshnessCommandCount < 18) errors.push('insufficient-freshness-command-coverage');
  if (!coverage.everyFileFreshnessCheckListed) errors.push('unlisted-file-freshness-check');
  if (!coverage.everyListedCommandLocalOnly) errors.push('non-local-command-coverage');
  if (!coverage.passExportVerifierFilesCovered) errors.push('missing-pass-export-verifier-file-coverage');
  if (!coverage.passExportFreshnessCommandCovered) errors.push('missing-pass-export-freshness-command-coverage');
  if (!manifest.blockedActions.some(action => /push commits/i.test(action))) errors.push('missing-push-block');
  if (!manifest.blockedActions.some(action => /raw address material/i.test(action))) {
    errors.push('missing-raw-address-block');
  }
  if (!manifest.nonClaims.some(claim => /not a deployable archive/i.test(claim))) {
    errors.push('missing-no-archive-non-claim');
  }
  if (SecretLikePattern.test(json)) errors.push('secret-like-material-in-manifest');

  return { ok: errors.length === 0, errors };
}
