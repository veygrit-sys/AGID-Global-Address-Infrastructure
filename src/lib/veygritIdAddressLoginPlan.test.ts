import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';

import {
  VEYGRIT_ID_ADDRESS_LOGIN_PLAN_VERSION,
  buildVeygritIdAddressLoginPlan,
  validateVeygritIdAddressLoginPlan,
} from './veygritIdAddressLoginPlan';
import { assertModulesDoNotImportScripts } from './veygritImportBoundary.testHelper';

type OpenApiObject = {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, unknown>;
  components: {
    schemas: Record<string, unknown>;
  };
};

type HostedAddressLoginFixtures = {
  fixtureSet: string;
  nonClaims: string[];
  privacyPosture: {
    rawAddressAccepted: boolean;
    merchantCanDecrypt: boolean;
    witnessAccepted: boolean;
    productionCredentialAccepted: boolean;
  };
  authorizeRequests: Array<Record<string, unknown> & { endpoint: string; disclosureMode: string; requestedClaims: string[] }>;
  tokenRequests: Array<Record<string, unknown> & { endpoint: string }>;
  addressLoginResults: Array<Record<string, unknown> & {
    endpoint: string;
    status: string;
    publicClaims: Record<string, unknown>;
    nextAction: string;
    privacy: HostedAddressLoginFixtures['privacyPosture'];
  }>;
  proofVerifyRequests: Array<Record<string, unknown> & { endpoint: string; requestedClaims: string[] }>;
  proofVerifyResults: Array<Record<string, unknown> & { endpoint: string; verified: boolean; status: string }>;
  carrierDecryptRequests: Array<Record<string, unknown> & { endpoint: string; purpose: string; expiresAt: string }>;
  carrierDecryptResults: Array<Record<string, unknown> & { endpoint: string; authorized: boolean; handoffReceiptRef: string }>;
  friendDeliveryRequests: Array<Record<string, unknown> & { endpoint: string }>;
  friendDeliveryRequestResults: Array<Record<string, unknown> & { endpoint: string; status: string; friendDeliveryRequestRef: string }>;
  friendDeliveryApprovals: Array<Record<string, unknown> & { endpoint: string; friendDeliveryRequestRef: string; approvalRef: string }>;
  friendDeliveryApprovalResults: Array<Record<string, unknown> & { endpoint: string; status: string; friendDeliveryRequestRef: string; approvalRef: string }>;
  consentRevocationRequests: Array<Record<string, unknown> & { endpoint: string; reason: string }>;
  consentRevocationResults: Array<Record<string, unknown> & { endpoint: string; status: string; revoked: boolean }>;
  testVectorResult: { endpoint: string; fixtureSet: string; vectors: string[] };
};

function loadHostedAddressLoginOpenApi(): OpenApiObject {
  return parse(readFileSync('docs/specs/veygrit-address-login-hosted.openapi.yaml', 'utf8')) as OpenApiObject;
}

function loadHostedAddressLoginFixtures(): HostedAddressLoginFixtures {
  return JSON.parse(readFileSync('docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json', 'utf8')) as HostedAddressLoginFixtures;
}

function runPackagePreflightReport(flag: string): string {
  const result = spawnSync(process.execPath, [
    'node_modules/tsx/dist/cli.mjs',
    'scripts/verify-veygrit-address-login-packages.ts',
    flag,
  ], {
    encoding: 'utf8',
    shell: false,
  });

  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  return result.stdout.trim();
}

function collectSchemaPropertyKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectSchemaPropertyKeys);
  const record = value as Record<string, unknown>;
  const ownKeys = record.properties && typeof record.properties === 'object'
    ? Object.keys(record.properties as Record<string, unknown>)
    : [];
  return [
    ...ownKeys,
    ...Object.values(record).flatMap(collectSchemaPropertyKeys),
  ];
}

function collectObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectObjectKeys);
  const record = value as Record<string, unknown>;
  return [
    ...Object.keys(record),
    ...Object.values(record).flatMap(collectObjectKeys),
  ];
}

test('Veygrit ID / Address Login plan validates without boundary errors', () => {
  const plan = buildVeygritIdAddressLoginPlan();

  assert.equal(plan.version, VEYGRIT_ID_ADDRESS_LOGIN_PLAN_VERSION);
  assert.equal(plan.productName, 'Veygrit ID / Address Login');
  assert.deepEqual(validateVeygritIdAddressLoginPlan(plan), []);
  assert.match(plan.thesis, /purpose-bound proof and handoff flow/);
});

