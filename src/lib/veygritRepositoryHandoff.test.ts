import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  VEYGRIT_REPOSITORY_HANDOFF_VERSION,
  buildVeygritRepositoryHandoff,
  buildVeygritRepositoryHandoffMarkdown,
  validateVeygritRepositoryHandoff,
} from './veygritRepositoryHandoff';
import { assertModulesDoNotImportScripts } from './veygritImportBoundary.testHelper';
import { listVeygritAppReleaseReadinessSteps } from '../../scripts/run-veygrit-app-release-readiness';
import {
  EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_STEPS,
  escapeRegExp,
  renderVeygritReleaseReadinessDiscoveryTable,
  renderVeygritReleaseReadinessDiscoveryTableRows,
} from './veygritReleaseReadinessDiscoveryContract';

test('Veygrit repository handoff targets the separate UI repository without remote mutation', () => {
  const handoff = buildVeygritRepositoryHandoff();

  assert.equal(handoff.version, VEYGRIT_REPOSITORY_HANDOFF_VERSION);
  assert.equal(handoff.status, 'local-ready-no-remote-mutation');
  assert.equal(handoff.targetRepository.owner, 'rei-k');
  assert.equal(handoff.targetRepository.name, 'Veygrit-US');
  assert.equal(handoff.targetRepository.fullName, 'rei-k/Veygrit-US');
  assert.equal(handoff.targetRepository.role, 'separate-veygrit-address-wallet-ui-repository');
  assert.equal(handoff.codexTask.id, '019f6ff7-fa0f-7610-b709-8f1b6bb42f0b');
  assert.match(handoff.localRoots.sitesWorkspace, /sites-plugin-sites-openai-bundled-veygrit$/);
  assert.match(handoff.localRoots.sitesApp, /work\/veygrit-app$/);
  assert.match(handoff.handoffExport.generatedFile, /work\/veygrit-app\/AGID_HANDOFF\.md$/);
  assert.match(handoff.handoffExport.readmeFile, /work\/veygrit-app\/README\.md$/);
  assert.match(handoff.handoffExport.releaseChecklistFile, /work\/veygrit-app\/RELEASE_UPDATE_CHECKLIST\.md$/);
  assert.equal(handoff.handoffExport.syncScript, 'npm run sync:veygrit-github-handoff');
  assert.equal(handoff.handoffExport.checkScript, 'npm run check:veygrit-github-handoff');
  assert.equal(handoff.handoffExport.appCheckScript, 'npm run check:agid-handoff');
  assert.equal(handoff.handoffExport.appTestScript, 'npm run test:agid-handoff');
});

