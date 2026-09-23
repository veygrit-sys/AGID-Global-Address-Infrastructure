import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evaluateAddressLaunchCenter,
  listAddressLaunchCenterChecklist,
} from './addressLaunchCenter';

const productionReadyInput = {
  environment: 'production',
  profile: 'humanitarian',
  mode: 'full',
  oauth: {
    scopesDefined: true,
    consentScreenReady: true,
    leastPrivilegeScopes: true,
    tokenRotation: true,
    duplicateConnectionPrevention: true,
  },
  webhooks: {
    configured: true,
    signatureVerification: true,
    replayProtection: true,
    retryPolicy: true,
    deadLetterQueue: true,
    idempotencyKeys: true,
  },
  registry: {
    revocationCheck: true,
    freshnessCheck: true,
    issuerTrustCheck: true,
    usedStatusCheck: true,
    freshnessAgeSeconds: 30,
    maxFreshnessAgeSeconds: 120,
  },
  storageLogging: {
    redactionEnabled: true,
    retentionPolicyDays: 30,
    auditLogEnabled: true,
    rawAddressLogs: false,
    rawAgidLogs: false,
    rawAoidLogs: false,
    proofCodeLogs: false,
  },
  duplicates: {
    aoidDuplicateCheck: true,
    nullifierRequired: true,
    domainSeparation: true,
    idempotencyKeys: true,
    regionUniquenessPolicy: true,
  },
  highRiskMode: {
    enabled: true,
    agidSOnly: true,
    shortExpiry: true,
    recipientChallenge: true,
    precisionReduction: true,
    immediateRevocation: true,
    noAddressHistoryRetention: true,
  },
  errorHandling: {
    typedErrors: true,
    safeUserMessages: true,
    retryBackoff: true,
    reviewQueue: true,
    operatorRunbook: true,
  },
  terminal: {
    staffRoles: true,
    deviceDiagnostics: true,
    offlineQueue: true,
    registrySyncVisible: true,
    printerTest: true,
  },
  security: {
    rateLimits: true,
    csrfOrOriginChecks: true,
    secretsNotCommitted: true,
    reproducibleBuild: true,
    externalAuditReady: true,
  },
  threatModel: {
    templateSelected: true,
    templateId: 'pos-terminal-handoff',
    reviewOwner: 'security-reviewer',
    misuseCasesReviewed: true,
    noRawAddressReviewed: true,
    highRiskModeReviewed: true,
    verificationCommandsMapped: true,
  },
};

test('Address Launch Center exposes Plaid-style production gates without private storage', () => {
  const checklist = listAddressLaunchCenterChecklist();

  assert.equal(checklist.supports.webhookSignatureGate, true);
  assert.equal(checklist.supports.revocationFreshnessGate, true);
  assert.equal(checklist.supports.duplicateAoidGate, true);
  assert.equal(checklist.supports.threatModelTemplateGate, true);
  assert.equal(checklist.privacy.rawAddressAccepted, false);
  assert.equal(checklist.privacy.rawAoidAccepted, false);
  assert.ok(checklist.items.some(item => item.id === 'webhook-signature-verification'));
  assert.ok(checklist.items.some(item => item.id === 'high-risk-mode'));
  assert.ok(checklist.items.some(item => item.id === 'threat-model-template-selected'));
});

test('Address Launch Center marks a complete production configuration ready', () => {
  const evaluation = evaluateAddressLaunchCenter(productionReadyInput);

  assert.equal(evaluation.accepted, true);
  assert.equal(evaluation.status, 'ready');
  assert.equal(evaluation.score, 100);
  assert.equal(evaluation.totals.blockedRequired, 0);
  assert.equal(evaluation.items.find(item => item.id === 'high-risk-mode')?.status, 'pass');
  assert.equal(evaluation.items.find(item => item.id === 'threat-model-template-selected')?.status, 'pass');
  assert.match(evaluation.launchRoot, /^[a-f0-9]{64}$/);
});

