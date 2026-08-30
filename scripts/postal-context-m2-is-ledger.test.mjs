import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { nextCountry, promotionErrors, validateLedger } from './postal-context-m2-rollout.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const json = path => JSON.parse(read(path).toString('utf8'));
const digest = path => `sha256:${createHash('sha256').update(read(path)).digest('hex')}`;

const ledger = json('docs/postal-context-m2-rollout.json');
const manifest = json('data/postal_country_packs/is/postal-context/repository-manifest.json');
const sourceReportPath = 'reports/postal-context-m2/is-source-review-2026-08-30.json';
const checksPath = 'reports/postal-context-m2/is-checks-2026-08-30.json';
const sourceReport = json(sourceReportPath);
const checks = json(checksPath);
const iceland = ledger.countries.find(country => country.countryCode === 'IS');

test('IS ledger promotion is fully evidenced and leaves IT next', () => {
  validateLedger(ledger);
  assert.equal(iceland.status, 'm2_verified');
  assert.equal(iceland.attempts, 1);
  assert.equal(iceland.blocker, null);
  assert.deepEqual(iceland.m2Definition, manifest.promotion.stages.find(stage => stage.id.startsWith('M2_')));
  assert.deepEqual(promotionErrors(iceland), []);
  assert.equal(iceland.lastAttempt.reportDigest, digest(sourceReportPath));
  assert.equal(iceland.lastAttempt.engineeringReportDigest, digest(checksPath));
  assert.equal(nextCountry(ledger, '2026-08-30T13:26:15Z').countryCode, 'IT');
});

test('IS immutable artifact links bind the artifact commit bytes', () => {
  assert.equal(sourceReport.countryM2Achieved, true);
  assert.equal(sourceReport.publishedImmutableDataArtifacts, 3);
  for (const artifact of iceland.evidence.artifacts) {
    assert.match(artifact.url, /\/blob\/2c0f6937a0b0fb0b790097d6f3a4a49fad12918a\//u);
    const path = new URL(artifact.url).pathname.split('/2c0f6937a0b0fb0b790097d6f3a4a49fad12918a/')[1];
    assert.ok(path);
    assert.equal(digest(path), artifact.digest);
    assert.equal(read(path).length, artifact.bytes);
  }
  assert.deepEqual(iceland.evidence.artifacts, sourceReport.artifacts.map(({ path: _path, ...artifact }) => artifact));
});

test('IS evidence preserves topology repairs, overlaps and authority separation', () => {
  assert.equal(sourceReport.identity.sourceFeatures, 175);
  assert.equal(sourceReport.identity.distinctPostcodes, 174);
  assert.equal(sourceReport.geometry.authoritativeFeatures, 112);
  assert.equal(sourceReport.geometry.derivedTopologyRepairFeatures, 62);
  assert.equal(sourceReport.geometry.sharedTopologyValid, true);
  assert.equal(sourceReport.geometry.sourcePreservedOverlapPairsAbove001SquareMetres, 12);
  assert.equal(sourceReport.postalPolicy.pointRoutePoBoxOrOrganizationReceivesInventedArea, false);
  assert.equal(sourceReport.postalPolicy.addressOrBuildingRowsPublished, 0);
  assert.equal(sourceReport.postalPolicy.recipientCustomerOrLandRightsRowsPublished, 0);
  assert.equal(sourceReport.runtime.realAgidLoaderVerified, true);
  assert.equal(sourceReport.runtime.realApiLookupVerified, true);
  assert.equal(sourceReport.runtime.realAppAreaVisualizationVerified, true);
  assert.equal(checks.tests.countrySuite.passed, 150);
  assert.equal(checks.tests.sharedRuntimeSuite.passed, 162);
  assert.equal(checks.tests.typecheck.passed, true);
  assert.equal(checks.tests.deterministicRebuild.passed, true);
});
