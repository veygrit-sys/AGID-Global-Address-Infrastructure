import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  VEYGRIT_HANDOFF_BUNDLE_MANIFEST_VERSION,
  buildVeygritHandoffBundleCoverageSummary,
  buildVeygritHandoffBundleManifest,
  validateVeygritHandoffBundleManifest,
} from './veygritHandoffBundleManifest';
import { listVeygritAppReleaseReadinessSteps } from '../../scripts/run-veygrit-app-release-readiness';
import {
  EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_STEPS,
  escapeRegExp,
  renderVeygritReleaseReadinessDiscoveryBulletRows,
} from './veygritReleaseReadinessDiscoveryContract';

test('Veygrit handoff bundle manifest lists AGID and app review artifacts', () => {
  const manifest = buildVeygritHandoffBundleManifest();
  const paths = manifest.files.map(file => file.path);

  assert.equal(manifest.version, VEYGRIT_HANDOFF_BUNDLE_MANIFEST_VERSION);
  assert.equal(manifest.status, 'manifest-only-no-archive-no-remote-mutation');
  assert.equal(manifest.targetRepository, 'rei-k/Veygrit-US');
  assert.match(manifest.localAppRoot, /work\/veygrit-app$/);
  assert.ok(paths.includes('docs/product/veygrit-github-handoff.md'));
  assert.ok(paths.includes('docs/product/veygrit-sites-codex-link.md'));
  assert.ok(paths.includes('src/lib/veygritRepositoryHandoff.ts'));
  assert.ok(paths.includes('src/lib/veygritHandoffBundleManifest.ts'));
  assert.ok(paths.includes('docs/product/veygrit-boundary-gate-index.md'));
  assert.ok(paths.includes('src/lib/veygritBoundaryGateIndex.ts'));
  assert.ok(paths.includes('src/lib/veygritBoundaryGateIndex.test.ts'));
  assert.ok(paths.includes('scripts/verify-veygrit-app-release-readiness.ts'));
  assert.ok(paths.includes('scripts/verify-veygrit-app-release-readiness.test.ts'));
  assert.ok(paths.includes('scripts/run-veygrit-app-release-readiness.ts'));
  assert.ok(paths.includes('src/lib/veygritReleaseReadinessDiscoveryContract.ts'));
  assert.ok(paths.includes('scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts'));
  assert.ok(paths.includes('scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.test.ts'));
  assert.ok(paths.includes('docs/specs/fixtures/vey-id-address-wallet-pass-export-v0.1.json'));
  assert.ok(paths.includes('docs/specs/schemas/vey-id-address-wallet-pass-export-v0.1.schema.json'));
  assert.ok(paths.includes('scripts/sync-veygrit-github-handoff.ts'));
  assert.ok(paths.includes('sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts'));
  assert.ok(paths.some(path => path.endsWith('/package.json')));
  assert.ok(paths.some(path => path.endsWith('/AGID_HANDOFF.md')));
  assert.ok(paths.some(path => path.endsWith('/README.md')));
  assert.ok(paths.some(path => path.endsWith('/RELEASE_UPDATE_CHECKLIST.md')));
  assert.ok(paths.some(path => path.endsWith('/scripts/check-agid-handoff.mjs')));
  assert.ok(paths.some(path => path.endsWith('/scripts/check-agid-handoff.test.mjs')));
  assert.ok(paths.some(path => path.endsWith('/scripts/release-readiness.mjs')));
  assert.ok(paths.some(path => path.endsWith('/scripts/release-readiness.test.mjs')));
});

