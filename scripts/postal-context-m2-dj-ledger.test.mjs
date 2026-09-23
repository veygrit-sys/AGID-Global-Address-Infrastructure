import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const ledger = JSON.parse(readFileSync('docs/postal-context-m2-rollout.json', 'utf8'));
const entry = ledger.countries.find(item => item.countryCode === 'DJ');

test('DJ ledger remains blocked with a country-specific M2 definition and no fake area', () => {
  assert.equal(entry.status, 'blocked');
  assert.equal(entry.attempts, 1);
  assert.equal(entry.declaredStage, 'M1_metadata');
  assert.equal(entry.m2Definition.id, 'M2_current_laposte_five_digit_assignment_and_postal_area_visualization');
  assert.equal(entry.blocker.evidence.currentPostalSystemConfirmed, true);
  assert.equal(entry.blocker.evidence.currentCompleteAssignmentDenominatorAvailable, false);
  assert.equal(entry.blocker.evidence.productionEligibleRecords, 0);
  assert.equal(entry.blocker.evidence.realDjAgidPostalApiStatus, 404);
  assert.equal(entry.blocker.evidence.realDjAgidAppAreaVisualizationVerified, false);
  assert.equal(entry.blocker.evidence.manualVisualInspection, false);
});

test('every DJ evidence link resolves to immutable committed bytes and digest', () => {
  const sha = entry.blocker.evidence.evidenceCommit;
  assert.equal(sha, '39ad0f07441ba22e1f03ce034b4665c33f060274');
  assert.equal(entry.blocker.evidence.artifacts.length, 20);
  for (const artifact of entry.blocker.evidence.artifacts) {
    const prefix = `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${sha}/`;
    assert.ok(artifact.url.startsWith(prefix));
    const path = artifact.url.slice(prefix.length);
    const bytes = execFileSync('git', ['show', `${sha}:${path}`]);
    assert.equal(bytes.length, artifact.bytes);
    assert.equal('sha256:' + createHash('sha256').update(bytes).digest('hex'), artifact.digest);
  }
});
