import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  VEYGRIT_SITES_BRIDGE_VERSION,
  buildVeygritSitesBridge,
  validateVeygritSitesBridge,
} from './veygritSitesBridge';
import { assertModulesDoNotImportScripts } from './veygritImportBoundary.testHelper';

test('Veygrit Sites bridge records the Codex thread, local site, Sites project, and GitHub account', () => {
  const bridge = buildVeygritSitesBridge();

  assert.equal(bridge.version, VEYGRIT_SITES_BRIDGE_VERSION);
  assert.equal(bridge.codexThread.id, '019f6ff7-fa0f-7610-b709-8f1b6bb42f0b');
  assert.equal(bridge.codexThread.uri, 'codex://threads/019f6ff7-fa0f-7610-b709-8f1b6bb42f0b');
  assert.match(bridge.codexThread.localRoot, /sites-plugin-sites-openai-bundled-veygrit$/);
  assert.equal(bridge.sitesProject.projectId, 'appgprj_6a5a1e0e8f188191917daebf20db70f0');
  assert.equal(bridge.sitesProject.title, 'Veygrit Address Wallet');
  assert.equal(bridge.sitesProject.accessMode, 'custom');
  assert.equal(bridge.githubConnection.authenticatedLogin, 'rei-k');
  assert.deepEqual(bridge.githubConnection.installedAccounts, ['rei-k']);
  assert.equal(bridge.githubConnection.remoteMutationAllowedThisTurn, false);
});

