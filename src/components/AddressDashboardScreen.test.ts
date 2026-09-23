import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'AddressDashboardScreen.tsx'), 'utf8');

test('Address Dashboard embeds Review Console for operator and administrator workflows', () => {
  assert.match(source, /buildAddressReviewConsole/);
  assert.match(source, /ADDRESS_REVIEW_CASE_CATEGORIES/);
  assert.match(source, /reviewConsole/);
  assert.match(source, /reviewCategoryFilter/);
  assert.match(source, /selectedReviewCaseId/);
  assert.match(source, /SEED_REVIEW_CASES/);
});

test('Address Dashboard provides role-based collaboration desks for multiple job functions', () => {
  assert.match(source, /professionalDesks/);
  assert.match(source, /focusProfessionalDesk/);
  assert.match(source, /professionalCollaboration/);
  assert.match(source, /reviewerDesk/);
  assert.match(source, /complianceDesk/);
  assert.match(source, /securityDesk/);
  assert.match(source, /platformDesk/);
  assert.match(source, /supportDesk/);
  assert.match(source, /fieldDesk/);
  assert.match(source, /setReviewCategoryFilter\('needs-review'\)/);
  assert.match(source, /setReviewCategoryFilter\('audit'\)/);
  assert.match(source, /setReviewCategoryFilter\('issuer'\)/);
  assert.match(source, /setReviewCategoryFilter\('address-conflict'\)/);
  assert.match(source, /setAuditSurfaceFilter\('delivery'\)/);
  assert.match(source, /setOfflineSyncSurfaceFilter\('field'\)/);
  assert.match(source, /refsAndCountsOnly/);
});

test('Address Review Console covers review, rejection, conflict, audit, terminal, and issuer states', () => {
  assert.match(source, /category: 'needs-review'/);
  assert.match(source, /category: 'rejected'/);
  assert.match(source, /category: 'address-conflict'/);
  assert.match(source, /category: 'audit'/);
  assert.match(source, /category: 'terminal'/);
  assert.match(source, /category: 'issuer'/);
  assert.match(source, /registry-revoked/);
  assert.match(source, /issuer-root-mismatch/);
  assert.match(source, /device-repeated-failures/);
  assert.match(source, /aoid-multi-registration/);
  assert.match(source, /t\('rejectedCases'\)/);
  assert.match(source, /t\('addressConflicts'\)/);
  assert.match(source, /t\('auditCases'\)/);
  assert.match(source, /t\('terminalIssues'\)/);
  assert.match(source, /t\('issuerIssues'\)/);
  assert.match(source, /t\('needsReviewQueue'\)/);
  assert.match(source, /t\('issuerRevocations'\)/);
  assert.match(source, /t\('terminalAnomalies'\)/);
});

test('Address Review Console renders selected case evidence and avoids raw private fields', () => {
  assert.match(source, /selectedReviewCase\.subjectRef/);
  assert.match(source, /selectedReviewCase\.evidenceRefs/);
  assert.match(source, /selectedReviewCase\.queueLane/);
  assert.match(source, /selectedReviewCase\.radarReasonCodes/);
  assert.match(source, /selectedReviewCase\.decision/);
  assert.match(source, /selectedReviewCase\.nextAction/);
  assert.match(source, /reviewConsole\.reviewQueues/);
  assert.match(source, /reviewConsole\.radarReasonCodeCounts/);
  assert.match(source, /reviewCommandMatrix/);
  assert.match(source, /radarReasonCodeSummary/);
  assert.doesNotMatch(source, /rawAddress\s*:/);
  assert.doesNotMatch(source, /rawAgid\s*:/);
  assert.doesNotMatch(source, /rawAoid\s*:/);
  assert.doesNotMatch(source, /proofCode\s*:/);
});

test('Address Dashboard embeds Redacted Audit Report Viewer for POS, delivery, and Portal reports', () => {
  assert.match(source, /buildRedactedAuditReportViewer/);
  assert.match(source, /REDACTED_AUDIT_REPORT_SURFACES/);
  assert.match(source, /SEED_REDACTED_AUDIT_REPORTS/);
  assert.match(source, /redactedAuditViewer/);
  assert.match(source, /auditSurfaceFilter/);
  assert.match(source, /selectedAuditReportId/);
  assert.match(source, /surface: 'pos'/);
  assert.match(source, /surface: 'delivery'/);
  assert.match(source, /surface: 'portal'/);
  assert.match(source, /t\('redactedAuditReports'\)/);
  assert.match(source, /t\('noPersonalData'\)/);
});

test('Redacted Audit Report Viewer renders public roots, refs, and redaction summary only', () => {
  assert.match(source, /selectedAuditReport\.reportRef/);
  assert.match(source, /selectedAuditReport\.subjectRef/);
  assert.match(source, /selectedAuditReport\.receiptRoot/);
  assert.match(source, /selectedAuditReport\.nullifierHash/);
  assert.match(source, /selectedAuditReport\.deviceSignatureRef/);
  assert.match(source, /selectedAuditReport\.redaction\.summary/);
});

test('Address Dashboard embeds Offline Sync Center for POS, Field, and Locker queues', () => {
  assert.match(source, /buildOfflineSyncCenter/);
  assert.match(source, /OFFLINE_SYNC_SURFACES/);
  assert.match(source, /SEED_OFFLINE_SYNC_ITEMS/);
  assert.match(source, /offlineSyncCenter/);
  assert.match(source, /offlineSyncSurfaceFilter/);
  assert.match(source, /selectedOfflineSyncItemId/);
  assert.match(source, /surface: 'pos'/);
  assert.match(source, /surface: 'field'/);
  assert.match(source, /surface: 'locker'/);
  assert.match(source, /t\('offlineSyncCenter'\)/);
  assert.match(source, /t\('usedNullifiers'\)/);
});

test('Offline Sync Center renders refs, counts, and nullifier tails without raw private fields', () => {
  assert.match(source, /selectedOfflineSyncItem\.deviceRef/);
  assert.match(source, /selectedOfflineSyncItem\.queueRef/);
  assert.match(source, /selectedOfflineSyncItem\.syncRef/);
  assert.match(source, /selectedOfflineSyncItem\.pendingCount/);
  assert.match(source, /selectedOfflineSyncItem\.conflictCount/);
  assert.match(source, /selectedOfflineSyncItem\.usedNullifierTails/);
  assert.match(source, /t\('refsAndCountsOnly'\)/);
  assert.doesNotMatch(source, /rawAddress\s*:/);
  assert.doesNotMatch(source, /rawAgid\s*:/);
  assert.doesNotMatch(source, /rawAoid\s*:/);
  assert.doesNotMatch(source, /proofCode\s*:/);
});