test('Veygrit handoff bundle manifest requires local freshness commands only', () => {
  const manifest = buildVeygritHandoffBundleManifest();
  const commands = manifest.freshnessCommands.map(command => command.command);
  const discoveryCommands = manifest.operatorDiscoveryCommands.map(command => command.command);

  assert.ok(commands.includes('npm run verify:veygrit-handoff-bundle-manifest'));
  assert.ok(commands.includes('npm run verify:veygrit-boundary-gate-index'));
  assert.ok(commands.includes('npm run verify:veygrit-app-release-readiness'));
  assert.ok(commands.includes('npm run verify:vey-id-address-wallet-pass-export-fixture-schema'));
  assert.ok(commands.includes('npm run report:veygrit-handoff-bundle-manifest'));
  assert.ok(commands.includes('npm run verify:veygrit-github-handoff'));
  assert.ok(commands.includes('npm run sync:veygrit-github-handoff'));
  assert.ok(commands.includes('npm run check:veygrit-github-handoff'));
  assert.ok(commands.includes('npm run verify:veygrit-sites-bridge'));
  assert.ok(commands.includes('npm run verify:veygrit-sites-presave'));
  assert.ok(commands.includes('npm run verify:veygrit-address-login-packages'));
  assert.ok(commands.includes('npm run verify:preaudit-secrets'));
  assert.ok(commands.includes('npm run check:agid-handoff'));
  assert.ok(commands.includes('npm run test:agid-handoff'));
  assert.ok(commands.includes('npm run check:release-readiness'));
  assert.ok(commands.includes('npm run test:release-readiness'));
  assert.ok(commands.includes('npm run test:store-state'));
  assert.ok(commands.includes('npm run build'));
  assert.ok(discoveryCommands.includes('npm run verify:veygrit-app-release-readiness:list'));
  assert.ok(manifest.freshnessCommands.every(command => command.remoteMutationAllowed === false));
  assert.ok(manifest.operatorDiscoveryCommands.every(command => command.remoteMutationAllowed === false));
  assert.ok(manifest.operatorDiscoveryCommands.every(command => command.writesLocalFiles === false));
  assert.ok(manifest.freshnessCommands.every(command => !/\b(git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|npm\s+publish)\b/i.test(command.command)));
  assert.ok(manifest.operatorDiscoveryCommands.every(command => !/\b(git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|npm\s+publish)\b/i.test(command.command)));
});

test('Veygrit handoff bundle coverage summary counts local review gates', () => {
  const manifest = buildVeygritHandoffBundleManifest();
  const coverage = buildVeygritHandoffBundleCoverageSummary(manifest);

  assert.equal(coverage.agidFileCount, 17);
  assert.equal(coverage.veygritAppFileCount, 8);
  assert.equal(coverage.totalFileCount, manifest.files.length);
  assert.equal(coverage.agidFreshnessCommandCount, 12);
  assert.equal(coverage.veygritAppFreshnessCommandCount, 6);
  assert.equal(coverage.totalFreshnessCommandCount, manifest.freshnessCommands.length);
  assert.equal(coverage.operatorDiscoveryCommandCount, 1);
  assert.equal(coverage.remoteMutationAllowedCount, 0);
  assert.equal(coverage.writesLocalFilesCount, 2);
  assert.equal(coverage.everyFileFreshnessCheckListed, true);
  assert.equal(coverage.everyListedCommandLocalOnly, true);
  assert.equal(coverage.passExportVerifierFilesCovered, true);
  assert.equal(coverage.passExportFreshnessCommandCovered, true);
});

test('Veygrit handoff bundle manifest blocks unsafe operator discovery commands', () => {
  const manifest = buildVeygritHandoffBundleManifest();
  const writeValidation = validateVeygritHandoffBundleManifest({
    ...manifest,
    operatorDiscoveryCommands: manifest.operatorDiscoveryCommands.map(command => ({
      ...command,
      writesLocalFiles: true,
    })),
  });
  const remoteMutationValidation = validateVeygritHandoffBundleManifest({
    ...manifest,
    operatorDiscoveryCommands: [
      ...manifest.operatorDiscoveryCommands,
      {
        ...manifest.operatorDiscoveryCommands[0],
        command: 'git push origin main',
        purpose: 'Unsafe fixture that must never be accepted as operator discovery.',
      },
    ],
  });

  assert.equal(writeValidation.ok, false);
  assert.ok(writeValidation.errors.includes('operator-discovery-command-writes-local-files'));
  assert.equal(remoteMutationValidation.ok, false);
  assert.ok(remoteMutationValidation.errors.includes('remote-mutation-discovery-command-present'));
  assert.doesNotMatch(JSON.stringify(remoteMutationValidation.errors), /missing-operator-discovery-command/);
});