test('Veygrit Sites bridge keeps AGID as contract source and Sites as UI implementation target', () => {
  const bridge = buildVeygritSitesBridge();

  assert.ok(bridge.ownership.agidOwns.some(item => /no-raw-address/i.test(item)));
  assert.ok(bridge.ownership.sitesAppOwns.some(item => /user interface/i.test(item)));
  assert.ok(bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veyIdAddressWalletFoundation.ts'));
  assert.ok(bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veyIdDemoEcFlow.ts'));
  assert.ok(bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veygritSitesRefFixtures.ts' && mapping.siteTarget.endsWith('/src/veygritRefFixtures.js')));
  assert.ok(bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veygritSitesTransitionButtons.ts' && mapping.siteTarget.endsWith('/src/veygritTransitionButtons.js')));
  assert.ok(bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veygritSitesAppShell.ts' && mapping.siteTarget.endsWith('/src/main.jsx')));
  assert.ok(bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veygritSitesStoreCatalog.ts' && mapping.siteTarget.endsWith('/src/veygritStoreCatalog.js')));
  assert.ok(bridge.targetSiteSurfaces.some(surface => surface.id === 'vey-id-demo-ec-checkout' && surface.currentStatus === 'planned'));
  assert.ok(bridge.syncPlan.some(step => step.id === 'render-demo-ec-flow' && step.verifier === 'npm run verify:vey-id-demo-ec-flow'));
});

test('Veygrit Sites production contract modules do not import script fixtures', () => {
  const productionModules = [
    'src/lib/veygritSitesBridge.ts',
    'src/lib/veygritSitesAppShell.ts',
    'src/lib/veygritSitesRefFixtures.ts',
    'src/lib/veygritSitesStoreCatalog.ts',
    'src/lib/veygritSitesTransitionButtons.ts',
  ];
  assertModulesDoNotImportScripts(productionModules);
});

test('Veygrit Sites bridge validates deploy and credential boundaries', () => {
  const bridge = buildVeygritSitesBridge();
  const validation = validateVeygritSitesBridge(bridge);

  assert.equal(validation.ok, true);
  assert.deepEqual(validation.errors, []);
  assert.equal(bridge.safetyBoundaries.productionDeployRequiresExplicitApproval, true);
  assert.equal(bridge.safetyBoundaries.createRemoteRepositoryRequiresExplicitApproval, true);
  assert.equal(bridge.safetyBoundaries.pushRequiresExplicitApproval, true);
  assert.equal(bridge.safetyBoundaries.createSiteAllowed, false);
  assert.equal(bridge.safetyBoundaries.persistSitesBypassToken, false);
  assert.equal(bridge.safetyBoundaries.persistSourceRepositoryCredential, false);
  assert.equal(bridge.safetyBoundaries.rawAddressMaterialAllowedInBridge, false);
  assert.ok(bridge.syncPlan.some(step => step.id === 'agid-to-sites-ref-fixtures' && step.verifier === 'npm run verify:veygrit-sites-ref-fixtures'));
  assert.ok(bridge.syncPlan.some(step => step.id === 'redact-current-site-fixtures' && step.requiredBefore.includes('site-deploy')));
  assert.ok(bridge.syncPlan.some(step => step.id === 'redact-current-site-fixtures' && step.verifier === 'npm run verify:veygrit-sites-predeploy-redaction'));
  assert.ok(bridge.syncPlan.some(step => step.id === 'sites-store-state-test-harness' && step.requiredBefore.includes('site-deploy')));
  assert.ok(bridge.syncPlan.some(step => step.id === 'sites-presave-aggregate-gate' && step.requiredBefore.includes('site-deploy')));
  assert.ok(bridge.validationGates.includes('npm run verify:veygrit-sites-store-state'));
  assert.ok(bridge.validationGates.includes('npm run verify:veygrit-sites-presave'));
  assert.ok(bridge.validationGates.includes('npm run verify:veygrit-sites-ci-boundary'));
  assert.ok(validation.warnings.some(warning => /ref-only/i.test(warning)));
  assert.ok(validation.warnings.some(warning => /pre-save aggregate gate is local-only/i.test(warning)));
});

test('Veygrit Sites bridge docs and package gate are present', () => {
  const doc = readFileSync('docs/product/veygrit-sites-codex-link.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const bridgeJson = JSON.stringify(buildVeygritSitesBridge());

  assert.match(doc, /Veygrit Sites Codex Link/);
  assert.match(doc, /019f6ff7-fa0f-7610-b709-8f1b6bb42f0b/);
  assert.match(doc, /appgprj_6a5a1e0e8f188191917daebf20db70f0/);
  assert.match(doc, /rei-k\/Veygrit-US/);
  assert.match(doc, /npm run verify:veygrit-sites-bridge/);
  assert.match(doc, /npm run verify:veygrit-sites-app-shell/);
  assert.match(doc, /npm run verify:veygrit-sites-ref-fixtures/);
  assert.match(doc, /npm run verify:veygrit-sites-link/);
  assert.match(doc, /npm run verify:veygrit-sites-ui-smoke/);
  assert.match(doc, /npm run verify:veygrit-sites-store-state/);
  assert.match(doc, /npm run verify:veygrit-sites-presave/);
  assert.match(doc, /npm run verify:veygrit-sites-ci-boundary/);
  assert.match(doc, /npm run verify:veygrit-sites-predeploy-redaction/);
  assert.match(doc, /CI \/ GitHub Actions Note/);
  assert.match(doc, /required local pre-save check/);
  assert.match(doc, /must not push, open pull requests, save Sites/);
  assert.match(doc, /veygrit-sites-presave:\s*multi-source/);
  assert.match(doc, /VEYGRIT_SITES_PRESAVE_MULTI_SOURCE/);
  assert.match(doc, /VEYGRIT_SITES_SOURCE_ROOT/);
  assert.match(doc, /src\/veygritRefFixtures\.js/);
  assert.match(doc, /npm run sync:veygrit-sites-ref-fixtures/);
  assert.match(doc, /npm run check:veygrit-sites-ref-fixtures/);
  assert.match(doc, /npm run sync:veygrit-sites-transition-buttons/);
  assert.match(doc, /npm run check:veygrit-sites-transition-buttons/);
  assert.match(doc, /npm run sync:veygrit-sites-store-catalog/);
  assert.match(doc, /npm run check:veygrit-sites-store-catalog/);
  assert.equal(packageJson.scripts?.['sync:veygrit-sites-ref-fixtures'], 'tsx scripts/sync-veygrit-sites-ref-fixtures.ts');
  assert.equal(packageJson.scripts?.['check:veygrit-sites-ref-fixtures'], 'tsx scripts/sync-veygrit-sites-ref-fixtures.ts --check');
  assert.equal(packageJson.scripts?.['sync:veygrit-sites-transition-buttons'], 'tsx scripts/sync-veygrit-sites-transition-buttons.ts');
  assert.equal(packageJson.scripts?.['check:veygrit-sites-transition-buttons'], 'tsx scripts/sync-veygrit-sites-transition-buttons.ts --check');
  assert.equal(packageJson.scripts?.['sync:veygrit-sites-store-catalog'], 'tsx scripts/sync-veygrit-sites-store-catalog.ts');
  assert.equal(packageJson.scripts?.['check:veygrit-sites-store-catalog'], 'tsx scripts/sync-veygrit-sites-store-catalog.ts --check');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-bridge'], 'tsx --test src/lib/veygritSitesBridge.test.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-app-shell'], 'tsx --test src/lib/veygritSitesAppShell.test.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-ref-fixtures'], 'tsx --test src/lib/veygritSitesRefFixtures.test.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-store-catalog'], 'tsx --test src/lib/veygritSitesStoreCatalog.test.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-transition-buttons'], 'tsx --test src/lib/veygritSitesTransitionButtons.test.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-link'], 'tsx scripts/verify-veygrit-sites-link.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-ui-smoke'], 'tsx scripts/verify-veygrit-sites-ui-smoke.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-store-state'], 'tsx scripts/verify-veygrit-sites-store-state.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-presave'], 'tsx scripts/verify-veygrit-sites-presave.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-ci-boundary'], 'tsx scripts/run-veygrit-sites-ci-boundary.ts');
  assert.equal(packageJson.scripts?.['verify:veygrit-sites-predeploy-redaction'], 'tsx scripts/verify-veygrit-sites-predeploy-redaction.ts');
  assert.doesNotMatch(bridgeJson, /sk_live_|ghp_[A-Za-z0-9_]+|providerTokenValue|privateKeyValue|proofSecretValue/);
});
