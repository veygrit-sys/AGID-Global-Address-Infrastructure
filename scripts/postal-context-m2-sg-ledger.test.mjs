import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const ledger = JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json', root), 'utf8'));
const sg = ledger.countries.find(country => country.countryCode === 'SG');
const sourceReportBytes = readFileSync(new URL('reports/postal-context-m2/sg-source-review-2026-08-29.json', root));
const checksBytes = readFileSync(new URL('reports/postal-context-m2/sg-checks-2026-08-29.json', root));
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

test('Singapore remains blocked and never promotes the public preview to M2', () => {
  assert.equal(sg.status, 'blocked');
  assert.equal(sg.attempts, 1);
  assert.equal(sg.evidence, null);
  assert.equal(sg.blocker.requiresExplicitApproval, true);
  assert.equal(sg.blocker.evidence.currentAssignmentRowsValidated, 0);
  assert.equal(sg.blocker.evidence.officialPostalGeometryRecords, 0);
  assert.equal(sg.blocker.evidence.derivedPostalGeometryRecords, 0);
  assert.equal(sg.blocker.evidence.publishedImmutableDataArtifacts, 0);
  assert.equal(sg.blocker.evidence.realAgidRuntimeVerified, false);
});

test('Singapore ledger pins both source and engineering reports to exact SHA-256 digests', () => {
  assert.equal(digest(sourceReportBytes), sg.lastAttempt.reportDigest);
  assert.equal(digest(checksBytes), sg.lastAttempt.engineeringReportDigest);
  assert.equal(sg.blocker.evidence.sourceReviewDigest, sg.lastAttempt.reportDigest);
  assert.equal(sg.blocker.evidence.engineeringChecksDigest, sg.lastAttempt.engineeringReportDigest);
});