test('Veygrit ID keeps OSS, commercial, and shared contract layers separated', () => {
  const plan = buildVeygritIdAddressLoginPlan();
  const layers = new Map(plan.layers.map(layer => [layer.id, layer]));

  assert.equal(layers.get('developer-platform')?.boundary, 'oss');
  assert.equal(layers.get('hosted-address-login')?.boundary, 'commercial');
  assert.equal(layers.get('identity-wallet')?.boundary, 'commercial');
  assert.equal(layers.get('consent-policy-compiler')?.boundary, 'shared-contract');
  assert.ok(plan.boundaries.oss.includes('Address Login protocol docs'));
  assert.ok(plan.boundaries.commercial.includes('hosted login'));
  assert.ok(plan.boundaries.sharedContract.includes('claim taxonomy'));
});

test('Veygrit ID and Address Login contract modules do not import script fixtures', () => {
  assertModulesDoNotImportScripts([
    'src/lib/addressLoginSpec.ts',
    'src/lib/addressLoginCoverageMap.ts',
    'src/lib/veygritIdAddressLoginPlan.ts',
    'src/lib/veygritAddressLoginCallbackContract.ts',
    'src/lib/veygritHostedAddressLoginContract.ts',
    'src/lib/veygritHostedAddressLoginMock.ts',
  ]);
});

test('Veygrit ID treats Google/Apple account creation as bootstrap, not address trust', () => {
  const plan = buildVeygritIdAddressLoginPlan();
  const social = plan.protocolDecisions.find(decision => decision.id === 'social-login-is-bootstrap-not-trust-root');

  assert.ok(social);
  assert.equal(social.default, true);
  assert.match(social.decision, /Google\/Apple only/);
  assert.ok(social.nonClaims.some(nonClaim => /not proof of residence/i.test(nonClaim)));
  assert.ok(plan.nonClaims.some(nonClaim => /Google\/Apple sign-in does not verify an address/i.test(nonClaim)));
  assert.deepEqual(plan.accountCreation.allowedProviders, ['google', 'apple']);
  assert.equal(plan.accountCreation.emailPasswordSignupEnabled, false);
  assert.equal(plan.accountCreation.passwordSignupEnabled, false);
  assert.equal(plan.accountCreation.phoneSignupEnabled, false);
  assert.equal(plan.accountCreation.merchantEmbeddableVeyId, true);
  assert.equal(plan.accountCreation.addressWalletReuseRequired, true);
  assert.ok(plan.accountCreation.merchantReceives.includes('recipient_id'));
  assert.ok(plan.accountCreation.merchantReceives.includes('walletConsentRef'));
  assert.ok(plan.accountCreation.merchantNeverReceives.includes('rawAddress'));
  assert.ok(plan.accountCreation.merchantNeverReceives.includes('savedAddressBody'));
});

test('Veygrit ID supports EC guest checkout without requiring account creation first', () => {
  const plan = buildVeygritIdAddressLoginPlan();

  assert.deepEqual(validateVeygritIdAddressLoginPlan(plan), []);
  assert.equal(plan.guestCheckout.enabled, true);
  assert.equal(plan.guestCheckout.accountRequiredBeforeCheckout, false);
  assert.equal(plan.guestCheckout.walletConsentRequired, true);
  assert.equal(plan.guestCheckout.guestSessionRefRequired, true);
  assert.deepEqual(plan.guestCheckout.optionalUpgradeProviders, ['google', 'apple']);
  assert.ok(plan.guestCheckout.allowedGuestActions.includes('start_checkout'));
  assert.ok(plan.guestCheckout.allowedGuestActions.includes('request_address_login'));
  assert.ok(plan.guestCheckout.allowedGuestActions.includes('approve_wallet_consent'));
  assert.ok(plan.guestCheckout.allowedGuestActions.includes('create_carrier_handoff'));
  assert.ok(plan.guestCheckout.blockedGuestActions.includes('save_address_without_account'));
  assert.ok(plan.guestCheckout.blockedGuestActions.includes('persist_raw_address'));
  assert.ok(plan.guestCheckout.merchantReceives.includes('guestCheckoutRef'));
  assert.ok(plan.guestCheckout.merchantReceives.includes('walletConsentRef'));
  assert.ok(plan.guestCheckout.merchantNeverReceives.includes('rawAddress'));
  assert.ok(plan.developerAdoption.dashboardSetupChecklist.includes('enable guest checkout'));
  assert.ok(plan.developerAdoption.validationGates.some(gate => /guest checkout/i.test(gate)));
  assert.ok(plan.developerAdoption.nonClaims.some(nonClaim => /Guest checkout is not silent address reuse/i.test(nonClaim)));
});

