import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { nextCountry, promotionErrors, validateLedger } from './postal-context-m2-rollout.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const json = path => JSON.parse(read(path).toString('utf8'));
const digest = path => `sha256:${createHash('sha256').update(read(path)).digest('hex')}`;

const ledger = json('docs/postal-context-m2-rollout.json');
const manifest = json('data/postal_country_packs/fi/postal-context/repository-manifest.json');
const sourceReportPath = 'reports/postal-context-m2/fi-source-review-2026-08-30.json';
const checksPath = 'reports/postal-context-m2/fi-checks-2026-08-30.json';
const sourceReport = json(sourceReportPath);
const fi = ledger.countries.find(country => country.countryCode === 'FI');

test('FI ledger promotion is fully evidenced and leaves FO next', () => {
  validateLedger(ledger);
  assert.equal(fi.status, 'm2_verified');
  assert.equal(fi.attempts, 1);
  assert.equal(fi.blocker, null);
  assert.deepEqual(fi.m2Definition, manifest.promotion.stages.find(stage => stage.id.startsWith('M2_')));
  assert.deepEqual(promotionErrors(fi), []);
  assert.equal(fi.lastAttempt.reportDigest, digest(sourceReportPath));
  assert.equal(fi.lastAttempt.engineeringReportDigest, digest(checksPath));
  assert.equal(nextCountry(ledger, '2026-08-30T05:45:45Z').countryCode, 'FO');
});

test('FI immutable artifact links bind the committed bytes', () => {
  assert.equal(sourceReport.countryM2Achieved, true);
  assert.equal(sourceReport.publishedImmutableDataArtifacts, 3);
  for (const artifact of fi.evidence.artifacts) {
    assert.match(artifact.url, /\/blob\/4c02ee0513c7ef496662ed33b0963158197b4edf\//u);
    const path = new URL(artifact.url).pathname.split('/4c02ee0513c7ef496662ed33b0963158197b4edf/')[1];
    assert.ok(path);
    assert.equal(digest(path), artifact.digest);
    assert.equal(read(path).length, artifact.bytes);
  }
  assert.deepEqual(fi.evidence.artifacts, sourceReport.artifacts.map(({ path: _path, ...artifact }) => artifact));
});

test('FI evidence preserves assignment, non-area and AX boundaries', () => {
  assert.equal(sourceReport.assignment.fiRecords, 3747);
  assert.equal(sourceReport.geometry.publishedFiFeatures, 2976);
  assert.equal(sourceReport.join.explicitNonAreaAssignments, 771);
  assert.equal(sourceReport.assignment.alandRecordsExcluded, 37);
  assert.equal(sourceReport.postalPolicy.nonAreaCodesReceiveInventedArea, false);
  assert.equal(sourceReport.postalPolicy.addressOrBuildingRowsPublished, 0);
  assert.equal(sourceReport.runtime.realAgidLoaderVerified, true);
  assert.equal(sourceReport.runtime.realApiLookupVerified, true);
  assert.equal(sourceReport.runtime.realAppAreaVisualizationVerified, true);
});
