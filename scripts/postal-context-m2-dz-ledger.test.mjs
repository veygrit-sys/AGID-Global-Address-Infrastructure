import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const ledger = JSON.parse(readFileSync('docs/postal-context-m2-rollout.json', 'utf8'));
const entry = ledger.countries.find(item => item.countryCode === 'DZ');

test('DZ ledger remains blocked with a country-specific M2 definition and no fake area', () => {
  assert.equal(entry.status, 'blocked');
  assert.equal(entry.attempts, 1);
  assert.equal(entry.declaredStage, 'M1_metadata');
  assert.equal(entry.m2Definition.id, 'M2_current_algerie_poste_five_digit_assignments_and_postal_area_visualization');
  assert.equal(entry.blocker.evidence.currentPostalSystemConfirmed, true);
  assert.equal(entry.blocker.evidence.currentCompleteAssignmentDenominatorAvailable, false);
  assert.equal(entry.blocker.evidence.productionEligibleRecords, 0);
  assert.equal(entry.blocker.evidence.realDzAgidPostalApiStatus, 503);
  assert.equal(entry.blocker.evidence.realDzAgidAppAreaVisualizationVerified, false);
  assert.equal(entry.blocker.evidence.manualVisualInspection, false);
});

test('every DZ evidence link resolves to immutable committed bytes and digest', () => {
  const sha = entry.blocker.evidence.evidenceCommit;
  assert.equal(sha, 'f920b3595e4c8fb994790e69950faad3b5d52870');
  assert.equal(entry.blocker.evidence.artifacts.length, 23);
  for (const artifact of entry.blocker.evidence.artifacts) {
    const prefix = `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${sha}/`;
    assert.ok(artifact.url.startsWith(prefix));
    const path = artifact.url.slice(prefix.length);
    const bytes = execFileSync('git', ['show', `${sha}:${path}`]);
    assert.equal(bytes.length, artifact.bytes);
    assert.equal('sha256:' + createHash('sha256').update(bytes).digest('hex'), artifact.digest);
  }
});