test('Veygrit repository handoff keeps AGID and Veygrit ownership separated', () => {
  const handoff = buildVeygritRepositoryHandoff();

  assert.ok(handoff.sourceOfTruth.agidOwns.some(item => /Vey ID contracts/i.test(item)));
  assert.ok(handoff.sourceOfTruth.agidOwns.some(item => /no-secret gates/i.test(item)));
  assert.ok(handoff.sourceOfTruth.veygritRepoOwns.some(item => /Address Wallet UI source/i.test(item)));
  assert.ok(handoff.sourceOfTruth.veygritRepoOwns.some(item => /local Vite app build/i.test(item)));
  assert.ok(handoff.handoffArtifacts.includes('docs/product/veygrit-sites-codex-link.md'));
  assert.ok(handoff.handoffArtifacts.includes('docs/product/veygrit-handoff-bundle-manifest.md'));
  assert.ok(handoff.handoffArtifacts.includes('docs/product/veygrit-boundary-gate-index.md'));
  assert.ok(handoff.handoffArtifacts.includes(handoff.handoffExport.generatedFile));
  assert.ok(handoff.handoffArtifacts.includes(handoff.handoffExport.readmeFile));
  assert.ok(handoff.handoffArtifacts.includes(handoff.handoffExport.releaseChecklistFile));
  assert.ok(handoff.handoffArtifacts.includes('src/lib/veygritHandoffBundleManifest.ts'));
  assert.ok(handoff.handoffArtifacts.includes('src/lib/veygritBoundaryGateIndex.ts'));
  assert.ok(handoff.handoffArtifacts.includes('src/lib/veygritBoundaryGateIndex.test.ts'));
  assert.ok(handoff.handoffArtifacts.includes('scripts/verify-veygrit-app-release-readiness.ts'));
  assert.ok(handoff.handoffArtifacts.includes('scripts/verify-veygrit-app-release-readiness.test.ts'));
  assert.ok(handoff.handoffArtifacts.includes('scripts/run-veygrit-app-release-readiness.ts'));
  assert.ok(handoff.handoffArtifacts.includes('src/lib/veygritReleaseReadinessDiscoveryContract.ts'));
  assert.ok(handoff.handoffArtifacts.includes('scripts/sync-veygrit-github-handoff.ts'));
  assert.ok(handoff.handoffArtifacts.some(path => path.endsWith('/scripts/check-agid-handoff.mjs')));
  assert.ok(handoff.handoffArtifacts.some(path => path.endsWith('/scripts/check-agid-handoff.test.mjs')));
  assert.ok(handoff.handoffArtifacts.some(path => path.endsWith('/scripts/release-readiness.mjs')));
  assert.ok(handoff.handoffArtifacts.some(path => path.endsWith('/scripts/release-readiness.test.mjs')));
  assert.ok(handoff.handoffArtifacts.some(path => path.includes('veygrit-sites-ci-boundary')));
});

test('Veygrit handoff production modules do not import script fixtures', () => {
  const productionModules = [
    'src/lib/veygritRepositoryHandoff.ts',
    'src/lib/veygritHandoffBundleManifest.ts',
    'src/lib/veygritReleaseReadinessDiscoveryContract.ts',
  ];
  assertModulesDoNotImportScripts(productionModules);

  assert.equal(
    readFileSync('scripts/veygrit-release-readiness-discovery-fixture.ts', 'utf8').trim(),
    "export * from '../src/lib/veygritReleaseReadinessDiscoveryContract';",
  );
});

test('Veygrit repository handoff blocks GitHub and Sites mutations by default', () => {
  const handoff = buildVeygritRepositoryHandoff();
  const remoteModes = handoff.githubUpdateModes.filter(mode => mode.id !== 'local-prep-only');

  assert.equal(handoff.githubUpdateModes.find(mode => mode.id === 'local-prep-only')?.allowedThisTurn, true);
  assert.ok(remoteModes.length >= 3);
  assert.ok(remoteModes.every(mode => mode.allowedThisTurn === false));
  assert.ok(remoteModes.every(mode => mode.requiredBeforeUse.some(requirement => /explicit user request/i.test(requirement))));
  assert.ok(handoff.blockedActions.some(action => /create or delete remote GitHub repositories/i.test(action)));
  assert.ok(handoff.blockedActions.some(action => /push commits/i.test(action)));
  assert.ok(handoff.blockedActions.some(action => /open pull requests/i.test(action)));
  assert.ok(handoff.blockedActions.some(action => /save a Sites version/i.test(action)));
  assert.ok(handoff.blockedActions.some(action => /deploy production/i.test(action)));
});