test('Veygrit ID separates Playlist Commerce from EC Social Login', () => {
  const plan = buildVeygritIdAddressLoginPlan();
  const boundary = plan.commerceBoundary;

  assert.deepEqual(validateVeygritIdAddressLoginPlan(plan), []);
  assert.equal(boundary.playlistCommerceRole, 'discover_manage_ec');
  assert.equal(boundary.ecSocialLoginRole, 'login_address_autofill_at_ec');
  assert.equal(boundary.playlistCommerceStartPoint, 'veygrit_app');
  assert.equal(boundary.ecSocialLoginStartPoint, 'merchant_ec_site');
  assert.equal(boundary.playlistCommerceRequiresLoginButtonToShop, false);
  assert.equal(boundary.ecSocialLoginRequiresContinueWithVeygrit, true);
  assert.equal(boundary.ecSocialLoginRequiresVeyIdForWalletAddressReuse, true);
  assert.deepEqual(boundary.accountCreationProviders, ['google', 'apple']);
  assert.ok(boundary.sharedRails.includes('Address Wallet'));
  assert.ok(boundary.sharedRails.includes('Delivery Gateway'));
  assert.ok(boundary.sharedRails.includes('Shopify'));
  assert.ok(boundary.nonClaims.some(nonClaim => /Playlist Commerce is not EC Social Login/i.test(nonClaim)));
  assert.ok(boundary.nonClaims.some(nonClaim => /Continue with Veygrit/i.test(nonClaim)));
  assert.ok(boundary.merchantReceives.includes('walletConsentRef'));
  assert.ok(boundary.merchantNeverReceives.includes('rawAddress'));
});

test('Veygrit ID priority use cases keep merchant outputs redacted', () => {
  const plan = buildVeygritIdAddressLoginPlan();

  assert.ok(plan.priorityUseCases.length >= 4);
  for (const useCase of plan.priorityUseCases) {
    assert.ok(useCase.requiredClaims.includes('address_credential_valid'));
    assert.doesNotMatch(useCase.merchantSees.join(' '), /raw address|phone|unit detail/i);
    assert.ok(useCase.walletKeepsPrivate.length >= 3);
  }
  assert.ok(plan.priorityUseCases.some(useCase => useCase.disclosureMode === 'carrier_decryptable'));
  assert.ok(plan.priorityUseCases.some(useCase => useCase.disclosureMode === 'proof_only'));
});

test('Veygrit ID includes Address Wallet Friend Delivery as an SSO checkout use case', () => {
  const plan = buildVeygritIdAddressLoginPlan();
  const friendDeliveryUseCase = plan.priorityUseCases.find(useCase => useCase.purpose === 'anonymous_shipping');

  assert.deepEqual(validateVeygritIdAddressLoginPlan(plan), []);
  assert.equal(plan.friendDelivery.productName, 'Address Wallet Friend Delivery');
  assert.equal(plan.friendDelivery.ssoPolicy.checkoutReauthRequiredWhenWalletSessionFresh, false);
  assert.equal(plan.friendDelivery.defaultDisclosureMode, 'carrier_decryptable_preferred');
  assert.ok(friendDeliveryUseCase);
  assert.equal(friendDeliveryUseCase.disclosureMode, 'carrier_decryptable');
  assert.ok(friendDeliveryUseCase.merchantSees.some(output => /friend delivery request/i.test(output)));
  assert.ok(friendDeliveryUseCase.walletKeepsPrivate.some(output => /recipient raw address/i.test(output)));
  assert.ok(plan.developerAdoption.documentationPages.includes('use-cases/address-wallet-friend-delivery'));
  assert.ok(plan.developerAdoption.validationGates.includes('npm run verify:address-wallet-friend-delivery'));
  assert.ok(plan.validationGates.includes('npm run verify:address-wallet-friend-delivery'));
});

test('Veygrit ID plan has a commercialization path without weakening OSS', () => {
  const plan = buildVeygritIdAddressLoginPlan();
  const segments = new Set(plan.goToMarket.map(segment => segment.segment));
  const milestones = plan.milestones.map(milestone => milestone.id);

  for (const expected of ['ec', 'marketplace', 'hotel-travel', 'carrier', 'government-pilot', 'developer-oss'] as const) {
    assert.ok(segments.has(expected), `${expected} missing`);
  }
  assert.deepEqual(milestones, [
    'm0-oss-contract',
    'm1-hosted-login-mvp',
    'm2-wallet-credential-beta',
    'm3-merchant-console-beta',
    'm4-carrier-handoff-beta',
    'm5-zk-proof-hook-beta',
    'm6-enterprise-hardening',
  ]);
  assert.ok(plan.goToMarket.every(segment => segment.blockedPromise.length > 10));
});

