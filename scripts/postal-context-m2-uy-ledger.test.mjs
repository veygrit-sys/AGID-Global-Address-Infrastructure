import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const ledger = JSON.parse(readFileSync('docs/postal-context-m2-rollout.json', 'utf8'));
const country = ledger.countries.find(item => item.countryCode === 'UY');

test('UY ledger fixes its country-specific M2 definition and honest blocker', () => {
  assert.ok(country);
  assert.equal(country.status, 'blocked');
  assert.equal(country.attempts, 1);
  assert.equal(country.declaredStage, 'M1_metadata');
  assert.match(country.m2Definition.definition, /complete current ordinary Correo.*API\/app.*cp_id.*reserved CPA/u);
  assert.equal(country.lastAttempt.fixedOfficialAugust2023PostalAreas, 121);
  assert.equal(country.lastAttempt.completeCurrentAssignmentRecords, 0);
  assert.equal(country.lastAttempt.m2QualifiedRecords, 0);
  assert.equal(country.lastAttempt.realAppPostalAreaVisualized, false);
  assert.equal(country.blocker.requiresExplicitApproval, true);
  assert.equal(country.blocker.retryAfter, '2026-12-02T11:40:31.132Z');
  assert.match(country.blocker.reason, /August 2023.*single publication.*current 2026.*real isolated app.*deterministic Playwright/iu);
});

test('UY evidence links resolve to artifact-commit paths with matching hashes and sizes', () => {
  const evidence = country.blocker.evidence;
  assert.equal(evidence.evidenceCommit, '3b442e879324686ae6dc7aad4d72df6b9ba9b4c8');
  assert.equal(evidence.officialReleaseFeatures, 121);
  assert.equal(evidence.uniquePostalCodes, 121);
  assert.equal(evidence.uniqueOfficialCpIds, 121);
  assert.equal(evidence.sourcePositions, 251684);
  assert.equal(evidence.outputPositions, 251680);
  assert.equal(evidence.removedZeroAreaInteriorRingPositions, 4);
  assert.equal(evidence.visualInspectionCompleted, false);
  assert.equal(evidence.deterministicPixelAuditPassed, true);
  assert.equal(evidence.reservedDetailedCpaRowsPublished, 0);
  assert.equal(evidence.addressesBuildingsParcelsRecipientsCustomersPeopleOrLandRightsPublished, 0);
  for (const artifact of evidence.artifacts) {
    const marker = `/blob/${evidence.evidenceCommit}/`;
    assert.ok(artifact.url.includes(marker));
    const path = artifact.url.split(marker)[1];
    assert.equal(existsSync(path), true, path);
    const bytes = readFileSync(path);
    assert.equal(bytes.length, artifact.bytes, path);
    assert.equal(`sha256:${createHash('sha256').update(bytes).digest('hex')}`, artifact.digest, path);
  }
});

test('UY reports preserve fixed historical validity and non-promotion boundary', () => {
  const descriptor = JSON.parse(readFileSync('data/postal_country_packs/uy/postal-context/m2/descriptor.json', 'utf8'));
  const graph = JSON.parse(readFileSync('data/postal_country_packs/uy/postal-context/m2/graph.json', 'utf8'));
  const build = JSON.parse(readFileSync(country.lastAttempt.report, 'utf8'));
  const engineering = JSON.parse(readFileSync(country.lastAttempt.engineeringReport, 'utf8'));
  assert.equal(descriptor.promotionEligible, false);
  assert.deepEqual(graph.release.validTime, { from: '2023-08-01T00:00:00.000Z', to: '2023-09-01T00:00:00.000Z' });
  assert.equal(build.scope.current2026AssignmentAndSupersessionEstablished, false);
  assert.equal(build.scope.m2QualifiedCurrentRecords, 0);
  assert.equal(engineering.application.started, false);
  assert.equal(engineering.deterministicFallback.passed, true);
  assert.equal(engineering.visualInspection.completed, false);
});
