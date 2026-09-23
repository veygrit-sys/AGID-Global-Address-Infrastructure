import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAddressDashboardConsole,
  buildAddressReviewConsole,
  buildAddressDashboardSafeExport,
  buildAddressDashboardSnapshot,
  buildAddressDisputeCase,
  buildAddressIdentityVerification,
  buildAddressTaxCustomsContext,
  buildAddressWebhookEvent,
  listAddressOperationsCapabilities,
  validateAddressDashboardPayloadIsSafe,
} from './addressOperations';

test('Address Identity verifies ownership, residence, and delivery eligibility from public refs', () => {
  const verification = buildAddressIdentityVerification({
    methods: ['aoid-credential', 'passkey', 'issuer-credential'],
    claims: ['address-ownership', 'residence', 'delivery-eligibility'],
    credentialRefs: ['credref_aoid_delivery'],
    issuerCredentialRefs: ['issuercred_residence'],
    aoidCommitment: 'commit_aoid_public_123',
    passkeyChallengeHash: 'challenge_hash_public_123',
    issuerTrustRoot: 'issuer_root_2026_06',
    revocationRoot: 'revocation_root_2026_06',
    freshnessRoot: 'freshness_root_2026_06',
  });

  assert.equal(verification.accepted, true);
  assert.equal(verification.verified, true);
  assert.equal(verification.status, 'verified');
  assert.equal(verification.privacy.rawAoidAccepted, false);
  assert.match(verification.identityRoot, /^[0-9a-f]{64}$/);
});

test('Address Identity rejects raw AOID and proof code material', () => {
  const verification = buildAddressIdentityVerification({
    methods: ['aoid-credential'],
    claims: ['address-ownership'],
    aoid: 'AOID-PRIVATE-NOT-ALLOWED',
    proofCode: '123456',
  } as any);

  assert.equal(verification.accepted, false);
  assert.equal(verification.verified, false);
  assert.equal(verification.status, 'rejected');
  assert.ok(verification.errors.some(error => error.includes('aoid')));
  assert.ok(verification.errors.some(error => error.includes('proofCode')));
});

test('Address Webhooks queue public events for Address Intent and QR usage', () => {
  const verified = buildAddressWebhookEvent({
    topic: 'address_intent.verified',
    endpointId: 'webhook-pos-ops',
    payloadFingerprint: 'f'.repeat(32),
  });
  const qrUsed = buildAddressWebhookEvent({
    topic: 'qr.used',
    endpointId: 'webhook-pos-ops',
    payload: {
      waybillAlias: 'wb_alias_123',
      receiptRef: 'receipt_ref_456',
    },
  });

  assert.equal(verified.accepted, true);
  assert.equal(verified.status, 'queued');
  assert.equal(verified.topic, 'address_intent.verified');
  assert.equal(qrUsed.accepted, true);
  assert.equal(qrUsed.topic, 'qr.used');
  assert.match(qrUsed.payloadFingerprint ?? '', /^[0-9a-f]{32}$/);
});

test('Address Disputes create review cases without personal address fields', () => {
  const dispute = buildAddressDisputeCase({
    type: 'pid-merge-split',
    reporterRole: 'auditor',
    evidenceRefs: ['audit_report_ref_1'],
    relatedPidCommitment: 'pid_commitment_123',
    pidMergeSplitTraceRef: 'pid_lineage_trace_456',
  });

  assert.equal(dispute.accepted, true);
  assert.equal(dispute.status, 'needs-review');
  assert.equal(dispute.type, 'pid-merge-split');
  assert.equal(dispute.relatedRefs.pidCommitment, 'pid_commitment_123');
  assert.equal(dispute.privacy.rawAddressAccepted, false);
});

test('Address Tax / Customs layer uses fully-free local-first auxiliary policy', () => {
  const context = buildAddressTaxCustomsContext({
    originCountry: 'JP',
    destinationCountry: 'DE',
    hsCode: '610910',
    declaredValue: 12000,
    currency: 'JPY',
    riskFlags: ['high-value'],
    hasPostalCode: true,
    hasAgid: true,
    hasAoidCredential: true,
    mode: 'mode-1-server-registry',
  });

  assert.equal(context.accepted, true);
  assert.notEqual(context.status, 'rejected');
  assert.equal(context.dashboardSignals.section, 'tax-customs');
  assert.equal(context.dashboardSignals.dataPolicy, 'fully-free-local-first');
  assert.equal(context.decision?.dataPolicy, 'fully-free-local-first');
  assert.ok(context.decision?.excludedSourceIds.includes('gs1-verified-by-gs1'));
});