test('Address Launch Center blocks missing webhook, registry, duplicate, and high-risk controls', () => {
  const evaluation = evaluateAddressLaunchCenter({
    environment: 'production',
    profile: 'humanitarian',
    mode: 'full',
    oauth: {
      scopesDefined: true,
      consentScreenReady: true,
      leastPrivilegeScopes: true,
      tokenRotation: true,
      duplicateConnectionPrevention: true,
    },
    webhooks: {
      configured: true,
      signatureVerification: false,
      replayProtection: false,
    },
    registry: {
      revocationCheck: true,
      freshnessCheck: false,
      issuerTrustCheck: true,
      usedStatusCheck: false,
      freshnessAgeSeconds: 999,
      maxFreshnessAgeSeconds: 120,
    },
    storageLogging: {
      redactionEnabled: true,
      auditLogEnabled: true,
      rawAddressLogs: true,
    },
    duplicates: {
      aoidDuplicateCheck: false,
      nullifierRequired: true,
      domainSeparation: false,
    },
    highRiskMode: {
      enabled: true,
      agidSOnly: false,
    },
  });

  assert.equal(evaluation.status, 'blocked');
  assert.ok(evaluation.score < 100);
  assert.ok(evaluation.totals.blockedRequired >= 4);
  assert.equal(evaluation.items.find(item => item.id === 'webhook-signature-verification')?.status, 'fail');
  assert.equal(evaluation.items.find(item => item.id === 'revocation-freshness-registry')?.status, 'fail');
  assert.equal(evaluation.items.find(item => item.id === 'duplicate-aoid-prevention')?.status, 'fail');
  assert.equal(evaluation.items.find(item => item.id === 'high-risk-mode')?.status, 'fail');
  assert.ok(evaluation.nextActions.some(action => /webhook signatures/i.test(action)));
});

test('Address Launch Center blocks production launches without a recognized threat model template', () => {
  const evaluation = evaluateAddressLaunchCenter({
    ...productionReadyInput,
    threatModel: {
      templateSelected: true,
      templateId: 'unknown-template',
      reviewOwner: 'security-reviewer',
      misuseCasesReviewed: true,
      noRawAddressReviewed: true,
      highRiskModeReviewed: true,
      verificationCommandsMapped: true,
    },
  });

  const item = evaluation.items.find(check => check.id === 'threat-model-template-selected');

  assert.equal(evaluation.status, 'blocked');
  assert.equal(item?.status, 'fail');
  assert.ok(item?.missingEvidence.includes('validTemplateId'));
  assert.ok(evaluation.warnings.includes('threat-model-template-id-not-recognized'));
});

test('Address Launch Center treats local-only development as exempt from network gates', () => {
  const evaluation = evaluateAddressLaunchCenter({
    environment: 'development',
    profile: 'standard',
    mode: 'local',
    requiresHighRiskMode: false,
    storageLogging: {
      rawAddressLogs: false,
      rawAgidLogs: false,
      rawAoidLogs: false,
      proofCodeLogs: false,
    },
  });

  assert.equal(evaluation.accepted, true);
  assert.equal(evaluation.items.find(item => item.id === 'oauth-scopes-consent')?.status, 'not_applicable');
  assert.equal(evaluation.items.find(item => item.id === 'webhook-signature-verification')?.status, 'not_applicable');
  assert.equal(evaluation.items.find(item => item.id === 'revocation-freshness-registry')?.status, 'not_applicable');
  assert.ok(evaluation.warnings.includes('local-only-mode-skips-network-registry-and-webhook-gates'));
});

test('Address Launch Center rejects raw address, AOID, AGID, proof code, and secret material', () => {
  const evaluation = evaluateAddressLaunchCenter({
    ...productionReadyInput,
    rawAoid: 'AOID-PRIVATE',
    proofCode: '123456',
    apiKey: 'secret-live-key',
    address: '1-2-3 private street',
  });

  assert.equal(evaluation.accepted, false);
  assert.equal(evaluation.status, 'blocked');
  assert.ok(evaluation.errors.some(error => error.includes('rawAoid')));
  assert.ok(evaluation.errors.some(error => error.includes('proofCode')));
  assert.ok(evaluation.errors.some(error => error.includes('apiKey')));
  assert.ok(evaluation.errors.some(error => error.includes('address')));
  assert.equal(evaluation.privacy.rawAddressAccepted, false);
});