test('Veygrit ID can be adopted with a Clerk-like SDK experience', () => {
  const plan = buildVeygritIdAddressLoginPlan();
  const adoption = plan.developerAdoption;
  const packages = new Map(adoption.packages.map(pkg => [pkg.packageName, pkg]));

  assert.match(adoption.positioning, /guest checkout plus one address-wallet login/i);
  assert.match(adoption.primaryPromise, /guest checkout and Address Login in minutes/i);
  assert.deepEqual(adoption.integrationModes, [
    'hosted-redirect',
    'drop-in-react',
    'headless-hooks',
    'nextjs-server-helper',
    'webhook-verification',
    'local-sandbox-mock',
  ]);

  for (const packageName of [
    '@veygrit/address-login-react',
    '@veygrit/address-login-nextjs',
    '@veygrit/address-login-js',
    '@veygrit/address-login-node',
  ]) {
    const sdk = packages.get(packageName);
    assert.ok(sdk, `${packageName} missing`);
    assert.equal(sdk.boundary, 'oss');
    assert.match(sdk.installCommand, /^npm install @veygrit\/address-login-/);
    assert.ok(sdk.blockedResponsibilities.some(blocked => /raw address|carrier|secret|credential|consent/i.test(blocked)));
    assert.ok(sdk.releaseGates.length >= 3);
  }

  assert.ok(packages.get('@veygrit/address-login-react')?.primaryExports.includes('VeyIdSignInButton'));
  assert.ok(packages.get('@veygrit/address-login-react')?.primaryExports.includes('AddressLoginButton'));
  assert.ok(packages.get('@veygrit/address-login-react')?.primaryExports.includes('useAddressLogin'));
  assert.ok(packages.get('@veygrit/address-login-react')?.primaryExports.includes('useFriendDelivery'));
  assert.ok(packages.get('@veygrit/address-login-react')?.primaryExports.includes('createFriendDeliveryController'));
  assert.ok(packages.get('@veygrit/address-login-react')?.primaryExports.includes('createFriendDeliveryRequestPayload'));
  assert.ok(packages.get('@veygrit/address-login-nextjs')?.primaryExports.includes('verifyAddressLoginCallback'));
  assert.ok(packages.get('@veygrit/address-login-nextjs')?.primaryExports.includes('requestFriendDelivery'));
  assert.ok(packages.get('@veygrit/address-login-nextjs')?.releaseGates.includes('friend-delivery-server-helper-tests'));
  assert.ok(packages.get('@veygrit/address-login-node')?.primaryExports.includes('requestCarrierHandoff'));
  assert.match(packages.get('@veygrit/address-login-react')?.quickstartSnippet ?? '', /VeygritProvider/);
  assert.match(packages.get('@veygrit/address-login-react')?.quickstartSnippet ?? '', /accountProviders=\{\["google","apple"\]\}/);
  assert.match(packages.get('@veygrit/address-login-react')?.quickstartSnippet ?? '', /VeyIdSignInButton/);
  assert.match(packages.get('@veygrit/address-login-react')?.quickstartSnippet ?? '', /AddressLoginButton/);
});

test('Veygrit developer adoption preserves auth and address-trust boundaries', () => {
  const adoption = buildVeygritIdAddressLoginPlan().developerAdoption;

  assert.ok(adoption.dashboardSetupChecklist.includes('register redirect URI'));
  assert.ok(adoption.dashboardSetupChecklist.includes('enable guest checkout'));
  assert.ok(adoption.dashboardSetupChecklist.includes('run synthetic test vectors'));
  assert.ok(adoption.documentationPages.includes('use-cases/address-wallet-friend-delivery'));
  assert.ok(adoption.documentationPages.includes('concepts/address-login-vs-social-login'));
  assert.ok(adoption.documentationPages.includes('testing/synthetic-fixtures-and-local-mock'));
  assert.ok(adoption.validationGates.some(gate => /state nonce and PKCE/i.test(gate)));
  assert.ok(adoption.validationGates.some(gate => /guest checkout/i.test(gate)));
  assert.ok(adoption.validationGates.some(gate => /no raw address/i.test(gate)));
  assert.ok(adoption.validationGates.includes('npm run verify:address-wallet-friend-delivery'));
  assert.ok(adoption.nonClaims.some(nonClaim => /not a general social network/i.test(nonClaim)));
  assert.ok(adoption.nonClaims.some(nonClaim => /Google\/Apple only/i.test(nonClaim)));
  assert.ok(adoption.nonClaims.some(nonClaim => /Publishable keys do not authorize carrier decryption/i.test(nonClaim)));
});