test('Address Dashboard snapshot aggregates operations and rejects private payloads', () => {
  const snapshot = buildAddressDashboardSnapshot({
    logs: { total: 120, lastEventAt: '2026-06-17T01:00:00.000Z' },
    linkEvents: { sessions: 24, attention: 1 },
    audit: { open: 2 },
    apiKeys: { active: 4 },
    terminals: { active: 3, blocked: 1, offlineQueued: 2 },
    issuers: { active: 7, revoked: 1 },
    webhooks: { active: 5, failed: 1, signatureFailures: 1 },
    reviewQueue: { pending: 6 },
    disputes: { open: 2 },
    qrUsage: { used: 9, reused: 1, expired: 1, lastEventAt: '2026-06-17T02:00:00.000Z' },
    taxCustoms: { reviewRequired: 3 },
  });
  const rejected = buildAddressDashboardSnapshot({
    logs: { total: 1 },
    rawAddress: 'private address must not be accepted',
  } as any);

  assert.equal(snapshot.accepted, true);
  assert.equal(snapshot.overallStatus, 'blocked');
  assert.equal(snapshot.totals.reviewItems, 8);
  assert.equal(snapshot.totals.qrUsed, 9);
  assert.equal(snapshot.totals.webhookFailures, 2);
  assert.equal(snapshot.summary.linkEvents, 24);
  assert.equal(snapshot.summary.qrUsed, 9);
  assert.equal(snapshot.lastEventAt, '2026-06-17T02:00:00.000Z');
  assert.ok(snapshot.sections.some(section => section.id === 'review-queue' && section.status === 'attention'));
  assert.ok(snapshot.sections.some(section => section.id === 'link-events' && section.status === 'attention'));
  assert.ok(snapshot.sections.some(section => section.id === 'qr-usage' && section.status === 'blocked'));
  assert.ok(snapshot.attentionFeed.some(item => item.section === 'webhooks' && item.nextAction === 'fix-webhook-signature-or-dead-letter'));
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.privacy.publicApiStoresPersonalData, false);
});

test('Address Dashboard console filters sections and creates an operator runbook', () => {
  const consoleView = buildAddressDashboardConsole({
    query: 'issuer',
    statusFilter: 'blocked',
    selectedSection: 'issuers',
    logs: { total: 120 },
    issuers: { active: 7, revoked: 1, lastEventAt: '2026-06-17T00:40:00.000Z' },
    webhooks: { active: 5, failed: 1 },
  });

  assert.equal(consoleView.snapshot.overallStatus, 'blocked');
  assert.equal(consoleView.filters.query, 'issuer');
  assert.equal(consoleView.filters.statusFilter, 'blocked');
  assert.deepEqual(consoleView.filteredSections.map(section => section.id), ['issuers']);
  assert.equal(consoleView.selectedSection?.id, 'issuers');
  assert.equal(consoleView.runbook?.owner, 'compliance');
  assert.match(consoleView.runbook?.primaryAction ?? '', /issuer/i);
  assert.ok(consoleView.runbook?.evidenceRefs.every(ref => ref.startsWith('EV-')));
});

test('Address Review Console tracks review, rejected, conflict, audit, terminal, and issuer cases safely', () => {
  const review = buildAddressReviewConsole({
    categoryFilter: 'address-conflict',
    selectedCaseId: 'ARC-CONFLICT-1',
    cases: [
      {
        caseId: 'ARC-REVIEW-1',
        category: 'needs-review',
        subjectRef: 'intent_ref_partial',
        evidenceRefs: ['EV-quality'],
      },
      {
        caseId: 'ARC-REJECT-1',
        category: 'rejected',
        subjectRef: 'qr_alias_reused',
        evidenceRefs: ['EV-qr-used'],
      },
      {
        caseId: 'ARC-CONFLICT-1',
        category: 'address-conflict',
        subjectRef: 'pid_commitment_conflict',
        evidenceRefs: ['EV-lineage', 'EV-issuer'],
        radarReasonCodes: ['aoid-multi-registration', 'aoid-nullifier-reuse'],
      },
      {
        caseId: 'ARC-AUDIT-1',
        category: 'audit',
        subjectRef: 'receipt_ref_audit',
        evidenceRefs: ['EV-receipt-root'],
        radarReasonCodes: ['offline-conflict'],
      },
      {
        caseId: 'ARC-TERM-1',
        category: 'terminal',
        subjectRef: 'terminal_ref_7',
        evidenceRefs: ['EV-terminal-health'],
        radarReasonCodes: ['device-repeated-failures'],
      },
      {
        caseId: 'ARC-ISSUER-1',
        category: 'issuer',
        subjectRef: 'issuer_ref_2',
        evidenceRefs: ['EV-issuer-root'],
        radarReasonCodes: ['registry-revoked', 'issuer-root-mismatch'],
      },
    ],
  });

  assert.equal(review.accepted, true);
  assert.equal(review.totals.needsReview, 1);
  assert.equal(review.totals.rejected, 1);
  assert.equal(review.totals.addressConflicts, 1);
  assert.equal(review.totals.auditItems, 1);
  assert.equal(review.totals.terminalIssues, 1);
  assert.equal(review.totals.issuerIssues, 1);
  assert.equal(review.totals.issuerRevocations, 1);
  assert.equal(review.totals.terminalAnomalies, 1);
  assert.equal(review.totals.radarReasonCodes, 8);
  assert.deepEqual(review.filteredCases.map(item => item.caseId), ['ARC-CONFLICT-1']);
  assert.equal(review.selectedCase?.nextAction, 'compare-lineage-issuer-and-handoff-evidence');
  assert.equal(review.selectedCase?.queueLane, 'address-conflict-queue');
  assert.ok(review.selectedCase?.radarReasonCodes.includes('aoid-multi-registration'));
  assert.ok(review.reviewQueues.some(queue => queue.lane === 'issuer-revocation-queue' && queue.count === 1));
  assert.ok(review.reviewQueues.some(queue => queue.lane === 'terminal-anomaly-queue' && queue.count === 1));
  assert.ok(review.radarReasonCodeCounts.some(item => item.code === 'registry-revoked' && item.count === 1));
  assert.equal(review.safeExport.cases.length, 6);
  assert.ok(review.safeExport.cases.some(item => item.queueLane === 'address-conflict-queue'));
  assert.ok(review.safeExport.radarReasonCodeCounts.some(item => item.code === 'issuer-root-mismatch'));
  assert.equal(review.payloadSafety.safe, true);
  assert.equal(review.privacy.rawAddressAccepted, false);
});

