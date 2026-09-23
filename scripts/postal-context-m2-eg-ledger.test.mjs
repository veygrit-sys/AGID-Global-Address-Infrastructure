import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const ledger = JSON.parse(readFileSync('docs/postal-context-m2-rollout.json', 'utf8'));
const entry = ledger.countries.find(item => item.countryCode === 'EG');

test('EG ledger remains blocked with dual-format migration, real app evidence and no fake area', () => {
  assert.equal(entry.status, 'blocked');
  assert.equal(entry.attempts, 1);
  assert.equal(entry.declaredStage, 'M1_metadata');
  assert.equal(entry.m2Definition.id, 'M2_current_egypt_post_assignments_migration_and_postal_area_visualization');
  assert.deepEqual(entry.blocker.evidence.currentPostalCodeFormats, ['99999', '9999999']);
  assert.equal(entry.blocker.evidence.currentCompleteAssignmentAndMigrationDenominatorAvailable, false);
  assert.equal(entry.blocker.evidence.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(entry.blocker.evidence.productionEligibleRecords, 0);
  assert.equal(entry.blocker.evidence.realEgAgidPostalApiStatus, 503);
  assert.equal(entry.blocker.evidence.realEgAgidAppAreaVisualizationVerified, false);
  assert.equal(entry.blocker.evidence.renderedDetailedAddressContextMoreSpecificThanPostcode, true);
  assert.equal(entry.blocker.evidence.nonPostalAgidIdPromotedToPostalId, false);
  assert.equal(entry.blocker.evidence.manualVisualInspection, false);
});

test('every EG evidence link resolves to immutable committed bytes and digest', () => {
  const sha = entry.blocker.evidence.evidenceCommit;
  assert.equal(sha, '073c74f2adebbd224752f885e7d8f2b9cbe59e2c');
  assert.equal(entry.blocker.evidence.artifacts.length, 10);
  for (const artifact of entry.blocker.evidence.artifacts) {
    const prefix = `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${sha}/`;
    assert.ok(artifact.url.startsWith(prefix));
    const path = artifact.url.slice(prefix.length);
    const bytes = execFileSync('git', ['show', `${sha}:${path}`]);
    assert.equal(bytes.length, artifact.bytes);
    assert.equal(`sha256:${createHash('sha256').update(bytes).digest('hex')}`, artifact.digest);
  }
});
