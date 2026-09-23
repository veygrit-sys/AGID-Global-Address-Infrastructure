import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  assessGovernancePosture,
  buildGovernanceAuditLog,
  buildGovernanceComplianceReport,
  classifyGovernanceDataAsset,
} from './governance';

const generatedAt = '2026-06-18T09:00:00.000Z';

test('strong posture keeps AGID/AOID governance low risk with redacted audit evidence', () => {
  const assessment = assessGovernancePosture({
    generatedAt,
    assets: [
      {
        assetId: 'address-intent-ledger',
        label: 'Address Intent ledger',
        dataClasses: ['address', 'credential'],
        systems: ['registry-api', 'pos-terminal'],
        purposes: ['delivery', 'identity'],
        owner: 'privacy-ops',
        encryptedAtRest: true,
        encryptedInTransit: true,
        retentionDays: 365,
        legalBasis: 'contract',
        consentRequired: true,
        consentAvailable: true,
        deleteSupported: true,
        exportSupported: true,
        accessControl: 'mfa-rbac',
      },
    ],
    auditEvents: [
      {
        eventId: 'evt-1',
        eventType: 'policy-change',
        actorId: 'privacy-admin',
        actorRole: 'privacy-officer',
        resourceId: 'address-intent-ledger',
        timestamp: '2026-06-18T08:30:00.000Z',
        safeSummary: 'Retention policy reviewed.',
        signed: true,
      },
      {
        eventId: 'evt-2',
        eventType: 'data-change',
        actorId: 'registry-service',
        actorRole: 'service',
        resourceId: 'address-intent-ledger',
        timestamp: '2026-06-18T08:35:00.000Z',
        safeSummary: 'Credential commitment updated.',
        signed: true,
      },
    ],
    policies: [
      {
        policyId: 'policy-address-governance',
        frameworks: ['GDPR', 'CCPA', 'SOC-2', 'ISO-27001'],
        dataClasses: ['address', 'credential'],
        requiredControls: ['encryption', 'mfa-rbac', 'commitment-only-logs'],
        retentionDays: 365,
      },
    ],
  });

  assert.equal(assessment.riskLevel, 'low');
  assert.equal(assessment.score, 100);
  assert.equal(assessment.auditLog.accepted, true);
  assert.equal(assessment.auditLog.records[1].previousHash, assessment.auditLog.records[0].eventHash);
  assert.equal(assessment.privacy.rawPersonalDataStored, false);
  assert.ok(assessment.reports.dpiaRequired);
  assert.equal(assessment.frameworkCoverage.find(item => item.framework === 'GDPR')?.status, 'covered');
  assert.equal(assessment.frameworkCoverage.find(item => item.framework === 'HIPAA')?.status, 'not-applicable');
});

test('raw audit payloads are rejected and converted to commitment-only audit records', () => {
  const log = buildGovernanceAuditLog([
    {
      eventId: 'unsafe-event',
      eventType: 'user-access',
      actorId: 'operator',
      resourceId: 'AOID-PRIVATE-123',
      rawPayload: {
        phone: '+81-90-1234-5678',
        address: 'private address',
      },
      ipAddress: '192.0.2.10',
      signed: true,
    },
  ], generatedAt);

  assert.equal(log.accepted, false);
  assert.ok(log.errors.some(error => /raw-payload-rejected/u.test(error)));
  assert.ok(log.records[0].warnings.includes('raw-audit-payload-rejected'));
  assert.equal(log.privacy.rawAuditPayloadStored, false);
  assert.match(log.records[0].metadataCommitment, /^audit-metadata:/u);
});

test('personal address data without privacy controls triggers GDPR and CCPA actions', () => {
  const assessment = assessGovernancePosture({
    generatedAt,
    assets: [
      {
        assetId: 'customer-address-table',
        dataClasses: ['personal', 'address'],
        purposes: ['delivery'],
        encryptedAtRest: false,
        encryptedInTransit: false,
        retentionDays: 2200,
        legalBasis: 'unknown',
        consentRequired: true,
        consentAvailable: false,
        deleteSupported: false,
        exportSupported: false,
        accessControl: 'none',
      },
    ],
    auditEvents: [],
  });

  const findingIds = assessment.findings.map(finding => finding.id);
  assert.equal(assessment.riskLevel, 'critical');
  assert.ok(findingIds.includes('personal-data-encryption-at-rest-missing'));
  assert.ok(findingIds.includes('privacy-legal-basis-missing'));
  assert.ok(findingIds.includes('consent-required-but-unavailable'));
  assert.ok(findingIds.includes('data-subject-deletion-path-missing'));
  assert.equal(assessment.frameworkCoverage.find(item => item.framework === 'CCPA')?.status, 'missing');
});

