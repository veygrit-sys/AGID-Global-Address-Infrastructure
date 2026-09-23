import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildRedactedAuditReport,
  buildRedactedAuditReportViewer,
  listRedactedAuditReportViewerCapabilities,
  validateRedactedAuditReportViewerPayloadIsSafe,
} from './redactedAuditReportViewer';

test('Redacted Audit Report Viewer builds POS, delivery, and Portal reports from public refs only', () => {
  const viewer = buildRedactedAuditReportViewer({
    generatedAt: '2026-06-20T00:00:00.000Z',
    selectedReportId: 'RAR-POS-001',
    reports: [
      {
        reportId: 'RAR-POS-001',
        surface: 'pos',
        title: 'POS handoff redacted receipt',
        status: 'verified',
        decision: 'accept',
        actorRole: 'pos-staff',
        reportRef: 'audit_pos_ref_001',
        subjectRef: 'waybill_alias_001',
        evidenceRefs: ['receipt_ref_001', 'device_signature_ref_001'],
        policyRefs: ['scope:delivery:handoff'],
        receiptRoot: 'receipt_root_pos_001',
        nullifierHash: 'nullifier_hash_001',
      },
      {
        reportId: 'RAR-DELIVERY-002',
        surface: 'delivery',
        title: 'Delivery field receipt',
        status: 'needs-review',
        decision: 'review',
        actorRole: 'carrier',
        reportRef: 'audit_delivery_ref_002',
        subjectRef: 'handoff_alias_002',
        evidenceRefs: ['coarse_location_ref_002'],
        policyRefs: ['scope:recipient:verify'],
      },
      {
        reportId: 'RAR-PORTAL-003',
        surface: 'portal',
        title: 'Portal consent export',
        status: 'verified',
        decision: 'accept',
        actorRole: 'portal-user',
        reportRef: 'audit_portal_ref_003',
        subjectRef: 'address_item_ref_003',
        evidenceRefs: ['consent_event_ref_003'],
        policyRefs: ['scope:address:export'],
      },
    ],
  });

  assert.equal(viewer.reports.length, 3);
  assert.equal(viewer.totals.pos, 1);
  assert.equal(viewer.totals.delivery, 1);
  assert.equal(viewer.totals.portal, 1);
  assert.equal(viewer.selectedReport?.reportId, 'RAR-POS-001');
  assert.equal(viewer.payloadSafety.safe, true);
  assert.match(viewer.safeExport.exportId, /^RAE-/);
  assert.ok(viewer.reports.every(report => report.privacy.personalDataAccepted === false));
});

test('Redacted Audit Report rejects private material and marks report blocked', () => {
  const report = buildRedactedAuditReport({
    surface: 'pos',
    title: 'Bad report',
    reportRef: 'audit_ref_bad',
    subjectRef: 'alias_bad',
    evidenceRefs: ['receipt_ref_bad'],
    policyRefs: ['scope:delivery:handoff'],
    sourcePayload: {
      address: '1 Private Street',
      proofCode: '123456',
      phone: '+1-555-0100',
    },
  });

  assert.equal(report.accepted, false);
  assert.equal(report.status, 'blocked');
  assert.equal(report.privacy.personalDataAccepted, false);
  assert.ok(report.errors.some(error => error.includes('sourcePayload.address')));
  assert.ok(report.errors.some(error => error.includes('sourcePayload.proofCode')));
  assert.ok(report.privacy.forbiddenPaths.includes('sourcePayload.phone'));
});

test('Redacted Audit Report safe export does not include report body fields', () => {
  const viewer = buildRedactedAuditReportViewer({
    reports: [{
      surface: 'portal',
      reportRef: 'audit_portal_ref_safe',
      subjectRef: 'address_item_ref_safe',
      evidenceRefs: ['consent_event_ref_safe'],
      policyRefs: ['scope:consent:read'],
    }],
  });

  const serialized = JSON.stringify(viewer.safeExport);
  assert.equal(viewer.safeExport.reportRoots.length, 1);
  assert.doesNotMatch(serialized, /address_item_ref_safe/);
  assert.doesNotMatch(serialized, /consent_event_ref_safe/);
  assert.equal(validateRedactedAuditReportViewerPayloadIsSafe(viewer.safeExport).safe, true);
});

test('Redacted Audit Report capabilities document no-private-material posture', () => {
  const capabilities = listRedactedAuditReportViewerCapabilities();

  assert.equal(capabilities.rejectsPrivateMaterial, true);
  assert.deepEqual(capabilities.surfaces, ['pos', 'delivery', 'portal']);
  assert.ok(capabilities.safeExportFields.includes('reportRoots'));
});