test('Veygrit repository handoff validates local gates, docs, and non-claims', () => {
  const handoff = buildVeygritRepositoryHandoff();
  const validation = validateVeygritRepositoryHandoff(handoff);
  const doc = readFileSync('docs/product/veygrit-github-handoff.md', 'utf8');
  const linkDoc = readFileSync('docs/product/veygrit-sites-codex-link.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const handoffJson = JSON.stringify(handoff);

  assert.equal(validation.ok, true);
  assert.deepEqual(validation.errors, []);
  assert.ok(handoff.requiredLocalGates.includes('npm run verify:veygrit-github-handoff'));
  assert.ok(handoff.requiredLocalGates.includes('npm run verify:veygrit-handoff-bundle-manifest'));
  assert.ok(handoff.requiredLocalGates.includes('npm run verify:veygrit-boundary-gate-index'));
  assert.ok(handoff.requiredLocalGates.includes('npm run verify:veygrit-app-release-readiness'));
  assert.ok(handoff.requiredLocalGates.includes('npm run check:veygrit-github-handoff'));
  assert.ok(handoff.requiredLocalGates.includes('npm run verify:veygrit-sites-ci-boundary'));
  assert.ok(handoff.requiredLocalGates.includes('npm run verify:veygrit-sites-presave'));
  assert.ok(handoff.requiredLocalGates.includes('npm run verify:preaudit-secrets'));
  assert.match(doc, /Veygrit GitHub Handoff/);
  assert.match(doc, /rei-k\/Veygrit-US/);
  assert.match(doc, /local-ready-no-remote-mutation/);
  assert.match(doc, /npm run verify:veygrit-github-handoff/);
  assert.match(doc, /npm run verify:veygrit-handoff-bundle-manifest/);
  assert.match(doc, /npm run verify:veygrit-boundary-gate-index/);
  assert.match(doc, /docs\/product\/veygrit-boundary-gate-index\.md/);
  assert.match(doc, /npm run verify:veygrit-app-release-readiness/);
  assert.match(doc, /npm run verify:veygrit-app-release-readiness:list/);
  assert.match(doc, /--list-steps/);
  assert.match(doc, /failedStep/);
  assert.match(doc, /durationMs/);
  assert.match(doc, /remoteMutationAllowedThisTurn/);
  assert.match(doc, /RELEASE_UPDATE_CHECKLIST\.md/);
  assert.match(doc, /npm run test:agid-handoff/);
  assert.match(doc, /### CWD Matrix/);
  assert.match(doc, /C:\/Users\/kitau\/\.codex\/worktrees\/4813\/AGID/);
  assert.match(doc, /C:\/Users\/kitau\/Documents\/Codex\/2026-07-17\/sites-plugin-sites-openai-bundled-veygrit\/work\/veygrit-app/);
  assert.match(doc, /AGID contracts, bundle manifest, boundary gates/);
  assert.match(doc, /App-local handoff, boundary negative fixture/);
  assert.match(doc, /npm run verify:preaudit-secrets/);
  assert.match(doc, /npm run build/);
  assert.match(doc, /Verification from the Veygrit app root:[\s\S]*npm run check:agid-handoff[\s\S]*npm run test:agid-handoff[\s\S]*npm run check:release-readiness[\s\S]*npm run test:release-readiness[\s\S]*npm run test:store-state[\s\S]*npm run build/);
  assert.match(doc, /Verification from AGID:[\s\S]*npm run verify:veygrit-github-handoff[\s\S]*npm run verify:veygrit-handoff-bundle-manifest[\s\S]*npm run verify:veygrit-app-release-readiness[\s\S]*npm run report:veygrit-handoff-bundle-manifest[\s\S]*npm run check:veygrit-github-handoff[\s\S]*npm run verify:veygrit-sites-presave[\s\S]*npm run verify:preaudit-secrets/);
  assert.match(doc, /does not grant GitHub push permission/i);
  assert.match(linkDoc, /Veygrit GitHub Handoff/);
  assert.equal(packageJson.scripts?.['verify:veygrit-github-handoff'], 'tsx --test src/lib/veygritRepositoryHandoff.test.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-boundary-gate-index'], 'tsx --test src/lib/veygritBoundaryGateIndex.test.ts');
  assert.equal(packageJson.scripts?.['sync:veygrit-github-handoff'], 'tsx scripts/sync-veygrit-github-handoff.ts');
  assert.equal(packageJson.scripts?.['check:veygrit-github-handoff'], 'tsx scripts/sync-veygrit-github-handoff.ts --check');
  assert.equal(
    packageJson.scripts?.['verify:veygrit-app-release-readiness:list'],
    'tsx scripts/run-veygrit-app-release-readiness.ts --list-steps',
  );
  assert.doesNotMatch(handoffJson, /sk_live_|ghp_[A-Za-z0-9_]+|providerTokenValue|carrierCredentialValue|privateKeyValue|proofSecretValue|siwc_bypass_bearer_token/i);
});

test('Veygrit repository handoff markdown is generated for the local app without secrets', () => {
  const handoff = buildVeygritRepositoryHandoff();
  const markdown = buildVeygritRepositoryHandoffMarkdown(handoff);

  assert.match(markdown, /# AGID Handoff for Veygrit/);
  assert.match(markdown, /Target repository candidate: `rei-k\/Veygrit-US`/);
  assert.match(markdown, /Status: `local-ready-no-remote-mutation`/);
  assert.match(markdown, /npm run check:veygrit-github-handoff/);
  assert.match(markdown, /npm run verify:veygrit-boundary-gate-index/);
  assert.match(markdown, /npm run check:agid-handoff/);
  assert.match(markdown, /npm run test:agid-handoff/);
  assert.match(markdown, /Optional Operator Discovery/);
  assert.match(markdown, /npm run verify:veygrit-app-release-readiness:list/);
  assert.match(markdown, /Current discovery gate table/);
  assert.match(markdown, /remoteMutationAllowedThisTurn: `false`/);
  for (const row of renderVeygritReleaseReadinessDiscoveryTableRows()) {
    assert.match(markdown, new RegExp(escapeRegExp(row)));
  }
  assert.match(markdown, /RELEASE_UPDATE_CHECKLIST\.md/);
  assert.match(markdown, /push commits/);
  assert.match(markdown, /open pull requests/);
  assert.match(markdown, /does not grant GitHub push permission/i);
  assert.doesNotMatch(markdown, /sk_live_|ghp_[A-Za-z0-9_]+|providerTokenValue|carrierCredentialValue|privateKeyValue|proofSecretValue|siwc_bypass_bearer_token/i);
});

test('Veygrit synced app handoff mirrors boundary gates and remote-action markers', () => {
  const handoff = buildVeygritRepositoryHandoff();
  const expected = buildVeygritRepositoryHandoffMarkdown(handoff);
  const appHandoff = readFileSync(handoff.handoffExport.generatedFile, 'utf8');

  assert.equal(appHandoff, expected);
  assert.match(appHandoff, /Generated by scripts\/sync-veygrit-github-handoff\.ts/);
  assert.match(appHandoff, /npm run verify:veygrit-boundary-gate-index/);
  assert.match(appHandoff, /npm run test:agid-handoff/);
  assert.match(appHandoff, /remoteMutationAllowedThisTurn: `false`/);
  assert.doesNotMatch(appHandoff, /sk_live_|ghp_[A-Za-z0-9_]+|providerTokenValue|carrierCredentialValue|privateKeyValue|proofSecretValue|siwc_bypass_bearer_token/i);
});

test('Veygrit GitHub handoff doc mirrors the release-readiness discovery gate table', () => {
  const doc = readFileSync('docs/product/veygrit-github-handoff.md', 'utf8');
  const discoveryTableSection = doc.split('Current discovery gate table:')[1]?.split('The normal `npm run verify:veygrit-app-release-readiness`')[0] ?? '';
  const discovery = listVeygritAppReleaseReadinessSteps();

  assert.equal(discovery.mode, 'list-steps');
  assert.equal(discovery.remoteMutationAllowedThisTurn, false);
  assert.deepEqual(discovery.steps, EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_STEPS);
  assert.match(discoveryTableSection, new RegExp(escapeRegExp(renderVeygritReleaseReadinessDiscoveryTable())));
  assert.match(discoveryTableSection, /remoteMutationAllowedThisTurn: `false`/);

  assert.doesNotMatch(discoveryTableSection, /\b(git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|sites\s+save|deploy\s+production)\b/i);
});