test('payment and health assets are checked against PCI and HIPAA-oriented safeguards', () => {
  const assessment = assessGovernancePosture({
    generatedAt,
    assets: [
      {
        assetId: 'payment-token-cache',
        dataClasses: ['payment'],
        purposes: ['payment'],
        encryptedAtRest: false,
        encryptedInTransit: true,
        accessControl: 'none',
        legalBasis: 'contract',
        consentAvailable: true,
        deleteSupported: true,
        exportSupported: true,
      },
      {
        assetId: 'aid-health-note',
        dataClasses: ['health', 'sensitive-personal'],
        purposes: ['healthcare'],
        encryptedAtRest: true,
        encryptedInTransit: false,
        accessControl: 'none',
        legalBasis: 'vital-interests',
        consentAvailable: true,
        deleteSupported: true,
        exportSupported: true,
      },
    ],
    auditEvents: [
      {
        eventType: 'security-event',
        actorId: 'security-service',
        resourceId: 'regulated-data',
        signed: true,
      },
    ],
  });

  const findingIds = assessment.findings.map(finding => finding.id);
  assert.equal(assessment.riskLevel, 'critical');
  assert.ok(findingIds.includes('payment-data-pci-controls-missing'));
  assert.ok(findingIds.includes('health-data-hipaa-safeguards-missing'));
  assert.equal(assessment.frameworkCoverage.find(item => item.framework === 'PCI-DSS')?.status, 'missing');
  assert.equal(assessment.frameworkCoverage.find(item => item.framework === 'HIPAA')?.status, 'missing');
});

test('DSR queues and personal-data incidents feed reports and required actions', () => {
  const assessment = assessGovernancePosture({
    generatedAt,
    assets: [
      {
        assetId: 'address-portal-items',
        dataClasses: ['personal', 'credential'],
        purposes: ['identity'],
        encryptedAtRest: true,
        encryptedInTransit: true,
        legalBasis: 'consent',
        consentAvailable: true,
        deleteSupported: true,
        exportSupported: true,
        accessControl: 'rbac',
      },
    ],
    auditEvents: [
      {
        eventType: 'dsr-request',
        actorId: 'privacy-service',
        resourceId: 'address-portal-items',
        signed: true,
      },
    ],
    dsrRequests: [
      {
        requestId: 'dsr-delete-1',
        type: 'delete',
        subjectAlias: 'subject-a',
        receivedAt: '2026-05-01T00:00:00.000Z',
        dueAt: '2026-05-31T00:00:00.000Z',
        identityVerified: true,
        status: 'processing',
      },
    ],
    incidents: [
      {
        incidentId: 'incident-1',
        detectedAt: '2026-06-17T12:00:00.000Z',
        severity: 'high',
        containsPersonalData: true,
        correctiveActions: ['rotated signing keys'],
      },
    ],
  });
  const report = buildGovernanceComplianceReport(assessment);

  assert.equal(assessment.reports.dsrQueueOpen, 1);
  assert.equal(assessment.reports.breachNotificationReviewRequired, true);
  assert.ok(assessment.findings.some(finding => finding.id === 'dsr-deadline-expired'));
  assert.ok(report.sections.includes('breach-notification-review'));
  assert.equal(report.metrics.openDsrRequestCount, 1);
  assert.match(report.reportId, /^gov_report_/u);
});

test('data asset classification normalizes unknown inputs conservatively', () => {
  const asset = classifyGovernanceDataAsset({
    assetId: 'AGID-SENSITIVE-123',
    dataClasses: ['unknown', 'secret'],
    purposes: ['not-a-purpose'],
    accessControl: 'mfa-rbac',
  });

  assert.match(asset.assetId, /^asset_/u);
  assert.deepEqual(asset.dataClasses, ['secret']);
  assert.deepEqual(asset.purposes, ['audit']);
  assert.equal(asset.accessControl, 'mfa-rbac');
});