test('Veygrit implementation traceability ties product plan to SDK package gates', () => {
  const plan = buildVeygritIdAddressLoginPlan();
  const traceability = plan.implementationTraceability;

  assert.deepEqual(validateVeygritIdAddressLoginPlan(plan), []);
  assert.equal(traceability.productPlanPath, 'docs/product/veygrit-id-address-login-plan.md');
  assert.equal(traceability.packageManifestPath, 'sdk/veygrit-address-login-packages.manifest.json');
  assert.equal(traceability.packageVerifierCommand, 'npm run verify:veygrit-address-login-packages');
  assert.equal(traceability.aggregateVerifierCommand, 'npm run verify:address-login-spec');
  assert.equal(traceability.publishReadinessClaim, 'oss-prep-local-not-production-ready');
  assert.ok(traceability.implementationPackages.includes('@veygrit/address-login-react'));
  assert.ok(traceability.implementationPackages.includes('@veygrit/address-login-nextjs'));
  assert.ok(traceability.commitCandidatePaths.includes('scripts/verify-veygrit-address-login-packages.ts'));
  assert.ok(traceability.commitCandidatePaths.includes('scripts/verify-veygrit-address-login-test-helpers.ts'));
  assert.ok(traceability.commitCandidatePaths.includes('sdk/veygrit-address-login-test-helpers/README.md'));
  assert.ok(traceability.commitCandidatePaths.includes('sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts'));
  assert.ok(traceability.commitCandidatePaths.includes('sdk/veygrit-address-login-test-helpers/merchantVisibleRedactionFixtures.ts'));
  assert.ok(traceability.commitCandidatePaths.includes('sdk/veygrit-address-login-react/README.md'));
  assert.ok(traceability.commitCandidatePaths.includes('sdk/veygrit-address-login-nextjs/README.md'));
  assert.deepEqual(traceability.githubUpdatePreflightCommands, [
    'npm run verify:veygrit-address-login-packages',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-commit-candidates',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-commit-summary',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-stage-plan',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-diff-scope',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-github-update-memo',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-final-local-check',
    'npx tsx --test src/lib/veygritIdAddressLoginPlan.test.ts',
  ]);
  assert.equal(traceability.commitCandidatePaths.includes('package.json'), false);
  assert.ok(traceability.blockedActions.some(action => /production readiness/i.test(action)));
  assert.ok(traceability.blockedActions.some(action => /package\.json/i.test(action)));
  assert.ok(traceability.blockedActions.some(action => /raw address/i.test(action)));
  assert.ok(traceability.blockedActions.some(action => /explicit current user request/i.test(action)));
});

test('Veygrit ID plan is documented as a product and technical roadmap', () => {
  const path = 'docs/product/veygrit-id-address-login-plan.md';
  assert.ok(existsSync(path));

  const doc = readFileSync(path, 'utf8');
  assert.match(doc, /Veygrit ID \/ Address Login/);
  assert.match(doc, /Google\/Apple account creation/);
  assert.match(doc, /OSS \/ Commercial Boundary/);
  assert.match(doc, /Carrier-Only Handoff/);
  assert.match(doc, /Address Wallet Friend Delivery/);
  assert.match(doc, /checkout re-login/);
  assert.match(doc, /Milestones/);
  assert.match(doc, /EC Developer Adoption/);
  assert.match(doc, /Guest Checkout/);
  assert.match(doc, /Playlist Commerce is not EC Social Login/);
  assert.match(doc, /Continue with Veygrit/);
  assert.match(doc, /guestCheckoutRef/);
  assert.match(doc, /VeyIdSignInButton/);
  assert.match(doc, /AddressLoginButton/);
  assert.match(doc, /@veygrit\/address-login-react/);
  assert.match(doc, /sdk\/veygrit-address-login-packages\.manifest\.json/);
  assert.match(doc, /npm run verify:veygrit-address-login-packages/);
  assert.match(doc, /does not claim production readiness/);
  assert.match(doc, /SDK-package traceability preflight/);
  assert.match(doc, /high-confidence secret patterns/);
  assert.match(doc, /Commit Candidate Paths/);
  assert.match(doc, /scripts\/verify-veygrit-address-login-test-helpers\.ts/);
  assert.match(doc, /src\/lib\/veygritIdAddressLoginPlan\.ts/);
  assert.match(doc, /sdk\/veygrit-address-login-test-helpers\/README\.md/);
  assert.match(doc, /sdk\/veygrit-address-login-test-helpers\/hostedCallbackValidationVectors\.ts/);
  assert.match(doc, /sdk\/veygrit-address-login-test-helpers\/merchantVisibleRedactionFixtures\.ts/);
  assert.match(doc, /shared SDK callback test helper/);
  assert.match(doc, /shared SDK test-helper README/);
  assert.match(doc, /merchant-visible redaction\s+fixture helper/);
  assert.match(doc, /npm run verify:veygrit-address-login-test-helpers/);
  assert.match(doc, /`package\.json` is intentionally excluded/);
  assert.match(doc, /The two SDK README entries are part of this traceability set/);
  assert.match(doc, /package-specific gate first/);
  assert.match(doc, /cross-package traceability preflight second/);
  assert.match(doc, /--report-commit-candidates/);
  assert.match(doc, /--report-commit-summary/);
  assert.match(doc, /--report-stage-plan/);
  assert.match(doc, /--report-diff-scope/);
  assert.match(doc, /--report-github-update-memo/);
  assert.match(doc, /--report-final-local-check/);
  assert.match(doc, /human-readable one-paragraph summary/);
  assert.match(doc, /dry-run stage plan/);
  assert.match(doc, /patch-free final scope review/);
  assert.match(doc, /final GitHub update memo/);
  assert.match(doc, /final non-mutating local check/);
  assert.match(doc, /excluded root file statuses/);
  assert.match(doc, /safe to paste into a commit or update\s+note/);
  assert.match(doc, /without\s+executing it/);
  assert.match(doc, /does not print file contents or\s+sensitive material/);
  assert.match(doc, /GitHub Update Preflight copy/);
  assert.match(doc, /npx tsx --test src\/lib\/veygritIdAddressLoginPlan\.test\.ts/);
  assert.match(doc, /It does not stage\s+files, create commits, push branches, open PRs, or create\/delete GitHub\s+repositories/);
  assert.match(doc, /require an explicit current user request/);
  assert.match(doc, /does not grant permission to mutate local Git or remote\s+GitHub state/);
  assert.match(doc, /Non-Claims/);
});