test('Address Review Console rejects raw private material in review cases', () => {
  const review = buildAddressReviewConsole({
    cases: [
      {
        category: 'needs-review',
        subjectRef: 'safe_ref',
        evidenceRefs: ['EV-safe'],
        rawAddress: 'private address must not enter review console',
      },
    ],
  } as any);

  assert.equal(review.accepted, false);
  assert.equal(review.cases[0].status, 'rejected');
  assert.ok(review.cases[0].errors.some(error => error.includes('rawAddress')));
  assert.equal(JSON.stringify(review.safeExport).includes('private address'), false);
});

test('Address Dashboard safe export never includes raw private address material', () => {
  const snapshot = buildAddressDashboardSnapshot({
    generatedAt: '2026-06-17T02:00:00.000Z',
    logs: { total: 120 },
    terminals: { active: 3, offlineQueued: 2 },
    qrUsage: { used: 9, reused: 1 },
  });
  const safeExport = buildAddressDashboardSafeExport(snapshot, 'ADE-test');
  const serialized = JSON.stringify(safeExport);

  assert.equal(safeExport.exportId, 'ADE-test');
  assert.match(safeExport.dashboardRoot, /^[0-9a-f]{64}$/);
  assert.equal(validateAddressDashboardPayloadIsSafe(safeExport).safe, true);
  assert.doesNotMatch(serialized, /rawAddress["']/i);
  assert.doesNotMatch(serialized, /rawAgid["']/i);
  assert.doesNotMatch(serialized, /rawAoid["']/i);
  assert.doesNotMatch(serialized, /proofCode["']/i);
});

test('Address Dashboard payload safety catches raw private fields before export', () => {
  const safety = validateAddressDashboardPayloadIsSafe({
    dashboardRoot: 'ok',
    nested: {
      rawAddress: 'private address',
      proofCode: '123456',
    },
  });

  assert.equal(safety.safe, false);
  assert.ok(safety.forbiddenPaths.includes('nested.rawAddress'));
  assert.ok(safety.forbiddenPaths.includes('nested.proofCode'));
});

test('Address Operations capabilities expose Stripe-style operational surfaces', () => {
  const capabilities = listAddressOperationsCapabilities();

  assert.ok(capabilities.identityMethods.includes('passkey'));
  assert.ok(capabilities.identityClaims.includes('delivery-eligibility'));
  assert.ok(capabilities.webhookTopics.includes('handoff.completed'));
  assert.ok(capabilities.webhookTopics.includes('qr.used'));
  assert.ok(capabilities.disputeTypes.includes('same-address-claim'));
  assert.ok(capabilities.dashboardSections.includes('api-keys'));
  assert.ok(capabilities.dashboardSections.includes('link-events'));
  assert.ok(capabilities.dashboardSections.includes('qr-usage'));
  assert.ok(capabilities.reviewCaseCategories.includes('address-conflict'));
  assert.ok(capabilities.reviewCaseCategories.includes('issuer'));
  assert.ok(capabilities.reviewQueueLanes.includes('needs-review-queue'));
  assert.ok(capabilities.reviewQueueLanes.includes('issuer-revocation-queue'));
  assert.ok(capabilities.reviewQueueLanes.includes('terminal-anomaly-queue'));
  assert.equal(capabilities.supports.dashboardConsole, true);
  assert.equal(capabilities.supports.dashboardSafeExport, true);
  assert.equal(capabilities.supports.reviewConsole, true);
  assert.equal(capabilities.supports.reviewConsoleSafeExport, true);
  assert.equal(capabilities.privacy.publicApiStoresPersonalData, false);
});