test('Veygrit handoff bundle manifest blocks packaging and remote update claims', () => {
  const manifest = buildVeygritHandoffBundleManifest();
  const validation = validateVeygritHandoffBundleManifest(manifest);
  const publicJson = JSON.stringify(manifest);

  assert.equal(validation.ok, true);
  assert.deepEqual(validation.errors, []);
  assert.ok(manifest.blockedActions.some(action => /push commits/i.test(action)));
  assert.ok(manifest.blockedActions.some(action => /open pull requests/i.test(action)));
  assert.ok(manifest.blockedActions.some(action => /archive, zip, or publish/i.test(action)));
  assert.ok(manifest.blockedActions.some(action => /raw address material/i.test(action)));
  assert.ok(manifest.nonClaims.some(claim => /not a deployable archive/i.test(claim)));
  assert.ok(manifest.nonClaims.some(claim => /does not grant GitHub push/i.test(claim)));
  assert.doesNotMatch(publicJson, /sk_live_|ghp_[A-Za-z0-9_]+|providerTokenValue|carrierCredentialValue|privateKeyValue|proofSecretValue|siwc_bypass_bearer_token/i);
});

test('Veygrit handoff bundle manifest is wired into docs and package scripts', () => {
  const doc = readFileSync('docs/product/veygrit-handoff-bundle-manifest.md', 'utf8');
  const githubHandoffDoc = readFileSync('docs/product/veygrit-github-handoff.md', 'utf8');
  const sitesLinkDoc = readFileSync('docs/product/veygrit-sites-codex-link.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.match(doc, /Veygrit Handoff Bundle Manifest/);
  assert.match(doc, /manifest-only-no-archive-no-remote-mutation/);
  assert.match(doc, /RELEASE_UPDATE_CHECKLIST\.md/);
  assert.match(doc, /npm run verify:veygrit-handoff-bundle-manifest/);
  assert.match(doc, /npm run verify:veygrit-boundary-gate-index/);
  assert.match(doc, /npm run verify:veygrit-app-release-readiness/);
  assert.match(doc, /npm run verify:vey-id-address-wallet-pass-export-fixture-schema/);
  assert.match(doc, /scripts\/verify-vey-id-address-wallet-pass-export-fixture-schema\.ts/);
  assert.match(doc, /vey-id-address-wallet-pass-export-v0\.1\.schema\.json/);
  assert.match(doc, /sdk\/veygrit-address-login-test-helpers\/hostedCallbackValidationVectors\.ts/);
  assert.match(doc, /npm run verify:veygrit-address-login-packages/);
  assert.match(doc, /npm run verify:veygrit-sites-bridge/);
  assert.match(doc, /test-only hosted callback vector loader/);
  assert.match(doc, /coverage summary/i);
  assert.match(doc, /AGID-side file count/);
  assert.match(doc, /Optional Discovery Commands/);
  assert.match(doc, /npm run verify:veygrit-app-release-readiness:list/);
  assert.match(doc, /npm run report:veygrit-handoff-bundle-manifest/);
  assert.match(doc, /npm run check:release-readiness/);
  assert.match(doc, /npm run test:agid-handoff/);
  assert.match(doc, /npm run test:release-readiness/);
  assert.match(doc, /`--compact` only when a compact single-line JSON/);
  assert.match(doc, /does not create an archive/i);
  assert.match(githubHandoffDoc, /verify:veygrit-handoff-bundle-manifest/);
  assert.match(sitesLinkDoc, /verify:veygrit-handoff-bundle-manifest/);
  assert.match(sitesLinkDoc, /verify:veygrit-boundary-gate-index/);
  assert.equal(
    packageJson.scripts?.['verify:veygrit-handoff-bundle-manifest'],
    'tsx --test src/lib/veygritHandoffBundleManifest.test.ts',
  );
  assert.equal(
    packageJson.scripts?.['verify:veygrit-boundary-gate-index'],
    'tsx --test src/lib/veygritBoundaryGateIndex.test.ts',
  );
  assert.equal(
    packageJson.scripts?.['verify:veygrit-app-release-readiness'],
    'tsx scripts/run-veygrit-app-release-readiness.ts',
  );
  assert.equal(
    packageJson.scripts?.['verify:veygrit-app-release-readiness:list'],
    'tsx scripts/run-veygrit-app-release-readiness.ts --list-steps',
  );
  assert.equal(
    packageJson.scripts?.['report:veygrit-handoff-bundle-manifest'],
    'tsx scripts/print-veygrit-handoff-bundle-manifest.ts',
  );
});

test('Veygrit handoff bundle compact report exposes shared SDK callback evidence', () => {
  const result = spawnSync(process.execPath, [
    'node_modules/tsx/dist/cli.mjs',
    'scripts/print-veygrit-handoff-bundle-manifest.ts',
    '--compact',
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');

  const payload = JSON.parse(result.stdout);
  const paths = payload.manifest.files.map((file: { path: string }) => file.path);
  const commands = payload.manifest.freshnessCommands.map((command: { command: string }) => command.command);

  assert.equal(payload.status, 'pass');
  assert.equal(payload.reporter, 'print-veygrit-handoff-bundle-manifest');
  assert.equal(payload.archiveCreated, false);
  assert.equal(payload.remoteMutationAllowedThisTurn, false);
  assert.equal(payload.manifest.status, 'manifest-only-no-archive-no-remote-mutation');
  assert.equal(payload.coverage.agidFileCount, 17);
  assert.equal(payload.coverage.veygritAppFileCount, 8);
  assert.equal(payload.coverage.totalFreshnessCommandCount, 18);
  assert.equal(payload.coverage.remoteMutationAllowedCount, 0);
  assert.equal(payload.coverage.everyFileFreshnessCheckListed, true);
  assert.equal(payload.coverage.everyListedCommandLocalOnly, true);
  assert.equal(payload.coverage.passExportVerifierFilesCovered, true);
  assert.equal(payload.coverage.passExportFreshnessCommandCovered, true);
  assert.ok(paths.includes('sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts'));
  assert.ok(commands.includes('npm run verify:veygrit-address-login-packages'));
  assert.ok(paths.includes('scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts'));
  assert.ok(paths.includes('docs/specs/schemas/vey-id-address-wallet-pass-export-v0.1.schema.json'));
  assert.ok(commands.includes('npm run verify:vey-id-address-wallet-pass-export-fixture-schema'));
});

test('Veygrit handoff bundle docs snapshot the release-readiness discovery list', () => {
  const doc = readFileSync('docs/product/veygrit-handoff-bundle-manifest.md', 'utf8');
  const discoveryContractSection = doc.split('Current discovery output contract:')[1]?.split('## Boundary')[0] ?? '';
  const discovery = listVeygritAppReleaseReadinessSteps();

  assert.equal(discovery.mode, 'list-steps');
  assert.equal(discovery.remoteMutationAllowedThisTurn, false);
  assert.deepEqual(discovery.steps, EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_STEPS);
  assert.match(doc, /mode: `"list-steps"`/);
  assert.match(doc, /remoteMutationAllowedThisTurn: `false`/);

  for (const row of renderVeygritReleaseReadinessDiscoveryBulletRows()) {
    assert.match(doc, new RegExp(escapeRegExp(row)));
  }

  assert.doesNotMatch(discoveryContractSection, /\b(git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|sites\s+save|deploy\s+production)\b/i);
});