test('Veygrit package verifier emits a non-mutating final local check report', () => {
  const report = JSON.parse(runPackagePreflightReport('--report-final-local-check')) as {
    finalLocalCheck: boolean;
    nonMutating: boolean;
    requiresExplicitUserActionFor: string[];
    candidateCount: number;
    checkedByThisCommand: string[];
    stillRunBeforeManualStage: string[];
    excludedRootFiles: string[];
    excludedRootFileStatuses: Array<{ path: string; gitStatus: string; excludedFromCommitCandidates: boolean }>;
    stagePlan: {
      dryRunOnly: boolean;
      command: string;
      excludedRootFiles: string[];
      excludedRootFileStatuses: Array<{ path: string; gitStatus: string; excludedFromCommitCandidates: boolean }>;
    };
    diffScope: {
      noPatchContent: boolean;
      summary: string;
      excludedRootFileStatuses: Array<{ path: string; gitStatus: string; excludedFromCommitCandidates: boolean }>;
    };
    memo: string;
  };

  assert.equal(report.finalLocalCheck, true);
  assert.equal(report.nonMutating, true);
  assert.deepEqual(report.requiresExplicitUserActionFor, [
    'staging candidate paths',
    'creating local commits',
    'pushing branches',
    'opening PRs',
    'creating or deleting GitHub repositories',
  ]);
  assert.equal(report.candidateCount, 10);
  assert.deepEqual(report.excludedRootFiles, ['package.json']);
  assert.deepEqual(report.excludedRootFileStatuses.map(item => item.path), ['package.json']);
  assert.equal(report.excludedRootFileStatuses[0].excludedFromCommitCandidates, true);
  assert.match(report.excludedRootFileStatuses[0].gitStatus, /^(clean|M|\?\?|A|D|R|C|U|MM|AM|AD)$/);
  assert.equal(report.stagePlan.dryRunOnly, true);
  assert.match(report.stagePlan.command, /^git add -- docs\/product\/veygrit-id-address-login-plan\.md/);
  assert.deepEqual(report.stagePlan.excludedRootFiles, ['package.json']);
  assert.deepEqual(report.stagePlan.excludedRootFileStatuses, report.excludedRootFileStatuses);
  assert.equal(report.diffScope.noPatchContent, true);
  assert.match(report.diffScope.summary, /line counts only, not patch content/);
  assert.deepEqual(report.diffScope.excludedRootFileStatuses, report.excludedRootFileStatuses);
  assert.ok(report.checkedByThisCommand.some(item => /secret-pattern checks/i.test(item)));
  assert.ok(report.checkedByThisCommand.some(item => /shared SDK callback test helper/i.test(item)));
  assert.ok(report.checkedByThisCommand.some(item => /merchant-visible redaction fixture helper/i.test(item)));
  assert.deepEqual(report.stillRunBeforeManualStage, [
    'npx tsx --test src/lib/veygritIdAddressLoginPlan.test.ts',
  ]);
  assert.match(report.memo, /does not stage files, create commits, push branches, open PRs, or create\/delete GitHub repositories/);
});

test('Veygrit hosted Address Login OpenAPI exposes the MVP endpoints', () => {
  const openapi = loadHostedAddressLoginOpenApi();
  const paths = Object.keys(openapi.paths);

  assert.equal(openapi.openapi, '3.1.0');
  assert.equal(openapi.info.title, 'Veygrit ID Hosted Address Login API');
  for (const path of [
    '/capabilities',
    '/authorize',
    '/token',
    '/proof/verify',
    '/consent/revoke',
    '/carrier/decrypt-request',
    '/friend-delivery/requests',
    '/friend-delivery/approvals',
    '/test-vectors',
  ]) {
    assert.ok(paths.includes(path), `${path} missing`);
  }
});

test('Veygrit hosted Address Login OpenAPI reuses the generic AGID evidence extension', () => {
  const openapi = loadHostedAddressLoginOpenApi();
  const testVectorOperation = (openapi.paths['/test-vectors'] as {
    get?: {
      externalDocs?: { url?: string };
      'x-agid-evidence-fixtures'?: Record<string, unknown>;
    };
  }).get;
  const extension = testVectorOperation?.['x-agid-evidence-fixtures'] ?? {};
  const genericSchema = JSON.parse(readFileSync(
    'docs/specs/schemas/agid-openapi-evidence-extension-v0.1.schema.json',
    'utf8',
  )) as { properties: Record<string, { pattern?: string; const?: unknown }> };
  const fixtureSchema = JSON.parse(readFileSync(
    'docs/specs/schemas/veygrit-address-login-hosted-fixture-v0.1.schema.json',
    'utf8',
  )) as { properties: Record<string, { const?: unknown }> };

  assert.equal(testVectorOperation?.externalDocs?.url, './README.md#veygrit-id-hosted-address-login-test-vectors');
  assert.equal(genericSchema.properties.preflightFixture.pattern, '^docs/specs/fixtures/.+\\.json$');
  assert.equal(genericSchema.properties.verifierCommand.pattern, '^npm run verify:[a-z0-9:-]+$');
  assert.equal(genericSchema.properties.localOnly.const, true);
  assert.equal(fixtureSchema.properties.fixtureSet.const, 'synthetic-veygrit-address-login-hosted-v0.1');
  assert.equal(extension.preflightFixture, 'docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json');
  assert.equal(extension.historyFixture, 'docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json');
  assert.equal(extension.evidenceFixture, 'docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json');
  assert.equal(extension.evidenceSchema, 'docs/specs/schemas/veygrit-address-login-hosted-fixture-v0.1.schema.json');
  assert.equal(extension.verifierCommand, 'npm run verify:veygrit-address-login-hosted');
  assert.equal(extension.aggregateVerifierCommand, 'npm run verify:address-login-spec');
  assert.equal(extension.managedServiceBoundary, 'fixture-only-not-hosted-address-login');
  assert.equal(extension.localOnly, true);
  assert.ok((extension.forbiddenMaterial as string[]).includes('production_webhook_secret'));
  assert.ok((extension.nonClaims as string[]).includes('not-raw-address-intake'));
  assert.ok((extension.nonClaims as string[]).includes('not-proof-witness-intake'));
  assert.ok(existsSync(extension.preflightFixture as string));
  assert.ok(existsSync(extension.evidenceSchema as string));
});

test('Veygrit hosted Address Login OpenAPI encodes session binding and carrier-only handoff', () => {
  const source = readFileSync('docs/specs/veygrit-address-login-hosted.openapi.yaml', 'utf8');

  assert.match(source, /state/);
  assert.match(source, /nonce/);
  assert.match(source, /code_challenge/);
  assert.match(source, /code_challenge_method/);
  assert.match(source, /S256/);
  assert.match(source, /carrier\/decrypt-request/);
  assert.match(source, /friend-delivery\/requests/);
  assert.match(source, /friend-delivery\/approvals/);
  assert.match(source, /merchant never receives decrypt capability/i);
  assert.match(source, /encryptedForCarrierRef/);
  assert.match(source, /handoffReceiptRef/);
});

test('Veygrit hosted Address Login OpenAPI schema avoids raw/private material fields', () => {
  const openapi = loadHostedAddressLoginOpenApi();
  const keys = collectSchemaPropertyKeys(openapi.components.schemas);
  const forbidden = [
    'rawAddress',
    'addressLine1',
    'addressLine2',
    'street',
    'building',
    'room',
    'unit',
    'recipient',
    'phone',
    'email',
    'latitude',
    'longitude',
    'witness',
    'privateKey',
    'proofSecret',
    'productionCredential',
  ];

  for (const key of forbidden) {
    assert.ok(!keys.includes(key), `forbidden schema property leaked: ${key}`);
  }

  assert.ok(keys.includes('subjectAlias'));
  assert.ok(keys.includes('consentEnvelopeRef'));
  assert.ok(keys.includes('proofBundleRef'));
  assert.ok(keys.includes('encryptedForCarrierRef'));
  assert.ok(keys.includes('privacy'));
});

test('Veygrit hosted Address Login fixtures cover core hosted flows', () => {
  const fixtures = loadHostedAddressLoginFixtures();
  const disclosureModes = new Set(fixtures.authorizeRequests.map(request => request.disclosureMode));
  const endpoints = new Set([
    ...fixtures.authorizeRequests,
    ...fixtures.tokenRequests,
    ...fixtures.addressLoginResults,
    ...fixtures.proofVerifyRequests,
    ...fixtures.proofVerifyResults,
    ...fixtures.carrierDecryptRequests,
    ...fixtures.carrierDecryptResults,
    ...fixtures.friendDeliveryRequests,
    ...fixtures.friendDeliveryRequestResults,
    ...fixtures.friendDeliveryApprovals,
    ...fixtures.friendDeliveryApprovalResults,
    ...fixtures.consentRevocationRequests,
    ...fixtures.consentRevocationResults,
    fixtures.testVectorResult,
  ].map(vector => vector.endpoint));

  assert.equal(fixtures.fixtureSet, 'synthetic-veygrit-address-login-hosted-v0.1');
  assert.ok(fixtures.nonClaims.some(nonClaim => /not production data/i.test(nonClaim)));
  assert.ok(disclosureModes.has('carrier_decryptable'));
  assert.ok(disclosureModes.has('proof_only'));
  for (const endpoint of [
    'GET /authorize',
    'POST /token',
    'POST /proof/verify',
    'POST /carrier/decrypt-request',
    'POST /friend-delivery/requests',
    'POST /friend-delivery/approvals',
    'POST /consent/revoke',
    'GET /test-vectors',
  ]) {
    assert.ok(endpoints.has(endpoint), `${endpoint} fixture missing`);
  }
});

test('Veygrit hosted Address Login fixtures match OpenAPI path coverage', () => {
  const openapi = loadHostedAddressLoginOpenApi();
  const fixtures = loadHostedAddressLoginFixtures();
  const openApiPathKeys = new Set(Object.keys(openapi.paths));
  const fixturePathKeys = new Set([
    ...fixtures.authorizeRequests,
    ...fixtures.tokenRequests,
    ...fixtures.proofVerifyRequests,
    ...fixtures.carrierDecryptRequests,
    ...fixtures.friendDeliveryRequests,
    ...fixtures.friendDeliveryApprovals,
    ...fixtures.consentRevocationRequests,
    fixtures.testVectorResult,
  ].map(vector => vector.endpoint.replace(/^(GET|POST) /, '')));

  for (const path of ['/authorize', '/token', '/proof/verify', '/carrier/decrypt-request', '/friend-delivery/requests', '/friend-delivery/approvals', '/consent/revoke', '/test-vectors']) {
    assert.ok(openApiPathKeys.has(path), `${path} missing from OpenAPI`);
    assert.ok(fixturePathKeys.has(path), `${path} missing from fixtures`);
  }
});

test('Veygrit hosted Address Login fixtures stay redacted and carrier-scoped', () => {
  const fixtures = loadHostedAddressLoginFixtures();
  const keys = collectObjectKeys(fixtures);
  const forbiddenKeys = [
    'rawAddress',
    'addressLine1',
    'addressLine2',
    'street',
    'building',
    'room',
    'unit',
    'recipient',
    'phone',
    'email',
    'latitude',
    'longitude',
    'witness',
    'privateKey',
    'proofSecret',
    'productionCredential',
    'normalizedAddress',
  ];

  for (const key of forbiddenKeys) {
    assert.ok(!keys.includes(key), `forbidden fixture key leaked: ${key}`);
  }

  assert.equal(fixtures.privacyPosture.rawAddressAccepted, false);
  assert.equal(fixtures.privacyPosture.merchantCanDecrypt, false);
  assert.equal(fixtures.privacyPosture.witnessAccepted, false);
  assert.equal(fixtures.privacyPosture.productionCredentialAccepted, false);
  assert.ok(fixtures.addressLoginResults.every(result => result.privacy.merchantCanDecrypt === false));
  assert.ok(fixtures.addressLoginResults.some(result => result.nextAction === 'carrier_handoff'));
  assert.ok(fixtures.carrierDecryptRequests.every(request => request.purpose === 'shipping'));
  assert.ok(fixtures.carrierDecryptResults.every(result => result.authorized && result.handoffReceiptRef));
});
